import { useNavigate } from 'react-router-dom';
import { useVoice } from '@/contexts/VoiceContext';
import { geminiVoiceService, VoiceAction } from '@/services/geminiVoiceService';
import { getDashboardData } from '@/services/dashboardService';
import { toast } from 'sonner';
import { useRef } from 'react';

export const useVoiceActions = () => {
  const navigate = useNavigate();
  const {
    setProcessing,
    speak,
    enqueueAction,
    pendingConfirmation,
    setPendingConfirmation,
    startListening,
    stopListening,
  } = useVoice();

  // Track confirmation timeout so we can cancel it
  const confirmationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track how many times we've re-asked (max 2 retries)
  const confirmationRetryRef = useRef(0);

  /**
   * Waits for speech synthesis to finish, THEN starts listening.
   * This prevents the mic from picking up the agent's own voice.
   */
  const listenAfterSpeech = (delayMs = 400) => {
    // If speech synthesis is active, wait for it to end before listening
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      const checkDone = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clearInterval(checkDone);
          setTimeout(() => startListening(), delayMs);
        }
      }, 100);
      // Safety cutoff after 8 seconds — don't wait forever
      setTimeout(() => clearInterval(checkDone), 8000);
    } else {
      setTimeout(() => startListening(), delayMs);
    }
  };

  /**
   * Schedule auto-cancel if user says nothing within 10 seconds
   */
  const scheduleConfirmationTimeout = () => {
    if (confirmationTimeoutRef.current) {
      clearTimeout(confirmationTimeoutRef.current);
    }
    confirmationTimeoutRef.current = setTimeout(() => {
      setPendingConfirmation(null);
      confirmationRetryRef.current = 0;
      speak("No response received. Action cancelled.");
      toast.info("Action cancelled — no response");
    }, 10000);
  };

  const clearConfirmationTimeout = () => {
    if (confirmationTimeoutRef.current) {
      clearTimeout(confirmationTimeoutRef.current);
      confirmationTimeoutRef.current = null;
    }
  };

  const handleVoiceCommand = async (transcript: string, currentPath: string) => {
    // ─── 1. Handle Pending Confirmation ──────────────────────────────────────
    if (pendingConfirmation) {
      clearConfirmationTimeout();
      const text = transcript.toLowerCase().trim();

      const isConfirmed =
        text.includes('yes') ||
        text.includes('confirm') ||
        text.includes('sure') ||
        text.includes('ok') ||
        text.includes('do it') ||
        text.includes('go ahead') ||
        text.includes('approve');

      const isCancelled =
        text.includes('no') ||
        text.includes('cancel') ||
        text.includes('stop') ||
        text.includes('abort') ||
        text.includes('never mind') ||
        text.includes('nope');

      if (isConfirmed) {
        const actionToExecute = { ...pendingConfirmation, requiresConfirmation: false };
        setPendingConfirmation(null);
        confirmationRetryRef.current = 0;
        speak("Got it, doing it now.");
        await executeAction(actionToExecute, currentPath);

      } else if (isCancelled) {
        setPendingConfirmation(null);
        confirmationRetryRef.current = 0;
        speak("Okay, cancelled.");
        toast.info("Action cancelled");

      } else {
        // Unrecognised response — retry up to 2 times then cancel
        confirmationRetryRef.current += 1;

        if (confirmationRetryRef.current >= 2) {
          // Too many retries — cancel to avoid infinite loop
          setPendingConfirmation(null);
          confirmationRetryRef.current = 0;
          speak("I couldn't understand. Action cancelled.");
          toast.info("Action cancelled — unclear response");
        } else {
          // Re-ask and re-listen
          speak("Sorry, I didn't catch that. Please say yes to confirm or no to cancel.");
          toast.warning("Say yes or no");
          scheduleConfirmationTimeout();
          listenAfterSpeech(500);
        }
      }
      return;
    }

    // ─── 2. Normal Command Flow ───────────────────────────────────────────────
    setProcessing(true);

    try {
      const action = await geminiVoiceService.parseIntent(transcript, currentPath);

      // Multi-turn: agent needs more info
      if (action.prompt) {
        speak(action.prompt);
        toast.info(action.prompt);
        // Wait for speech to finish before re-listening
        listenAfterSpeech(500);
        return;
      }

      // Confirmation gate: destructive actions need yes/no
      if (action.requiresConfirmation) {
        setPendingConfirmation(action);
        confirmationRetryRef.current = 0;
        const confirmMsg = action.response || `I'm about to ${action.type.replace(/_/g, ' ')}. Are you sure?`;
        speak(confirmMsg);
        toast.warning("Say yes to confirm or no to cancel");
        // Schedule auto-cancel if user doesn't respond
        scheduleConfirmationTimeout();
        // Wait for speech to finish THEN listen — prevents mic picking up agent voice
        listenAfterSpeech(600);
        return;
      }

      if (action.response) {
        speak(action.response);
        toast.info(action.response);
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
        toast.info(`Searching for "${action.params?.query || 'anything'}"`);
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

      default:
        if (action.type !== 'unknown') {
          console.warn('[useVoiceActions] Unknown action type:', action.type);
        }
        break;
    }
  };

  return { handleVoiceCommand };
};
