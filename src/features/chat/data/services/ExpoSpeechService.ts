import * as Speech from 'expo-speech';
import { lexer, Token, Tokens } from 'marked';
import { Platform } from 'react-native';
import {
    SpeechCallbacks,
    SpeechService,
} from '../../domain/services/SpeechService';

const extractPlainTextFromTokens = (tokens: Token[]): string => {
    const parts: string[] = [];

    for (const token of tokens) {
        switch (token.type) {
            case 'space':
            case 'hr':
            case 'def':
            case 'checkbox':
                break;

            case 'heading':
            case 'paragraph':
            case 'blockquote': {
                const container = token as Tokens.Heading | Tokens.Paragraph | Tokens.Blockquote;
                const inner = extractPlainTextFromTokens(container.tokens);
                if (inner) parts.push(inner);
                break;
            }

            case 'strong':
            case 'em':
            case 'del': {
                const formatted = token as Tokens.Strong | Tokens.Em | Tokens.Del;
                parts.push(extractPlainTextFromTokens(formatted.tokens));
                break;
            }

            case 'link': {
                const link = token as Tokens.Link;
                const label = link.tokens?.length
                    ? extractPlainTextFromTokens(link.tokens)
                    : link.text;
                parts.push(label);
                break;
            }

            case 'codespan': {
                const code = token as Tokens.Codespan;
                parts.push(code.text);
                break;
            }

            case 'code': {
                const codeBlock = token as Tokens.Code;
                parts.push(
                    codeBlock.lang
                        ? `Bloque de código en ${codeBlock.lang}.`
                        : 'Bloque de código.'
                );
                break;
            }

            case 'list': {
                const list = token as Tokens.List;
                const itemTexts = list.items
                    .map(item => extractPlainTextFromTokens(item.tokens).trim())
                    .filter(Boolean);
                if (itemTexts.length) {
                    parts.push(itemTexts.join('. '));
                }
                break;
            }

            case 'table': {
                const table = token as Tokens.Table;
                const headerText = table.header
                    .map(cell => extractPlainTextFromTokens(cell.tokens).trim())
                    .filter(Boolean)
                    .join(', ');
                const rowTexts = table.rows
                    .map(row =>
                        row
                            .map(cell => extractPlainTextFromTokens(cell.tokens).trim())
                            .filter(Boolean)
                            .join(', ')
                    )
                    .filter(Boolean);
                parts.push([headerText, ...rowTexts].filter(Boolean).join('. '));
                break;
            }

            case 'br':
                parts.push(' ');
                break;

            case 'escape': {
                const escape = token as Tokens.Escape;
                parts.push(escape.text);
                break;
            }

            case 'image': {
                const image = token as Tokens.Image;
                if (image.text) parts.push(image.text);
                break;
            }

            case 'text': {
                const textToken = token as Tokens.Text;
                if (textToken.tokens?.length) {
                    parts.push(extractPlainTextFromTokens(textToken.tokens));
                } else {
                    parts.push(textToken.text);
                }
                break;
            }

            default:
                if (token.raw) parts.push(token.raw);
                break;
        }
    }

    return parts.join(' ');
};

export const markdownToPlainText = (markdown: string): string => {
    const tokens = lexer(markdown, { gfm: true, breaks: true });
    const rawText = extractPlainTextFromTokens(tokens)
        .replace(/\s+/g, ' ')
        .replace(/\s+([.,;:!?])/g, '$1')
        .trim();

    const maxLength = Speech.maxSpeechInputLength;
    if (Number.isFinite(maxLength) && maxLength > 0 && rawText.length > maxLength) {
        return rawText.slice(0, maxLength - 3).trimEnd() + '...';
    }

    return rawText;
};

export class ExpoSpeechService implements SpeechService {
    private readonly language: string;
    private sessionId = 0;
    private currentText = '';
    private baseOffset = 0;
    private lastCharIndex = 0;
    private isPausedState = false;
    private currentCallbacks?: SpeechCallbacks;

    constructor(language = 'es-ES') {
        this.language = language;
    }

    speak(text: string, callbacks?: SpeechCallbacks): void {
        this.sessionId += 1;
        const activeSession = this.sessionId;
        const cleanText = markdownToPlainText(text);

        this.resetInternalState();

        if (!cleanText) {
            callbacks?.onDone?.();
            return;
        }

        this.currentText = cleanText;
        this.currentCallbacks = callbacks;

        Speech.stop()
            .catch(() => {
                // Ignorar error si no había audio activo
            })
            .finally(() => {
                if (activeSession !== this.sessionId) return;
                this.startUtterance(cleanText, activeSession);
            });
    }

    async pause(): Promise<void> {
        if (this.isPausedState || !this.currentText) return;
        this.isPausedState = true;

        if (Platform.OS === 'android') {
            // Android no soporta Speech.pause() nativamente: detenemos conservando la posición
            this.sessionId += 1;
            await Speech.stop();
        } else {
            await Speech.pause();
        }
    }

    async resume(): Promise<void> {
        if (!this.isPausedState || !this.currentText) return;
        this.isPausedState = false;

        if (Platform.OS === 'android') {
            const remaining = this.currentText.slice(this.lastCharIndex).trim();
            if (!remaining) {
                const done = this.currentCallbacks?.onDone;
                this.resetInternalState();
                done?.();
                return;
            }

            this.baseOffset = this.lastCharIndex;
            this.sessionId += 1;
            this.startUtterance(remaining, this.sessionId);
        } else {
            await Speech.resume();
        }
    }

    async stop(): Promise<void> {
        this.sessionId += 1;
        this.resetInternalState();
        await Speech.stop();
    }

    async isSpeaking(): Promise<boolean> {
        return Speech.isSpeakingAsync();
    }

    private startUtterance(utterance: string, session: number): void {
        Speech.speak(utterance, {
            language: this.language,
            rate: 1.0,
            pitch: 1.0,
            onStart: () => {
                if (session !== this.sessionId) return;
                this.currentCallbacks?.onStart?.();
            },
            onBoundary: (event: { charIndex?: number }) => {
                if (session !== this.sessionId) return;
                if (event && typeof event.charIndex === 'number') {
                    this.lastCharIndex = this.baseOffset + event.charIndex;
                }
            },
            onDone: () => {
                if (session !== this.sessionId || this.isPausedState) return;
                const done = this.currentCallbacks?.onDone;
                this.resetInternalState();
                done?.();
            },
            onError: error => {
                if (session !== this.sessionId) return;
                const onError = this.currentCallbacks?.onError;
                this.resetInternalState();
                onError?.(error instanceof Error ? error : new Error('Error al reproducir voz'));
            },
        });
    }

    private resetInternalState(): void {
        this.currentText = '';
        this.baseOffset = 0;
        this.lastCharIndex = 0;
        this.isPausedState = false;
        this.currentCallbacks = undefined;
    }
}
