import { useNavigate } from 'react-router-dom';
import { useVoice } from '@/contexts/VoiceContext';
import { geminiVoiceService, VoiceAction } from '@/services/geminiVoiceService';
import { getDashboardData } from '@/services/dashboardService';
import { toast } from 'sonner';

export const closeVoiceOverlay = () => {
  window.dispatchEvent(new CustomEvent('velo-close-voice'));
};

export const useVoiceActions = () => {
  const navigate = useNavigate();
  const { 
    setProcessing, 
    speak, 
    enqueueAction, 
    pendingConfirmation, 
    setPendingConfirmation,
    startListening 
  } = useVoice();

  const handleVoiceCommand = async (transcript: string, currentPath: string) => {
    if (pendingConfirmation) {
      const text = transcript.toLowerCase();
      const isConfirmed = text.includes('yes') || text.includes('confirm') || text.includes('sure') || text.includes('ok');
      const isCancelled = text.includes('no') || text.includes('cancel') || text.includes('stop');

      if (isConfirmed) {
        const actionToExecute = { ...pendingConfirmation, requiresConfirmation: false };
        setPendingConfirmation(null);
        await executeAction(actionToExecute, currentPath);
      } else if (isCancelled) {
        setPendingConfirmation(null);
        speak("Okay, I've cancelled that action.");
        toast.info('Action cancelled');
      } else {
        speak("I didn't catch that. Please say yes to confirm or no to cancel.");
      }
      return;
    }

    setProcessing(true);
    
    try {
      const action = await geminiVoiceService.parseIntent(transcript, currentPath);
      setProcessing(false);
      
      if (action.prompt) {
        speak(action.prompt);
        toast.info(action.prompt);
        setTimeout(() => startListening(), 2000);
        return;
      }

      if (action.requiresConfirmation) {
        setPendingConfirmation(action);
        const confirmMsg = action.response || `I'm about to ${action.type.replace(/_/g, ' ')}. Are you sure?`;
        speak(confirmMsg);
        toast.warning('Confirmation required');
        setTimeout(() => startListening(), 2500);
        return;
      }

      if (action.response) {
        speak(action.response);
        toast.info(action.response);
      }

      await executeAction(action, currentPath);
      
    } catch (error) {
      console.error('[useVoiceActions] Failed to handle command:', error);
      toast.error('Sorry, I had trouble processing that command.');
      setProcessing(false);
    }
  };

  const executeAction = async (action: VoiceAction, currentPath: string) => {
    switch (action.type) {
      case 'navigate':
        if (action.target) {
          closeVoiceOverlay();
          setTimeout(() => navigate(action.target!), 150);
        }
        break;

      case 'create_project': {
        const { projectTitle, projectDescription, autoAnalyze } = action.params || {};
        closeVoiceOverlay();
        setTimeout(() => {
          navigate('/plan', { 
            state: { 
              voiceTitle: projectTitle, 
              voiceDescription: projectDescription,
              autoAnalyze: autoAnalyze 
            } 
          });
        }, 150);
        break;
      }
      
      case 'create_task':
        toast.success(`Intent: Create task "${action.params?.taskName || 'New Task'}"`);
        break;

      case 'add_team_member': {
        const { name, email, role } = action.params || {};
        closeVoiceOverlay();
        if (currentPath !== '/people') {
          enqueueAction(action);
          setTimeout(() => {
            navigate('/people');
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('velo-add-member', {
                detail: { name, email, role }
              }));
            }, 500);
          }, 150);
        } else {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('velo-add-member', { 
              detail: { name, email, role } 
            }));
          }, 150);
        }
        break;
      }

      case 'delete_team_member':
        closeVoiceOverlay();
        if (currentPath !== '/people') {
          enqueueAction(action);
          setTimeout(() => {
            navigate('/people');
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('velo-delete-member', { 
                detail: { name: action.params?.name } 
              }));
            }, 500);
          }, 150);
        } else {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('velo-delete-member', { 
              detail: { name: action.params?.name } 
            }));
          }, 150);
        }
        break;

      case 'search':
        toast.info(`Searching for "${action.params?.query || 'anything'}"`);
        break;

      case 'gantt_query':
      case 'resource_query': {
        const data = await getDashboardData();
        const summary = await geminiVoiceService.summarizeData(
          data,
          action.params?.query || action.type.replace('_', ' ')
        );
        speak(summary);
        toast.info(summary);
        break;
      }

      case 'info':
        if (action.response) {
          speak(action.response);
          toast.info(action.response);
        }
        break;

      case 'unknown':
        speak(action.response || "Sorry, I'm having trouble understanding that command.");
        toast.error(action.response || "Sorry, I'm having trouble understanding that command.");
        break;

      default:
        if (action.type !== 'unknown') {
          console.warn('[useVoiceActions] Unknown action type:', action.type);
        }
        break;
    }
  };

  return { handleVoiceCommand };
};
