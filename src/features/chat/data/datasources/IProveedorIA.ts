import { Message } from '../../domain/entities/Message';

export interface IProveedorIA {
    generateResponse(userMessage: string, history: Message[]): Promise<string>;
}
