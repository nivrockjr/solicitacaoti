import { ITRequest, RequestType, RequestPriority } from '../types';
import { delay, cloneDeep, createNotification } from './utils';
// import { mockRequests } from './mockData';
// import { users } from './authService';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// In-memory data store
// let requests = cloneDeep(mockRequests);

export const getRequests = async (
  userId?: string,
  page: number = 1,
  pageSize: number = 10,
  status?: string | string[]
): Promise<{ data: ITRequest[], count: number }> => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase.from('solicitacoes').select('*', { count: 'exact' }).range(from, to);
  if (userId) query = query.eq('requesterid', userId);
  if (status) {
    if (Array.isArray(status)) {
      query = query.in('status', status);
    } else {
      query = query.eq('status', status);
    }
  }
  const { data, count, error } = await query;
  if (error) throw new Error('Erro ao buscar solicitações');
  return { data: data || [], count: count || 0 };
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
    createNotification({
      para: updates.assignedto,
      mensagem: `Você foi atribuído à solicitação #${id}.`,
      tipo: 'request_assigned',
      requestId: id
    });
    if (oldRequest.requesterid) {
      createNotification({
        para: oldRequest.requesterid,
        mensagem: `Sua solicitação foi atribuída para ${updates.assignedtoname || 'um responsável'}.`,
        tipo: 'request_assigned',
        requestId: id
      });
    }
  }
  // 1.1. Se foi iniciada (em andamento)
  if (updates.status && (updates.status === 'in_progress' || updates.status === 'em_andamento') && oldRequest.status !== updates.status) {
    if (oldRequest.requesterid) {
      createNotification({
        para: oldRequest.requesterid,
        mensagem: `Sua solicitação está em andamento.`,
        tipo: 'request_in_progress',
        requestId: id
      });
    }
  }
  // 2. Se foi resolvida
  if (updates.status && (updates.status === 'resolvida' || updates.status === 'resolved') && oldRequest.status !== updates.status) {
    if (oldRequest.requesterid) {
      createNotification({
        para: oldRequest.requesterid,
        mensagem: `Sua solicitação foi resolvida.`,
        tipo: 'request_resolved',
        requestId: id
      });
    }
  }
  // 3. Se foi reaberta
  if (updates.status && (updates.status === 'reaberta') && oldRequest.status !== updates.status) {
    if (oldRequest.assignedto) {
      createNotification({
        para: oldRequest.assignedto,
        mensagem: `A solicitação #${id} foi reaberta pelo solicitante.`,
        tipo: 'request_reopened',
        requestId: id
      });
    }
    if (oldRequest.requesterid) {
      createNotification({
        para: oldRequest.requesterid,
        mensagem: `Sua solicitação foi reaberta.`,
        tipo: 'request_reopened',
        requestId: id
      });
    }
  }
  return data;
};

export const deleteRequest = async (id: string): Promise<boolean> => {
  // Primeiro, remover todos os anexos do Storage
  // O padrão de upload é: pasta solicitacao_{id}/arquivo.ext
  // Vamos tentar remover a pasta inteira
  const { error: storageError } = await supabase.storage
    .from('anexos-solicitacoes')
    .remove([`solicitacao_${id}`]);
  if (storageError && storageError.message !== 'Object not found') {
    throw new Error('Erro ao remover anexos do Storage: ' + storageError.message);
  }

  // Agora, deletar a solicitação do banco
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
