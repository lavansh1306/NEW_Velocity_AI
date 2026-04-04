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
    setPendingConfirmation,
    startListening,
  } = useVoice();

  const handleVoiceCommand = async (transcript: string, currentPath: string) => {
    console.log('[VoiceActions] Command received:', transcript);
    setProcessing(true);

    try {
      const action = await geminiVoiceService.parseIntent(transcript, currentPath);
      console.log('[VoiceActions] Parsed action:', action);

      // Multi-turn: agent needs more info
      if (action.prompt) {
        speak(action.prompt);
        toast.info(action.prompt);
        waitThenListen(500);
        return;
      }

      // Speak the response if there is one
      if (action.response) {
        const cleanResponse = action.response
          .replace(/^(in\s+)?(standard|default|normal)\s+mode[,.]?\s*/i, '')
          .replace(/^(okay|ok|sure)[,.]?\s+(in\s+)?(standard|default|normal)\s+mode[,.]?\s*/i, '')
          .trim();
        const finalResponse = cleanResponse.length > 0
          ? cleanResponse.charAt(0).toUpperCase() + cleanResponse.slice(1)
          : action.response;
        speak(finalResponse);
        toast.info(finalResponse);
      }

      // Execute action
      if (action.requiresConfirmation) {
        await executeWithUndo(action, currentPath);
      } else {
        await executeAction(action, currentPath);
      }

    } catch (error) {
      console.error('[VoiceActions] Failed:', error);
      toast.error("Sorry, I had trouble with that command.");
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Execute destructive action with 5-second undo toast.
   */
  const executeWithUndo = async (action: VoiceAction, currentPath: string) => {
    let undone = false;

    const actionLabel = action.type === 'delete_team_member'
      ? `Removing ${action.params?.name || 'member'} from team`
      : action.type.replace(/_/g, ' ');

    toast(`${actionLabel}`, {
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
      await executeAction(action, currentPath);
    }
  };

  /**
   * Wait for speech to finish then re-open mic.
   */
  const waitThenListen = (extraMs = 500) => {
    if (!('speechSynthesis' in window)) {
      setTimeout(() => startListening(), extraMs);
      return;
    }
    const synth = window.speechSynthesis;
    let attempts = 0;
    const poll = setInterval(() => {
      attempts++;
      if (synth.speaking) {
        clearInterval(poll);
        const waitEnd = setInterval(() => {
          if (!synth.speaking) {
            clearInterval(waitEnd);
            setTimeout(() => startListening(), extraMs);
          }
        }, 100);
        setTimeout(() => clearInterval(waitEnd), 10000);
      }
      if (attempts > 30) {
        clearInterval(poll);
        setTimeout(() => startListening(), extraMs);
      }
    }, 100);
  };

  const executeAction = async (action: VoiceAction, currentPath: string) => {
    switch (action.type) {
      case 'navigate':
        if (action.target) {
          // Close overlay THEN navigate so user sees the page change
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
        console.log('[VoiceActions] Adding member:', { name, email, role });
        if (!name && !email) {
          speak("I need a name or email to add a team member. Try saying add Sarah as frontend developer.");
          waitThenListen(600);
          return;
        }
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
        if (currentPath !== '/people') {
          enqueueAction(action);
          closeVoiceOverlay();
          setTimeout(() => navigate('/people'), 150);
        } else {
          window.dispatchEvent(new CustomEvent('velo-delete-member', {
            detail: { name: action.params?.name }
          }));
          closeVoiceOverlay();
        }
        break;

      case 'search':
        toast.info(`Searching for "${action.params?.query || ''}"`);
        closeVoiceOverlay();
        break;

      case 'gantt_query':
      case 'resource_query':
        const data = await getDashboardData();
        const summary = await geminiVoiceService.summarizeData(
          data,
          action.params?.query || action.type.replace('_', ' ')
        );
        speak(summary);
        toast.info(summary);
        // Keep overlay open after info response — re-listen
        waitThenListen(600);
        break;

      case 'info':
        // Keep overlay open after info — re-listen so user can ask follow-up
        waitThenListen(600);
        break;

      case 'unknown':
        const fallback = action.response || "I didn't catch that. Try saying go to projects, or add a team member.";
        speak(fallback);
        waitThenListen(600);
        break;

      default:
        console.warn('[VoiceActions] Unhandled action type:', action.type);
        break;
    }
  };

  return { handleVoiceCommand };
};
