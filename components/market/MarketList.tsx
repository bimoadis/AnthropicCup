"use client";

import { useState } from "react";
import Link from "next/link";
import type { MatchMarket } from "@/lib/markets";

export default function MarketList({ initialMatches }: { initialMatches: MatchMarket[] }) {
  const [filter, setFilter] = useState<"today" | "week" | "all">("all");

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  const filteredMatches = initialMatches.filter((m) => {
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

  return (
    <div>
      {/* Premium Minimalist Filter Tabs */}
      <div className="filter-tabs" style={{
        display: "flex",
        gap: "24px",
        marginBottom: "36px",
        borderBottom: "1px solid var(--rule)",
        paddingBottom: "8px"
      }}>
        <button
          onClick={() => setFilter("today")}
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
          Hari Ini
        </button>
        <button
          onClick={() => setFilter("week")}
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
          Minggu Ini
        </button>
        <button
          onClick={() => setFilter("all")}
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
          Semua
        </button>
      </div>

      {filteredMatches.length === 0 ? (
        <div style={{
          padding: "40px 0",
          textAlign: "center",
          fontFamily: "var(--sans)",
          color: "var(--ink-soft)"
        }}>
          Tidak ada pertandingan yang dijadwalkan untuk periode ini.
        </div>
      ) : (
        <div className="mlist-grid">
          {filteredMatches.map((m) => (
            <Link href={`/markets/${m.slug}`} className="mcard" key={m.slug}>
              <span className="stage">
                <span>{m.stage}</span>
                <span>{m.status === "open" ? "Open" : m.status}</span>
              </span>
              <p className="teams">
                {m.home} <em>v</em> {m.away}
              </p>
              <p className="meta">
                {m.kickoff} &middot; {m.venue}
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
