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
  const triggerPhrases = ['velocity', 'hey velocity', 'hi velocity', 'ok velocity'];
  const isListeningRef = useRef(false);
  const isTriggeredRef = useRef(false);
  const statusRef = useRef<VoiceStatus>('idle');

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isTriggeredRef.current = isTriggered;
  }, [isTriggered]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }, []);


  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Changed to false for better stability
      recognition.interimResults = false; // Changed to false for better reliability
      recognition.lang = 'en-US';
      (window as any).isListeningIntent = false;

      recognition.onstart = async () => {
        console.log('[VoiceContext] Speech recognition started');
        setIsListening(true);
        setStatus('listening');
        try {
          await setupAudioProcessing();
        } catch (err) {
          console.warn('[VoiceContext] Audio processing setup failed:', err);
        }
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('[VoiceContext] Final result received:', transcript);
        setLastTranscript(transcript);
        setStatus('idle'); // We've heard something, it's done for this batch
      };

      recognition.onerror = (event: any) => {
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
        setIsListening(false);
        isListeningRef.current = false;
        (window as any).isListeningIntent = false;
        if (statusRef.current !== 'error' && statusRef.current !== 'speaking') {
          setStatus('idle');
        }
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
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
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
        
        if (isListeningRef.current || isTriggeredRef.current) {
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
    if (isListening) return;

    try {
      setLastTranscript('');
      setIsTriggered(true);
      setStatus('connecting');
      
      if (recognitionRef.current) {
        (window as any).isListeningIntent = true;
        recognitionRef.current.start();
        console.log('[VoiceContext] Native Speech Recognition starting');
      } else {
        throw new Error('Speech Recognition not supported in this browser.');
      }
    } catch (err) {
      console.error('[VoiceContext] Error starting speech recognition:', err);
      setStatus('error');
      toast.error(`Voice start failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      (window as any).isListeningIntent = false;
      recognitionRef.current.stop();
    }
    setIsListening(false);
    isListeningRef.current = false;
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

  const speak = async (text: string) => {
    console.log('[VoiceContext] speak called with:', text);
    if (!text?.trim()) return;

    const fallbackBrowserSpeak = () => {
      if (!('speechSynthesis' in window)) {
        setStatus('idle');
        return;
      }

      const synth = window.speechSynthesis;
      const voices = synth.getVoices();
      const utterance = new SpeechSynthesisUtterance(text);

      const preferred =
        voices.find(v => /en-US|en_US/i.test(v.lang)) ||
        voices.find(v => /en/i.test(v.lang)) ||
        voices[0];

      if (preferred) utterance.voice = preferred;
      utterance.lang = preferred?.lang || 'en-US';
      utterance.volume = 1;
      utterance.rate = 1;
      utterance.pitch = 1;

      utterance.onstart = () => {
        console.log('[VoiceContext] browser fallback speech started');
        setStatus('speaking');
      };

      utterance.onend = () => {
        console.log('[VoiceContext] browser fallback speech ended');
        setStatus('idle');
      };

      utterance.onerror = (e) => {
        console.error('[VoiceContext] browser fallback speech error:', e);
        setStatus('idle');
      };

      try {
        synth.cancel();
        setTimeout(() => synth.speak(utterance), 50);
      } catch (err) {
        console.error('[VoiceContext] browser fallback speak failed:', err);
        setStatus('idle');
      }
    };

    try {
      setStatus('speaking');

      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('[VoiceContext] /api/voice/tts failed:', errText);
        fallbackBrowserSpeak();
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.onplay = () => {
        console.log('[VoiceContext] audio playback started');
        setStatus('speaking');
      };

      audio.onended = () => {
        console.log('[VoiceContext] audio playback ended');
        URL.revokeObjectURL(url);
        setStatus('idle');
      };

      audio.onerror = (e) => {
        console.error('[VoiceContext] audio playback error:', e);
        URL.revokeObjectURL(url);
        fallbackBrowserSpeak();
      };

      audio.play().catch((e) => {
        console.error('[VoiceContext] audio play failed:', e);
        URL.revokeObjectURL(url);
        fallbackBrowserSpeak();
      });
    } catch (e) {
      console.error('[VoiceContext] speak failed:', e);
      fallbackBrowserSpeak();
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
