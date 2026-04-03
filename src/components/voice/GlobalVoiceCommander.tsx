import React, { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useVoice } from '@/contexts/VoiceContext';
import { useVoiceActions } from '@/hooks/useVoiceActions';
import { MicOutlined, AutoAwesomeOutlined } from '@mui/icons-material';

/**
 * GlobalVoiceCommander
 * Ctrl+Space from anywhere → full-screen overlay with mic orb
 * Matches Velocity AI dark sidebar theme (#1C1917, teal #2DD4BF)
 */
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
    pendingConfirmation,
  } = useVoice();

  const { handleVoiceCommand } = useVoiceActions();
  const hasProcessed = useRef(false);
  const isOpen = isListening || status === 'processing' || status === 'speaking' || !!pendingConfirmation;

  // Process transcript when it arrives
  useEffect(() => {
    if (lastTranscript && !hasProcessed.current) {
      hasProcessed.current = true;
      handleVoiceCommand(lastTranscript, location.pathname);
      clearTranscript();
      setTimeout(() => { hasProcessed.current = false; }, 300);
    }
  }, [lastTranscript, location.pathname, handleVoiceCommand, clearTranscript]);

  // Global Ctrl+Space hotkey
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault();
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
      return;
    }
    if (e.code === 'Escape' && isOpen) {
      e.preventDefault();
      stopListening();
    }
  }, [isListening, isOpen, startListening, stopListening]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  const vol = Math.min(volumeLevel / 80, 1);

  const statusLabel = {
    listening: 'Listening...',
    processing: 'Thinking...',
    speaking: 'Speaking...',
    connecting: 'Connecting...',
    error: 'Try again',
    idle: pendingConfirmation ? 'Say yes or no' : 'Ready',
  }[status] ?? 'Ready';

  const isActive = status === 'listening';
  const isProcessing = status === 'processing';
  const isSpeaking = status === 'speaking';

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
        backdropFilter: 'blur(12px)',
        background: 'rgba(12, 10, 9, 0.75)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) stopListening(); }}
    >
      {/* Card */}
      <div
        className="flex flex-col items-center gap-6 rounded-2xl px-10 py-10"
        style={{
          background: 'rgba(28, 25, 23, 0.97)',
          border: '1px solid rgba(45, 212, 191, 0.15)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(45,212,191,0.06)',
          minWidth: 380,
          maxWidth: 440,
        }}
      >
        {/* Velocity AI badge */}
        <div className="flex items-center gap-2">
          <AutoAwesomeOutlined style={{ fontSize: 13, color: '#2DD4BF' }} />
          <span style={{ color: '#2DD4BF', fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Velocity AI
          </span>
        </div>

        {/* Orb */}
        <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
          {/* Pulse rings when listening */}
          {isActive && (
            <>
              <div
                className="absolute rounded-full"
                style={{
                  width: 120 + vol * 60,
                  height: 120 + vol * 60,
                  border: `1px solid rgba(45,212,191,${0.1 + vol * 0.2})`,
                  transition: 'all 80ms ease',
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  width: 100 + vol * 40,
                  height: 100 + vol * 40,
                  border: `1px solid rgba(45,212,191,${0.18 + vol * 0.25})`,
                  transition: 'all 80ms ease',
                }}
              />
            </>
          )}

          {/* Core orb */}
          <div
            className="relative flex items-center justify-center rounded-full"
            style={{
              width: 88,
              height: 88,
              background: isProcessing
                ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'
                : isSpeaking
                ? 'linear-gradient(135deg, #134e4a 0%, #0f766e 100%)'
                : isActive
                ? 'linear-gradient(135deg, #0c2e2b 0%, #0d9488 100%)'
                : 'linear-gradient(135deg, #1c1917 0%, #292524 100%)',
              border: isActive
                ? '2px solid #2DD4BF'
                : isSpeaking
                ? '2px solid #0d9488'
                : '2px solid rgba(45,212,191,0.2)',
              boxShadow: isActive
                ? `0 0 ${20 + vol * 30}px rgba(45,212,191,${0.3 + vol * 0.35})`
                : isSpeaking
                ? '0 0 20px rgba(13,148,136,0.4)'
                : '0 4px 20px rgba(0,0,0,0.5)',
              transition: 'all 80ms ease',
              cursor: 'pointer',
            }}
            onClick={() => isListening ? stopListening() : startListening()}
          >
            {isActive ? (
              /* Sound wave bars */
              <div className="flex items-center gap-[3px]">
                {[0.5, 0.9, 0.6, 1, 0.7, 0.85, 0.5].map((h, i) => (
                  <div
                    key={i}
                    className="rounded-full"
                    style={{
                      width: 3,
                      height: `${5 + vol * 20 * h}px`,
                      background: '#2DD4BF',
                      transition: 'height 80ms ease',
                    }}
                  />
                ))}
              </div>
            ) : isProcessing ? (
              /* Bouncing dots */
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="rounded-full"
                    style={{
                      width: 7,
                      height: 7,
                      background: '#818cf8',
                      animation: `velo-bounce 1s ease-in-out ${i * 0.18}s infinite`,
                    }}
                  />
                ))}
              </div>
            ) : (
              /* Mic icon */
              <MicOutlined
                style={{
                  fontSize: 34,
                  color: isSpeaking ? '#2DD4BF' : 'rgba(255,255,255,0.45)',
                }}
              />
            )}
          </div>
        </div>

        {/* Status */}
        <div className="text-center">
          <p style={{ color: '#f5f5f4', fontSize: 17, fontWeight: 300, letterSpacing: '0.01em' }}>
            {statusLabel}
          </p>
          {pendingConfirmation && (
            <p style={{ color: '#2DD4BF', fontSize: 13, fontWeight: 300, marginTop: 4 }}>
              {pendingConfirmation.response}
            </p>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.07)' }} />

        {/* Example commands */}
        {!pendingConfirmation && (
          <div className="w-full flex flex-col gap-1.5">
            <p style={{
              color: 'rgba(255,255,255,0.22)',
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 6,
              textAlign: 'center',
            }}>
              Try saying
            </p>
            {exampleCommands.map((cmd, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2 rounded-lg"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <span style={{ color: '#2DD4BF', fontSize: 12, width: 14, textAlign: 'center', flexShrink: 0 }}>
                  {cmd.icon}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 300 }}>
                  "{cmd.text}"
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Keyboard hints */}
        <div className="flex items-center gap-3" style={{ color: 'rgba(255,255,255,0.18)', fontSize: 11 }}>
          <span>
            <kbd style={{
              padding: '2px 6px', borderRadius: 4,
              background: 'rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.3)',
              fontFamily: 'monospace', fontSize: 10,
            }}>Esc</kbd>
            {' '}close
          </span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>
            <kbd style={{
              padding: '2px 6px', borderRadius: 4,
              background: 'rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.3)',
              fontFamily: 'monospace', fontSize: 10,
            }}>Ctrl+Space</kbd>
            {' '}toggle
          </span>
        </div>
      </div>

      <style>{`
        @keyframes velo-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
