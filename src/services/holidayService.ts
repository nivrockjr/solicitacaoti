
import { Holiday } from '../types';
import { delay, cloneDeep } from './utils';
import { mockHolidays } from './mockData';

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

// Export holidays for use in other services
export { holidays };
