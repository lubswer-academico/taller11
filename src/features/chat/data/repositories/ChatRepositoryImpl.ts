import { Message } from '../../domain/entities/Message';
import { ChatRepository } from '../../domain/repositories/ChatRepository';
import { IProveedorIA } from '../datasources/IProveedorIA';

export class ChatRepositoryImpl implements ChatRepository {
    constructor(private readonly proveedorIA: IProveedorIA) {}

    async sendMessage(userMessage: string, history: Message[]): Promise<string> {
        return this.proveedorIA.generateResponse(userMessage, history);
    }
}