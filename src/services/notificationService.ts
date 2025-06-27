// Adicionar novos tipos de notificação
import { Notification } from '../types';
import { delay } from './utils';
// import { mockNotifications } from './mockData';
import { supabase } from '../lib/supabase';

// Helper function for deep cloning objects - moved from utils to avoid circular dependency
const cloneDeep = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// In-memory data store
// let notifications = cloneDeep(mockNotifications);

export const getNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase.from('notificacoes').select('*').eq('userid', userId);
  if (error) throw new Error('Erro ao buscar notificações');
  return data || [];
};

export const markNotificationAsRead = async (id: string): Promise<Notification> => {
  const { data, error } = await supabase.from('notificacoes').update({ isRead: true }).eq('id', id).select().single();
  if (error) throw new Error('Erro ao marcar notificação como lida');
  return data;
};

export const createNotification = async (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>): Promise<Notification> => {
  const newNotification = {
    ...notification,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('notificacoes').insert([newNotification]).select().single();
  if (error) throw new Error('Erro ao criar notificação');
  return data;
};

// Função para criar lembretes automáticos para solicitações sem atividade
export const createReminderNotifications = (requestId: string, assignedTo: string, requesterId: string, daysSinceLastActivity: number): void => {
  // Notificar o técnico responsável
  createNotification({
    userid: assignedTo,
    title: "Lembrete de Solicitação",
    message: `A solicitação ${requestId} está sem atividade há ${daysSinceLastActivity} dias. Por favor, verifique o status.`,
    type: "request_reminder",
    requestId
  });
  
  // Notificar o solicitante
  createNotification({
    userid: requesterId,
    title: "Atualização de Solicitação",
    message: `Sua solicitação ${requestId} está sendo acompanhada. Um lembrete foi enviado ao técnico responsável.`,
    type: "request_reminder",
    requestId
  });
};

// Export notifications for use in other services
// export { notifications };
