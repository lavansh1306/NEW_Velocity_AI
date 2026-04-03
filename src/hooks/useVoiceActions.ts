import { useNavigate } from 'react-router-dom';
import { useVoice } from '@/contexts/VoiceContext';
import { geminiVoiceService, VoiceAction } from '@/services/geminiVoiceService';
import { getDashboardData } from '@/services/dashboardService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useLeaveManagementData } from './useLeaveManagementData';

export const useVoiceActions = () => {
  const navigate = useNavigate();
  const { 
    setProcessing, 
    speak, 
    enqueueAction, 
    pendingConfirmation, 
    setPendingConfirmation,
    startListening,
    status 
  } = useVoice();
  const { orgId, orgRole, user: authUser } = useAuth();
  const { leaves, balances, leaveTypes, addLeaveRequest, updateLeaveStatus } = useLeaveManagementData();

  const handleVoiceCommand = async (transcript: string, currentPath: string) => {
    // 0. Guard against multiple concurrent commands
    // Note: status is now extracted from context at the top level
    if (status === 'processing') {
      console.warn('[useVoiceActions] Already processing a command, ignoring:', transcript);
      return;
    }

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
        // Stay in confirmation mode? Or just reset? 
        // For now, let's reset to avoid stuck states, but keep the pending action
      }
      return;
    }

    setProcessing(true);
    
    try {
      const action = await geminiVoiceService.parseIntent(transcript, currentPath);
      
      // Check if we are in fallback mode (Gemini error caught in service)
      if (action.response?.includes("Standard Mode") || action.response?.includes("Standard command")) {
        toast.info("Gemini is currently limited. Using Standard Mode.");
      }
      
      // 2. Handle Multi-turn Prompt
      if (action.prompt) {
        speak(action.prompt);
        toast.info(action.prompt);
        // Important: We need to listen again for the answer
        setTimeout(() => startListening(), 2000);
        return;
      }

      // 3. Handle Confirmation Gate
      if (action.requiresConfirmation) {
        setPendingConfirmation(action);
        const confirmMsg = action.response || `I'm about to ${action.type.replace(/_/g, ' ')}. Are you sure?`;
        speak(confirmMsg);
        toast.warning("Confirmation required");
        // Re-trigger listening automatically for the confirmation
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
      toast.error("Sorry, I had trouble processing that command.");
    } finally {
      setProcessing(false);
    }
  };

  const executeAction = async (action: VoiceAction, currentPath: string) => {
    // 1. RBAC Check: Restrict Manager/Admin Commands
    const restrictedActions: VoiceAction['type'][] = [
      'approve_leave', 
      'deny_leave', 
      'add_team_member', 
      'delete_team_member', 
      'create_project', 
      'create_task'
    ];

    const isManager = orgRole === 'admin' || orgRole === 'manager';

    if (restrictedActions.includes(action.type) && !isManager) {
      const msg = "I'm sorry, that action is restricted to managers and administrators.";
      speak(msg);
      toast.error(msg);
      return;
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
        const { taskName: tName, projectName: pName, assigneeName } = action.params || {};
        const nameToUse = tName || 'New Task';
        
        if (!orgId) {
          speak("I'm sorry, I can't add tasks without an active organization.");
          break;
        }

        try {
          // 1. Fetch available projects to find the target
          const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('id, name')
            .eq('organization_id', orgId)
            .eq('status', 'active');

          if (projectsError) throw projectsError;

          let targetProjectId: string | null = null;
          let targetProjectName = '';

          if (pName) {
            const matched = projects?.find(p => p.name.toLowerCase().includes(pName.toLowerCase()));
            if (matched) {
              targetProjectId = matched.id;
              targetProjectName = matched.name;
            } else {
              // AUTO-CREATE PROJECT
              speak(`Project ${pName} doesn't exist. I'll create it for you.`);
              const { data: newProj, error: createError } = await supabase
                .from('projects')
                .insert({
                  organization_id: orgId,
                  name: pName,
                  status: 'active',
                  source: 'internal'
                })
                .select()
                .single();
              
              if (createError) throw createError;
              targetProjectId = newProj.id;
              targetProjectName = newProj.name;
            }
          } else {
            // Default to most recent if no project specified
            if (projects && projects.length > 0) {
              const sorted = [...projects].sort((a,b) => b.id.localeCompare(a.id)); // Simple heuristic
              targetProjectId = sorted[0].id;
              targetProjectName = sorted[0].name;
            } else {
              speak("You don't have any active projects. I'll create a default one for you.");
              const { data: newProj, error: createError } = await supabase
                .from('projects')
                .insert({ organization_id: orgId, name: 'General Tasks', status: 'active' })
                .select().single();
              if (createError) throw createError;
              targetProjectId = newProj.id;
              targetProjectName = newProj.name;
            }
          }

          // 2. Resolve Assignee if provided
          let assigneeId = null;
          if (assigneeName) {
            const { data: members, error: membersError } = await supabase
              .from('users')
              .select('id, full_name')
              .eq('organization_id', orgId);
            
            if (!membersError && members) {
              const match = members.find(m => m.full_name?.toLowerCase().includes(assigneeName.toLowerCase()));
              if (match) {
                assigneeId = match.id;
              } else {
                speak(`I couldn't find a team member named ${assigneeName}. I'll leave the task unassigned.`);
              }
            }
          }

          // 3. Insert the task
          const { error: insertError } = await supabase
            .from('tasks')
            .insert({
              project_id: targetProjectId,
              name: nameToUse,
              status: 'not_started',
              estimated_hours: 4,
              assignee_id: assigneeId
            });

          if (insertError) throw insertError;

          const assignmentMsg = assigneeName && assigneeId ? ` and assigned it to ${assigneeName}` : "";
          const msg = `Done! Added task "${nameToUse}" to project ${targetProjectName}${assignmentMsg}.`;
          speak(msg);
          toast.success(msg);

          // Force a refresh if on projects page
          window.dispatchEvent(new CustomEvent('velo-refresh-data'));

        } catch (err: any) {
          console.error('[VoiceActions] Smart task creation failed:', err);
          speak("I'm sorry, I encountered an error while setting up that task.");
        }
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

      case 'request_leave':
        const { startDate, endDate, reason, leaveType } = action.params || {};
        
        try {
          // 1. Resolve Leave Type ID
          let typeId = leaveTypes[0]?.id; // Default to first (usually Annual/Sick)
          if (leaveType) {
             const matched = leaveTypes.find(t => t.name.toLowerCase().includes(leaveType.toLowerCase()));
             if (matched) typeId = matched.id;
          }

          // 2. Format Dates
          const parseDate = (d: string) => {
            if (d === 'tomorrow') {
              const date = new Date();
              date.setDate(date.getDate() + 1);
              return date.toISOString().split('T')[0];
            }
            if (d === 'today') return new Date().toISOString().split('T')[0];
            // Simple string date parsing (YYYY-MM-DD or Month Day)
            try {
              const parsed = new Date(d);
              if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
            } catch {}
            return new Date().toISOString().split('T')[0];
          };

          const sDate = parseDate(startDate || 'tomorrow');
          const eDate = parseDate(endDate || startDate || 'tomorrow');

          await addLeaveRequest({
            startDate: sDate,
            endDate: eDate,
            reason: reason || 'Voice Request',
            leave_type_id: typeId
          });

          const msg = `Leave request submitted for ${sDate}${eDate !== sDate ? ` to ${eDate}` : ''}.`;
          speak(msg);
          toast.success(msg);
          
          if (currentPath !== '/leave') {
            navigate('/leave');
          }
        } catch (err: any) {
          console.error('[VoiceActions] Leave request failed:', err);
          speak("I'm sorry, I couldn't submit your leave request. Please check your balance.");
        }
        break;

      case 'get_leave_status':
        if (!leaves || leaves.length === 0) {
          speak("You don't have any recent leave requests.");
          break;
        }

        const myLeaves = leaves.filter(l => l.user_id === authUser?.id);
        if (myLeaves.length === 0) {
          speak("I couldn't find any leave requests for you.");
        } else {
          const latest = myLeaves[0];
          const statusMsg = `Your request for ${latest.startDate} is currently ${latest.status}.`;
          speak(statusMsg);
          toast.info(statusMsg);
        }
        break;

      case 'approve_leave':
      case 'deny_leave':
        const targetName = action.params?.name;
        if (!targetName) {
          speak(`Whose leave request should I ${action.type === 'approve_leave' ? 'approve' : 'deny'}?`);
          break;
        }

        const pendingRequest = leaves.find(l => 
          l.status === 'pending' && 
          (l.name.toLowerCase().includes(targetName.toLowerCase()) || 
           targetName.toLowerCase().includes(l.name.toLowerCase()))
        );

        if (!pendingRequest) {
          speak(`I couldn't find any pending leave requests for ${targetName}.`);
          break;
        }

        try {
          const newStatus = action.type === 'approve_leave' ? 'approved' : 'rejected';
          await updateLeaveStatus(pendingRequest.id, newStatus);
          const msg = `Successfully ${newStatus === 'approved' ? 'approved' : 'rejected'} the leave request for ${pendingRequest.name}.`;
          speak(msg);
          toast.success(msg);
        } catch (err) {
          console.error('[VoiceActions] Update leave failed:', err);
          speak("I'm sorry, I couldn't update the leave status.");
        }
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
