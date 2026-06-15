import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("=== Consolidating World Cup 2026 Matches & Odds ===");
  try {
    // 1. Fetch matches
    console.log("Fetching matches...");
    const matchesRes = await fetch("https://ultrasmcp.tech/api/matches");
    if (!matchesRes.ok) throw new Error(`Matches API failed: ${matchesRes.status}`);
    const matchesData = await matchesRes.json();
    const matches = matchesData.matches || [];
    
    // 2. Fetch odds
    console.log("Fetching live odds...");
    const oddsRes = await fetch("https://ultrasmcp.tech/api/match-odds");
    if (!oddsRes.ok) throw new Error(`Odds API failed: ${oddsRes.status}`);
    const oddsData = await oddsRes.json();
    const matchMarkets = oddsData.matchMarkets || [];
    
    // Create a map of odds for fast lookup
    const oddsMap = new Map();
    matchMarkets.forEach(m => {
      oddsMap.set(m.match_id, m.odds);
    });

    console.log(`Matching odds for ${matches.length} fixtures...`);

    // 3. Consolidate data
    const consolidated = matches.map(match => {
      const liveOdds = oddsMap.get(match.id);
      
      // Default odds if not present in the live odds endpoint
      const odds = liveOdds ? {
        home_win: parseInt(liveOdds.home_win || "40"),
        draw: parseInt(liveOdds.draw || "30"),
        away_win: parseInt(liveOdds.away_win || "30")
      } : {
        home_win: 40,
        draw: 30,
        away_win: 30
      };

      return {
        match_id: match.id,
        home_team: match.homeTeam.name,
        away_team: match.awayTeam.name,
        home_crest: match.homeTeam.crest,
        away_crest: match.awayTeam.crest,
        date: match.utcDate,
        stage: match.stage,
        group: match.group || null,
        status: match.status,
        odds: {
          away_win: odds.away_win,
          draw: odds.draw,
          home_win: odds.home_win
        },
        score: match.score && match.score.fullTime ? {
          home: match.score.fullTime.home,
          away: match.score.fullTime.away
        } : null
      };
    });

    // 4. Save to markets.json and odds.json
    const marketsPath = path.resolve(__dirname, "../markets.json");
    const oddsPath = path.resolve(__dirname, "../odds.json");
    const jsonString = JSON.stringify(consolidated, null, 2);
    
    fs.writeFileSync(marketsPath, jsonString, "utf-8");
    fs.writeFileSync(oddsPath, jsonString, "utf-8");
    console.log(`Successfully generated markets.json and odds.json with ${consolidated.length} matches!`);
  } catch (err) {
    console.error("Error generating match odds:", err.message);
  }
}

main();
