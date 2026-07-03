import { getSupabaseClient } from '../scripts/utils/supabase.js';

async function run() {
  const supabase = getSupabaseClient();
  console.log("Deleting placeholder LAST_32 matches from DB...");

  // Delete matches where round is 'LAST_32' and teams contain TBD/Winner/Runner/Loser
  const { data, error } = await supabase
    .from('matches')
    .delete()
    .eq('round', 'LAST_32')
    .or('home.ilike.%tbd%,away.ilike.%tbd%,home.ilike.%winner%,away.ilike.%winner%,home.ilike.%runner%,away.ilike.%runner%')
    .select();

  if (error) {
    console.error("Error deleting placeholders:", error.message);
  } else {
    console.log(`Successfully deleted ${data ? data.length : 0} placeholder matches.`);
    if (data && data.length > 0) {
      console.log("Deleted matches:", data.map(m => m.slug));
    }
  }
}
run();
