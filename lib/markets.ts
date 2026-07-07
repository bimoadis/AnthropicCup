/**
 * SAMPLE DATA. Replace with live data from Supabase (see DEVELOPER-BRIEF.md).
 * Fixtures and probabilities below are illustrative placeholders only;
 * they are not the real World Cup 2026 schedule.
 */

export type MatchMarket = {
  slug: string;
  home: string;
  away: string;
  round: string;
  kickoff: string; // human readable for now; use timestamptz in Supabase
  rawKickoff?: string; // ISO string from DB
  venue: string;
  status: "open" | "locked" | "settled";
  probs: { home: number; draw: number; away: number };
  note?: string;
};

export const matchMarkets: MatchMarket[] = [
  {
    slug: "bra-mar-group",
    home: "Brazil",
    away: "Morocco",
    round: "Group stage · Matchday 2",
    kickoff: "Sun 14 Jun · 20:00 ET",
    venue: "MetLife Stadium, New Jersey",
    status: "open",
    probs: { home: 58, draw: 24, away: 18 },
    note: "Morocco eliminated Brazil's rivals in 2022 and beat them in a 2023 friendly.",
  },
  {
    slug: "arg-den-group",
    home: "Argentina",
    away: "Denmark",
    round: "Group stage · Matchday 2",
    kickoff: "Mon 15 Jun · 18:00 CT",
    venue: "AT&T Stadium, Dallas",
    status: "open",
    probs: { home: 52, draw: 27, away: 21 },
  },
  {
    slug: "eng-sen-group",
    home: "England",
    away: "Senegal",
    round: "Group stage · Matchday 2",
    kickoff: "Tue 16 Jun · 17:00 PT",
    venue: "SoFi Stadium, Los Angeles",
    status: "open",
    probs: { home: 49, draw: 28, away: 23 },
  },
  {
    slug: "fra-jpn-group",
    home: "France",
    away: "Japan",
    round: "Group stage · Matchday 2",
    kickoff: "Tue 16 Jun · 19:00 ET",
    venue: "Estadio Azteca, Mexico City",
    status: "open",
    probs: { home: 55, draw: 26, away: 19 },
  },
  {
    slug: "esp-usa-group",
    home: "Spain",
    away: "United States",
    round: "Group stage · Matchday 2",
    kickoff: "Wed 17 Jun · 16:00 ET",
    venue: "Mercedes-Benz Stadium, Atlanta",
    status: "open",
    probs: { home: 54, draw: 25, away: 21 },
    note: "The hosts meet the reigning European champions on home soil.",
  },
  {
    slug: "ger-nga-group",
    home: "Germany",
    away: "Nigeria",
    round: "Group stage · Matchday 2",
    kickoff: "Wed 17 Jun · 19:00 ET",
    venue: "BMO Field, Toronto",
    status: "open",
    probs: { home: 51, draw: 27, away: 22 },
  },
  {
    slug: "por-arg-quarter",
    home: "Portugal",
    away: "Argentina",
    round: "Quarterfinals",
    kickoff: "Sun 21 Jun · 20:00 ET",
    venue: "MetLife Stadium, New Jersey",
    status: "open",
    probs: { home: 52, draw: 26, away: 22 },
  },
  {
    slug: "fra-eng-quarter",
    home: "France",
    away: "England",
    round: "Quarterfinals",
    kickoff: "Tue 23 Jun · 19:00 ET",
    venue: "SoFi Stadium, Los Angeles",
    status: "open",
    probs: { home: 48, draw: 28, away: 24 },
  },
  {
    slug: "spa-ger-quarter",
    home: "Spain",
    away: "Germany",
    round: "Quarterfinals",
    kickoff: "Wed 24 Jun · 18:00 ET",
    venue: "AT&T Stadium, Dallas",
    status: "open",
    probs: { home: 51, draw: 27, away: 22 },
  },
  {
    slug: "nld-bel-quarter",
    home: "Netherlands",
    away: "Belgium",
    round: "Quarterfinals",
    kickoff: "Thu 25 Jun · 19:00 ET",
    venue: "Mercedes-Benz Stadium, Atlanta",
    status: "open",
    probs: { home: 45, draw: 29, away: 26 },
  },
  {
    slug: "por-fra-semi",
    home: "Portugal",
    away: "France",
    round: "Semifinals",
    kickoff: "Sun 28 Jun · 20:00 ET",
    venue: "MetLife Stadium, New Jersey",
    status: "open",
    probs: { home: 54, draw: 25, away: 21 },
  },
  {
    slug: "arg-eng-semi",
    home: "Argentina",
    away: "England",
    round: "Semifinals",
    kickoff: "Tue 30 Jun · 19:00 ET",
    venue: "SoFi Stadium, Los Angeles",
    status: "open",
    probs: { home: 50, draw: 27, away: 23 },
  },
  {
    slug: "fra-arg-final",
    home: "France",
    away: "Argentina",
    round: "Final",
    kickoff: "Sun 5 Jul · 20:00 ET",
    venue: "MetLife Stadium, New Jersey",
    status: "open",
    probs: { home: 55, draw: 24, away: 21 },
  },
];

export type OutrightRow = {
  rank: number;
  name: string;
  note: string;
  prob: number;
  delta: number;
  spark: string; // SVG path, 120x34 viewBox
};

export const outright: OutrightRow[] = [
  {
    rank: 1,
    name: "France",
    note: "Reigning runners-up · two titles",
    prob: 33.0,
    delta: 1.2,
    spark:
      "M0,24 L12,22 L24,25 L36,19 L48,20 L60,15 L72,17 L84,12 L96,14 L108,10 L120,8",
  },
  {
    rank: 2,
    name: "Spain",
    note: "European champions · 2024",
    prob: 18.0,
    delta: 0.5,
    spark:
      "M0,22 L12,20 L24,22 L36,18 L48,19 L60,17 L72,18 L84,15 L96,17 L108,16 L120,15",
  },
  {
    rank: 3,
    name: "Argentina",
    note: "Defending champions · 2022",
    prob: 18.0,
    delta: -0.8,
    spark:
      "M0,12 L12,14 L24,11 L36,15 L48,13 L60,17 L72,16 L84,19 L96,17 L108,20 L120,19",
  },
  {
    rank: 4,
    name: "England",
    note: "No title since 1966",
    prob: 15.0,
    delta: 0.4,
    spark:
      "M0,26 L12,24 L24,26 L36,22 L48,23 L60,19 L72,21 L84,16 L96,18 L108,13 L120,11",
  },
  {
    rank: 5,
    name: "Norway",
    note: "Dark horse contenders",
    prob: 6.0,
    delta: 0.2,
    spark:
      "M0,28 L12,25 L24,26 L36,20 L48,22 L60,18 L72,15 L84,16 L96,12 L108,10 L120,9",
  },
  {
    rank: 6,
    name: "Colombia",
    note: "Strong South American contenders",
    prob: 3.0,
    delta: 0.1,
    spark:
      "M0,30 L12,29 L24,28 L36,27 L48,26 L60,25 L72,24 L84,23 L96,22 L108,21 L120,20",
  },
  {
    rank: 7,
    name: "Morocco",
    note: "Semi-finalists in 2022",
    prob: 3.0,
    delta: 0.0,
    spark:
      "M0,25 L12,24 L24,25 L36,23 L48,24 L60,22 L72,23 L84,21 L96,22 L108,20 L120,18",
  },
  {
    rank: 8,
    name: "Belgium",
    note: "Experienced squad",
    prob: 2.0,
    delta: -0.2,
    spark:
      "M0,15 L12,16 L24,18 L36,19 L48,22 L60,24 L72,26 L84,27 L96,28 L108,29 L120,30",
  },
  {
    rank: 9,
    name: "Switzerland",
    note: "Consistently reach knockouts",
    prob: 1.0,
    delta: 0.0,
    spark:
      "M0,28 L12,28 L24,27 L36,27 L48,28 L60,28 L72,27 L84,27 L96,28 L108,28 L120,28",
  },
  {
    rank: 10,
    name: "Egypt",
    note: "Pharaohs of Africa",
    prob: 0.0,
    delta: 0.0,
    spark:
      "M0,32 L12,32 L24,32 L36,32 L48,32 L60,32 L72,32 L84,32 L96,32 L108,32 L120,32",
  },
];

import { supabase } from "./supabase";

export async function getLiveMatchMarkets(): Promise<MatchMarket[]> {
  if (!supabase) {
    return matchMarkets;
  }

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff", { ascending: true });

  if (matchesError || !matches) {
    console.error("Error fetching matches:", matchesError?.message);
    return matchMarkets;
  }

  const { data: predStats, error: predError } = await supabase
    .from("predictions")
    .select("match_slug, home_score, away_score");

  const statsMap: Record<
    string,
    { homeWins: number; draws: number; awayWins: number; total: number }
  > = {};

  if (!predError && predStats) {
    predStats.forEach((p) => {
      if (!statsMap[p.match_slug]) {
        statsMap[p.match_slug] = { homeWins: 0, draws: 0, awayWins: 0, total: 0 };
      }
      const stats = statsMap[p.match_slug];
      stats.total++;
      if (p.home_score > p.away_score) {
        stats.homeWins++;
      } else if (p.home_score < p.away_score) {
        stats.awayWins++;
      } else {
        stats.draws++;
      }
    });
  }

  return matches.map((m) => {
    const stats = statsMap[m.slug];
    
    // Use the Polymarket/Ultras odds from database if available, otherwise fallback to default 34/29/27
    let probs = {
      home: (m.home_win !== null && m.home_win !== undefined) ? m.home_win : 34,
      draw: (m.draw !== null && m.draw !== undefined) ? m.draw : 29,
      away: (m.away_win !== null && m.away_win !== undefined) ? m.away_win : 27
    };

    // (Removed: We no longer override probs with user prediction stats as per user request)

    const d = new Date(m.kickoff);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };
    const formattedDate = d.toLocaleString("en-US", options);

    let displayStatus = m.status as "open" | "locked" | "settled";
    if (displayStatus === "open" && Date.now() >= d.getTime()) {
      displayStatus = "locked";
    }

    return {
      slug: m.slug,
      home: m.home,
      away: m.away,
      round: m.round || m.stage || "Match",
      kickoff: formattedDate,
      rawKickoff: m.kickoff,
      venue: m.venue,
      status: displayStatus,
      probs,
    };
  });
}

export async function getLiveMarket(slug: string): Promise<MatchMarket | null> {
  const markets = await getLiveMatchMarkets();
  return markets.find((m) => m.slug === slug) || null;
}

export function getMarket(slug: string) {
  return matchMarkets.find((m) => m.slug === slug);
}
