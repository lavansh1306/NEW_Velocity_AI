import roleSkillsMapRaw from '../data/role_skills_map.json';
import skillsDictionaryRaw from '../data/skills_dictionary.json';

const roleSkillsMap = roleSkillsMapRaw as Record<string, string[]>;
const skillsDictionary = skillsDictionaryRaw as string[];

/**
 * Looks up skills directly linked to a job title/role.
 * Supports exact match and fuzzy title inclusion.
 */
export function getSkillsForRole(role: string): string[] {
  if (!role) return [];
  const normalizedRole = role.toLowerCase().trim();

  // 1. Exact match
  if (roleSkillsMap[normalizedRole]) {
    return roleSkillsMap[normalizedRole];
  }

  // 2. Fuzzy inclusion mapping (e.g., "Sr. Front End Engineer" containing "engineer")
  const matchedKeys = Object.keys(roleSkillsMap).filter(key => 
    normalizedRole.includes(key) || key.includes(normalizedRole)
  );

  if (matchedKeys.length > 0) {
    const combinedSkills = new Set<string>();
    matchedKeys.forEach(key => {
      roleSkillsMap[key].forEach(s => combinedSkills.add(s));
    });
    return Array.from(combinedSkills);
  }

  return [];
}

/**
 * Scans a full block of raw text (e.g. from pasted bio or Jira description)
 * against the absolute list of skills.
 */
export function scanTextForSkills(text: string): string[] {
  if (!text) return [];
  const normalizedText = text.toLowerCase();
  
  // To avoid false positives (e.g. finding "C" in "Category"), 
  // we can safeguard searching containing words or spaces if needed,
  // but a simple inclusion scan is a fast primary filter.
  const detected = skillsDictionary.filter(skill => {
    const lowerSkill = skill.toLowerCase();
    // Safety check: Only match if surrounded by boundaries or is quite long
    if (lowerSkill.length <= 2) {
      const regex = new RegExp(`\\b${lowerSkill}\\b`, 'i');
      return regex.test(normalizedText);
    }
    return normalizedText.includes(lowerSkill);
  });

  return detected;
}
