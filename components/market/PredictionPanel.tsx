"use client";

import { useState } from "react";
import type { MatchMarket } from "@/lib/markets";
import { connectPhantom, shortAddress, checkAnthroBalance } from "@/lib/wallet";
import { submitPrediction, supabase } from "@/lib/supabase";

const MIN_ANTHRO = parseInt(process.env.NEXT_PUBLIC_MIN_ANTHROPOS || "1000", 10);
const MIN_ANTHRO_DISPLAY = MIN_ANTHRO.toLocaleString("en-US");

type Status =
  | { kind: "idle" }
  | { kind: "busy"; msg: string }
  | { kind: "ok"; msg: string }
  | { kind: "err"; msg: string };

export default function PredictionPanel({ market }: { market: MatchMarket }) {
  const [wallet, setWallet] = useState<string | null>(null);
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [anthroBalance, setAnthroBalance] = useState<number | null>(null);
  const [balanceChecked, setBalanceChecked] = useState(false);

  const hasEnoughAnthro = anthroBalance === null || anthroBalance >= MIN_ANTHRO;
  // null means mint not configured (no NEXT_PUBLIC_TOKEN_MINT) → skip gate

  async function handleConnect() {
    setStatus({ kind: "busy", msg: "Waiting for Phantom…" });
    const res = await connectPhantom();
    if (!res.ok) {
      setStatus({ kind: "err", msg: res.error });
      return;
    }
    setWallet(res.address);
    setStatus({ kind: "busy", msg: "Checking $ANTHRO balance…" });

    const balance = await checkAnthroBalance(res.address);
    console.log(`[Wallet Connect] $ANTHRO token balance for ${res.address}:`, balance);
    setAnthroBalance(balance);
    setBalanceChecked(true);
    setStatus({ kind: "idle" });
  }

  async function handleSubmit() {
    const h = parseInt(home, 10);
    const a = parseInt(away, 10);
    if (!wallet) {
      setStatus({ kind: "err", msg: "Connect your Phantom wallet first." });
      return;
    }
    if (!hasEnoughAnthro) {
      setStatus({
        kind: "err",
        msg: `Insufficient $ANTHRO. Required: ${MIN_ANTHRO_DISPLAY}, your balance: ${(anthroBalance ?? 0).toLocaleString("en-US")}.`,
      });
      return;
    }
    if (Number.isNaN(h) || Number.isNaN(a) || h < 0 || a < 0 || h > 20 || a > 20) {
      setStatus({ kind: "err", msg: "Enter a score between 0 and 20 for each side." });
      return;
    }
    setStatus({ kind: "busy", msg: "Recording your forecast…" });
    const res = await submitPrediction({
      wallet,
      match_slug: market.slug,
      home_score: h,
      away_score: a,
    });
    if (res.ok) {
      setStatus({
        kind: "ok",
        msg: res.demo
          ? `Forecast recorded (demo mode): ${market.home} ${h}, ${market.away} ${a}. Connect Supabase to persist submissions.`
          : `Forecast recorded: ${market.home} ${h}, ${market.away} ${a}. Good luck.`,
      });
    } else {
      setStatus({ kind: "err", msg: res.error });
    }
  }

  const busy = status.kind === "busy";

  return (
    <div className="predict-panel">
      <div className="panel-label">
        <span>Your forecast</span>
        <span>{supabase ? "Live" : "Demo mode"}</span>
      </div>
      <h3>Call the score.</h3>
      <p className="hint">
        One forecast per wallet. Locks at kickoff, settles against the
        official full-time result. Holding {MIN_ANTHRO_DISPLAY} $ANTHRO is required to
        participate.
      </p>

      {/* Score inputs */}
      <div className="score-row">
        <div className="score-cell">
          <label htmlFor="home-score">{market.home}</label>
          <input
            id="home-score"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            placeholder="0"
            value={home}
            disabled={!wallet || !hasEnoughAnthro || busy || status.kind === "ok"}
            onChange={(e) => setHome(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <span className="score-sep">v</span>
        <div className="score-cell">
          <label htmlFor="away-score">{market.away}</label>
          <input
            id="away-score"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            placeholder="0"
            value={away}
            disabled={!wallet || !hasEnoughAnthro || busy || status.kind === "ok"}
            onChange={(e) => setAway(e.target.value.replace(/\D/g, ""))}
          />
        </div>
      </div>

      {/* Wallet row */}
      <div className="wallet-row">
        <span className={`wallet-pill${wallet ? " on" : ""}`}>
          <i />
          {wallet ? shortAddress(wallet) : "No wallet connected"}
        </span>
        {!wallet && (
          <button className="btn ghost" onClick={handleConnect} disabled={busy}>
            Connect Phantom
          </button>
        )}
      </div>

      {/* Balance gate — shown only after connect when mint is configured */}
      {wallet && balanceChecked && anthroBalance !== null && (
        <div style={{
          marginTop: "14px",
          padding: "14px 16px",
          border: `1px solid ${hasEnoughAnthro ? "rgba(30,107,78,0.25)" : "rgba(168,57,46,0.25)"}`,
          borderRadius: "3px",
          background: hasEnoughAnthro ? "rgba(30,107,78,0.04)" : "rgba(168,57,46,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px"
        }}>
          <div>
            <div style={{
              fontFamily: "var(--mono)",
              fontSize: "10px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-faint)",
              marginBottom: "3px"
            }}>
              $ANTHRO Balance
            </div>
            <div style={{
              fontFamily: "var(--mono)",
              fontSize: "16px",
              fontWeight: 600,
              color: hasEnoughAnthro ? "#1E6B4E" : "#A8392E",
              letterSpacing: "0.02em"
            }}>
              {anthroBalance.toLocaleString("en-US")}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontFamily: "var(--mono)",
              fontSize: "10px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-faint)",
              marginBottom: "3px"
            }}>
              Required
            </div>
            <div style={{
              fontFamily: "var(--mono)",
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--ink-soft)",
              letterSpacing: "0.02em"
            }}>
              {MIN_ANTHRO_DISPLAY}
            </div>
          </div>
          <div style={{
            fontFamily: "var(--mono)",
            fontSize: "13px",
            fontWeight: 700,
            color: hasEnoughAnthro ? "#1E6B4E" : "#A8392E"
          }}>
            {hasEnoughAnthro ? "✓" : "✕"}
          </div>
        </div>
      )}

      {/* Insufficient balance notice */}
      {wallet && balanceChecked && anthroBalance !== null && !hasEnoughAnthro && (
        <div style={{
          marginTop: "10px",
          fontFamily: "var(--sans)",
          fontSize: "13px",
          color: "#A8392E",
          lineHeight: 1.55
        }}>
          You need at least {MIN_ANTHRO_DISPLAY} $ANTHRO to submit a forecast.
          Acquire tokens to participate.
        </div>
      )}

      {/* Submit button */}
      <button
        className="btn"
        style={{ width: "100%", justifyContent: "center", marginTop: "16px" }}
        onClick={handleSubmit}
        disabled={busy || status.kind === "ok" || (wallet !== null && !hasEnoughAnthro)}
      >
        {busy
          ? status.msg
          : status.kind === "ok"
          ? "Forecast submitted"
          : !wallet
          ? "Connect wallet to submit"
          : !hasEnoughAnthro
          ? `Insufficient $ANTHRO (need ${MIN_ANTHRO_DISPLAY})`
          : "Submit forecast"}
      </button>

      {status.kind === "ok" && <p className="status-msg ok">{status.msg}</p>}
      {status.kind === "err" && <p className="status-msg err">{status.msg}</p>}

      <p className="fine">
        Forecasting on Anthropos Cup is a test of judgment, not a wager. There is
        no fee to submit and nothing is staked; rewards come from the
        community pool and are earned by accuracy alone.
      </p>
    </div>
  );
}
