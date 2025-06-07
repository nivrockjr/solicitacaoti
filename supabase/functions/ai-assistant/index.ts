
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, conversationId } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Verificar autenticação
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // Buscar dados contextuais para o assistente
    const [requestsData, knowledgeData, profileData] = await Promise.all([
      supabaseClient.from('it_requests').select('*').eq('user_id', user.id),
      supabaseClient.from('ai_knowledge_base').select('*'),
      supabaseClient.from('profiles').select('*').eq('id', user.id).single()
    ]);

    // Preparar contexto para o ChatGPT
    const userRequests = requestsData.data || [];
    const knowledgeBase = knowledgeData.data || [];
    const userProfile = profileData.data;

    const systemPrompt = `Você é um assistente de TI especializado em ajudar funcionários com questões técnicas.

INFORMAÇÕES DO USUÁRIO:
- Nome: ${userProfile?.name || 'Usuário'}
- Departamento: ${userProfile?.department || 'Não informado'}
- Total de solicitações: ${userRequests.length}

HISTÓRICO DE SOLICITAÇÕES DO USUÁRIO:
${userRequests.slice(0, 10).map(req => 
  `- [${req.status}] ${req.title}: ${req.description} (${new Date(req.created_at).toLocaleDateString()})`
).join('\n')}

BASE DE CONHECIMENTO DISPONÍVEL:
${knowledgeBase.map(kb => 
  `- ${kb.category}: ${kb.problem_description} → ${kb.solution}`
).join('\n')}

INSTRUÇÕES:
1. Responda sempre em português brasileiro
2. Seja prestativo e técnico, mas use linguagem acessível
3. Quando possível, referencie soluções da base de conhecimento
4. Sugira criar uma nova solicitação se o problema não puder ser resolvido imediatamente
5. Mantenha um tom profissional e amigável
6. Se o usuário perguntar sobre suas solicitações anteriores, use o histórico fornecido
7. Forneça soluções passo-a-passo quando apropriado`;

    // Recuperar conversa existente se fornecida
    let conversation: ChatMessage[] = [{ role: 'system', content: systemPrompt }];
    
    if (conversationId) {
      const { data: existingConv } = await supabaseClient
        .from('ai_conversations')
        .select('conversation_data')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();
      
      if (existingConv) {
        conversation = [...conversation, ...(existingConv.conversation_data as ChatMessage[] || [])];
      }
    }

    // Adicionar nova mensagem do usuário
    conversation.push({ role: 'user', content: message });

    // Chamar OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: conversation.slice(-20), // Manter apenas as últimas 20 mensagens para economizar tokens
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error('Erro na API do OpenAI');
    }

    const openAIData = await openAIResponse.json();
    const assistantMessage = openAIData.choices[0].message.content;

    // Adicionar resposta do assistente à conversa
    conversation.push({ role: 'assistant', content: assistantMessage });

    // Salvar ou atualizar conversa
    let savedConversationId = conversationId;
    
    if (conversationId) {
      await supabaseClient
        .from('ai_conversations')
        .update({
          conversation_data: conversation.slice(1), // Remove system prompt para economizar espaço
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .eq('user_id', user.id);
    } else {
      const { data: newConv } = await supabaseClient
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          conversation_data: conversation.slice(1),
          last_message_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      savedConversationId = newConv?.id;
    }

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        conversationId: savedConversationId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
