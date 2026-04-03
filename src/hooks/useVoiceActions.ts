import { useNavigate } from 'react-router-dom';
import { useVoice } from '@/contexts/VoiceContext';
import { geminiVoiceService, VoiceAction } from '@/services/geminiVoiceService';
import { getDashboardData } from '@/services/dashboardService';
import { toast } from 'sonner';

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
    console.log('[VoiceActions] Command:', transcript);
    setProcessing(true);

    try {
      const action = await geminiVoiceService.parseIntent(transcript, currentPath);

      // Multi-turn: agent needs more info — re-listen after speaking
      if (action.prompt) {
        speak(action.prompt);
        toast.info(action.prompt);
        waitThenListen();
        return;
      }

      if (action.response) {
        // Strip any Gemini meta-commentary before speaking
        const cleanResponse = action.response
          .replace(/^(in\s+)?(standard|default|normal)\s+mode[,.]?\s*/i, "")
          .replace(/^(okay|ok|sure)[,.]?\s+(in\s+)?(standard|default|normal)\s+mode[,.]?\s*/i, "")
          .trim();
        const finalResponse = cleanResponse.length > 0
          ? cleanResponse.charAt(0).toUpperCase() + cleanResponse.slice(1)
          : action.response;
        speak(finalResponse);
        toast.info(finalResponse);
      }

      // For destructive actions: execute immediately + show undo toast
      // No yes/no loop — just do it with a 5s undo window
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
   * Execute a destructive action with a 5-second undo toast.
   * No yes/no required — just speak the action and let user undo if needed.
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

    // Wait 5 seconds — if user didn't undo, execute
    await new Promise(resolve => setTimeout(resolve, 5000));

    if (!undone) {
      await executeAction(action, currentPath);
    }
  };

  /**
   * Wait for speech to finish then re-open the mic.
   * Uses polling to detect when speechSynthesis actually stops.
   */
  const waitThenListen = (extraMs = 500) => {
    if (!('speechSynthesis' in window)) {
      setTimeout(() => startListening(), extraMs);
      return;
    }

    const synth = window.speechSynthesis;
    let attempts = 0;

    // Wait up to 3s for speech to start, then wait for it to end
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
      if (attempts > 30) { // 3 seconds
        clearInterval(poll);
        setTimeout(() => startListening(), extraMs);
      }
    }, 100);
  };

  const executeAction = async (action: VoiceAction, currentPath: string) => {
    switch (action.type) {
      case 'navigate':
        if (action.target) navigate(action.target);
        break;

      case 'create_project':
        const { projectTitle, projectDescription, autoAnalyze } = action.params || {};
        navigate('/plan', {
          state: {
            voiceTitle: projectTitle,
            voiceDescription: projectDescription,
            autoAnalyze: autoAnalyze
          }
        });
        break;

      case 'create_task':
        toast.success(`Creating task "${action.params?.taskName || 'New Task'}"`);
        break;

      case 'add_team_member':
        const { name, email, role } = action.params || {};
        if (currentPath !== '/people') {
          enqueueAction(action);
          navigate('/people');
        } else {
          window.dispatchEvent(new CustomEvent('velo-add-member', {
            detail: { name, email, role }
          }));
        }
        break;

      case 'delete_team_member':
        if (currentPath !== '/people') {
          enqueueAction(action);
          navigate('/people');
        } else {
          window.dispatchEvent(new CustomEvent('velo-delete-member', {
            detail: { name: action.params?.name }
          }));
        }
        break;

      case 'search':
        toast.info(`Searching for "${action.params?.query || ''}"`);
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
        break;

      case 'info':
        // info responses spoken above — re-listen so overlay stays open
        waitThenListen(600);
        break;

      case 'unknown':
        // Speak fallback then re-open mic so user can try again immediately
        const fallback = action.response || "I did not catch that. Try saying go to projects, plan a project, or add a team member.";
        speak(fallback);
        waitThenListen(600);
        break;

      default:
        console.warn("[VoiceActions] Unknown action:", action.type);
        break;
    }
  };

  return { handleVoiceCommand };
};
