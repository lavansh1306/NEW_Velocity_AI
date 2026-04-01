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

        case 'create_project':
          const { projectTitle, projectDescription, autoAnalyze } = action.params || {};
          console.log('[VoiceActions] Navigating to plan with:', { projectTitle, projectDescription, autoAnalyze });
          navigate('/plan', { 
            state: { 
              voiceTitle: projectTitle, 
              voiceDescription: projectDescription,
              autoAnalyze: autoAnalyze 
            } 
          });
          break;
        
        case 'create_task':
          toast.success(`Intent: Create task "${action.params?.taskName || 'New Task'}"`);
          break;

        case 'add_team_member':
          const { name, email, role } = action.params || {};
          if (currentPath !== '/people') {
            localStorage.setItem('velo-voice-add-member', JSON.stringify({ name, email, role }));
            navigate('/people');
          } else {
            window.dispatchEvent(new CustomEvent('velo-add-member', { 
              detail: { name, email, role } 
            }));
          }
          break;

        case 'delete_team_member':
          const { name: deleteName } = action.params || {};
          if (currentPath !== '/people') {
            localStorage.setItem('velo-voice-delete-member', JSON.stringify({ name: deleteName }));
            navigate('/people');
          } else {
            window.dispatchEvent(new CustomEvent('velo-delete-member', { 
              detail: { name: deleteName } 
            }));
          }
          break;

        case 'search':
          toast.info(`Searching for "${action.params?.query || transcript}"`);
          break;

        case 'info':
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
