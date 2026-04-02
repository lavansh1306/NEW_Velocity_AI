import { useNavigate } from 'react-router-dom';
import { useVoice } from '@/contexts/VoiceContext';
import { geminiVoiceService, VoiceAction } from '@/services/geminiVoiceService';
import { getDashboardData } from '@/services/dashboardService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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
  const { orgId } = useAuth();

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
