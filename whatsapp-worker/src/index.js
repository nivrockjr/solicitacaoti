export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Rota 1: Supabase -> Cloudflare -> WhatsApp (Enviar mensagem)
    if (url.pathname === '/supabase-webhook' && request.method === 'POST') {
      return await handleSupabaseWebhook(request, env);
    }

    // Rota 2: Validação inicial exigida pela Meta (GET)
    if (url.pathname === '/meta-webhook' && request.method === 'GET') {
      return handleMetaVerification(request, env);
    }

    // Rota 3: WhatsApp -> Cloudflare -> Supabase (Receber cliques em botões)
    if (url.pathname === '/meta-webhook' && request.method === 'POST') {
      return await handleMetaMessage(request, env);
    }

    return new Response(JSON.stringify({ error: "Not found" }), { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// -----------------------------------------------------------------------------
// Handlers
// -----------------------------------------------------------------------------

async function handleSupabaseWebhook(request, env) {
  try {
    const body = await request.json();
    console.log("Recebido do Supabase:", JSON.stringify(body));
    
    const { type, record, old_record } = body;

    // Verifica se houve mudança de status ou de comentários
    let statusMudou = false;
    let novoComentario = false;

    if (type === 'UPDATE') {
      statusMudou = record.status !== old_record.status;
      const numComentariosAntes = old_record.comments ? old_record.comments.length : 0;
      const numComentariosDepois = record.comments ? record.comments.length : 0;
      novoComentario = numComentariosDepois > numComentariosAntes;
      
      if (!statusMudou && !novoComentario) {
        return new Response(JSON.stringify({ success: true, reason: 'Nenhuma alteração relevante' }), { status: 200 });
      }
    }

    // Buscar telefone do usuário no Supabase
    const requesterId = record.requesterid;
    if (!requesterId) return new Response(JSON.stringify({ error: 'No requester ID' }), { status: 400 });

    const userRes = await fetch(`${env.SUPABASE_URL}/rest/v1/usuarios?id=eq.${requesterId}&select=whatsapp,name`, {
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    const users = await userRes.json();
    if (!Array.isArray(users) || users.length === 0 || !users[0].whatsapp) {
      console.log("Usuário não encontrado, sem whatsapp, ou erro de permissão:", JSON.stringify(users));
      return new Response(JSON.stringify({ success: true, reason: 'No WhatsApp number or RLS blocked', details: users }), { status: 200 });
    }

    const whatsappNumber = users[0].whatsapp.replace(/\D/g, ''); // Apenas números
    const userName = users[0].name || 'Usuário';

    const statusMap = {
      'new': 'Nova 📝',
      'assigned': 'Atribuída 👤',
      'in_progress': 'Em Andamento ⏳',
      'resolved': 'Concluída ✅',
      'closed': 'Fechada 🔒',
      'reopened': 'Reaberta 🔄',
      'cancelled': 'Cancelada 🚫',
      'rejected': 'Rejeitada ❌'
    };
    
    const typeMap = {
      'general': 'Geral',
      'systems': 'Sistemas',
      'equipment': 'Equipamentos',
      'access': 'Acesso',
      'ajuste_estoque': 'Ajuste de Estoque 📦'
    };

    const priorityMap = {
      'low': '🟢 Baixa',
      'medium': '🟡 Média',
      'high': '🔴 Alta',
      'urgent': '🚨 Urgente'
    };

    const statusTraduzido = statusMap[record.status] || record.status;
    const tipoTraduzido = typeMap[record.type] || record.type;
    const prioridadeTraduzida = priorityMap[record.priority] || record.priority;
    const nomeChamado = record.title;
    
    // Formatar os detalhes dependendo do tipo do chamado
    let detalhes = '';
    
    if (record.description) {
      if (record.type === 'ajuste_estoque') {
        // Layout limpo e direto para Ajuste de Estoque
        detalhes = record.description
          .replace(/Data: (.*)/, `Data: $1\nPrioridade: ${prioridadeTraduzida}`)
          .replace('Detalhes do Ajuste', '📝 *Detalhes do Ajuste*')
          .replace(/Lotes:/g, '*Lotes:*')
          .replace(/Lote (\d+):/g, '- Lote $1:');
        
        // Remove espaços em branco no começo de cada linha (que vêm do código frontend)
        detalhes = detalhes.replace(/^[ \t]+/gm, '').trim();
      } else if (record.type === 'employee_lifecycle') {
        // Layout espaçado para Ciclo de Vida do Colaborador
        detalhes = record.description
          .replace('Ação:', '*Ação:*')
          .replace('\nColaborador:', '\n\n*Colaborador:*')
          .replace('\nSetor:', '\n\n*Setor:*')
          .replace('\nPrazo:', '\n\n*Prazo:*')
          .replace('Recursos/Acessos:', '🔑 *Acessos e Recursos Solicitados:*')
          .replace('Observações:', '*Observações Adicionais:*')
          .replace('Tipo de Treinamento:', '*Tipo de Treinamento:*')
          .replace('Conteúdo do Treinamento:', '*Conteúdo do Treinamento:*');
        detalhes = detalhes.replace(/^[ \t]+/gm, '').trim();
      } else {
        // Outros chamados: removemos os espaços à esquerda e usamos a descrição completa
        detalhes = record.description.replace(/^[ \t]+/gm, '').trim();
      }
    } else {
      detalhes = '_Sem descrição._';
    }

    // Montar a mensagem super bonitinha com markdown
    let textoMensagem = '';
    let saudacao = `👋 Olá, *${userName}*!`;
    
    if (type === 'INSERT') {
      if (record.type === 'ajuste_estoque') {
        textoMensagem = `${saudacao}\nSua solicitação de 📦 *Ajuste de Estoque* com a ID #${record.id} acabou de nascer e já está na nossa fila!\n\n${detalhes}\n\n📌 *Status:* ${statusTraduzido}`;
      } else if (record.type === 'employee_lifecycle') {
        textoMensagem = `${saudacao}\nUma nova solicitação de 🔄 *Ciclo de Vida do Colaborador* com a ID #${record.id} foi iniciada!\n\n📝 *Detalhes do Processo*\n\n${detalhes}\n\n📌 *Status:* ${statusTraduzido}`;
      } else {
        // Demais tipos (general, systems, equipment_request, access, preventive_maintenance)
        let iconeStr = '';
        if (record.type === 'systems') iconeStr = '💻 *Sistemas*';
        else if (record.type === 'equipment_request') iconeStr = '⌨️ *Equipamentos*';
        else if (record.type === 'access') iconeStr = '🔐 *Liberação de Acesso*';
        else if (record.type === 'preventive_maintenance') iconeStr = '🛠️ *Manutenção Preventiva*';
        else iconeStr = '🗂️ *Geral*';

        let intro = '';
        if (record.type === 'systems') intro = `Sua solicitação de ${iconeStr} com a ID #${record.id} já está com a nossa equipe!`;
        else if (record.type === 'preventive_maintenance') intro = `Uma rotina de ${iconeStr} (ID #${record.id}) foi agendada!`;
        else if (record.type === 'equipment_request') intro = `Seu pedido de ${iconeStr} com a ID #${record.id} entrou na nossa fila!`;
        else if (record.type === 'access') intro = `Sua requisição de ${iconeStr} com a ID #${record.id} foi registrada com sucesso!`;
        else intro = `Sua solicitação ${iconeStr} com a ID #${record.id} foi aberta e logo será analisada!`;

        let blocoResumo = `📋 *Resumo da Solicitação*\n\n*Título:* ${nomeChamado}\n\n*Prioridade:* ${prioridadeTraduzida}`;
        
        let headerDetalhe = '📝 *Detalhes:*';
        if (record.type === 'systems') headerDetalhe = '📝 *Descrição do Problema/Pedido:*';
        else if (record.type === 'equipment_request') headerDetalhe = '📝 *Motivo / Descrição:*';
        else if (record.type === 'preventive_maintenance') headerDetalhe = '📝 *Escopo / Detalhes:*';

        textoMensagem = `${saudacao}\n${intro}\n\n${blocoResumo}\n\n${headerDetalhe}\n\n_${detalhes}_\n\n📌 *Status:* ${statusTraduzido}`;
      }
    } else if (type === 'UPDATE') {
      if (statusMudou) {
        textoMensagem = `🔔 Olá, *${userName}*!\n\nO chamado *#${record.id}* (_${nomeChamado}_) teve o status atualizado!\n\n📌 *Novo Status:* ${statusTraduzido}`;
      } else if (novoComentario) {
        const newComments = record.comments;
        const lastComment = newComments[newComments.length - 1];
        
        // Se o comentário foi feito pelo próprio robô, não envia de volta para o WhatsApp
        if (lastComment.userId === 'system') {
          console.log("Comentário do sistema detectado. Ignorando notificação.");
          return new Response("Ignorado", { status: 200 });
        }

        textoMensagem = `💬 Olá, *${userName}*!\n\nAlguém deixou um comentário no chamado *#${record.id}* (_${nomeChamado}_):\n\n_"${lastComment.text}"_\n👤 Por: *${lastComment.userName}*`;
      }
    }

    if (!textoMensagem) {
      console.log("Nenhuma mensagem formatada para enviar. (Pode ser um DELETE ou evento ignorado)");
      return new Response(JSON.stringify({ success: true, reason: 'No message to send' }), { status: 200 });
    }

    // Enviar para WhatsApp Cloud API
    const waUrl = `https://graph.facebook.com/v25.0/${env.WHATSAPP_PHONE_ID}/messages`;
    
    // NOTA: Como estamos usando Template/Sandbox, o WhatsApp exige que usemos templates aprovados para a primeira mensagem.
    // Mas se a janela de 24h já estiver aberta (usuário mandou msg primeiro), podemos mandar texto livre.
    // O template 'hello_world' funciona de graça para testes de sandbox.
    // Para simplificar, vou tentar mandar texto livre. Se falhar no sandbox, precisamos enviar um template.
    let waPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: whatsappNumber,
      type: "text",
      text: { body: textoMensagem }
    };

    // [PASSO 1] Lógica dos Botões Mágicos:
    // Se for uma atualização de status e o novo status for "resolved",
    // substituímos o texto livre por uma mensagem interativa com botões.
    if (type === 'UPDATE' && statusMudou && record.status === 'resolved') {
      waPayload.type = "interactive";
      delete waPayload.text; // Removemos o bloco de texto simples
      waPayload.interactive = {
        type: "button",
        body: {
          text: `🔔 Olá, *${userName}*!\n\nO chamado *#${record.id}* (_${nomeChamado}_) teve o status atualizado para *Concluída ✅*!\n\nPor favor, valide o atendimento clicando abaixo:`
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: `verify_${record.id}`,
                title: "Verificado! ✅"
              }
            },
            {
              type: "reply",
              reply: {
                id: `reject_${record.id}`,
                title: "Não Resolvido ❌"
              }
            }
          ]
        }
      };
    }

    const waRes = await fetch(waUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(waPayload)
    });

    const waResponse = await waRes.json();
    console.log("Resposta do WhatsApp:", JSON.stringify(waResponse));

    return new Response(JSON.stringify({ success: true, whatsapp: waResponse }), { status: 200 });
  } catch (error) {
    console.error("Erro no supabase webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

function handleMetaVerification(request, env) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const VERIFY_TOKEN = env.WHATSAPP_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK VERIFICADO COM SUCESSO!");
      return new Response(challenge, { status: 200 });
    } else {
      return new Response("Forbidden", { status: 403 });
    }
  }
  return new Response("Bad Request", { status: 400 });
}

async function handleMetaMessage(request, env) {
  try {
    const body = await request.json();
    console.log("Mensagem recebida da Meta:", JSON.stringify(body));
    
    // O WhatsApp manda os eventos organizados em 'entry' e 'changes'
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const value = change.value;
          
          if (value.messages && value.messages.length > 0) {
            const msg = value.messages[0];
            const senderPhone = msg.from; // Número de quem clicou
            
            // [PASSO 2] Se a mensagem for um clique em um Botão Interativo
            if (msg.type === 'interactive' && msg.interactive.type === 'button_reply') {
              const buttonId = msg.interactive.button_reply.id;
              
              // Verifica se é um dos nossos botões de validação
              if (buttonId.startsWith('verify_') || buttonId.startsWith('reject_')) {
                const action = buttonId.split('_')[0]; // 'verify' ou 'reject'
                const ticketId = buttonId.split('_')[1]; // ID do chamado (ex: 21052600007)
                
                // 1. Buscar o chamado atual no Supabase para pegar os comentários existentes e o nome do solicitante
                const ticketRes = await fetch(`${env.SUPABASE_URL}/rest/v1/solicitacoes?id=eq.${ticketId}&select=comments,status,requestername`, {
                  headers: {
                    'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
                  }
                });
                
                const tickets = await ticketRes.json();
                if (!tickets || tickets.length === 0) continue; // Chamado não encontrado
                
                const ticket = tickets[0];
                let currentComments = ticket.comments || [];
                
                // 2. Montar o novo comentário automático usando o nome do solicitante
                const newComment = {
                  id: crypto.randomUUID(),
                  text: action === 'verify' 
                        ? "✅ Resolução validada pelo usuário via WhatsApp." 
                        : "❌ Resolução recusada pelo usuário via WhatsApp. O chamado foi reaberto.",
                  userId: "system",
                  userName: ticket.requestername || "Usuário",
                  createdAt: new Date().toISOString()
                };
                
                currentComments.push(newComment);
                
                const updatePayload = {
                  comments: currentComments
                };
                
                // Se foi recusado, mudar o status de volta para 'reopened'
                if (action === 'reject') {
                  updatePayload.status = 'reopened';
                }
                
                // 3. Salvar as alterações no Supabase via API
                await fetch(`${env.SUPABASE_URL}/rest/v1/solicitacoes?id=eq.${ticketId}`, {
                  method: 'PATCH',
                  headers: {
                    'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(updatePayload)
                });
                
                // 4. Responder ao usuário no WhatsApp avisando que deu certo
                const waUrl = `https://graph.facebook.com/v25.0/${env.WHATSAPP_PHONE_ID}/messages`;
                const replyText = action === 'verify' 
                  ? `Obrigado! A resolução do chamado #${ticketId} foi validada e registrada com sucesso no sistema. ✅`
                  : `Entendido! O chamado #${ticketId} foi *reaberto*. Por favor, responda esta mensagem digitando o que faltou ou deu errado para registrarmos no sistema:`;
                  
                await fetch(waUrl, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${env.WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: senderPhone,
                    type: "text",
                    text: { body: replyText }
                  })
                });
              }
            } else if (['text', 'audio', 'image', 'video', 'sticker', 'document'].includes(msg.type)) {
              // 5. Responder com mensagem automática e Cartões de Contato
              const waUrl = `https://graph.facebook.com/v25.0/${env.WHATSAPP_PHONE_ID}/messages`;
              
              // Disparo 1: Texto Curto
              const autoReply = "🤖 *Assistente Virtual PQVIRK*\n\nOlá! \nEste WhatsApp envia apenas notificações automáticas.\nPara garantir um atendimento rápido e humano, por favor, clique no setor desejado abaixo e inicie sua conversa: 👇";
              
              await fetch(waUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${env.WHATSAPP_TOKEN}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  messaging_product: "whatsapp",
                  recipient_type: "individual",
                  to: senderPhone,
                  type: "text",
                  text: { body: autoReply }
                })
              });

              // Disparo 2: Cartões de Contato Nativos (vCard)
              await fetch(waUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${env.WHATSAPP_TOKEN}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  messaging_product: "whatsapp",
                  recipient_type: "individual",
                  to: senderPhone,
                  type: "contacts",
                  contacts: [
                    {
                      name: { formatted_name: "Comercial", first_name: "Comercial" },
                      phones: [
                        { phone: "+55 85 99430-2216", type: "CELL", wa_id: "558594302216" },
                        { phone: "+55 85 3033-2160", type: "WORK", wa_id: "558530332160" }
                      ]
                    },
                    {
                      name: { formatted_name: "Compras", first_name: "Compras" },
                      phones: [
                        { phone: "+55 85 99980-0578", type: "CELL", wa_id: "558599800578" },
                        { phone: "+55 85 3033-2162", type: "WORK", wa_id: "558530332162" }
                      ]
                    },
                    {
                      name: { formatted_name: "Financeiro", first_name: "Financeiro" },
                      phones: [
                        { phone: "+55 85 99636-7348", type: "CELL", wa_id: "558596367348" },
                        { phone: "+55 85 99980-0586", type: "WORK", wa_id: "558599800586" }
                      ]
                    }
                  ]
                })
              });
            }
          }
        }
      }
    }
    
    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (error) {
    console.error("Erro no meta webhook:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
