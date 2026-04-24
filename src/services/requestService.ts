import { ITRequest, RequestType, RequestPriority, RequestStatus } from '../types';
import { notificationService } from './notificationService';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { translate } from '../lib/utils';

/** 
 * Prazo (SLA) a partir da criação. 
 * Baseado na prioridade e tipo do chamado.
 */
function calculateDeadline(
  type: RequestType | null | undefined,
  priority: RequestPriority | null | undefined
): Date {
  const t = String(type ?? '').toLowerCase();
  const p = String(priority ?? '').toLowerCase();
  
  // Padrão Geral: 48 horas (2 dias) se nada for especificado
  let hours = 48;

  // Regras Oficiais por Tipo (SLA Principal)
  if (t === 'general' || t === 'geral') {
    hours = 120; // 5 dias
  } else if (t === 'systems' || t === 'sistemas' || t === 'equipment_request' || t === 'solicitacao_equipamento') {
    hours = 240; // 10 dias
  } else if (t === 'employee_lifecycle' || t === 'ciclo_colaborador') {
    hours = 120; // 5 dias
  } else if (t === 'ajuste_estoque') {
    hours = 24;  // 1 dia
  } else if (t === 'preventive_maintenance' || t === 'manutencao_preventiva') {
    hours = 120; // 5 dias (Padrão sugerido para Manutenção)
  }

  // Ajuste por Prioridade (Opcional: Alta pode reduzir o prazo em 50%, Baixa aumentar em 50%)
  // No entanto, para manter a fidelidade ao pedido do usuário, usaremos os prazos fixos.
  if (p === 'high' || p === 'alta') {
    // Para ajuste de estoque, mantém 24h. Para os outros, podemos reduzir se necessário, 
    // mas o usuário pediu especificamente os dias fixos.
    if (t === 'ajuste_estoque') hours = 24;
  }

  const d = new Date();
  d.setTime(d.getTime() + hours * 60 * 60 * 1000);
  return d;
}

/**
 * Utilitário para sanitizar nomes de arquivos
 */
const sanitizeFileName = (name: string): string => {
  return name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
};

export const getRequests = async (
  userEmailOrId?: string,
  page: number = 1,
  pageSize: number = 10,
  status?: string | string[],
  _logoutCallback?: () => void,
  filters?: {
    priority?: string[];
    type?: string[];
    search?: string;
    notStatus?: string;
    fullData?: boolean;
  }
): Promise<{ data: ITRequest[], count: number }> => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  const columns = '*';

  let query = supabase.from('solicitacoes').select(columns, { count: 'exact' });
  
  if (userEmailOrId) {
    query = query.ilike('requesteremail', userEmailOrId.toLowerCase());
  }
  
  if (status) {
    if (Array.isArray(status)) {
      const statusOr = status.map(s => `status.ilike.%${s}%`).join(',');
      query = query.or(statusOr);
    } else {
      query = query.ilike('status', `%${status}%`);
    }
  }
  
  if (filters?.priority && filters.priority.length > 0) {
    query = query.in('priority', filters.priority);
  }
  
  if (filters?.type && filters.type.length > 0) {
    query = query.in('type', filters.type);
  }
  
  if (filters?.search && filters.search.trim() !== '') {
    const search = filters.search.trim().toLowerCase();
    query = query.or(
      `description.ilike.%${search}%,id.ilike.%${search}%,requestername.ilike.%${search}%,requesteremail.ilike.%${search}%,title.ilike.%${search}%`
    );
  }
  
  if (filters?.notStatus) {
    query = query.not('status', 'eq', filters.notStatus);
  }
  
  query = query.order('createdat', { ascending: false }).range(from, to);
  
  const { data, count, error } = await query;
  if (error) {
    if (!import.meta.env.PROD) console.error('[getRequests] Erro:', error);
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
  
  let assignedto = null;
  let assignedtoname = null;
  let finalStatus: RequestStatus = 'new';
  
  // Atribuição automática para estoque
  if (request.type === 'ajuste_estoque') {
    try {
      const { data: nivaldoUser } = await supabase
        .from('usuarios')
        .select('id, name')
        .eq('name', 'Nivaldo')
        .eq('role', 'admin')
        .maybeSingle();
      
      if (nivaldoUser) {
        assignedto = nivaldoUser.id;
        assignedtoname = nivaldoUser.name;
        finalStatus = 'assigned';
      }
    } catch (error) {
      if (!import.meta.env.PROD) console.error('Erro na atribuição automática:', error);
    }
  }
  
  const newRequest = {
    ...request,
    createdat,
    deadlineat,
    status: finalStatus,
    assignedto,
    assignedtoname,
  };
  
  const { data, error } = await supabase.from('solicitacoes').insert([newRequest]).select().single();
  if (error) throw new Error('Erro ao criar solicitação');

  // Notificações
  await notificationService.notifyAdmins(
    `Nova solicitação criada por ${request.requestername || 'um usuário'}.`,
    'request_created',
    data.id
  );
  
  if (assignedto) {
    await notificationService.send({
      para: assignedto,
      mensagem: `Atribuído automaticamente à solicitação #${data.id}.`,
      tipo: 'request_assigned',
      request_id: data.id
    });
  }
  
  return data as ITRequest;
};

export const updateRequest = async (id: string, updates: Partial<ITRequest>): Promise<ITRequest> => {
  const { data: oldRequest, error: oldError } = await supabase.from('solicitacoes').select('*').eq('id', id).single();
  if (oldError) throw new Error('Erro ao buscar solicitação');

  const { data, error } = await supabase
    .from('solicitacoes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error('Erro ao atualizar solicitação');

  // Lógica de notificações simplificada
  let solicitanteId: string | null = null;
  if (oldRequest.requesteremail) {
    const { data: sUser } = await supabase.from('usuarios').select('id').eq('email', oldRequest.requesteremail).maybeSingle();
    solicitanteId = sUser?.id || null;
  }

  if (updates.assignedto && updates.assignedto !== oldRequest.assignedto) {
    await notificationService.send({ para: updates.assignedto, mensagem: `Atribuído à solicitação #${id}.`, tipo: 'request_assigned', request_id: id });
    if (solicitanteId) await notificationService.send({ para: solicitanteId, mensagem: `Sua solicitação #${id} foi atribuída.`, tipo: 'request_assigned', request_id: id });
  }
  
  if (updates.status && updates.status !== oldRequest.status) {
    const statusDesc = translate('status', updates.status);
    if (solicitanteId) await notificationService.send({ para: solicitanteId, mensagem: `Sua solicitação #${id} está ${statusDesc}.`, tipo: `request_${updates.status}`, request_id: id });
  }
  
  return data;
};

export const deleteRequest = async (id: string): Promise<boolean> => {
  // Limpar anexos no storage (opcional, silencia erro se falhar)
  try {
    await supabase.storage.from('anexos-solicitacoes').remove([`solicitacao_${id}`]);
  } catch (e) {}

  const { error } = await supabase.from('solicitacoes').delete().eq('id', id);
  if (error) throw new Error('Erro ao deletar solicitação');
  return true;
};

export const uploadFile = async (file: File, requestId?: string): Promise<string> => {
  const folder = requestId ? `solicitacao_${requestId}` : 'geral';
  const sanitized = sanitizeFileName(file.name);
  const uniqueName = `${uuidv4()}_${sanitized}`;
  const filePath = `${folder}/${uniqueName}`;
  
  const { error } = await supabase.storage.from('anexos-solicitacoes').upload(filePath, file);
  if (error) throw new Error('Erro ao enviar arquivo');
  
  return filePath;
};
