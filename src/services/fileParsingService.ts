import { GoogleGenerativeAI } from '@google/generative-ai';
import Papa from 'papaparse';
import * as XLSX from 'exceljs';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ParsedTask {
  name: string;
  assignee: string;
  hours: string;
  startDate: string;
  dueDate: string;
  timeline: string;
}

export interface ParsedProjectData {
  projectName?: string;
  projectDescription?: string;
  tasks: ParsedTask[];
}

class FileParsingService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async parseFile(file: File): Promise<ParsedProjectData> {
    const fileType = this.getFileType(file.name);

    let fileContent = '';

    if (fileType === 'csv') {
      fileContent = await this.parseCSV(file);
    } else if (fileType === 'xlsx') {
      fileContent = await this.parseXLSX(file);
    } else if (fileType === 'pdf') {
      fileContent = await this.parsePDF(file);
    } else {
      throw new Error('Unsupported file format');
    }

    // Try to use Gemini to parse and structure the content
    try {
      const parsedData = await this.parseWithGemini(fileContent);
      return parsedData;
    } catch (geminiError: any) {
      console.warn('Gemini parsing failed, falling back to rule-based parser:', geminiError.message);
      // Fall back to basic CSV/XLSX parsing if Gemini is not available
      return this.parseBasic(fileContent);
    }
  }

  private getFileType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    if (extension === 'csv') return 'csv';
    if (['xlsx', 'xls'].includes(extension)) return 'xlsx';
    if (extension === 'pdf') return 'pdf';
    return '';
  }

  private parseCSV(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: false,
        complete: (results: any) => {
          const text = results.data
            .map((row: any[]) => row.join('\t'))
            .join('\n');
          resolve(text);
        },
        error: (error: any) => reject(error),
      });
    });
  }

  private async parseXLSX(file: File): Promise<string> {
    const workbook = new XLSX.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);

    let text = '';
    workbook.eachSheet((worksheet) => {
      worksheet.eachRow((row) => {
        const rowValues = row.values;
        if (rowValues && Array.isArray(rowValues)) {
          const rowText = rowValues
            .map((val) => (val ? String(val) : ''))
            .join('\t');
          if (rowText) text += rowText + '\n';
        }
      });
    });

    return text;
  }

  private async parsePDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      text += pageText + '\n';
    }

    return text;
  }

  private async parseWithGemini(content: string): Promise<ParsedProjectData> {
    if (!this.genAI) {
      throw new Error('Gemini API is not configured. Please set VITE_GEMINI_API_KEY environment variable.');
    }

    // Try gemini-1.5-pro first, fall back to gemini-pro if not available
    let model;
    try {
      model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
    } catch {
      try {
        model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      } catch {
        model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      }
    }

    const prompt = `
You are an expert project parser. Analyze the following document content and extract project tasks and information.

Document Content:
${content}

Please extract and return a JSON object with the following structure:
{
  "projectName": "Extract project name if mentioned",
  "projectDescription": "Extract project description if mentioned",
  "tasks": [
    {
      "name": "Task name",
      "assignee": "Assignee name or 'Unassigned'",
      "hours": "Estimated hours or '0'",
      "startDate": "Start date in YYYY-MM-DD format or empty string",
      "dueDate": "Due date in YYYY-MM-DD format or empty string",
      "timeline": "Timeline phase like 'Week 1', 'Sprint 1' etc or empty string"
    }
  ]
}

Rules:
1. Extract all tasks/items mentioned in the document
2. Convert any dates to YYYY-MM-DD format
3. Estimate hours if mentioned, otherwise use '0'
4. If assignee is not mentioned, use 'Unassigned'
5. If date format is unclear, try to parse it intelligently
6. Return ONLY valid JSON, no other text

Ensure the response is valid JSON that can be parsed.`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from response');
      }

      const parsedData: ParsedProjectData = JSON.parse(jsonMatch[0]);
      
      // Validate and clean the parsed data
      return this.validateParsedData(parsedData);
    } catch (error: any) {
      throw new Error(`Failed to parse with Gemini: ${error.message}`);
    }
  }

  private parseBasic(content: string): ParsedProjectData {
    // Simple CSV/structured text parser as fallback when Gemini is not available
    const lines = content.split('\n').filter(line => line.trim());
    const tasks: ParsedTask[] = [];
    
    // Try to parse CSV format
    try {
      const rows = lines.map(line => line.split(',').map(cell => cell.trim()));
      if (rows.length > 0) {
        // Assume first row might be headers
        const firstRow = rows[0];
        const possibleHeaders = ['name', 'task', 'assignee', 'person', 'user', 'owner', 'hours', 'days', 'duration', 'startdate', 'start', 'duedate', 'due', 'timeline', 'phase'];
        
        // Check if first row looks like headers
        const isHeader = firstRow.some(cell => possibleHeaders.some(h => cell.toLowerCase().includes(h)));
        const startIndex = isHeader ? 1 : 0;
        
        for (let i = startIndex; i < rows.length; i++) {
          const row = rows[i];
          if (row.length > 0 && row[0]) {
            tasks.push({
              name: row[0] || 'Untitled Task',
              assignee: row[1] || 'Unassigned',
              hours: row[2] || '0',
              startDate: this.validateDate(row[3]) ? row[3] : '',
              dueDate: this.validateDate(row[4]) ? row[4] : '',
              timeline: row[5] || '',
            });
          }
        }
      }
    } catch (e) {
      // If CSV parsing fails, extract basic tasks from text
      console.warn('Basic CSV parsing failed, extracting from text');
    }
    
    // If no tasks found, create at least one from the content
    if (tasks.length === 0) {
      tasks.push({
        name: content.substring(0, 100) || 'Task from imported file',
        assignee: 'Unassigned',
        hours: '0',
        startDate: '',
        dueDate: '',
        timeline: '',
      });
    }
    
    return {
      projectName: 'Imported Project',
      projectDescription: 'Project imported from file',
      tasks,
    };
  }

  private validateParsedData(data: any): ParsedProjectData {
    const validated: ParsedProjectData = {
      projectName: data.projectName || '',
      projectDescription: data.projectDescription || '',
      tasks: [],
    };

    if (Array.isArray(data.tasks)) {
      validated.tasks = data.tasks.map((task: any) => ({
        name: String(task.name || ''),
        assignee: String(task.assignee || 'Unassigned'),
        hours: String(task.hours || '0'),
        startDate: this.validateDate(task.startDate) ? String(task.startDate) : '',
        dueDate: this.validateDate(task.dueDate) ? String(task.dueDate) : '',
        timeline: String(task.timeline || ''),
      }));
    }

    return validated;
  }

  private validateDate(dateString: string): boolean {
    if (!dateString) return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}

export const fileParsingService = new FileParsingService();
