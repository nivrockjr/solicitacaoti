import { format, isWeekend, addDays } from 'date-fns';
// import { holidays } from './holidayService';
import { createNotification as createNotificationFn } from './notificationService';

// Simulated API delay
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Clone deep to avoid direct mutations
export const cloneDeep = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Re-export createNotification for use in other services
export const createNotification = (notification: Parameters<typeof createNotificationFn>[0]) => {
  return createNotificationFn(notification);
};
