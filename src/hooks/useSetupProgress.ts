import { useState, useCallback } from 'react';
import { setupProgressService } from '@/services/setupProgressService';

export function useSetupProgress() {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProgress = useCallback(async (orgId: string) => {
    setIsLoading(true);
    try {
      const steps = await setupProgressService.getProgress(orgId);
      setCompletedSteps(steps);
    } catch (err) {
      console.error('Error fetching setup progress:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    completedSteps,
    isLoading,
    fetchProgress,
  };
}
