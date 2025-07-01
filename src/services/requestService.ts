import { ITRequest, RequestType, RequestPriority } from '../types';
import { delay, cloneDeep, createNotification } from './utils';
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
  const deadlineat = calculateDeadline(request.type, request.priority).toISOString();
  const newRequest = {
    id: uuidv4(),
    ...request,
    createdat,
    deadlineat,
    status: 'nova',
  };
  const { data, error } = await supabase.from('solicitacoes').insert([newRequest]).select().single();
  if (error) throw new Error('Erro ao criar solicitação');

  // Notificar todos os administradores
  const { data: adminUsers } = await supabase.from('usuarios').select('id').eq('role', 'admin');
  if (adminUsers && Array.isArray(adminUsers)) {
    for (const admin of adminUsers) {
      await createNotification({
        para: admin.id,
        mensagem: `Uma nova solicitação foi criada por ${request.requestername || 'um usuário'}.`,
        tipo: 'request_created'
      });
    }
  }
  return data as ITRequest;
};

export const updateRequest = async (id: string, updates: Partial<ITRequest>): Promise<ITRequest> => {
  const { data: oldRequest, error: oldError } = await supabase.from('solicitacoes').select('*').eq('id', id).single();
  if (oldError) throw new Error('Erro ao buscar solicitação para atualização');

  const { data, error } = await supabase
    .from('solicitacoes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error('Erro ao atualizar solicitação');

  // Notificações automáticas
  // 1. Se foi atribuída a um responsável
  if (updates.assignedto && updates.assignedto !== oldRequest.assignedto) {
    await createNotification({
      para: updates.assignedto,
      mensagem: `Você foi atribuído à solicitação #${id}.`,
      tipo: 'request_assigned'
    });
  }
  // 2. Se foi resolvida
  if (updates.status && (updates.status === 'resolvida' || updates.status === 'resolved') && oldRequest.status !== updates.status) {
    if (oldRequest.requesterid) {
      await createNotification({
        para: oldRequest.requesterid,
        mensagem: `Sua solicitação #${id} foi resolvida!`,
        tipo: 'request_resolved'
      });
    }
  }
  // 3. Se foi reaberta
  if (updates.status && (updates.status === 'reaberta') && oldRequest.status !== updates.status) {
    if (oldRequest.assignedto) {
      await createNotification({
        para: oldRequest.assignedto,
        mensagem: `A solicitação #${id} foi reaberta pelo solicitante.`,
        tipo: 'request_created'
      });
    }
  }
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
      deadlineDays = 5;
      break;
    case "sistemas":
      deadlineDays = 10;
      break;
    case "ajuste_estoque":
      deadlineDays = 2;
      break;
    case "solicitacao_equipamento":
      deadlineDays = 10;
      break;
    case "manutencao_preventiva":
      deadlineDays = 10;
      break;
    default:
      deadlineDays = 3;
  }
  if (priority === 'alta') {
    deadlineDays = Math.max(1, deadlineDays - 1);
  } else if (priority === 'baixa') {
    deadlineDays += 1;
  }
  // Soma dias corridos (não pula finais de semana ou feriados)
  const deadline = new Date(now);
  deadline.setDate(deadline.getDate() + deadlineDays);
  deadline.setHours(18, 0, 0, 0);
  return deadline;
};

// File upload real para Supabase Storage
export const uploadFile = async (file: File, requestId?: string): Promise<string> => {
  // Defina um caminho único para o arquivo, por exemplo, por solicitação
  const folder = requestId ? `solicitacao_${requestId}` : 'geral';
  const filePath = `${folder}/${file.name}`;
  const { data, error } = await supabase
    .storage
    .from('anexos-solicitacoes')
    .upload(filePath, file, { upsert: false });
  if (error) throw new Error('Erro ao enviar arquivo: ' + error.message);
  // Retorne apenas o caminho do arquivo para ser salvo no banco
  return filePath;
};

// Export requests for other services to use
// export { requests };
