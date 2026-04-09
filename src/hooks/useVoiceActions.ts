import { useNavigate } from 'react-router-dom';
import { useVoice } from '@/contexts/VoiceContext';
import { geminiVoiceService, VoiceAction } from '@/services/geminiVoiceService';
import { findBestMatch } from '@/lib/utils';
import { getDashboardData } from '@/services/dashboardService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useLeaveManagementData } from './useLeaveManagementData';
import { getCurrentOrgId, getCurrentOrgRole } from '@/lib/orgContext';
import { peopleService } from '../services/peopleService';

export const useVoiceActions = () => {
  const navigate = useNavigate();
  const { 
    setProcessing, 
    speak, 
    enqueueAction, 
    pendingConfirmation, 
    setPendingConfirmation,
    startListening,
    status,
    lastInteractedEntity,
    setLastInteractedEntity 
  } = useVoice();
  const { orgId, orgRole, user: authUser } = useAuth();
  const { leaves, balances, leaveTypes, addLeaveRequest, updateLeaveStatus } = useLeaveManagementData();

  const handleVoiceCommand = async (transcript: string, currentPath: string) => {
    // 0. Guard against multiple concurrent commands
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
      }
      return;
    }

    setProcessing(true);
    
    try {
      const action = await geminiVoiceService.parseIntent(transcript, currentPath, lastInteractedEntity);
      
      if (action.prompt) {
        speak(action.prompt);
        toast.info(action.prompt);
        setTimeout(() => startListening(), 2000);
        return;
      }

      if (action.requiresConfirmation) {
        setPendingConfirmation(action);
        const confirmType = action.type.replace(/_/g, ' ');
        const nameText = action.params?.taskName || action.params?.name || '';
        const confirmMsg = action.response || `I'm about to ${confirmType} ${nameText}. Are you sure?`;
        speak(confirmMsg);
        toast.warning("Confirmation required");
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
      'update_project',
      'delete_project',
      'create_task',
      'assign_task',
      'update_task',
      'delete_task'
    ];

    // 1. Resolve effective organization context
    const currentOrgId = orgId || getCurrentOrgId();
    const currentOrgRole = orgRole || getCurrentOrgRole();
    const isManager = currentOrgRole === 'admin' || currentOrgRole === 'manager';

    if (restrictedActions.includes(action.type) && !isManager) {
      const msg = "I'm sorry, that action is restricted to managers and administrators.";
      speak(msg);
      toast.error(msg);
      return;
    }

    if (!currentOrgId && restrictedActions.includes(action.type)) {
      const msg = "I'm having trouble identifying your organization. Please refresh the page.";
      speak(msg);
      toast.error(msg);
      return;
    }

    // Helper to validate UUIDs before sending to Supabase
    const isValidUUID = (id: any) => {
      if (!id || typeof id !== 'string') return false;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(id);
    };

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
        setLastInteractedEntity({ id: 'pending', type: 'project', name: projectTitle || 'New Project' });
        break;

      case 'update_project':
        const { projectTitle: upTitle, newTitle, newDescription } = action.params || {};
        try {
          if (!currentOrgId) {
            speak("I can't access project details without your organization context. Please refresh the page.");
            break;
          }

          // Resolve which project to update (context vs named)
          let targetProjId = null;
          let targetProjName = '';

          if (upTitle) {
            const { data: projs, error: fetchErr } = await supabase.from('projects').select('id, name').eq('organization_id', currentOrgId);
            if (fetchErr) throw fetchErr;
            const match = findBestMatch(upTitle, projs || [], (p) => p.name);
            if (match) { targetProjId = match.id; targetProjName = match.name; }
          } else if (lastInteractedEntity?.type === 'project' && isValidUUID(lastInteractedEntity.id)) {
            targetProjId = lastInteractedEntity.id;
            targetProjName = lastInteractedEntity.name;
          }

          if (!targetProjId) {
            speak("I'm not sure which project you want to update. Could you specify the name?");
            break;
          }

          const updates: any = {};
          if (newTitle) updates.name = newTitle;
          if (newDescription) updates.description = newDescription;

          const { error: upErr } = await supabase.from('projects').update(updates).eq('id', targetProjId);
          if (upErr) throw upErr;

          const upMsg = `Successfully updated project "${targetProjName}".`;
          speak(upMsg);
          toast.success(upMsg);
          setLastInteractedEntity({ id: targetProjId, type: 'project', name: newTitle || targetProjName });
          window.dispatchEvent(new CustomEvent('velo-refresh-data'));
        } catch (err) {
          console.error('[VoiceActions] Project update failed:', err);
          speak("I couldn't update the project details right now.");
        }
        break;

      case 'delete_project':
        const { projectTitle: dpTitle } = action.params || {};
        try {
           let dProjId = null;
           let dProjName = '';

           if (dpTitle) {
             const { data: projs, error: fetchErr } = await supabase.from('projects').select('id, name').eq('organization_id', currentOrgId);
             if (fetchErr) throw fetchErr;
             const match = findBestMatch(dpTitle, projs || [], (p) => p.name);
             if (match) { dProjId = match.id; dProjName = match.name; }
           } else if (lastInteractedEntity?.type === 'project' && isValidUUID(lastInteractedEntity.id)) {
             dProjId = lastInteractedEntity.id;
             dProjName = lastInteractedEntity.name;
           }

           if (!dProjId) {
             speak("Which project should I delete?");
             break;
           }

           // Deletions are confirmation-guarded by handleVoiceCommand loop
           const { error: dErr } = await supabase.from('projects').delete().eq('id', dProjId);
           if (dErr) throw dErr;

           const dMsg = `Deleted project "${dProjName}" successfully.`;
           speak(dMsg);
           toast.success(dMsg);
           setLastInteractedEntity(null);
           window.dispatchEvent(new CustomEvent('velo-refresh-data'));
        } catch (err) {
          console.error('[VoiceActions] Project deletion failed:', err);
          speak("I ran into an issue deleting that project.");
        }
        break;
      
      case 'create_task':
        const { taskName: tName, projectName: pName, assigneeName: cAssigneeName } = action.params || {};
        
        if (!tName) {
          speak("I'm sorry, I couldn't catch the name for the task. What should I call it?");
          break;
        }
        
        try {
          const projectMatch = currentPath.match(/\/projects\/([a-f0-9-]{36})/i);
          let targetProjectId = projectMatch ? projectMatch[1] : null;
          let targetOrgId = currentOrgId;

          // Resolve Target Organization context
          if (targetProjectId) {
             const { data: proj } = await supabase.from('projects').select('organization_id').eq('id', targetProjectId).single();
             if (proj) targetOrgId = proj.organization_id;
          }

          if (!targetOrgId) {
            speak("I need more context about your organization to create a task.");
            break;
          }

          // Fetch active projects for this org
          const { data: projects } = await supabase
            .from('projects')
            .select('id, name, organization_id')
            .eq('organization_id', targetOrgId)
            .eq('status', 'active');

          let targetProjectName = '';

          if (pName) {
            const matched = projects?.find(p => p.name.toLowerCase().includes(pName.toLowerCase()));
            if (matched) {
              targetProjectId = matched.id;
              targetProjectName = matched.name;
            } else {
              speak(`I couldn't find a project named ${pName}. Which project should I add this task to?`);
              break;
            }
          } else if (!targetProjectId) {
            if (projects && projects.length > 0) {
              const sorted = [...projects].sort((a,b) => b.id.localeCompare(a.id));
              targetProjectId = sorted[0].id;
              targetProjectName = sorted[0].name;
            } else {
              speak("I couldn't find an active project to add this task to. Please specify a project name.");
              break;
            }
          }

          let assigneeId = null;
          if (cAssigneeName) {
            const { data: members } = await supabase
              .from('users')
              .select('id, name')
              .eq('organization_id', targetOrgId);
            
            if (members) {
              const match = findBestMatch(cAssigneeName, members, (m) => m.name || "");
              if (match) assigneeId = match.id;
              else speak(`I couldn't find a team member named ${cAssigneeName}. I'll leave the task unassigned for now.`);
            }
          }

          const { data: newTasks, error: insertError } = await supabase
            .from('tasks')
            .insert({
              project_id: targetProjectId,
              name: tName,
              status: 'not_started',
              estimated_hours: 4,
              assignee_id: assigneeId
            })
            .select();

          if (insertError) throw insertError;
          const msg = `Done! Added task "${tName}" to ${targetProjectName || 'project'}${cAssigneeName && assigneeId ? ` and assigned it to ${cAssigneeName}` : ""}.`;
          speak(msg);
          toast.success(msg);
          
          if (newTasks && newTasks[0]) {
            setLastInteractedEntity({ id: newTasks[0].id, type: 'task', name: tName });
          }
          
          window.dispatchEvent(new CustomEvent('velo-refresh-data'));
        } catch (err: any) {
          console.error('[VoiceActions] Smart task creation failed:', err);
          speak("I encountered an error while setting up that task.");
        }
        break;

      case 'update_task':
        const { taskName: uTaskName, status: uStatus, newTitle: uNewTitle, assigneeName: uAssigneeName } = action.params || {};
        try {
          const projectMatch = currentPath.match(/\/projects\/([a-f0-9-]{36})/i);
          let pId = projectMatch ? projectMatch[1] : null;
          
          if (!pId && lastInteractedEntity?.type === 'task' && isValidUUID(lastInteractedEntity.id)) {
             const { data: t } = await supabase.from('tasks').select('project_id').eq('id', lastInteractedEntity.id).single();
             if (t) pId = t.project_id;
          }

          if (!pId) {
            speak("I'm not sure which project's task you're referring to. Please open a project first.");
            break;
          }

          const { data: tasks } = await supabase.from('tasks').select('id, name, assignee_id').eq('project_id', pId);
          let targetTask = null;

          if (uTaskName) {
            targetTask = findBestMatch(uTaskName, tasks || [], (t) => t.name);
          } else if (lastInteractedEntity?.type === 'task') {
            targetTask = tasks?.find(t => t.id === lastInteractedEntity.id);
          }

          if (!targetTask) {
            speak(`I couldn't find the task "${uTaskName || 'you mentioned'}" in this project.`);
            break;
          }

          const updates: any = {};
          if (uStatus) updates.status = uStatus === 'completed' ? 'completed' : 'not_started';
          if (uNewTitle) updates.name = uNewTitle;
          
          if (uAssigneeName) {
            const { data: members, error: mErr } = await supabase.from('users').select('id, name').eq('organization_id', currentOrgId);
            if (mErr) throw mErr;
            const match = findBestMatch(uAssigneeName, members || [], (m) => m.name || "");
            if (match) updates.assignee_id = match.id;
          }

          const { error: taskUpErr } = await supabase.from('tasks').update(updates).eq('id', targetTask.id);
          if (taskUpErr) throw taskUpErr;

          const successMsg = `Updated task "${uNewTitle || targetTask.name}" successfully.`;
          speak(successMsg);
          toast.success(successMsg);
          setLastInteractedEntity({ id: targetTask.id, type: 'task', name: uNewTitle || targetTask.name });
          window.dispatchEvent(new CustomEvent('velo-refresh-data'));
        } catch (err) {
          console.error('[VoiceActions] Task update failed:', err);
          speak("I couldn't update that task. Please check the dashboard.");
        }
        break;

      case 'assign_task':
        const { taskName: aTaskName, assigneeName: aAssigneeName } = action.params || {};
        if (!aTaskName || !aAssigneeName) {
          speak("Who would you like to assign this task to?");
          break;
        }

        try {
          const projectMatch = currentPath.match(/\/projects\/([a-f0-9-]{36})/i);
          let targetId = projectMatch ? projectMatch[1] : null;
          let targetOrgId = currentOrgId;

          // 1. Resolve Project and Org ID (Prioritize current project)
          if (targetId) {
             const { data: proj } = await supabase.from('projects').select('organization_id').eq('id', targetId).single();
             if (proj) targetOrgId = proj.organization_id;
           } else {
            // Fallback: Use user's primary org and find most recent project
            if (currentOrgId) {
              const { data: recentProj } = await supabase
                .from('projects')
                .select('id, name, organization_id')
                .eq('organization_id', currentOrgId)
                .eq('status', 'active')
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();
              if (recentProj) {
                targetId = recentProj.id;
                targetOrgId = recentProj.organization_id;
              }
            }
          }

          // Strict validation to prevent 400 Bad Request on empty Org ID in query
          if (!targetId || !targetOrgId) {
            speak("I'm not sure which project you're working in. Please open a project page first.");
            break;
          }

          console.log(`[VoiceActions] Assigning task in Org: ${targetOrgId}, Project: ${targetId}`);

          // 2. Fetch Data with correct Org context
          const [{ data: tasks }, { data: members }] = await Promise.all([
            supabase.from('tasks').select('id, name, assignee_id').eq('project_id', targetId),
            supabase.from('users').select('id, name, email').eq('organization_id', targetOrgId)
          ]);

          if (!tasks || tasks.length === 0) {
            speak("I couldn't find any tasks to update in this project.");
            break;
          }

          const matchedTask = findBestMatch(aTaskName, tasks, (t) => t.name);
          if (!matchedTask) {
            speak(`I couldn't find a task named "${aTaskName}".`);
            break;
          }

          const matchedMember = findBestMatch(aAssigneeName, members || [], (m) => m.name || "");
          if (!matchedMember) {
            speak(`I couldn't find a team member named "${aAssigneeName}".`);
            break;
          }

          if (matchedTask.assignee_id === matchedMember.id) {
            speak(`${matchedMember.name} is already assigned to "${matchedTask.name}".`);
            break;
          }

          const { error: updateError } = await supabase
            .from('tasks')
            .update({ assignee_id: matchedMember.id })
            .eq('id', matchedTask.id);

          if (updateError) throw updateError;
          const successMsg = `Done! Assigned "${matchedTask.name}" to ${matchedMember.name}.`;
          speak(successMsg);
          toast.success(successMsg);
          setLastInteractedEntity({ id: matchedTask.id, type: 'task', name: matchedTask.name });
          window.dispatchEvent(new CustomEvent('velo-refresh-data'));
        } catch (err: any) {
          console.error('[VoiceActions] Task assignment failed:', err);
          speak("I ran into an issue updating that task. Please try again or check the dashboard.");
        }
        break;

      case 'delete_task':
        const { taskName: dTaskName } = action.params || {};
        if (!dTaskName) {
          speak("Which task should I delete?");
          break;
        }

        try {
          const projectMatch = currentPath.match(/\/projects\/([a-f0-9-]{36})/i);
          let targetId = projectMatch ? projectMatch[1] : null;

          if (!targetId && currentOrgId) {
             const { data: recentProj } = await supabase
              .from('projects')
              .select('id, name')
              .eq('organization_id', currentOrgId)
              .eq('status', 'active')
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (recentProj) targetId = recentProj.id;
          }

          if (!targetId) {
            speak("Please open a project page first so I know which task list to check.");
            break;
          }

          const { data: tasks } = await supabase.from('tasks').select('id, name').eq('project_id', targetId);
          if (!tasks || tasks.length === 0) {
            speak("This project doesn't have any tasks yet.");
            break;
          }

          const matchedTask = findBestMatch(dTaskName, tasks, (t) => t.name);
          if (!matchedTask) {
            speak(`I couldn't find a task named "${dTaskName}".`);
            break;
          }

          const { error: deleteError } = await supabase.from('tasks').delete().eq('id', matchedTask.id);
          if (deleteError) throw deleteError;

          const successMsg = `Successfully deleted task "${matchedTask.name}".`;
          speak(successMsg);
          toast.success(successMsg);
          setLastInteractedEntity(null);
          window.dispatchEvent(new CustomEvent('velo-refresh-data'));

        } catch (err: any) {
          console.error('[VoiceActions] Task deletion failed:', err);
          speak("I couldn't delete that task. There might be an issue with the connection.");
        }
        break;

      case 'add_team_member':
        const { name: mName, email: mEmail, role: mRole } = action.params || {};
        if (!mName || !mEmail) {
          speak(`I need both a name and an email address to add a team member. ${!mName ? "What is the name?" : "What is the email?"}`);
          break;
        }
        try {
          // Resolve team context (grab first team in org)
          const { data: teams } = await supabase.from('teams').select('id').eq('organization_id', currentOrgId).limit(1);
          if (!teams || teams.length === 0) {
            speak("I couldn't find a team to add members to. Please create a team first.");
            break;
          }
          
          await peopleService.addTeamMember(currentOrgId, teams[0].id, {
            name: mName,
            email: mEmail,
            role: mRole || 'Team Member'
          });
          
          const addMsg = `Successfully added ${mName} to the team.`;
          speak(addMsg);
          toast.success(addMsg);
          window.dispatchEvent(new CustomEvent('velo-refresh-data'));
        } catch (err) {
          console.error('[VoiceActions] Direct employee add failed:', err);
          speak("I couldn't add the team member right now. Please check your permissions.");
        }
        break;

      case 'delete_team_member':
        const { name: rName } = action.params || {};
        if (!rName) {
           speak("Whose account should I remove from the team?");
           break;
        }
        try {
          const members = await peopleService.fetchAllTeamMembers(currentOrgId);
          const match = findBestMatch(rName, members, (m) => m.name);
          
          if (!match) {
            speak(`I couldn't find a team member named ${rName}.`);
            break;
          }

          // Execution loop handles confirmation via setPendingConfirmation in handleVoiceCommand
          // The manual logic uses RPC for soft delete
          const { error: delErr } = await supabase.rpc('soft_delete_user', { target_user_id: match.id });
          if (delErr) throw delErr;

          const delMsg = `Removed ${match.name} from the team successfully.`;
          speak(delMsg);
          toast.success(delMsg);
          window.dispatchEvent(new CustomEvent('velo-refresh-data'));
        } catch (err) {
          console.error('[VoiceActions] Direct employee delete failed:', err);
          speak("I ran into an issue removing that team member.");
        }
        break;

      case 'search':
        toast.info(`Searching for "${action.params?.query || 'anything'}"`);
        break;

      case 'gantt_query':
      case 'resource_query':
        try {
          speak("Sure, let me check that for you.");
          const dashData = await getDashboardData();
          const summary = await geminiVoiceService.summarizeData(dashData, action.params?.query || action.type.replace('_', ' '));
          speak(summary);
          toast.info(summary);
        } catch (err) {
          console.error('[VoiceActions] Data summary failed:', err);
          speak("I'm having trouble accessing the project data right now. Please try again in a moment.");
        } finally {
          setProcessing(false);
        }
        break;

      case 'request_leave':
        const { startDate, endDate, reason, leaveType } = action.params || {};
        try {
          let typeId = leaveTypes[0]?.id;
          if (leaveType) {
            const matched = leaveTypes.find(t => t.name.toLowerCase().includes(leaveType.toLowerCase()));
            if (matched) typeId = matched.id;
          }

          const parseDate = (d: string) => {
            const input = d.toLowerCase().trim();
            if (!input || input === 'today') return new Date().toISOString().split('T')[0];
            if (input === 'tomorrow') {
              const date = new Date();
              date.setDate(date.getDate() + 1);
              return date.toISOString().split('T')[0];
            }
            if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
            const digitsOnly = input.replace(/\D/g, '');
            if (digitsOnly.length === 8) {
              if (digitsOnly.startsWith('20')) return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 6)}-${digitsOnly.slice(6, 8)}`;
              return `${digitsOnly.slice(4, 8)}-${digitsOnly.slice(2, 4)}-${digitsOnly.slice(0, 2)}`;
            }
            try {
              const parsed = new Date(input);
              if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
            } catch {}
            return new Date().toISOString().split('T')[0];
          };

          const sDate = parseDate(startDate || 'today');
          const eDate = parseDate(endDate || startDate || 'today');
          await addLeaveRequest({ startDate: sDate, endDate: eDate, reason: reason || 'Voice Request', leave_type_id: typeId });
          const msg = `Leave request submitted for ${sDate}${eDate !== sDate ? ` to ${eDate}` : ''}.`;
          speak(msg);
          toast.success(msg);
          if (currentPath !== '/leave') navigate('/leave');
        } catch (err: any) {
          console.error('[VoiceActions] Leave request failed:', err);
          speak("I couldn't submit your leave request. Please check your allocation.");
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
          const statusMsg = `Your request for ${myLeaves[0].startDate} is currently ${myLeaves[0].status}.`;
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
        const pendingRequest = leaves.find(l => l.status === 'pending' && (l.name.toLowerCase().includes(targetName.toLowerCase()) || targetName.toLowerCase().includes(l.name.toLowerCase())));
        if (!pendingRequest) {
          speak(`I couldn't find any pending leave requests for ${targetName}.`);
          break;
        }
        try {
          const newStatus = action.type === 'approve_leave' ? 'approved' : 'rejected';
          await updateLeaveStatus(pendingRequest.id, newStatus);
          const msg = `Successfully ${newStatus} the leave request for ${pendingRequest.name}.`;
          speak(msg);
          toast.success(msg);
        } catch (err) {
          console.error('[VoiceActions] Update leave failed:', err);
          speak("I'm sorry, I couldn't update the leave status at this time.");
        }
        break;

      case 'info':
        break;

      default:
        if (action.type !== 'unknown') console.warn('[useVoiceActions] Unknown action type:', action.type);
        break;
    }
  };

  return { handleVoiceCommand };
};
