import fs from 'fs';

async function fetchPolymarketOdds() {
  console.log("Fetching active events from Polymarket...");
  
  // Try to fetch sports/soccer events. Polymarket Gamma API uses limit and offset.
  // We'll search for events that might be soccer matches.
  try {
    const res = await fetch("https://gamma-api.polymarket.com/events?limit=50&active=true&closed=false");
    const data = await res.json();
    
    if (!Array.isArray(data)) {
      console.error("Unexpected response:", data);
      return;
    }
    
    console.log(`Fetched ${data.length} active events.`);
    console.log("Sample event titles:");
    data.slice(0, 10).forEach((e, i) => {
      console.log(`${i+1}. ${e.title}`);
    });
    
    const formattedMatches = [];
    
    for (const event of matchEvents) {
      // Typically, an event has a list of markets.
      // For a match, the main market usually asks "Who will win...?"
      const mainMarket = event.markets && event.markets.find(m => m.active && !m.closed);
      
      if (mainMarket && mainMarket.outcomePrices) {
        // Polymarket usually has outcomes like ["Team A", "Team B", "Draw"]
        let outcomes = [];
        let prices = [];
        try {
          outcomes = JSON.parse(mainMarket.outcomes || "[]");
          prices = JSON.parse(mainMarket.outcomePrices || "[]");
        } catch (e) {
          continue;
        }
        
        if (outcomes.length >= 2) {
          // Parse team names from title: "Team A vs Team B"
          const teams = event.title.split(/ vs\.? /i);
          if (teams.length < 2) continue;
          
          let home = teams[0].trim();
          let away = teams[1].split(/[-,\|]/)[0].trim(); // Remove suffix if exists
          
          let home_win = 34; // default fallbacks
          let draw = 29;
          let away_win = 37;
          
          // Map outcomes to home/away/draw
          for (let i = 0; i < outcomes.length; i++) {
            const outcome = outcomes[i];
            const price = parseFloat(prices[i]) * 100; // Convert to percentage
            
            if (outcome.includes(home) || home.includes(outcome)) {
              home_win = Math.round(price);
            } else if (outcome.includes(away) || away.includes(outcome)) {
              away_win = Math.round(price);
            } else if (outcome.toLowerCase().includes("draw") || outcome.toLowerCase().includes("tie")) {
              draw = Math.round(price);
            }
          }
          
          // Normalize to 100%
          const total = home_win + draw + away_win;
          if (total > 0 && total !== 100) {
            home_win = Math.round((home_win / total) * 100);
            away_win = Math.round((away_win / total) * 100);
            draw = 100 - home_win - away_win;
          }

          formattedMatches.push({
            slug: `${home.toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0,8)}-${away.toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0,8)}`, // mock slug
            home,
            away,
            polymarket_event_id: event.id,
            title: event.title,
            home_win,
            draw,
            away_win,
            odds_source: "Polymarket"
          });
        }
      }
    }
    
    // Save to a JSON file to inspect
    fs.writeFileSync('./scratch/polymarket-odds.json', JSON.stringify(formattedMatches, null, 2));
    console.log("Saved formatted matches to scratch/polymarket-odds.json");
    console.log("Sample of first 3 matches:");
    console.log(JSON.stringify(formattedMatches.slice(0, 3), null, 2));
    
  } catch (err) {
    console.error("Error fetching Polymarket data:", err);
  }
}

fetchPolymarketOdds();
