import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase
    .from('project_plans')
    .select('id, title, description, status, published')
    .limit(5);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Drafts found:", data);
  }
}

test();
