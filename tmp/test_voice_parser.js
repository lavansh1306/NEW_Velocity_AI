
// Mocking utils.ts logic
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

// Logic from GeminiVoiceService.ts
function fuzzyMatch(input, target, threshold = 0.3) {
    if (!input || !target) return false;
    const distance = levenshteinDistance(input.toLowerCase(), target.toLowerCase());
    const maxLength = Math.max(input.length, target.length);
    return (distance / maxLength) <= threshold;
}

function normalizeTranscript(text) {
    return text.toLowerCase()
      .replace(/^(hello|hi|hey|velocity|hero|bot|ai|please|can you|could you|would you|um|uh|err|like|kindly|just)\s+/g, '')
      .replace(/\s+(um|uh|err|like|please|and|then|kindly|now)\s+/g, ' ')
      .replace(/[.,!?;:]+$/, '') 
      .trim();
}

function parseOfflineCommand(transcript) {
    const text = normalizeTranscript(transcript);
    const words = text.split(' ');
    
    // 1a. "Create Project" Specialization (Direct Navigation to AI Planner)
    const projectKeywords = ['add project', 'create project', 'new project', 'plan project', 'start project', 'setup project'];
    
    // Improved Project detection: Must contain 'project' and NOT be a task command
    const isTaskContext = text.includes('task');
    const isProjectCreate = (projectKeywords.some(kw => text.includes(kw)) || 
                           ((fuzzyMatch(words[0], 'create') || fuzzyMatch(words[0], 'add')) && text.includes('project')))
                           && !isTaskContext;

    if (isProjectCreate) {
      let title = '';
      let description = '';
      const nameMatch = text.match(/(?:named|called)\s+([^that|who|to|which|for]+)/i);
      const doingMatch = text.match(/(?:that does|to do|for doing|which does|that is)\s+(.+)/i);
      
      if (nameMatch) title = nameMatch[1].trim();
      if (doingMatch) description = doingMatch[1].trim();
      
      // Better fallback: Extract title from between "project" and "that/does/to/for"
      if (!title) {
        const projectPos = text.indexOf('project');
        if (projectPos !== -1) {
          const afterProject = text.slice(projectPos + 7).trim();
          const firstBreak = afterProject.split(/\s+(?:that|does|to|for|which|is)\s+/)[0];
          if (firstBreak && firstBreak.length > 0) {
            title = firstBreak;
          }
        }
      }
      
      return {
        type: 'create_project',
        params: { projectTitle: title, projectDescription: description }
      };
    }

    const isTaskCommand = text.includes('task') || 
                         fuzzyMatch(words[0], 'add') || 
                         fuzzyMatch(words[0], 'create') || 
                         fuzzyMatch(words[0], 'new');

    if (isTaskCommand && !isProjectCreate) {
      const taskWithProjectRegex = /(?:add|create|new)\s+(?:a\s+|the\s+)?(?:task\s+)?(.*?)\s+(?:for|to|in)\s+(?:the\s+)?(.*?)(?:\s+project)?$/i;
      const match = text.match(taskWithProjectRegex);
      
      if (match) {
        return {
          type: 'create_task',
          params: { taskName: match[1]?.trim(), projectName: match[2]?.trim() }
        };
      }
      
      const simpleTaskRegex = /(?:add|create|new)\s+(?:a\s+|the\s+)?task\s+(.*)/i;
      const simpleMatch = text.match(simpleTaskRegex);
      if (simpleMatch) {
         return {
          type: 'create_task',
          params: { taskName: simpleMatch[1]?.trim() }
        };
      }
    }
    return null;
}

// Test Suite
const testCases = [
    "Create project Website Redesign that does updating the landing page",
    "Add project Mobile App",
    "New project for tracking inventory",
    "Add task Fix login bug for Velocity AI project",
    "Create task Update CSS to the core project",
    "New task Drink water",
    "Add a task fix the header",
    "Setup project XYZ that is a new dashboard",
    "Add task Prepare report for the marketing project",
    "Create project Alpha",
    "New task review design for Alpha project"
];

console.log("--- Testing Voice Parser Results (FIXED) ---\n");
testCases.forEach(input => {
    const result = parseOfflineCommand(input);
    console.log(`[Input]:  ${input}`);
    if (result) {
        console.log(`[Type]:   ${result.type}`);
        console.log(`[Params]: ${JSON.stringify(result.params, null, 2)}`);
    } else {
        console.log(`[Result]: NO MATCH (Fallback to Gemini)`);
    }
    console.log("-".repeat(40));
});
