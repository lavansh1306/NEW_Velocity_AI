import { GoogleGenerativeAI } from '@google/generative-ai';

export interface VoiceAction {
  type: 'navigate' | 'create_task' | 'search' | 'info' | 'unknown';
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
      // Using 1.5 Flash for the perfect balance of speed and intelligence
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }
  }

  async parseIntent(transcript: string, currentPath: string): Promise<VoiceAction> {
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
3. search: Search for projects or people. Extract the search query as "query" in the params object.
4. info: General questions about the platform or current view.

Rules:
- Respond ONLY with a JSON object.
- Include a "response" field with a short, natural spoken confirmation (e.g., "Sure, taking you to your projects.").

JSON Structure:
{
  "type": "navigate" | "create_task" | "search" | "info" | "unknown",
  "target": "string (URL for navigate)",
  "params": {
    "taskName": "string (if create_task)",
    "query": "string (if search)"
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
    
    return { type: 'unknown', response: "I heard you, but I don't know that command yet." };
  }
}

export const geminiVoiceService = new GeminiVoiceService();
