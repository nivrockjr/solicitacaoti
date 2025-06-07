
import { getRequests } from './requestService';
import { ITRequest, RequestType, RequestStatus, RequestPriority } from '../types';

interface KnowledgeBase {
  categories: {
    [key: string]: {
      keywords: string[];
      responses: string[];
    };
  };
}

// Base de conhecimento expandida e corrigida para problemas de TI
const knowledgeBase: KnowledgeBase = {
  categories: {
    hardware_pc: {
      keywords: ['pc', 'computador', 'não liga', 'nao liga', 'ligando', 'cpu', 'gabinete', 'fonte', 'energia', 'botão power', 'power', 'ligar'],
      responses: [
        '🖥️ **PROBLEMA: PC não liga**\n\n**Diagnóstico passo a passo:**\n\n1️⃣ **Verificações básicas:**\n   • Cabo de energia conectado firmemente\n   • Tomada funcionando (teste com outro aparelho)\n   • Botão da fonte ligado (chave I/O atrás do gabinete)\n   • Cabo de energia da fonte OK\n\n2️⃣ **Teste sem periféricos:**\n   • Desconecte mouse, teclado, impressora\n   • Mantenha apenas monitor conectado\n\n3️⃣ **Sinais de vida:**\n   • LEDs acendem? Ventoinhas giram?\n   • Sons de bip na inicialização?\n\n4️⃣ **Problemas mais comuns:**\n   • Fonte queimada (40% dos casos)\n   • Memória RAM mal encaixada\n   • Cabo SATA/IDE solto\n\n⚠️ Se nada funcionar, **NÃO abra o gabinete** sem conhecimento técnico. Crie uma solicitação para nosso suporte!'
      ]
    },
    hardware_perifericos: {
      keywords: ['teclado', 'mouse', 'monitor', 'tela', 'não funciona', 'nao funciona', 'sem imagem', 'tela preta', 'sem sinal', 'impressora'],
      responses: [
        '⌨️🖱️ **PROBLEMAS COM PERIFÉRICOS**\n\n**TECLADO/MOUSE:**\n• Verifique conexão USB\n• Teste em outra porta USB\n• Reinicie o computador\n• Verifique pilhas (se wireless)\n\n**MONITOR:**\n• Cabo de vídeo bem conectado\n• Monitor ligado e com energia\n• Teste outro cabo VGA/HDMI/DVI\n• Verifique entrada correta (HDMI1, VGA, etc)\n• Ajuste brilho/contraste\n\n**IMPRESSORA:**\n• Cabo USB conectado\n• Impressora ligada\n• Driver instalado\n• Papel carregado\n\n💡 **Dica:** Sempre teste com outro cabo antes de concluir que o hardware está defeituoso!'
      ]
    },
    rede_internet: {
      keywords: ['internet', 'conexão', 'conexao', 'wifi', 'wi-fi', 'rede', 'desconectado', 'lento', 'navegador', 'sem internet', 'não conecta', 'nao conecta'],
      responses: [
        '🌐 **PROBLEMAS DE INTERNET/REDE**\n\n**DIAGNÓSTICO RÁPIDO:**\n\n1️⃣ **Conexão cabeada:**\n   • Cabo de rede bem conectado\n   • LED da placa de rede piscando\n   • Teste outro cabo de rede\n\n2️⃣ **Wi-Fi:**\n   • Ícone de Wi-Fi visível?\n   • Senha correta da rede\n   • Proximidade do roteador\n   • Reiniciar adaptador Wi-Fi\n\n3️⃣ **Testes de conectividade:**\n   • Ping google.com no cmd\n   • Teste em outro dispositivo\n   • Navegador alternativo\n\n4️⃣ **Soluções rápidas:**\n   • Reiniciar roteador (30 segundos desligado)\n   • Windows: "Solucionar problemas de rede"\n   • Liberar/renovar IP: ipconfig /release e /renew\n   • DNS alternativo: 8.8.8.8 ou 1.1.1.1\n\n🔧 **Comando útil:** `ipconfig /all` para ver configurações de rede'
      ]
    },
    email_comunicacao: {
      keywords: ['email', 'e-mail', 'outlook', 'gmail', 'correio', 'anexo', 'spam', 'não recebe', 'nao recebe', 'não envia', 'nao envia', 'configuração', 'configuracao'],
      responses: [
        '📧 **PROBLEMAS DE EMAIL**\n\n**CONFIGURAÇÃO DE EMAIL:**\n\n**Outlook/Thunderbird:**\n• Servidor IMAP/POP3 correto\n• Porta e criptografia adequadas\n• Senha de aplicativo (se 2FA ativo)\n\n**Problemas comuns:**\n\n1️⃣ **Não recebe emails:**\n   • Verificar caixa de spam/lixo\n   • Confirmar espaço disponível\n   • Testar webmail (navegador)\n\n2️⃣ **Não envia emails:**\n   • Servidor SMTP configurado\n   • Autenticação habilitada\n   • Antivírus bloqueando\n\n3️⃣ **Anexos:**\n   • Limite de tamanho (25MB)\n   • Formato não bloqueado\n   • Compactar se necessário\n\n**Configurações típicas Gmail:**\n• IMAP: imap.gmail.com (993)\n• SMTP: smtp.gmail.com (587)\n• Requer senha de aplicativo'
      ]
    },
    software_aplicativos: {
      keywords: ['programa', 'software', 'aplicativo', 'aplicação', 'aplicacao', 'instalar', 'atualizar', 'erro', 'não abre', 'nao abre', 'lento', 'trava', 'travando'],
      responses: [
        '💻 **PROBLEMAS DE SOFTWARE**\n\n**DIAGNÓSTICO POR SINTOMA:**\n\n1️⃣ **Programa não abre:**\n   • Executar como administrador\n   • Compatibilidade (Windows 7/8/10)\n   • Antivírus bloqueando\n   • Arquivos corrompidos\n\n2️⃣ **Programa lento/trava:**\n   • Fechar programas desnecessários\n   • Verificar uso de RAM/CPU\n   • Limpar arquivos temporários\n   • Desfragmentar HD (se não SSD)\n\n3️⃣ **Erros de instalação:**\n   • Executar como administrador\n   • Desativar antivírus temporariamente\n   • Limpar registry (ccleaner)\n   • Requisitos do sistema atendidos\n\n4️⃣ **Atualizações:**\n   • Windows Update ativo\n   • Atualizações automáticas\n   • Verificar site oficial\n\n**Ferramentas úteis:**\n• Task Manager (Ctrl+Shift+Esc)\n• msconfig - Configurações de inicialização\n• Verificador de arquivos: sfc /scannow'
      ]
    },
    senhas_acesso: {
      keywords: ['senha', 'password', 'login', 'acesso', 'bloqueado', 'esqueci', 'usuário', 'usuario', 'não consigo entrar', 'nao consigo entrar', 'bloqueio'],
      responses: [
        '🔐 **PROBLEMAS DE SENHA E ACESSO**\n\n**SOLUÇÕES POR SITUAÇÃO:**\n\n1️⃣ **Esqueci a senha:**\n   • Opção "Esqueci minha senha"\n   • Email de recuperação\n   • Pergunta de segurança\n   • Contato com administrador\n\n2️⃣ **Conta bloqueada:**\n   • Aguardar tempo de bloqueio\n   • Contatar administrador\n   • Verificar tentativas anteriores\n\n3️⃣ **Problema de digitação:**\n   • Caps Lock ativado\n   • Teclado numérico\n   • Layout do teclado (BR/US)\n   • Caracteres especiais\n\n4️⃣ **Navegador:**\n   • Limpar cache/cookies\n   • Modo privado/incógnito\n   • Gerenciador de senhas\n   • Autopreenchimento desabilitado\n\n**DICAS DE SEGURANÇA:**\n• Use senhas fortes (8+ caracteres)\n• Combine letras, números e símbolos\n• Não use informações pessoais\n• Ative autenticação de dois fatores\n\n⚠️ **NUNCA compartilhe senhas por email ou telefone!**'
      ]
    },
    sistema_windows: {
      keywords: ['windows', 'sistema', 'lento', 'erro', 'blue screen', 'tela azul', 'reinicia', 'atualização', 'atualizacao', 'boot', 'inicialização', 'inicializacao'],
      responses: [
        '🪟 **PROBLEMAS DO WINDOWS**\n\n**DIAGNÓSTICO DO SISTEMA:**\n\n1️⃣ **Sistema lento:**\n   • Verificar espaço em disco (min 15%)\n   • Programas iniciando com Windows\n   • Verificar malware/vírus\n   • Limpeza de arquivos temporários\n\n2️⃣ **Erros e travamentos:**\n   • Verificar logs: Event Viewer\n   • Comando: sfc /scannow\n   • Memória RAM: mdsched.exe\n   • Disco rígido: chkdsk /f\n\n3️⃣ **Tela azul (BSOD):**\n   • Anotar código do erro\n   • Verificar hardware recente\n   • Atualizar drivers\n   • Testar memória RAM\n\n4️⃣ **Problemas de boot:**\n   • Modo de segurança (F8)\n   • Reparação automática\n   • Restauração do sistema\n   • Mídia de recuperação\n\n**MANUTENÇÃO PREVENTIVA:**\n• Windows Update automático\n• Antivírus atualizado\n• Backup regular\n• Limpeza mensal\n\n🔧 **Ferramentas úteis:** msconfig, diskpart, regedit'
      ]
    },
    solicitacoes: {
      keywords: ['solicitação', 'solicitacao', 'ticket', 'chamado', 'request', 'minhas solicitações', 'meus chamados', 'status', 'andamento'],
      responses: [
        '📋 **CONSULTA DE SOLICITAÇÕES**\n\n**Para ver suas solicitações:**\n\n1️⃣ **Menu lateral:** Clique em "Minhas Solicitações"\n\n2️⃣ **Status disponíveis:**\n   • Nova - Recém criada\n   • Atribuída - Designada para técnico\n   • Em Andamento - Sendo resolvida\n   • Resolvida - Problema solucionado\n   • Fechada - Finalizada\n\n3️⃣ **Informações que você verá:**\n   • Número do chamado\n   • Data de criação\n   • Prioridade\n   • Técnico responsável\n   • Comentários e atualizações\n\n💡 **Dica:** Você também pode perguntar "minhas solicitações" aqui no chat para ver um resumo rápido!'
      ]
    }
  }
};

class AIAssistantService {
  async processMessage(message: string, userId?: string): Promise<string> {
    console.log('Processing message:', message);
    const lowerMessage = message.toLowerCase().trim();
    
    // Verificar se é uma pergunta sobre solicitações
    if (this.isRequestQuery(lowerMessage)) {
      return await this.handleRequestQuery(lowerMessage, userId);
    }
    
    // Verificar se é uma pergunta sobre criar nova solicitação
    if (this.isCreateRequestQuery(lowerMessage)) {
      return this.handleCreateRequestQuery();
    }
    
    // Buscar na base de conhecimento expandida
    const knowledgeResponse = this.searchKnowledge(lowerMessage);
    if (knowledgeResponse) {
      console.log('Found knowledge response for:', lowerMessage);
      return knowledgeResponse;
    }
    
    // Resposta padrão melhorada
    console.log('Using default response for:', lowerMessage);
    return this.getDefaultResponse();
  }
  
  private isRequestQuery(message: string): boolean {
    const requestKeywords = [
      'minhas solicitações', 'minhas solicitacoes', 'meus tickets', 'meus chamados', 
      'chamados', 'requests', 'status', 'andamento', 'pendente', 'resolvido',
      'solicitação', 'solicitacao', 'ticket', 'chamado'
    ];
    
    return requestKeywords.some(keyword => message.includes(keyword));
  }
  
  private isCreateRequestQuery(message: string): boolean {
    const createKeywords = [
      'criar solicitação', 'criar solicitacao', 'nova solicitação', 'nova solicitacao',
      'abrir chamado', 'criar ticket', 'solicitar', 'preciso de ajuda', 'novo chamado'
    ];
    
    return createKeywords.some(keyword => message.includes(keyword));
  }
  
  private async handleRequestQuery(message: string, userId?: string): Promise<string> {
    try {
      const requests = await getRequests(userId);
      
      if (requests.length === 0) {
        return '📋 **Nenhuma solicitação encontrada**\n\nVocê ainda não possui solicitações registradas.\n\n➕ **Para criar uma nova solicitação:**\n• Clique em "Nova Solicitação" no menu\n• Descreva seu problema detalhadamente\n• Nossa equipe entrará em contato em breve!';
      }
      
      // Filtrar por status se especificado
      if (message.includes('pendente') || message.includes('aberta')) {
        const pendingRequests = requests.filter(r => 
          r.status !== 'resolvida' && r.status !== 'fechada' && 
          r.status !== 'resolved' && r.status !== 'closed'
        );
        
        if (pendingRequests.length === 0) {
          return '✅ **Parabéns!**\n\nVocê não possui solicitações pendentes no momento.\nTodas suas solicitações foram resolvidas!';
        }
        
        return this.formatRequestsList(pendingRequests, 'pendentes');
      }
      
      if (message.includes('resolvid') || message.includes('fechad')) {
        const resolvedRequests = requests.filter(r => 
          r.status === 'resolvida' || r.status === 'fechada' || 
          r.status === 'resolved' || r.status === 'closed'
        );
        
        if (resolvedRequests.length === 0) {
          return '📋 Você não possui solicitações resolvidas ainda.';
        }
        
        return this.formatRequestsList(resolvedRequests, 'resolvidas');
      }
      
      // Mostrar resumo geral melhorado
      const pending = requests.filter(r => 
        r.status !== 'resolvida' && r.status !== 'fechada' && 
        r.status !== 'resolved' && r.status !== 'closed'
      ).length;
      
      const resolved = requests.length - pending;
      
      return `📊 **RESUMO DAS SUAS SOLICITAÇÕES**\n\n📋 **Total:** ${requests.length} solicitações\n⏳ **Pendentes:** ${pending}\n✅ **Resolvidas:** ${resolved}\n\n💡 **Quer ver detalhes?**\n• Digite "pendentes" para ver abertas\n• Digite "resolvidas" para ver concluídas\n• Acesse "Minhas Solicitações" no menu para ver todas`;
      
    } catch (error) {
      console.error('Error fetching requests:', error);
      return '❌ **Erro ao consultar solicitações**\n\nNão foi possível acessar suas solicitações no momento.\n\n🔧 **Tente:**\n• Recarregar a página\n• Verificar sua conexão\n• Contactar suporte se persistir';
    }
  }
  
  private handleCreateRequestQuery(): string {
    return '➕ **COMO CRIAR UMA NOVA SOLICITAÇÃO**\n\n**Passo a passo:**\n\n1️⃣ **Clique em "Nova Solicitação"** no menu lateral\n\n2️⃣ **Preencha os detalhes:**\n   • Título claro e objetivo\n   • Descrição detalhada do problema\n   • Selecione tipo (Hardware, Software, etc)\n   • Defina prioridade\n\n3️⃣ **Anexe arquivos** se necessário:\n   • Screenshots do erro\n   • Logs do sistema\n   • Documentos relacionados\n\n4️⃣ **Envie a solicitação**\n\n✅ **Você receberá:**\n• Número do chamado\n• Confirmação por email\n• Atualizações sobre o progresso\n\n💡 **Dica:** Quanto mais detalhes, mais rápida será a solução!';
  }
  
  private formatRequestsList(requests: ITRequest[], type: string): string {
    const recentRequests = requests.slice(0, 5);
    
    let response = `📋 **SUAS SOLICITAÇÕES ${type.toUpperCase()}**\n\n`;
    
    recentRequests.forEach((request, index) => {
      const status = this.translateStatus(request.status);
      const priority = this.translatePriority(request.priority);
      const date = new Date(request.createdAt).toLocaleDateString('pt-BR');
      
      const priorityIcon = priority === 'Alta' ? '🔴' : priority === 'Média' ? '🟡' : '🟢';
      const statusIcon = status === 'Resolvida' ? '✅' : status === 'Em Andamento' ? '⚡' : '⏳';
      
      response += `${index + 1}. **${request.title || 'Solicitação'}**\n`;
      response += `   🆔 **ID:** ${request.id}\n`;
      response += `   ${statusIcon} **Status:** ${status}\n`;
      response += `   ${priorityIcon} **Prioridade:** ${priority}\n`;
      response += `   📅 **Data:** ${date}\n\n`;
    });
    
    if (requests.length > 5) {
      response += `... e mais **${requests.length - 5}** solicitações.\n\n`;
    }
    
    response += '👆 **Para ver detalhes completos:** Acesse "Minhas Solicitações" no menu lateral.';
    
    return response;
  }
  
  private translateStatus(status: RequestStatus): string {
    const statusMap: { [key in RequestStatus]: string } = {
      'nova': 'Nova',
      'new': 'Nova',
      'atribuida': 'Atribuída',
      'assigned': 'Atribuída',
      'em_andamento': 'Em Andamento',
      'in_progress': 'Em Andamento',
      'resolvida': 'Resolvida',
      'resolved': 'Resolvida',
      'fechada': 'Fechada',
      'closed': 'Fechada'
    };
    
    return statusMap[status] || status;
  }
  
  private translatePriority(priority: RequestPriority): string {
    const priorityMap: { [key in RequestPriority]: string } = {
      'baixa': 'Baixa',
      'low': 'Baixa',
      'media': 'Média',
      'medium': 'Média',
      'alta': 'Alta',
      'high': 'Alta',
      'urgent': 'Urgente'
    };
    
    return priorityMap[priority] || priority;
  }
  
  private searchKnowledge(message: string): string | null {
    console.log('Searching knowledge for:', message);
    
    // Buscar por palavras-chave em todas as categorias
    for (const [category, data] of Object.entries(knowledgeBase.categories)) {
      console.log(`Checking category: ${category}`);
      
      // Verificar se alguma palavra-chave da categoria está presente na mensagem
      const foundKeyword = data.keywords.find(keyword => {
        const found = message.includes(keyword.toLowerCase());
        if (found) {
          console.log(`Found matching keyword: "${keyword}" in category: ${category}`);
        }
        return found;
      });
      
      if (foundKeyword) {
        console.log(`Returning response for category: ${category}`);
        return data.responses[0];
      }
    }
    
    console.log('No knowledge match found for:', message);
    return null;
  }
  
  private getDefaultResponse(): string {
    return `🤖 **ASSISTENTE DE TI ESPECIALIZADO**\n\n**Posso ajudar você com:**\n\n🔧 **HARDWARE:**\n• PC que não liga, periféricos, monitores\n• Problemas de impressora e scanner\n• Configuração de equipamentos\n\n🌐 **CONECTIVIDADE:**\n• Internet e Wi-Fi\n• Rede local e compartilhamento\n• VPN e acesso remoto\n\n💻 **SOFTWARE:**\n• Instalação e configuração\n• Erros e travamentos\n• Atualizações e compatibilidade\n\n📧 **COMUNICAÇÃO:**\n• Configuração de email\n• Problemas de envio/recebimento\n• Outlook, Gmail, etc.\n\n🔐 **SEGURANÇA:**\n• Senhas e acessos\n• Antivírus e proteção\n• Backup e recuperação\n\n📋 **SOLICITAÇÕES:**\n• Consultar status dos chamados\n• Orientações para nova solicitação\n\n💡 **EXEMPLOS DE PERGUNTAS:**\n• "Meu PC não liga"\n• "Internet está lenta"\n• "Como configurar email"\n• "Minhas solicitações"\n• "Impressora não funciona"\n\n🗣️ **COMO USAR:**\nDescreva seu problema específico e eu darei orientações detalhadas passo a passo!`;
  }
}

export const aiAssistantService = new AIAssistantService();
