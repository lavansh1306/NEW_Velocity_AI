import { EmployeeRecord, PredictionResult } from './types';
import Papa from 'papaparse';

// --- NEW: EXPORT RAW PARSER (For Dashboard/Gantt Charts) ---
export const fetchRawCSV = async (filePath: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    (Papa as any).parse(filePath, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data as any[]);
      },
      error: (err) => reject(err),
    });
  });
};

// --- EXISTING: ML PARSER (Keeps cleaning data for AI) ---
export const parseCSV = async (filePath: string): Promise<EmployeeRecord[]> => {
  return new Promise((resolve, reject) => {
    (Papa as any).parse(filePath, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        
        // Map to track the first ID assigned to each name for consistency
        const nameToIdMap = new Map<string, number>();

        const cleanData: EmployeeRecord[] = data
          .filter(row => row.Assignee && row["Skill Used"]) 
          .map((row, index) => {
            const name = row.Assignee;
            
            if (!nameToIdMap.has(name)) {
              nameToIdMap.set(name, index);
            }
            const stableId = nameToIdMap.get(name)!;

            return {
              id: stableId,
              name: name,
              role: row.Role || "Developer",
              department: row.Department || "Engineering",
              skills: [row["Skill Used"], row["Skill 2"]].filter(Boolean),
              experience: parseInt(row.Experience) || 3, 
              currentLoad: parseInt(row["Actual Hours"]) || 0,
              efficiency: parseFloat(row.Efficiency) || 0.85,
              location: row.Location || "Remote"
            };
          });
        resolve(cleanData);
      },
      error: (err) => reject(err),
    });
  });
};

// ... (Rest of the file: getDeterministicScore, runRecommendationModel stay the same) ...
// --- DETERMINISTIC HASH HELPER ---
const getDeterministicScore = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; 
  }
  return (Math.abs(hash) % 1000) / 1000; 
};

export const runRecommendationModel = (
  description: string, 
  dataset: EmployeeRecord[]
): PredictionResult[] => {
  
  const keywords = description.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  
  const uniqueEmployeesMap = new Map<number, EmployeeRecord>();
  
  dataset.forEach(record => {
    if (!uniqueEmployeesMap.has(record.id)) {
        uniqueEmployeesMap.set(record.id, { ...record, skills: [], currentLoad: 0 });
    }
    const entry = uniqueEmployeesMap.get(record.id)!;
    entry.skills = Array.from(new Set([...entry.skills, ...record.skills]));
    entry.currentLoad += record.currentLoad;
  });

  const uniqueEmployees = Array.from(uniqueEmployeesMap.values()).map(e => {
      const count = dataset.filter(d => d.id === e.id).length;
      return { ...e, currentLoad: e.currentLoad / count };
  });

  const predictions: PredictionResult[] = uniqueEmployees.map(employee => {
    const empSkillsLower = employee.skills.map(s => s.toLowerCase());
    const matchedSkills = keywords.filter(k => 
      empSkillsLower.some(s => s.includes(k) || k.includes(s))
    );
    
    const matchRatio = matchedSkills.length > 0 ? (matchedSkills.length / Math.min(keywords.length, 5)) : 0;
    const skillScore = matchRatio * 50; 
    const experienceScore = Math.min(employee.experience, 10) * 2;
    const contextFit = getDeterministicScore(employee.name + description); 
    const contextScore = contextFit * 15;
    const boost = matchedSkills.length > 0 ? 15 : 0;

    let rawScore = skillScore + experienceScore + contextScore + boost;

    if (matchedSkills.length === 0) {
      rawScore = rawScore * 0.3; 
    }

    const finalScore = Math.min(99, Math.max(10, Math.round(rawScore)));

    return {
      employeeId: employee.id,
      name: employee.name,
      role: employee.role,
      matchScore: finalScore,
      score: finalScore,
      skills: employee.skills,
      predictedVelocity: Math.round(80 + (contextFit * 40)),
      riskLevel: finalScore > 80 ? "Low" : finalScore > 50 ? "Medium" : "High",
      reason: matchedSkills.length > 0 
        ? `Matches ${matchedSkills.length} requirement(s): ${matchedSkills.slice(0, 3).join(", ")}` 
        : "Available resource with adjacent tech stack capacity."
    };
  });

  return predictions
    .filter(p => p.score > 35)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
};