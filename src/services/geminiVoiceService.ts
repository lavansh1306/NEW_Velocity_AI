import { GoogleGenerativeAI } from '@google/generative-ai';

export interface VoiceAction {
  type: 'navigate' | 'create_task' | 'add_team_member' | 'create_project' | 'search' | 'info' | 'unknown';
  target?: string;
  params?: {
    taskName?: string;
    name?: string;
    email?: string;
    role?: string;
    query?: string;
    projectTitle?: string;
    projectDescription?: string;
    autoAnalyze?: boolean;
  };
  response?: string;
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
    const directAction = this.parseDirectCommand(transcript);
    if (directAction) {
      console.log('[GeminiVoice] Using Direct Command:', directAction);
      return directAction;
    }

    if (!this.model) {
      console.warn('[GeminiVoice] Gemini API not configured. Falling back to basic parsing.');
      return this.fallbackParse(transcript);
    }

    const systemPrompt = `
You are the "Refining Layer" for Velocity AI's voice interface.
The fast local parser failed to match this transcript. Your job is to "rephrase" the messy transcript into a structured JSON command that the frontend can execute.

Current Page: ${currentPath}

Action Types & Parameters:
1. navigate: { target: "/dashboard" | "/projects" | "/people" | "/plan" | "/settings" }
2. create_project: { projectTitle: "string", projectDescription: "string", autoAnalyze: boolean } (Use this for "Add project", "Plan project", etc.)
3. add_team_member: { name: "string", email: "string", role: "string" }
4. create_task: { taskName: "string" }
5. search: { query: "string" }
6. info: { response: "Natural spoken answer" }

Rules:
- If the user wants to ADD or CREATE a project, ALWAYS use type "create_project" and target "/plan".
- If the user just wants to SEE or SHOW projects, use type "navigate" and target "/projects".
- Extract as much detail as possible for projectTitle and projectDescription.
- Respond ONLY with JSON.

JSON Structure:
{
  "type": "navigate" | "create_project" | "add_team_member" | "create_task" | "search" | "info" | "unknown",
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
  "response": "Brief spoken confirmation of what you extracted"
}
`;

    try {
      const result = await this.model.generateContent([
        { text: systemPrompt },
        { text: `User said: "${transcript}"` }
      ]);

      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as VoiceAction;
      }
      
      return { type: 'unknown', response: "I'm not sure how to help with that yet." };
    } catch (error) {
      console.error('[GeminiVoice] Intent parsing failed:', error);
      return this.fallbackParse(transcript);
    }
  }

  private normalizeTranscript(text: string): string {
    return text.toLowerCase()
      .replace(/^(hello|hi|hey|velocity|bot|ai|please|can you|could you)\s+/g, '')
      .trim();
  }

  private parseDirectCommand(transcript: string): VoiceAction | null {
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

    return null;
  }

  private fallbackParse(transcript: string): VoiceAction {
    const text = transcript.toLowerCase();
    
    // Quick basic fallback before LLM
    if (text.includes('dashboard')) return { type: 'navigate', target: '/dashboard', response: "Opening dashboard." };
    if (text.includes('project')) {
      if (text.includes('add') || text.includes('new') || text.includes('create')) {
        return { type: 'create_project', params: {}, response: "Opening project planner." };
      }
      return { type: 'navigate', target: '/projects', response: "Opening projects." };
    }
    
    return { type: 'unknown', response: "I heard you, but I'm not sure what you'd like me to do." };
  }
}

export const geminiVoiceService = new GeminiVoiceService();
