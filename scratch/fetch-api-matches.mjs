async function run() {
  try {
    const res = await fetch("https://ultrasmcp.tech/api/matches");
    const data = await res.json();
    console.log(`Fetched ${data.matches ? data.matches.length : 0} matches from API.`);
    if (data.matches) {
      // Print first 5 matches to see structure
      console.log("Sample match:", data.matches[0]);
      
      // Let's filter for matches in June/July 2026 that might be Round of 32
      const r32 = data.matches.filter(m => {
        const d = new Date(m.utcDate);
        return d.getFullYear() === 2026 && d.getMonth() === 5 && d.getDate() >= 25 || d.getMonth() === 6;
      });
      console.log(`Matches in late June / July 2026: ${r32.length}`);
      console.log(JSON.stringify(r32.slice(0, 10), null, 2));
    }
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
