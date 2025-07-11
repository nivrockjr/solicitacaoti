import { ITRequest, RequestType, RequestPriority } from '../types';
import { delay, cloneDeep } from './utils';
// import { mockRequests } from './mockData';
// import { users } from './authService';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// In-memory data store
// let requests = cloneDeep(mockRequests);

export const getRequests = async (
  userEmailOrId?: string, // agora pode ser email (para comum) ou undefined (para admin)
  page: number = 1,
  pageSize: number = 10,
  status?: string | string[],
  logoutCallback?: () => void,
  filters?: {
    priority?: string[];
    type?: string[];
    search?: string;
    notStatus?: string; // Adicionado para filtrar status diferente
  }
): Promise<{ data: ITRequest[], count: number }> => {
  if (process.env.NODE_ENV !== 'production') console.log('[getRequests] Parâmetros:', { userEmailOrId, page, pageSize, status, filters });
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase.from('solicitacoes').select('*', { count: 'exact' });
  // Filtro por usuário comum
  if (userEmailOrId) {
    query = query.ilike('requesteremail', userEmailOrId.toLowerCase());
  }
  // Filtro por status (case-insensitive, múltiplos valores)
  if (status) {
    if (Array.isArray(status)) {
      // Monta filtro or com ilike para cada status
      const statusOr = status.map(s => `status.ilike.%${s}%`).join(',');
      query = query.or(statusOr);
    } else {
      query = query.ilike('status', `%${status}%`);
    }
  }
  // Filtro por prioridade
  if (filters?.priority && filters.priority.length > 0) {
    query = query.in('priority', filters.priority);
  }
  // Filtro por tipo
  if (filters?.type && filters.type.length > 0) {
    query = query.in('type', filters.type);
  }
  // Filtro de busca
  if (filters?.search && filters.search.trim() !== '') {
    const search = filters.search.trim().toLowerCase();
    query = query.or(`description.ilike.%${search}%,id.ilike.%${search}%,requestername.ilike.%${search}%,requesteremail.ilike.%${search}%`);
  }
  // Filtro de status diferente (notStatus)
  if (filters?.notStatus) {
    query = query.not('status', 'eq', filters.notStatus);
  }
  // Ordenação e paginação
  query = query.order('createdat', { ascending: false }).range(from, to);
  if (process.env.NODE_ENV !== 'production') console.log('[getRequests] Query:', query);
  const { data, count, error } = await query;
  if (process.env.NODE_ENV !== 'production') console.log('[getRequests] Resultado:', { data, count, error });
  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[getRequests] Erro ao buscar solicitações:', error);
    throw new Error('Erro ao buscar solicitações');
  }
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
  console.log('[CREATE REQUEST] Retorno do insert:', data, error);
  if (error) throw new Error('Erro ao criar solicitação');

  // Notificar todos os administradores
  const { data: adminUsers } = await supabase.from('usuarios').select('id').eq('role', 'admin');
  if (adminUsers && Array.isArray(adminUsers)) {
    for (const admin of adminUsers) {
      try {
        const notificationPayload = {
          para: admin.id,
          mensagem: `Uma nova solicitação foi criada por ${request.requestername || 'um usuário'}.`,
          tipo: 'request_created',
          request_id: data.id // novo id customizado
        };
        console.log('[NOTIFICAÇÃO] Payload enviado para o Supabase:', notificationPayload);
        if (!notificationPayload.para || !notificationPayload.mensagem || !notificationPayload.tipo || !notificationPayload.request_id) {
          throw new Error('Payload de notificação incompleto!');
        }
        // Validação extra: request_id deve ser string não vazia
        if (typeof notificationPayload.request_id !== 'string' || notificationPayload.request_id.length < 10) {
          throw new Error('request_id inválido no payload de notificação!');
        }
        // Fim das validações
        await supabase.from('notificacoes').insert([notificationPayload]);
      } catch (e) {
        // Apenas loga o erro, não interrompe o fluxo
        console.error('Erro ao notificar admin:', e);
      }
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

  // Buscar id do solicitante pelo requesteremail
  let solicitanteId: string | null = null;
  if (oldRequest.requesteremail) {
    const { data: solicitanteUser } = await supabase.from('usuarios').select('id').eq('email', oldRequest.requesteremail).single();
    if (solicitanteUser && solicitanteUser.id) {
      solicitanteId = solicitanteUser.id;
    }
  }

  // Notificações automáticas
  // 1. Se foi atribuída a um responsável
  if (updates.assignedto && updates.assignedto !== oldRequest.assignedto) {
    // Notifica o responsável atribuído
    await supabase.from('notificacoes').insert([{
      para: updates.assignedto,
      mensagem: `Você foi atribuído à solicitação #${id}.`,
      tipo: 'request_assigned',
      request_id: id
    }]);
    // Notifica o solicitante
    if (solicitanteId) {
      await supabase.from('notificacoes').insert([{
        para: solicitanteId,
        mensagem: `Sua solicitação #${id} foi atribuída a um responsável.`,
        tipo: 'request_assigned',
        request_id: id
      }]);
    }
  }
  // 1.1. Se foi iniciada (em andamento)
  if (updates.status && (updates.status === 'in_progress' || updates.status === 'em_andamento') && oldRequest.status !== updates.status) {
    // Notifica o solicitante
    if (solicitanteId) {
      await supabase.from('notificacoes').insert([{
        para: solicitanteId,
        mensagem: `Sua solicitação #${id} foi iniciada e está em andamento.`,
        tipo: 'request_in_progress',
        request_id: id
      }]);
    }
  }
  // 2. Se foi resolvida
  if (updates.status && (updates.status === 'resolvida' || updates.status === 'resolved') && oldRequest.status !== updates.status) {
    if (solicitanteId) {
      await supabase.from('notificacoes').insert([{
        para: solicitanteId,
        mensagem: `Sua solicitação foi resolvida.`,
        tipo: 'request_resolved',
        request_id: id
      }]);
    }
  }
  // 3. Se foi reaberta
  if (updates.status && (updates.status === 'reaberta') && oldRequest.status !== updates.status) {
    // Notifica o responsável atribuído
    if (oldRequest.assignedto) {
      await supabase.from('notificacoes').insert([{
        para: oldRequest.assignedto,
        mensagem: `A solicitação #${id} foi reaberta pelo solicitante.`,
        tipo: 'request_reopened',
        request_id: id
      }]);
    }
    // Notifica o solicitante
    if (solicitanteId) {
      await supabase.from('notificacoes').insert([{
        para: solicitanteId,
        mensagem: `Sua solicitação foi reaberta.`,
        tipo: 'request_reopened',
        request_id: id
      }]);
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
      deadlineDays = 5;
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

// Função utilitária para sanitizar nomes de arquivos para o Supabase Storage
function sanitizeFileName(name: string) {
  return name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/\s+/g, "_") // troca espaços por underline
    .replace(/[^a-zA-Z0-9._-]/g, ""); // remove outros caracteres especiais
}

// File upload real para Supabase Storage
export const uploadFile = async (file: File, requestId?: string): Promise<string> => {
  // Defina um caminho único para o arquivo, por exemplo, por solicitação
  const folder = requestId ? `solicitacao_${requestId}` : 'geral';
  const sanitized = sanitizeFileName(file.name);
  const uniqueName = `${uuidv4()}_${sanitized}`;
  const filePath = `${folder}/${uniqueName}`;
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
