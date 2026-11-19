import { Message } from '../entities/Message'

export interface ChatRepository {
    sendMessage(useMessage: string, history: Message[]): Promise<string>
}