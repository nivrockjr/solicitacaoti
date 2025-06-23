// TODO: Implementar aiService após nova integração

import { ChatMessage } from '@/types';

export interface ChatRequest {
  message: string;
  userId: string;
  conversationId?: string;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  suggestions?: string[];
}

export interface AIResponse {
  message: string;
  conversationId?: string;
}

export const sendChatMessage = async (request: ChatRequest): Promise<ChatResponse> => {
  try {
    const response = await fetch('/api/ai-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send message');
    }

    return data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

export const sendMessageToAI = async (message: string, conversationId?: string): Promise<AIResponse> => {
  throw new Error('Função não implementada. Integração removida.');
};

export const getChatHistory = async (conversationId: string): Promise<ChatMessage[]> => {
  throw new Error('Função não implementada. Integração removida.');
};

export const createConversation = async (userId: string): Promise<string> => {
  throw new Error('Função não implementada. Integração removida.');
};
