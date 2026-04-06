import { GoogleGenerativeAI } from '@google/generative-ai';

export interface VoiceAction {
  type:
    | 'navigate'
    | 'create_task'
    | 'add_team_member'
    | 'delete_team_member'
    | 'create_project'
    | 'search'
    | 'info'
    | 'gantt_query'
    | 'resource_query'
    | 'unknown';
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
  requiresConfirmation?: boolean;
  prompt?: string;
}

class GeminiVoiceService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
    }
  }

  async parseIntent(transcript: string, currentPath: string): Promise<VoiceAction> {
    const directAction = this.parseDirectCommand(transcript);
    if (directAction) {
      console.log('[GeminiVoice] Using Direct Command:', directAction);
      return directAction;
    }

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
You are the Voice Summary Layer for Velocity AI.
The user asked: "${query}"

Below is the raw JSON data related to their query.
Your job is to provide a brief, professional, spoken summary in 1 to 2 sentences.

Data:
${JSON.stringify(data, null, 2)}

Rules:
- Be concise
- Focus on the user's exact question
- Use natural spoken language
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
    return text
      .toLowerCase()
      .replace(/^(hello|hi|hey|velocity|hey velocity|ok velocity|bot|ai|please|can you|could you)\s+/g, '')
      .replace(/\bfront\s*end\b/g, 'frontend')
      .replace(/\bback\s*end\b/g, 'backend')
      .replace(/\bfull\s*stack\b/g, 'fullstack')
      .replace(/\badd\s+(.+?)\s+to\s+(frontend|backend|developer|engineer|designer|qa|tester|product manager|manager)\b/g, 'add $1 as $2')
      .replace(/[.,!?;:]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private parseDirectCommand(transcript: string): VoiceAction | null {
    const text = this.normalizeTranscript(transcript);

    const navTargets: Record<string, string> = {
      dashboard: '/dashboard',
      project: '/projects',
      projects: '/projects',
      team: '/people',
      people: '/people',
      plan: '/plan',
      setting: '/settings',
      settings: '/settings',
      ai: '/velocity-ai',
      velocity: '/velocity-ai'
    };

    const isProjectCreate =
      text.includes('add project') ||
      text.includes('create project') ||
      text.includes('new project') ||
      text.includes('plan project');

    if (isProjectCreate) {
      let title = '';
      let description = '';

      const nameMatch = text.match(/(?:named|called)\s+(.+?)(?=\s+(?:that does|to do|for doing|which does|that is)\s+|$)/i);
      const doingMatch = text.match(/(?:that does|to do|for doing|which does|that is)\s+(.+)/i);

      if (nameMatch) title = nameMatch[1].trim();
      if (doingMatch) description = doingMatch[1].trim();

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
          autoAnalyze: !!description
        },
        response: description
          ? `Sure, I'll set up that plan for ${title || 'the project'} and start the analysis.`
          : 'Opening the project planner for you.'
      };
    }

    if (
      text.startsWith('go to ') ||
      text.startsWith('open ') ||
      text.startsWith('show ') ||
      text.startsWith('take me to ')
    ) {
      const cleaned = text
        .replace(/^(go to|open|show|take me to)\s+/, '')
        .replace(/\b(the|page|screen|tab|section|me)\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      for (const [key, path] of Object.entries(navTargets)) {
        if (cleaned.includes(key)) {
          return {
            type: 'navigate',
            target: path,
            response: `Opening ${key}.`
          };
        }
      }
    }

    const isDeleteCommand = text.includes('delete') || text.includes('remove') || text.includes('fire');
    if (isDeleteCommand) {
      const noise = ['delete', 'remove', 'fire', 'member', 'team', 'person', 'from', 'the', 'named', 'called'];
      const words = text.split(/\s+/).filter(w => !noise.includes(w) && w.length > 1);
      const cleanWords = words.map(w => w.replace(/[.,!?;:]+$/, ''));
      const nameMatch = cleanWords.join(' ').trim();

      if (nameMatch) {
        return {
          type: 'delete_team_member',
          params: {
            name: nameMatch.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          },
          response: `I'll help you remove ${nameMatch} from the team.`,
          requiresConfirmation: true
        };
      }
    }

    const roleMapping: Record<string, string> = {
      frontend: 'Frontend Developer',
      backend: 'Backend Developer',
      fullstack: 'Full Stack Developer',
      designer: 'Designer',
      design: 'Designer',
      'product manager': 'Product Manager',
      manager: 'Product Manager',
      qa: 'QA Engineer',
      tester: 'QA Engineer',
      developer: 'Developer',
      engineer: 'Engineer',
      'data engineer': 'Data Engineer',
      data: 'Data Engineer'
    };

    const roles = Object.keys(roleMapping).sort((a, b) => b.length - a.length);

    const addPatterns = [
      /(?:^|\b)(?:add|invite|new)\s+([a-z]+(?:\s+[a-z]+)*)\s+(?:as\s+)?(data engineer|frontend|backend|fullstack|designer|design|product manager|manager|qa|tester|developer|engineer)\b/i,
      /^([a-z]+(?:\s+[a-z]+)*)\s+as\s+(?:a\s+)?(data engineer|frontend|backend|fullstack|designer|design|product manager|manager|qa|tester|developer|engineer)\b/i,
      /^add\s+([a-z]+(?:\s+[a-z]+)*)\s+(.+)$/i
    ];

    for (const pattern of addPatterns) {
      const match = text.match(pattern);
      if (!match) continue;

      const rawName = match[1]?.trim();
      const rawRoleText = match[2]?.trim().toLowerCase();

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

    return null;
  }

  private fallbackParse(transcript: string): VoiceAction {
    const text = this.normalizeTranscript(transcript);

    if (text.includes('dashboard')) {
      return { type: 'navigate', target: '/dashboard', response: 'Opening dashboard.' };
    }

    if (text.includes('project')) {
      if (text.includes('add') || text.includes('new') || text.includes('create')) {
        return { type: 'create_project', params: {}, response: 'Opening project planner.' };
      }
      return { type: 'navigate', target: '/projects', response: 'Opening projects.' };
    }

    if (text.includes('people') || text.includes('team')) {
      return { type: 'navigate', target: '/people', response: 'Opening people.' };
    }

    return {
      type: 'unknown',
      response: "Sorry, I'm having trouble understanding that command."
    };
  }
}

export const geminiVoiceService = new GeminiVoiceService();
