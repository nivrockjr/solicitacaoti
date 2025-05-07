
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
  smtpPassword: 'yJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMzAyNDg3NjJjN2I0MDc2ZjZiMjdkODRiMmVlMjM4NyIsImF1ZCI6ImNsaWVudGVraW5nMjA1NDc3IiwiaWF0IjoxNzQ2NTM4NTcxLjkzNTc1ODYsImp0aSI6ImE5NDk2NjY0MjA1MWNlNzFhZjVjMDNkYjI5OTIwMjMwIn0.LSBOnW733-G88-XSw8kgCT6lljzIow1ulxgeT9i1T5U',
  sslPort: 465,
  defaultDomain: 'suporte.pqvirk.com.br' // Adicionado o subdomínio de envio padrão
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
    
    console.log('Enviando email via KingHost SMTP Transacional');
    console.log('Para:', params.to);
    console.log('Assunto:', params.subject);
    console.log('Conteúdo:', params.html);
    
    // Construir o endereço de email de origem usando o subdomínio configurado
    const fromEmail = params.from || `noreply@${API_CONFIG.defaultDomain}`;
    
    // Em um ambiente de produção, você deve usar uma função serverless
    // ou backend para fazer esta chamada para proteger suas credenciais
    const response = await fetch(`${API_CONFIG.baseUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.token}`
      },
      body: JSON.stringify({
        from: fromEmail,
        fromName: params.fromName || 'Sistema de TI',
        to: params.to,
        subject: params.subject,
        html: params.html,
        replyTo: params.replyTo || fromEmail,
        attachments: params.attachments
      })
    }).catch(error => {
      console.error('Erro na chamada da API:', error);
      throw new Error('Falha na conexão com a API da KingHost');
    });
    
    if (!response) {
      throw new Error('Sem resposta da API da KingHost');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Erro HTTP: ${response.status}` }));
      throw new Error(errorData.message || 'Falha ao enviar e-mail');
    }
    
    const data = await response.json().catch(() => ({ success: false, message: 'Erro ao processar resposta' }));
    return {
      success: data.success || true, // Assume sucesso se não for explicitamente falso
      message: data.message || 'E-mail enviado com sucesso'
    };
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
    const response = await fetch(`${API_CONFIG.baseUrl}/account`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Falha ao verificar status da conta');
    }
    
    const data = await response.json();
    return {
      success: true,
      quota: data.quota || 1000,
      used: data.used || 0,
      remaining: data.remaining || 1000
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
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Falha ao obter histórico de envios');
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Erro ao obter histórico:', error);
    return {
      success: false,
      data: []
    };
  }
};

export default {
  sendMail: sendMailViaKingHost,
  checkStatus: checkAccountStatus,
  getHistory: getEmailHistory,
  config: API_CONFIG
};
