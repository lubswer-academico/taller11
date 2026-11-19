import { useCallback, useEffect, useState } from 'react';
import { ExpoSpeechService } from '../../data/services/ExpoSpeechService';
import { Message } from '../../domain/entities/Message';
import { SpeechService } from '../../domain/services/SpeechService';

export type VoicePlaybackStatus = 'idle' | 'playing' | 'paused';

const speechService: SpeechService = new ExpoSpeechService('es-ES');

export const useVoicePlayback = () => {
    const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
    const [status, setStatus] = useState<VoicePlaybackStatus>('idle');

    const playMessage = useCallback((message: Message) => {
        setActiveMessageId(message.id);
        setStatus('playing');

        speechService.speak(message.content, {
            onDone: () => {
                setActiveMessageId(current => (current === message.id ? null : current));
                setStatus('idle');
            },
            onError: () => {
                // Fallback seguro: revelar el texto si el motor de voz falla
                setActiveMessageId(current => (current === message.id ? null : current));
                setStatus('idle');
            },
        });
    }, []);

    const togglePlayPause = useCallback(async () => {
        if (!activeMessageId) return;

        if (status === 'playing') {
            setStatus('paused');
            await speechService.pause();
        } else if (status === 'paused') {
            setStatus('playing');
            await speechService.resume();
        }
    }, [activeMessageId, status]);

    const skipToText = useCallback(async () => {
        setActiveMessageId(null);
        setStatus('idle');
        await speechService.stop();
    }, []);

    const stopAll = useCallback(async () => {
        setActiveMessageId(null);
        setStatus('idle');
        await speechService.stop();
    }, []);

    useEffect(() => {
        return () => {
            speechService.stop().catch(() => {
                // Ignorar error al desmontar
            });
        };
    }, []);

    return {
        activeMessageId,
        status,
        playMessage,
        togglePlayPause,
        skipToText,
        stopAll,
    };
};
