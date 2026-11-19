import { useCallback, useState } from 'react';
import { GroqDataSource } from '../../data/datasources/GroqDataSource';
import { ChatRepositoryImpl } from '../../data/repositories/ChatRepositoryImpl';
import { Message } from '../../domain/entities/Message';
import { SendMessageUseCase } from '../../domain/usecases/SendMessageUseCase';

// Inyección de dependencias: para cambiar de proveedor (ej. GeminiDataSource) solo cambia esta instancia
const proveedorIA = new GroqDataSource();
const sendMessageUseCase = new SendMessageUseCase(new ChatRepositoryImpl(proveedorIA));

export const useChat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendMessage = useCallback(async (userInput: string): Promise<Message | null> => {
        setIsLoading(true);
        setError(null);
        try {
            const { userMessage, assistantMessage } =
                await sendMessageUseCase.execute(userInput, messages);
            setMessages(prev => [...prev, userMessage, assistantMessage]);
            return assistantMessage;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [messages]);

    const clearChat = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    return { messages, isLoading, error, sendMessage, clearChat };
};
