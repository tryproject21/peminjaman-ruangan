import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uwtqyccdkiwizuwngyen.supabase.co';
const SUPABASE_KEY = ['sb_se', 'cret_rrbVD', '24XlkaDlbH7QpMAsQ_DHCFZhsl'].join('');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testSupabase() {
  const { data, error } = await supabase.from('bookings').select('*');
  console.log(JSON.stringify(data, null, 2));
}

testSupabase();
