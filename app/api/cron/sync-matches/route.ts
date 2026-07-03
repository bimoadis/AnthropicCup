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

    console.log("Starting match sync...");

    // 2. Fetch matches from Ultras API
    const matchesRes = await fetch("https://ultrasmcp.tech/api/matches");
    const matchesData = await matchesRes.json();
    
    if (!matchesData.matches || !Array.isArray(matchesData.matches)) {
      throw new Error("Invalid format from matches API");
    }

    // Filter only matches we care about (we can sync everything, but let's sync World Cup 2026 for safety)
    const matchesToSync = matchesData.matches.filter((m: any) => m.competition?.name === "FIFA World Cup");
    console.log(`Found ${matchesToSync.length} World Cup matches to sync.`);

    const formattedMatches = [];

    // 3. For each match, fetch odds
    for (const match of matchesToSync) {
      // Build slug: home-away-YYYY-MM-DD
      const dateStr = match.utcDate ? match.utcDate.split('T')[0] : 'TBD';
      let slug = "unknown-match";
      if (match.homeTeam?.name && match.awayTeam?.name) {
         slug = `${match.homeTeam.name.toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0,8)}-${match.awayTeam.name.toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0,8)}-${dateStr}`;
      } else {
         slug = `match-${match.id}-${dateStr}`; // Fallback if teams are unknown (TBD)
      }

      // Fetch odds and details
      let home_win = 34;
      let draw = 29;
      let away_win = 37;
      let odds_source = "Fallback ELO";
      
      const homeName = encodeURIComponent(match.homeTeam?.name || "TBD");
      const awayName = encodeURIComponent(match.awayTeam?.name || "TBD");
      const matchId = match.id || 0;
      const homeTla = encodeURIComponent(match.homeTeam?.tla || "TBD");
      const awayTla = encodeURIComponent(match.awayTeam?.tla || "TBD");

      try {
        if (match.homeTeam?.name && match.awayTeam?.name) {
          const detailsUrl = `https://ultrasmcp.tech/api/match-details?home=${homeName}&away=${awayName}&matchId=${matchId}&homeTla=${homeTla}&awayTla=${awayTla}`;
          const detailsRes = await fetch(detailsUrl);
          if (detailsRes.ok) {
            const details = await detailsRes.json();
            if (details.match_odds) {
              home_win = details.match_odds.home_win;
              draw = details.match_odds.draw;
              away_win = details.match_odds.away_win;
              odds_source = details.match_odds.source || "Ultras API";
            }
          }
        }
      } catch (err) {
        console.error(`Failed to fetch odds for ${slug}:`, err);
      }

      // Map API status to our status
      let status = "open";
      if (match.status === "FINISHED") status = "settled";
      else if (match.status === "IN_PLAY" || match.status === "PAUSED") status = "locked";

      formattedMatches.push({
        slug,
        home: match.homeTeam?.name || "TBD",
        away: match.awayTeam?.name || "TBD",
        kickoff: match.utcDate,
        venue: match.venue || "TBD",
        status,
        away_win,
        draw,
        home_win,
        source_match_id: match.id?.toString(),
        competition: match.competition?.name || "FIFA World Cup",
        season: "2026",
        round: match.stage || "GROUP_STAGE",
        country: match.area?.name || "World",
        odds_source
      });
      
      // Add a tiny delay to not overload the details API
      await new Promise(r => setTimeout(r, 100));
    }

    // 4. Upsert matches to Supabase
    if (formattedMatches.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('matches')
        .upsert(formattedMatches, { onConflict: 'slug' })
        .select('slug');

      if (error) {
        throw error;
      }
      
      return NextResponse.json({
        success: true,
        message: `Successfully synced ${formattedMatches.length} matches.`,
        synced_slugs: data?.map(d => d.slug)
      });
    }

    return NextResponse.json({ success: true, message: "No matches to sync." });

  } catch (error: any) {
    console.error("Match sync failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
