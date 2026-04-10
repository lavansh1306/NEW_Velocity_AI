import express from 'express';
import type { Request, Response } from 'express';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const SYSTEM_PROMPT = (currentPath: string) => `
You are the "Velocity AI Core Intelligence". You are a high-performance system designed to manage engineering projects and teams.

## PERSONA:
- Direct, efficient, and technical. MANDATORY: Always provide a precise "response" string for the user to hear.
- Speech-ready responses: Briefly and precisely confirm actions.
- HINGLISH: You natively understand mixed Hindi-English.
- MAPPING: "kitane" (how many) maps to "RESOURCE_QUERY". "health/score/status" maps to "RESOURCE_QUERY".

CRITICAL: Return ONLY valid JSON. Do not include reasoning or markdown. Output exactly one JSON object.

{ "type": "navigate" | "create_project" | "add_team_member" | "delete_team_member" | "create_task" | "assign_task" | "info" | "resource_query" | "request_leave" | "unknown", "params": { "query": "status" | "health" | "projects" }, "response": "Spoken confirmation (Mandatory)", "requiresConfirmation": boolean }`;

// ── Local rule-based fallback — zero API calls ───────────────────────────────
function localParse(transcript: string, currentProjectId?: string): object {
  const text = transcript.toLowerCase().trim();

  // Navigation
  const navMap: Record<string, string> = {
    'dashboard': '/dashboard',
    'projects': '/projects', 'project': '/projects',
    'people': '/people', 'team': '/people',
    'plan': '/plan',
    'leave': '/leave',
    'settings': '/settings', 'setting': '/settings',
  };

  // Hinglish Navigation
  if (text.includes('dikhao') || text.includes('dikao') || text.includes('ley jao')) {
    for (const [key, path] of Object.entries(navMap)) {
      if (text.includes(key)) return { type: 'navigate', target: path, response: `Bilkul, main aapko ${key} par le chalta hoon.` };
    }
  }

  const isNav = text.includes('go') || text.includes('open') || text.includes('show') || text.includes('navigate') || text.includes('take me');
  for (const [key, path] of Object.entries(navMap)) {
    if (text.includes(key) && isNav) {
      return { type: 'navigate', target: path, response: `Opening ${key} for you.` };
    }
  }

  // Add team member
  const isAdd = text.includes('add') || text.includes('invite') || text.includes('onboard') || text.includes('kardo') || text.includes('bring');
  const hasRoleOrMember = ['developer', 'designer', 'engineer', 'manager', 'frontend', 'backend', 'fullstack', 'qa', 'member', 'team'].some(w => text.includes(w));
  if (isAdd && hasRoleOrMember) {
    const roleMap: Record<string, string> = {
      'frontend': 'Frontend Developer', 'front end': 'Frontend Developer',
      'backend': 'Backend Developer', 'back end': 'Backend Developer',
      'fullstack': 'Full Stack Developer', 'full stack': 'Full Stack Developer',
      'designer': 'Designer', 'ux': 'Designer', 'ui': 'Designer',
      'product manager': 'Product Manager', 'manager': 'Product Manager',
      'qa': 'QA Engineer', 'tester': 'QA Engineer',
      'engineer': 'Engineer', 'developer': 'Developer', 'dev': 'Developer',
    };
    let role = 'Team Member';
    const sortedRoles = Object.keys(roleMap).sort((a, b) => b.length - a.length);
    for (const r of sortedRoles) {
      if (text.includes(r)) { role = roleMap[r]; break; }
    }
    const noise = new Set(['add', 'invite', 'onboard', 'kardo', 'bring', 'new', 'team', 'member', 'as', 'a', 'an', 'the', 'please', 'frontend', 'backend', 'fullstack', 'designer', 'manager', 'engineer', 'developer', 'dev', 'qa', 'full', 'stack', 'front', 'back', 'end', 'ux', 'ui', 'tester', 'product']);
    const email = text.split(/\s+/).find(w => w.includes('@')) || '';
    const words = text.split(/\s+/).filter(w => !noise.has(w) && w.length > 1 && !w.includes('@'));
    const name = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'New Member';
    return { type: 'add_team_member', params: { name, email, role }, response: `Adding ${name} as ${role}.` };
  }

  // Remove team member
  const isRemove = text.includes('remove') || text.includes('delete') || text.includes('fire');
  if (isRemove) {
    const noise = new Set(['remove', 'delete', 'fire', 'from', 'the', 'team', 'member', 'please']);
    const words = text.split(/\s+/).filter(w => !noise.has(w) && w.length > 1);
    const name = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'team member';
    return { type: 'delete_team_member', params: { name }, response: `I'll help you remove ${name} from the team.`, requiresConfirmation: true };
  }

  // Analytics (kitne/how many)
  if (text.includes('kitne') || text.includes('kitane') || text.includes('how many')) {
    return { type: 'resource_query', params: { query: text.includes('project') ? 'projects' : 'metrics' }, response: "I'll pull up those numbers for you." };
  }

  if (text.includes('status') || text.includes('health') || text.includes('score')) {
    return { type: 'resource_query', params: { query: text.includes('health') ? 'health' : 'status' }, response: "Let me check the dashboard metrics for you." };
  }

  // Create project
  const isCreate = text.includes('create project') || text.includes('new project') || text.includes('add project') || text.includes('plan project') || text.includes('plan a');
  if (isCreate) {
    return { type: 'create_project', params: { projectDescription: transcript, autoAnalyze: true }, response: 'Opening the project planner for you.' };
  }

  return { type: 'unknown', response: "I'm sorry, I didn't quite catch that. Could you repeat it differently?" };
}

// ── Main voice parse endpoint ────────────────────────────────────────────────
router.post('/parse', async (req: Request, res: Response) => {
  const { transcript, currentPath = '/', currentProjectId } = req.body;

  if (!transcript) {
    return res.status(400).json({ error: 'transcript is required' });
  }

  console.log('[VoiceParse] Transcript:', transcript, '| Path:', currentPath);

  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const prompt = SYSTEM_PROMPT(currentPath);
  const userMessage = `User said: "${transcript}"`;

  // ── 1. Gemma 4 31B IT ──────────────────────────────────────────────────────
  if (geminiKey) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt + '\n\n' + userMessage }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        }
      ) as any;

      if (geminiRes.ok) {
        const data = await geminiRes.json() as any;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          try {
            const parsed = JSON.parse(text);
            console.log('[VoiceParse] ✅ Gemma 4 success');
            return res.json({ ...parsed, provider: 'gemma-4' });
          } catch { /* fall through */ }
        }
      } else {
        console.warn('[VoiceParse] Gemma 4 error response:', geminiRes.status);
        if (geminiRes.status === 400) {
           const errBody = await geminiRes.text();
           console.error('[VoiceParse] 400 Detail:', errBody);
        }
      }
    } catch (e) {
      console.warn('[VoiceParse] Gemma 4 exception:', e);
    }
  }

  // ── 2. Groq Llama 3.1 8B ────────────────────────────────────────────────
  if (groqKey) {
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: userMessage }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 300
        })
      }) as any;

      if (groqRes.ok) {
        const data = await groqRes.json() as any;
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          try {
            const parsed = JSON.parse(text);
            console.log('[VoiceParse] ✅ Groq success');
            return res.json({ ...parsed, provider: 'groq' });
          } catch { /* fall through */ }
        }
      } else if (groqRes.status === 429) {
        console.warn('[VoiceParse] Groq rate limited → using local parser');
      } else {
        console.warn('[VoiceParse] Groq error:', groqRes.status);
      }
    } catch (e) {
      console.warn('[VoiceParse] Groq exception:', e);
    }
  }

  // ── 3. Local parser — always works ──────────────────────────────────────
  console.log('[VoiceParse] ✅ Local parser');
  return res.json(localParse(transcript, currentProjectId));
});

// ── Text to Speech endpoint ───────────────────────────────────────────────
router.post('/tts', async (req: Request, res: Response) => {
  const { text } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!text) return res.status(400).json({ error: 'text is required' });

  // For now, we'll return a 404 to trigger the frontend's robust browser fallback
  // This prevents the 500 server crash while maintaining functionality
  console.log('[VoiceTTS] Request received:', text.slice(0, 30));
  
  // Optional: In the future, integrate with Google Cloud TTS or Gemini Multimodal TTS here
  return res.status(404).json({ error: 'Server-side TTS not implemented, using browser fallback' });
});

// ── Text to Normalization (Vector Search) ──────────────────────────────
router.post('/normalize', async (req: Request, res: Response) => {
  const { transcript } = req.body;
  if (!transcript) return res.status(400).json({ error: 'transcript is required' });

  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!geminiKey || !supabase) {
    console.warn('[VoiceNormalize] Missing API keys or Supabase client, skipping vector correction');
    return res.json({ normalized: transcript, corrected: false, reason: 'unconfigured' });
  }

  try {
    // 1. Generate Embedding for the transcript
    // Using text-embedding-004 (768 dimensions)
    const embedRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/gemini-embedding-001',
          content: { parts: [{ text: transcript }] },
          outputDimensionality: 768
        })
      }
    ) as any;

    if (!embedRes.ok) {
      console.error('[VoiceNormalize] Embedding API failed:', embedRes.status);
      return res.json({ normalized: transcript, corrected: false, reason: 'embedding_failed' });
    }
    
    const embedData = await embedRes.json() as any;
    const embedding = embedData.embedding?.values;

    if (!embedding) {
      return res.json({ normalized: transcript, corrected: false, reason: 'no_embedding_values' });
    }

    // 2. Query Supabase for closest canonical terms
    const { data: matches, error } = await supabase.rpc('match_voice_term', {
      query_embedding: embedding,
      match_threshold: 0.8, // High threshold for precision
      match_count: 3
    });

    if (error) {
       console.error('[VoiceNormalize] Supabase RPC Error:', error);
       return res.json({ normalized: transcript, corrected: false, error: error.message });
    }

    if (matches && matches.length > 0) {
      const bestMatch = matches[0];
      console.log(`[VoiceNormalize] Found match: "${bestMatch.canonical_term}" with similarity ${bestMatch.similarity}`);
      
      return res.json({ 
        normalized: bestMatch.canonical_term, 
        original: transcript,
        corrected: true,
        similarity: bestMatch.similarity
      });
    }

    return res.json({ normalized: transcript, corrected: false });
  } catch (error) {
    console.error('[VoiceNormalize] Critical Error:', error);
    // Explicitly return a success status with corrected: false to prevent frontend breakage
    return res.json({ 
      normalized: transcript, 
      corrected: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

export default router;

