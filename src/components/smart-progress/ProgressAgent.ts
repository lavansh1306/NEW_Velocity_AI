import { SmartTask } from './types';

export const analyzeEODReport = async (
  task: SmartTask, 
  reportContent: string
): Promise<Partial<SmartTask>> => {
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const contentLower = reportContent.toLowerCase();
      
      // 1. Detect which items are done (Keep existing done items + new ones)
      const newScope = task.scope.map(item => {
        // If already done, keep it done
        if (item.isCompleted) return item;

        // Check content for keywords
        const keywords = item.name.toLowerCase().split(' ').filter(w => w.length > 3);
        const mentioned = keywords.some(k => contentLower.includes(k));
        
        return mentioned ? { ...item, isCompleted: true } : item;
      });

      // 2. Calculate Weighted Progress
      const newProgress = newScope
        .filter(i => i.isCompleted)
        .reduce((sum, item) => sum + item.weight, 0);

      const newlyCompleted = newScope.filter(i => i.isCompleted && !task.scope.find(old => old.id === i.id)?.isCompleted);
      const names = newlyCompleted.map(i => i.name).join(", ");

      resolve({
        scope: newScope,
        progress: Math.min(100, newProgress),
        lastUpdate: names ? `Agent verified completion of: ${names}` : "No new items detected in report.",
        lastUpdatedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }, 2000);
  });
};