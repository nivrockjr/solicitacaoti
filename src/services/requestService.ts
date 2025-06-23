
import { ITRequest, RequestType, RequestPriority } from '../types';
import { delay, cloneDeep, createNotification, addBusinessDays } from './utils';
import { mockRequests } from './mockData';
import { users } from './authService';
import { 
  sendEmail, 
  generateRequestConfirmationEmail, 
  generateStatusUpdateEmail,
  generateNewRequestAlertEmail 
} from './emailService';

// In-memory data store
let requests = cloneDeep(mockRequests);

export const getRequests = async (userId?: string): Promise<ITRequest[]> => {
  await delay(300);
  
  if (userId) {
    return requests.filter(r => r.requesterId === userId);
  }
  
  return requests;
};

export const getRequestById = async (id: string): Promise<ITRequest | undefined> => {
  await delay(200);
  return requests.find(r => r.id === id);
};

export const createRequest = async (request: Omit<ITRequest, 'id' | 'createdAt' | 'deadlineAt'>): Promise<ITRequest> => {
  await delay(500);
  
  const now = new Date();
  const dia = String(now.getDate()).padStart(2, '0');
  const mes = String(now.getMonth() + 1).padStart(2, '0');
  const ano = String(now.getFullYear());
  const anoAbreviado = ano.slice(-2);
  
  // Conta o número de solicitações para o dia atual para gerar o número sequencial
  const today = now.toISOString().split('T')[0];
  const todayRequests = requests.filter(r => r.createdAt.startsWith(today)).length + 1;
  const sequentialNumber = String(todayRequests).padStart(6, '0');
  
  // Formato: DiaMesAnoAbreviado-Sequencial (DDMMAA-000000)
  const newId = `${dia}${mes}${anoAbreviado}-${sequentialNumber}`;
  
  const createdAtStr = now.toISOString();
  
  // Calculate deadline based on type
  const deadline = calculateDeadline(request.type, request.priority);
  
  const newRequest: ITRequest = {
    ...request,
    id: newId,
    createdAt: createdAtStr,
    deadlineAt: deadline.toISOString(),
    status: 'nova'
  };
  
  requests.push(newRequest);
  
  // Create notifications
  createNotification({
    userId: newRequest.requesterId,
    title: "Solicitação Enviada",
    message: `Sua solicitação ${newId} foi enviada com sucesso`,
    type: "request_created",
    requestId: newId
  });
  
  // Notify admins
  users.filter(u => u.role === 'admin').forEach(admin => {
    createNotification({
      userId: admin.id,
      title: "Nova Solicitação",
      message: `Uma nova solicitação de prioridade ${request.priority} ${newId} foi enviada`,
      type: "request_created",
      requestId: newId
    });
  });
  
  // Send email confirmation to requester
  const requesterUser = users.find(u => u.id === request.requesterId);
  if (requesterUser) {
    const { subject, body } = generateRequestConfirmationEmail(newRequest);
    sendEmail(requesterUser.email, subject, body).catch(console.error);
  }
  
  // Send email notification to admins about new request
  users.filter(u => u.role === 'admin').forEach(admin => {
    const { subject, body } = generateNewRequestAlertEmail(newRequest);
    sendEmail(admin.email, subject, body).catch(console.error);
  });
  
  return newRequest;
};

export const updateRequest = async (id: string, updates: Partial<ITRequest>): Promise<ITRequest> => {
  await delay(500);
  
  const index = requests.findIndex(r => r.id === id);
  
  if (index === -1) {
    throw new Error("Solicitação não encontrada");
  }
  
  const oldRequest = requests[index];
  const oldStatus = oldRequest.status;
  
  // Check for status change to handle notifications
  if (updates.status && updates.status !== oldRequest.status) {
    if (updates.status === 'atribuida') {
      createNotification({
        userId: oldRequest.requesterId,
        title: "Solicitação Atribuída",
        message: `Sua solicitação ${id} foi atribuída a um técnico`,
        type: "request_assigned",
        requestId: id
      });
    } else if (updates.status === 'resolvida') {
      createNotification({
        userId: oldRequest.requesterId,
        title: "Solicitação Resolvida",
        message: `Sua solicitação ${id} foi resolvida`,
        type: "request_resolved",
        requestId: id
      });
    }
    
    // Send email notification about status change
    const requesterUser = users.find(u => u.id === oldRequest.requesterId);
    if (requesterUser) {
      const updatedRequest = { ...oldRequest, ...updates };
      const { subject, body } = generateStatusUpdateEmail(updatedRequest, oldStatus);
      sendEmail(requesterUser.email, subject, body).catch(console.error);
    }
  }
  
  // Check for deadline change
  if (updates.deadlineAt && updates.deadlineAt !== oldRequest.deadlineAt) {
    createNotification({
      userId: oldRequest.requesterId,
      title: "Prazo Atualizado",
      message: `O prazo para sua solicitação ${id} foi alterado`,
      type: "deadline_changed",
      requestId: id
    });
  }
  
  requests[index] = { ...oldRequest, ...updates };
  
  return requests[index];
};

// Helper function to calculate request deadline based on type and priority
const calculateDeadline = (type: RequestType, priority: RequestPriority): Date => {
  const now = new Date();
  
  let deadlineDays: number;
  
  switch (type) {
    case "geral":
      deadlineDays = 1; // 1 dia para solicitações gerais
      break;
    case "sistemas":
      deadlineDays = 10; // 10 dias para solicitações de sistemas
      break;
    case "ajuste_estoque":
      deadlineDays = 2; // 2 dias para ajustes de estoque
      break;
    case "solicitacao_equipamento":
      deadlineDays = 10; // 10 dias para solicitações de equipamentos
      break;
    case "manutencao_preventiva":
      deadlineDays = 5; // 5 dias para manutenção preventiva
      break;
    default:
      deadlineDays = 3; // Default para outros casos
  }
  
  // Adjust based on priority
  if (priority === 'alta') {
    deadlineDays = Math.max(1, deadlineDays - 1);
  } else if (priority === 'baixa') {
    deadlineDays += 1;
  }
  
  return addBusinessDays(now, deadlineDays);
};

// File upload simulation
export const uploadFile = async (file: File): Promise<string> => {
  await delay(1000); // Simulate upload time
  return URL.createObjectURL(file); // In a real app, this would be a URL from a file storage service
};

// Export requests for other services to use
export { requests };
