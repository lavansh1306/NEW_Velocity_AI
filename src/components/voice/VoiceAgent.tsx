import React, { useEffect, useRef, useState } from 'react';
import { useVoice } from '@/contexts/VoiceContext';
import { useVoiceActions } from '@/hooks/useVoiceActions';
import { useLocation } from 'react-router-dom';
import { Mic, MicOff, Loader2, Volume2, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import gsap from 'gsap';

export const VoiceAgent: React.FC = () => {
  const { isListening, status, lastTranscript, isTriggered, volumeLevel, pendingConfirmation, startListening, stopListening, stopSpeaking } = useVoice();
  const { handleVoiceCommand } = useVoiceActions();
  const location = useLocation();
  const isMobile = useIsMobile();
  const orbRef = useRef<HTMLDivElement>(null);

  const handleOrbClick = () => {
    if (isMobile) {
      window.dispatchEvent(new CustomEvent('velo-open-voice'));
    } else {
      if (isListening) stopListening();
      else startListening();
    }
  };
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle command execution when voice recognition finishes
  useEffect(() => {
    // IMPORTANT: We process the command if recognition has stopped (isListening=false)
    // AND we were previously triggered (isTriggered=true)
    // AND we have a transcript to handle.
    if (!isListening && isTriggered && lastTranscript && (status === 'idle' || status === 'speaking')) {
      console.log('[VoiceAgent] Processing final transcript:', lastTranscript);
      handleVoiceCommand(lastTranscript, location.pathname);
    }
    
    // If it was triggered but ended with no transcript, just reset
    if (!isListening && isTriggered && !lastTranscript && status === 'idle') {
      stopListening();
    }
  }, [isListening, isTriggered, lastTranscript, status, handleVoiceCommand, location.pathname]);

  // Keyboard shortcut Ctrl + Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        if (isListening) stopListening();
        else startListening();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        stopSpeaking();
        stopListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening, startListening, stopListening, status, stopSpeaking]);

  // GSAP Animations for the Orb
  useEffect(() => {
    if (!orbRef.current) return;

    if (status === 'listening') {
      // Fast emerald pulse without volume jitter
      gsap.to(orbRef.current, {
        scale: 1.15,
        duration: 0.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        backgroundColor: "#10B981",
        boxShadow: "0 0 25px rgba(16, 185, 129, 0.4)"
      });
    } else if (status === 'processing' || status === 'connecting') {
      // Professional Golden Pulse
      gsap.to(orbRef.current, {
        scale: 1.1,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        backgroundColor: "#F59E0B",
        boxShadow: "0 0 30px rgba(245, 158, 11, 0.6)"
      });
    } else if (status === 'speaking') {
      // Constant blue pulse
      gsap.to(orbRef.current, {
        scale: 1.15,
        duration: 0.4,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        backgroundColor: "#3B82F6",
        boxShadow: "0 0 25px rgba(59, 130, 246, 0.4)"
      });
    } else if (isTriggered) {
      // Soft wake state
      gsap.to(orbRef.current, {
        scale: 1.05,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        backgroundColor: "#10B981",
        boxShadow: "0 0 15px rgba(16, 185, 129, 0.3)"
      });
    } else {
      // Idle state
      gsap.to(orbRef.current, {
        scale: 1,
        rotation: 0,
        duration: 0.5,
        backgroundColor: status === 'error' ? '#EF4444' : '#9CA3AF',
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
      });
    }
  }, [status, isTriggered, volumeLevel]);

  // Initial animation on mount
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current, 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "power3.out" }
      );
    }
    // No longer auto-starting listening for wake word
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none"
    >
      {/* Transcript Bubble */}
      {(isTriggered || status !== 'idle') && (
        <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl p-4 shadow-2xl max-w-xs animate-in fade-in slide-in-from-bottom-4 pointer-events-auto ring-1 ring-black/5">
          <div className="max-h-48 overflow-y-auto pr-1">
            <p className="text-sm text-gray-800 font-medium leading-relaxed">
              {status === 'processing' ? (
                <span className="flex items-center gap-2 text-amber-600">
                  <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                </span>
              ) : status === 'connecting' ? (
                <span className="text-blue-500">Connecting...</span>
              ) : (lastTranscript || (status === 'listening' ? 'Listening...' : 'Ready'))}
            </p>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className={`h-1.5 w-1.5 rounded-full ${
                status === 'connecting' ? 'bg-blue-400 animate-pulse' :
                status === 'listening' ? 'bg-emerald-500 animate-pulse' : 
                status === 'processing' ? 'bg-amber-500 animate-bounce' : 
                status === 'speaking' ? 'bg-blue-500' : 
                status === 'error' ? 'bg-red-500' : 'bg-gray-400'
              }`} />
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                {status}
              </span>
            </div>
            {status !== 'idle' && (
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (status === 'speaking') stopSpeaking();
                  else stopListening(); 
                }}
                className="text-[10px] text-gray-400 hover:text-red-500 transition-colors uppercase font-bold"
              >
                {status === 'speaking' ? 'Stop' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Orb Button */}
      <div 
        className="pointer-events-auto group relative"
        title={isListening ? "Stop (Ctrl + Space)" : "Talk with VeloAI (Ctrl + Space)"}
      >
        <div 
          ref={orbRef}
          onClick={handleOrbClick}
          className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors border-2 border-white/50 backdrop-blur-sm
            ${isListening ? 'bg-emerald-500' : 'bg-gray-400 opacity-50 hover:opacity-100'}
            ${status === 'error' ? 'animate-pulse bg-red-500 opacity-100' : ''}
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
      </div>
    </div>
  );
};
