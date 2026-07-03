import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { Connection, PublicKey } from "@solana/web3.js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const tokenMint = process.env.NEXT_PUBLIC_TOKEN_MINT;
const minBalance = parseFloat(process.env.NEXT_PUBLIC_MIN_ANTHROPOS || "1000");

// Initialize Supabase Admin client (bypasses RLS if service role key is used)
const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })
  : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wallet, match_slug, home_score, away_score, signature } = body;

    // 1. Basic validation
    if (!wallet || !match_slug || home_score === undefined || away_score === undefined || !signature) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: wallet, match_slug, home_score, away_score, signature" },
        { status: 400 }
      );
    }

    if (home_score < 0 || home_score > 20 || away_score < 0 || away_score > 20) {
      return NextResponse.json(
        { ok: false, error: "Scores must be between 0 and 20" },
        { status: 400 }
      );
    }

    // 2. Cryptographic Signature Verification
    try {
      const messageStr = `Anthropos Cup Prediction: ${match_slug} - ${home_score}:${away_score}`;
      const messageBytes = new TextEncoder().encode(messageStr);
      const publicKeyBytes = bs58.decode(wallet);
      const signatureBytes = bs58.decode(signature);

      const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
      if (!isValid) {
        return NextResponse.json(
          { ok: false, error: "Invalid cryptographic signature" },
          { status: 401 }
        );
      }
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: "Signature verification failed: " + (err instanceof Error ? err.message : String(err)) },
        { status: 400 }
      );
    }

    // 3. Check token balance on Solana (if mint address is configured)
    if (tokenMint) {
      try {
        const connection = new Connection(rpcUrl, "confirmed");
        const ownerPublicKey = new PublicKey(wallet);
        const mintPublicKey = new PublicKey(tokenMint);

        const response = await connection.getParsedTokenAccountsByOwner(ownerPublicKey, {
          mint: mintPublicKey
        });

        let balance = 0;
        for (const account of response.value) {
          const amount = account.account.data.parsed.info.tokenAmount.uiAmount;
          if (amount) {
            balance += amount;
          }
        }

        if (balance < minBalance) {
          return NextResponse.json(
            { ok: false, error: `Insufficient $ANTHROPOS balance. Required: ${minBalance.toLocaleString()}, Current: ${balance.toLocaleString()}` },
            { status: 403 }
          );
        }
      } catch (err) {
        console.error("Solana balance check error:", err);
        // We log the error but in development or RPC failure, we might not block the user.
        // However, for strict security, we block if config is set but fails.
        return NextResponse.json(
          { ok: false, error: "Failed to verify token balance on Solana blockchain: " + (err instanceof Error ? err.message : String(err)) },
          { status: 500 }
        );
      }
    }

    // 4. Database operations
    if (!supabaseAdmin) {
      // Demo mode fallback
      console.log("Supabase not fully configured. Running in demo mode.");
      return NextResponse.json({ ok: true, demo: true });
    }

    // Check if match is open
    const { data: match, error: matchError } = await supabaseAdmin
      .from("matches")
      .select("status")
      .eq("slug", match_slug)
      .single();

    if (matchError || !match) {
      return NextResponse.json(
        { ok: false, error: "Match not found" },
        { status: 404 }
      );
    }

    if (match.status !== "open") {
      return NextResponse.json(
        { ok: false, error: `Cannot submit prediction. Match status is ${match.status}.` },
        { status: 400 }
      );
    }

    // Insert prediction
    const { error: insertError } = await supabaseAdmin
      .from("predictions")
      .insert({
        wallet,
        match_slug,
        home_score,
        away_score
      });

    if (insertError) {
      if (insertError.code === "23505") { // Unique constraint violation
        return NextResponse.json(
          { ok: false, error: "This wallet has already submitted a forecast for this match." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, demo: false });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json(
        { ok: false, error: "Missing wallet parameter" },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ ok: true, data: [] });
    }

    const { data, error } = await supabaseAdmin
      .from("predictions")
      .select("match_slug, home_score, away_score")
      .eq("wallet", wallet);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    // Fetch actual results for these prediction slugs
    const resultsMap: Record<string, { home_score: number; away_score: number }> = {};
    if (data && data.length > 0) {
      const slugs = data.map((p) => p.match_slug);
      const { data: results, error: resError } = await supabaseAdmin
        .from("results")
        .select("match_slug, home_score, away_score")
        .in("match_slug", slugs);

      if (!resError && results) {
        results.forEach((r) => {
          resultsMap[r.match_slug] = { home_score: r.home_score, away_score: r.away_score };
        });
      }
    }

    return NextResponse.json({ ok: true, data, results: resultsMap });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
