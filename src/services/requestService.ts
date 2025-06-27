import { ITRequest, RequestType, RequestPriority } from '../types';
import { delay, cloneDeep, createNotification, addBusinessDays } from './utils';
// import { mockRequests } from './mockData';
// import { users } from './authService';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// In-memory data store
// let requests = cloneDeep(mockRequests);

export const getRequests = async (userId?: string): Promise<ITRequest[]> => {
  let query = supabase.from('solicitacoes').select('*');
  if (userId) query = query.eq('requesterid', userId);
  const { data, error } = await query;
  if (error) throw new Error('Erro ao buscar solicitações');
  return data || [];
};

export const getRequestById = async (id: string): Promise<ITRequest | undefined> => {
  const { data, error } = await supabase.from('solicitacoes').select('*').eq('id', id).single();
  if (error) throw new Error('Solicitação não encontrada');
  return data;
};

export const createRequest = async (request: Omit<ITRequest, 'id' | 'createdat' | 'deadlineat'>): Promise<ITRequest> => {
  const now = new Date();
  const createdat = now.toISOString();
  const deadlineat = createdat;
  const newRequest = {
    id: uuidv4(),
    ...request,
    createdat,
    deadlineat,
    status: 'nova',
  };
  const { data, error } = await supabase.from('solicitacoes').insert([newRequest]).select().single();
  if (error) throw new Error('Erro ao criar solicitação');
  return data as ITRequest;
};

export const updateRequest = async (id: string, updates: Partial<ITRequest>): Promise<ITRequest> => {
  const { data, error } = await supabase
    .from('solicitacoes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error('Erro ao atualizar solicitação');
  return data;
};

export const deleteRequest = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('solicitacoes').delete().eq('id', id);
  if (error) throw new Error('Erro ao deletar solicitação');
  return true;
};

// Helper function to calculate request deadline based on type and priority
const calculateDeadline = (type: RequestType, priority: RequestPriority): Date => {
  const now = new Date();
  
  let deadlineDays: number;
  
  switch (type) {
    case "geral":
      deadlineDays = 1; // 1 dia para solicitações gerais
      break;
    case "sistemas":
      deadlineDays = 10; // 10 dias para solicitações de sistemas
      break;
    case "ajuste_estoque":
      deadlineDays = 2; // 2 dias para ajustes de estoque
      break;
    case "solicitacao_equipamento":
      deadlineDays = 10; // 10 dias para solicitações de equipamentos
      break;
    case "manutencao_preventiva":
      deadlineDays = 5; // 5 dias para manutenção preventiva
      break;
    default:
      deadlineDays = 3; // Default para outros casos
  }
  
  // Adjust based on priority
  if (priority === 'alta') {
    deadlineDays = Math.max(1, deadlineDays - 1);
  } else if (priority === 'baixa') {
    deadlineDays += 1;
  }
  
  return addBusinessDays(now, deadlineDays);
};

// File upload simulation
export const uploadFile = async (file: File): Promise<string> => {
  await delay(1000); // Simulate upload time
  return URL.createObjectURL(file); // In a real app, this would be a URL from a file storage service
};

// Export requests for other services to use
// export { requests };
