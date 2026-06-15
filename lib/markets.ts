/**
 * SAMPLE DATA. Replace with live data from Supabase (see DEVELOPER-BRIEF.md).
 * Fixtures and probabilities below are illustrative placeholders only;
 * they are not the real World Cup 2026 schedule.
 */

export type MatchMarket = {
  slug: string;
  home: string;
  away: string;
  stage: string;
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
    stage: "Group stage · Matchday 2",
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
    stage: "Group stage · Matchday 2",
    kickoff: "Mon 15 Jun · 18:00 CT",
    venue: "AT&T Stadium, Dallas",
    status: "open",
    probs: { home: 52, draw: 27, away: 21 },
  },
  {
    slug: "eng-sen-group",
    home: "England",
    away: "Senegal",
    stage: "Group stage · Matchday 2",
    kickoff: "Tue 16 Jun · 17:00 PT",
    venue: "SoFi Stadium, Los Angeles",
    status: "open",
    probs: { home: 49, draw: 28, away: 23 },
  },
  {
    slug: "fra-jpn-group",
    home: "France",
    away: "Japan",
    stage: "Group stage · Matchday 2",
    kickoff: "Tue 16 Jun · 19:00 ET",
    venue: "Estadio Azteca, Mexico City",
    status: "open",
    probs: { home: 55, draw: 26, away: 19 },
  },
  {
    slug: "esp-usa-group",
    home: "Spain",
    away: "United States",
    stage: "Group stage · Matchday 2",
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
    stage: "Group stage · Matchday 2",
    kickoff: "Wed 17 Jun · 19:00 ET",
    venue: "BMO Field, Toronto",
    status: "open",
    probs: { home: 51, draw: 27, away: 22 },
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
    name: "Brazil",
    note: "Record five titles · last won 2002",
    prob: 18.2,
    delta: 0.4,
    spark:
      "M0,24 L12,22 L24,25 L36,19 L48,20 L60,15 L72,17 L84,12 L96,14 L108,10 L120,8",
  },
  {
    rank: 2,
    name: "Argentina",
    note: "Defending champions · 2022",
    prob: 15.1,
    delta: -0.2,
    spark:
      "M0,12 L12,14 L24,11 L36,15 L48,13 L60,17 L72,16 L84,19 L96,17 L108,20 L120,19",
  },
  {
    rank: 3,
    name: "France",
    note: "Finalists in two of the last two",
    prob: 13.6,
    delta: 0.1,
    spark:
      "M0,20 L12,18 L24,21 L36,17 L48,18 L60,14 L72,16 L84,13 L96,15 L108,13 L120,12",
  },
  {
    rank: 4,
    name: "England",
    note: "No title since 1966",
    prob: 11.4,
    delta: 0.7,
    spark:
      "M0,26 L12,24 L24,26 L36,22 L48,23 L60,19 L72,21 L84,16 L96,18 L108,13 L120,11",
  },
  {
    rank: 5,
    name: "Spain",
    note: "European champions · 2024",
    prob: 8.9,
    delta: 0.3,
    spark:
      "M0,22 L12,20 L24,22 L36,18 L48,19 L60,17 L72,18 L84,15 L96,17 L108,16 L120,15",
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
    let probs = { home: 40, draw: 30, away: 30 };

    if (stats && stats.total > 0) {
      const home = Math.round((stats.homeWins / stats.total) * 100);
      const away = Math.round((stats.awayWins / stats.total) * 100);
      const draw = 100 - home - away;
      probs = { home, draw, away };
    }

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

    return {
      slug: m.slug,
      home: m.home,
      away: m.away,
      stage: m.stage,
      kickoff: formattedDate,
      rawKickoff: m.kickoff,
      venue: m.venue,
      status: m.status as "open" | "locked" | "settled",
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
