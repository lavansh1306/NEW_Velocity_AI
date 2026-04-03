import { GoogleGenerativeAI } from '@google/generative-ai';
import { levenshteinDistance, phoneticNormalize, findBestMatch } from '@/lib/utils';

export interface VoiceAction {
  type: 'navigate' | 'create_task' | 'add_team_member' | 'delete_team_member' | 'create_project' | 'request_leave' | 'get_leave_status' | 'approve_leave' | 'deny_leave' | 'search' | 'info' | 'gantt_query' | 'resource_query' | 'unknown';
  target?: string;
  params?: {
    taskName?: string;
    name?: string;
    email?: string;
    role?: string;
    query?: string;
    projectTitle?: string;
    projectDescription?: string;
    projectName?: string; // Target project for a task
    assigneeName?: string; // Target team member for a task
    autoAnalyze?: boolean;
    startDate?: string;
    endDate?: string;
    leaveType?: string;
    reason?: string;
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

Action Categories & Parameters:
1. General Commands (Accessible to All Users):
   - navigate: { target: "/dashboard" | "/projects" | "/people" | "/plan" | "/settings" }
   - search: { query: "string" }
   - info: { response: "Natural spoken answer" } (For help/capabilities)
   - gantt_query: { query: "string" } (Timeline checks)
   - resource_query: { query: "string" } (Workload/capacity checks)
   - get_leave_status: { query: "string" } (Checking own leave status)

2. Manager/Admin Only Commands (RESTRICTED):
   - approve_leave: { name: "string" } (Approve a pending request)
   - deny_leave: { name: "string" } (Reject a pending request)
   - add_team_member: { name: "string", email: "string", role: "string" } (Invite new members)
   - delete_team_member: { name: "string" } (Remove members)
   - create_project: { projectTitle: "string", projectDescription: "string", autoAnalyze: boolean } (Plan new work)
   - create_task: { taskName: "string", projectName: "string (optional)", assigneeName: "string (optional)" } (Assign work)

3. Employee Commands (Accessible to All):
   - request_leave: { startDate: "string", endDate: "string", reason: "string" } (Apply for leave)

Rules:
- If a user tries a RESTRICTED command, STILL parse the intent correctly, but the system will handle the permission check.
- Extraction rules remain the same (extract as much detail as possible).
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
    "projectName": "string",
    "assigneeName": "string",
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
    if (!this.model) return this.summarizeDataLocally(data, query);

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
    } catch (error: any) {
      const isQuotaError = error.message?.includes('429') || error.message?.includes('quota');
      const isTimeout = error.message === 'Summarization Timeout';
      
      if (isQuotaError) {
        console.warn('[GeminiVoice] Quota exceeded. Falling back to Local Summarizer.');
      } else if (isTimeout) {
        console.warn('[GeminiVoice] Summarization timed out. Falling back to Local Summarizer.');
      } else {
        console.error('[GeminiVoice] Summarization failed:', error);
      }
      
      return this.summarizeDataLocally(data, query);
    }
  }

  private summarizeDataLocally(data: any, query: string): string {
    const text = query.toLowerCase();
    
    // 1. Handle Project Queries (Higher priority than general 'how many')
    if (data?.kpis && Array.isArray(data.kpis) && text.includes('project')) {
      const activeProjects = data.kpis.find((k: any) => k.label.includes('ACTIVE PROJECTS'))?.value;
      const atRisk = data.kpis.find((k: any) => k.label.includes('RISK'))?.value;
      return `Standard Mode: You have ${activeProjects || 0} active projects. ${atRisk > 0 ? `Note that ${atRisk} projects are currently marked as at risk.` : 'Everything looks on track.'}`;
    }

    // 2. Handle Resource/Team Queries
    if (data?.gantt && Array.isArray(data.gantt) && (text.includes('who') || text.includes('team') || text.includes('member') || (text.includes('how many') && !text.includes('project')))) {
      const count = data.gantt.length;
      return `Standard Mode: You have ${count} active team members currently allocated to projects.`;
    }

    // 2. Handle Deadlines
    if (data?.deadlines && Array.isArray(data.deadlines) && (text.includes('when') || text.includes('deadline') || text.includes('due'))) {
      if (data.deadlines.length === 0) return "Standard Mode: There are no upcoming deadlines in the next 30 days.";
      const next = data.deadlines[0];
      return `Standard Mode: Your next major deadline is for project ${next.project}, which is due in ${next.daysLeft} days.`;
    }

    // 3. Handle Dashboard KPIs
    if (data?.kpis && Array.isArray(data.kpis)) {
      const activeProjects = data.kpis.find((k: any) => k.label.includes('ACTIVE PROJECTS'))?.value;
      const utilization = data.kpis.find((k: any) => k.label.includes('UTILIZATION'))?.value;
      const capacity = data.kpis.find((k: any) => k.label.includes('CAPACITY'))?.value;
      const atRisk = data.kpis.find((k: any) => k.label.includes('RISK'))?.value;

      if (text.includes('project')) {
        return `Standard Mode: You have ${activeProjects || 0} active projects. ${atRisk > 0 ? `Note that ${atRisk} projects are currently marked as at risk.` : 'Everything looks on track.'}`;
      }
      
      if (text.includes('utilization') || text.includes('busy') || text.includes('workload')) {
        return `Standard Mode: The current team utilization is ${utilization || '0%'}.`;
      }

      if (text.includes('capacity') || text.includes('hours') || text.includes('available')) {
        return `Standard Mode: You have ${capacity || '0h'} of available capacity this week.`;
      }

      // Default Dashboard Summary (Last Resort)
      return `Standard Mode: You have ${activeProjects || 0} active projects with a team utilization of ${utilization || '0%'}.`;
    }

    return "Standard Mode: I have the data here, but I'm unable to generate a detailed summary at the moment.";
  }

  private fuzzyMatch(input: string, target: string, threshold = 0.3): boolean {
    if (!input || !target) return false;
    const distance = levenshteinDistance(input.toLowerCase(), target.toLowerCase());
    const maxLength = Math.max(input.length, target.length);
    return (distance / maxLength) <= threshold;
  }

  private normalizeTranscript(text: string): string {
    return text.toLowerCase()
      .replace(/^(hello|hi|hey|velocity|hero|bot|ai|please|can you|could you|would you|um|uh|err|like|kindly|just)\s+/g, '')
      .replace(/\s+(um|uh|err|like|please|and|then|kindly|now)\s+/g, ' ')
      .replace(/[.,!?;:]+$/, '') 
      .trim();
  }

  private parseOfflineCommand(transcript: string): VoiceAction | null {
    const text = this.normalizeTranscript(transcript);
    const words = text.split(' ');
    
    // 1. Navigation Shortcuts
    const navTargets: Record<string, string> = {
      'dashboard': '/dashboard',
      'dash': '/dashboard',
      'projects': '/projects',
      'project': '/projects',
      'team': '/people',
      'people': '/people',
      'roster': '/people',
      'plan': '/plan',
      'planner': '/plan',
      'planning': '/plan',
      'settings': '/settings',
      'config': '/settings',
      'ai': '/velocity-ai',
      'velocity': '/velocity-ai',
      'leave': '/leave',
      'vacation': '/leave'
    };

    // 1a. "Create Project" Specialization (Direct Navigation to AI Planner)
    const projectKeywords = ['add project', 'create project', 'new project', 'plan project', 'start project', 'setup project'];
    
    // Improved Project detection: Must contain 'project' and NOT be a task command
    const isTaskContext = text.includes('task');
    const isProjectCreate = (projectKeywords.some(kw => text.includes(kw)) || 
                           ((this.fuzzyMatch(words[0], 'create') || this.fuzzyMatch(words[0], 'add')) && text.includes('project')))
                           && !isTaskContext;

    if (isProjectCreate) {
      // Extract projectTitle and projectDescription
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
        params: { 
          projectTitle: title, 
          projectDescription: description,
          autoAnalyze: !!description 
        },
        response: description 
          ? `Sure, I'll set up that plan for ${title || 'the project'} and start the analysis.`
          : `Opening the project planner for you.`
      };
    }

    const navVerbs = ['go to', 'open', 'show', 'navigate to', 'take me to', 'view', 'switch to', 'move to', 'jump to', 'goto', 'visit'];
    const lastWord = words[words.length - 1];
    
    // Check for direct keyword or verb + keyword
    const bestNavMatch = findBestMatch(lastWord, Object.keys(navTargets), (s) => s);
    const hasNavVerb = navVerbs.some(v => text.includes(v)) || this.fuzzyMatch(words[0], 'open', 0.4);

    if (bestNavMatch && (hasNavVerb || words.length === 1)) {
      return { 
        type: 'navigate', 
        target: navTargets[bestNavMatch], 
        response: `Opening ${bestNavMatch}.` 
      };
    }

    // 1b. "Delete Team Member" Specialization (Direct Deletion)
    const isDeleteCommand = text.includes('delete') || text.includes('remove') || text.includes('fire') || 
                           this.fuzzyMatch(words[0], 'delete') || this.fuzzyMatch(words[0], 'remove');

    const isDeleteContext = text.includes('task') || text.includes('project') || text.includes('plan');

    if (isDeleteCommand && !isDeleteContext && (text.includes('member') || text.includes('team') || text.includes('person') || words.length > 2)) {
      const noise = ['delete', 'remove', 'fire', 'member', 'team', 'person', 'from', 'the', 'named', 'called', 'please'];
      const actionWords = words.filter(w => !noise.includes(w) && !this.fuzzyMatch(w, 'delete') && !this.fuzzyMatch(w, 'remove'));
      
      const cleanWords = actionWords.map(w => w.replace(/[.,!?;:]+$/, ''));
      const nameMatch = cleanWords.join(' ').trim();
      
      if (nameMatch) {
         return {
          type: 'delete_team_member',
          params: { name: nameMatch.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') },
          response: `Standard Mode: I'll help you remove ${nameMatch} from the team.`,
          requiresConfirmation: true 
        };
      }
    }

    // 1c. Task Creation (Robust Extraction)
    const isTaskCommand = text.includes('task') || 
                         this.fuzzyMatch(words[0], 'add') || 
                         this.fuzzyMatch(words[0], 'create') ||
                         this.fuzzyMatch(words[0], 'new');

    if (isTaskCommand && !isProjectCreate) {
      // Regex for "Add [Task] for [Project] project" or "Add [Task] to [Project]"
      // Support "a task" or "the task"
      const taskWithProjectRegex = /(?:add|create|new)\s+(?:a\s+|the\s+)?(?:task\s+)?(.*?)\s+(?:for|to|in)\s+(?:the\s+)?(.*?)(?:\s+project)?$/i;
      const match = text.match(taskWithProjectRegex);
      
      if (match) {
        return {
          type: 'create_task',
          params: {
            taskName: match[1]?.trim(),
            projectName: match[2]?.trim()
          },
          response: `Standard Mode: I'll add "${match[1]?.trim()}" to project "${match[2]?.trim()}".`
        };
      }

      // Fallback for just "Add task [Name]"
      const simpleTaskRegex = /(?:add|create|new)\s+(?:a\s+|the\s+)?task\s+(.*)/i;
      const simpleMatch = text.match(simpleTaskRegex);
      if (simpleMatch) {
         return {
          type: 'create_task',
          params: { taskName: simpleMatch[1]?.trim() },
          response: `Standard Mode: Adding task "${simpleMatch[1]?.trim()}" for you.`
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
    const isInviteCommand = this.fuzzyMatch(words[0], 'add') || 
                           this.fuzzyMatch(words[0], 'invite') || 
                           this.fuzzyMatch(words[0], 'new');
    
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


    // 4. Leave/Time-off Management
    if (text.includes('leave') || text.includes('vacation') || text.includes('off') || text.includes('sick')) {
      const isStatusQuery = text.includes('status') || text.includes('when') || text.includes('approved') || text.includes('how many');
      
      if (isStatusQuery) {
        return {
          type: 'get_leave_status',
          params: { query: text },
          response: "Checking your leave status..."
        };
      }

      // Check for Manager Approval/Denial
      const isApprove = text.includes('approve') || text.includes('confirm') || text.includes('allow');
      const isDeny = text.includes('deny') || text.includes('reject') || text.includes('cancel');

      if (isApprove || isDeny) {
         const noise = ['leave', 'vacation', 'off', 'sick', 'approve', 'confirm', 'allow', 'deny', 'reject', 'cancel', 'for', 'the', 'request', 'from'];
         const words = text.split(' ');
         const nameCandidates = words.filter(w => !noise.includes(w) && w.length > 2);
         const nameMatch = nameCandidates.join(' ').trim();

         return {
           type: isApprove ? 'approve_leave' : 'deny_leave',
           params: { name: nameMatch },
           response: `Standard Mode: I'll help you ${isApprove ? 'approve' : 'deny'} leave for ${nameMatch || 'them'}.`,
           requiresConfirmation: true
         };
      }

      // Request leave extraction
      const dateRegex = /(?:from|on)\s+([0-9a-z\s]+?)(?:\s+(?:to|until|till)\s+([0-9a-z\s]+))?$/i;
      const dateMatch = text.match(dateRegex);
      const reasonMatch = text.match(/(?:because|for|due to|reason)\s+(.+?)(?:\s+(?:from|on)|$)/i);

      return {
        type: 'request_leave',
        params: {
          startDate: dateMatch ? dateMatch[1]?.trim() : 'tomorrow',
          endDate: dateMatch ? dateMatch[2]?.trim() : (dateMatch ? dateMatch[1]?.trim() : 'tomorrow'),
          reason: reasonMatch ? reasonMatch[1]?.trim() : 'Personal'
        },
        response: `Standard Mode: I'll help you request leave for those dates.`,
        requiresConfirmation: true
      };
    }

    // 5. Search Intent
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
        response: "Standard Mode: I'll pull up that information for you."
      };
    }

    // 5. Help / Info Intent
    const isHelp = text.includes('help') || text.includes('what can you do') || text.includes('capabilities') || text.includes('commands');
    if (isHelp) {
      return {
        type: 'info',
        response: "Standard Mode: I can help you navigate, add tasks, manage team members, or plan new projects. Try saying 'Go to dashboard', 'Add task X for Y', or 'Planner'."
      };
    }

    // 6. Local Clarification (The "Final Autonomy" Fallback)
    if (words.length < 3) {
      if (this.fuzzyMatch(words[0], 'add') || this.fuzzyMatch(words[0], 'create')) {
        return { type: 'unknown', prompt: "I heard you want to add or create something. What would you like to add? A task, project, or member?" };
      }
      if (this.fuzzyMatch(words[0], 'delete') || this.fuzzyMatch(words[0], 'remove')) {
        return { type: 'unknown', prompt: "What or who would you like to delete?" };
      }
      if (this.fuzzyMatch(words[0], 'show') || this.fuzzyMatch(words[0], 'open')) {
        return { type: 'unknown', prompt: "Which section should I open? Dashboard, Projects, or Team?" };
      }
    }

    return null;
  }

}

export const geminiVoiceService = new GeminiVoiceService();
