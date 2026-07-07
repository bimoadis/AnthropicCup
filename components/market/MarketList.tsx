"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { connectPhantom, disconnectPhantom, shortAddress } from "@/lib/wallet";
import type { MatchMarket } from "@/lib/markets";

export default function MarketList({ initialMatches }: { initialMatches: MatchMarket[] }) {
  const [filter, setFilter] = useState<"today" | "week" | "all" | "your_forecast">("today");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [wallet, setWallet] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Record<string, { home_score: number; away_score: number }>>({});
  const [results, setResults] = useState<Record<string, { home_score: number; away_score: number }>>({});
  const [walletNotification, setWalletNotification] = useState<{ message: string; title?: string } | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const fetchPredictions = async (addr: string) => {
    setIsFetching(true);
    try {
      const res = await fetch(`/api/predictions?wallet=${addr}`);
      const data = await res.json();
      if (data.ok && data.data) {
        const predMap: Record<string, { home_score: number; away_score: number }> = {};
        data.data.forEach((p: any) => {
          predMap[p.match_slug] = { home_score: p.home_score, away_score: p.away_score };
        });
        setPredictions(predMap);
        if (data.results) {
          setResults(data.results);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    const session = localStorage.getItem("phantomWalletSession");
    if (session) {
      try {
        const { address, expiresAt } = JSON.parse(session);
        if (Date.now() < expiresAt) {
          setWallet(address);
          fetchPredictions(address);
        } else {
          localStorage.removeItem("phantomWalletSession");
        }
      } catch (e) {
        localStorage.removeItem("phantomWalletSession");
      }
    }
  }, []);

  useEffect(() => {
    if (!wallet) return;

    const sessionStr = localStorage.getItem("phantomWalletSession");
    if (sessionStr) {
      try {
        const { expiresAt } = JSON.parse(sessionStr);
        const timeRemaining = expiresAt - Date.now();
        if (timeRemaining > 0) {
          const timer = setTimeout(() => {
            disconnectPhantom();
            setWallet(null);
            setPredictions({});
            setResults({});
            localStorage.removeItem("phantomWalletSession");
            setWalletNotification({
              title: "Session Expired",
              message: "Your wallet session has expired after 10 minutes."
            });
          }, timeRemaining);
          return () => clearTimeout(timer);
        } else {
          disconnectPhantom();
          setWallet(null);
          setPredictions({});
          setResults({});
          localStorage.removeItem("phantomWalletSession");
        }
      } catch (e) { }
    }
  }, [wallet]);

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  const stages = [
    { label: "Group Stage", value: "GROUP_STAGE" },
    { label: "Round of 32", value: "LAST_32" },
    { label: "Round of 16", value: "LAST_16" },
    { label: "Quarter-finals", value: "QUARTER_FINALS" },
    { label: "Semi-finals", value: "SEMI_FINALS" },
    { label: "Final", value: "FINAL" }
  ];

  const isDetermined = (name: string) => {
    const lower = (name || "").toLowerCase();
    return !lower.includes("winner") &&
      !lower.includes("runner") &&
      !lower.includes("loser") &&
      !lower.includes("tbd");
  };

  const stageOrder = ["GROUP_STAGE", "LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL"];
  const highestStageWithMatches = stageOrder.reduce((max, val, i) => {
    const hasDeterminedMatch = initialMatches.some(m =>
      (m.round || "").toUpperCase() === val && isDetermined(m.home) && isDetermined(m.away)
    );
    return hasDeterminedMatch ? Math.max(max, i) : max;
  }, -1);

  // Compute which stages are fully settled (all matches in that stage are settled or past 4 hours)
  const doneStages = new Set(
    stages
      .map((s) => s.value)
      .filter((val) => {
        const stageMatches = initialMatches.filter(
          (m) => (m.round || "").toUpperCase() === val
        );
        if (stageMatches.length > 0) {
          return stageMatches.every((m) => {
            if (m.status === "settled") return true;
            if (m.rawKickoff) {
              const kickoffTime = new Date(m.rawKickoff).getTime();
              // Consider done if 4 hours have passed since kickoff
              if (Date.now() - kickoffTime > 4 * 60 * 60 * 1000) return true;
            }
            return false;
          });
        }
        // If no matches, consider it done if it's before the highest stage we have matches for
        const stageIndex = stageOrder.indexOf(val);
        return stageIndex !== -1 && stageIndex < highestStageWithMatches;
      })
  );

  const filteredMatches = initialMatches.filter((m) => {
    // 1. Exclude undetermined knockout slots
    const isDetermined = (name: string) => {
      const lower = name.toLowerCase();
      return !lower.includes("winner") &&
        !lower.includes("runner") &&
        !lower.includes("loser") &&
        !lower.includes("tbd");
    };

    if (!isDetermined(m.home) || !isDetermined(m.away)) {
      return false;
    }

    // 3. Stage Filter
    if (groupFilter !== "all") {
      const matchStageUpper = (m.round || "").toUpperCase();
      if (matchStageUpper !== groupFilter) return false;
    }

    // 4. Time Filter
    if (filter === "your_forecast") {
      return !!predictions[m.slug];
    }

    if (filter === "all") return true;

    if (!m.rawKickoff) return false;
    const matchDate = new Date(m.rawKickoff);
    const matchTime = matchDate.getTime();
    const diffDays = (matchTime - startOfToday) / oneDay;

    if (filter === "today") {
      // Same calendar day
      return (
        matchDate.getFullYear() === today.getFullYear() &&
        matchDate.getMonth() === today.getMonth() &&
        matchDate.getDate() === today.getDate()
      );
    }

    if (filter === "week") {
      // From today up to next 7 days
      return diffDays >= 0 && diffDays < 7;
    }

    return true;
  });

  const sortedMatches = [...filteredMatches].sort((a, b) => {
    if (a.status === "open" && b.status !== "open") return -1;
    if (a.status !== "open" && b.status === "open") return 1;
    return 0;
  });

  return (
    <div>
      {/* Primary Time Filter Tabs */}
      <div className="filter-tabs" style={{
        display: "flex",
        gap: "24px",
        marginBottom: "20px",
        borderBottom: "1px solid var(--rule)",
        paddingBottom: "8px"
      }}>
        <button
          onClick={() => {
            setFilter("today");
            setGroupFilter("all");
          }}
          style={{
            background: "none",
            border: "none",
            fontFamily: "var(--mono)",
            fontSize: "13px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            color: filter === "today" ? "var(--ink)" : "var(--ink-faint)",
            borderBottom: filter === "today" ? "2px solid var(--ink)" : "2px solid transparent",
            paddingBottom: "8px",
            marginBottom: "-10px",
            fontWeight: filter === "today" ? "600" : "400",
            transition: "all 0.15s ease"
          }}
        >
          Today
        </button>
        <button
          onClick={() => {
            setFilter("week");
            setGroupFilter("all");
          }}
          style={{
            background: "none",
            border: "none",
            fontFamily: "var(--mono)",
            fontSize: "13px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            color: filter === "week" ? "var(--ink)" : "var(--ink-faint)",
            borderBottom: filter === "week" ? "2px solid var(--ink)" : "2px solid transparent",
            paddingBottom: "8px",
            marginBottom: "-10px",
            fontWeight: filter === "week" ? "600" : "400",
            transition: "all 0.15s ease"
          }}
        >
          This Week
        </button>
        <button
          onClick={() => {
            setFilter("all");
            setGroupFilter("all");
          }}
          style={{
            background: "none",
            border: "none",
            fontFamily: "var(--mono)",
            fontSize: "13px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            color: filter === "all" ? "var(--ink)" : "var(--ink-faint)",
            borderBottom: filter === "all" ? "2px solid var(--ink)" : "2px solid transparent",
            paddingBottom: "8px",
            marginBottom: "-10px",
            fontWeight: filter === "all" ? "600" : "400",
            transition: "all 0.15s ease"
          }}
        >
          All
        </button>
        <button
          onClick={() => {
            setFilter("your_forecast");
            setGroupFilter("all");
            if (wallet && Object.keys(predictions).length === 0) {
              fetchPredictions(wallet);
            }
          }}
          style={{
            background: "none",
            border: "none",
            fontFamily: "var(--mono)",
            fontSize: "13px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            color: filter === "your_forecast" ? "var(--ink)" : "var(--ink-faint)",
            borderBottom: filter === "your_forecast" ? "2px solid var(--ink)" : "2px solid transparent",
            paddingBottom: "8px",
            marginBottom: "-10px",
            fontWeight: filter === "your_forecast" ? "600" : "400",
            transition: "all 0.15s ease"
          }}
        >
          {isFetching && filter === "your_forecast" ? "Loading..." : "Your Forecast"}
        </button>
      </div>



      {/* Secondary Group Filter Pills */}
      <div className="group-pills" style={{
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        marginBottom: "36px"
      }}>
        <button
          onClick={() => setGroupFilter("all")}
          style={{
            background: groupFilter === "all" ? "var(--ink)" : "transparent",
            color: groupFilter === "all" ? "var(--paper)" : "var(--ink-soft)",
            border: `1px solid ${groupFilter === "all" ? "var(--ink)" : "var(--rule-dark)"}`,
            borderRadius: "2px",
            fontFamily: "var(--mono)",
            fontSize: "11px",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            padding: "5px 12px",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          All Matches
        </button>
        {stages.map((k) => {
          const isDone = doneStages.has(k.value);
          const isActive = groupFilter === k.value;
          return (
            <button
              key={k.value}
              onClick={() => { if (!isDone) setGroupFilter(k.value); }}
              disabled={isDone}
              style={{
                position: "relative",
                background: isActive ? "var(--ink)" : "transparent",
                color: isActive ? "var(--paper)" : isDone ? "var(--ink-faint)" : "var(--ink-soft)",
                border: `1px solid ${isActive ? "var(--ink)" : "var(--rule-dark)"}`,
                borderRadius: "2px",
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                padding: "5px 12px",
                cursor: isDone ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                overflow: "hidden",
                opacity: isDone && !isActive ? 0.65 : 1
              }}
            >
              {k.label}
              {isDone && (
                <span style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none"
                }}>
                  <span style={{
                    display: "block",
                    fontFamily: "var(--mono)",
                    fontSize: "10.8px",
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    color: "#A8392E",
                    border: "1.8px solid #A8392E",
                    borderRadius: "2px",
                    padding: "2px 6px",
                    transform: "rotate(-12deg)",
                    background: isActive ? "rgba(168,57,46,0.15)" : "rgba(248,246,242,0.94)",
                    boxShadow: "0 1px 5px rgba(168,57,46,0.18)",
                    whiteSpace: "nowrap"
                  }}>
                    DONE
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filter === "your_forecast" && (
        <div style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--paper-raised)", padding: "16px 20px", border: "1px solid var(--rule-dark)", borderRadius: "4px" }}>
          <div>
            <h3 style={{ margin: "0 0 4px 0", fontFamily: "var(--sans)", fontSize: "16px", color: "var(--ink)", fontWeight: 600 }}>Your Forecasts</h3>
            <p style={{ margin: 0, fontFamily: "var(--sans)", fontSize: "13px", color: "var(--ink-soft)" }}>
              {wallet ? `Connected as ${shortAddress(wallet)}` : "Connect your Phantom wallet to view your predictions."}
            </p>
          </div>
          <div>
            {!wallet ? (
              <button
                onClick={async () => {
                  const res = await connectPhantom();
                  if (res.ok) {
                    setWallet(res.address);
                    fetchPredictions(res.address);
                    localStorage.setItem("phantomWalletSession", JSON.stringify({
                      address: res.address,
                      expiresAt: Date.now() + 10 * 60 * 1000
                    }));
                  } else {
                    setWalletNotification({
                      title: "Connection Failed",
                      message: res.error || "Failed to connect wallet"
                    });
                  }
                }}
                style={{
                  background: "var(--ink)",
                  color: "var(--paper)",
                  border: "none",
                  padding: "8px 16px",
                  fontFamily: "var(--mono)",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  borderRadius: "2px",
                  letterSpacing: "0.05em",
                  transition: "opacity 0.2s"
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Connect Wallet
              </button>
            ) : (
              <button
                onClick={async () => {
                  await disconnectPhantom();
                  setWallet(null);
                  setPredictions({});
                  setResults({});
                  localStorage.removeItem("phantomWalletSession");
                }}
                style={{
                  background: "transparent",
                  color: "var(--ink)",
                  border: "1px solid var(--rule)",
                  padding: "8px 16px",
                  fontFamily: "var(--mono)",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  borderRadius: "2px",
                  letterSpacing: "0.05em",
                  transition: "all 0.2s"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = "var(--ink)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = "var(--rule)";
                }}
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      )}

      {filter === "your_forecast" && !wallet ? null : sortedMatches.length === 0 ? (
        <div style={{
          padding: "60px 0",
          textAlign: "center",
          fontFamily: "var(--sans)",
          color: "var(--ink-soft)",
          border: "1px dashed var(--rule-dark)",
          background: "var(--paper-raised)"
        }}>
          No matches scheduled for this selection.
        </div>
      ) : (
        <div className="mlist-grid">
          {sortedMatches.map((m) => {
            const CardTag = filter === "your_forecast" ? "div" : Link;
            const cardProps = filter === "your_forecast"
              ? { className: "mcard" }
              : { href: `/markets/${m.slug}`, className: "mcard" };

            return (
              <CardTag key={m.slug} {...(cardProps as any)}>
                <span className="stage">
                  <span>{m.round}</span>
                  <span>{m.status === "open" ? "Open" : m.status}</span>
                </span>
                <p className="teams">
                  {m.home} <em>v</em> {m.away}
                </p>
                <p className="meta">
                  {m.kickoff}
                </p>

                <div className="probs mono">
                  <span>
                    {m.home.split(" ")[0]}
                    <b>{m.probs.home}%</b>
                  </span>
                  <span>
                    Draw<b>{m.probs.draw}%</b>
                  </span>
                  <span>
                    {m.away.split(" ")[0]}
                    <b>{m.probs.away}%</b>
                  </span>
                </div>
                {predictions[m.slug] && (() => {
                  const pred = predictions[m.slug];
                  const res = results[m.slug];
                  const isSettled = m.status === "settled";

                  if (!isSettled) {
                    // Pending — match not yet settled
                    return (
                      <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--rule)" }}>
                        <div style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: "6px" }}>Your Forecast</div>
                        <div style={{ fontFamily: "var(--serif)", fontSize: "16px", color: "var(--ink)", fontWeight: 500, letterSpacing: "-0.01em", marginBottom: "10px" }}>
                          {m.home.split(" ")[0]} {pred.home_score} — {pred.away_score} {m.away.split(" ")[0]}
                        </div>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#b45309", background: "rgba(180,83,9,0.06)", border: "1px solid rgba(180,83,9,0.18)", borderRadius: "2px", padding: "4px 10px" }}>
                          <span>◎</span> Pending
                        </div>
                      </div>
                    );
                  }

                  if (!res) {
                    // Settled but no result data
                    return (
                      <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--rule)", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--ink-faint)" }}>
                        Result unavailable
                      </div>
                    );
                  }

                  // Accuracy checks
                  const predHomeWin = pred.home_score > pred.away_score;
                  const predDraw = pred.home_score === pred.away_score;
                  const predAwayWin = pred.home_score < pred.away_score;
                  const resHomeWin = res.home_score > res.away_score;
                  const resDraw = res.home_score === res.away_score;
                  const resAwayWin = res.home_score < res.away_score;

                  const winnerCorrect = (predHomeWin && resHomeWin) || (predDraw && resDraw) || (predAwayWin && resAwayWin);
                  const goalDiffCorrect = (pred.home_score - pred.away_score) === (res.home_score - res.away_score);
                  const exactCorrect = pred.home_score === res.home_score && pred.away_score === res.away_score;

                  const isCorrect = exactCorrect;
                  const accentColor = isCorrect ? "#1E6B4E" : "#A8392E";
                  const accentBg = isCorrect ? "rgba(30,107,78,0.05)" : "rgba(168,57,46,0.05)";
                  const accentBorder = isCorrect ? "rgba(30,107,78,0.2)" : "rgba(168,57,46,0.2)";
                  const statusIcon = isCorrect ? "✓" : "✕";
                  const statusLabel = isCorrect ? "Forecast Correct" : "Forecast Missed";
                  const statusNote = isCorrect ? "Exact score predicted." : "The predicted score did not match.";

                  const CheckRow = ({ label, ok }: { label: string; ok: boolean }) => (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "10.5px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-soft)" }}>{label}</span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: ok ? "#1E6B4E" : "#A8392E", fontWeight: 600 }}>{ok ? "✓" : "✕"}</span>
                    </div>
                  );

                  const divider = <div style={{ height: "1px", background: "var(--rule)", margin: "10px 0" }} />;

                  return (
                    <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--rule)" }}>

                      {/* YOUR FORECAST */}
                      <div style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: "5px" }}>Your Forecast</div>
                      <div style={{ fontFamily: "var(--serif)", fontSize: "17px", fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.01em", marginBottom: "12px" }}>
                        {m.home.split(" ")[0]} {pred.home_score} — {pred.away_score} {m.away.split(" ")[0]}
                      </div>

                      {divider}

                      {/* STATUS BANNER */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "8px 0", background: accentBg, border: `1px solid ${accentBorder}`, borderRadius: "2px", marginBottom: "10px" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "14px", color: accentColor, fontWeight: 700 }}>{statusIcon}</span>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: accentColor, fontWeight: 600 }}>{statusLabel}</span>
                      </div>

                      {divider}

                      {/* ACTUAL RESULT */}
                      <div style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: "5px" }}>Actual Result</div>
                      <div style={{ fontFamily: "var(--serif)", fontSize: "17px", fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.01em", marginBottom: "12px" }}>
                        {m.home.split(" ")[0]} {res.home_score} — {res.away_score} {m.away.split(" ")[0]}
                      </div>

                      {divider}

                      {/* ACCURACY BREAKDOWN */}
                      <CheckRow label="Winner" ok={winnerCorrect} />
                      <CheckRow label="Goal Difference" ok={goalDiffCorrect} />
                      <CheckRow label="Exact Score" ok={exactCorrect} />

                      {divider}

                      {/* NOTE */}
                      <div style={{ fontFamily: "var(--sans)", fontSize: "12px", color: "var(--ink-faint)", fontStyle: "italic" }}>
                        {statusNote}
                      </div>

                    </div>
                  );
                })()}
              </CardTag>
            );
          })}
        </div>
      )}

      {walletNotification && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(23, 20, 14, 0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100
        }}>
          <div style={{
            background: "var(--paper-raised)",
            border: "1px solid var(--rule-dark)",
            borderRadius: "4px",
            padding: "28px 32px",
            maxWidth: "400px",
            width: "95%",
            boxShadow: "0 12px 32px rgba(23, 20, 14, 0.12)"
          }}>
            <h4 style={{
              fontFamily: "var(--serif)",
              fontSize: "20px",
              fontWeight: 500,
              color: "var(--ink)",
              marginBottom: "12px",
              letterSpacing: "-0.01em"
            }}>
              {walletNotification.title || "Wallet Notification"}
            </h4>
            <p style={{
              fontFamily: "var(--sans)",
              fontSize: "14.5px",
              color: "var(--ink-soft)",
              lineHeight: 1.6,
              marginBottom: "20px"
            }}>
              {walletNotification.message}
            </p>
            <button
              onClick={() => setWalletNotification(null)}
              style={{
                width: "100%",
                background: "var(--ink)",
                color: "var(--paper)",
                border: "none",
                padding: "10px 16px",
                fontFamily: "var(--mono)",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                borderRadius: "2px",
                cursor: "pointer",
                transition: "opacity 0.15s ease"
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
