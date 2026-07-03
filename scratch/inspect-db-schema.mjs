import { getSupabaseClient } from '../scripts/utils/supabase.js';

async function check() {
  const supabase = getSupabaseClient();
  
  const slugs = [
    'tbd-home-tbd-away-2026-06-30',
    'tbd-home-tbd-away-2026-07-01',
    'tbd-home-tbd-away-2026-07-03',
    'tbd-home-tbd-away-2026-06-28',
    'tbd-home-tbd-away-2026-06-29',
    'tbd-home-tbd-away-2026-07-02'
  ];

  const { data: preds, error: prError } = await supabase
    .from('predictions')
    .select('*')
    .in('match_slug', slugs);

  if (prError) {
    console.error("Error fetching predictions:", prError);
  } else {
    console.log(`Found ${preds.length} predictions referencing the placeholder slugs.`);
  }

  const { data: results, error: resError } = await supabase
    .from('results')
    .select('*')
    .in('match_slug', slugs);

  if (resError) {
    console.error("Error fetching results:", resError);
  } else {
    console.log(`Found ${results.length} results referencing the placeholder slugs.`);
  }
}
check();
