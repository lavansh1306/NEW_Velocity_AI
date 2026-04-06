import React, { useEffect, useRef } from 'react';
import { useVoice } from '@/contexts/VoiceContext';
import { useLocation } from 'react-router-dom';
import { Mic, MicOff, Loader2, Volume2, X } from 'lucide-react';
import gsap from 'gsap';

export const VoiceAgent: React.FC = () => {
  const { isListening, status, isTriggered, volumeLevel, startListening, stopListening } = useVoice();
  const location = useLocation();
  const orbRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orbRef.current) return;
    if (status === 'listening') {
      const scale = 1.1 + (volumeLevel / 100);
      gsap.to(orbRef.current, { scale, duration: 0.1, ease: "power2.out" });
    } else if (isTriggered) {
      gsap.to(orbRef.current, { scale: 1.2, duration: 0.5, repeat: -1, yoyo: true, ease: "sine.inOut" });
    } else if (status === 'connecting' || status === 'processing') {
      gsap.to(orbRef.current, { rotation: 360, repeat: -1, duration: 1, ease: "none" });
    } else if (status === 'speaking') {
      gsap.to(orbRef.current, { scale: 1.1, duration: 0.2, repeat: -1, yoyo: true, ease: "power1.inOut", backgroundColor: "#3B82F6" });
    } else {
      gsap.to(orbRef.current, { scale: 1, rotation: 0, duration: 0.5, backgroundColor: status === 'error' ? '#EF4444' : '#9CA3AF' });
    }
  }, [status, isTriggered, volumeLevel]);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "power3.out" });
    }
  }, []);

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-[9998] flex flex-col items-end gap-3 pointer-events-none">
      <div className="pointer-events-auto group relative" title={isListening ? "Stop (Ctrl + Space)" : "Talk with VeloAI (Ctrl + Space)"}>
        <div
          ref={orbRef}
          onClick={() => isListening ? stopListening() : startListening()}
          className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors border-2 border-white/50 backdrop-blur-sm ${isListening ? 'bg-emerald-500' : 'bg-gray-400 opacity-50 hover:opacity-100'}`}
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
        <div className={`absolute -inset-1 rounded-full border-2 border-emerald-400/30 animate-ping opacity-0 ${isTriggered ? 'opacity-100' : ''}`} />
      </div>
    </div>
  );
};
