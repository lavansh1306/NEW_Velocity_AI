import { useNavigate } from 'react-router-dom';
import { useVoice } from '@/contexts/VoiceContext';
import { geminiVoiceService, VoiceAction } from '@/services/geminiVoiceService';
import { getDashboardData } from '@/services/dashboardService';
import { supabase } from '@/lib/supabase';
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

      if (action.response && action.type !== 'navigate') {
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
          if (action.response) {
            speak(action.response);
            toast.info(action.response);
          }
          setTimeout(() => {
            closeVoiceOverlay();
            setTimeout(() => navigate(action.target!), 250);
          }, 900);
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
        }, 900);
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

      // #26 improved resource_query with formatted capacity response
      case 'gantt_query':
      case 'resource_query': {
        try {
          const data = await getDashboardData();
          const members = (data as any)?.teamCapacity || (data as any)?.team_members || [];
          let capacitySummary = '';
          if (Array.isArray(members) && members.length > 0) {
            const available = members
              .filter((m: any) => (m.available_hours || m.availableHours || 0) > 0)
              .map((m: any) => {
                const hours = m.available_hours || m.availableHours || 0;
                const name = m.name || m.full_name || 'Someone';
                return `${name} has ${hours} hours free`;
              });
            if (available.length > 0) capacitySummary = available.slice(0, 4).join(', ') + '.';
          }
          const summary = capacitySummary
            ? capacitySummary
            : await geminiVoiceService.summarizeData(data, action.params?.query || 'team capacity this week');
          speak(summary);
          toast.info(summary);
        } catch {
          speak("I couldn't retrieve capacity data right now.");
        }
        break;
      }

      case 'info':
        if (action.response) {
          speak(action.response);
          toast.info(action.response);
        }
        break;

      // #25 Natural language task status update
      case 'update_task': {
        const taskName = (action.params as any)?.taskName;
        const hours = (action.params as any)?.hours;
        const status = (action.params as any)?.status || 'completed';
        if (!taskName) {
          speak("Which task would you like to update?");
          break;
        }
        try {
          const { data: tasks } = await supabase
            .from('tasks')
            .select('id, name')
            .ilike('name', `%${taskName}%`)
            .limit(1);

          if (!tasks || tasks.length === 0) {
            speak(`I couldn't find a task matching "${taskName}".`);
            toast.error(`Task not found: ${taskName}`);
            break;
          }
          const task = tasks[0];
          await supabase.from('tasks').update({ status }).eq('id', task.id);
          if (hours && hours > 0) {
            await supabase.from('timesheets').insert({
              task_id: task.id,
              hours_logged: hours,
              logged_at: new Date().toISOString(),
              notes: `Voice logged: ${hours} hours`,
            });
          }
          const hoursMsg = hours ? ` and logged ${hours} hours` : '';
          speak(`Done. Marked "${task.name}" as ${status}${hoursMsg}.`);
          toast.success(`Task updated: ${task.name}`);
        } catch (e) {
          console.error('[VoiceActions] update_task error:', e);
          speak('Something went wrong updating the task.');
        }
        closeVoiceOverlay();
        break;
      }

      // Voice-driven leave approval
      case 'approve_leave': {
        const personName = action.params?.name;
        if (!personName) {
          speak("Who's leave would you like to approve?");
          break;
        }
        try {
          const { data: leaves } = await supabase
            .from('leave_requests')
            .select('id, start_date, end_date, users(name)')
            .eq('status', 'pending')
            .ilike('users.name' as any, `%${personName}%`)
            .limit(1);

          if (!leaves || leaves.length === 0) {
            speak(`I couldn't find a pending leave request for ${personName}.`);
            toast.error(`No pending leave found for ${personName}`);
            break;
          }

          const leave = leaves[0];
          const userName = (leave as any).users?.name || personName;

          const res = await fetch('/api/leave-approval/approve-single', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: leave.id,
              name: userName,
              startDate: leave.start_date,
              endDate: leave.end_date,
              reason: 'Voice approved',
              status: 'Pending'
            })
          });

          if (res.ok) {
            await supabase
              .from('leave_requests')
              .update({ status: 'approved' })
              .eq('id', leave.id);
            speak(`Done. ${userName}'s leave has been approved.`);
            toast.success(`${userName}'s leave approved`);
          } else {
            speak(`Sorry, I couldn't approve the leave request.`);
            toast.error('Leave approval failed');
          }
        } catch (e) {
          console.error('[VoiceActions] approve_leave error:', e);
          speak('Something went wrong approving the leave.');
        }
        closeVoiceOverlay();
        break;
      }

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
