import React, { useState, useEffect, useCallback } from 'react';
import { MicOutlined, GraphicEqOutlined } from '@mui/icons-material';
import { toast } from 'sonner';

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    className?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, className }) => {
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.interimResults = false;
            rec.lang = 'en-US';

            rec.onstart = () => setIsListening(true);
            rec.onend = () => setIsListening(false);
            rec.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                onTranscript(transcript);
            };
            rec.onerror = (event: any) => {
                if (event.error !== 'no-speech') {
                    console.error('Speech recognition error', event.error);
                    if (event.error === 'not-allowed') {
                        toast.error("Microphone access denied");
                    }
                }
                setIsListening(false);
            };

            setRecognition(rec);
        }
    }, [onTranscript]);

    const toggleListening = useCallback(() => {
        if (!recognition) {
            toast.error("Speech recognition not supported in this browser");
            return;
        }

        if (isListening) {
            recognition.stop();
        } else {
            try {
                recognition.start();
            } catch (err) {
                console.error("Failed to start recognition", err);
                setIsListening(false);
            }
        }
    }, [isListening, recognition]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.code === 'Space') {
                e.preventDefault();
                toggleListening();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleListening]);

    return (
        <button
            type="button"
            onClick={toggleListening}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                isListening 
                ? 'bg-red-50 text-red-500 animate-pulse border border-red-200 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                : 'bg-white text-[#78716C] hover:text-[#0F766E] hover:bg-[#F0FDFA] border border-[#E7E5E4] shadow-sm'
            } ${className}`}
            title="Toggle Voice Input (Ctrl + Space)"
        >
            {isListening ? (
                <GraphicEqOutlined style={{ fontSize: 20 }} />
            ) : (
                <MicOutlined style={{ fontSize: 20 }} />
            )}
        </button>
    );
};
