import { useNavigate } from 'react-router-dom';
import { useVoice } from '@/contexts/VoiceContext';
import { geminiVoiceService, VoiceAction } from '@/services/geminiVoiceService';
import { getDashboardData } from '@/services/dashboardService';
import { toast } from 'sonner';

// Global event so GlobalVoiceCommander can close after action
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
    // 1. Handle Pending Confirmation
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
        toast.info("Action cancelled");
      } else {
        speak("I didn't catch that. Please say yes to confirm or no to cancel.");
      }
      return;
    }

    setProcessing(true);
    
    try {
      const action = await geminiVoiceService.parseIntent(transcript, currentPath);
      
      // Handle Multi-turn Prompt
      if (action.prompt) {
        speak(action.prompt);
        toast.info(action.prompt);
        setTimeout(() => startListening(), 2000);
        return;
      }

      // Handle Confirmation Gate — use undo toast instead of yes/no loop
      if (action.requiresConfirmation) {
        let undone = false;
        const actionLabel = action.type === 'delete_team_member'
          ? `Removing ${action.params?.name || 'member'} from team`
          : action.type.replace(/_/g, ' ');

        if (action.response) {
          const clean = action.response.replace(/^(in\s+)?(standard|default|normal)\s+mode[,.]?\s*/i, '').trim();
          speak(clean || action.response);
        }

        toast(actionLabel, {
          duration: 5000,
          action: {
            label: 'Undo',
            onClick: () => {
              undone = true;
              speak("Okay, undone.");
              toast.success("Action undone");
            }
          }
        });

        await new Promise(resolve => setTimeout(resolve, 5000));
        if (!undone) {
          closeVoiceOverlay();
          await executeAction(action, currentPath);
        }
        return;
      }

      if (action.response) {
        const clean = action.response.replace(/^(in\s+)?(standard|default|normal)\s+mode[,.]?\s*/i, '').trim();
        speak(clean || action.response);
        toast.info(clean || action.response);
      }

      await executeAction(action, currentPath);
      
    } catch (error) {
      console.error('[useVoiceActions] Failed to handle command:', error);
      toast.error("Sorry, I had trouble processing that command.");
    } finally {
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

      case 'create_project':
        closeVoiceOverlay();
        setTimeout(() => {
          navigate('/plan', { 
            state: { 
              voiceTitle: action.params?.projectTitle, 
              voiceDescription: action.params?.projectDescription,
              autoAnalyze: action.params?.autoAnalyze
            } 
          });
        }, 150);
        break;
      
      case 'create_task':
        toast.success(`Creating task "${action.params?.taskName || 'New Task'}"`);
        closeVoiceOverlay();
        break;

      case 'add_team_member':
        const { name, email, role } = action.params || {};
        closeVoiceOverlay();
        if (currentPath !== '/people') {
          enqueueAction(action);
          setTimeout(() => navigate('/people'), 150);
        } else {
          window.dispatchEvent(new CustomEvent('velo-add-member', { 
            detail: { name, email, role } 
          }));
        }
        break;

      case 'delete_team_member':
        closeVoiceOverlay();
        if (currentPath !== '/people') {
          enqueueAction(action);
          setTimeout(() => navigate('/people'), 150);
        } else {
          window.dispatchEvent(new CustomEvent('velo-delete-member', { 
            detail: { name: action.params?.name } 
          }));
        }
        break;

      case 'search':
        toast.info(`Searching for "${action.params?.query || 'anything'}"`);
        closeVoiceOverlay();
        break;

      case 'gantt_query':
      case 'resource_query':
        const data = await getDashboardData();
        const summary = await geminiVoiceService.summarizeData(data, action.params?.query || action.type.replace('_', ' '));
        speak(summary);
        toast.info(summary);
        break;

      case 'info':
        break;

      case 'unknown':
        const fallback = action.response || "I didn't catch that. Try saying go to projects or add a team member.";
        speak(fallback);
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
