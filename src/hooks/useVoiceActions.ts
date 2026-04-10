import { useNavigate } from 'react-router-dom';
import { useVoice } from '@/contexts/VoiceContext';
import { geminiVoiceService, VoiceAction } from '@/services/geminiVoiceService';
import { findBestMatch } from '@/lib/utils';
import { approveAndPushToLinear, rejectAndLogML } from '@/lib/linearDataService';
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
      const action = await geminiVoiceService.parseIntent(transcript, currentPath);
      
      if (action.response?.includes("Standard Mode") || action.response?.includes("Standard command")) {
        toast.info("Gemini is currently limited. Using Standard Mode.");
      }
      
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
      'update_task',
      'assign_task',
      'delete_task',
      'push_to_linear',
      'accept_suggestion',
      'dismiss_suggestion',
      'verify_skill'
    ];

    const isManager = orgRole === 'admin' || orgRole === 'manager';

    if (restrictedActions.includes(action.type) && !isManager) {
      const msg = "I'm sorry, that action is restricted to managers and administrators.";
      speak(msg);
      toast.error(msg);
      return;
    }

    // UUID Validation Helper
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
        break;

      case 'update_project':
        const { projectTitle: upTitle, newTitle, newDescription, status: pStatus } = action.params || {};
        try {
          if (!orgId) {
            speak("I need your organization context to update projects.");
            break;
          }
          const { data: projs } = await supabase.from('projects').select('id, name').eq('organization_id', orgId);
          const match = findBestMatch(upTitle || '', projs || [], (p) => p.name);
          if (match) {
            const updates: any = {};
            if (newTitle) updates.name = newTitle;
            if (newDescription) updates.description = newDescription;
            if (pStatus) updates.status = pStatus === 'completed' ? 'completed' : 'active';
            await supabase.from('projects').update(updates).eq('id', match.id);
            speak(`Successfully updated project "${match.name}".`);
            window.dispatchEvent(new CustomEvent('velo-refresh-data'));
          } else {
            speak("I couldn't find that project to update.");
          }
        } catch (err) {
          console.error('[VoiceActions] Update project failed:', err);
        }
        break;

      case 'delete_project':
        const { projectTitle: dpTitle } = action.params || {};
        try {
          if (!orgId) break;
          const { data: projs } = await supabase.from('projects').select('id, name').eq('organization_id', orgId);
          const match = findBestMatch(dpTitle || '', projs || [], (p) => p.name);
          if (match) {
            await supabase.from('projects').delete().eq('id', match.id);
            speak(`Deleted project "${match.name}" successfully.`);
            window.dispatchEvent(new CustomEvent('velo-refresh-data'));
          }
        } catch (err) {
          console.error('[VoiceActions] Delete project failed:', err);
        }
        break;
      
      case 'create_task':
        const { taskName: tName, projectName: pName, assigneeName: cAssigneeName } = action.params || {};
        const nameToUse = tName || 'New Task';
        
        try {
          const projectMatch = currentPath.match(/\/projects\/([a-f0-9-]{36})/i);
          let targetProjectId = projectMatch ? projectMatch[1] : null;
          let targetOrgId = orgId;

          if (targetProjectId) {
             const { data: proj } = await supabase.from('projects').select('organization_id').eq('id', targetProjectId).single();
             if (proj) targetOrgId = proj.organization_id;
          }

          if (!targetOrgId) {
            speak("I need more context about your organization to create a task.");
            break;
          }

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
              speak(`Project ${pName} doesn't exist. I'll create it for you.`);
              const { data: newProj, error: createError } = await supabase
                .from('projects')
                .insert({ organization_id: targetOrgId, name: pName, status: 'active', source: 'internal' })
                .select().single();
              if (createError) throw createError;
              targetProjectId = newProj.id;
              targetProjectName = newProj.name;
            }
          } else if (!targetProjectId) {
            if (projects && projects.length > 0) {
              const sorted = [...projects].sort((a,b) => b.id.localeCompare(a.id));
              targetProjectId = sorted[0].id;
              targetProjectName = sorted[0].name;
            } else {
              speak("Creating a default project for your new task.");
              const { data: newProj, error: createError } = await supabase
                .from('projects')
                .insert({ organization_id: targetOrgId, name: 'General Tasks', status: 'active' })
                .select().single();
              if (createError) throw createError;
              targetProjectId = newProj.id;
              targetProjectName = newProj.name;
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
          const msg = `Done! Added task "${nameToUse}" to ${targetProjectName || 'project'}${cAssigneeName && assigneeId ? ` and assigned it to ${cAssigneeName}` : ""}.`;
          speak(msg);
          toast.success(msg);
          window.dispatchEvent(new CustomEvent('velo-refresh-data'));
        } catch (err: any) {
          console.error('[VoiceActions] Smart task creation failed:', err);
          speak("I encountered an error while setting up that task.");
        }
        break;

      case 'update_task':
        const { taskName: uTaskName, status: uStatus, newTitle: uNewTitle, estimatedHours } = action.params || {};
        try {
          const projectMatch = currentPath.match(/\/projects\/([a-f0-9-]{36})/i);
          if (!projectMatch) {
            speak("Please open a project to update tasks.");
            break;
          }
          const { data: tasks } = await supabase.from('tasks').select('id, name').eq('project_id', projectMatch[1]);
          const match = findBestMatch(uTaskName || '', tasks || [], (t) => t.name);
          if (match) {
            const updates: any = {};
            if (uStatus) updates.status = uStatus === 'completed' ? 'completed' : 'not_started';
            if (uNewTitle) updates.name = uNewTitle;
            if (estimatedHours) updates.estimated_hours = estimatedHours;
            await supabase.from('tasks').update(updates).eq('id', match.id);
            speak(`Updated task "${match.name}".`);
            window.dispatchEvent(new CustomEvent('velo-refresh-data'));
          }
        } catch (err) {
          console.error('[VoiceActions] Update task failed:', err);
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
          let targetOrgId = orgId;

          if (targetId) {
             const { data: proj } = await supabase.from('projects').select('organization_id').eq('id', targetId).single();
             if (proj) targetOrgId = proj.organization_id;
          } else {
            if (orgId) {
              const { data: recentProj } = await supabase
                .from('projects')
                .select('id, name, organization_id')
                .eq('organization_id', orgId)
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

          if (!targetId || !targetOrgId) {
            speak("I'm not sure which project you're working in. Please open a project page first.");
            break;
          }

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
            speak(`${aTaskName} doesn't exist.`);
            break;
          }

          const matchedMember = findBestMatch(aAssigneeName, members || [], (m) => m.name || "");
          if (!matchedMember) {
            speak(`I couldn't find a team member named "${aAssigneeName}".`);
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
          window.dispatchEvent(new CustomEvent('velo-refresh-data'));
        } catch (err: any) {
          console.error('[VoiceActions] Task assignment failed:', err);
          speak("I ran into an issue updating that task.");
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

          if (!targetId && orgId) {
             const { data: recentProj } = await supabase
              .from('projects')
              .select('id, name')
              .eq('organization_id', orgId)
              .eq('status', 'active')
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (recentProj) targetId = recentProj.id;
          }

          if (!targetId) {
            speak("Please open a project page first.");
            break;
          }

          const { data: tasks } = await supabase.from('tasks').select('id, name').eq('project_id', targetId);
          const matchedTask = findBestMatch(dTaskName, tasks || [], (t) => t.name);
          if (!matchedTask) {
            speak(`I couldn't find a task named "${dTaskName}".`);
            break;
          }

          const { error: deleteError } = await supabase.from('tasks').delete().eq('id', matchedTask.id);
          if (deleteError) throw deleteError;

          const successMsg = `Successfully deleted task "${matchedTask.name}".`;
          speak(successMsg);
          toast.success(successMsg);
          window.dispatchEvent(new CustomEvent('velo-refresh-data'));
        } catch (err: any) {
          console.error('[VoiceActions] Task deletion failed:', err);
        }
        break;

      case 'add_team_member':
        const { name, email, role, utilizationPercent } = action.params || {};
        if (currentPath !== '/people') {
          enqueueAction(action);
          navigate('/people');
        } else {
          // Calculate capacity if utilization provided (default 40h/week)
          let capacity = undefined;
          if (utilizationPercent) capacity = (utilizationPercent / 100) * 40;
          window.dispatchEvent(new CustomEvent('velo-add-member', { detail: { name, email, role, capacity } }));
        }
        break;

      case 'logout':
        await supabase.auth.signOut();
        navigate('/login');
        speak("You have been signed out.");
        break;

      case 'update_preferences':
        const { theme } = action.params || {};
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
          speak("Dark mode enabled.");
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark');
          speak("Light mode enabled.");
        }
        break;

      case 'push_to_linear':
        const { taskName: lTaskName } = action.params || {};
        try {
          const { data: suggs } = await supabase
            .from('ai_task_suggestions')
            .select('*')
            .eq('status', 'pending');
          
          const lMatch = findBestMatch(lTaskName || '', suggs || [], (s) => s.task_name);
          if (lMatch) {
            const res = await approveAndPushToLinear({
              taskId: lMatch.id,
              taskName: lMatch.task_name,
              suggestedUserId: lMatch.suggested_user_id,
              skillMatchScore: 80,
              workloadAtTime: 50
            });
            if (res.success) {
              await supabase.from('ai_task_suggestions').update({ status: 'approved' }).eq('id', lMatch.id);
              speak(`Successfully pushed "${lMatch.task_name}" to Linear.`);
              window.dispatchEvent(new CustomEvent('velo-refresh-data'));
            } else {
              speak("I couldn't push that task to Linear. Please check your connection.");
            }
          } else {
            speak("I couldn't find a matching pending task for Linear.");
          }
        } catch (err) {
          console.error('[VoiceActions] Linear push failed:', err);
        }
        break;

      case 'accept_suggestion':
      case 'dismiss_suggestion':
        const { taskName: sTaskName } = action.params || {};
        try {
          const { data: recs } = await supabase.from('ai_task_suggestions').select('*').eq('status', 'pending');
          const sMatch = findBestMatch(sTaskName || '', recs || [], (r) => r.task_name);
          
          if (sMatch) {
            if (action.type === 'accept_suggestion') {
              await supabase.from('tasks').update({ assignee_id: sMatch.suggested_user_id }).eq('id', sMatch.id);
              await supabase.from('ai_task_suggestions').update({ status: 'approved' }).eq('id', sMatch.id);
              speak(`Accepted suggestion for "${sMatch.task_name}".`);
            } else {
              await supabase.from('ai_task_suggestions').update({ status: 'rejected' }).eq('id', sMatch.id);
              await rejectAndLogML({ taskId: sMatch.id, suggestedUserId: sMatch.suggested_user_id, skillMatchScore: 50, workloadAtTime: 50 });
              speak(`Dismissed suggestion for "${sMatch.task_name}".`);
            }
            window.dispatchEvent(new CustomEvent('velo-refresh-data'));
          } else {
            speak("I couldn't find that suggestion.");
          }
        } catch (err) {
          console.error('[VoiceActions] Suggestion action failed:', err);
        }
        break;

      case 'verify_skill':
        const { name: vName, skill: vSkill } = action.params || {};
        try {
          const { data: vMembers } = await supabase.from('users').select('id, name');
          const vMatch = findBestMatch(vName || '', vMembers || [], (m) => m.name);
          if (vMatch && vSkill) {
             // In Velocity, skills are often derived or in user_skills table
             const { error: vErr } = await supabase
               .from('user_skills')
               .update({ source: 'manual', confidence_score: 1.0 })
               .eq('user_id', vMatch.id)
               .ilike('skill_name', vSkill);
             
             if (vErr) throw vErr;
             speak(`Verified ${vSkill} for ${vMatch.name}.`);
          }
        } catch (err) {
          console.error('[VoiceActions] Skill verification failed:', err);
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

      case 'project_query':
        const { projectQueryType } = action.params || {};
        try {
          if (!orgId) {
            speak("I need your organization context to look up projects.");
            break;
          }
          const { data: qProjs } = await supabase
            .from('projects')
            .select('name, created_at')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false });

          if (!qProjs || qProjs.length === 0) {
            speak("You don't have any projects yet.");
            break;
          }

          if (projectQueryType === 'count') {
            const count = qProjs.length;
            speak(`${count}`);
          } else if (projectQueryType === 'list') {
            const names = qProjs.map(p => p.name).join(', ');
            speak(`${names}`);
          } else if (projectQueryType === 'latest') {
            speak(`${qProjs[0].name}`);
          }
        } catch (err) {
          console.error('[VoiceActions] Project query failed:', err);
        }
        break;

      case 'search':
        toast.info(`Searching for "${action.params?.query || 'anything'}"`);
        break;

      case 'gantt_query':
      case 'resource_query':
        const dashData = await getDashboardData();
        const summary = await geminiVoiceService.summarizeData(dashData, action.params?.query || action.type.replace('_', ' '));
        speak(summary);
        toast.info(summary);
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
              const date = new Date(); date.setDate(date.getDate() + 1);
              return date.toISOString().split('T')[0];
            }
            if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
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
        }
        break;

      case 'get_leave_status':
        if (!leaves || leaves.length === 0) break;
        const myLeaves = leaves.filter(l => l.user_id === authUser?.id);
        if (myLeaves.length > 0) {
          const statusMsg = `Your request for ${myLeaves[0].startDate} is currently ${myLeaves[0].status}.`;
          speak(statusMsg);
          toast.info(statusMsg);
        }
        break;

      case 'approve_leave':
      case 'deny_leave':
        const targetName = action.params?.name;
        if (!targetName) break;
        const pendingRequest = leaves.find(l => l.status === 'pending' && (l.name.toLowerCase().includes(targetName.toLowerCase()) || targetName.toLowerCase().includes(l.name.toLowerCase())));
        if (pendingRequest) {
          try {
            const newStatus = action.type === 'approve_leave' ? 'approved' : 'rejected';
            await updateLeaveStatus(pendingRequest.id, newStatus);
            speak(`Successfully ${newStatus} the leave request for ${pendingRequest.name}.`);
          } catch (err) {}
        }
        break;

      case 'info':
        break;

      default:
        break;
    }
  };

  return { handleVoiceCommand };
};
