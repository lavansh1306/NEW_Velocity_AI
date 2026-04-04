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
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    }
  }

  async parseIntent(transcript: string, currentPath: string): Promise<VoiceAction> {
    // 1. Direct command parser — zero latency, zero API
    const directAction = this.parseDirectCommand(transcript);
    if (directAction) {
      console.log('[GeminiVoice] Direct Command match:', directAction);
      return directAction;
    }

    // 2. Backend /api/voice/parse — handles Gemini→Groq→local fallback
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
      console.warn('[GeminiVoice] Backend failed, using local fallback:', e);
    }

    // 3. Final local fallback
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

    // 2. Add Team Member — forgiving parser handles accents and varied phrasing
    const roleMapping: Record<string, string> = {
      'front end': 'Frontend Developer',
      'frontend': 'Frontend Developer',
      'back end': 'Backend Developer',
      'backend': 'Backend Developer',
      'full stack': 'Full Stack Developer',
      'fullstack': 'Full Stack Developer',
      'full-stack': 'Full Stack Developer',
      'designer': 'Designer',
      'design': 'Designer',
      'ux': 'Designer',
      'ui': 'Designer',
      'product manager': 'Product Manager',
      'product': 'Product Manager',
      'manager': 'Product Manager',
      'qa': 'QA Engineer',
      'quality': 'QA Engineer',
      'tester': 'QA Engineer',
      'testing': 'QA Engineer',
      'developer': 'Developer',
      'dev': 'Developer',
      'develop': 'Developer',
      'engineer': 'Engineer',
      'engineering': 'Engineer',
      'coder': 'Developer',
      'programmer': 'Developer',
      'data': 'Data Engineer',
      'devops': 'DevOps Engineer',
      'mobile': 'Mobile Developer',
      'android': 'Mobile Developer',
      'ios': 'Mobile Developer',
    };

    const roles = Object.keys(roleMapping).sort((a, b) => b.length - a.length);

    // Very forgiving invite detection — just needs "add" or "invite" + a name-like word
    const isInviteCommand = 
      text.includes('add') || 
      text.includes('invite') || 
      text.includes('include') ||
      text.includes('bring') ||
      text.includes('onboard') ||
      text.includes('new member') ||
      text.includes('new team');

    // hasContext is now much looser — any name-like word after add/invite qualifies
    const hasRole = roles.some(r => text.includes(r));
    const hasEmail = text.includes('@');
    // Detect if there's a capitalized name-like word (person name)
    const words = text.split(/\s+/).map((w: string) => w.replace(/[.,!?;:]+$/, ''));
    const hasNameLikeWord = words.some((w: string) => w.length > 2 && /^[a-z]/.test(w));

    const hasContext = hasRole || hasEmail || hasNameLikeWord || text.includes('member') || text.includes('team');

    if (isInviteCommand && hasContext) {
      const cleanWords = words;
      let email = cleanWords.find((w: string) => w.includes('@')) || '';

      // Find role — try all role keys, longest first
      let role = 'Team Member';
      for (const r of roles) {
        if (text.includes(r)) {
          role = roleMapping[r];
          break;
        }
      }

      // Strip noise to find name — keep everything that's not a command/role word
      const commandNoise = new Set([
        'add', 'invite', 'include', 'bring', 'onboard', 'new',
        'team', 'member', 'for', 'as', 'is', 'a', 'an', 'the',
        'email', 'with', 'role', 'position', 'at', 'called',
        'named', 'and', 'to', 'my', 'our', 'please', 'can',
        'you', 'could', 'would', 'like', 'want', 'need',
      ]);

      // Also remove individual role words
      const roleWords = new Set(roles.flatMap((r: string) => r.split(' ')));

      let nameWords = cleanWords.filter((w: string) =>
        !commandNoise.has(w) &&
        !roleWords.has(w) &&
        !w.includes('@') &&
        w.length > 1
      );

      let nameCandidate = nameWords.join(' ').trim();

      // Clean up leftover "as X" at start
      nameCandidate = nameCandidate.replace(/^as\s+/i, '').trim();

      // If name is still empty but email exists, extract from email handle
      if (!nameCandidate && email) {
        const handle = email.split('@')[0];
        const doubled = handle.match(/^([a-z]{3,})$/);
        if (doubled) {
          nameCandidate = `${doubled[1]} ${doubled[1]}`;
        } else {
          nameCandidate = handle.replace(/[^a-zA-Z\s]/g, ' ').trim();
        }
      }

      // Capitalize name
      const finalName = nameCandidate
        .split(/\s+/)
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ') || 'New Member';

      if (email || nameCandidate) {
        return {
          type: 'add_team_member',
          params: { name: finalName, email, role },
          response: `Adding ${finalName} as ${role}.`
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
