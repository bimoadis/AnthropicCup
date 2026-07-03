import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Connection, PublicKey, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, createTransferInstruction, getMint } from "@solana/spl-token";
import bs58 from "bs58";

function normalizeTeamName(name: string) {
  const mapping: Record<string, string> = {
    "United States": "USA",
    "South Korea": "Korea Republic"
  };
  return mapping[name] || name;
}

function makeSlug(home: string, away: string, kickoff_time: string) {
  const h = home.toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 8);
  const a = away.toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 8);
  const date = kickoff_time ? kickoff_time.split("T")[0] : "tbd";
  return `${h}-${a}-${date}`;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const cronSecret = process.env.CRON_SECRET;

// Solana config
const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const tokenMint = process.env.NEXT_PUBLIC_TOKEN_MINT;
const minBalance = parseFloat(process.env.NEXT_PUBLIC_MIN_ANTHROPOS || "1000");
const adminKeypairSecret = process.env.ADMIN_WALLET_KEYPAIR;

// Reward values
const REWARD_EXACT_SCORE = 1000; // $ANTHROPOS amount for exact score
const REWARD_CORRECT_WINNER = 1000; // $ANTHROPOS amount for correct winner only

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  })
  : null;

// Parse the admin keypair safely
function getAdminKeypair(): Keypair | null {
  if (!adminKeypairSecret) return null;
  try {
    const trimmed = adminKeypairSecret.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      const arr = JSON.parse(trimmed);
      return Keypair.fromSecretKey(new Uint8Array(arr));
    } else {
      return Keypair.fromSecretKey(bs58.decode(trimmed));
    }
  } catch (err) {
    console.error("Failed to parse admin keypair secret:", err);
    return null;
  }
}

// Check Solana token balance
async function checkTokenBalance(wallet: string): Promise<number> {
  if (!tokenMint) return minBalance; // If no mint, assume they have it (pass balance check)
  try {
    const connection = new Connection(rpcUrl, "confirmed");
    const owner = new PublicKey(wallet);
    const mint = new PublicKey(tokenMint);

    const response = await connection.getParsedTokenAccountsByOwner(owner, {
      mint: mint
    });

    let balance = 0;
    for (const account of response.value) {
      const amount = account.account.data.parsed.info.tokenAmount.uiAmount;
      if (amount) {
        balance += amount;
      }
    }
    return balance;
  } catch (err) {
    console.error(`Error checking balance for ${wallet}:`, err);
    return 0; // Fail-safe: if RPC fails, return 0
  }
}

// Perform token transfer (Airdrop) on Solana
async function sendTokens(recipientWallet: string, amount: number): Promise<string> {
  const adminKeypair = getAdminKeypair();
  if (!adminKeypair || !tokenMint) {
    // Return a mock transaction signature if not fully configured
    const mockSig = `mock_tx_sig_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    console.log(`[MOCK AIRDROP] Transferred ${amount} tokens to ${recipientWallet}. Tx: ${mockSig}`);
    return mockSig;
  }

  // Real on-chain transaction for SPL Token
  const connection = new Connection(rpcUrl, "confirmed");
  const mintPublicKey = new PublicKey(tokenMint);
  const recipientPublicKey = new PublicKey(recipientWallet);

  // Get mint info to dynamically fetch decimals
  const mintInfo = await getMint(connection, mintPublicKey);
  const decimals = mintInfo.decimals;

  // Convert UI amount to raw token amount (BigInt for precision)
  const rawAmount = BigInt(amount * Math.pow(10, decimals));

  // Get or Create Associated Token Account for Admin (Sender)
  const senderATA = await getOrCreateAssociatedTokenAccount(
    connection,
    adminKeypair,
    mintPublicKey,
    adminKeypair.publicKey
  );

  // Get or Create Associated Token Account for Winner (Recipient)
  // Admin pays the rent fee if it doesn't exist (~0.002 SOL)
  const recipientATA = await getOrCreateAssociatedTokenAccount(
    connection,
    adminKeypair,
    mintPublicKey,
    recipientPublicKey
  );

  // Create the transfer instruction
  const transaction = new Transaction().add(
    createTransferInstruction(
      senderATA.address,
      recipientATA.address,
      adminKeypair.publicKey,
      rawAmount
    )
  );

  const signature = await sendAndConfirmTransaction(connection, transaction, [adminKeypair]);
  console.log(`[AIRDROP] Real on-chain transfer of ${amount} $ANTHRO to ${recipientWallet}. Tx: ${signature}`);
  return signature;
}

export async function GET(request: Request) {
  // 1. Validate Cron Secret
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const now = new Date();
    // A match ends approximately 3 hours (180 minutes) after kickoff
    const endWindow = new Date(now.getTime() - 180 * 60 * 1000).toISOString();

    // 2. Query locked matches that are ready to be settled
    const { data: matchesToSettle, error: selectError } = await supabaseAdmin
      .from("matches")
      .select("*")
      .eq("status", "locked")
      .lte("kickoff", endWindow);

    if (selectError) {
      return NextResponse.json({ ok: false, error: selectError.message }, { status: 500 });
    }

    if (!matchesToSettle || matchesToSettle.length === 0) {
      return NextResponse.json({ ok: true, message: "No matches ready for settlement." });
    }

    // Fetch API data
    const apiRes = await fetch("https://ultrasmcp.tech/api/matches");
    const apiData = await apiRes.json();
    const finishedMatches = apiData.matches ? apiData.matches.filter((m: any) => m.status === "FINISHED" || m.status === "FT") : [];

    const report = [];

    for (const match of matchesToSettle) {
      // 3. Determine official result from external API
      const apiMatch = finishedMatches.find((m: any) => {
        const home = normalizeTeamName(m.homeTeam?.name || "");
        const away = normalizeTeamName(m.awayTeam?.name || "");
        const s = makeSlug(home, away, m.utcDate);
        return s === match.slug;
      });

      if (!apiMatch || apiMatch.score?.fullTime?.home === undefined) {
        report.push({ match: match.slug, status: "pending", error: "Not finished in API yet or score missing" });
        continue;
      }

      const homeScore = apiMatch.score.fullTime.home;
      const awayScore = apiMatch.score.fullTime.away;

      console.log(`Settling match "${match.slug}" with score ${match.home} ${homeScore} - ${awayScore} ${match.away}`);

      // Begin transaction-like operations in DB
      // 3.1 Insert results
      const { error: resultError } = await supabaseAdmin
        .from("results")
        .upsert({
          match_slug: match.slug,
          home_score: homeScore,
          away_score: awayScore,
          settled_at: new Date().toISOString()
        });

      if (resultError) {
        report.push({ match: match.slug, status: "failed_insert_result", error: resultError.message });
        continue;
      }

      // 3.2 Update match status to settled
      const { error: matchUpdateError } = await supabaseAdmin
        .from("matches")
        .update({ status: "settled" })
        .eq("slug", match.slug);

      if (matchUpdateError) {
        report.push({ match: match.slug, status: "failed_update_status", error: matchUpdateError.message });
        continue;
      }

      // 3.3 Find all predictions for this match
      const { data: predictions, error: predError } = await supabaseAdmin
        .from("predictions")
        .select("*")
        .eq("match_slug", match.slug);

      if (predError || !predictions || predictions.length === 0) {
        report.push({
          match: match.slug,
          status: "settled",
          score: `${homeScore}-${awayScore}`,
          predictions_processed: 0
        });
        continue;
      }

      const winners = [];
      const matchOutcome = Math.sign(homeScore - awayScore); // 1 = home win, -1 = away win, 0 = draw

      // 3.4 Process predictions & verify balances & send rewards
      for (const pred of predictions) {
        const predOutcome = Math.sign(pred.home_score - pred.away_score);

        let rewardAmount = 0;
        let outcomeType = "";

        // Check if exact score matches
        if (pred.home_score === homeScore && pred.away_score === awayScore) {
          rewardAmount = REWARD_EXACT_SCORE;
          outcomeType = "exact_score";
        }
        // Check if winner/draw matches
        else if (predOutcome === matchOutcome) {
          rewardAmount = REWARD_CORRECT_WINNER;
          outcomeType = "correct_winner";
        }

        if (rewardAmount > 0) {
          // Verify balance
          const balance = await checkTokenBalance(pred.wallet);
          if (balance >= minBalance) {
            winners.push({
              wallet: pred.wallet,
              amount: rewardAmount,
              type: outcomeType
            });
          } else {
            console.log(`Wallet ${pred.wallet} won but has insufficient balance: ${balance}`);
          }
        }
      }

      const airdropLogs = [];

      // 3.5 Execute airdrops & write to log
      for (const winner of winners) {
        try {
          const txSig = await sendTokens(winner.wallet, winner.amount);

          // Log in database
          const { error: logError } = await supabaseAdmin
            .from("airdrop_log")
            .insert({
              wallet: winner.wallet,
              match_slug: match.slug,
              amount: winner.amount,
              tx_signature: txSig,
              sent_at: new Date().toISOString()
            });

          if (logError) {
            console.error(`Failed to log airdrop for ${winner.wallet}:`, logError.message);
          }

          airdropLogs.push({ wallet: winner.wallet, amount: winner.amount, signature: txSig });
        } catch (err) {
          console.error(`Failed to execute airdrop for ${winner.wallet}:`, err);
        }
      }

      report.push({
        match: match.slug,
        status: "settled",
        score: `${homeScore}-${awayScore}`,
        predictions_processed: predictions.length,
        winners_count: winners.length,
        airdrops: airdropLogs
      });
    }

    return NextResponse.json({ ok: true, report });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
