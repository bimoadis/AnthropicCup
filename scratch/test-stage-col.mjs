import { getSupabaseClient } from '../scripts/utils/supabase.js';

async function check() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('matches').select('stage').limit(1);
  if (error) {
    console.log("Column 'stage' does not exist or error:", error.message);
  } else {
    console.log("Column 'stage' exists! Sample data:", data);
  }
}
check();
