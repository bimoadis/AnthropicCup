import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Ensure environment variables are loaded
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const cronSecret = process.env.CRON_SECRET;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  })
  : null;

const ALIAS_DICTIONARY: Record<string, string> = {
  "usa": "United States",
  "us": "United States",
  "united states of america": "United States",
  "england w": "England Women",
  "england women": "England Women",
  "bosnia and herzegovina": "Bosnia-Herzegovina",
  "bosnia & herzegovina": "Bosnia-Herzegovina",
  "bosnia-h.": "Bosnia-Herzegovina",
  "bosnia": "Bosnia-Herzegovina",
  "south korea": "Korea Republic",
  "korea republic": "Korea Republic",
  "czech republic": "Czechia",
  "cape verde islands": "Cape Verde",
  "democratic republic of the congo": "Congo DR",
  "drc": "Congo DR",
};

function normalizeTeamName(name: string): string {
  if (!name) return "";
  const cleanName = name.trim();
  const lowerName = cleanName.toLowerCase();
  if (ALIAS_DICTIONARY[lowerName]) {
    return ALIAS_DICTIONARY[lowerName];
  }
  return cleanName.replace(/\b\w/g, l => l.toUpperCase());
}

export async function GET(req: Request) {
  try {
    // 1. Verify CRON_SECRET if it exists
    const url = new URL(req.url);
    const authHeader = req.headers.get("authorization");
    const querySecret = url.searchParams.get("secret");
    
    // Allow if cronSecret is not set (dev), or if it matches Bearer token, or if it matches query param
    const isAuthorized = !cronSecret || 
      authHeader === `Bearer ${cronSecret}` || 
      querySecret === cronSecret;

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      throw new Error("Supabase admin client not initialized.");
    }

    console.log("Starting unified match and result sync...");

    // 2. Fetch matches from Ultras API
    const matchesRes = await fetch("https://ultrasmcp.tech/api/matches");
    const matchesData = await matchesRes.json();
    
    if (!matchesData.matches || !Array.isArray(matchesData.matches)) {
      throw new Error("Invalid format from matches API");
    }

    const matchesToSync = matchesData.matches;
    console.log(`Found ${matchesToSync.length} matches to sync.`);

    const formattedMatches = [];
    const resultsToInsert = [];

    // 3. Process matches and fetch active odds
    for (const match of matchesToSync) {
      const homeTeamRaw = match.homeTeam?.name || "TBD Home";
      const awayTeamRaw = match.awayTeam?.name || "TBD Away";
      const homeTla = match.homeTeam?.tla || "TBD";
      const awayTla = match.awayTeam?.tla || "TBD";
      const matchId = match.id || 0;

      const dateStr = match.utcDate ? match.utcDate.split('T')[0] : 'TBD';
      const homeNorm = normalizeTeamName(homeTeamRaw);
      const awayNorm = normalizeTeamName(awayTeamRaw);

      let slug = "unknown-match";
      if (match.homeTeam?.name && match.awayTeam?.name) {
         slug = `${homeNorm.toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0,8)}-${awayNorm.toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0,8)}-${dateStr}`;
      } else {
         slug = `match-${matchId}-${dateStr}`;
      }

      // Map API status to database schema (open | locked | settled)
      const isFinished = match.status === "FINISHED" || match.status === "FT" || match.status === "completed" || match.status === "settled";
      let status = "open";
      if (isFinished) {
        status = "settled";
      } else if (match.status === "IN_PLAY" || match.status === "PAUSED") {
        status = "locked";
      }

      let home_win = null;
      let draw = null;
      let away_win = null;
      let odds_source = "Ultras API";

      // Only fetch odds for active (non-finished) matches
      if (!isFinished && match.homeTeam?.name && match.awayTeam?.name) {
        try {
          const homeName = encodeURIComponent(match.homeTeam.name);
          const awayName = encodeURIComponent(match.awayTeam.name);
          const detailsUrl = `https://ultrasmcp.tech/api/match-details?home=${homeName}&away=${awayName}&matchId=${matchId}&homeTla=${encodeURIComponent(homeTla)}&awayTla=${encodeURIComponent(awayTla)}`;
          
          const detailsRes = await fetch(detailsUrl);
          if (detailsRes.ok) {
            const details = await detailsRes.json();
            if (details) {
              if (details.match_odds) {
                home_win = details.match_odds.home_win;
                draw = details.match_odds.draw;
                away_win = details.match_odds.away_win;
                odds_source = details.match_odds.source || "Ultras API";
              } else if (details.home?.polymarket_odds || details.away?.polymarket_odds) {
                const hPct = details.home?.polymarket_odds?.pct;
                const aPct = details.away?.polymarket_odds?.pct;
                
                if (hPct !== undefined && hPct !== null) home_win = hPct;
                if (aPct !== undefined && aPct !== null) away_win = aPct;
                
                if (home_win !== null && away_win !== null) {
                  draw = Math.max(0, 100 - home_win - away_win);
                } else if (home_win !== null) {
                  away_win = Math.round((100 - home_win) * 0.4);
                  draw = 100 - home_win - away_win;
                } else if (away_win !== null) {
                  home_win = Math.round((100 - away_win) * 0.4);
                  draw = 100 - home_win - away_win;
                }
                odds_source = "Polymarket (via Ultras)";
              }
            }
          }
        } catch (err) {
          console.error(`Failed to fetch odds for ${slug}:`, err);
        }
      }

      // Default fallback values if still null for active matches
      if (!isFinished && (home_win === null || away_win === null || draw === null)) {
        home_win = 34;
        draw = 29;
        away_win = 37;
        odds_source = "Fallback Default";
      }

      formattedMatches.push({
        slug,
        home: homeNorm,
        away: awayNorm,
        kickoff: match.utcDate,
        venue: match.venue || "TBD",
        status,
        away_win,
        draw,
        home_win,
        source_match_id: matchId.toString(),
        competition: match.competition?.name || "FIFA World Cup",
        season: "2026",
        round: match.stage || "GROUP_STAGE",
        country: match.area?.name || "World",
        odds_source,
        updated_at: new Date().toISOString()
      });

      // Queue result sync for completed matches
      if (isFinished) {
        const homeScore = match.score?.fullTime?.home;
        const awayScore = match.score?.fullTime?.away;

        if (homeScore !== undefined && awayScore !== undefined && homeScore !== null && awayScore !== null) {
          resultsToInsert.push({
            match_slug: slug,
            home_score: parseInt(homeScore, 10),
            away_score: parseInt(awayScore, 10),
            settled_at: new Date().toISOString()
          });
        }
      }

      // Small delay to prevent rate limiting
      if (!isFinished && match.homeTeam?.name && match.awayTeam?.name) {
        await new Promise(r => setTimeout(r, 50));
      }
    }

    // 4. Upsert matches and odds
    if (formattedMatches.length > 0) {
      const { error: matchesError } = await supabaseAdmin
        .from('matches')
        .upsert(formattedMatches, { onConflict: 'slug' });

      if (matchesError) {
        throw matchesError;
      }
    }

    // 5. Upsert match results
    if (resultsToInsert.length > 0) {
      const { error: resultsError } = await supabaseAdmin
        .from('results')
        .upsert(resultsToInsert, { onConflict: 'match_slug' });

      if (resultsError) {
        throw resultsError;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${formattedMatches.length} matches and ${resultsToInsert.length} results.`,
      synced_matches_count: formattedMatches.length,
      synced_results_count: resultsToInsert.length
    });

  } catch (error: any) {
    console.error("Cron sync failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
