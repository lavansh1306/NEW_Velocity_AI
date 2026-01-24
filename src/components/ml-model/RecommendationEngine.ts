import { EmployeeRecord, PredictionResult } from './types';
import Papa from 'papaparse';

// --- KEYWORD MAPPING (The "AI" Brain) ---
// Maps natural language to the specific "Skill Used" values in your CSV
const SKILL_KEYWORDS: Record<string, string[]> = {
  "Backend Development": ["backend", "node", "java", "server", "db", "api", "logic", "express"],
  "Frontend Development": ["frontend", "react", "ui", "ux", "design", "css", "web", "tailwind"],
  "API Integration": ["api", "fetch", "rest", "graphql", "integration", "axios"],
  "Database Design": ["database", "sql", "mongo", "schema", "data", "postgres"],
  "Testing & QA": ["test", "qa", "bug", "quality", "jest", "cypress"],
  "DevOps": ["devops", "cloud", "aws", "docker", "deploy", "ci/cd", "pipeline"],
  "NLP Engineering": ["nlp", "ai", "ml", "language", "model", "bot", "python"],
  "Data Analysis": ["data", "analysis", "analytics", "python", "pandas", "visual"]
};

export const parseCSV = async (fileUrl: string): Promise<EmployeeRecord[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(fileUrl, {
      download: true,
      header: true,
      dynamicTyping: true, // Auto-converts numbers
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          // Validate that it has the correct columns
          const firstRow = results.data[0] as any;
          if (!firstRow.Assignee || !firstRow["Skill Used"]) {
            reject(new Error("Invalid CSV Format: Missing 'Assignee' or 'Skill Used' columns."));
            return;
          }
          resolve(results.data as EmployeeRecord[]);
        } else {
          reject(new Error("CSV File is empty or could not be parsed."));
        }
      },
      error: (err) => {
        reject(err);
      }
    });
  });
};

export const runRecommendationModel = (
  description: string, 
  dataset: EmployeeRecord[]
): PredictionResult[] => {
  const text = description.toLowerCase();
  
  if (!dataset || dataset.length === 0) {
    throw new Error("No training data available.");
  }

  // 1. Intelligent Skill Extraction
  let requiredSkills: string[] = [];
  
  // A. Check against Keyword Map
  Object.entries(SKILL_KEYWORDS).forEach(([skillName, keywords]) => {
    if (keywords.some(k => text.includes(k))) {
      requiredSkills.push(skillName);
    }
  });

  // B. Exact Match from CSV Data (Dynamic)
  const allKnownSkills = Array.from(new Set(dataset.map(d => d["Skill Used"]).filter(Boolean)));
  allKnownSkills.forEach(skill => {
    if (text.includes(skill.toLowerCase()) && !requiredSkills.includes(skill)) {
      requiredSkills.push(skill);
    }
  });

  // If no skills found, we cannot make a specific recommendation
  if (requiredSkills.length === 0) {
    return []; 
  }

  // 2. Aggregate Employee Stats from Real Data
  const employeeStats: Record<string, { 
    skills: Record<string, number>, 
    totalTasks: number,
    totalEfficiency: number,
    projects: Set<string> // Track unique projects for load calculation
  }> = {};

  dataset.forEach(record => {
    if (!record.Assignee || !record["Skill Used"]) return;
    
    if (!employeeStats[record.Assignee]) {
      employeeStats[record.Assignee] = { 
        skills: {}, 
        totalTasks: 0, 
        totalEfficiency: 0,
        projects: new Set()
      };
    }
    
    const stats = employeeStats[record.Assignee];
    
    // Skill Count
    stats.skills[record["Skill Used"]] = (stats.skills[record["Skill Used"]] || 0) + 1;
    stats.totalTasks++;
    
    // Project Load
    if (record.Project) stats.projects.add(record.Project);

    // Efficiency Calculation
    // Protect against division by zero
    const actual = record["Actual Hours"] || 1;
    const planned = record["Planned Hours"] || 0;
    
    // Efficiency Ratio: >1.0 means they worked faster than planned. <1.0 means slower.
    let efficiency = planned / actual;
    
    // Cap efficiency at 2.0 to prevent skewed data from data entry errors (e.g. 8h planned, 0.1h actual)
    if (efficiency > 2.0) efficiency = 2.0; 
    
    stats.totalEfficiency += efficiency;
  });

  // 3. Scoring Algorithm
  const predictions: PredictionResult[] = Object.entries(employeeStats).map(([name, stats]) => {
    let skillMatch = 0;
    let matchedSkill = "";
    let maxSkillCount = 0;
    
    // Calculate Skill Strength
    requiredSkills.forEach(reqSkill => {
      const count = stats.skills[reqSkill] || 0;
      if (count > 0) {
        skillMatch += count;
        // Identify their strongest relevant skill
        if (count > maxSkillCount) {
          maxSkillCount = count;
          matchedSkill = reqSkill;
        }
      }
    });

    // If no skills matched, skip this employee
    if (skillMatch === 0) return null;

    // A. Match Score (60% weight)
    // Logarithmic scale so 1 task isn't enough, but 10 tasks is great
    const normalizedMatch = Math.min(60, (Math.log2(skillMatch + 1) * 15)); 

    // B. Efficiency Score (20% weight)
    const avgEfficiency = stats.totalEfficiency / (stats.totalTasks || 1);
    const efficiencyScore = Math.min(20, avgEfficiency * 20); 

    // C. Availability Score (20% weight)
    // In this dataset, we infer load from the number of unique projects they have touched
    // We treat > 3 distinct projects in history as "Busy/Senior" which might reduce availability
    // Note: In a real DB, you'd check "Active" status. Here we infer from historical breadth.
    const uniqueProjects = stats.projects.size;
    const loadPenalty = uniqueProjects > 3 ? 10 : 0;
    const availabilityScore = 20 - loadPenalty;

    // D. Absence Risk
    // Infer risk: Low efficiency correlates with higher risk in this model
    const absenceRisk = avgEfficiency < 0.8 ? 35 : (avgEfficiency < 1.0 ? 15 : 5);

    return {
      name,
      matchScore: Math.floor(normalizedMatch + efficiencyScore + availabilityScore),
      topSkill: matchedSkill,
      efficiency: parseFloat(avgEfficiency.toFixed(2)),
      absenceProbability: absenceRisk,
      currentLoad: uniqueProjects, // Showing unique projects worked on as proxy for load
      isAvailable: uniqueProjects < 4,
      reason: `Completed ${stats.skills[matchedSkill]} tasks in ${matchedSkill}`
    };
  }).filter(Boolean) as PredictionResult[];

  // 4. Return Results Sorted by Fit
  return predictions.sort((a, b) => b.matchScore - a.matchScore).slice(0, 8);
};