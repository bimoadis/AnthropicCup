import { getSupabaseClient } from '../scripts/utils/supabase.js';

async function check() {
  const supabase = getSupabaseClient();
  const { data: matches, error } = await supabase
    .from('matches')
    .select('slug, status')
    .eq('round', 'LAST_32')
    .order('kickoff', { ascending: true });

  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("LAST_32 match statuses:");
    matches.forEach(m => {
      console.log(`- ${m.slug}: ${m.status}`);
    });
  }
}
check();
