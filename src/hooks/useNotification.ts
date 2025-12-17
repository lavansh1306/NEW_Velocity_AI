import { useToast } from '@/contexts/ToastContext';

export const useNotification = () => {
  const { addToast } = useToast();

  return {
    success: (title: string, description?: string) =>
      addToast({
        type: 'success',
        title,
        description,
        duration: 4000,
      }),
    error: (title: string, description?: string) =>
      addToast({
        type: 'error',
        title,
        description,
        duration: 5000,
      }),
    warning: (title: string, description?: string) =>
      addToast({
        type: 'warning',
        title,
        description,
        duration: 4500,
      }),
    info: (title: string, description?: string) =>
      addToast({
        type: 'info',
        title,
        description,
        duration: 4000,
      }),
  };
};
