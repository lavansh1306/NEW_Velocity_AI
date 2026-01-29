import { SmartTask } from './types';

export const analyzeEODReport = async (
  task: SmartTask, 
  reportContent: string
): Promise<Partial<SmartTask>> => {
  
  return new Promise((resolve) => {
    // Simulate AI Analysis Delay
    setTimeout(() => {
      const contentLower = reportContent.toLowerCase();
      
      // 1. Detect which scope items are mentioned as done
      // (Simple heuristic: matching words from scope in the report)
      const newlyDetectedItems = task.scope.filter(item => {
        const keywords = item.toLowerCase().split(' ').filter(w => w.length > 3);
        // If report contains significant words from the scope item
        return keywords.some(k => contentLower.includes(k));
      });

      // 2. Merge with previously completed items (prevent regression)
      const allCompleted = Array.from(new Set([...task.completedScope, ...newlyDetectedItems]));

      // 3. Calculate new Percentage
      const newProgress = Math.round((allCompleted.length / task.scope.length) * 100);

      resolve({
        completedScope: allCompleted,
        progress: newProgress,
        lastUpdate: `Agent verified completion of: ${newlyDetectedItems.join(', ') || 'No new items'}.`,
        lastUpdatedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }, 2000);
  });
};