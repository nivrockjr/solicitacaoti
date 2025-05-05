
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

// Export notifications for use in other services
export { notifications };
