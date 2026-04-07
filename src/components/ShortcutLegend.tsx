import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface ShortcutLegendProps {
  onClose: () => void;
}

const KEYBOARD_SHORTCUTS = [
  { key: 'Ctrl + Space', description: 'Open voice commander' },
  { key: 'Esc', description: 'Close overlay / Cancel action' },
  { key: '?', description: 'Open this shortcut guide' },
];

const VOICE_COMMANDS = [
  { category: 'Navigation', commands: [
    'Go to projects',
    'Open dashboard',
    'Show people',
    'Go to settings',
  ]},
  { category: 'Projects', commands: [
    'Plan a React dashboard project',
    'Create a new project',
    'Give me a health report for [project]',
  ]},
  { category: 'Team', commands: [
    'Add Sarah as frontend developer',
    'Remove John from the team',
    'Who has bandwidth this week?',
  ]},
  { category: 'Tasks', commands: [
    'I finished the auth module, took 6 hours',
    'Mark the login task as completed',
  ]},
  { category: 'Leave', commands: [
    'Approve Sarah\'s leave',
  ]},
];

export const ShortcutLegend: React.FC<ShortcutLegendProps> = ({ onClose }) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === '?') {
      e.preventDefault();
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      style={{ backdropFilter: 'blur(12px)', background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ width: 560, maxHeight: '80vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Keyboard Shortcuts & Voice Commands</h2>
            <p className="text-xs text-gray-400 mt-0.5">Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">?</kbd> anytime to open this</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Keyboard shortcuts */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Keyboard</h3>
            <div className="space-y-2">
              {KEYBOARD_SHORTCUTS.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-gray-600">{s.description}</span>
                  <kbd className="px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs font-mono text-gray-700">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Voice commands */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Voice Commands</h3>
            <div className="space-y-4">
              {VOICE_COMMANDS.map((cat, i) => (
                <div key={i}>
                  <p className="text-xs font-medium text-violet-600 mb-1.5">{cat.category}</p>
                  <div className="space-y-1">
                    {cat.commands.map((cmd, j) => (
                      <div key={j} className="flex items-center gap-2 py-1 px-3 rounded-lg bg-violet-50">
                        <span className="text-violet-400 text-xs">🎤</span>
                        <span className="text-sm text-gray-700 italic">"{cmd}"</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">Press <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">Esc</kbd> to close</p>
        </div>
      </div>
    </div>
  );
};
