import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { geminiVoiceService, VoiceAction } from '@/services/geminiVoiceService';

type VoiceStatus = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking' | 'error';

interface VoiceContextType {
  isListening: boolean;
  status: VoiceStatus;
  lastTranscript: string;
  isTriggered: boolean;
  commandQueue: VoiceAction[];
  pendingConfirmation: VoiceAction | null;
  startListening: () => void;
  stopListening: () => void;
  setProcessing: (processing: boolean) => void;
  clearTranscript: () => void;
  speak: (text: string) => void;
  volumeLevel: number; // NEW: Voice activity level
  enqueueAction: (action: VoiceAction) => void;
  consumeAction: (type: string) => VoiceAction | null;
  setPendingConfirmation: (action: VoiceAction | null) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [lastTranscript, setLastTranscript] = useState('');
  const [isTriggered, setIsTriggered] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0); 
  const [commandQueue, setCommandQueue] = useState<VoiceAction[]>([]);
  const [pendingConfirmation, setPendingConfirmation] = useState<VoiceAction | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeListeningRef = useRef<boolean>(false); // NEW: Track native state to prevent InvalidStateError
  const triggerPhrases = ['velocity', 'hey velocity', 'hi velocity', 'ok velocity'];

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Changed to false for better stability
      recognition.interimResults = false; // Changed to false for better reliability
      recognition.lang = 'en-US';
      (window as any).isListeningIntent = false;

      recognition.onstart = () => {
        console.log('[VoiceContext] Speech recognition started');
        nativeListeningRef.current = true;
        setIsListening(true);
        setStatus('listening');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('[VoiceContext] Final result received:', transcript);
        setLastTranscript(transcript);
        setStatus('idle'); // We've heard something, it's done for this batch
      };

      recognition.onerror = (event: any) => {
        nativeListeningRef.current = false;
        if (event.error !== 'no-speech') {
          console.error('[VoiceContext] Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            toast.error('Microphone access denied. Please enable it in your browser settings.');
          }
          setStatus('error');
        } else {
          // No speech heard at all
          setIsListening(false);
          setStatus('idle');
        }
        (window as any).isListeningIntent = false;
      };

      recognition.onend = () => {
        console.log('[VoiceContext] Speech recognition ended');
        nativeListeningRef.current = false;
        setIsListening(false);
        (window as any).isListeningIntent = false;
        if (status !== 'error') setStatus('idle');
      };

      recognitionRef.current = recognition;
    }
  }, []); // Initialize only ONCE on mount

  // NEW: Setup Web Audio API Processing
  const setupAudioProcessing = async () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioCtxRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
      }

      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }

      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioCtxRef.current.createMediaStreamSource(streamRef.current);
        
        // High-pass filter to remove low-frequency rumble (noise isolation)
        const filter = audioCtxRef.current.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 100; // Cut off frequencies below 100Hz
        
        source.connect(filter);
        filter.connect(analyserRef.current);
      }

      // Monitoring loop for volume levels
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Simple average for volume level
        const sum = dataArray.reduce((acc, v) => acc + v, 0);
        const avg = sum / dataArray.length;
        setVolumeLevel(avg);
        
        if (isListening || isTriggered) {
          requestAnimationFrame(updateVolume);
        } else {
          setVolumeLevel(0);
        }
      };
      
      updateVolume();
    } catch (err) {
      console.warn('[VoiceContext] Failed to setup local audio processing:', err);
    }
  };

  const startListening = useCallback(async () => {
    // Check both state AND native ref to be 100% sure we don't double-start
    if (isListening || nativeListeningRef.current) {
      console.warn('[VoiceContext] Already listening, ignoring start request');
      return;
    }

    try {
      await setupAudioProcessing();
      setLastTranscript(''); 
      setIsTriggered(true); 
      setStatus('connecting');
      
      if (recognitionRef.current) {
        (window as any).isListeningIntent = true;
        nativeListeningRef.current = true; // Set immediately to block rapid calls
        recognitionRef.current.start();
        setStatus('listening');
        setIsListening(true);
        console.log('[VoiceContext] Native Speech Recognition start() called');
      } else {
        throw new Error('Speech Recognition not supported in this browser.');
      }
    } catch (err) {
      nativeListeningRef.current = false;
      console.error('[VoiceContext] Error starting speech recognition:', err);
      setStatus('error');
      toast.error('Failed to access microphone or start speech recognition.');
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && nativeListeningRef.current) {
      (window as any).isListeningIntent = false;
      recognitionRef.current.stop();
      nativeListeningRef.current = false;
    }
    setIsListening(false);
    setIsTriggered(false);
    setStatus('idle');
  }, []);

  // handleToolCall is now deprecated in favor of useVoiceActions handling geminiVoiceService directly
  const handleToolCall = useCallback((toolCall: any) => {
    // Legacy support if needed, but the new flow uses useVoiceActions
  }, []);

  const setProcessing = (processing: boolean) => {
    setStatus(processing ? 'processing' : 'idle');
    if (!processing) {
      setIsTriggered(false);
      setLastTranscript(''); // Clear transcript after processing
    }
  };

  const clearTranscript = () => setLastTranscript('');

  const enqueueAction = useCallback((action: VoiceAction) => {
    setCommandQueue(prev => [...prev, action]);
  }, []);

  const consumeAction = useCallback((type: string) => {
    const actionIndex = commandQueue.findIndex(a => a.type === type);
    if (actionIndex !== -1) {
      const action = commandQueue[actionIndex];
      setCommandQueue(prev => prev.filter((_, i) => i !== actionIndex));
      return action;
    }
    return null;
  }, [commandQueue]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setStatus('speaking');
      utterance.onend = () => setStatus('idle');
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <VoiceContext.Provider value={{ 
      isListening, 
      status, 
      lastTranscript, 
      isTriggered, 
      volumeLevel,
      commandQueue,
      pendingConfirmation,
      startListening, 
      stopListening,
      setProcessing,
      clearTranscript,
      speak,
      enqueueAction,
      consumeAction,
      setPendingConfirmation
    }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};
