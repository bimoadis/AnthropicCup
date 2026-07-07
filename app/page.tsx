import Link from "next/link";
import Hero from "@/components/home/Hero";
import MarketBoard from "@/components/home/MarketBoard";
import WhyMarkets from "@/components/home/WhyMarkets";
import Tokenomics from "@/components/home/Tokenomics";
import CopyAddress from "@/components/CopyAddress";

export default function Home() {
  return (
    <>
      <Hero />
      <main>
        {/* ============ THE IDEA ============ */}
        <section id="idea">
          <div className="wrap">
            <div className="sec-head reveal">
              <span className="eyebrow">01 &middot; The idea</span>
              <h2>Markets are information.</h2>
            </div>
            <div className="idea-grid">
              <p className="big reveal">
                A headline tells you what one editor believes. A price tells
                you what <em>everyone</em> believes, weighted by how much they
                are willing to stand behind it.
              </p>
              <div className="idea-copy reveal">
                <p>
                  Predictions reveal conviction. When people commit to a
                  forecast, noise falls away and information remains. The
                  aggregate of thousands of independent, motivated forecasts
                  has repeatedly proven harder to beat than any individual
                  expert.
                </p>
                <p>
                  Anthropos Cup applies this to the largest shared narrative on
                  Earth. <b>104 matches. 48 nations. Billions of opinions</b>{" "}
                  about who rises, who collapses, and who writes history in
                  June and July of 2026.
                </p>
                <p>
                  Every prediction submitted on Anthropos Cup moves a probability.
                  Every probability is public, live, and continuous. The
                  result is a single document of collective belief, updating
                  in real time, from the opening whistle to the final.
                </p>
                <p className="footnote">
                  The research tradition here runs from Hayek&rsquo;s
                  &ldquo;The Use of Knowledge in Society&rdquo; (1945) to two
                  decades of empirical work on prediction markets
                  outperforming polls and pundits.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============ LIVE MARKET ============ */}
        <section id="markets">
          <div className="wrap">
            <div className="sec-head reveal">
              <span className="eyebrow">02 &middot; Live market</span>
              <h2>Who lifts the trophy?</h2>
              <p className="lede">
                Outright winner, World Cup 2026. Probabilities are implied by
                open predictions on Anthropos Cup and move as conviction moves.
              </p>
            </div>
            <MarketBoard />
            <p className="reveal" style={{ marginTop: 28 }}>
              <Link href="/markets" className="btn ghost">
                Browse all match markets &rarr;
              </Link>
            </p>
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section id="how">
          <div className="wrap">
            <div className="sec-head reveal">
              <span className="eyebrow">03 &middot; How it works</span>
              <h2>Four steps. One market.</h2>
            </div>
            <div className="how-grid">
              <div className="how-card reveal">
                <svg className="glyph" viewBox="0 0 44 44" aria-hidden="true">
                  <circle cx="22" cy="22" r="14" />
                  <path d="M22 8 L22 2 M22 42 L22 36 M8 22 L2 22 M42 22 L36 22" />
                  <circle cx="22" cy="22" r="3" />
                </svg>
                <h3>Choose a prediction</h3>
                <p>
                  Pick a question you hold a view on. The winner of a match,
                  the exact score, who tops a group, who lifts the trophy.
                  Every market is a precise, settleable question.
                </p>
              </div>
              <div className="how-card reveal">
                <svg className="glyph" viewBox="0 0 44 44" aria-hidden="true">
                  <rect x="6" y="6" width="32" height="32" />
                  <path d="M6 16 L38 16 M16 16 L16 38" />
                </svg>
                <h3>Join a market</h3>
                <p>
                  Submit your forecast alongside thousands of others. Your
                  conviction is recorded transparently and becomes one input
                  into the live probability.
                </p>
              </div>
              <div className="how-card reveal">
                <svg className="glyph" viewBox="0 0 44 44" aria-hidden="true">
                  <path d="M4 34 L14 26 L22 30 L32 18 L40 22" />
                  <path d="M32 18 L40 18 L40 26" />
                </svg>
                <h3>Watch probabilities evolve</h3>
                <p>
                  As news breaks, lineups drop, and matches unfold, the market
                  digests it instantly. You see belief move before commentary
                  catches up.
                </p>
              </div>
              <div className="how-card reveal">
                <svg className="glyph" viewBox="0 0 44 44" aria-hidden="true">
                  <path d="M22 4 L26.5 15.5 L39 16 L29.5 24 L32.5 36 L22 29.5 L11.5 36 L14.5 24 L5 16 L17.5 15.5 Z" />
                </svg>
                <h3>Earn rewards for accuracy</h3>
                <p>
                  Settlement is objective: the scoreboard decides. Accurate
                  forecasters earn rewards and climb a public leaderboard that
                  persists across the tournament.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============ WHY MARKETS MATTER ============ */}
        <section id="why">
          <div className="wrap">
            <div className="sec-head reveal">
              <span className="eyebrow">04 &middot; Why markets matter</span>
              <h2>
                The market moves first.
                <br />
                The headline follows.
              </h2>
            </div>
            <WhyMarkets />
          </div>
        </section>

        {/* ============ $ANTHRO ============ */}
        <section id="token">
          <div className="wrap">
            <div className="token-grid">
              <div className="reveal">
                <span className="eyebrow" style={{ marginBottom: 20 }}>
                  05 &middot; $ANTHRO
                </span>
                <h2 style={{ marginBottom: 22 }}>
                  One token.
                  <br />
                  Pure utility.
                </h2>
                <p className="lede">
                  $ANTHRO is the access and coordination layer of the platform.
                  It exists to make participation, governance, and rewards
                  work, nothing else.
                </p>
                <CopyAddress />
              </div>
              <div className="util-list reveal">
                <div className="util-item">
                  <span className="k">Access</span>
                  <span className="v">
                    <b>Prediction participation</b>
                    Holding $ANTHRO is what lets you enter markets and submit
                    forecasts across the tournament.
                  </span>
                </div>
                <div className="util-item">
                  <span className="k">Analytics</span>
                  <span className="v">
                    <b>Premium insight</b>
                    Deeper market history, probability movement alerts, and
                    forecaster performance data for committed participants.
                  </span>
                </div>
                <div className="util-item">
                  <span className="k">Governance</span>
                  <span className="v">
                    <b>Platform direction</b>
                    Holders vote on new market categories, settlement rules,
                    and how community reward pools are structured.
                  </span>
                </div>
                <div className="util-item">
                  <span className="k">Rewards</span>
                  <span className="v">
                    <b>Leaderboard incentives</b>
                    Accuracy is rewarded from a transparent community pool,
                    settled after every match day.
                  </span>
                </div>
                <div className="util-item">
                  <span className="k">Community</span>
                  <span className="v">
                    <b>Collective incentives</b>
                    Programs that grow the forecaster base: referrals,
                    regional leagues, and creator collaborations.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ TOKENOMICS ============ */}
        <section id="tokenomics">
          <div className="wrap">
            <div className="sec-head reveal">
              <span className="eyebrow">06 &middot; Allocation</span>
              <h2>Built like a balance sheet.</h2>
            </div>
            <Tokenomics />
          </div>
        </section>

        {/* ============ ROADMAP ============ */}
        <section id="roadmap">
          <div className="wrap">
            <div className="sec-head reveal">
              <span className="eyebrow">07 &middot; Roadmap</span>
              <h2>The tournament is chapter one.</h2>
            </div>
            <div className="road reveal">
              <div className="road-item now">
                <span className="when mono">
                  <span className="phase">Phase I</span>Summer 2026
                </span>
                <div>
                  <h3>World Cup launch</h3>
                  <p>
                    The platform opens with the tournament. Match winner, exact
                    score, and outright markets for all 104 fixtures across
                    the United States, Canada, and Mexico.
                  </p>
                </div>
              </div>
              <div className="road-item">
                <span className="when mono">
                  <span className="phase">Phase II</span>June &middot; July 2026
                </span>
                <div>
                  <h3>Live tournament markets</h3>
                  <p>
                    In-tournament probabilities that move minute by minute:
                    group winners, golden boot, knockout paths, and the
                    stories in between.
                  </p>
                </div>
              </div>
              <div className="road-item">
                <span className="when mono">
                  <span className="phase">Phase III</span>July 2026
                </span>
                <div>
                  <h3>Prediction leaderboards</h3>
                  <p>
                    A persistent, public record of forecasting skill. Seasonal
                    rankings, accuracy scores, and recognition for the best
                    forecasters on the platform.
                  </p>
                </div>
              </div>
              <div className="road-item">
                <span className="when mono">
                  <span className="phase">Phase IV</span>Late 2026
                </span>
                <div>
                  <h3>AI narrative engine</h3>
                  <p>
                    A research layer that reads the market: detecting
                    probability shifts, explaining what moved them, and
                    publishing the story behind every number.
                  </p>
                </div>
              </div>
              <div className="road-item">
                <span className="when mono">
                  <span className="phase">Phase V</span>2027 &rarr;
                </span>
                <div>
                  <h3>Global sports expansion</h3>
                  <p>
                    The same market architecture applied to the next great
                    narratives: continental championships, club football, and
                    beyond.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="final">
          <div className="wrap">
            <p className="big reveal">
              The next World Cup story <em>hasn&rsquo;t happened yet.</em>
            </p>
            <p className="mark reveal">
              Anthropos <em>Cup</em>
            </p>
            <p className="help reveal">Help write it.</p>
            <div className="cta-row reveal">
              <Link className="btn" href="/markets">
                Enter the market
              </Link>
              <Link className="btn ghost" href="/#idea">
                Read the thesis
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
