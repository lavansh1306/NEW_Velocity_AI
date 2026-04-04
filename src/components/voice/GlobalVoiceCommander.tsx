import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useVoice } from '@/contexts/VoiceContext';
import { useVoiceActions } from '@/hooks/useVoiceActions';
import { MicOutlined, AutoAwesomeOutlined } from '@mui/icons-material';

export const GlobalVoiceCommander: React.FC = () => {
  const location = useLocation();
  const {
    isListening,
    status,
    lastTranscript,
    volumeLevel,
    startListening,
    stopListening,
    clearTranscript,
  } = useVoice();

  const { handleVoiceCommand } = useVoiceActions();
  const hasProcessed = useRef(false);

  // isOpen is controlled independently of status
  // This prevents the overlay from snapping shut between states
  const [isOpen, setIsOpen] = useState(false);

  // Listen for close event fired by useVoiceActions after navigation/actions
  useEffect(() => {
    const handleClose = () => setIsOpen(false);
    window.addEventListener('velo-close-voice', handleClose);
    return () => window.removeEventListener('velo-close-voice', handleClose);
  }, []);

  const vol = Math.min(volumeLevel / 80, 1);
  const isActive = status === 'listening';
  const isProcessing = status === 'processing';
  const isSpeaking = status === 'speaking';

  // Keep overlay open as long as any voice activity is happening
  useEffect(() => {
    if (isListening || isProcessing || isSpeaking) {
      setIsOpen(true);
    }
  }, [isListening, isProcessing, isSpeaking]);

  // Process transcript
  useEffect(() => {
    if (lastTranscript && !hasProcessed.current) {
      hasProcessed.current = true;
      handleVoiceCommand(lastTranscript, location.pathname);
      clearTranscript();
      setTimeout(() => { hasProcessed.current = false; }, 300);
    }
  }, [lastTranscript, location.pathname, handleVoiceCommand, clearTranscript]);

  const close = useCallback(() => {
    stopListening();
    setIsOpen(false);
  }, [stopListening]);

  const open = useCallback(() => {
    setIsOpen(true);
    startListening();
  }, [startListening]);

  // Global Ctrl+Space hotkey
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault();
      if (isOpen) { close(); } else { open(); }
      return;
    }
    if (e.code === 'Escape' && isOpen) {
      e.preventDefault();
      close();
    }
  }, [isOpen, open, close]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  const statusLabel = {
    listening: 'Listening...',
    processing: 'Thinking...',
    speaking: 'Speaking...',
    connecting: 'Connecting...',
    error: 'Try again',
    idle: 'Ready',
  }[status] ?? 'Listening...';

  const purple = '#8b5cf6';
  const purpleDark = '#6d28d9';

  const exampleCommands = [
    { icon: '→', text: 'Go to projects' },
    { icon: '✦', text: 'Plan a React dashboard project' },
    { icon: '+', text: 'Add Sarah as frontend developer' },
    { icon: '?', text: 'Who has bandwidth this week?' },
    { icon: '×', text: 'Remove John from the team' },
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        backdropFilter: 'blur(18px)',
        background: 'rgba(219, 225, 243, 0.6)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        className="flex flex-col items-center gap-6 rounded-2xl px-10 py-10"
        style={{
          background: 'rgba(255, 255, 255, 0.88)',
          border: '1px solid rgba(139, 92, 246, 0.18)',
          boxShadow: '0 24px 60px rgba(109,40,217,0.12), 0 2px 8px rgba(139,92,246,0.08)',
          minWidth: 380,
          maxWidth: 440,
        }}
      >
        {/* Badge */}
        <div className="flex items-center gap-2">
          <AutoAwesomeOutlined style={{ fontSize: 13, color: purple }} />
          <span style={{ color: purple, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Velocity AI
          </span>
        </div>

        {/* Orb */}
        <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
          {isActive && (
            <>
              <div className="absolute rounded-full" style={{
                width: 120 + vol * 60, height: 120 + vol * 60,
                border: `1px solid rgba(139,92,246,${0.1 + vol * 0.2})`,
                transition: 'all 80ms ease',
              }} />
              <div className="absolute rounded-full" style={{
                width: 100 + vol * 40, height: 100 + vol * 40,
                border: `1px solid rgba(139,92,246,${0.2 + vol * 0.25})`,
                transition: 'all 80ms ease',
              }} />
            </>
          )}

          <div
            className="relative flex items-center justify-center rounded-full"
            style={{
              width: 88, height: 88,
              background: isProcessing
                ? 'linear-gradient(135deg, #4c1d95, #6d28d9)'
                : isSpeaking
                ? 'linear-gradient(135deg, #5b21b6, #7c3aed)'
                : isActive
                ? `linear-gradient(135deg, ${purpleDark}, ${purple})`
                : 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
              border: isActive || isSpeaking || isProcessing
                ? `2px solid ${purple}`
                : '2px solid rgba(139,92,246,0.3)',
              boxShadow: isActive
                ? `0 0 ${20 + vol * 30}px rgba(139,92,246,${0.35 + vol * 0.35})`
                : isProcessing || isSpeaking
                ? '0 0 24px rgba(109,40,217,0.5)'
                : '0 4px 16px rgba(139,92,246,0.2)',
              transition: 'all 80ms ease',
              cursor: 'pointer',
            }}
            onClick={() => isListening ? stopListening() : startListening()}
          >
            {isActive ? (
              <div className="flex items-center gap-[3px]">
                {[0.5, 0.9, 0.6, 1, 0.7, 0.85, 0.5].map((h, i) => (
                  <div key={i} className="rounded-full" style={{
                    width: 3,
                    height: `${5 + vol * 20 * h}px`,
                    background: 'white',
                    transition: 'height 80ms ease',
                  }} />
                ))}
              </div>
            ) : isProcessing ? (
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="rounded-full" style={{
                    width: 7, height: 7,
                    background: 'white',
                    animation: `velo-bounce 1s ease-in-out ${i * 0.18}s infinite`,
                  }} />
                ))}
              </div>
            ) : (
              <MicOutlined style={{ fontSize: 34, color: isSpeaking ? 'white' : purple }} />
            )}
          </div>
        </div>

        {/* Status */}
        <p style={{ color: '#1e1b4b', fontSize: 17, fontWeight: 400 }}>
          {statusLabel}
        </p>

        {/* Divider */}
        <div style={{ width: '100%', height: 1, background: 'rgba(139,92,246,0.1)' }} />

        {/* Example commands */}
        <div className="w-full flex flex-col gap-1.5">
          <p style={{
            color: 'rgba(109,40,217,0.4)', fontSize: 10,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            marginBottom: 6, textAlign: 'center',
          }}>
            Try saying
          </p>
          {exampleCommands.map((cmd, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{
              background: 'rgba(139,92,246,0.05)',
              border: '1px solid rgba(139,92,246,0.1)',
            }}>
              <span style={{ color: purple, fontSize: 12, width: 14, textAlign: 'center', flexShrink: 0 }}>
                {cmd.icon}
              </span>
              <span style={{ color: '#4c1d95', fontSize: 13, fontWeight: 300 }}>
                "{cmd.text}"
              </span>
            </div>
          ))}
        </div>

        {/* Keyboard hints */}
        <div className="flex items-center gap-3" style={{ color: 'rgba(109,40,217,0.35)', fontSize: 11 }}>
          <span>
            <kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(139,92,246,0.08)', color: 'rgba(109,40,217,0.5)', fontFamily: 'monospace', fontSize: 10 }}>Esc</kbd>
            {' '}close
          </span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>
            <kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(139,92,246,0.08)', color: 'rgba(109,40,217,0.5)', fontFamily: 'monospace', fontSize: 10 }}>Ctrl+Space</kbd>
            {' '}toggle
          </span>
        </div>
      </div>

      <style>{`
        @keyframes velo-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
