import { getSupabaseClient } from '../scripts/utils/supabase.js';

async function check() {
  const supabase = getSupabaseClient();
  const { data: results, error } = await supabase
    .from('results')
    .select('*');

  if (error) {
    console.error("Error fetching results:", error.message);
  } else {
    console.log(`Found ${results.length} total results in DB.`);
    const r32Slugs = [
      'south-af-canada-2026-06-28',
      'brazil-japan-2026-06-29',
      'germany-paraguay-2026-06-29',
      'netherla-morocco-2026-06-30',
      'ivory-co-norway-2026-06-30',
      'france-sweden-2026-06-30',
      'mexico-ecuador-2026-07-01',
      'england-congo-dr-2026-07-01',
      'belgium-senegal-2026-07-01',
      'united-s-bosnia-h-2026-07-02',
      'spain-austria-2026-07-02',
      'portugal-croatia-2026-07-02',
      'switzerl-algeria-2026-07-03'
    ];
    
    const r32Results = results.filter(r => r32Slugs.includes(r.match_slug));
    console.log(`Found ${r32Results.length} Round of 32 results in DB:`);
    r32Results.forEach(r => {
      console.log(`- ${r.match_slug}: ${r.home_score} - ${r.away_score} (settled at ${r.settled_at})`);
    });
  }
}
check();
