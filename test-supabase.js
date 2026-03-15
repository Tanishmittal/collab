
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  console.log('Fetching influencers...');
  const { data, error } = await supabase.from('influencer_profiles').select('id').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success! Data count:', data?.length);
  }
}

test();
