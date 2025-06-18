import { supabase } from '@/lib/supabase';
import { ITRequest } from '@/types';
import { Json } from '@/integrations/supabase/types';
import { z } from 'zod';

export interface SupabaseRequest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  assigned_to?: string;
  attachments?: Json;
  comments?: Json;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
}

// Esquema de validação para ITRequest usando Zod
const ITRequestSchema = z.object({
  title: z.string().min(3, 'Título muito curto'),
  description: z.string().min(5, 'Descrição muito curta'),
  type: z.string(),
  priority: z.string(),
  status: z.string().optional(),
  assignedTo: z.string().optional().nullable(),
  attachments: z.any().optional(),
  comments: z.any().optional(),
  resolution: z.string().optional().nullable(),
});

// Converter dados do Supabase para o formato da aplicação
function convertSupabaseToRequest(data: SupabaseRequest, profiles: any[] = []): ITRequest {
  const userProfile = profiles.find(p => p.id === data.user_id);
  let attachments = [];
  let comments = [];
  // Protege contra JSON malformado
  try {
    attachments = Array.isArray(data.attachments) ? data.attachments :
      (typeof data.attachments === 'string' ? JSON.parse(data.attachments) : []);
  } catch (e) {
    attachments = [];
  }
  try {
    comments = Array.isArray(data.comments) ? data.comments :
      (typeof data.comments === 'string' ? JSON.parse(data.comments) : []);
  } catch (e) {
    comments = [];
  }
  return {
    id: data.id,
    requesterId: data.user_id,
    requesterName: userProfile?.name || 'Usuário',
    requesterEmail: userProfile?.email || '',
    title: data.title,
    description: data.description,
    type: data.type as any,
    priority: data.priority as any,
    status: data.status as any,
    createdAt: data.created_at,
    deadlineAt: new Date(new Date(data.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: data.assigned_to,
    attachments,
    comments,
    resolution: data.resolution_notes,
    resolvedAt: data.resolved_at,
  };
}

/**
 * Busca requisições do usuário (ou todas, se userId não for informado).
 * Valida e converte os dados recebidos do Supabase.
 */
export const getRequests = async (userId?: string): Promise<ITRequest[]> => {
  try {
    let query = supabase.from('it_requests').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data: requests, error: requestsError } = await query.order('created_at', { ascending: false });
    if (requestsError) throw new Error(`Erro ao buscar requisições: ${requestsError.message}`);
    // Buscar perfis dos usuários para obter nomes e emails
    const userIds = [...new Set(requests?.map(r => r.user_id) || [])];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .in('id', userIds);
    if (profilesError) throw new Error(`Erro ao buscar perfis: ${profilesError.message}`);
    return (requests || []).map(req => convertSupabaseToRequest(req, profiles || []));
  } catch (error) {
    console.error('Error fetching requests:', error);
    return [];
  }
};

/**
 * Cria uma nova requisição de TI após validar os dados.
 * @throws Error se o usuário não estiver autenticado ou se os dados forem inválidos.
 */
export const createRequest = async (requestData: Partial<ITRequest>): Promise<ITRequest> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  // Validação dos dados de entrada
  const parseResult = ITRequestSchema.safeParse(requestData);
  if (!parseResult.success) {
    throw new Error('Dados inválidos: ' + JSON.stringify(parseResult.error.flatten().fieldErrors));
  }
  const newRequest = {
    user_id: user.id,
    title: requestData.title || '',
    description: requestData.description || '',
    type: requestData.type || 'other',
    priority: requestData.priority || 'medium',
    status: 'new',
  };
  const { data, error } = await supabase
    .from('it_requests')
    .insert(newRequest)
    .select()
    .single();
  if (error) throw new Error(`Erro ao criar requisição: ${error.message}`);
  // Buscar perfil do usuário
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (profileError) throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
  return convertSupabaseToRequest(data, profile ? [profile] : []);
};

/**
 * Atualiza uma requisição de TI após validar os dados de atualização.
 * @throws Error se os dados forem inválidos ou se a atualização falhar.
 */
export const updateRequest = async (id: string, updates: Partial<ITRequest>): Promise<ITRequest> => {
  // Validação dos dados de atualização (parcial)
  const parseResult = ITRequestSchema.partial().safeParse(updates);
  if (!parseResult.success) {
    throw new Error('Dados de atualização inválidos: ' + JSON.stringify(parseResult.error.flatten().fieldErrors));
  }
  const updateData: any = {};
  if (updates.status) updateData.status = updates.status;
  if (updates.assignedTo) updateData.assigned_to = updates.assignedTo;
  if (updates.resolution) updateData.resolution_notes = updates.resolution;
  if (updates.status === 'resolved') updateData.resolved_at = new Date().toISOString();
  if (updates.status === 'closed') updateData.closed_at = new Date().toISOString();
  const { data, error } = await supabase
    .from('it_requests')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Erro ao atualizar requisição: ${error.message}`);
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user_id)
    .single();
  if (profileError) throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
  return convertSupabaseToRequest(data, profile ? [profile] : []);
};
