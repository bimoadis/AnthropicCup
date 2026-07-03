/**
 * Minimal Phantom connector. No wallet-adapter dependency: for an MVP
 * the injected provider API is enough and keeps the bundle small.
 * Upgrade path: @solana/wallet-adapter-react (see DEVELOPER-BRIEF.md).
 */

import bs58 from "bs58";

type PhantomProvider = {
  isPhantom?: boolean;
  connect: (opts?: {
    onlyIfTrusted?: boolean;
  }) => Promise<{ publicKey: { toString(): string } }>;
  disconnect: () => Promise<void>;
  signMessage: (
    message: Uint8Array,
    encoding: string
  ) => Promise<{ signature: Uint8Array }>;
};

function getProvider(): PhantomProvider | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { solana?: PhantomProvider };
  return w.solana?.isPhantom ? w.solana : null;
}

export async function connectPhantom(): Promise<
  { ok: true; address: string } | { ok: false; error: string }
> {
  const provider = getProvider();
  if (!provider) {
    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent || "";
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      if (isMobile) {
        const currentUrl = window.location.href;
        const ref = window.location.origin;
        const deepLink = `https://phantom.app/ul/browse?ref=${encodeURIComponent(ref)}&url=${encodeURIComponent(currentUrl)}`;
        window.open(deepLink, "_blank", "noopener");
        return {
          ok: false,
          error: "Redirecting to Phantom Mobile App...",
        };
      } else {
        window.open("https://phantom.app/download", "_blank", "noopener");
        return {
          ok: false,
          error: "Phantom extension not detected. Please install it.",
        };
      }
    }
    return {
      ok: false,
      error: "Phantom not detected. Install it, then try again.",
    };
  }
  try {
    const res = await provider.connect();
    return { ok: true, address: res.publicKey.toString() };
  } catch {
    return { ok: false, error: "Connection was declined." };
  }
}

export async function disconnectPhantom(): Promise<void> {
  const provider = getProvider();
  if (provider) {
    try {
      await provider.disconnect();
    } catch (err) {
      console.error("Disconnect error:", err);
    }
  }
}

export async function signPhantomMessage(
  messageStr: string
): Promise<{ ok: true; signature: string } | { ok: false; error: string }> {
  const provider = getProvider();
  if (!provider) {
    return { ok: false, error: "Phantom wallet not found." };
  }
  try {
    const encodedMessage = new TextEncoder().encode(messageStr);
    const { signature } = await provider.signMessage(encodedMessage, "utf8");
    const signatureBase58 = bs58.encode(signature);
    return { ok: true, signature: signatureBase58 };
  } catch (err) {
    return {
      ok: false,
      error:
        "Signature request was declined: " +
        (err instanceof Error ? err.message : String(err)),
    };
  }
}

export function shortAddress(addr: string) {
  return addr.slice(0, 4) + "\u2026" + addr.slice(-4);
}

/**
 * Checks the $ANTHRO SPL token balance for a given wallet address.
 * Uses the Solana JSON-RPC directly (no extra dependencies).
 * Returns the UI amount (human-readable) or null on failure.
 */
export async function checkAnthroBalance(walletAddress: string): Promise<number | null> {
  const mint = process.env.NEXT_PUBLIC_TOKEN_MINT;
  if (!mint) return null; // No mint configured — skip check

  const rpcUrl =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    "https://api.mainnet-beta.solana.com";

  try {
    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenAccountsByOwner",
      params: [
        walletAddress,
        { mint },
        { encoding: "jsonParsed" },
      ],
    };

    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    const accounts: Array<{ account: { data: { parsed: { info: { tokenAmount: { uiAmount: number } } } } } }> =
      json?.result?.value ?? [];

    let total = 0;
    for (const acc of accounts) {
      total += acc.account.data.parsed.info.tokenAmount.uiAmount ?? 0;
    }
    return total;
  } catch {
    return null;
  }
}
