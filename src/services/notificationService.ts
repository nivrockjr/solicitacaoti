// Adicionar novos tipos de notificação
import { Notification } from '../types';
import { delay } from './utils';
// import { mockNotifications } from './mockData';

// Helper function for deep cloning objects - moved from utils to avoid circular dependency
const cloneDeep = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// In-memory data store
// let notifications = cloneDeep(mockNotifications);

const API_BASE = 'https://notificacoes-backend.onrender.com';

export const getNotifications = async (userId: string): Promise<Notification[]> => {
  const res = await fetch(`${API_BASE}/notificacoes/${userId}`);
  if (!res.ok) throw new Error('Erro ao buscar notificações');
  return await res.json();
};

export const markNotificationAsRead = async (id: string): Promise<Notification> => {
  const res = await fetch(`${API_BASE}/notificacoes/${id}/lida`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Erro ao marcar notificação como lida');
  return await res.json();
};

export const createNotification = async (notification: { para: string, mensagem: string, tipo: string }): Promise<any> => {
  const res = await fetch(`${API_BASE}/notificacoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notification),
  });
  if (!res.ok) throw new Error('Erro ao criar notificação');
  return await res.json();
};

// Função para criar lembretes automáticos para solicitações sem atividade
export const createReminderNotifications = (requestId: string, assignedTo: string, requesterId: string, daysSinceLastActivity: number): void => {
  // Notificar o técnico responsável
  createNotification({
    para: assignedTo,
    mensagem: `A solicitação ${requestId} está sem atividade há ${daysSinceLastActivity} dias. Por favor, verifique o status.`,
    tipo: "request_reminder"
  });
  
  // Notificar o solicitante
  createNotification({
    para: requesterId,
    mensagem: `Sua solicitação ${requestId} está sendo acompanhada. Um lembrete foi enviado ao técnico responsável.`,
    tipo: "request_reminder"
  });
};

// Export notifications for use in other services
// export { notifications };
