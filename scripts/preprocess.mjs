import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const CSV_PATH = path.resolve('data/all_job_post.csv');
const OUTPUT_DIR = path.resolve('src/data');

function cleanSkillString(skillStr) {
  if (!skillStr) return [];
  try {
    // CSV skill format is mostly like: "['skill 1', 'skill 2']"
    // Using single-quote replacement for JSON Parse
    // Wait, let's do safe slicing instead
    const listStr = skillStr.trim();
    if (listStr.startsWith('[') && listStr.endsWith(']')) {
      return listStr
        .slice(1, -1) // remove [ and ]
        .split(',')
        .map(s => s.trim().replace(/^['"]|['"]$/g, '')) // remove surrounding quotes
        .filter(Boolean);
    }
  } catch (e) {
    // Fallback
  }
  return [];
}

function preprocess() {
  console.log('Reading CSV...');
  const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
  
  console.log('Parsing CSV...');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  const roleSkillsMap = {};
  const allSkills = new Set();

  console.log(`Processing ${records.length} records...`);

  for (const row of records) {
    const title = row.job_title ? row.job_title.toLowerCase().trim() : '';
    const skillList = cleanSkillString(row.job_skill_set);

    if (title && skillList.length > 0) {
      if (!roleSkillsMap[title]) {
        roleSkillsMap[title] = new Set();
      }
      skillList.forEach(skill => {
        const cleanSkill = skill.trim();
        roleSkillsMap[title].add(cleanSkill);
        allSkills.add(cleanSkill);
      });
    }
  }

  // Convert Sets to Arrays
  const finalMap = {};
  console.log('Cleaning mapping data...');
  for (const [title, skillSet] of Object.entries(roleSkillsMap)) {
    // Only save titles that have explicit data
    if (skillSet.size > 0) {
      finalMap[title] = Array.from(skillSet);
    }
  }

  const dictionary = Array.from(allSkills).sort();

  console.log('Creating Directory structure...');
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'role_skills_map.json'),
    JSON.stringify(finalMap, null, 2)
  );
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'skills_dictionary.json'),
    JSON.stringify(dictionary, null, 2)
  );

  console.log(`✅ Success!`);
  console.log(`Roles mapped: ${Object.keys(finalMap).length}`);
  console.log(`Unique skills listed: ${dictionary.length}`);
}

try {
  preprocess();
} catch (error) {
  console.error('❌ Failed processing:', error);
  process.exit(1);
}
