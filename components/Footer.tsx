import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <span className="wordmark" style={{ fontSize: 16 }}>
            Anthropic <em>Cup</em>
          </span>
          <div className="foot-links">
            <Link href="/#idea">Thesis</Link>
            <Link href="/markets">Markets</Link>
            <Link href="/#tokenomics">Allocation</Link>
            <Link href="/#roadmap">Roadmap</Link>
            <a
              href="https://x.com/anthropiccup?s=11"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (formerly Twitter)"
              style={{ display: "inline-flex", alignItems: "center" }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
          <span className="mono">&copy; 2026 Anthropic Cup</span>
        </div>
        <p className="disclaimer">
          Anthropic Cup is a skill-based forecasting platform. Probabilities shown
          on this site are illustrative until live markets open. Anthropic Cup is
          not affiliated with FIFA. $ANTHROPIC is a utility token used for platform
          access, governance, and rewards; nothing on this site is financial
          advice or an offer of securities.
        </p>
      </div>
    </footer>
  );
}
