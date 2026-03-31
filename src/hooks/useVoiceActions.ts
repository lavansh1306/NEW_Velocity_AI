import { useNavigate } from 'react-router-dom';
import { useVoice } from '@/contexts/VoiceContext';
import { geminiVoiceService } from '@/services/geminiVoiceService';
import { toast } from 'sonner';

export const useVoiceActions = () => {
  const navigate = useNavigate();
  const { setProcessing, speak } = useVoice();

  const handleVoiceCommand = async (transcript: string, currentPath: string) => {
    setProcessing(true);
    
    try {
      const action = await geminiVoiceService.parseIntent(transcript, currentPath);
      
      if (action.response) {
        speak(action.response);
        toast.info(action.response);
      }

      switch (action.type) {
        case 'navigate':
          if (action.target) {
            navigate(action.target);
          }
          break;
        
        case 'create_task':
          toast.success(`Intent: Create task "${action.params?.taskName || 'New Task'}"`);
          // Here you would integrate with your task creation logic
          break;

        case 'search':
          toast.info(`Searching for "${action.params?.query || transcript}"`);
          break;

        case 'info':
          // The response is already spoken by Gemini
          break;

        default:
          console.warn('[useVoiceActions] Unknown action type:', action.type);
          break;
      }
    } catch (error) {
      console.error('[useVoiceActions] Failed to handle command:', error);
      toast.error("Sorry, I had trouble processing that command.");
    } finally {
      setProcessing(false);
    }
  };

  return { handleVoiceCommand };
};
