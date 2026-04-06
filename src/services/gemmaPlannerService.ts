import { GoogleGenerativeAI } from '@google/generative-ai';

export interface PlannedTask {
  task_name: string;
  estimated_hours: number;
  required_skills: string[];
}

export interface DecompositionResponse {
  suggested_tasks: PlannedTask[];
}

class GemmaPlannerService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Using Gemma 4 31B IT for expert project planning and task decomposition
      this.model = this.genAI.getGenerativeModel({ model: 'gemma-4-31b-it' });
    }
  }

  async decomposeProject(description: string): Promise<DecompositionResponse> {
    if (!this.model) {
      throw new Error('Gemma API is not configured.');
    }

    const systemPrompt = `
You are an expert Project Manager and Systems Architect. 
Your task is to decompose a project description into a structured, executable set of tasks.

Rules:
1. Break down the project into logical, granular tasks.
2. For each task, estimate the effort in hours (be realistic).
3. Identify the key skills required for each task (e.g., Frontend, Backend, UI/UX, DevOps, Testing).
4. Return ONLY a valid JSON object. DO NOT include any internal reasoning, draft versions, or preamble. The output must be strictly the JSON object below:

{
  "suggested_tasks": [
    {
      "task_name": "Task Name",
      "estimated_hours": 8,
      "required_skills": ["Frontend", "TypeScript"]
    }
  ]
}

Ensure the output is strictly valid JSON and nothing else.
`;

    try {
      const result = await this.model.generateContent([
        { text: systemPrompt },
        { text: `Project Description: "${description}"` }
      ]);

      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as DecompositionResponse;
      }
      
      throw new Error("Failed to extract valid JSON from Gemma response.");
    } catch (error) {
      console.error('[GemmaPlanner] Decomposition failed:', error);
      throw error;
    }
  }
}

export const gemmaPlannerService = new GemmaPlannerService();
