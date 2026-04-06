import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useVoice } from '@/contexts/VoiceContext';
import { useVoiceActions } from '@/hooks/useVoiceActions';
import { MicOutlined, StopOutlined, AutoAwesomeOutlined } from '@mui/icons-material';

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
  const [isOpen, setIsOpen] = useState(false);
  const [liveText, setLiveText] = useState('');

  // Listen for close event from useVoiceActions after navigation
  useEffect(() => {
    const handleClose = () => { stopListening(); setIsOpen(false); setLiveText(''); };
    window.addEventListener('velo-close-voice', handleClose);
    return () => window.removeEventListener('velo-close-voice', handleClose);
  }, [stopListening]);

  // Listen for close event from useVoiceActions after navigation/actions
  useEffect(() => {
    const handleClose = () => { stopListening(); setIsOpen(false); setLiveText(''); };
    window.addEventListener('velo-close-voice', handleClose);
    return () => window.removeEventListener('velo-close-voice', handleClose);
  }, [stopListening]);

  // Process transcript when speech recognition finalizes
  useEffect(() => {
    if (lastTranscript && !hasProcessed.current) {
      hasProcessed.current = true;
      setLiveText(lastTranscript);
      // Small delay to let React state settle before processing
      setTimeout(() => {
        handleVoiceCommand(lastTranscript, location.pathname);
        clearTranscript();
        setTimeout(() => { hasProcessed.current = false; }, 500);
      }, 50);
    }
  }, [lastTranscript]);

  // When user clicks stop — also check window.pendingTranscript in case
  // onresult fired but React state hasn't updated lastTranscript yet
  const handleStop = () => {
    stopListening();
    // Give onresult a chance to fire after stop() is called
    setTimeout(() => {
      const pending = (window as any).pendingTranscript;
      if (pending && !hasProcessed.current && !lastTranscript) {
        hasProcessed.current = true;
        setLiveText(pending);
        handleVoiceCommand(pending, location.pathname);
        (window as any).pendingTranscript = '';
        setTimeout(() => { hasProcessed.current = false; }, 500);
      }
    }, 300);
  };

  // Ctrl+Space global hotkey
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault();
      if (isOpen) {
        if (isListening) {
          // Stop listening and process
          handleStop();
        } else {
          // Close overlay
          setIsOpen(false);
          setLiveText('');
        }
      } else {
        setIsOpen(true);
        setLiveText('');
        setTimeout(() => startListening(), 100);
      }
      return;
    }
    if (e.code === 'Escape' && isOpen) {
      e.preventDefault();
      stopListening();
      setIsOpen(false);
      setLiveText('');
    }
  }, [isOpen, isListening, startListening, stopListening]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  const vol = Math.min(volumeLevel / 80, 1);
  const isActive = isListening;
  const isProcessing = status === 'processing';
  const isSpeaking = status === 'speaking';

  const purple = '#8b5cf6';
  const purpleDark = '#6d28d9';

  // Button behavior: click to start OR click to stop+process
  const handleOrbClick = () => {
    if (isActive) {
      // User is done speaking — stop and process
      handleStop();
    } else if (!isProcessing && !isSpeaking) {
      // Start listening
      setLiveText('');
      (window as any).pendingTranscript = '';
      setTimeout(() => startListening(), 100);
    }
  };

  const statusLabel = isActive
    ? 'Tap to stop recording'
    : isProcessing
    ? 'Thinking...'
    : isSpeaking
    ? 'Speaking...'
    : liveText
    ? 'Processing...'
    : 'Tap to speak';

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
      style={{ backdropFilter: 'blur(18px)', background: 'rgba(219, 225, 243, 0.6)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopListening();
          setIsOpen(false);
          setLiveText('');
        }
      }}
    >
      <div
        className="flex flex-col items-center gap-5 rounded-2xl px-10 py-8"
        style={{
          background: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid rgba(139, 92, 246, 0.18)',
          boxShadow: '0 24px 60px rgba(109,40,217,0.12)',
          minWidth: 380, maxWidth: 440,
        }}
      >
        {/* Badge */}
        <div className="flex items-center gap-2">
          <AutoAwesomeOutlined style={{ fontSize: 13, color: purple }} />
          <span style={{ color: purple, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Velocity AI
          </span>
        </div>

        {/* Orb — click to start, click again to stop */}
        <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
          {isActive && (
            <>
              <div className="absolute rounded-full" style={{
                width: 120 + vol * 50, height: 120 + vol * 50,
                border: `1px solid rgba(139,92,246,${0.1 + vol * 0.25})`,
                transition: 'all 80ms ease',
              }} />
              <div className="absolute rounded-full" style={{
                width: 100 + vol * 30, height: 100 + vol * 30,
                border: `1px solid rgba(139,92,246,${0.2 + vol * 0.3})`,
                transition: 'all 80ms ease',
              }} />
            </>
          )}

          <div
            onClick={handleOrbClick}
            className="relative flex flex-col items-center justify-center rounded-full select-none"
            style={{
              width: 88, height: 88,
              background: isProcessing
                ? 'linear-gradient(135deg, #4c1d95, #6d28d9)'
                : isSpeaking
                ? 'linear-gradient(135deg, #5b21b6, #7c3aed)'
                : isActive
                ? `linear-gradient(135deg, ${purpleDark}, ${purple})`
                : 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
              border: isActive ? `2px solid ${purple}` : '2px solid rgba(139,92,246,0.3)',
              boxShadow: isActive
                ? `0 0 ${20 + vol * 30}px rgba(139,92,246,${0.4 + vol * 0.3})`
                : '0 4px 16px rgba(139,92,246,0.2)',
              transition: 'all 80ms ease',
              cursor: isProcessing || isSpeaking ? 'default' : 'pointer',
            }}
          >
            {isActive ? (
              // Show STOP icon when listening — clear signal to user
              <div className="flex flex-col items-center gap-1">
                <StopOutlined style={{ fontSize: 28, color: 'white' }} />
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, letterSpacing: '0.05em' }}>STOP</span>
              </div>
            ) : isProcessing ? (
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="rounded-full" style={{
                    width: 7, height: 7, background: 'white',
                    animation: `velo-bounce 1s ease-in-out ${i * 0.18}s infinite`,
                  }} />
                ))}
              </div>
            ) : (
              // Show MIC icon when idle
              <div className="flex flex-col items-center gap-1">
                <MicOutlined style={{ fontSize: 28, color: isSpeaking ? 'white' : purple }} />
                {!isSpeaking && <span style={{ color: 'rgba(109,40,217,0.6)', fontSize: 9, letterSpacing: '0.05em' }}>SPEAK</span>}
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <p style={{ color: '#1e1b4b', fontSize: 15, fontWeight: 400, textAlign: 'center' }}>
          {statusLabel}
        </p>

        {/* Live transcript — shows what was heard */}
        {liveText && (
          <div style={{
            background: 'rgba(139,92,246,0.06)',
            border: '1px solid rgba(139,92,246,0.15)',
            borderRadius: 10, padding: '8px 14px',
            width: '100%', textAlign: 'center',
          }}>
            <p style={{ color: '#4c1d95', fontSize: 13, fontStyle: 'italic' }}>
              "{liveText}"
            </p>
          </div>
        )}

        {/* Sound wave when listening */}
        {isActive && (
          <div className="flex items-center gap-[3px]" style={{ height: 24 }}>
            {[0.5, 0.8, 0.6, 1, 0.7, 0.9, 0.5, 0.8, 0.6].map((h, i) => (
              <div key={i} className="rounded-full" style={{
                width: 3,
                height: `${4 + vol * 18 * h}px`,
                background: purple,
                opacity: 0.6 + vol * 0.4,
                transition: 'height 80ms ease',
              }} />
            ))}
          </div>
        )}

        {/* Divider */}
        <div style={{ width: '100%', height: 1, background: 'rgba(139,92,246,0.1)' }} />

        {/* Example commands — hidden while listening to reduce distraction */}
        {!isActive && !isProcessing && !liveText && (
          <div className="w-full flex flex-col gap-1.5">
            <p style={{ color: 'rgba(109,40,217,0.35)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4, textAlign: 'center' }}>
              Try saying
            </p>
            {exampleCommands.map((cmd, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{
                background: 'rgba(139,92,246,0.04)',
                border: '1px solid rgba(139,92,246,0.08)',
              }}>
                <span style={{ color: purple, fontSize: 12, width: 14, textAlign: 'center', flexShrink: 0 }}>{cmd.icon}</span>
                <span style={{ color: '#4c1d95', fontSize: 13, fontWeight: 300 }}>"{cmd.text}"</span>
              </div>
            ))}
          </div>
        )}

        {/* Keyboard hints */}
        <div className="flex items-center gap-3" style={{ color: 'rgba(109,40,217,0.3)', fontSize: 11 }}>
          <span>
            <kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(139,92,246,0.07)', color: 'rgba(109,40,217,0.45)', fontFamily: 'monospace', fontSize: 10 }}>Esc</kbd>
            {' '}close
          </span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>
            <kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(139,92,246,0.07)', color: 'rgba(109,40,217,0.45)', fontFamily: 'monospace', fontSize: 10 }}>Ctrl+Space</kbd>
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
