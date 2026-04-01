import { GoogleGenerativeAI } from '@google/generative-ai';

export interface VoiceAction {
  type: 'navigate' | 'create_task' | 'add_team_member' | 'search' | 'info' | 'unknown';
  target?: string;
  params?: Record<string, any>;
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
You are the voice interface for Velocity AI, a project management platform.
Analyze the user's voice transcript and determine their intent.

Current Page: ${currentPath}

Available Actions:
1. navigate: Change the page. Targets: /dashboard, /projects, /people, /plan, /settings, /velocity-ai.
2. create_task: Create a new project task. Extract task name as "taskName" in the params object.
3. add_team_member: Add a new member to the team. Extract "name", "email", and "role" (position) in the params object.
4. search: Search for projects or people. Extract the search query as "query" in the params object.
5. info: General questions about the platform or current view.

Rules:
- Respond ONLY with a JSON object.
- Include a "response" field with a short, natural spoken confirmation.

JSON Structure:
{
  "type": "navigate" | "create_task" | "add_team_member" | "search" | "info" | "unknown",
  "target": "string (URL for navigate)",
  "params": {
    "taskName": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "query": "string"
  },
  "response": "Brief spoken response"
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
      'developer': 'Frontend Developer', // default to frontend if generic
      'engineer': 'Frontend Developer'
    };

    const roles = Object.keys(roleMapping).sort((a, b) => b.length - a.length);
    const isInviteCommand = text.includes('add') || text.includes('invite') || text.includes('new');
    const hasContext = text.includes('member') || text.includes('team') || text.includes('@') || roles.some(r => text.includes(r));

    if (isInviteCommand && hasContext) {
      const words = text.split(/\s+/);
      const cleanWords = words.map(w => w.replace(/[.,!?;:]+$/, ''));
      
      let email = cleanWords.find(w => w.includes('@')) || '';
      
      // Identify role - match longest strings first
      let role = 'Team Member';
      for (const r of roles) {
        if (text.includes(r)) {
          role = roleMapping[r];
          break;
        }
      }

      // Filter noise to find the name
      const commandNoise = ['add', 'invite', 'new', 'team', 'member', 'for', 'as', 'is', 'a', 'the', 'email', 'with', 'role', 'position', 'at', 'called', 'named', 'and'];
      const roleNoise = roles.flatMap(r => r.split(' '));
      const allNoise = [...commandNoise, ...roleNoise];
      
      let nameWords = cleanWords.filter(w => 
        !allNoise.includes(w) && 
        !w.includes('@') && 
        w.length > 1 // skip single letters
      );
      
      let nameCandidate = nameWords.join(' ').replace(/^as\s+/, '').trim();
      
      if (email || nameCandidate) {
        // Double check name doesn't contain noise that filter missed
        if (nameCandidate.toLowerCase().startsWith('as ')) {
          nameCandidate = nameCandidate.slice(3);
        }

        return {
          type: 'add_team_member',
          params: { 
            name: nameCandidate.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'New Member', 
            email: email, 
            role: role 
          },
          response: `Sure, I'll add ${nameCandidate || 'them'} as a ${role}.`
        };
      }
    }

    // 3. Create Task
    if (text.startsWith('create task ') || text.startsWith('new task ')) {
      const taskName = text.replace(/^(create task|new task)\s+/, '');
      return {
        type: 'create_task',
        params: { taskName },
        response: `Creating task: ${taskName}`
      };
    }

    return null;
  }

  private fallbackParse(transcript: string): VoiceAction {
    const text = transcript.toLowerCase();
    
    if (text.includes('dashboard')) {
      return { type: 'navigate', target: '/dashboard', response: "Heading to your dashboard." };
    }
    if (text.includes('project')) {
      return { type: 'navigate', target: '/projects', response: "Opening your projects." };
    }
    if (text.includes('people') || text.includes('team')) {
      return { type: 'navigate', target: '/people', response: "Showing your team members." };
    }
    
    return { type: 'unknown', response: "I heard you, but I'm having trouble understanding the command." };
  }
}

export const geminiVoiceService = new GeminiVoiceService();
