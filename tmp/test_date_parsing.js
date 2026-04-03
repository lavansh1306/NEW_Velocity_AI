const parseDate = (d) => {
  const input = d.toLowerCase().trim();
  if (input === 'tomorrow') {
    const date = new Date('2026-04-03'); // Mocking "today" as 2026-04-03
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  }
  if (input === 'today' || !input) return new Date('2026-04-03').toISOString().split('T')[0];

  // 1. Check for DDMMYYYY or DDMM formats
  const digitsOnly = input.replace(/\D/g, '');
  if (digitsOnly.length === 8) { // DDMMYYYY
    const day = digitsOnly.slice(0, 2);
    const month = digitsOnly.slice(2, 4);
    const year = digitsOnly.slice(4, 8);
    return `${year}-${month}-${day}`;
  }
  if (digitsOnly.length === 4) { // DDMM
    const day = digitsOnly.slice(0, 2);
    const month = digitsOnly.slice(2, 4);
    const year = 2026; // Mocking current year
    return `${year}-${month}-${day}`;
  }

  // 2. Standard JS Date parsing
  try {
    const parsed = new Date(input);
    if (!isNaN(parsed.getTime())) {
      // If no year specified, JS might use a default. Let's force it to 2026 if it looks reasonable
      if (parsed.getFullYear() < 2000) parsed.setFullYear(2026);
      return parsed.toISOString().split('T')[0];
    }
  } catch {}

  return new Date('2026-04-03').toISOString().split('T')[0];
};

const testCases = [
  'today',
  'tomorrow',
  '15042024',
  '1504',
  '15 April',
  'May 20th',
  '',
  'invalid'
];

console.log('Date Parsing Tests:');
testCases.forEach(t => {
  console.log(`"${t}" => ${parseDate(t)}`);
});
