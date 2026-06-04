// c:\solicitacaoti\whatsapp-worker\src\vendedores.js

const API_URL = 'https://vendedores.pqvirk.com.br/api_whatsapp.php';

export async function handleVendedoresConversationalFlow(msg, senderPhone, env) {
  const API_KEY = env.PQVIRK_API_KEY;
  // Inicializa ou recupera a sessão do usuário no KV
  let session = await env.WHATSAPP_SESSION.get(senderPhone, { type: "json" });
  if (!session) {
    session = { state: 'START', data: {} };
  }

  // Verifica se o usuário mandou texto ou clicou num botão de lista (list_reply) ou botão normal (button_reply)
  let userInput = '';
  let interactiveId = '';
  let interactiveTitle = '';
  
  if (msg.type === 'text') {
    userInput = msg.text.body;
  } else if (msg.type === 'interactive') {
    if (msg.interactive.type === 'button_reply') {
      interactiveId = msg.interactive.button_reply.id;
    } else if (msg.interactive.type === 'list_reply') {
      interactiveId = msg.interactive.list_reply.id;
      interactiveTitle = msg.interactive.list_reply.title;
    }
  }

  // Se o usuário enviar "Cancelar" ou "Sair" a qualquer momento, reseta.
  if (userInput.toLowerCase() === 'cancelar' || userInput.toLowerCase() === 'sair' || interactiveId === 'cancel_flow') {
    await env.WHATSAPP_SESSION.delete(senderPhone);
    await sendWhatsAppText(env, senderPhone, "❌ Operação cancelada. Quando quiser recomeçar, basta mandar um Oi.");
    return new Response("Canceled", { status: 200 });
  }

  // ⚡ BYPASS DE CONSISTÊNCIA EVENTUAL DO KV
  // Se o usuário clicou em um botão, o ID do botão é a fonte da verdade absoluta,
  // sobrepondo qualquer estado defasado que tenha vindo do KV.
  if (interactiveId) {
    if (interactiveId === 'menu_pedido_venda') {
      session.state = 'AWAITING_MAIN_MENU';
    } else if (interactiveId.startsWith('client_')) {
      session.state = 'AWAITING_CLIENT_SELECTION';
    } else if (interactiveId.startsWith('type_')) {
      session.state = 'AWAITING_ORDER_TYPE';
    } else if (interactiveId.startsWith('prod_')) {
      session.state = 'AWAITING_PRODUCT_SELECTION';
    } else if (interactiveId === 'add_more' || interactiveId === 'finish_order') {
      session.state = 'AWAITING_ADD_MORE';
    } else if (interactiveId === 'confirm_yes') {
      session.state = 'AWAITING_CONFIRMATION';
    }
  }

  // Máquina de Estados
  try {
    switch (session.state) {
      case 'START':
        const authRes = await fetch(`${API_URL}?action=verify_seller&phone=${senderPhone}`, {
          headers: { 'X-Api-Key': API_KEY }
        });
        const authData = await authRes.json();
        
        if (!authData.valid) {
          await sendStandardAutoReply(env, senderPhone);
          return new Response("Not a seller, sent standard auto-reply", { status: 200 });
        }

        session.data.seller_code = authData.seller_code;
        session.data.seller_name = authData.seller_name;
        session.data.filial = authData.filial;
        session.data.cart = []; // Inicializa o carrinho vazio
        session.state = 'AWAITING_MAIN_MENU';
        await env.WHATSAPP_SESSION.put(senderPhone, JSON.stringify(session), { expirationTtl: 3600 });

        await sendWhatsAppButtons(env, senderPhone, 
          `🤖 *Olá, ${authData.seller_name}!* Bem-vindo ao sistema PQVIRK.\n\nO que você deseja fazer?`, 
          [
            { id: 'menu_pedido_venda', title: 'Fazer Pedido' },
            { id: 'menu_sac', title: 'SAC' },
            { id: 'menu_atendente', title: 'Falar com Atendente' }
          ]
        );
        break;

      case 'AWAITING_MAIN_MENU':
        if (interactiveId === 'menu_pedido_venda' || userInput.toLowerCase() === 'fazer pedido') {
          const clientsRes = await fetch(`${API_URL}?action=get_clients&seller=${session.data.seller_code}&filial=${session.data.filial}`, { headers: { 'X-Api-Key': API_KEY } });
          const clientsData = await clientsRes.json();
          
          if (!clientsData.clients || clientsData.clients.length === 0) {
            await sendWhatsAppText(env, senderPhone, "Você ainda não possui clientes vinculados.");
            return new Response("No clients", { status: 200 });
          }

          const listRows = clientsData.clients.slice(0, 10).map(c => ({
            id: `client_${c.id}`,
            title: c.title,
            description: c.description
          }));

          session.state = 'AWAITING_CLIENT_SELECTION';
          await env.WHATSAPP_SESSION.put(senderPhone, JSON.stringify(session), { expirationTtl: 3600 });

          await sendWhatsAppList(env, senderPhone, 
            "📝 *Passo 1/4: Escolha o Cliente*", 
            "Selecione um cliente na lista abaixo.\n\n_(Se ele não estiver na lista, *digite o nome dele* na conversa para buscar)_", 
            "Ver Clientes", 
            listRows
          );
        } else {
          await sendWhatsAppText(env, senderPhone, "Poxa, parece que você clicou rápido demais ou enviou uma opção inválida e os cabos se cruzaram aqui! 😵‍💫\n\nPor favor, aguarde uns segundos e tente clicar novamente na opção, ou digite *Cancelar* para recomeçarmos.");
        }
        break;

      case 'AWAITING_CLIENT_SELECTION':
        if (userInput && msg.type === 'text') {
           const clientsRes = await fetch(`${API_URL}?action=get_clients&seller=${session.data.seller_code}&filial=${session.data.filial}&search=${encodeURIComponent(userInput)}`, { headers: { 'X-Api-Key': API_KEY } });
           const clientsData = await clientsRes.json();
           if (!clientsData.clients || clientsData.clients.length === 0) {
             await sendWhatsAppText(env, senderPhone, `Nenhum cliente encontrado com "${userInput}". Digite outro nome ou selecione na lista original.`);
             return new Response("No results", { status: 200 });
           }
           const listRows = clientsData.clients.slice(0, 10).map(c => ({ id: `client_${c.id}`, title: c.title, description: c.description }));
           
           await sendWhatsAppList(env, senderPhone, 
             "🔎 *Resultados da Busca*", 
             "Selecione o cliente abaixo:", 
             "Ver Clientes", 
             listRows
           );
        } else if (interactiveId.startsWith('client_')) {
          session.data.client_id = interactiveId.split('_')[1];
          session.data.client_name = interactiveTitle;

          session.state = 'AWAITING_ORDER_TYPE';
          await env.WHATSAPP_SESSION.put(senderPhone, JSON.stringify(session), { expirationTtl: 3600 });

          await sendWhatsAppButtons(env, senderPhone, 
            `✅ Cliente selecionado com sucesso.\n\n📝 *Passo 2/4: Tipo do Pedido*\nQual o tipo do pedido?`, 
            [
              { id: 'type_Venda', title: 'Venda' },
              { id: 'type_Amostra', title: 'Amostra' }
            ]
          );
        } else {
          await sendWhatsAppText(env, senderPhone, "Poxa, parece que os cabos se cruzaram! 😵‍💫 Isso acontece se você clicar rápido demais.\n\nPor favor, tente selecionar o cliente novamente, ou digite *Cancelar* para recomeçar.");
        }
        break;

      case 'AWAITING_ORDER_TYPE':
        if (interactiveId.startsWith('type_')) {
          session.data.order_type = interactiveId.split('_')[1];

          const prodRes = await fetch(`${API_URL}?action=get_products&seller=${session.data.seller_code}&filial=${session.data.filial}`, { headers: { 'X-Api-Key': API_KEY } });
          const prodData = await prodRes.json();
          
          const listRows = prodData.products.slice(0, 10).map(p => ({ id: `prod_${p.id}`, title: p.title, description: p.description }));

          session.state = 'AWAITING_PRODUCT_SELECTION';
          await env.WHATSAPP_SESSION.put(senderPhone, JSON.stringify(session), { expirationTtl: 3600 });

          await sendWhatsAppList(env, senderPhone, 
            "📦 *Passo 3/4: Escolha o Produto*", 
            "Selecione o produto abaixo.\n\n_(Se não estiver na lista, *digite o nome ou código* na conversa para buscar)_", 
            "Ver Produtos", 
            listRows
          );
        } else {
          await sendWhatsAppText(env, senderPhone, "Poxa, clique muito rápido! 😵‍💫\n\nPor favor, selecione uma das opções acima (Venda ou Amostra) novamente, ou digite *Cancelar* para recomeçar.");
        }
        break;

      case 'AWAITING_PRODUCT_SELECTION':
        if (userInput && msg.type === 'text') {
           const prodRes = await fetch(`${API_URL}?action=get_products&seller=${session.data.seller_code}&filial=${session.data.filial}&search=${encodeURIComponent(userInput)}`, { headers: { 'X-Api-Key': API_KEY } });
           const prodData = await prodRes.json();
           if (!prodData.products || prodData.products.length === 0) {
             await sendWhatsAppText(env, senderPhone, `Nenhum produto encontrado com "${userInput}". Digite outro nome ou selecione na lista.`);
             return new Response("No results", { status: 200 });
           }
           const listRows = prodData.products.slice(0, 10).map(p => ({ id: `prod_${p.id}`, title: p.title, description: p.description }));
           await sendWhatsAppList(env, senderPhone, 
             "🔎 *Resultados da Busca*", 
             "Selecione o produto abaixo:", 
             "Ver Produtos", 
             listRows
           );
        } else if (interactiveId.startsWith('prod_')) {
          session.data.temp_product_id = interactiveId.split('_')[1];
          session.data.temp_product_name = interactiveTitle;
          
          session.state = 'AWAITING_QUANTITY';
          await env.WHATSAPP_SESSION.put(senderPhone, JSON.stringify(session), { expirationTtl: 3600 });

          await sendWhatsAppText(env, senderPhone, "🔢 *Passo 4/4: Quantidade*\n\nDigite a quantidade desejada para este produto (apenas números):");
        } else {
          await sendWhatsAppText(env, senderPhone, "Poxa, os cabos se cruzaram! 😵‍💫 (Clique muito rápido).\n\nPor favor, selecione um produto na lista novamente ou digite *Cancelar*.");
        }
        break;

      case 'AWAITING_QUANTITY':
        const qty = parseInt(userInput);
        if (isNaN(qty) || qty <= 0) {
          await sendWhatsAppText(env, senderPhone, "⚠️ Valor inválido. Por favor, digite apenas números maiores que zero.");
        } else {
          if (!session.data.cart) session.data.cart = [];
          session.data.cart.push({
            product_id: session.data.temp_product_id,
            product_name: session.data.temp_product_name,
            quantity: qty
          });

          session.state = 'AWAITING_ADD_MORE';
          await env.WHATSAPP_SESSION.put(senderPhone, JSON.stringify(session), { expirationTtl: 3600 });

          await sendWhatsAppButtons(env, senderPhone, 
            `🛒 Produto adicionado!\nVocê tem *${session.data.cart.length} item(ns)* no carrinho.\n\nO que deseja fazer agora?`, 
            [
              { id: 'add_more', title: 'Adicionar Mais' },
              { id: 'finish_order', title: 'Finalizar Pedido ✅' }
            ]
          );
        }
        break;

      case 'AWAITING_ADD_MORE':
        if (interactiveId === 'add_more') {
          const prodRes = await fetch(`${API_URL}?action=get_products&seller=${session.data.seller_code}&filial=${session.data.filial}`, { headers: { 'X-Api-Key': API_KEY } });
          const prodData = await prodRes.json();
          const listRows = prodData.products.slice(0, 10).map(p => ({ id: `prod_${p.id}`, title: p.title, description: p.description }));

          session.state = 'AWAITING_PRODUCT_SELECTION';
          await env.WHATSAPP_SESSION.put(senderPhone, JSON.stringify(session), { expirationTtl: 3600 });

          await sendWhatsAppList(env, senderPhone, 
            "📦 *Adicionar mais um produto*", 
            "Selecione o produto abaixo ou *digite o nome/código* para buscar.", 
            "Ver Produtos", 
            listRows
          );
        } else if (interactiveId === 'finish_order') {
          session.state = 'AWAITING_CONFIRMATION';
          await env.WHATSAPP_SESSION.put(senderPhone, JSON.stringify(session), { expirationTtl: 3600 });

          let resumoCart = '';
          session.data.cart.forEach((item, index) => {
             resumoCart += `${index+1}. ${item.product_name} (Cód: ${item.product_id}) - Qtd: ${item.quantity}\n`;
          });

          const resumo = `📋 *RESUMO FINAL DO PEDIDO*\n\n` +
                         `*Cliente:* ${session.data.client_name}\n` +
                         `*Tipo:* ${session.data.order_type}\n\n` +
                         `*Itens no Carrinho:*\n${resumoCart}\n` +
                         `Tudo certo para enviar?`;

          await sendWhatsAppButtons(env, senderPhone, resumo, [
            { id: 'confirm_yes', title: 'Enviar Pedido ✅' },
            { id: 'cancel_flow', title: 'Cancelar ❌' }
          ]);
        } else {
          await sendWhatsAppText(env, senderPhone, "Poxa, os cabos se cruzaram! 😵‍💫\n\nPor favor, escolha uma opção nos botões acima novamente, ou digite *Cancelar*.");
        }
        break;

      case 'AWAITING_CONFIRMATION':
        if (interactiveId === 'confirm_yes') {
          const submitRes = await fetch(`${API_URL}?action=submit_order`, {
            method: 'POST',
            headers: { 
              'X-Api-Key': API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              seller_id: session.data.seller_code,
              client_id: session.data.client_id,
              type: session.data.order_type,
              filial: session.data.filial,
              cart: session.data.cart
            })
          });

          const submitData = await submitRes.json();

          if (submitData.success) {
            await sendWhatsAppText(env, senderPhone, `🎉 *Pedido gravado com sucesso!*\n\nNúmero do Pedido: #${submitData.order_id}\nObrigado!`);
          } else {
            await sendWhatsAppText(env, senderPhone, `❌ *Erro ao gravar pedido:* ${submitData.error}`);
          }

          await env.WHATSAPP_SESSION.delete(senderPhone);
        } else {
          await sendWhatsAppText(env, senderPhone, "Poxa, os cabos se cruzaram! 😵‍💫\n\nPor favor, confirme ou cancele o pedido usando os botões acima.");
        }
        break;

      default:
        await env.WHATSAPP_SESSION.delete(senderPhone);
        await sendWhatsAppText(env, senderPhone, "Sessão reiniciada. Mande um Oi para começar.");
        break;
    }
  } catch (err) {
    console.error("Erro no fluxo do vendedor:", err);
    await sendWhatsAppText(env, senderPhone, "Desculpe, ocorreu um erro interno de conexão com o sistema. Tente novamente mais tarde.");
    await env.WHATSAPP_SESSION.delete(senderPhone);
  }

  return new Response("Flow Processed", { status: 200 });
}

// Funções auxiliares de envio para WhatsApp
async function sendWhatsAppText(env, to, text) {
  const url = `https://graph.facebook.com/v25.0/${env.WHATSAPP_PHONE_ID}/messages`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "text",
      text: { body: text }
    })
  });
}

async function sendWhatsAppButtons(env, to, text, buttons) {
  const url = `https://graph.facebook.com/v25.0/${env.WHATSAPP_PHONE_ID}/messages`;
  const actionButtons = buttons.map(b => ({ type: "reply", reply: { id: b.id, title: b.title } }));
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: text },
        action: { buttons: actionButtons }
      }
    })
  });
}

async function sendWhatsAppList(env, to, headerText, bodyText, buttonText, items) {
    const url = `https://graph.facebook.com/v25.0/${env.WHATSAPP_PHONE_ID}/messages`;
    // Sanitiza strings para o WhatsApp:
    // header.text não suporta markdown. Limite 60 chars.
    const safeHeader = headerText.replace(/[*_~`]/g, '').substring(0, 60);
    // title limite 24 chars
    const listRows = items.map(i => ({ id: i.id.substring(0, 200), title: i.title.substring(0, 24), description: i.description ? i.description.substring(0, 72) : undefined }));
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "interactive",
        interactive: {
          type: "list",
          header: { type: "text", text: safeHeader },
          body: { text: bodyText },
          action: {
            button: buttonText.substring(0, 20),
            sections: [{ title: "Opções", rows: listRows }]
          }
        }
      })
    });
    
    if (!res.ok) {
       const text = await res.text();
       console.log("META API ERROR ON LIST:", text);
    }
  }

async function sendStandardAutoReply(env, to) {
  const url = `https://graph.facebook.com/v25.0/${env.WHATSAPP_PHONE_ID}/messages`;
  const autoReply = "🤖 *Assistente Virtual PQVIRK*\n\nOlá! \nEste WhatsApp envia apenas notificações automáticas.\nPara garantir um atendimento rápido e humano, por favor, utilize os contatos abaixo:";
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "text",
      text: { body: autoReply }
    })
  });
  
  // Cartão de Contato vCard omitido aqui por brevidade, mas você pode usar o envio original se quiser
}
