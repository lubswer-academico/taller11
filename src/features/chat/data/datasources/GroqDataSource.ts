import { Message } from '../../domain/entities/Message';
import { IProveedorIA } from './IProveedorIA';

interface GroqChatCompletionResponse {
    choices?: Array<{
        message?: {
            content?: string | null;
        };
    }>;
    error?: {
        message?: string;
    };
}

export class GroqDataSource implements IProveedorIA {
    private readonly endpoint: string | undefined;
    private readonly apiKey: string | undefined;
    private readonly model: string;

    constructor(model = 'openai/gpt-oss-20b') {
        this.endpoint = process.env.EXPO_PUBLIC_GROQ_API_URL;
        this.apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
        this.model = model;
    }

    async generateResponse(
        userMessage: string,
        history: Message[]
    ): Promise<string> {
        if (!this.endpoint) {
            throw new Error(
                'Falta configurar EXPO_PUBLIC_GROQ_API_URL en el archivo .env'
            );
        }

        if (!this.apiKey) {
            throw new Error(
                'Falta configurar EXPO_PUBLIC_GROQ_API_KEY en el archivo .env'
            );
        }

        const messages = [
            ...history.map(msg => ({
                role: msg.role,
                content: msg.content,
            })),
            {
                role: 'user' as const,
                content: userMessage,
            },
        ];

        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages,
                reasoning_effort: 'low',
                max_completion_tokens: 2048,
            }),
        });

        const data = (await response.json()) as GroqChatCompletionResponse;

        if (!response.ok) {
            throw new Error(
                data.error?.message || `Error de Groq (${response.status})`
            );
        }

        const rawContent = data.choices?.[0]?.message?.content ?? '';
        const cleanContent = rawContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

        if (!cleanContent) {
            throw new Error('Groq devolvió una respuesta vacía');
        }

        return cleanContent;
    }
}
