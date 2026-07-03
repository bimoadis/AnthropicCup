async function run() {
  try {
    const res = await fetch("https://ultrasmcp.tech/api/matches");
    const data = await res.json();
    if (data.matches) {
      const r32Matches = data.matches.filter(m => m.stage === "LAST_32");
      console.log(`Found ${r32Matches.length} Round of 32 matches in API:`);
      
      const formatted = r32Matches.map(m => ({
        id: m.id,
        home: m.homeTeam?.name,
        away: m.awayTeam?.name,
        utcDate: m.utcDate,
        status: m.status,
        score: m.score?.fullTime
      }));
      console.log(JSON.stringify(formatted, null, 2));
    }
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
