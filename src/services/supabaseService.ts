
import { supabase } from '@/lib/supabase';
import { ITRequest } from '@/types';

export interface SupabaseRequest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  assigned_to?: string;
  attachments?: any[];
  comments?: any[];
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
}

// Converter dados do Supabase para o formato da aplicação
function convertSupabaseToRequest(data: SupabaseRequest, profiles: any[] = []): ITRequest {
  const userProfile = profiles.find(p => p.id === data.user_id);
  
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
    attachments: data.attachments || [],
    comments: data.comments || [],
    resolution: data.resolution_notes,
    resolvedAt: data.resolved_at,
  };
}

export const getRequests = async (userId?: string): Promise<ITRequest[]> => {
  try {
    let query = supabase.from('it_requests').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data: requests, error: requestsError } = await query.order('created_at', { ascending: false });
    
    if (requestsError) throw requestsError;

    // Buscar perfis dos usuários para obter nomes e emails
    const userIds = [...new Set(requests?.map(r => r.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, email')
      .in('id', userIds);

    return (requests || []).map(req => convertSupabaseToRequest(req, profiles || []));
  } catch (error) {
    console.error('Error fetching requests:', error);
    return [];
  }
};

export const createRequest = async (requestData: Partial<ITRequest>): Promise<ITRequest> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Usuário não autenticado');

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

  if (error) throw error;

  // Buscar perfil do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return convertSupabaseToRequest(data, profile ? [profile] : []);
};

export const updateRequest = async (id: string, updates: Partial<ITRequest>): Promise<ITRequest> => {
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

  if (error) throw error;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user_id)
    .single();

  return convertSupabaseToRequest(data, profile ? [profile] : []);
};
