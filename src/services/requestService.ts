import { ITRequest, RequestType, RequestPriority, RequestStatus } from '../types';
import { notificationService } from './notificationService';
import { supabase } from '../lib/supabase';
import { translate, buildRequestNotificationType } from '../lib/utils';
import { getAdminForRequestType } from '../config/adminAssignments';
import { findAdminByName, getUserIdByEmail } from './userService';
import { deleteAttachmentFolder, uploadAttachment } from './storageService';

/**
 * SLA oficial em horas corridas, indexado pelo tipo de chamado.
 * Fonte da verdade: README.md § 6.1 e CLAUDE.md § 2.4.
 *
 * Variantes em PT-BR são aceitas como dados legados (banco contém 17 linhas
 * com type/status em PT-BR — migração planejada em DIAGNOSTICO.md Fase 1.14).
 */
const SLA_HOURS_BY_TYPE: Record<string, number> = {
  // EN-US — canônico
  general: 120,                  // 5 dias
  systems: 240,                  // 10 dias
  equipment_request: 240,        // 10 dias
  employee_lifecycle: 120,       // 5 dias (Onboarding / Offboarding / Treinamento)
  ajuste_estoque: 72,            // 3 dias
  preventive_maintenance: 960,   // 40 dias

  // PT-BR — legados, mantidos para compatibilidade com dados existentes.
  geral: 120,
  sistemas: 240,
  solicitacao_equipamento: 240,
  ciclo_colaborador: 120,
  manutencao_preventiva: 960,
};

/**
 * Calcula o prazo (deadline) a partir da criação, com base no tipo do chamado.
 * Lança erro se o tipo for desconhecido — não há SLA fallback silencioso.
 */
function calculateDeadline(
  type: RequestType | null | undefined,
  _priority: RequestPriority | null | undefined
): Date {
  const t = String(type ?? '').toLowerCase();
  const hours = SLA_HOURS_BY_TYPE[t];

  if (hours === undefined) {
    throw new Error(`Tipo de solicitação desconhecido: "${type}". Verifique o tipo enviado em RequestType.`);
  }

  const d = new Date();
  d.setTime(d.getTime() + hours * 60 * 60 * 1000);
  return d;
}

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

export const getRequestById = async (id: string): Promise<ITRequest> => {
  const { data, error } = await supabase.from('solicitacoes').select('*').eq('id', id).single();
  if (error) throw new Error('Solicitação não encontrada');
  return data;
};

/**
 * Busca reversa: encontra todas as solicitações cujo `metadata.form_data.relatedOnboardingId`
 * aponta para o `onboardingId` informado. Usado para descobrir os offboardings vinculados
 * a um onboarding específico no fluxo de Ciclo de Vida do Colaborador.
 *
 * Retorna `[]` se não houver vínculos. Erros são silenciados aqui (caller pode usar o
 * default vazio com segurança); para logar, ler via try/catch externo.
 */
export const findOffboardingsByOnboardingId = async (onboardingId: string): Promise<ITRequest[]> => {
  const { data } = await supabase
    .from('solicitacoes')
    .select('*')
    .contains('metadata', { form_data: { relatedOnboardingId: onboardingId } });
  return (data ?? []) as ITRequest[];
};

export const createRequest = async (request: Omit<ITRequest, 'id' | 'createdat' | 'deadlineat'>): Promise<ITRequest> => {
  const now = new Date();
  const createdat = now.toISOString();
  const deadlineat = calculateDeadline(request.type, request.priority).toISOString();
  
  let assignedto = null;
  let assignedtoname = null;
  let finalStatus: RequestStatus = 'new';
  
  // Atribuição automática conforme regras declaradas em src/config/adminAssignments.ts
  const autoAssignment = request.type ? getAdminForRequestType(request.type) : null;
  if (autoAssignment) {
    try {
      const assignedAdmin = await findAdminByName(autoAssignment.adminName);

      if (assignedAdmin) {
        assignedto = assignedAdmin.id;
        assignedtoname = assignedAdmin.name;
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
    solicitanteId = await getUserIdByEmail(oldRequest.requesteremail);
  }

  if (updates.assignedto && updates.assignedto !== oldRequest.assignedto) {
    await notificationService.send({ para: updates.assignedto, mensagem: `Atribuído à solicitação #${id}.`, tipo: 'request_assigned', request_id: id });
    if (solicitanteId) await notificationService.send({ para: solicitanteId, mensagem: `Sua solicitação #${id} foi atribuída.`, tipo: 'request_assigned', request_id: id });
  }
  
  if (updates.status && updates.status !== oldRequest.status) {
    const statusDesc = translate('status', updates.status);
    if (solicitanteId) await notificationService.send({ para: solicitanteId, mensagem: `Sua solicitação #${id} está ${statusDesc}.`, tipo: buildRequestNotificationType(updates.status), request_id: id });
  }
  
  return data;
};

export const deleteRequest = async (id: string): Promise<boolean> => {
  // Limpar anexos no storage (opcional — falha aqui não bloqueia a exclusão da linha).
  try {
    await deleteAttachmentFolder(id);
  } catch (e) {
    if (!import.meta.env.PROD) console.warn('Falha ao limpar anexos do Storage (não-crítico):', e);
  }

  const { error } = await supabase.from('solicitacoes').delete().eq('id', id);
  if (error) throw new Error('Erro ao deletar solicitação');
  return true;
};

/**
 * Wrapper retrocompatível com o nome histórico `uploadFile`. Delega ao
 * `storageService.uploadAttachment`. Mantido para preservar callers existentes
 * em RequestDetailPage e RequestForm.
 */
export const uploadFile = (file: File, requestId?: string): Promise<string> =>
  uploadAttachment(file, requestId);
