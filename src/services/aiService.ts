
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

export const sendChatMessage = async (request: ChatRequest): Promise<ChatResponse> => {
  try {
    const { data, error } = await fetch('/api/ai-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    }).then(res => res.json());

    if (error) throw new Error(error);

    return data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

export const getChatHistory = async (conversationId: string): Promise<ChatMessage[]> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('conversation_data')
      .eq('id', conversationId)
      .single();

    if (error) throw error;

    // Safely parse the conversation data
    if (data?.conversation_data && Array.isArray(data.conversation_data)) {
      return data.conversation_data as ChatMessage[];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }
};

export const createConversation = async (userId: string): Promise<string> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId,
        conversation_data: [],
        last_message_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;

    return data.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};
