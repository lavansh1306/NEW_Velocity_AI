import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function levenshteinDistance(s1: string, s2: string): number {
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

export function phoneticNormalize(str: string): string {
  return str.toLowerCase()
    .replace(/ph/g, 'f')
    .replace(/y/g, 'i')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/ck/g, 'k')
    .replace(/gh/g, 'g')
    .replace(/kn/g, 'n')
    .replace(/wr/g, 'r')
    .replace(/([^0-9a-z])|(.)(?=\2)/g, '') // Remove non-alpha and duplicates
    .trim();
}

/**
 * Tiered Search Algorithm:
 * 1. Exact Match (Case-insensitive)
 * 2. Phonetic Match (Sounds-like)
 * 3. Fuzzy Match (Levenshtein < 0.3 threshold)
 */
export function findBestMatch<T>(
  input: string, 
  items: T[], 
  getName: (item: T) => string, 
  threshold = 0.3
): T | null {
  if (!input || items.length === 0) return null;
  
  const searchName = input.toLowerCase().trim();
  const searchPhonetic = phoneticNormalize(searchName);

  // -- Tier 1: Exact Match --
  const exact = items.find(item => getName(item).toLowerCase().trim() === searchName);
  if (exact) return exact;

  // -- Tier 2: Phonetic Match --
  const phonetic = items.find(item => phoneticNormalize(getName(item)) === searchPhonetic);
  if (phonetic) return phonetic;

  // -- Tier 3: Fuzzy Match (Best Guess) --
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

/**
 * Robustly extracts JSON from a string that may contain preamble or markdown blocks.
 * Prioritizes the last valid JSON object found in the text.
 */
export function extractJSON<T>(text: string): T | null {
  if (!text) return null;
  
  // 1. Attempt to find specific markdown code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (typeof parsed === 'object' && parsed !== null) return parsed as T;
    } catch (e) {}
  }

  // 2. Brute-force heuristic: Find every potential { ... } pair and try to parse
  // We prioritize the last successful parse of a substantial object.
  let bestCandidate: T | null = null;
  const startIndices: number[] = [];
  
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      startIndices.push(i);
    } else if (text[i] === '}') {
      // Try to match with all previous '{' starting from the most recent
      for (let j = startIndices.length - 1; j >= 0; j--) {
        const start = startIndices[j];
        const candidate = text.substring(start, i + 1);
        try {
          const parsed = JSON.parse(candidate);
          if (typeof parsed === 'object' && parsed !== null) {
            // Check if this is a "better" candidate (e.g., has common voice action keys)
            const keys = Object.keys(parsed);
            if (keys.includes('type') || keys.includes('response') || keys.includes('params')) {
              bestCandidate = parsed as T;
              // If we found a high-quality candidate that's at the end of the string, we can stop
              if (i > text.length * 0.8) break; 
            } else if (!bestCandidate) {
              bestCandidate = parsed as T;
            }
          }
        } catch (e) {}
      }
    }
  }

  return bestCandidate;
}
