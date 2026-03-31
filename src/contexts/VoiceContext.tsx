import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { multiModalLiveService, MultiModalEvent } from '@/services/MultiModalLiveService';

type VoiceStatus = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking' | 'error';

interface VoiceContextType {
  isListening: boolean;
  status: VoiceStatus;
  lastTranscript: string;
  isTriggered: boolean;
  startListening: () => void;
  stopListening: () => void;
  setProcessing: (processing: boolean) => void;
  clearTranscript: () => void;
  speak: (text: string) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [lastTranscript, setLastTranscript] = useState('');
  const [isTriggered, setIsTriggered] = useState(false);
  const recognitionRef = useRef<any>(null);
  const triggerPhrases = ['velocity', 'hey velocity', 'hi velocity', 'ok velocity'];

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('[VoiceContext] Speech recognition started');
        setIsListening(true);
        setStatus('listening');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = (finalTranscript || interimTranscript).toLowerCase().trim();
        setLastTranscript(currentText);
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.error('[VoiceContext] Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            toast.error('Microphone access denied. Please enable it in your browser settings.');
            (window as any).isListeningIntent = false;
          }
          setStatus('error');
        }
      };

      recognition.onend = () => {
        console.log('[VoiceContext] Speech recognition ended');
        // Restart if we are supposed to be listening (prevents flicker/timeout issues)
        if (recognitionRef.current && (window as any).isListeningIntent) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.warn('[VoiceContext] Failed to restart recognition:', e);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }
  }, []); // Initialize only ONCE on mount

  const startListening = useCallback(async () => {
    if (isListening) return;

    try {
      setLastTranscript(''); 
      setIsTriggered(true); 
      setStatus('connecting');
      
      await multiModalLiveService.connect((event: MultiModalEvent) => {
        if (event.type === 'connected') {
          console.log('[VoiceContext] Multimodal Live connected');
          setIsListening(true);
          setStatus('listening');
        } else if (event.type === 'transcript') {
          setLastTranscript(event.data);
        } else if (event.type === 'tool_call') {
          setStatus('processing');
          handleToolCall(event.data);
        } else if (event.type === 'error') {
          setStatus('error');
          toast.error('Voice service failed. Check console.');
        } else if (event.type === 'disconnected') {
          setIsListening(false);
          setIsTriggered(false);
          setStatus('idle');
        }
      });
    } catch (err) {
      console.error('[VoiceContext] Error starting multimodal service:', err);
      setStatus('error');
      // Check if it's a permission error
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        toast.error('Microphone access denied. Please enable it in browser settings.');
      } else {
        toast.error('Failed to access microphone.');
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    multiModalLiveService.stop();
    setIsListening(false);
    setIsTriggered(false);
    setStatus('idle');
  }, []);

  const handleToolCall = useCallback((toolCall: any) => {
    if (!toolCall.functionCalls) return;

    for (const call of toolCall.functionCalls) {
      const { name, args } = call;
      console.log(`[VoiceContext] Executing tool: ${name}`, args);

      if (name === 'navigate') {
        const { target } = args;
        window.dispatchEvent(new CustomEvent('velo-navigate', { detail: { target } }));
        toast.info(`Navigating to ${target}...`);
      } else if (name === 'create_task') {
        const { title } = args;
        toast.success(`Task created: ${title}`);
      }
    }
    
    multiModalLiveService.sendToolResponse(toolCall);
  }, []);

  const setProcessing = (processing: boolean) => {
    setStatus(processing ? 'processing' : 'idle');
    if (!processing) {
      setIsTriggered(false);
      setLastTranscript(''); // Clear transcript after processing
    }
  };

  const clearTranscript = () => setLastTranscript('');

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
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
      startListening, 
      stopListening,
      setProcessing,
      clearTranscript,
      speak
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
