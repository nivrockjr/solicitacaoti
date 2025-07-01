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

// Função utilitária para popular feriados de 2025
export const populateHolidays2025 = async () => {
  const holidays2025 = [
    { name: 'Ano Novo', date: '2025-01-01' },
    { name: 'Carnaval', date: '2025-03-03' },
    { name: 'Carnaval', date: '2025-03-04' },
    { name: 'Quarta-feira de Cinzas', date: '2025-03-05' },
    { name: 'São José', date: '2025-03-19' },
    { name: 'Sexta-feira Santa', date: '2025-04-18' },
    { name: 'Tiradentes', date: '2025-04-21' },
    { name: 'Anunciação do Senhor', date: '2025-03-25' },
    { name: 'Dia do Trabalho', date: '2025-05-01' },
    { name: 'Assunção de Nossa Senhora', date: '2025-08-15' },
    { name: 'Independência do Brasil', date: '2025-09-07' },
    { name: 'Nossa Senhora Aparecida', date: '2025-10-12' },
    { name: 'Dia de São Benedito', date: '2025-10-08' },
    { name: 'Finados', date: '2025-11-02' },
    { name: 'Proclamação da República', date: '2025-11-15' },
    { name: 'Consciência Negra', date: '2025-11-20' },
    { name: 'Imaculada Conceição', date: '2025-12-08' },
    { name: 'Natal', date: '2025-12-25' },
  ];
  for (const holiday of holidays2025) {
    try {
      await addHoliday(holiday);
    } catch (e) {
      // Ignora erro se já existir
      continue;
    }
  }
};
