
/**
 * Serviço de integração com a API de SMTP Transacional da KingHost
 */

// Configuração da API da KingHost
const API_CONFIG = {
  baseUrl: 'https://api.kinghost.net/mail',
  token: '2eeb040456e39a97c9bc30c32f641e43',
  smtpServer: 'kinghost.smtpkl.com.br',
  smtpPort: 587,
  smtpUser: '230248762c7b4076f6b27d84b2ee2387',
  sslPort: 465
};

// Interface para os parâmetros do email
interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string; // Base64
    contentType: string;
  }>;
}

/**
 * Envia um email usando a API de SMTP Transacional da KingHost
 * 
 * Em um ambiente de produção, esta função deve ser chamada a partir
 * de uma função serverless ou backend para proteger as credenciais.
 */
export const sendMailViaKingHost = async (params: EmailParams): Promise<{ success: boolean; message?: string }> => {
  try {
    // Esta função deve ser implementada no backend para segurança
    // Aqui estamos apenas simulando o envio para fins de demonstração na UI
    
    console.log('Simulando envio de email via KingHost SMTP Transacional');
    console.log('Para:', params.to);
    console.log('Assunto:', params.subject);
    
    // Simular uma chamada bem-sucedida
    return {
      success: true,
      message: 'E-mail enviado com sucesso (simulado)'
    };
    
    /* 
    // Exemplo de código real para backend:
    const response = await fetch(`${API_CONFIG.baseUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.token}`
      },
      body: JSON.stringify({
        from: params.from || 'noreply@seudominio.com',
        fromName: params.fromName || 'Sistema de TI',
        to: params.to,
        subject: params.subject,
        html: params.html,
        replyTo: params.replyTo,
        attachments: params.attachments
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Falha ao enviar e-mail');
    }
    
    const data = await response.json();
    return {
      success: data.success,
      message: data.message
    };
    */
  } catch (error) {
    console.error('Erro ao enviar e-mail via KingHost:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido ao enviar e-mail'
    };
  }
};

/**
 * Verifica o status da conta SMTP Transacional
 */
export const checkAccountStatus = async (): Promise<{
  success: boolean;
  quota?: number;
  used?: number;
  remaining?: number;
}> => {
  try {
    // Simulação - em produção seria uma chamada real à API
    return {
      success: true,
      quota: 1000,
      used: 0,
      remaining: 1000
    };
  } catch (error) {
    console.error('Erro ao verificar status da conta:', error);
    return {
      success: false
    };
  }
};

/**
 * Obtém o histórico de envios
 */
export const getEmailHistory = async (): Promise<any> => {
  // Implementação real seria feita no backend
  return {
    success: true,
    data: []
  };
};

export default {
  sendMail: sendMailViaKingHost,
  checkStatus: checkAccountStatus,
  getHistory: getEmailHistory,
  config: API_CONFIG
};
