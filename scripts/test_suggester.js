const fs = require('fs');
const path = require('path');

const roleSkillsMap = require('../src/data/role_skills_map.json');
const skillsDictionary = require('../src/data/skills_dictionary.json');

function getSkillsForRole(role) {
  if (!role) return [];
  const normalizedRole = role.toLowerCase().trim();

  if (roleSkillsMap[normalizedRole]) {
    return roleSkillsMap[normalizedRole];
  }

  const matchedKeys = Object.keys(roleSkillsMap).filter(key => 
    normalizedRole.includes(key) || key.includes(normalizedRole)
  );

  if (matchedKeys.length > 0) {
    const combinedSkills = new Set();
    matchedKeys.forEach(key => {
      roleSkillsMap[key].forEach(s => combinedSkills.add(s));
    });
    return Array.from(combinedSkills);
  }
  return [];
}

console.log('--- Suggester Test Results ---');
console.log('Engineer Skills:', getSkillsForRole('engineer').slice(0, 4));
console.log('HR Manager Skills:', getSkillsForRole('human resources manager').slice(0, 4));
console.log('Total Skills in Dictionary:', skillsDictionary.length);

if (getSkillsForRole('engineer').length > 0) {
  console.log('✅ Success: sugerester accurately matched skills.');
} else {
  console.log('❌ Failed: no skills found for test item.');
}
