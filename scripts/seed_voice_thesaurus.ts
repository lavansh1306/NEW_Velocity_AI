/**
 * Seed Voice Thesaurus
 * Run this script to populate the Supabase voice_thesaurus table 
 * with canonical terms and their Gemini embeddings.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_API_KEY) {
  console.error('Missing environment variables. Ensure VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY, and GEMINI_API_KEY are set.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TERMS = [
  { term: 'kitney', category: 'quantity' },
  { term: 'how many', category: 'quantity' },
  { term: 'projects', category: 'entity' },
  { term: 'tasks', category: 'entity' },
  { term: 'timeline', category: 'action' },
  { term: 'gantt', category: 'action' },
  { term: 'people', category: 'entity' },
  { term: 'team', category: 'entity' },
  { term: 'dashboard', category: 'navigation' },
  { term: 'planner', category: 'navigation' },
  { term: 'leave', category: 'action' },
  { term: 'vacation', category: 'action' }
];

async function getEmbedding(text: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/text-embedding-004',
      content: { parts: [{ text }] }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini Error: ${err}`);
  }

  const data = await response.json() as any;
  return data.embedding.values;
}

async function seed() {
  console.log(`Starting seeding of ${TERMS.length} terms...`);

  for (const item of TERMS) {
    try {
      console.log(`Generating embedding for "${item.term}"...`);
      const embedding = await getEmbedding(item.term);

      const { error } = await supabase.from('voice_thesaurus').upsert({
        canonical_term: item.term,
        category: item.category,
        embedding: embedding
      }, { onConflict: 'canonical_term' });

      if (error) throw error;
      console.log(`Successfully seeded: ${item.term}`);
    } catch (err) {
      console.error(`Error seeding "${item.term}":`, err);
    }
  }

  console.log('Seeding complete!');
}

seed();
