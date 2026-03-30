import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, Clock, AlignLeft, User, Sparkles } from 'lucide-react';

interface AITaskSuggestion {
  id: string;
  task_name: string;
  description: string;
  estimated_hours: number;
  reasoning_justification: string;
  suggested_user_id: string;
  project_id: string;
  source_meeting_id: string;
  created_at: string;
}

interface AITaskSuggestionsBoardProps {
  projectId?: string | null;
}

export const AITaskSuggestionsBoard = ({ projectId }: AITaskSuggestionsBoardProps) => {
  const [tasks, setTasks] = useState<AITaskSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('ai_task_suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      } else {
        // Notion UI typically shows recent things in a master view if no specific filter
        query = query.limit(20);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching AI tasks:', error);
        return;
      }

      if (data) {
        setTasks(data as AITaskSuggestion[]);
      }
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  if (loading) {
    return (
      <div className="mt-8 border-t border-neutral-100 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-neutral-800">AI Task Suggestions</h3>
        </div>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-24 bg-neutral-100/50 animate-pulse rounded-md border border-neutral-200"></div>
          ))}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return null; // Empty state, hide section in Notion style to keep it clean
  }

  return (
    <div className="mt-8 border-t border-neutral-100 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <h3 className="text-sm font-semibold text-neutral-800">AI Task Suggestions</h3>
        </div>
        <button 
          onClick={fetchTasks}
          className="text-xs text-neutral-500 hover:text-neutral-800 px-2 py-1 rounded hover:bg-neutral-100 transition-colors"
        >
          Refresh
        </button>
      </div>
      
      <div className="flex flex-col gap-3">
        {tasks.map((task) => (
          <div 
            key={task.id} 
            className="group flex flex-col gap-2.5 p-3.5 bg-white border border-neutral-200 rounded-lg hover:shadow-sm hover:border-neutral-300 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 font-medium text-sm text-neutral-800">
                <CheckCircle2 className="w-4 h-4 text-neutral-400 group-hover:text-indigo-500 transition-colors" />
                <span className="leading-tight">{task.task_name}</span>
              </div>
              {task.estimated_hours && (
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded">
                  <Clock className="w-3 h-3" />
                  {task.estimated_hours}h
                </div>
              )}
            </div>
            
            {task.description && (
              <div className="flex items-start gap-2 text-[13px] text-neutral-600 leading-relaxed ml-6.5 pl-6 border-l-2 border-transparent group-hover:border-neutral-100 transition-colors">
                <p className="line-clamp-2 md:line-clamp-none">{task.description}</p>
              </div>
            )}
            
            {(task.reasoning_justification || task.suggested_user_id) && (
              <div className="flex items-start gap-2.5 text-[12px] text-neutral-600 mt-2 ml-6 bg-neutral-50/80 p-2.5 rounded border border-neutral-100">
                <User className="w-3.5 h-3.5 mt-0.5 text-neutral-400 shrink-0" />
                <div className="flex flex-col gap-1">
                  {task.suggested_user_id && (
                     <span className="font-medium text-neutral-700">
                       Assign to: {task.suggested_user_id.substring(0,8)}...
                     </span>
                  )}
                  {task.reasoning_justification && (
                    <span className="text-neutral-500 italic">{task.reasoning_justification}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
