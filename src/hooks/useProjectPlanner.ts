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
      // Wake up logic
      let awake = false;
      for(let i=0; i<10; i++) {
        setStatus(`Waking server... ${i+1}`);
        if(await plannerApi.checkHealth()) { awake = true; break; }
        await new Promise(r => setTimeout(r, 2000));
      }
      
      if(!awake) throw new Error("Server timeout");
      
      setStatus('Analyzing...');
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