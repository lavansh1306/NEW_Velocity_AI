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

  const confirmationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmationRetryRef = useRef(0);

  const clearConfirmationTimeout = () => {
    if (confirmationTimeoutRef.current) {
      clearTimeout(confirmationTimeoutRef.current);
      confirmationTimeoutRef.current = null;
    }
  };

  const scheduleConfirmationTimeout = () => {
    clearConfirmationTimeout();
    confirmationTimeoutRef.current = setTimeout(() => {
      setPendingConfirmation(null);
      confirmationRetryRef.current = 0;
      speak("No response received. Action cancelled.");
      toast.info("Action cancelled — no response");
    }, 12000);
  };

  /**
   * Waits for speech synthesis to actually START then END,
   * then opens the mic. Uses utterance events instead of polling.
   */
  const listenAfterSpeech = (extraDelayMs = 600) => {
    // If nothing is queued to speak, just listen after a short delay
    if (!('speechSynthesis' in window)) {
      setTimeout(() => startListening(), extraDelayMs);
      return;
    }

    const synth = window.speechSynthesis;

    // Poll until speech starts (max 3s wait)
    let started = false;
    let elapsed = 0;
    const waitForStart = setInterval(() => {
      elapsed += 100;
      if (synth.speaking) {
        started = true;
        clearInterval(waitForStart);
        // Now wait for it to finish
        const waitForEnd = setInterval(() => {
          if (!synth.speaking) {
            clearInterval(waitForEnd);
            console.log('[VoiceActions] Speech ended, starting mic in', extraDelayMs, 'ms');
            setTimeout(() => startListening(), extraDelayMs);
          }
        }, 100);
        // Safety cutoff — don't wait more than 10s for speech to end
        setTimeout(() => clearInterval(waitForEnd), 10000);
      }
      // If speech never started after 3s, listen anyway
      if (elapsed >= 3000 && !started) {
        clearInterval(waitForStart);
        console.log('[VoiceActions] Speech never started, listening anyway');
        setTimeout(() => startListening(), extraDelayMs);
      }
    }, 100);
  };

  const handleVoiceCommand = async (transcript: string, currentPath: string) => {
    console.log('[VoiceActions] handleVoiceCommand:', transcript, '| pendingConfirmation:', !!pendingConfirmation);

    // ─── 1. Handle Pending Confirmation ──────────────────────────────────────
    if (pendingConfirmation) {
      clearConfirmationTimeout();
      const text = transcript.toLowerCase().trim();
      console.log('[VoiceActions] Confirmation response:', text);

      const isConfirmed =
        text.includes('yes') ||
        text.includes('confirm') ||
        text.includes('sure') ||
        text.includes('ok') ||
        text.includes('do it') ||
        text.includes('go ahead') ||
        text.includes('approve') ||
        text.includes('yeah') ||
        text.includes('yep');

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
        confirmationRetryRef.current += 1;
        if (confirmationRetryRef.current >= 2) {
          setPendingConfirmation(null);
          confirmationRetryRef.current = 0;
          speak("I couldn't understand. Action cancelled.");
          toast.info("Action cancelled — unclear response");
        } else {
          speak("Sorry, say yes to confirm or no to cancel.");
          toast.warning("Say yes or no");
          scheduleConfirmationTimeout();
          listenAfterSpeech(600);
        }
      }
      return;
    }

    // ─── 2. Normal Command Flow ───────────────────────────────────────────────
    setProcessing(true);

    try {
      const action = await geminiVoiceService.parseIntent(transcript, currentPath);

      if (action.prompt) {
        speak(action.prompt);
        toast.info(action.prompt);
        listenAfterSpeech(500);
        return;
      }

      if (action.requiresConfirmation) {
        setPendingConfirmation(action);
        confirmationRetryRef.current = 0;
        const confirmMsg = action.response || `I'm about to ${action.type.replace(/_/g, ' ')}. Are you sure?`;
        speak(confirmMsg);
        toast.warning("Say yes to confirm or no to cancel");
        scheduleConfirmationTimeout();
        listenAfterSpeech(600);
        return;
      }

      if (action.response) {
        speak(action.response);
        toast.info(action.response);
      }

      await executeAction(action, currentPath);

    } catch (error) {
      console.error('[VoiceActions] Failed to handle command:', error);
      toast.error("Sorry, I had trouble processing that command.");
    } finally {
      setProcessing(false);
    }
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
        toast.success(`Intent: Create task "${action.params?.taskName || 'New Task'}"`);
        break;

      case 'add_team_member':
        const { name, email, role } = action.params || {};
        if (currentPath !== '/people') {
          enqueueAction(action);
          navigate('/people');
        } else {
          window.dispatchEvent(new CustomEvent('velo-add-member', { detail: { name, email, role } }));
        }
        break;

      case 'delete_team_member':
        if (currentPath !== '/people') {
          enqueueAction(action);
          navigate('/people');
        } else {
          window.dispatchEvent(new CustomEvent('velo-delete-member', { detail: { name: action.params?.name } }));
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
          console.warn('[VoiceActions] Unknown action type:', action.type);
        }
        break;
    }
  };

  return { handleVoiceCommand };
};
