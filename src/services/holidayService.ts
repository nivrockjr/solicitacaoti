import { Holiday } from '../types';
import { supabase } from '../lib/supabase';

export const getHolidays = async (): Promise<Holiday[]> => {
  const { data, error } = await supabase.from('feriados').select('*');
  if (error) throw new Error('Erro ao buscar feriados');
  return data || [];
};

export const addHoliday = async (holiday: Omit<Holiday, 'id'>): Promise<Holiday> => {
  const { data, error } = await supabase.from('feriados').insert([holiday]).select().single();
  if (error) throw new Error('Erro ao adicionar feriado');
  return data;
};
