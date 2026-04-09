import { GoogleGenerativeAI } from '@google/generative-ai';
import { levenshteinDistance, phoneticNormalize, findBestMatch } from '@/lib/utils';

export interface VoiceAction {
  type: 'navigate' | 'create_task' | 'assign_task' | 'update_task' | 'delete_task' | 'add_team_member' | 'delete_team_member' | 'create_project' | 'update_project' | 'delete_project' | 'request_leave' | 'get_leave_status' | 'approve_leave' | 'deny_leave' | 'search' | 'info' | 'gantt_query' | 'resource_query' | 'project_query' | 'unknown';
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
    projectQueryType?: 'count' | 'list' | 'latest';
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
      // Using Gemma 4 31B IT for superior reasoning and larger context
      this.model = this.genAI.getGenerativeModel({ model: 'gemma-4-31b-it' });
    }
  }

  async parseIntent(transcript: string, currentPath: string): Promise<VoiceAction> {
    // 1. Try Direct Command Parsing first (Fast Path, No LLM Latency)
    const directAction = this.parseOfflineCommand(transcript);
    if (directAction) {
      console.log('[Gemma4Voice] Using Offline Command:', directAction);
      return directAction;
    }

    if (!this.model) {
      console.warn('[Gemma4Voice] Gemini API not configured. Using Standard Mode.');
      return this.parseOfflineCommand(transcript) || { type: 'unknown', response: "Gemma 4 is unavailable and I couldn't match that command locally." };
    }

    const systemPrompt = `
You are the "Refining Layer" for Velocity AI's voice interface.
The fast local parser failed to match this transcript. Your job is to "rephrase" the messy transcript into a structured JSON command that the frontend can execute.

Current Page: ${currentPath}

Action Categories & Parameters:
1. General Commands (Accessible to All Users):
   - navigate: { target: "/dashboard" | "/projects" | "/people" | "/plan" | "/settings" | "/leave" }
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
   - update_project: { projectTitle: "string", newTitle: "string", newDescription: "string" } (Modify project)
   - delete_project: { projectTitle: "string" } (Delete project)
   - create_task: { taskName: "string", projectName: "string (optional)", assigneeName: "string (optional)" } (Create new work)
   - assign_task: { taskName: "string", assigneeName: "string", fromAssigneeName: "string (optional)" } (Assign/switch task)
   - update_task: { taskName: "string", status: "completed" | "not_started", newTitle: "string" } (Modify task status or name)
   - delete_task: { taskName: "string" } (Delete an existing task)

3. Employee Commands (Accessible to All):
   - request_leave: { startDate: "string", endDate: "string", reason: "string", leaveType: "string" } (Apply for leave)

Rules:
- REPHRASING: If the transcript is messy, extract the CORE intent.
- DATE NORMALIZATION: Convert ANY date mentions like "15th April", "today", "tomorrow" into YYYY-MM-DD format.
- EXTRACTION: Extract as much detail as possible (names, roles, emails, project titles).
- Respond ONLY with valid JSON.
- NO preamble or postamble.

JSON Structure:
{
  "type": "navigate" | "create_project" | "update_project" | "delete_project" | "add_team_member" | "delete_team_member" | "create_task" | "update_task" | "assign_task" | "delete_task" | "search" | "info" | "gantt_query" | "resource_query" | "request_leave" | "approve_leave" | "deny_leave" | "unknown",
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
    "fromAssigneeName": "string",
    "query": "string",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "reason": "string",
    "leaveType": "string",
    "status": "string",
    "newTitle": "string",
    "newDescription": "string"
  },
  "response": "Brief spoken confirmation of what you extracted",
  "requiresConfirmation": boolean,
  "prompt": "Optional question for the user"
}
`;

    try {
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
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as VoiceAction;
        } catch (parseError) {
          console.error('[Gemma4Voice] JSON Parse Error:', parseError, 'Raw Match:', jsonMatch[0]);
        }
      }
      
      return { type: 'unknown', response: "I'm not sure how to help with that yet." };
    } catch (error: any) {
      console.error('[Gemma4Voice] Intent parsing failed:', error);
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
- Respond ONLY with the plain text to be spoken. No markdown, no prefixes.
`;

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Summarization Timeout')), 20000)
      );

      const result = await Promise.race([
        this.model.generateContent(prompt),
        timeoutPromise
      ]) as any;

      return result.response.text().trim();
    } catch (error: any) {
      console.error('[Gemma4Voice] Summarization failed:', error);
      return this.summarizeDataLocally(data, query);
    }
  }

  private summarizeDataLocally(data: any, query: string): string {
    const text = query.toLowerCase();
    
    if (data?.kpis && Array.isArray(data.kpis) && text.includes('project')) {
      const activeProjects = data.kpis.find((k: any) => k.label.includes('ACTIVE PROJECTS'))?.value;
      const atRisk = data.kpis.find((k: any) => k.label.includes('RISK'))?.value;
      return `Standard Mode: You have ${activeProjects || 0} active projects. ${atRisk > 0 ? `Note that ${atRisk} projects are currently marked as at risk.` : 'Everything looks on track.'}`;
    }

    if (data?.gantt && Array.isArray(data.gantt) && (text.includes('who') || text.includes('team') || text.includes('member') || (text.includes('how many') && !text.includes('project')))) {
      const count = data.gantt.length;
      return `Standard Mode: You have ${count} active team members currently allocated to projects.`;
    }

    if (data?.deadlines && Array.isArray(data.deadlines) && (text.includes('when') || text.includes('deadline') || text.includes('due'))) {
      if (data.deadlines.length === 0) return "Standard Mode: There are no upcoming deadlines in the next 30 days.";
      const next = data.deadlines[0];
      return `Standard Mode: Your next major deadline is for project ${next.project}, which is due in ${next.daysLeft} days.`;
    }

    if (data?.kpis && Array.isArray(data.kpis)) {
      const activeProjects = data.kpis.find((k: any) => k.label.includes('ACTIVE PROJECTS'))?.value;
      const utilization = data.kpis.find((k: any) => k.label.includes('UTILIZATION'))?.value;
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
      .replace(/^(hello|hi|hey|velocity|hero|bot|ai|please|can you|could you|would you|um|uh|err|like|kindly|just|shukriya|dhanyawad|zara|ek|baat|hai|hain|ki|ka|ko|se)\s+/g, '')
      .replace(/\s+(um|uh|err|like|please|and|then|kindly|now|hai|hain|ki|ka|ko|se|zara|achha|theek)\s+/g, ' ')
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
      'leave': '/leave', 'vacation': '/leave'
    };

    const isProjectCreate = (words.some(w => ['project', 'plan', 'planning'].includes(w)) || text.includes('naya project')) && 
                           (words.some(w => ['create', 'add', 'new', 'start', 'setup', 'banao', 'shuru'].includes(w))) && 
                           !text.includes('task') && !text.includes('kaam');

    if (isProjectCreate) {
      let title = '';
      let description = '';
      const nameMatch = text.match(/(?:named|called)\s+([^that|who|to|which|for]+)/i);
      const doingMatch = text.match(/(?:that does|to do|for doing|which does|that is)\s+(.+)/i);
      if (nameMatch) title = nameMatch[1].trim();
      if (doingMatch) description = doingMatch[1].trim();
      
      if (!title) {
        const projectPos = text.indexOf('project');
        if (projectPos !== -1) {
          const afterProject = text.slice(projectPos + 7).trim();
          title = afterProject.split(/\s+(?:that|does|to|for|which|is)\s+/)[0];
        }
      }

      return {
        type: 'create_project',
        params: { projectTitle: title, projectDescription: description, autoAnalyze: !!description },
        response: `Sure, I'll set up that plan for ${title || 'the project'}.`
      };
    }

    // Deletion specialization (Project/Task/Member)
    const isDeleteCommand = words.some(w => ['delete', 'remove', 'fire', 'rid'].includes(w));
    if (isDeleteCommand) {
      if (text.includes('project')) {
         const nameMatch = text.match(/(?:project)\s+([^that|who|to|which|for|please|hatao|delete|mitao]+)/i);
         return {
           type: 'delete_project',
           params: { projectTitle: nameMatch ? nameMatch[1].trim() : words[words.length-1] },
           requiresConfirmation: true,
           response: `Theek hai, main project delete karne mein madad karta hoon.`
         };
      }
      if (text.includes('task')) {
        const deleteMatch = text.match(/(?:task)\s+(.*)/i);
        return {
          type: 'delete_task',
          params: { taskName: deleteMatch ? deleteMatch[1]?.trim() : words[words.length-1] },
          requiresConfirmation: true,
          response: `Standard Mode: I'll help you delete that task.`
        };
      }
      // Member
      const noise = ['delete', 'remove', 'fire', 'member', 'team', 'person', 'from', 'the', 'named', 'called', 'please', 'hatao', 'nikalo'];
      const nameWords = words.filter(w => !noise.includes(w));
      if (nameWords.length > 0) {
        return {
          type: 'delete_team_member',
          params: { name: nameWords.join(' ') },
          requiresConfirmation: true,
          response: `Theek hai, main ${nameWords[0]} ko team se hata deta hoon.`
        };
      }
    }

    const navVerbs = ['go', 'open', 'show', 'navigate', 'take', 'view', 'switch', 'move', 'jump', 'goto', 'visit', 'jao', 'dikhao', 'khola', 'le chalo', 'chalo'];
    const bestNavMatch = findBestMatch(words[words.length - 1], Object.keys(navTargets), (s) => s);
    if (bestNavMatch && (navVerbs.some(v => text.includes(v)) || words.length === 1)) {
      return { type: 'navigate', target: navTargets[bestNavMatch], response: `${bestNavMatch} khol raha hoon.` };
    }

    // Task Creation
    if ((text.includes('task') || text.includes('kaam')) && (words.some(w => ['add', 'create', 'new', 'banao', 'daalo'].includes(w)))) {
      const match = text.match(/(?:add|create|new|banao|daalo)\s+(?:task|kaam)?\s+(.*?)\s+(?:for|to|in|mein|pe)\s+(.*?)(?:\s+project)?$/i);
      if (match) {
        return { type: 'create_task', params: { taskName: match[1]?.trim(), projectName: match[2]?.trim() }, response: `Task "${match[1]?.trim()}" ko project "${match[2]?.trim()}" mein add kar raha hoon.` };
      }
      const simpleMatch = text.match(/(?:add|create|new|banao|daalo)\s+(?:task|kaam\s+)(.*)/i);
      if (simpleMatch) {
         return { type: 'create_task', params: { taskName: simpleMatch[1]?.trim() }, response: `Aapka task "${simpleMatch[1]?.trim()}" bana raha hoon.` };
      }
    }

    // Task Assignment & Status updates
    if ((words.some(w => ['assign', 'switch', 'change', 'de do', 'lagao', 'dal'].includes(w)) || text.includes('de do')) && (text.includes('task') || text.includes('kaam'))) {
      const switchMatch = text.match(/(?:switch|change).*?(?:task|kaam)\s+(.*?)\s+from\s+(.*?)\s+to\s+(.*)/i);
      if (switchMatch) return { type: 'assign_task', params: { taskName: switchMatch[1]?.trim(), fromAssigneeName: switchMatch[2]?.trim(), assigneeName: switchMatch[3]?.trim() }, response: `"${switchMatch[1]?.trim()}" ki assignment update kar raha hoon.` };
      const assignMatch = text.match(/assign.*?task\s+(.*?)\s+to\s+(.*)/i);
      if (assignMatch) return { type: 'assign_task', params: { taskName: assignMatch[1]?.trim(), assigneeName: assignMatch[2]?.trim() }, response: `"${assignMatch[1]?.trim()}" ko ${assignMatch[2]?.trim()} ko assign kar raha hoon.` };
    }

    // Task Completion Hinglish
    if ((text.includes('task') || text.includes('kaam')) && (text.includes('complete') || text.includes('khatam') || text.includes('ho gaya') || text.includes('pura'))) {
      const taskMatch = text.match(/(.*?)\s+(?:complete|khatam|ho gaya|pura)/i);
      const name = taskMatch ? taskMatch[1].replace(/task|kaam/g, '').trim() : '';
      if (name) {
        return { type: 'update_task', params: { taskName: name, status: 'completed' }, response: `Theek hai, task ${name} ko complete mark kar raha hoon.` };
      }
    }

    // Team Member Invite
    if (words.some(w => ['add', 'invite', 'new', 'banao', 'shamil'].includes(w)) || text.includes('add kardo') || text.includes('ko add')) {
      const email = words.find(w => w.includes('@')) || '';
      const roleMatch = text.match(/as\s+(.*)/i) || text.match(/role\s+(.*)/i);
      const role = roleMatch ? roleMatch[1].trim() : 'Team Member';
      
      const noise = ['add', 'invite', 'new', 'team', 'member', 'for', 'as', 'email', 'with', 'ko', 'kardo', 'hain', 'ki', 'role'];
      const nameWords = words.filter(w => !noise.includes(w) && !w.includes('@') && !role.toLowerCase().includes(w));
      const name = nameWords.join(' ').trim() || (email ? email.split('@')[0] : 'New Member');
      
      return { type: 'add_team_member', params: { name: name, email: email, role: role }, response: `Theek hai, main ${name} ko ${role} ke roop mein add kar raha hoon.` };
    }

    // Leave Management
    if (words.some(w => ['leave', 'vacation', 'off', 'sick', 'chutti'].includes(w))) {
      if (text.includes('status') || text.includes('when') || text.includes('kab')) return { type: 'get_leave_status', params: { query: text }, response: "Chutti ka status check kar raha hoon..." };
      const isApprove = words.some(w => ['approve', 'confirm', 'allow', 'theek', 'manzoor'].includes(w));
      const isDeny = words.some(w => ['deny', 'reject', 'cancel', 'mana'].includes(w));
      if (isApprove || isDeny) {
         const nameWords = words.filter(w => !['leave', 'vacation', 'off', 'sick', 'approve', 'confirm', 'allow', 'deny', 'reject', 'cancel', 'for', 'request', 'chutti'].includes(w));
         return { type: isApprove ? 'approve_leave' : 'deny_leave', params: { name: nameWords.join(' ') }, response: `${nameWords[0] || 'unki'} chutti manage kar raha hoon.`, requiresConfirmation: true };
      }
      return { type: 'request_leave', params: { startDate: 'today', endDate: 'today', reason: 'Personal' }, response: `Main chutti request karne mein madad karta hoon.`, requiresConfirmation: true };
    }

    // 4. Project Queries
    if (text.includes('project') && (text.includes('how many') || text.includes('kitane') || text.includes('kitne') || text.includes('number of'))) {
      return { type: 'project_query', params: { projectQueryType: 'count' }, response: "Checking total project count..." };
    }
    if (text.includes('project') && (text.includes('what are') || text.includes('list') || text.includes('show') || text.includes('name'))) {
      if (!text.includes('count') && !text.includes('latest') && !text.includes('recent')) {
        return { type: 'project_query', params: { projectQueryType: 'list' }, response: "Fetching project list..." };
      }
    }
    if (text.includes('project') && (text.includes('latest') || text.includes('recent') || text.includes('newest'))) {
      return { type: 'project_query', params: { projectQueryType: 'latest' }, response: "Finding the latest project..." };
    }

    // 5. Gantt/Resource Queries (Analytics)
    if (text.includes('timeline') || text.includes('gantt') || text.includes('due date') || text.includes('deadline')) {
      return {
        type: 'gantt_query',
        params: { query: text },
        response: "Project timeline check kar raha hoon."
      };
    }

    if (text.includes('who is busy') || text.includes('who has') || text.includes('workload') || text.includes('capacity') || text.includes('how many') || text.includes('kitane') || text.includes('kitne')) {
      if (!text.includes('project')) {
        return {
          type: 'resource_query',
          params: { query: text },
          response: "Workload aur capacity dekhte hain."
        };
      }
    }

    // 5. Help / Info Intent
    if (words.some(w => ['help', 'capabilities', 'commands', 'kya'].includes(w))) {
      return {
        type: 'info',
        response: "Standard Mode: I can help you navigate, add tasks, manage team members, or plan new projects. Try saying 'Go to dashboard', 'Add task X', or 'How many projects?'."
      };
    }

    // 6. Search & Contextual Task Actions
    if (words[0] === 'search' || words[0] === 'find' || words[0] === 'look') {
      const query = text.replace(/search for|find|lookup|look for/i, '').trim();
      if (query) return { type: 'search', params: { query }, response: `Searching for "${query}".` };
    }

    // Contextual Assignment: "add xyz to task abc" or "switch task abc to xyz"
    if (text.includes('to task') || text.includes('ko de do') || text.includes('pe switch')) {
      const addMatch = text.match(/(?:add|de do|daalo)\s+(.*?)\s+(?:to task|pe|ko)\s+(.*)/i);
      const switchMatch = text.match(/(?:switch|badlo)\s+(?:task|kaam)\s+(.*?)\s+(?:to|pe)\s+(.*)/i);
      if (addMatch) {
         return { type: 'assign_task', params: { assigneeName: addMatch[1].trim(), taskName: addMatch[2].trim() }, response: `${addMatch[1].trim()} ko task ${addMatch[2].trim()} assign kar raha hoon...` };
      }
      if (switchMatch) {
         return { type: 'assign_task', params: { taskName: switchMatch[1].trim(), assigneeName: switchMatch[2].trim() }, response: `Task ${switchMatch[1].trim()} badal kar ${switchMatch[2].trim()} kar raha hoon...` };
      }
    }

    return null;
  }
}

export const geminiVoiceService = new GeminiVoiceService();
