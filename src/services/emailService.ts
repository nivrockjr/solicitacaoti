import { User, ITRequest, RequestStatus } from '../types';
import { format } from 'date-fns';

// Email configuration
const EMAIL_CONFIG = {
  host: 'smtp.kinghost.net',
  port: 587,
  secure: false, // As specified, no encryption
  auth: {
    user: '', // To be filled with the user's email from the system
    pass: ''  // To be filled with the password from the system
  }
};

// In a real implementation with Supabase
export const sendEmail = async (to: string, subject: string, body: string): Promise<boolean> => {
  console.log(`Sending email to: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${body}`);
  
  try {
    // For demonstration - this would call the Supabase Edge Function
    // In a real implementation with Supabase, you would use:
    // return await fetch('https://your-supabase-project.functions.supabase.co/send-email', {
    //   method: 'POST',
    //   body: JSON.stringify({ to, subject, body, config: EMAIL_CONFIG }),
    //   headers: { 
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${supabaseApiKey}`
    //   }
    // }).then(res => res.ok);
    
    // For now we'll simulate a successful email send for the frontend demo
    return new Promise(resolve => {
      setTimeout(() => resolve(true), 500);
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Email templates
export const generateRequestConfirmationEmail = (request: ITRequest): { subject: string; body: string } => {
  const subject = `Confirmação de Solicitação - ${request.id}`;
  
  const body = `
    <h2>Solicitação Recebida</h2>
    <p>Olá ${request.requesterName},</p>
    <p>Sua solicitação de TI foi recebida com sucesso pelo nosso time.</p>
    
    <h3>Detalhes da Solicitação:</h3>
    <ul>
      <li><strong>Número:</strong> ${request.id}</li>
      <li><strong>Tipo:</strong> ${getRequestTypeText(request.type)}</li>
      <li><strong>Prioridade:</strong> ${getRequestPriorityText(request.priority)}</li>
      <li><strong>Data de Criação:</strong> ${format(new Date(request.createdAt), 'dd/MM/yyyy HH:mm')}</li>
      <li><strong>Prazo:</strong> ${format(new Date(request.deadlineAt), 'dd/MM/yyyy HH:mm')}</li>
    </ul>
    
    <p>Sua solicitação será atendida em breve, conforme a prioridade e prazo estabelecidos.</p>
    
    <h3>Acompanhamento:</h3>
    <p>Você pode acompanhar o status da sua solicitação diretamente no sistema ou aguardar nossas atualizações por e-mail.</p>
    
    <p>Agradecemos pela sua solicitação.</p>
    <p>Atenciosamente,<br>Time de TI</p>
  `;
  
  return { subject, body };
};

export const generateStatusUpdateEmail = (request: ITRequest, oldStatus: RequestStatus): { subject: string; body: string } => {
  const subject = `Atualização de Solicitação - ${request.id}`;
  
  const body = `
    <h2>Atualização de Solicitação</h2>
    <p>Olá ${request.requesterName},</p>
    <p>Sua solicitação de TI teve uma atualização de status.</p>
    
    <h3>Detalhes da Solicitação:</h3>
    <ul>
      <li><strong>Número:</strong> ${request.id}</li>
      <li><strong>Status Anterior:</strong> ${getRequestStatusText(oldStatus)}</li>
      <li><strong>Status Atual:</strong> ${getRequestStatusText(request.status)}</li>
    </ul>
    
    ${request.status === 'resolvida' || request.status === 'fechada' ? `
    <p>Caso necessário, você pode visualizar os detalhes da resolução acessando o sistema.</p>
    ` : ''}
    
    <p>Atenciosamente,<br>Time de TI</p>
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

export const generateNewRequestAlertEmail = (request: ITRequest): { subject: string; body: string } => {
  const subject = `NOVA Solicitação Registrada - ${request.id}`;
  
  const body = `
    <h2>Nova Solicitação Registrada</h2>
    <p>Prezado(a) Administrador(a),</p>
    <p>Uma nova solicitação foi registrada no sistema.</p>
    
    <h3>Detalhes da Solicitação:</h3>
    <ul>
      <li><strong>Número:</strong> ${request.id}</li>
      <li><strong>Solicitante:</strong> ${request.requesterName}</li>
      <li><strong>Tipo:</strong> ${getRequestTypeText(request.type)}</li>
      <li><strong>Prioridade:</strong> ${getRequestPriorityText(request.priority)}</li>
      <li><strong>Prazo:</strong> ${format(new Date(request.deadlineAt), 'dd/MM/yyyy HH:mm')}</li>
    </ul>
    
    <h3>Descrição:</h3>
    <p>${request.description}</p>
    
    <p>Por favor, acesse o sistema para gerenciar esta solicitação.</p>
    
    <p>Atenciosamente,<br>Sistema de Solicitações de TI</p>
  `;
  
  return { subject, body };
};

// Helper functions to convert enum values to readable text
const getRequestTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    'geral': 'Geral',
    'sistemas': 'Sistemas',
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
    'baixa': 'Baixa',
    'media': 'Média',
    'alta': 'Alta',
    'high': 'Alta',
    'medium': 'Média',
    'low': 'Baixa'
  };
  return priorityMap[priority] || priority;
};

const getRequestStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'nova': 'Nova',
    'atribuida': 'Atribuída',
    'em_andamento': 'Em Andamento',
    'resolvida': 'Resolvida',
    'fechada': 'Fechada',
    'new': 'Nova',
    'assigned': 'Atribuída',
    'in_progress': 'Em Andamento',
    'resolved': 'Resolvida',
    'closed': 'Fechada'
  };
  return statusMap[status] || status;
};
