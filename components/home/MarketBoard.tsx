"use client";

import { useEffect, useRef } from "react";
import { outright } from "@/lib/markets";

/**
 * Outright winner board. Sparklines draw themselves on entry;
 * probabilities drift gently while the board is on screen.
 */
export default function MarketBoard() {
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Sparkline draw on entry
    const paths = board.querySelectorAll<SVGPathElement>(".spark path");
    paths.forEach((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = String(len);
      p.style.strokeDashoffset = reduced ? "0" : String(len);
    });

    let driftTimer: number | null = null;

    const driftOnce = () => {
      const rows = board.querySelectorAll<HTMLElement>("[data-market]");
      const row = rows[Math.floor(Math.random() * rows.length)];
      if (!row) return;
      const prob = row.querySelector<HTMLElement>(".prob");
      const val = row.querySelector<HTMLElement>(".val");
      if (!prob || !val) return;

      let p = parseFloat(row.dataset.p || "10");
      const move =
        (Math.random() * 0.3 + 0.05) * (Math.random() < 0.5 ? -1 : 1);
      p = Math.max(1, Math.min(60, p + move));
      row.dataset.p = p.toFixed(1);

      prob.classList.remove("flash-up", "flash-down");
      void prob.offsetWidth;
      prob.classList.add(move >= 0 ? "flash-up" : "flash-down");
      val.textContent = p.toFixed(1) + "%";
      window.setTimeout(
        () => prob.classList.remove("flash-up", "flash-down"),
        900
      );
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            paths.forEach((p) => (p.style.strokeDashoffset = "0"));
            if (!reduced && driftTimer === null) {
              driftTimer = window.setInterval(driftOnce, 2600);
            }
          } else if (driftTimer !== null) {
            window.clearInterval(driftTimer);
            driftTimer = null;
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(board);

    return () => {
      io.disconnect();
      if (driftTimer !== null) window.clearInterval(driftTimer);
    };
  }, []);

  return (
    <div
      className="market-board reveal"
      ref={boardRef}
      role="table"
      aria-label="Outright winner probabilities"
    >
      <div className="board-head">
        <span>Market &middot; Outright winner</span>
        <span className="live-dot">
          <i />
          Live
        </span>
      </div>

      {outright.map((row) => (
        <div className="market-row" role="row" data-market data-p={row.prob} key={row.rank}>
          <span className="idx mono">{String(row.rank).padStart(2, "0")}</span>
          <div className="name">
            {row.name} <span>{row.note}</span>
          </div>
          <svg className="spark" viewBox="0 0 120 34" preserveAspectRatio="none" aria-hidden="true">
            <path d={row.spark} />
          </svg>
          <div className="prob">
            <span className="val">{row.prob.toFixed(1)}%</span>
            <span className={`delta mono dir ${row.delta >= 0 ? "up" : "down"}`}>
              {row.delta >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(row.delta).toFixed(1)} today
            </span>
          </div>
        </div>
      ))}

      <div className="board-foot mono">
        <span>38 other nations trade below 1%</span>
        <span>Updated continuously &middot; illustrative data</span>
      </div>
    </div>
  );
}
