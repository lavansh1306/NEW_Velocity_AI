import { geminiVoiceService } from '../src/services/geminiVoiceService';

async function test() {
  console.log('--- Testing Offline Parser ---');
  
  const testCases = [
    { input: 'go to dashboard', expected: 'navigate' },
    { input: 'open projects', expected: 'navigate' },
    { input: 'add a team member named John Doe', expected: 'add_team_member' },
    { input: 'delete member Sarah', expected: 'delete_team_member' },
    { input: 'search for react documentation', expected: 'search' },
    { input: 'show me the timeline', expected: 'gantt_query' },
    { input: 'who is busy right now?', expected: 'resource_query' }
  ];

  for (const tc of testCases) {
    // @ts-ignore - accessing private for testing
    const action = geminiVoiceService['parseOfflineCommand'](tc.input);
    console.log(`Input: "${tc.input}" -> Type: ${action?.type || 'null'} (Expected: ${tc.expected})`);
    if (action?.type !== tc.expected) {
      console.error(`FAILED: Expected ${tc.expected}, got ${action?.type}`);
    }
  }

  console.log('\n--- Testing Gemini Error Fallback ---');
  // Simulate a model error by setting model to something that throws
  // @ts-ignore
  geminiVoiceService['model'] = {
    generateContent: () => { throw new Error('Quota Exceeded'); }
  };

  const fallbackAction = await geminiVoiceService.parseIntent('go to settings', '/dashboard');
  console.log(`Input: "go to settings" (with Gemini Error) -> Type: ${fallbackAction.type}`);
  console.log(`Response: ${fallbackAction.response}`);
}

test();
