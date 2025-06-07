
import { supabase } from '@/lib/supabase';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIResponse {
  message: string;
  conversationId?: string;
}

export const sendMessageToAI = async (
  message: string, 
  conversationId?: string
): Promise<AIResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('ai-assistant', {
      body: {
        message,
        conversationId
      }
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error calling AI assistant:', error);
    throw new Error('Erro ao comunicar com o assistente. Tente novamente.');
  }
};

export const getUserConversations = async () => {
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('id, last_message_at, conversation_data')
      .order('last_message_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return data?.map(conv => ({
      id: conv.id,
      lastMessage: conv.last_message_at,
      preview: getConversationPreview(conv.conversation_data as ChatMessage[])
    })) || [];
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
};

function getConversationPreview(messages: ChatMessage[]): string {
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  return lastUserMessage?.content.slice(0, 50) + '...' || 'Nova conversa';
}
