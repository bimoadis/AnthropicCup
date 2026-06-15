import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLiveMatchMarkets, getLiveMarket } from "@/lib/markets";
import Outcomes from "@/components/market/Outcomes";
import PredictionPanel from "@/components/market/PredictionPanel";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const markets = await getLiveMatchMarkets();
  return markets.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const m = await getLiveMarket(slug);
  if (!m) return { title: "Market · Anthropic Cup" };
  return {
    title: `${m.home} v ${m.away} · Anthropic Cup`,
    description: `Forecast the exact score of ${m.home} v ${m.away} and watch the market's probability evolve up to kickoff.`,
  };
}

export default async function MarketDetail({ params }: Props) {
  const { slug } = await params;
  const market = await getLiveMarket(slug);

  if (!market) notFound();

  return (
    <main>
      <div className="mdetail-head wrap">
        <p className="crumb">
          <Link href="/markets">Markets</Link> &nbsp;/&nbsp; {market.stage}
        </p>
        <h1 className="matchup">
          {market.home}
          <em>v</em>
          {market.away}
        </h1>
        <div className="match-meta mono">
          <span>{market.kickoff}</span>
          <span>{market.venue}</span>
          <span className="live-dot">
            <i />
            Market open
          </span>
        </div>

        <div className="detail-grid">
          <div>
            <Outcomes market={market} />
            {market.note && (
              <p
                className="footnote"
                style={{ marginTop: 22, borderTop: "none", paddingTop: 0 }}
              >
                Market note: {market.note}
              </p>
            )}
          </div>
          <PredictionPanel market={market} />
        </div>

        <div className="rules-list">
          <div className="rule-item">
            <span className="k">Question</span>
            <span className="v">
              What is the exact final score of {market.home} v {market.away}{" "}
              after 90 minutes plus stoppage time? Extra time and penalties do
              not count toward the score.
            </span>
          </div>
          <div className="rule-item">
            <span className="k">Eligibility</span>
            <span className="v">
              One forecast per wallet per match. A minimum $ANTHROPIC balance is
              required at the time of submission and at settlement.
            </span>
          </div>
          <div className="rule-item">
            <span className="k">Lock</span>
            <span className="v">
              The market locks at kickoff. Forecasts cannot be edited or
              withdrawn after lock.
            </span>
          </div>
          <div className="rule-item">
            <span className="k">Settlement</span>
            <span className="v">
              Settled against the official full-time result. Exact-score
              forecasts share the match reward pool; correct-winner forecasts
              earn leaderboard points. Rewards are distributed to the
              submitting wallet within 24 hours, and every distribution is
              published.
            </span>
          </div>
        </div>
      </div>
      <div style={{ paddingBottom: "clamp(80px,11vw,140px)" }} />
    </main>
  );
}
