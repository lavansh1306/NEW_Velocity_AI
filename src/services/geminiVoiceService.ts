import { GoogleGenerativeAI } from '@google/generative-ai';

export interface VoiceAction {
  type: 'navigate' | 'create_task' | 'add_team_member' | 'delete_team_member' | 'create_project' | 'search' | 'info' | 'gantt_query' | 'resource_query' | 'unknown';
  target?: string;
  params?: {
    taskName?: string;
    name?: string;
    email?: string;
    role?: string;
    query?: string;
    projectTitle?: string;
    projectDescription?: string;
    projectName?: string; // NEW: Target project for a task
    autoAnalyze?: boolean;
  };
  response?: string;
  requiresConfirmation?: boolean; // NEW: Flag for high-risk actions
  prompt?: string; // NEW: For multi-turn clarifying questions
}

class GeminiVoiceService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Using Gemini 3 Flash Preview for cutting-edge speed and intelligence
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
    }
  }

  async parseIntent(transcript: string, currentPath: string): Promise<VoiceAction> {
    // 1. Try Direct Command Parsing first (Fast Path, No LLM Latency)
    const directAction = this.parseOfflineCommand(transcript);
    if (directAction) {
      console.log('[GeminiVoice] Using Offline Command:', directAction);
      return directAction;
    }

    if (!this.model) {
      console.warn('[GeminiVoice] Gemini API not configured. Using Standard Mode.');
      return this.parseOfflineCommand(transcript) || { type: 'unknown', response: "Gemini is unavailable and I couldn't match that command locally." };
    }

    const systemPrompt = `
You are the "Refining Layer" for Velocity AI's voice interface.
The fast local parser failed to match this transcript. Your job is to "rephrase" the messy transcript into a structured JSON command that the frontend can execute.

Current Page: ${currentPath}

Action Types & Parameters:
1. navigate: { target: "/dashboard" | "/projects" | "/people" | "/plan" | "/settings" }
2. create_project: { projectTitle: "string", projectDescription: "string", autoAnalyze: boolean } (Use this for "Add project", "Plan project", etc.)
3. add_team_member: { name: "string", email: "string", role: "string" }
4. create_task: { taskName: "string", projectName: "string (optional)" } (e.g., "Add task X to the Project Y")
5. delete_team_member: { name: "string" }
6. search: { query: "string" }
7. info: { response: "Natural spoken answer" }
8. gantt_query: { query: "string" } (Use for "What's the timeline?", "When is X due?")
9. resource_query: { query: "string" } (Use for "Who is busy?", "Who has the most tasks?")

Rules:
- If the user wants to DELETE or REMOVE a person/member, ALWAYS use type "delete_team_member".
- If the user wants to ADD or CREATE a project, ALWAYS use type "create_project" and target "/plan".
- If the user just wants to SEE or SHOW projects, use type "navigate" and target "/projects".
- Extract as much detail as possible for projectTitle and projectDescription.
- ALWAYS set "requiresConfirmation": true for "delete_team_member" or other destructive actions.
- If you are missing critical info (like a name for a member), set "type": "unknown" and use the "prompt" field to ask for it.
- Respond ONLY with JSON.

JSON Structure:
{
  "type": "navigate" | "create_project" | "add_team_member" | "delete_team_member" | "create_task" | "search" | "info" | "gantt_query" | "resource_query" | "unknown",
  "target": "string (optional)",
  "params": {
    "projectTitle": "string",
    "projectDescription": "string",
    "autoAnalyze": boolean,
    "name": "string",
    "email": "string",
    "role": "string",
    "taskName": "string",
    "query": "string"
  },
  "response": "Brief spoken confirmation of what you extracted",
  "requiresConfirmation": boolean,
  "prompt": "Optional question for the user"
}
`;

    try {
      // Add a 10-second timeout to prevent getting stuck
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Gemini API Timeout')), 10000)
      );

      const result = await Promise.race([
        this.model.generateContent([
          { text: systemPrompt },
          { text: `User said: "${transcript}"` }
        ]),
        timeoutPromise
      ]) as any;

      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as VoiceAction;
      }
      
      return { type: 'unknown', response: "I'm not sure how to help with that yet." };
    } catch (error: any) {
      if (error.message === 'Gemini API Timeout') {
        console.warn('[GeminiVoice] Gemini request timed out. Falling back to Standard Mode.');
      } else {
        console.error('[GeminiVoice] Intent parsing failed:', error);
      }
      return this.parseOfflineCommand(transcript) || { type: 'unknown', response: "Standard Mode couldn't match that command." };
    }
  }

  async summarizeData(data: any, query: string): Promise<string> {
    if (!this.model) return "I have the data, but I'm unable to summarize it right now.";

    const prompt = `
You are the "Voice Summary Layer" for Velocity AI. 
The user asked: "${query}"
Below is the raw JSON data related to their query. 
Your job is to provide a BRIEF (1-2 sentences), professional, and spoken summary.

Data:
${JSON.stringify(data, null, 2)}

Rules:
- Be concise.
- Focus on the specific question asked.
- Use natural, spoken language.
`;

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Summarization Timeout')), 8000)
      );

      const result = await Promise.race([
        this.model.generateContent(prompt),
        timeoutPromise
      ]) as any;

      return result.response.text().trim();
    } catch (error) {
      console.error('[GeminiVoice] Summarization failed:', error);
      return "I'm sorry, I'm having trouble summarizing that data right now.";
    }
  }

  private normalizeTranscript(text: string): string {
    return text.toLowerCase()
      .replace(/^(hello|hi|hey|velocity|bot|ai|please|can you|could you)\s+/g, '')
      .replace(/[.,!?;:]+$/, '') // Strip trailing punctuation
      .trim();
  }

  private parseOfflineCommand(transcript: string): VoiceAction | null {
    const text = this.normalizeTranscript(transcript);
    
    // 1. Navigation Shortcuts
    const navTargets: Record<string, string> = {
      'dashboard': '/dashboard',
      'project': '/projects',
      'team': '/people',
      'people': '/people',
      'plan': '/plan',
      'setting': '/settings',
      'ai': '/velocity-ai',
      'velocity': '/velocity-ai'
    };

    // 1a. "Create Project" Specialization (Direct Navigation to AI Planner)
    const isProjectCreate = text.includes('add project') || text.includes('create project') || text.includes('new project') || text.includes('plan project');
    if (isProjectCreate) {
      // Extract projectTitle and projectDescription
      // Variants: "Add a project named X that does Y" or "Create a project X to do Y"
      let title = '';
      let description = '';

      const nameMatch = text.match(/(?:named|called)\s+([^that|who|to|which|for]+)/i);
      const doingMatch = text.match(/(?:that does|to do|for doing|which does|that is)\s+(.+)/i);

      if (nameMatch) title = nameMatch[1].trim();
      if (doingMatch) description = doingMatch[1].trim();

      // If no description but text after "project"
      if (!description) {
        const afterProject = text.split(/project|new|plan/).pop()?.trim();
        if (afterProject && afterProject !== 'add' && afterProject !== 'create') {
          description = afterProject;
        }
      }

      return {
        type: 'create_project',
        params: { 
          projectTitle: title, 
          projectDescription: description,
          autoAnalyze: !!description // Only auto-analyze if we have a description
        },
        response: description 
          ? `Sure, I'll set up that plan for ${title || 'the project'} and start the analysis.`
          : `Opening the project planner for you.`
      };
    }

    if (text.startsWith('go to ') || text.startsWith('open ') || text.startsWith('show ')) {
      const targetStr = text.split(' ').slice(-1)[0].replace(/[.,!?;]$/, '');
      for (const [key, path] of Object.entries(navTargets)) {
        if (targetStr.includes(key)) {
          return { type: 'navigate', target: path, response: `Opening ${key}.` };
        }
      }
    }

    // 1b. "Delete Team Member" Specialization (Direct Deletion)
    const isDeleteCommand = text.includes('delete') || text.includes('remove') || text.includes('fire');
    if (isDeleteCommand && (text.includes('member') || text.includes('team') || text.includes('person') || text.split(/\s+/).length > 1)) {
      const noise = ['delete', 'remove', 'fire', 'member', 'team', 'person', 'from', 'the', 'named', 'called'];
      const words = text.split(/\s+/).filter(w => !noise.includes(w) && w.length > 1);
      
      // Clean words from punctuation as well
      const cleanWords = words.map(w => w.replace(/[.,!?;:]+$/, ''));
      const nameMatch = cleanWords.join(' ').trim();
      
      if (nameMatch) {
         return {
          type: 'delete_team_member',
          params: { name: nameMatch.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') },
          response: `I'll help you remove ${nameMatch} from the team.`,
          requiresConfirmation: true // High-risk action
        };
      }
    }

    // 2. Add Team Member (Robust Extraction)
    const roleMapping: Record<string, string> = {
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
        const handle = email.split('@')[0];
        // Split repeated names like 'krishkrish' -> 'Krish Krish'
        const doubled = handle.match(/^([a-z]{3,})\1$/);
        if (doubled) {
          nameCandidate = `${doubled[1]} ${doubled[1]}`;
        } else {
          nameCandidate = handle.replace(/[^a-zA-Z]/g, ' ').trim();
        }
      }

      if (email || nameCandidate) {
        if (nameCandidate.toLowerCase().startsWith('as ')) nameCandidate = nameCandidate.slice(3);

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

    // 3. Search Intent
    if (text.includes('search for') || text.includes('find') || text.includes('lookup')) {
      const query = text.replace(/search for|find|lookup/i, '').trim();
      if (query) {
        return {
          type: 'search',
          params: { query },
          response: `Searching for "${query}".`
        };
      }
    }

    // 4. Gantt/Resource Queries (Basic detection)
    if (text.includes('timeline') || text.includes('gantt') || text.includes('when is') || text.includes('due date')) {
      return {
        type: 'gantt_query',
        params: { query: text },
        response: "Let me check the project timeline for you."
      };
    }

    if (text.includes('who is busy') || text.includes('who has') || text.includes('workload') || text.includes('capacity') || text.includes('how many')) {
      return {
        type: 'resource_query',
        params: { query: text },
        response: "I'll pull up that information for you."
      };
    }

    // 5. Navigation Fallback (Stricter - requires a verb or clear intent)
    const navVerbs = ['go to', 'open', 'show', 'navigate to', 'take me to', 'view'];
    const hasNavVerb = navVerbs.some(v => text.includes(v));
    
    for (const [key, path] of Object.entries(navTargets)) {
      // Only navigate if it's a clear 'go to' command or ONLY the keyword was said
      if ((hasNavVerb && text.includes(key)) || text === key) {
        return { type: 'navigate', target: path, response: `Opening ${key}.` };
      }
    }

    return null;
  }

}

export const geminiVoiceService = new GeminiVoiceService();
