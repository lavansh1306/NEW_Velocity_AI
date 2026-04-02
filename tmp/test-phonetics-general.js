
const { levenshteinDistance, phoneticNormalize, findBestMatch } = require('./src/lib/utils_node_test.js');

const testCases = [
  { name: "Sophia", search: "Sofia", expected: true },
  { name: "John", search: "Jon", expected: true },
  { name: "Krish", search: "Krrish", expected: true },
  { name: "Michael", search: "Maikel", expected: true },
  { name: "Stephen", search: "Steven", expected: true },
  { name: "Sonia", search: "Sonya", expected: true },
  { name: "Alice", search: "Bob", expected: false }
];

console.log("PHONETIC_AUTONOMY_TEST_START");
testCases.forEach(tc => {
  const members = [{ name: tc.name }];
  const match = findBestMatch(tc.search, members, (m) => m.name);
  const result = !!match;
  console.log(`Searching for "${tc.search}" in [${tc.name}]: ${result ? 'PASS' : 'FAIL'} (Found: ${match?.name || 'None'})`);
});
console.log("PHONETIC_AUTONOMY_TEST_END");
