import { useEffect, useCallback } from 'react';

interface UseTaskKeyboardProps {
  tasks: any[];
  selectedIndex: number | null;
  setSelectedIndex: (idx: number | null) => void;
  onEdit: (task: any) => void;
  onCreate: () => void;
  isInputFocused: () => boolean;
}

/**
 * Keyboard navigation for task lists — Jira-style
 * J = next task
 * K = previous task
 * E = edit selected task
 * C = create new task
 * Escape = deselect
 */
export const useTaskKeyboard = ({
  tasks,
  selectedIndex,
  setSelectedIndex,
  onEdit,
  onCreate,
  isInputFocused,
}: UseTaskKeyboardProps) => {

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't fire when user is typing in an input/textarea
    if (isInputFocused()) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    switch (e.key) {
      case 'j':
      case 'J': {
        e.preventDefault();
        setSelectedIndex(
          selectedIndex === null ? 0 : Math.min(selectedIndex + 1, tasks.length - 1)
        );
        break;
      }
      case 'k':
      case 'K': {
        e.preventDefault();
        setSelectedIndex(
          selectedIndex === null ? tasks.length - 1 : Math.max(selectedIndex - 1, 0)
        );
        break;
      }
      case 'e':
      case 'E': {
        if (selectedIndex !== null && tasks[selectedIndex]) {
          e.preventDefault();
          onEdit(tasks[selectedIndex]);
        }
        break;
      }
      case 'c':
      case 'C': {
        e.preventDefault();
        onCreate();
        break;
      }
      case 'Escape': {
        setSelectedIndex(null);
        break;
      }
    }
  }, [tasks, selectedIndex, setSelectedIndex, onEdit, onCreate, isInputFocused]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};
