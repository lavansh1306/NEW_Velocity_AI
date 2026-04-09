import { GoogleGenerativeAI } from '@google/generative-ai';
import { levenshteinDistance, phoneticNormalize, findBestMatch } from '@/lib/utils';

export interface VoiceAction {
  type: 'navigate' | 'create_task' | 'assign_task' | 'update_task' | 'delete_task' | 'add_team_member' | 'delete_team_member' | 'create_project' | 'update_project' | 'delete_project' | 'request_leave' | 'get_leave_status' | 'approve_leave' | 'deny_leave' | 'search' | 'info' | 'gantt_query' | 'resource_query' | 'unknown';
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
    fromAssigneeName?: string; // For "switch" commands
    autoAnalyze?: boolean;
    startDate?: string;
    endDate?: string;
    leaveType?: string;
    reason?: string;
    status?: string; // For marking tasks as done/incomplete
    newTitle?: string; // For renaming
    newDescription?: string;
  };
  response?: string;
  requiresConfirmation?: boolean; // NEW: Flag for high-risk actions
  prompt?: string; // NEW: For multi-turn clarifying questions
}

class GemmaVoiceService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Using Gemma 4 31B IT for expert reasoning and multilingual support
      this.model = this.genAI.getGenerativeModel({ model: 'models/gemma-4-31b-it' });
    }
  }

  async parseIntent(transcript: string, currentPath: string, lastContext?: any): Promise<VoiceAction> {
    // 1. Try Direct Command Parsing first (Fast Path, No LLM Latency)
    const directAction = this.parseOfflineCommand(transcript);
    if (directAction) {
      console.log('[Gemma4Voice] Using Offline Command:', directAction);
      return directAction;
    }

    if (!this.model) {
      console.warn('[VoiceIntelligence] Engine not configured. Using local parser.');
      return this.parseOfflineCommand(transcript) || { type: 'unknown', response: "I'm having trouble connecting to my brain. Let me try that again locally." };
    }

    const systemPrompt = `
You are the "Humanized Intelligence" for Velocity AI. You aren't just a parser; you're a helpful, professional colleague who simplifies project planning and team management.

## PERSONA & TONE:
- Professional yet warm. Avoid robotic AI prefixes.
- Speak like a real person. MANDATORY: Always provide a natural "response" string for the user to hear.
- MULTILINGUAL (HINGLISH): Native understanding of mixed Hindi-English (e.g., "X ko add kardo").

Current Page Context: ${currentPath}
Last Interacted Object: ${lastContext ? JSON.stringify(lastContext) : 'None'}

## CAPABILITIES (JSON MAPPING):
1. [NAVIGATE] target: "/dashboard", "/projects", "/people", "/plan", "/leave"
2. [CREATE_PROJECT] projectTitle, projectDescription, autoAnalyze: true
3. [UPDATE_PROJECT] projectTitle (current or new), newTitle, newDescription
4. [DELETE_PROJECT] projectTitle (REQUIRES confirmation)
5. [ADD_TEAM_MEMBER] name, email, role
6. [DELETE_TEAM_MEMBER] name (REQUIRES confirmation)
7. [CREATE_TASK] taskName, projectName, assigneeName
8. [UPDATE_TASK] taskName, status ("completed", "not_started"), newTitle, assigneeName
9. [ASSIGN_TASK] taskName, assigneeName, fromAssigneeName
10. [DELETE_TASK] taskName (REQUIRES confirmation)
11. [INFO] General workspace questions or queries about health, status, metrics.
12. [RESOURCE_QUERY] (for "health", "status", "projects count", "utilization").

## CONTEXTUAL RULES:
- If the user says "it", "that", or "this", refer to the 'Last Interacted Object'.
- If the user says "mark it as done", map to [UPDATE_TASK] with status: "completed" for the last task.
- If the user says "rename it to X", map to [UPDATE_TASK] or [UPDATE_PROJECT] with newTitle: "X".

## CORE RULES:
- HINGLISH: "kitne" (how many), "status kya hai", "dikhao" (show).
- NO BRANDING: NEVER mention "Gemini", "Gemma", or "AI". Just answer like a person.
- NO HALLUCINATION: Never make up data or provide placeholder numbers (like "72%" or "General Tasks"). If data is missing or a parameter is unclear, ask the user for clarification.
- NO MARKDOWN Symbols: Never use asterisks (*) or symbols in the "response" field.

JSON STRUCTURE:
{
  "type": "navigate" | "create_project" | "update_project" | "delete_project" | "add_team_member" | "delete_team_member" | "create_task" | "update_task" | "assign_task" | "delete_task" | "info" | "resource_query" | "request_leave" | "unknown",
  "params": { ... },
  "response": "A natural, helpful spoken response (Mandatory)",
  "requiresConfirmation": boolean
}

EXAMPLES:
"What is the health score?" -> { "type": "resource_query", "params": { "query": "health" }, "response": "I'm checking the current health score for you." }
"Kitane projects hai?" -> { "type": "resource_query", "params": { "query": "projects" }, "response": "Let me count the active projects for you." }
`;

    try {
      // Add a 10-second timeout to prevent getting stuck
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Gemma 4 API Timeout')), 30000)
      );

      const result = await Promise.race([
        this.model.generateContent([
          { text: systemPrompt },
          { text: `User said: "${transcript}"` }
        ]),
        timeoutPromise
      ]) as any;

      const responseText = result.response.text();
      const cleanedText = this.extractFirstJson(responseText);

      try {
        const action = JSON.parse(cleanedText);
        const normalizedAction: VoiceAction = {
          type: (action.type || action.action || 'unknown').toLowerCase() as any,
          params: action.params || action.data || action.parameters || {},
          response: action.response || action.answer || action.message || action.info || action.text || "",
          requiresConfirmation: action.requiresConfirmation ?? false
        };
        
        console.log('[Gemma4Voice] Normalized action:', normalizedAction);
        return normalizedAction;
      } catch (e) {
        console.error('[Gemma4Voice] Failed to parse extracted JSON:', cleanedText);
        // Fallback to offline
        return this.parseOfflineCommand(transcript) || { type: 'unknown', response: "I'm having trouble understanding. Could you rephrase?" };
      }
    } catch (error: any) {
      if (error.message === 'Gemma 4 API Timeout') {
        console.warn('[VoiceIntelligence] Request timed out. Falling back to local parser.');
      } else {
        console.error('[VoiceIntelligence] Intent parsing failed:', error);
      }
      const fallback = this.parseOfflineCommand(transcript);
      if (fallback) return fallback;
      return { type: 'unknown', response: "I'm having trouble connecting to my brain. Let me try that again locally." };
    }
  }

  async summarizeData(data: any, query: string): Promise<string> {
    if (!this.model) return this.summarizeDataLocally(data, query);

    // Minimize data before sending to avoid token confusion
    const conciseData = {
      kpis: data.kpis || [],
      deadlineCount: data.deadlines?.length || 0,
      nextDeadline: data.deadlines?.[0]?.project || 'None',
      teamCount: data.gantt?.length || 0,
    };

    const prompt = `You are a helpful project manager colleague. 
Summarize the following project data relative to the user's question: "${query}"
Data: ${JSON.stringify(conciseData)}

Answer in ONE natural, complete sentence for a human to hear. No markdown. No special symbols.
Final Answer:`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text().trim();
      
      // AGGRESSIVE EXTRACTION
      let cleanText = text;
      const markers = [/Final Answer:\s*/gi, /Answer:\s*/gi, /Response:\s*/gi];
      for (const marker of markers) {
        if (cleanText.match(marker)) {
          cleanText = cleanText.split(marker).pop() || cleanText;
          break;
        }
      }

      // Final scrubbing: Remove any accidental prompt leakage or markdown
      cleanText = cleanText
        .replace(/^(Draft \d+|Final Answer|Response|Answer|User Query|Role|Question|Data):?\s*/gi, '')
        .replace(/[*#_~`\[\]()|>]/g, '')
        .split('\n')[0] // Only take the first line
        .trim();

      return cleanText || this.summarizeDataLocally(data, query);
    } catch (e) {
      console.error('[GemmaVoice] Summarization failed, using local fallback:', e);
      return this.summarizeDataLocally(data, query);
    }
  }

  private summarizeDataLocally(data: any, query: string): string {
    const text = query.toLowerCase();
    
    // 1. Dashboard Metrics / KPIs
    if (data?.kpis && Array.isArray(data.kpis)) {
      const activeProjects = data.kpis.find((k: any) => k.label.includes('ACTIVE PROJECTS'))?.value;
      const utilization = data.kpis.find((k: any) => k.label.includes('UTILIZATION'))?.value;
      const capacity = data.kpis.find((k: any) => k.label.includes('CAPACITY'))?.value;
      const atRisk = data.kpis.find((k: any) => k.label.includes('RISK'))?.value;
      const healthScore = data.kpis.find((k: any) => k.label.includes('HEALTH') || k.label.includes('SCORE'))?.value;

      if (text.includes('health') || text.includes('score')) {
        if (!healthScore) return "I'm sorry, I couldn't find a current health score in the dashboard metrics.";
        return `The current project health score is ${healthScore} out of 100. ${atRisk > 0 ? `I've flagged ${atRisk} projects at risk that need your attention.` : 'All projects are currently in a healthy state.'}`;
      }

      if (text.includes('project')) {
        return `You have ${activeProjects || 0} active projects. ${atRisk > 0 ? `Note that ${atRisk} projects are currently marked as at risk.` : 'Everything looks on track.'}`;
      }
      
      if (text.includes('utilization') || text.includes('busy') || text.includes('workload')) {
        return `The current team utilization is ${utilization || '0%'}. The team is currently at ${capacity || 'optimal'} capacity.`;
      }

      if (text.includes('status')) {
        if (!activeProjects && !utilization) return "I checked the dashboard, but there are no active projects or utilization metrics to report right now.";
        return `We have ${activeProjects || 0} active projects. The overall team utilization is ${utilization || '0%'} and the health score is ${healthScore || 'unavailable'}.`;
      }
    }

    // 2. Resource/Team Queries
    if (data?.gantt && Array.isArray(data.gantt) && (text.includes('who') || text.includes('team') || text.includes('member') || (text.includes('how many') && !text.includes('project')))) {
      const count = data.gantt.length;
      return `You have ${count} active team members currently allocated across projects.`;
    }

    // 3. Deadlines
    if (data?.deadlines && Array.isArray(data.deadlines) && (text.includes('when') || text.includes('deadline') || text.includes('due'))) {
      if (data.deadlines.length === 0) return "There are no upcoming major deadlines in the next 30 days.";
      const next = data.deadlines[0];
      return `Your next major deadline is for project ${next.project}, which is due in ${next.daysLeft} days.`;
    }

    return "I found the dashboard data, but I couldn't identify the specific metric you're asking about. Would you like me to open the projects page?";
  }

  private fuzzyMatch(input: string, target: string, threshold = 0.3): boolean {
    if (!input || !target) return false;
    const distance = levenshteinDistance(input.toLowerCase(), target.toLowerCase());
    const maxLength = Math.max(input.length, target.length);
    return (distance / maxLength) <= threshold;
  }

  private extractFirstJson(text: string): string {
    if (!text) return '';
    
    // Find the first occurrence of '{' and matching '}'
    let depth = 0;
    let firstOpen = -1;
    
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '{') {
        if (depth === 0) firstOpen = i;
        depth++;
      } else if (text[i] === '}') {
        depth--;
        if (depth === 0 && firstOpen !== -1) {
          return text.substring(firstOpen, i + 1);
        }
      }
    }
    
    // Fallback to regex if manual balance fails
    const match = text.match(/\{[\s\S]*?\}/);
    return match ? match[0] : text;
  }

  private normalizeTranscript(text: string): string {
    return text.toLowerCase()
      .replace(/^(hello|hi|hey|velocity|bot|ai|please|can you|could you|would you|um|uh|err|like|kindly|just)\s+/g, '')
      .replace(/\s+(um|uh|err|like|please|and|then|kindly|now)\s+/g, ' ')
      .replace(/[.,!?;:]+$/, '') 
      .trim();
  }

  private parseOfflineCommand(transcript: string): VoiceAction | null {
    const text = this.normalizeTranscript(transcript);
    const words = text.split(' ');
    
    // 1. Navigation Shortcuts
    const navTargets: Record<string, string> = {
      'dashboard': '/dashboard', 'dash': '/dashboard',
      'projects': '/projects', 'project': '/projects',
      'team': '/people', 'people': '/people', 'roster': '/people',
      'plan': '/plan', 'planner': '/plan', 'planning': '/plan',
      'settings': '/settings', 'config': '/settings',
      'ai': '/velocity-ai', 'velocity': '/velocity-ai',
      'leave': '/leave', 'vacation': '/leave', 'time off': '/leave'
    };

    // Hinglish Mapping for Navigation
    if (text.includes('dikhao') || text.includes('dikao') || text.includes('ley jao')) {
      for (const [key, path] of Object.entries(navTargets)) {
        if (text.includes(key)) return { type: 'navigate', target: path, response: `Bilkul, main aapko ${key} par le chalta hoon.` };
      }
    }

    const isNav = text.includes('go') || text.includes('open') || text.includes('show') || text.includes('navigate') || text.includes('take me');
    for (const [key, path] of Object.entries(navTargets)) {
      if (text.includes(key) && (isNav || words.length === 1)) {
        return { type: 'navigate', target: path, response: `Opening ${key} for you.` };
      }
    }

    // 2. Project Creation
    const projectKeywords = ['add project', 'create project', 'new project', 'plan project', 'start project', 'setup project'];
    const isProjectCreate = projectKeywords.some(kw => text.includes(kw)) && !text.includes('task');

    if (isProjectCreate) {
      const nameMatch = text.match(/(?:named|called)\s+([^that|who|to|which|for]+)/i);
      const title = nameMatch ? nameMatch[1].trim() : text.split('project').pop()?.trim() || '';
      return {
        type: 'create_project',
        params: { projectTitle: title, autoAnalyze: true },
        response: `Sure, I'll set up that plan for ${title || 'the project'}.`
      };
    }

    // 3. Task Creation
    const isTaskCommand = text.includes('task') || this.fuzzyMatch(words[0], 'add') || this.fuzzyMatch(words[0], 'create');
    if (isTaskCommand && !isProjectCreate) {
      const taskWithProjectRegex = /(?:add|create|new)\s+(?:a\s+|the\s+)?(?:task\s+)?(.*?)\s+(?:for|to|in)\s+(?:the\s+)?(.*?)(?:\s+project)?$/i;
      const match = text.match(taskWithProjectRegex);
      if (match) {
        return {
          type: 'create_task',
          params: { taskName: match[1]?.trim(), projectName: match[2]?.trim() },
          response: `Got it. Adding "${match[1]?.trim()}" to project "${match[2]?.trim()}".`
        };
      }
      const simpleTaskRegex = /(?:add|create|new)\s+(?:a\s+|the\s+)?task\s+(.*)/i;
      const simpleMatch = text.match(simpleTaskRegex);
      if (simpleMatch) {
        return {
          type: 'create_task',
          params: { taskName: simpleMatch[1]?.trim() },
          response: `Adding task "${simpleMatch[1]?.trim()}" to your active list.`
        };
      }
    }

    // 4. Team Management (Add/Remove)
    const isTeamCommand = text.includes('member') || text.includes('team') || text.includes('person') || text.includes('add') || text.includes('invite') || text.includes('remove');
    if (isTeamCommand) {
      const roleMapping: Record<string, string> = {
        'frontend': 'Frontend Developer', 'backend': 'Backend Developer', 'fullstack': 'Full Stack Developer',
        'designer': 'Designer', 'manager': 'Product Manager', 'qa': 'QA Engineer'
      };
      const isAdd = text.includes('add') || text.includes('invite') || text.includes('onboard') || text.includes('kardo');
      const isRemove = text.includes('remove') || text.includes('delete') || text.includes('fire');

      if (isAdd) {
        let role = 'Team Member';
        for (const [key, val] of Object.entries(roleMapping)) {
          if (text.includes(key)) { role = val; break; }
        }
        const email = text.split(/\s+/).find(w => w.includes('@')) || '';
        const nameMatch = text.match(/(?:add|invite|onboard)\s+(?:member\s+)?([^as|for|with|@]+)/i);
        const name = nameMatch ? nameMatch[1].trim() : 'New Member';
        return {
          type: 'add_team_member',
          params: { name: name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), email, role },
          response: `Sure, I'll add ${name} as a ${role} for you.`
        };
      }

      if (isRemove) {
        const isTask = text.includes('task');
        const isProject = text.includes('project') && !isTask;
        
        if (isProject) {
          const nameMatch = text.match(/(?:remove|delete|fire)\s+(?:project\s+)?([^from|please|the]+)/i);
          const name = nameMatch ? nameMatch[1].trim() : 'project';
          return {
            type: 'delete_project',
            params: { projectTitle: name },
            response: `I'll help you delete the project ${name}.`,
            requiresConfirmation: true
          };
        }

        if (isTask) {
           const nameMatch = text.match(/(?:remove|delete|fire)\s+(?:task\s+)?([^from|please|the]+)/i);
           const name = nameMatch ? nameMatch[1].trim() : 'task';
           return {
             type: 'delete_task',
             params: { taskName: name },
             response: `I'll help you remove the task "${name}".`,
             requiresConfirmation: true
           };
        }

        const nameMatch = text.match(/(?:remove|delete|fire)\s+(?:member\s+)?([^from|please|the]+)/i);
        const name = nameMatch ? nameMatch[1].trim() : 'member';
        return {
          type: 'delete_team_member',
          params: { name: name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') },
          response: `I'll help you remove ${name} from the team.`,
          requiresConfirmation: true
        };
      }
    }

    // 5. Analytics (Hinglish Supported)
    if (text.includes('kitane') || text.includes('kitne') || text.includes('how many')) {
      if (text.includes('project')) return { type: 'resource_query', params: { query: 'projects' }, response: "Checking total projects..." };
      if (text.includes('member') || text.includes('log')) return { type: 'resource_query', params: { query: 'team' }, response: "Checking team count..." };
      return { type: 'resource_query', params: { query: text }, response: "I'll pull up those numbers for you." };
    }

    if (text.includes('status kya hai') || text.includes('kya chal raha hai') || text.includes('what is the status') || text.includes('health') || text.includes('score')) {
      const isHealth = text.includes('health') || text.includes('score');
      return { 
        type: 'resource_query', 
        params: { query: isHealth ? 'health' : 'status' }, 
        response: isHealth ? "I'm pulling up the project health report for you." : "Checking your current status and metrics now." 
      };
    }

    // 6. Multi-turn Clarification (Local)
    if (words.length < 3) {
      if (this.fuzzyMatch(words[0], 'add') || this.fuzzyMatch(words[0], 'create')) {
        return { type: 'unknown', response: "Kise add ya create karna hai? Task ya team member?", prompt: "What would you like to add? A task, project, or team member?" };
      }
      if (this.fuzzyMatch(words[0], 'delete') || this.fuzzyMatch(words[0], 'remove')) {
        return { type: 'unknown', response: "Kise remove karna hai?", prompt: "Who or what should I remove?" };
      }
    }

    // If no high-confidence offline match, return null to trigger LLM fallback
    return null;
  }

}

export const geminiVoiceService = new GemmaVoiceService();
