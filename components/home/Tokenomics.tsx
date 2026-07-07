"use client";

import { useEffect, useRef } from "react";

const ALLOC = [
  { name: "Community rewards", pct: 40, color: "var(--green)", tokens: "400,000,000", note: "Accuracy rewards, leaderboard prizes, and match-day settlement pools. The majority of supply goes to the people doing the forecasting." },
  { name: "Liquidity", pct: 20, color: "var(--ink)", tokens: "200,000,000", note: "Deep, stable liquidity so participation always has a fair entry and exit." },
  { name: "Ecosystem growth", pct: 15, color: "#3A362C", tokens: "150,000,000", note: "Partnerships, regional leagues, integrations, and forecaster acquisition." },
  { name: "Treasury", pct: 10, color: "#5B564C", tokens: "100,000,000", note: "Long-horizon reserve, governed by holders." },
  { name: "Development", pct: 10, color: "#8C867A", tokens: "100,000,000", note: "Engineering, settlement infrastructure, and the analytics product." },
  { name: "Team", pct: 5, color: "#B6B0A2", tokens: "50,000,000", note: "Vested over the long term, aligned with the platform's life beyond 2026." },
];

export default function Tokenomics() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            bar.classList.add("in");
            io.disconnect();
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(bar);
    return () => io.disconnect();
  }, []);

  return (
    <div className="reveal">
      <div className="supply-line">
        <span className="num">1,000,000,000</span>
        <span className="lab">Total supply &middot; fixed &middot; $ANTHRO</span>
      </div>

      <div
        className="alloc-bar"
        ref={barRef}
        role="img"
        aria-label="Allocation: community rewards 40 percent, liquidity 20, ecosystem growth 15, treasury 10, development 10, team 5"
      >
        {ALLOC.map((a, i) => (
          <div
            key={a.name}
            className="alloc-seg"
            style={{
              ["--w" as string]: a.pct + "%",
              background: a.color,
              transitionDelay: `${i * 0.08}s`,
            }}
            title={`${a.name} ${a.pct}%`}
          />
        ))}
      </div>
      <div className="alloc-scale mono">
        <span>0</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
      </div>

      <table className="alloc-table">
        <thead>
          <tr>
            <th>Allocation</th>
            <th>Share</th>
            <th>Tokens</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          {ALLOC.map((a) => (
            <tr key={a.name}>
              <td>
                <span className="sw" style={{ background: a.color }} />
                {a.name}
              </td>
              <td className="pct">{a.pct}%</td>
              <td className="amt">{a.tokens}</td>
              <td className="note-col">{a.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
