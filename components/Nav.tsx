import Link from "next/link";

export default function Nav() {
  return (
    <nav className="nav" aria-label="Main">
      <div className="nav-inner">
        <Link href="/" className="wordmark">
          Anthropic <em>Cup</em>
        </Link>
        <div className="nav-links">
          <Link href="/#idea">The idea</Link>
          <Link href="/markets">Markets</Link>
          <Link href="/#how">How it works</Link>
          <Link href="/#token">$ANTHROPIC</Link>
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
        <Link href="/markets" className="btn">
          <span>Enter the market</span>
          <span className="tick">&#9650; 18%</span>
        </Link>
      </div>
    </nav>
  );
}
