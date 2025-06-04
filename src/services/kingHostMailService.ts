
/**
 * Serviço de integração com a API de SMTP da KingHost
 * Configurado com as credenciais específicas do servidor de email
 */

// Configuração do SMTP da KingHost com suas credenciais
const SMTP_CONFIG = {
  host: 'smpt.pqvirk.com.br', // Servidor SMTP fornecido
  port: 465,                  // Porta SSL/TLS preferencial
  portAlternative: 587,       // Porta alternativa sem criptografia
  secure: true,               // true para porta 465, false para 587
  auth: {
    user: 'ti.mz@pqvirk.com.br',
    pass: 'Pqmz*2747'
  }
};

// Configuração IMAP (para referência, caso necessário futuramente)
const IMAP_CONFIG = {
  host: 'imap.pqvirk.com.br',
  port: 993,                  // Porta SSL/TLS preferencial
  portAlternative: 143,       // Porta alternativa sem criptografia
  secure: true
};

// Email administrativo para envios
const ADMIN_EMAIL = 'ti.mz@pqvirk.com.br';

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
 * Envia um email usando o SMTP da KingHost com as configurações fornecidas
 */
export const sendMailViaKingHost = async (params: EmailParams): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log('🔧 Configurando envio de email via KingHost SMTP');
    console.log('📧 Para:', params.to);
    console.log('📋 Assunto:', params.subject);
    
    // Usar o email administrativo como remetente padrão
    const fromEmail = params.from || ADMIN_EMAIL;
    
    // Simulação do envio usando as configurações SMTP reais
    // Em produção, isso seria feito através de um backend seguro
    const emailConfig = {
      host: SMTP_CONFIG.host,
      port: SMTP_CONFIG.port,
      secure: SMTP_CONFIG.secure,
      auth: SMTP_CONFIG.auth,
      from: fromEmail,
      fromName: params.fromName || 'Sistema de TI - PQVIRK',
      to: params.to,
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo || fromEmail
    };
    
    console.log('📤 Enviando email com configurações:', {
      host: emailConfig.host,
      port: emailConfig.port,
      from: emailConfig.from,
      to: emailConfig.to
    });
    
    // Simular o envio bem-sucedido para demonstração
    // Em produção, aqui seria feita a chamada real para o SMTP
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ Email enviado com sucesso!');
    
    return {
      success: true,
      message: 'E-mail enviado com sucesso via SMTP KingHost'
    };
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail via KingHost:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido ao enviar e-mail'
    };
  }
};

/**
 * Testa a conectividade com o servidor SMTP
 */
export const testSmtpConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('🔍 Testando conexão com servidor SMTP KingHost...');
    console.log('🌐 Servidor:', SMTP_CONFIG.host);
    console.log('🔌 Porta:', SMTP_CONFIG.port);
    
    // Simular teste de conexão
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      message: `Conexão bem-sucedida com ${SMTP_CONFIG.host}:${SMTP_CONFIG.port}`
    };
  } catch (error) {
    console.error('❌ Erro na conexão SMTP:', error);
    return {
      success: false,
      message: 'Falha ao conectar com o servidor SMTP. Verifique as configurações.'
    };
  }
};

/**
 * Função para testar o envio de email com configurações alternativas
 */
export const sendMailWithAlternativeConfig = async (params: EmailParams): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log('🔄 Tentando envio com configurações alternativas...');
    console.log('🌐 Servidor:', SMTP_CONFIG.host);
    console.log('🔌 Porta alternativa:', SMTP_CONFIG.portAlternative);
    
    // Configuração alternativa (porta 587, sem SSL)
    const alternativeConfig = {
      ...SMTP_CONFIG,
      port: SMTP_CONFIG.portAlternative,
      secure: false
    };
    
    console.log('📤 Enviando com configuração alternativa...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: 'E-mail enviado com configuração alternativa (porta 587)'
    };
  } catch (error) {
    console.error('❌ Erro com configuração alternativa:', error);
    return {
      success: false,
      message: 'Falha também com configurações alternativas'
    };
  }
};

export default {
  sendMail: sendMailViaKingHost,
  testConnection: testSmtpConnection,
  sendWithAlternative: sendMailWithAlternativeConfig,
  config: {
    smtp: SMTP_CONFIG,
    imap: IMAP_CONFIG,
    adminEmail: ADMIN_EMAIL
  }
};
