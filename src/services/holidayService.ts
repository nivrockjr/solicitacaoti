
import { Holiday } from '../types';
import { mockHolidays } from './mockData';

// Helper function for deep cloning objects
const cloneDeep = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// In-memory data store
let holidays = cloneDeep(mockHolidays);

export const getHolidays = async (): Promise<Holiday[]> => {
  await delay(300);
  return holidays;
};

export const addHoliday = async (holiday: Omit<Holiday, 'id'>): Promise<Holiday> => {
  await delay(300);
  
  const newHoliday: Holiday = {
    ...holiday,
    id: `h${holidays.length + 1}`
  };
  
  holidays.push(newHoliday);
  
  return newHoliday;
};

// Simulated API delay - moved from utils to avoid circular dependency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Export holidays for use in other services
export { holidays };
