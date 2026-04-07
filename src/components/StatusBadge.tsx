import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { emoji: '🟢', label: 'Available' },
  { emoji: '🌴', label: 'On vacation' },
  { emoji: '🤒', label: 'Out sick' },
  { emoji: '🎯', label: 'In sprint' },
  { emoji: '🔕', label: 'Do not disturb' },
  { emoji: '🏠', label: 'Working remotely' },
];

interface StatusBadgeProps {
  userId: string;
  currentStatus?: string;
  currentEmoji?: string;
  canEdit?: boolean;
  onUpdate?: (status: string, emoji: string) => void;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  userId, currentStatus, currentEmoji, canEdit = false, onUpdate
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleSelect = async (option: typeof STATUS_OPTIONS[0]) => {
    try {
      await supabase.from('users').update({ status: option.label, status_emoji: option.emoji }).eq('id', userId);
      onUpdate?.(option.label, option.emoji);
      toast.success('Status updated');
    } catch { toast.error('Failed to update status'); }
    setShowPicker(false);
  };

  const handleClear = async () => {
    try {
      await supabase.from('users').update({ status: null, status_emoji: null }).eq('id', userId);
      onUpdate?.('', '');
      toast.success('Status cleared');
    } catch { toast.error('Failed to clear status'); }
    setShowPicker(false);
  };

  if (!currentStatus && !canEdit) return null;

  return (
    <div className="relative inline-block">
      {currentStatus ? (
        <button
          onClick={() => canEdit && setShowPicker(!showPicker)}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-gray-200 bg-gray-50 hover:opacity-80 transition-opacity"
          style={{ cursor: canEdit ? 'pointer' : 'default' }}
        >
          <span>{currentEmoji}</span>
          <span className="text-gray-600">{currentStatus}</span>
        </button>
      ) : canEdit ? (
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          + Set status
        </button>
      ) : null}

      {showPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-2 w-48">
            {STATUS_OPTIONS.map(o => (
              <button
                key={o.label}
                onClick={() => handleSelect(o)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-left text-sm transition-colors"
              >
                <span>{o.emoji}</span>
                <span className="text-gray-700">{o.label}</span>
              </button>
            ))}
            {currentStatus && (
              <button
                onClick={handleClear}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-sm text-red-500 border-t border-gray-100 mt-1 pt-2 transition-colors"
              >
                <span>✕</span>
                <span>Clear status</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
