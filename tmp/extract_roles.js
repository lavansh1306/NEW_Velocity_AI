const fs = require('fs');
const path = require('path');

// Use relative paths or process.cwd()
const inputPath = path.resolve(__dirname, '../src/data/role_skills_map.json');
const outputPath = path.resolve(__dirname, '../src/data/curated_roles.json');

try {
  console.log('Reading from:', inputPath);
  const rawData = fs.readFileSync(inputPath, 'utf8');
  const data = JSON.parse(rawData);
  const roles = Object.keys(data);
  
  const categories = [
    'engineer', 'developer', 'designer', 'manager', 'analyst', 
    'hr', 'human resources', 'sales', 'marketing', 'product', 
    'quality', 'qa', 'architect', 'specialist', 'coordinator',
    'scientist', 'technician', 'consultant', 'accountant', 'legal'
  ];
  
  const selectedRoles = [];
  const rolesPerCategory = Math.ceil(200 / categories.length);
  const usedRoles = new Set();
  
  categories.forEach(cat => {
    let count = 0;
    for (const role of roles) {
      if (count >= rolesPerCategory) break;
      if (role.toLowerCase().includes(cat) && !usedRoles.has(role)) {
        const skills = data[role];
        if (skills && skills.length >= 4) {
          selectedRoles.push({
            role: role,
            skills: skills.slice(0, 5).map(s => s.trim())
          });
          usedRoles.add(role);
          count++;
        }
      }
    }
  });
  
  // Fill up if not enough
  if (selectedRoles.length < 150) {
    for (const role of roles) {
      if (selectedRoles.length >= 150) break;
      if (!usedRoles.has(role)) {
        const skills = data[role];
        if (skills && skills.length >= 4) {
           selectedRoles.push({
            role: role,
            skills: skills.slice(0, 5).map(s => s.trim())
          });
          usedRoles.add(role);
        }
      }
    }
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(selectedRoles, null, 2));
  console.log(`Successfully extracted ${selectedRoles.length} roles to ${outputPath}`);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
