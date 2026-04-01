
function normalizeTranscript(text) {
  return text.toLowerCase()
    .replace(/^(hello|hi|hey|velocity|bot|ai|please|can you|could you)\s+/g, '')
    .trim();
}

function parseDirectCommand(transcript) {
  const text = normalizeTranscript(transcript);
  
  const roleMapping = {
    'front end': 'Frontend Developer',
    'frontend': 'Frontend Developer',
    'back end': 'Backend Developer',
    'backend': 'Backend Developer',
    'full stack': 'Full Stack Developer',
    'fullstack': 'Full Stack Developer',
    'designer': 'Designer',
    'design': 'Designer',
    'product manager': 'Product Manager',
    'manager': 'Product Manager',
    'qa': 'QA Engineer',
    'tester': 'QA Engineer',
    'developer': 'Frontend Developer',
    'engineer': 'Frontend Developer'
  };

  const roles = Object.keys(roleMapping).sort((a, b) => b.length - a.length);
  const isInviteCommand = text.includes('add') || text.includes('invite') || text.includes('new');
  const hasContext = text.includes('member') || text.includes('team') || text.includes('@') || roles.some(r => text.includes(r));

  if (isInviteCommand && hasContext) {
    const words = text.split(/\s+/);
    const cleanWords = words.map(w => w.replace(/[.,!?;:]+$/, ''));
    
    let email = cleanWords.find(w => w.includes('@')) || '';
    
    let role = 'Team Member';
    for (const r of roles) {
      if (text.includes(r)) {
        role = roleMapping[r];
        break;
      }
    }

    const commandNoise = ['add', 'invite', 'new', 'team', 'member', 'for', 'as', 'is', 'a', 'the', 'email', 'with', 'role', 'position', 'at', 'called', 'named', 'and'];
    const roleNoise = roles.flatMap(r => r.split(' '));
    const allNoise = [...commandNoise, ...roleNoise];
    
    let nameWords = cleanWords.filter(w => 
      !allNoise.includes(w) && 
      !w.includes('@') && 
      w.length > 1
    );
    
    let nameCandidate = nameWords.join(' ').replace(/^as\s+/, '').trim();
    
    // Heuristic: If name is missing but email is present, extract from email handle
    if (!nameCandidate && email) {
      let handle = email.split('@')[0];
      
      // Check for doubled name like 'krishkrish'
      const doubled = handle.match(/^([a-z]{3,})\1$/);
      if (doubled) {
        nameCandidate = `${doubled[1]} ${doubled[1]}`;
      } else {
        nameCandidate = handle.replace(/[^a-zA-Z]/g, ' ').trim();
      }
    }

    if (email || nameCandidate) {
      if (nameCandidate.toLowerCase().startsWith('as ')) {
        nameCandidate = nameCandidate.slice(3);
      }

      return {
        type: 'add_team_member',
        params: { 
          name: nameCandidate.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'New Member', 
          email: email, 
          role: role 
        },
        response: `Sure, I'll add ${nameCandidate || 'them'} as a ${role}.`
      };
    }
  }

  return null;
}

const testCases = [
  "add krishkrish@gmail.com as front end developer.",
  "add jonathan.smith@abc.com manager",
  "add mary mary@gmail.com"
];

testCases.forEach(tc => {
  console.log(`\nInput: "${tc}"`);
  console.log("Result:", JSON.stringify(parseDirectCommand(tc), null, 2));
});
