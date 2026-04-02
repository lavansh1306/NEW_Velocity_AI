
function levenshteinDistance(s1, s2) {
  if (!s1 || !s2) return Math.max(s1?.length || 0, s2?.length || 0);
  const track = Array(s2.length + 1).fill(null).map(() =>
    Array(s1.length + 1).fill(null));
  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator,
      );
    }
  }
  return track[s2.length][s1.length];
}

function phoneticNormalize(str) {
  return str.toLowerCase()
    .replace(/ph/g, 'f')
    .replace(/y/g, 'i')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/ck/g, 'k')
    .replace(/gh/g, 'g')
    .replace(/kn/g, 'n')
    .replace(/wr/g, 'r')
    .replace(/([^0-9a-z])|(.)(?=\2)/g, '')
    .trim();
}

function findBestMatch(input, items, getName, threshold = 0.3) {
  if (!input || items.length === 0) return null;
  const searchName = input.toLowerCase().trim();
  const searchPhonetic = phoneticNormalize(searchName);
  const exact = items.find(item => getName(item).toLowerCase().trim() === searchName);
  if (exact) return exact;
  const phonetic = items.find(item => phoneticNormalize(getName(item)) === searchPhonetic);
  if (phonetic) return phonetic;
  let bestMatch = null;
  let minScore = 1;
  for (const item of items) {
    const itemName = getName(item).toLowerCase().trim();
    const distance = levenshteinDistance(searchName, itemName);
    const score = distance / Math.max(searchName.length, itemName.length);
    if (score <= threshold && score < minScore) {
      minScore = score;
      bestMatch = item;
    }
  }
  return bestMatch;
}

module.exports = { levenshteinDistance, phoneticNormalize, findBestMatch };
