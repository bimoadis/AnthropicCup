import { fetchOdds } from "../scripts/fetch-odds.mjs";

async function test() {
  console.log("Fetching Polymarket data...");
  const markets = await fetchOdds();
  console.log(`Parsed ${markets.length} markets.`);
  if (markets.length > 0) {
    console.log("Example market:", JSON.stringify(markets[0], null, 2));
    // Log a few more questions
    console.log("All questions:");
    markets.slice(0, 10).forEach(m => console.log(`- ${m.question}`));
  } else {
    // Let's fetch raw search response and log it
    const res = await fetch("https://gamma-api.polymarket.com/public-search?q=World%20Cup");
    const data = await res.json();
    console.log("Raw API Response structure:", Object.keys(data));
    console.log("Raw events length:", data.events?.length);
    if (data.events && data.events.length > 0) {
      console.log("First event:", JSON.stringify(data.events[0], null, 2));
    } else {
      console.log("No events found in raw search.");
    }
  }
}

test().catch(console.error);
