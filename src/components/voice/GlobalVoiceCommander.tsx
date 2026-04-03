import React, { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useVoice } from '@/contexts/VoiceContext';
import { useVoiceActions } from '@/hooks/useVoiceActions';

/**
 * GlobalVoiceCommander
 *
 * Sits at the app root (inside VoiceProvider + Router).
 * - Ctrl+Space anywhere in the app → opens the overlay and starts listening
 * - Escape → closes the overlay
 * - On transcript → calls useVoiceActions.handleVoiceCommand
 * - Animates an orb that reacts to volume level
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
      // Reset flag after a tick
      setTimeout(() => { hasProcessed.current = false; }, 300);
    }
  }, [lastTranscript, location.pathname, handleVoiceCommand, clearTranscript]);

  // Global Ctrl+Space hotkey
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ctrl+Space to toggle
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault();
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
      return;
    }
    // Escape to close
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

  // Map volume (0-128) to orb scale and glow
  const normalizedVolume = Math.min(volumeLevel / 80, 1);
  const orbScale = 1 + normalizedVolume * 0.35;
  const glowOpacity = 0.3 + normalizedVolume * 0.5;
  const glowSize = 60 + normalizedVolume * 60;

  const statusLabel = {
    listening: 'Listening...',
    processing: 'Thinking...',
    speaking: 'Speaking...',
    connecting: 'Connecting...',
    error: 'Try again',
    idle: pendingConfirmation ? 'Say yes or no' : 'Ready',
  }[status] ?? 'Ready';

  const exampleCommands = [
    'Go to projects',
    'Plan a React dashboard project',
    'Add Sarah as frontend developer',
    'Who has bandwidth this week?',
    'Remove John from the team',
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) stopListening(); }}
    >
      <div className="flex flex-col items-center gap-8 select-none">

        {/* Orb */}
        <div className="relative flex items-center justify-center">
          {/* Outer glow ring */}
          <div
            className="absolute rounded-full transition-all duration-75"
            style={{
              width: glowSize + 80,
              height: glowSize + 80,
              background: `radial-gradient(circle, rgba(45,212,191,${glowOpacity * 0.3}) 0%, transparent 70%)`,
              transform: `scale(${orbScale})`,
            }}
          />
          {/* Mid ring */}
          <div
            className="absolute rounded-full border transition-all duration-75"
            style={{
              width: glowSize + 20,
              height: glowSize + 20,
              borderColor: `rgba(45,212,191,${glowOpacity * 0.4})`,
              transform: `scale(${orbScale})`,
            }}
          />
          {/* Core orb */}
          <div
            className="relative flex items-center justify-center rounded-full transition-all duration-75"
            style={{
              width: 96,
              height: 96,
              background: status === 'processing'
                ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                : status === 'speaking'
                ? 'linear-gradient(135deg, #0f766e, #0891b2)'
                : 'linear-gradient(135deg, #2DD4BF, #0d9488)',
              boxShadow: `0 0 ${glowSize / 2}px rgba(45,212,191,${glowOpacity}), 0 0 40px rgba(45,212,191,0.3)`,
              transform: `scale(${orbScale})`,
            }}
          >
            {/* Animated bars inside orb */}
            <div className="flex items-center gap-[3px]">
              {[0.6, 1, 0.8, 1, 0.6].map((h, i) => (
                <div
                  key={i}
                  className="rounded-full bg-white"
                  style={{
                    width: 3,
                    height: status === 'listening'
                      ? `${8 + normalizedVolume * 20 * h}px`
                      : status === 'processing' || status === 'speaking'
                      ? `${8 + Math.sin(Date.now() / 200 + i) * 8 * h}px`
                      : '6px',
                    opacity: 0.9,
                    transition: 'height 80ms ease',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Status label */}
        <div className="text-center">
          <p
            className="text-white text-xl font-light tracking-wide mb-1"
            style={{ fontFamily: 'inherit' }}
          >
            {statusLabel}
          </p>
          {pendingConfirmation && (
            <p className="text-teal-300 text-sm font-light">
              {pendingConfirmation.response}
            </p>
          )}
        </div>

        {/* Example commands — only show when idle/listening and no confirmation */}
        {!pendingConfirmation && (status === 'listening' || status === 'idle') && (
          <div className="flex flex-col gap-2 items-center">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Try saying</p>
            {exampleCommands.map((cmd, i) => (
              <div
                key={i}
                className="px-4 py-2 rounded-full text-sm font-light text-white/70 border border-white/10"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                "{cmd}"
              </div>
            ))}
          </div>
        )}

        {/* Dismiss hint */}
        <p className="text-white/30 text-xs">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-mono text-xs">Esc</kbd> or click outside to close
          &nbsp;·&nbsp;
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-mono text-xs">Ctrl+Space</kbd> to toggle
        </p>
      </div>
    </div>
  );
};
