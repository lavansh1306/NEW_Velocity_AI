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
    const directAction = this.parseDirectCommand(transcript);
    if (directAction) {
      console.log('[GeminiVoice] Using Direct Command:', directAction);
      return directAction;
    }

    // 2. Backend /api/voice/parse — Gemini→Groq→local fallback chain
    try {
      const res = await fetch('/api/voice/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, currentPath })
      });
      if (res.ok) {
        const data = await res.json() as VoiceAction & { provider?: string };
        console.log('[GeminiVoice] Backend success via:', data.provider);
        return data;
      }
    } catch (e) {
      console.warn('[GeminiVoice] Backend failed, local fallback:', e);
    }

    return this.fallbackParse(transcript);
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
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error('[GeminiVoice] Summarization failed:', error);
      return "I'm sorry, I'm having trouble summarizing that data.";
    }
  }

  private normalizeTranscript(text: string): string {
    return text.toLowerCase()
      .replace(/^(hello|hi|hey|velocity|bot|ai|please|can you|could you)\s+/g, '')
      .replace(/\badd\s+(.+?)\s+to\s+(frontend|front end|backend|back end|developer|engineer|designer|qa|tester|product manager|manager)\b/g, 'add $1 as $2')
      .replace(/[.,!?;:]+$/, '') // Strip trailing punctuation
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

    const statementPatterns = [
      /^add\s+(.+?)\s+as\s+a?n?\s+(.+)$/i,
      /^add\s+(.+?)\s+is\s+a?n?\s+(.+)$/i,
      /^(.+?)\s+is\s+a?n?\s+(.+)$/i,
      /^add\s+(.+?)\s+(.+)$/i
    ];

    for (const pattern of statementPatterns) {
      const match = text.match(pattern);
      if (!match) continue;

      const rawName = match[1].trim();
      const rawRoleText = match[2].trim().toLowerCase();

      let matchedRole = '';
      for (const r of roles) {
        if (rawRoleText.includes(r)) {
          matchedRole = roleMapping[r];
          break;
        }
      }

      if (rawName && matchedRole) {
        return {
          type: 'add_team_member',
          params: {
            name: rawName.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            role: matchedRole
          },
          response: `Sure, I'll add ${rawName} as a ${matchedRole}.`
        };
      }
    }
    const isInviteCommand = text.includes('add') || text.includes('invite') || text.includes('new');

    const forceAddMatch = text.match(/add\s+([a-z]+(?:\s+[a-z]+)*)\s+(?:as|is|to)?\s*(front end|frontend|back end|backend|full stack|fullstack|designer|design|product manager|manager|qa|tester|developer|engineer)/i);
    if (forceAddMatch) {
      const rawName = forceAddMatch[1].trim();
      const rawRole = forceAddMatch[2].trim().toLowerCase();
      const mappedRole = roleMapping[rawRole] || 'Team Member';

      return {
        type: 'add_team_member',
        params: {
          name: rawName.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          role: mappedRole
        },
        response: `Sure, I'll add ${rawName} as a ${mappedRole}.`
      };
    }
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
