export interface SpeechCallbacks {
    onStart?: () => void;
    onDone?: () => void;
    onError?: (error: Error) => void;
}

export interface SpeechService {
    speak(text: string, callbacks?: SpeechCallbacks): void;
    pause(): Promise<void>;
    resume(): Promise<void>;
    stop(): Promise<void>;
    isSpeaking(): Promise<boolean>;
}
