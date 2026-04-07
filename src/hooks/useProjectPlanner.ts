import { useState } from 'react';
import { plannerApi } from '../api/plannerApi';
import { toast } from 'sonner';

export const useProjectPlanner = () => {
  const [tasks, setTasks] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [status, setStatus] = useState('');

  const analyzeProject = async (description: string) => {
    setIsAnalyzing(true);
    try {
      // Wake up logic with personality messages
      const wakeMessages = [
        'Waking up the AI...',
        'Connecting to intelligence layer...',
        'Almost ready...',
        'Warming up the model...',
        'Fetching your team data...',
        'Loading project context...',
        'Just a moment...',
        'Still waking up...',
        'Nearly there...',
        'One more second...',
      ];
      let awake = false;
      for(let i=0; i<10; i++) {
        setStatus(wakeMessages[i] || 'Connecting...');
        if(await plannerApi.checkHealth()) { awake = true; break; }
        await new Promise(r => setTimeout(r, 2000));
      }
      
      if(!awake) throw new Error("Server timeout");

      const analyzeMessages = [
        'Analyzing your project description...',
        'Breaking down tasks...',
        'Estimating complexity and hours...',
        'Matching skills to tasks...',
        'Finalizing your project plan...',
      ];
      for (const msg of analyzeMessages) {
        setStatus(msg);
        await new Promise(r => setTimeout(r, 400));
      }
      const data = await plannerApi.decompose(description);
      setTasks(data.suggested_tasks);
      toast.success('Done!');
      
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { tasks, isAnalyzing, status, analyzeProject };
};