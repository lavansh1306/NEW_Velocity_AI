// Mock utils for voice service
const levenshteinDistance = (s1, s2) => {
  if (s1 === s2) return 0;
  return 1; // Simple mock
};

const normalizeTranscript = (text) => {
  return text.toLowerCase()
    .replace(/^(hello|hi|hey|velocity|hero|bot|ai|please|can you|could you|would you|um|uh|err|like|kindly|just)\s+/g, '')
    .replace(/\s+(um|uh|err|like|please|and|then|kindly|now)\s+/g, ' ')
    .replace(/[.,!?;:]+$/, '') 
    .trim();
};

const parseOfflineCommand = (transcript) => {
  const text = normalizeTranscript(transcript);
  const words = text.split(' ');
  
  // 1a. "Create Project" (Partial mock to avoid too much noise)
  if (text.includes('project') && (text.includes('create') || text.includes('add'))) {
    return { type: 'create_project' };
  }

  // 2. Add Team Member (Logic from geminiVoiceService)
  const isInviteCommand = words[0] === 'add' || words[0] === 'invite' || words[0] === 'new' || words[0] === 'create';
  const hasContext = text.includes('member') || text.includes('team') || text.includes('@');

  if (isInviteCommand && hasContext) {
    return { type: 'add_team_member', params: { text } };
  }

  // 4. Leave/Time-off Management
  if (text.includes('leave') || text.includes('vacation') || text.includes('off') || text.includes('sick')) {
    const dateRegex = /(?:from|on|for)\s+([0-9a-z\s]+?)(?:\s+(?:to|until|till)\s+([0-9a-z\s]+))?$/i;
    const dateMatch = text.match(dateRegex);
    return {
      type: 'request_leave',
      params: {
        startDate: dateMatch ? dateMatch[1]?.trim() : 'today',
        endDate: dateMatch ? dateMatch[2]?.trim() : (dateMatch ? dateMatch[1]?.trim() : 'today'),
      }
    };
  }
  return null;
};

const parseDate = (d) => {
  const input = d.toLowerCase().trim();
  if (!input || input === 'today') return '2026-04-03';
  if (input === 'tomorrow') return '2026-04-04';
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

  const digitsOnly = input.replace(/\D/g, '');
  if (digitsOnly.length === 8) { 
    if (digitsOnly.startsWith('20')) return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 6)}-${digitsOnly.slice(6, 8)}`;
    return `${digitsOnly.slice(4, 8)}-${digitsOnly.slice(2, 4)}-${digitsOnly.slice(0, 2)}`;
  }
  if (digitsOnly.length === 4) return `2026-${digitsOnly.slice(2, 4)}-${digitsOnly.slice(0, 2)}`;
  if (digitsOnly.length >= 1 && digitsOnly.length <= 2) return `2026-04-${digitsOnly.padStart(2, '0')}`;

  return '2026-04-03';
};

const tests = [
  { transcript: "apply leave", expected: { type: 'request_leave', startDate: 'today' } },
  { transcript: "apply leave for 1504", expected: { type: 'request_leave', startDate: '1504' } },
  { transcript: "apply leave from 20052024 to 25052024", expected: { type: 'request_leave', startDate: '20052024', endDate: '25052024' } },
  { transcript: "create team member John", expected: { type: 'add_team_member' } },
  { transcript: "apply leave for 15", expected: { type: 'request_leave', startDate: '15' } },
];

console.log('Voice Command Logic Verification:');
tests.forEach(test => {
  const result = parseOfflineCommand(test.transcript);
  console.log(`\nInput: "${test.transcript}"`);
  if (!result) {
    console.log('  Result: FAILED (No match)');
    return;
  }
  console.log(`  Action: ${result.type}`);
  if (result.params) {
    const sDate = result.params.startDate ? parseDate(result.params.startDate) : 'n/a';
    const eDate = result.params.endDate ? parseDate(result.params.endDate) : 'n/a';
    console.log(`  Parsed Params: startDate=${result.params.startDate} -> ${sDate}, endDate=${result.params.endDate} -> ${eDate}`);
  }
});
