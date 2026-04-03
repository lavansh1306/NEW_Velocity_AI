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

    if (!this.model) {
      console.warn('[GeminiVoice] Gemini API not configured. Falling back to basic parsing.');
      return this.fallbackParse(transcript);
    }

    const systemPrompt = `
You are the voice assistant for Velocity AI — a workforce intelligence platform for engineering teams.
You help managers plan projects, allocate team members, check capacity, and navigate the app — all by voice.

## PRODUCT KNOWLEDGE
Velocity AI helps engineering managers:
- Plan projects using AI: describe a project and the AI breaks it into tasks with hour estimates
- Allocate team members to projects based on skills, capacity, and availability
- Track leave requests and team capacity in real time
- Monitor project health, timelines, and task completion
- Sync with Jira to import issues and track progress
- Connect Google Workspace to extract tasks from meeting transcripts automatically

Key features: AI project planner, team allocation, leave management, capacity tracking, Jira integration, Google Meet sync, voice commands.
Competitors: Glean (search/retrieval) and Minro (YC). Velocity AI is different because it takes ACTION — it doesn't just find information, it does things for you.

Current page the user is on: ${currentPath}

## YOUR JOB
Classify the user's voice input into one of these action types and return ONLY valid JSON.

## ACTION TYPES
1. navigate: Go to a page. { target: "/dashboard" | "/projects" | "/people" | "/plan" | "/leave" | "/settings" }
2. create_project: Plan or create a project. { projectTitle, projectDescription, autoAnalyze: true }
3. add_team_member: Add someone to the team. { name, email, role }
4. create_task: Create a task. { taskName }
5. delete_team_member: Remove someone from the team. { name }
6. search: Search for something. { query }
7. info: Answer a question about the product, features, or how things work. { response: "spoken answer in 1-2 sentences" }
8. gantt_query: Timeline or schedule questions. { query }
9. resource_query: Capacity or workload questions. { query }
10. unknown: Cannot determine intent. Use "prompt" to ask a clarifying question.

## RULES
- For "info" type: answer the question directly and conversationally in 1-2 sentences. Be helpful and specific about Velocity AI.
- For "delete_team_member": ALWAYS set requiresConfirmation: true.
- For "create_project": ALWAYS set autoAnalyze: true if any description is provided.
- NEVER say "standard mode", "default mode", or any mode preamble in the response field.
- The "response" field is what gets spoken aloud — keep it natural, brief, and human.
- If the user asks what Velocity AI does, what features it has, how something works — use type "info" and answer it.
- Respond ONLY with JSON. No markdown, no explanation outside the JSON.

## JSON FORMAT
{
  "type": "navigate|create_project|add_team_member|delete_team_member|create_task|search|info|gantt_query|resource_query|unknown",
  "target": "route if navigate",
  "params": {
    "projectTitle": "string",
    "projectDescription": "string",
    "autoAnalyze": true,
    "name": "string",
    "email": "string",
    "role": "string",
    "taskName": "string",
    "query": "string"
  },
  "response": "What to say aloud — no mode preamble, natural spoken language",
  "requiresConfirmation": false,
  "prompt": "Clarifying question if unknown"
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
        const parsed = JSON.parse(jsonMatch[0]) as VoiceAction;
        // Strip Gemini meta-commentary like "In standard mode," before speaking
        if (parsed.response) {
          parsed.response = parsed.response
            .replace(/^(in\s+)?(standard|default|normal)\s+mode[,.]?\s*/i, "")
            .replace(/^(okay|ok|sure)[,.]?\s+(in\s+)?(standard|default|normal)\s+mode[,.]?\s*/i, "")
            .trim();
          if (parsed.response.length > 0) {
            parsed.response = parsed.response.charAt(0).toUpperCase() + parsed.response.slice(1);
          }
        }
        return parsed;
      }
      
      return { type: 'unknown', response: "I'm not sure how to help with that yet." };
    } catch (error) {
      console.error('[GeminiVoice] Intent parsing failed:', error);
      return this.fallbackParse(transcript);
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
