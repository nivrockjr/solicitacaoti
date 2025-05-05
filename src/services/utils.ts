
import { format, isWeekend, addDays } from 'date-fns';

// Simulated API delay
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Clone deep to avoid direct mutations
export const cloneDeep = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Helper for adding business days (skipping weekends and holidays)
export const addBusinessDays = (date: Date, days: number): Date => {
  let currentDate = new Date(date);
  let remainingDays = days;
  
  while (remainingDays > 0) {
    currentDate = addDays(currentDate, 1);
    
    // Skip weekends and holidays
    if (!isBusinessDay(currentDate)) {
      continue;
    }
    
    remainingDays--;
  }
  
  // Set time to end of business day (18:00)
  currentDate.setHours(18, 0, 0, 0);
  
  return currentDate;
};

export const addBusinessHours = (date: Date, hours: number): Date => {
  let currentDate = new Date(date);
  let remainingHours = hours;
  
  while (remainingHours > 0) {
    // Add one hour
    currentDate = new Date(currentDate.getTime() + 60 * 60 * 1000);
    
    // If outside business hours (8am-6pm) or not a business day, skip
    const hour = currentDate.getHours();
    if (hour < 8 || hour >= 18 || !isBusinessDay(currentDate)) {
      // If hour < 8, move to 8am
      if (hour < 8) {
        currentDate.setHours(8, 0, 0, 0);
      }
      // If hour >= 18 or weekend/holiday, move to next business day at 8am
      else {
        currentDate = addDays(currentDate, 1);
        currentDate.setHours(8, 0, 0, 0);
        
        // Keep checking until we find a business day
        while (!isBusinessDay(currentDate)) {
          currentDate = addDays(currentDate, 1);
        }
      }
      continue;
    }
    
    remainingHours--;
  }
  
  return currentDate;
};

export const isBusinessDay = (date: Date): boolean => {
  // Check if it's a weekend
  if (isWeekend(date)) {
    return false;
  }
  
  // Check if it's a holiday - now we'll directly import holidays when needed
  // This breaks the circular dependency
  const { holidays } = require('./holidayService');
  const dateString = format(date, 'yyyy-MM-dd');
  return !holidays.some(holiday => holiday.date === dateString);
};

// Re-export createNotification for use in other services
// Using require to break circular dependency
export const createNotification = (...args: any[]) => {
  const { createNotification: createNotificationFn } = require('./notificationService');
  return createNotificationFn(...args);
};
