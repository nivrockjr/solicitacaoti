import { User, ITRequest, RequestStatus } from '../types';
import { format } from 'date-fns';
import kingHostMailService from './kingHostMailService';

// Configuração usando suas credenciais específicas
const SMTP_CONFIG = {
  host: 'smpt.pqvirk.com.br',
  port: 465,       // Porta SSL/TLS preferencial
  secure: true,    // true para porta 465
  auth: {
    user: '', // Preencha com o novo e-mail
    pass: ''  // Preencha com a nova senha
  }
};

// Email administrativo para envios
const ADMIN_EMAIL = '';

// Função principal de envio de email usando suas configurações
export const sendEmail = async (to: string, subject: string, body: string): Promise<boolean> => {
  console.log(`📧 Enviando email para: ${to}`);
  console.log(`📋 Assunto: ${subject}`);
  
  try {
    // Usar o serviço da KingHost com suas configurações
    const result = await kingHostMailService.sendMail({
      to,
      subject,
      html: body,
      from: ADMIN_EMAIL,
      fromName: 'Sistema de TI - PQVIRK'
    });
    
    return result.success;
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return false;
  }
};

// Template para nova solicitação (enviado aos administradores)
export const generateNewRequestAlertEmail = (request: ITRequest): { subject: string; body: string } => {
  // Buscar dados do usuário para incluir setor
  const subject = `Solicitação do usuário ${request.requesterName} - ${getUserDepartment(request.requesterId)}`;
  
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
        Nova Solicitação de TI
      </h2>
      
      <p style="font-size: 16px; margin-bottom: 20px;">
        Olá, o usuário <strong>${request.requesterName}</strong> (${getUserDepartment(request.requesterId)}) solicita:
      </p>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">Detalhes da Solicitação:</h3>
        <ul style="line-height: 1.6;">
          <li><strong>Número:</strong> ${request.id}</li>
          <li><strong>Solicitante:</strong> ${request.requesterName}</li>
          <li><strong>Email:</strong> ${request.requesterEmail}</li>
          <li><strong>Setor:</strong> ${getUserDepartment(request.requesterId)}</li>
          <li><strong>Tipo:</strong> ${getRequestTypeText(request.type)}</li>
          <li><strong>Prioridade:</strong> ${getRequestPriorityText(request.priority)}</li>
          <li><strong>Data da Solicitação:</strong> ${format(new Date(request.createdAt), 'dd/MM/yyyy HH:mm')}</li>
          <li><strong>Prazo:</strong> ${format(new Date(request.deadlineAt), 'dd/MM/yyyy HH:mm')}</li>
        </ul>
      </div>
      
      <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #92400e;">Descrição:</h4>
        <p style="margin-bottom: 0; white-space: pre-wrap;">${request.description}</p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          Por favor, acesse o sistema para gerenciar esta solicitação.<br>
          <strong>Sistema de TI - PQVIRK</strong>
        </p>
      </div>
    </div>
  `;
  
  return { subject, body };
};

// Template para confirmação de solicitação (enviado ao usuário)
export const generateRequestConfirmationEmail = (request: ITRequest): { subject: string; body: string } => {
  const subject = `Confirmação de Solicitação - ${request.id}`;
  
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
        Solicitação Recebida
      </h2>
      
      <p>Olá <strong>${request.requesterName}</strong>,</p>
      <p>Sua solicitação de TI foi recebida com sucesso pelo nosso time.</p>
      
      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #166534;">Detalhes da Solicitação:</h3>
        <ul style="line-height: 1.6;">
          <li><strong>Número:</strong> ${request.id}</li>
          <li><strong>Tipo:</strong> ${getRequestTypeText(request.type)}</li>
          <li><strong>Prioridade:</strong> ${getRequestPriorityText(request.priority)}</li>
          <li><strong>Data de Criação:</strong> ${format(new Date(request.createdAt), 'dd/MM/yyyy HH:mm')}</li>
          <li><strong>Prazo:</strong> ${format(new Date(request.deadlineAt), 'dd/MM/yyyy HH:mm')}</li>
        </ul>
      </div>
      
      <p>Sua solicitação será atendida conforme a prioridade e prazo estabelecidos.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          Atenciosamente,<br>
          <strong>Time de TI - PQVIRK</strong>
        </p>
      </div>
    </div>
  `;
  
  return { subject, body };
};

// Template para atualização de status (enviado ao usuário)
export const generateStatusUpdateEmail = (request: ITRequest, oldStatus: RequestStatus): { subject: string; body: string } => {
  const subject = `Atualização de Solicitação - ${request.id}`;
  
  const statusUpdateMessage = getStatusUpdateMessage(request.status);
  
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
        Atualização de Solicitação
      </h2>
      
      <p>Olá <strong>${request.requesterName}</strong>,</p>
      <p>Sua solicitação de TI teve uma atualização de status:</p>
      
      <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1d4ed8;">Detalhes da Atualização:</h3>
        <ul style="line-height: 1.6;">
          <li><strong>Número:</strong> ${request.id}</li>
          <li><strong>Status Anterior:</strong> ${getRequestStatusText(oldStatus)}</li>
          <li><strong>Status Atual:</strong> ${getRequestStatusText(request.status)}</li>
        </ul>
      </div>
      
      <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #0c4a6e; font-weight: 500;">${statusUpdateMessage}</p>
      </div>
      
      ${request.status === 'resolvida' || request.status === 'fechada' ? `
      <p style="color: #059669; font-weight: 500;">
        ✅ Sua solicitação foi finalizada. Caso necessário, você pode visualizar os detalhes da resolução acessando o sistema.
      </p>
      ` : ''}
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          Atenciosamente,<br>
          <strong>Time de TI - PQVIRK</strong>
        </p>
      </div>
    </div>
  `;
  
  return { subject, body };
};

export const generateDeadlineAlertEmail = (request: ITRequest, isOverdue: boolean): { subject: string; body: string } => {
  const subject = isOverdue 
    ? `ALERTA: Solicitação ${request.id} - VENCIDA` 
    : `ALERTA: Solicitação ${request.id} - Próxima ao Vencimento`;
  
  const body = `
    <h2>${isOverdue ? 'Solicitação Vencida' : 'Solicitação Próxima ao Vencimento'}</h2>
    <p>Olá ${request.requesterName},</p>
    <p>${isOverdue 
      ? `Sua solicitação de TI <strong>VENCEU</strong> em ${format(new Date(request.deadlineAt), 'dd/MM/yyyy HH:mm')}.` 
      : `Sua solicitação de TI está próxima de vencer em ${format(new Date(request.deadlineAt), 'dd/MM/yyyy HH:mm')}.`}
    </p>
    
    <h3>Detalhes da Solicitação:</h3>
    <ul>
      <li><strong>Número:</strong> ${request.id}</li>
      <li><strong>Status:</strong> ${getRequestStatusText(request.status)}</li>
      <li><strong>Tipo:</strong> ${getRequestTypeText(request.type)}</li>
      <li><strong>Prioridade:</strong> ${getRequestPriorityText(request.priority)}</li>
    </ul>
    
    <p>Pedimos que entre em contato com o time de TI para mais informações sobre o andamento da sua solicitação.</p>
    
    <p>Atenciosamente,<br>Time de TI</p>
  `;
  
  return { subject, body };
};

export const generateAdminDailyDigestEmail = (pendingRequests: ITRequest[]): { subject: string; body: string } => {
  const now = new Date();
  const isMorning = now.getHours() < 12;
  
  const subject = `Relatório ${isMorning ? 'Matutino' : 'Vespertino'} de Solicitações - ${format(now, 'dd/MM/yyyy')}`;
  
  let requestsTable = '';
  
  if (pendingRequests.length > 0) {
    requestsTable = `
      <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">
        <tr>
          <th>Número</th>
          <th>Solicitante</th>
          <th>Tipo</th>
          <th>Prioridade</th>
          <th>Status</th>
          <th>Prazo</th>
        </tr>
        ${pendingRequests.map(req => `
          <tr>
            <td>${req.id}</td>
            <td>${req.requesterName}</td>
            <td>${getRequestTypeText(req.type)}</td>
            <td>${getRequestPriorityText(req.priority)}</td>
            <td>${getRequestStatusText(req.status)}</td>
            <td>${format(new Date(req.deadlineAt), 'dd/MM/yyyy HH:mm')}</td>
          </tr>
        `).join('')}
      </table>
    `;
  } else {
    requestsTable = '<p>Não há solicitações pendentes no momento.</p>';
  }
  
  const body = `
    <h2>Relatório ${isMorning ? 'Matutino' : 'Vespertino'} de Solicitações</h2>
    <p>Prezado(a) Administrador(a),</p>
    <p>Segue o relatório de solicitações pendentes com seus respectivos prazos:</p>
    
    ${requestsTable}
    
    <p>Atenciosamente,<br>Sistema de Solicitações de TI</p>
  `;
  
  return { subject, body };
};

// Helper functions to convert enum values to readable text
const getRequestTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    'geral': 'Solicitação Geral',
    'sistemas': 'Problemas de Sistema',
    'ajuste_estoque': 'Ajuste de Estoque',
    'solicitacao_equipamento': 'Solicitação de Equipamento',
    'manutencao_preventiva': 'Manutenção Preventiva',
    'inventory': 'Inventário',
    'system': 'Sistema',
    'emergency': 'Emergência',
    'other': 'Outro'
  };
  return typeMap[type] || type;
};

const getRequestPriorityText = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    'baixa': '🟢 Baixa',
    'media': '🟡 Média',
    'alta': '🔴 Alta',
    'high': '🔴 Alta',
    'medium': '🟡 Média',
    'low': '🟢 Baixa'
  };
  return priorityMap[priority] || priority;
};

const getRequestStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'nova': '📋 Nova',
    'atribuida': '👤 Atribuída',
    'em_andamento': '⚙️ Em Andamento',
    'resolvida': '✅ Resolvida',
    'fechada': '🏁 Fechada',
    'new': '📋 Nova',
    'assigned': '👤 Atribuída',
    'in_progress': '⚙️ Em Andamento',
    'resolved': '✅ Resolvida',
    'closed': '🏁 Fechada'
  };
  return statusMap[status] || status;
};

const getStatusUpdateMessage = (status: string): string => {
  const messages: Record<string, string> = {
    'nova': 'Sua solicitação foi registrada e aguarda atribuição.',
    'atribuida': 'Sua solicitação foi atribuída a um técnico e será iniciada em breve.',
    'em_andamento': 'Nossa equipe está trabalhando na resolução da sua solicitação.',
    'resolvida': 'Sua solicitação foi resolvida com sucesso!',
    'fechada': 'Sua solicitação foi finalizada e arquivada.'
  };
  return messages[status] || 'Status da sua solicitação foi atualizado.';
};

const getUserDepartment = (userId: string): string => {
  // Buscar dados do usuário - implementar conforme necessário
  // Por enquanto, retornar valor padrão
  return 'Setor não informado';
};
