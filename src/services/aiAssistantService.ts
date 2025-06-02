
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

// Base de conhecimento para problemas comuns de TI
const knowledgeBase: KnowledgeBase = {
  categories: {
    hardware: {
      keywords: ['pc', 'computador', 'não liga', 'não ligando', 'ligando', 'teclado', 'mouse', 'monitor', 'cpu', 'memória', 'disco', 'energia', 'fonte', 'botão'],
      responses: [
        'Para problemas de PC que não liga:\n\n1. Verifique se o cabo de energia está conectado corretamente\n2. Teste em outra tomada\n3. Verifique se o botão de energia da fonte está ligado\n4. Confirme se há energia na tomada\n5. Verifique conexões internas (se souber fazer)\n6. Teste sem periféricos conectados\n7. Se nada funcionar, pode ser problema na fonte de alimentação\n\nSe o problema persistir, crie uma solicitação para nosso suporte técnico!'
      ]
    },
    internet: {
      keywords: ['internet', 'conexão', 'wifi', 'rede', 'desconectado', 'lento', 'navegador', 'wi-fi'],
      responses: [
        'Para problemas de internet:\n\n1. Verifique se o cabo de rede está conectado\n2. Reinicie o roteador\n3. Verifique as configurações de proxy\n4. Teste em outro dispositivo\n5. Entre em contato com o provedor se necessário\n\nSe continuar com problemas, abra uma solicitação!'
      ]
    },
    email: {
      keywords: ['email', 'outlook', 'gmail', 'correio', 'anexo', 'spam', 'e-mail'],
      responses: [
        'Para problemas de email:\n\n1. Verifique suas credenciais\n2. Confirme as configurações do servidor\n3. Verifique a caixa de spam\n4. Limpe o cache do cliente de email\n5. Teste o webmail\n\nPrecisa de mais ajuda? Crie uma solicitação!'
      ]
    },
    impressora: {
      keywords: ['impressora', 'imprimir', 'papel', 'tinta', 'toner', 'scanner', 'impressão'],
      responses: [
        'Para problemas de impressora:\n\n1. Verifique se há papel e tinta/toner\n2. Reinicie a impressora\n3. Verifique a conexão USB ou rede\n4. Atualize os drivers\n5. Limpe a fila de impressão\n\nAinda com problemas? Abra uma solicitação para nosso suporte!'
      ]
    },
    software: {
      keywords: ['programa', 'software', 'aplicativo', 'instalar', 'atualizar', 'erro', 'aplicação'],
      responses: [
        'Para problemas de software:\n\n1. Reinicie o aplicativo\n2. Verifique atualizações disponíveis\n3. Execute como administrador\n4. Reinstale se necessário\n5. Verifique compatibilidade do sistema\n\nPrecisa de mais suporte? Crie uma solicitação!'
      ]
    },
    senha: {
      keywords: ['senha', 'password', 'login', 'acesso', 'bloqueado', 'esqueci', 'usuário'],
      responses: [
        'Para problemas de senha:\n\n1. Use a opção "Esqueci minha senha"\n2. Verifique se o Caps Lock está ativado\n3. Limpe o cache do navegador\n4. Contacte o administrador para reset\n5. Verifique políticas de senha\n\nPrecisa de ajuda? Abra uma solicitação!'
      ]
    }
  }
};

class AIAssistantService {
  async processMessage(message: string, userId?: string): Promise<string> {
    console.log('Processing message:', message);
    const lowerMessage = message.toLowerCase();
    
    // Verificar se é uma pergunta sobre solicitações
    if (this.isRequestQuery(lowerMessage)) {
      return await this.handleRequestQuery(lowerMessage, userId);
    }
    
    // Verificar se é uma pergunta sobre criar nova solicitação
    if (this.isCreateRequestQuery(lowerMessage)) {
      return this.handleCreateRequestQuery();
    }
    
    // Buscar na base de conhecimento
    const knowledgeResponse = this.searchKnowledge(lowerMessage);
    if (knowledgeResponse) {
      console.log('Found knowledge response');
      return knowledgeResponse;
    }
    
    // Resposta padrão
    console.log('Using default response');
    return this.getDefaultResponse();
  }
  
  private isRequestQuery(message: string): boolean {
    const requestKeywords = [
      'minhas solicitações', 'meus tickets', 'chamados', 'requests',
      'status', 'andamento', 'pendente', 'resolvido',
      'solicitação', 'ticket', 'chamado'
    ];
    
    return requestKeywords.some(keyword => message.includes(keyword));
  }
  
  private isCreateRequestQuery(message: string): boolean {
    const createKeywords = [
      'criar solicitação', 'nova solicitação', 'abrir chamado',
      'criar ticket', 'solicitar', 'preciso de ajuda'
    ];
    
    return createKeywords.some(keyword => message.includes(keyword));
  }
  
  private async handleRequestQuery(message: string, userId?: string): Promise<string> {
    try {
      const requests = await getRequests(userId);
      
      if (requests.length === 0) {
        return 'Você não possui solicitações registradas no momento. Gostaria de criar uma nova solicitação?';
      }
      
      // Filtrar por status se especificado
      if (message.includes('pendente') || message.includes('aberta')) {
        const pendingRequests = requests.filter(r => 
          r.status !== 'resolvida' && r.status !== 'fechada' && 
          r.status !== 'resolved' && r.status !== 'closed'
        );
        
        if (pendingRequests.length === 0) {
          return 'Você não possui solicitações pendentes no momento.';
        }
        
        return this.formatRequestsList(pendingRequests, 'pendentes');
      }
      
      if (message.includes('resolvid') || message.includes('fechad')) {
        const resolvedRequests = requests.filter(r => 
          r.status === 'resolvida' || r.status === 'fechada' || 
          r.status === 'resolved' || r.status === 'closed'
        );
        
        if (resolvedRequests.length === 0) {
          return 'Você não possui solicitações resolvidas.';
        }
        
        return this.formatRequestsList(resolvedRequests, 'resolvidas');
      }
      
      // Mostrar resumo geral
      const pending = requests.filter(r => 
        r.status !== 'resolvida' && r.status !== 'fechada' && 
        r.status !== 'resolved' && r.status !== 'closed'
      ).length;
      
      const resolved = requests.length - pending;
      
      return `Resumo das suas solicitações:\n\n📋 Total: ${requests.length}\n⏳ Pendentes: ${pending}\n✅ Resolvidas: ${resolved}\n\nGostaria de ver detalhes de alguma categoria específica?`;
      
    } catch (error) {
      return 'Não foi possível consultar suas solicitações no momento. Tente novamente mais tarde.';
    }
  }
  
  private handleCreateRequestQuery(): string {
    return 'Para criar uma nova solicitação:\n\n1. Clique no botão "Nova Solicitação" no menu\n2. Preencha os detalhes do problema\n3. Selecione o tipo e prioridade\n4. Anexe arquivos se necessário\n5. Envie a solicitação\n\nVocê também pode acessar diretamente através do menu lateral.';
  }
  
  private formatRequestsList(requests: ITRequest[], type: string): string {
    const recentRequests = requests.slice(0, 5);
    
    let response = `Suas solicitações ${type}:\n\n`;
    
    recentRequests.forEach((request, index) => {
      const status = this.translateStatus(request.status);
      const priority = this.translatePriority(request.priority);
      const date = new Date(request.createdAt).toLocaleDateString('pt-BR');
      
      response += `${index + 1}. ${request.title || 'Solicitação'}\n`;
      response += `   ID: ${request.id}\n`;
      response += `   Status: ${status}\n`;
      response += `   Prioridade: ${priority}\n`;
      response += `   Data: ${date}\n\n`;
    });
    
    if (requests.length > 5) {
      response += `... e mais ${requests.length - 5} solicitações.\n\n`;
    }
    
    response += 'Para ver mais detalhes, acesse a seção "Minhas Solicitações" no menu.';
    
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
      'high': 'Alta'
    };
    
    return priorityMap[priority] || priority;
  }
  
  private searchKnowledge(message: string): string | null {
    console.log('Searching knowledge for:', message);
    
    for (const [category, data] of Object.entries(knowledgeBase.categories)) {
      console.log(`Checking category: ${category}`);
      const foundKeyword = data.keywords.find(keyword => message.includes(keyword));
      if (foundKeyword) {
        console.log(`Found matching keyword: ${foundKeyword} in category: ${category}`);
        return data.responses[0];
      }
    }
    
    console.log('No knowledge match found');
    return null;
  }
  
  private getDefaultResponse(): string {
    return `Posso ajudá-lo com:\n\n🔧 Problemas técnicos (PC que não liga, internet, email, impressora, software)\n📋 Consulta às suas solicitações\n➕ Orientações para criar nova solicitação\n📚 Dúvidas gerais sobre TI\n\nO que você gostaria de saber?`;
  }
}

export const aiAssistantService = new AIAssistantService();
