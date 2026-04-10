import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';

console.log('Gemini Key prefix:', geminiKey?.substring(0, 10));
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key length:', supabaseKey?.length);

async function testNormalize() {
  const transcript = "kitne project hain";
  console.log('Testing normalization for:', transcript);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${geminiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text: transcript }] },
        outputDimensionality: 768
      })
    });

    if (!response.ok) {
      console.error('Embedding API Error:', await response.text());
      return;
    }

    const data = await response.json() as any;
    const embedding = data.embedding.values;
    console.log('Generated embedding successfully.');

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: matches, error } = await supabase.rpc('match_voice_term', {
      query_embedding: embedding,
      match_threshold: 0.8,
      match_count: 3
    });

    if (error) {
      console.error('Supabase RPC Error:', error);
      return;
    }

    console.log('Matches found:', matches);
  } catch (err) {
    console.error('Test failed with error:', err);
  }
}

testNormalize();
