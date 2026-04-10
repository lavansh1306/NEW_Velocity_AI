import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useVoice } from '@/contexts/VoiceContext';
import { useVoiceActions } from '@/hooks/useVoiceActions';
import { useLocation } from 'react-router-dom';
import { Mic, MicOff, Loader2, Volume2, X } from 'lucide-react';
import gsap from 'gsap';

export const VoiceAgent: React.FC = () => {
  const { isListening, status, lastTranscript, isTriggered, volumeLevel, pendingConfirmation, startListening, stopListening } = useVoice();
  const { handleVoiceCommand } = useVoiceActions();
  const location = useLocation();
  const orbRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Do not render on landing page, login, or signup
  const isExcludedPage = ['/', '/login', '/signup'].includes(location.pathname);
  if (isExcludedPage) return null;

  // Handle command execution when voice recognition finishes
  useEffect(() => {
    // If we transition from listening/processing to idle and have a transcript, execute it
    if (!isListening && isTriggered && lastTranscript && status === 'idle') {
      console.log('[VoiceAgent] Recognition finished, breaking loop and processing:', lastTranscript);
      stopListening(); // CRITICAL: Reset trigger state immediately to prevent infinite loop
      handleVoiceCommand(lastTranscript, location.pathname);
    }
    
    // If it was triggered but ended with no transcript, just reset
    if (!isListening && isTriggered && !lastTranscript && status === 'idle') {
      stopListening();
    }
  }, [isListening, isTriggered, lastTranscript, status, stopListening, handleVoiceCommand, location.pathname]);

  // Unified toggle function for both click and shortcut
  const toggleVoice = useCallback(() => {
    if (isListening || status === 'listening' || status === 'connecting') {
      console.log('[VoiceAgent] Toggling: Stopping');
      stopListening();
    } else {
      console.log('[VoiceAgent] Toggling: Starting');
      startListening();
    }
  }, [isListening, status, startListening, stopListening]);

  // Keyboard shortcut handling (Ctrl + Space or Cmd + Space)
  const isMac = typeof window !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.userAgent);
  const modifierKey = isMac ? 'Cmd' : 'Ctrl';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl/Cmd + Space
      const isModifierPressed = isMac ? e.metaKey : e.ctrlKey;
      
      if (isModifierPressed && e.code === 'Space') {
        e.preventDefault();
        toggleVoice();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleVoice, isMac]);

  // GSAP Animations for the Orb
  useEffect(() => {
    if (!orbRef.current) return;

    let animFrame: number;
    const animateVolume = () => {
      if (status === 'listening' && volumeLevel.current !== undefined) {
        const scale = 1.1 + (volumeLevel.current / 100);
        gsap.to(orbRef.current, {
          scale: scale,
          duration: 0.1,
          ease: "power2.out",
          boxShadow: `0 0 ${20 + volumeLevel.current / 2}px rgba(16, 185, 129, ${0.4 + volumeLevel.current / 200})`
        });
        animFrame = requestAnimationFrame(animateVolume);
      }
    };

    if (status === 'listening') {
      animateVolume();
    } else if (isTriggered) {
      gsap.to(orbRef.current, {
        scale: 1.2,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        boxShadow: "0 0 20px rgba(16, 185, 129, 0.6)"
      });
    } else if (status === 'connecting' || status === 'processing') {
      // Pulsing glow instead of rotating the whole button
      gsap.to(orbRef.current, {
        scale: 1.15,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        backgroundColor: status === 'connecting' ? '#93C5FD' : '#F59E0B' // Blue for connecting, Amber for processing
      });
    } else if (status === 'speaking') {
      gsap.to(orbRef.current, {
        scale: 1.1,
        duration: 0.2,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        backgroundColor: "#3B82F6"
      });
    } else {
      gsap.to(orbRef.current, {
        scale: 1,
        rotation: 0,
        duration: 0.5,
        backgroundColor: status === 'error' ? '#EF4444' : '#9CA3AF' // red-500 for error, gray-400 for idle
      });
    }
    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [status, isTriggered, volumeLevel]);

  // Initial animation on mount
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current, 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "power3.out" }
      );
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none"
    >
      {/* Transcript Bubble */}
      {(isTriggered || status !== 'idle') && lastTranscript && (
        <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl p-4 shadow-xl max-w-xs animate-in fade-in slide-in-from-bottom-4 pointer-events-auto">
          <p className="text-sm text-gray-800 font-medium italic">
            "{status === 'processing' ? 'Processing with VeloAI...' : (lastTranscript || 'Listening...')}"
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className={`h-1.5 w-1.5 rounded-full ${
              status === 'connecting' ? 'bg-blue-400 animate-pulse' :
              status === 'listening' ? 'bg-emerald-500 animate-pulse' : 
              status === 'processing' ? 'bg-amber-500 animate-bounce' : 
              status === 'speaking' ? 'bg-blue-500' : 
              status === 'error' ? 'bg-red-500' : 'bg-gray-400'
            }`} />
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
              {status === 'connecting' ? 'Connecting...' :
               status === 'listening' ? (pendingConfirmation ? 'Confirming...' : 'Listening...') : 
               status === 'processing' ? 'Checking...' : 
               status === 'speaking' ? 'Speaking...' : 
               status === 'error' ? 'Mic Blocked' : 'Ready'}
            </span>
          </div>
        </div>
      )}

      {/* Main Orb Button */}
      <button 
        type="button"
        onClick={toggleVoice}
        className="pointer-events-auto group relative outline-none border-none bg-transparent p-0"
        title={isListening ? `Stop (${modifierKey} + Space)` : `Talk with VeloAI (${modifierKey} + Space)`}
        aria-label={isListening ? "Stop voice recognition" : "Start voice recognition"}
      >
        <div 
          ref={orbRef}
          className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors border-2 border-white/50 backdrop-blur-sm
            ${isListening ? 'bg-emerald-500' : 'bg-gray-400 opacity-50 group-hover:opacity-100'}
          `}
        >
          {status === 'connecting' || status === 'processing' ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : status === 'speaking' ? (
            <Volume2 className="w-6 h-6 text-white" />
          ) : status === 'error' ? (
            <X className="w-6 h-6 text-white" />
          ) : isListening ? (
            <Mic className="w-6 h-6 text-white" />
          ) : (
            <MicOff className="w-6 h-6 text-white" />
          )}
        </div>

        {/* Status indicator ring */}
        <div className={`absolute -inset-1 rounded-full border-2 border-emerald-400/30 animate-ping opacity-0 ${isTriggered ? 'opacity-100' : ''}`} />
      </button>
    </div>
  );
};
