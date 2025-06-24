
// Adicionar novos tipos de notificação
import { Notification } from '../types';
import { delay } from './utils';
import { mockNotifications } from './mockData';

// Helper function for deep cloning objects - moved from utils to avoid circular dependency
const cloneDeep = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// In-memory data store
let notifications = cloneDeep(mockNotifications);

export const getNotifications = async (userId: string): Promise<Notification[]> => {
  await delay(200);
  return notifications.filter(n => n.userId === userId);
};

export const markNotificationAsRead = async (id: string): Promise<Notification> => {
  await delay(100);
  
  const index = notifications.findIndex(n => n.id === id);
  
  if (index === -1) {
    throw new Error("Notificação não encontrada");
  }
  
  notifications[index] = { ...notifications[index], isRead: true };
  
  return notifications[index];
};

export const createNotification = (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>): Notification => {
  const newNotification: Notification = {
    ...notification,
    id: `n${notifications.length + 1}`,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  
  notifications.push(newNotification);
  
  return newNotification;
};

// Função para criar lembretes automáticos para solicitações sem atividade
export const createReminderNotifications = (requestId: string, assignedTo: string, requesterId: string, daysSinceLastActivity: number): void => {
  // Notificar o técnico responsável
  createNotification({
    userId: assignedTo,
    title: "Lembrete de Solicitação",
    message: `A solicitação ${requestId} está sem atividade há ${daysSinceLastActivity} dias. Por favor, verifique o status.`,
    type: "request_reminder",
    requestId
  });
  
  // Notificar o solicitante
  createNotification({
    userId: requesterId,
    title: "Atualização de Solicitação",
    message: `Sua solicitação ${requestId} está sendo acompanhada. Um lembrete foi enviado ao técnico responsável.`,
    type: "request_reminder",
    requestId
  });
};

// Export notifications for use in other services
export { notifications };
