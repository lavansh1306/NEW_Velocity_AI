import { extractJSON } from '../src/lib/utils';

const testCases = [
  {
    name: 'Standard JSON',
    input: '{"type": "navigate", "target": "/dashboard"}',
    expectedType: 'navigate'
  },
  {
    name: 'Markdown Block',
    input: 'Here is the result:\n```json\n{"type": "create_task", "params": {"taskName": "Test"}}\n```\nHope that helps!',
    expectedType: 'create_task'
  },
  {
    name: 'Complex Preamble (Screenshot Case)',
    input: `Candidate: { name: "string" }.
Name extracted: "John Doe".
* type: "approve_leave"
* params: { "name": "John Doe" }
* response: "Approving the leave request for John Doe."
* requiresConfirmation: "true"

Valid JSON? Yes.
\`\`\`json
{
  "type": "approve_leave",
  "params": {
    "name": "John Doe"
  },
  "response": "I'll approve the leave request for John Doe.",
  "requiresConfirmation": true
}
\`\`\``,
    expectedType: 'approve_leave'
  },
  {
    name: 'Multiple Braces in Text',
    input: 'User profile { id: 123 } was updated. Command: { "type": "info", "response": "Success" }',
    expectedType: 'info'
  }
];

console.log('--- JSON Extraction Robustness Test ---');

testCases.forEach(tc => {
  const result = extractJSON<any>(tc.input);
  if (result && result.type === tc.expectedType) {
    console.log(`✅ [PASS] ${tc.name}`);
  } else {
    console.log(`❌ [FAIL] ${tc.name}`);
    console.log(`   Input: ${tc.input.slice(0, 50)}...`);
    console.log(`   Result:`, result);
  }
});
