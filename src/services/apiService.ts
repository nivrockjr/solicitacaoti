
import { supabase } from '@/integrations/supabase/client';
import { ITRequest, Attachment, Comment } from '@/types';
import { Json } from '@/integrations/supabase/types';

// Helper function to safely parse JSON fields
const safeParseJson = (data: Json): any[] => {
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

// Helper function to check if user is super admin
const isSuperAdmin = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email === 'ti.mz@pqvirk.com.br';
  } catch {
    return false;
  }
};

export const getRequests = async (userId?: string): Promise<ITRequest[]> => {
  try {
    console.log('Fetching requests for user:', userId);
    const superAdmin = await isSuperAdmin();
    
    let query = supabase.from('it_requests').select(`
      *,
      profiles!it_requests_user_id_fkey(name, email)
    `);
    
    // Super admin can see all requests, regular users only their own
    if (userId && !superAdmin) {
      query = query.eq('user_id', userId);
    }
    
    const { data: requests, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching requests:', error);
      throw error;
    }

    console.log('Fetched requests:', requests?.length || 0, 'Super admin access:', superAdmin);
    return (requests || []).map(request => ({
      id: request.id,
      requesterId: request.user_id,
      requesterName: (request.profiles as any)?.name || 'Usuário',
      requesterEmail: (request.profiles as any)?.email || '',
      title: request.title || '',
      description: request.description,
      type: request.type as any,
      priority: request.priority as any,
      status: request.status as any,
      createdAt: request.created_at,
      deadlineAt: new Date(new Date(request.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: request.assigned_to,
      attachments: safeParseJson(request.attachments) as Attachment[],
      comments: safeParseJson(request.comments) as Comment[],
      resolution: request.resolution_notes,
      resolvedAt: request.resolved_at,
    }));
  } catch (error) {
    console.error('Error fetching requests:', error);
    return [];
  }
};

export const getRequestById = async (id: string): Promise<ITRequest | null> => {
  try {
    console.log('Fetching request by ID:', id);
    const { data: request, error } = await supabase
      .from('it_requests')
      .select(`
        *,
        profiles!it_requests_user_id_fkey(name, email)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching request by ID:', error);
      throw error;
    }
    if (!request) return null;

    return {
      id: request.id,
      requesterId: request.user_id,
      requesterName: (request.profiles as any)?.name || 'Usuário',
      requesterEmail: (request.profiles as any)?.email || '',
      title: request.title || '',
      description: request.description,
      type: request.type as any,
      priority: request.priority as any,
      status: request.status as any,
      createdAt: request.created_at,
      deadlineAt: new Date(new Date(request.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: request.assigned_to,
      attachments: safeParseJson(request.attachments) as Attachment[],
      comments: safeParseJson(request.comments) as Comment[],
      resolution: request.resolution_notes,
      resolvedAt: request.resolved_at,
    };
  } catch (error) {
    console.error('Error fetching request:', error);
    return null;
  }
};

export const createRequest = async (requestData: Partial<ITRequest>): Promise<ITRequest> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Usuário não autenticado');

  console.log('Creating request for user:', user.id, requestData);

  const newRequest = {
    user_id: user.id,
    title: requestData.title || requestData.description?.substring(0, 100) || '',
    description: requestData.description || '',
    type: requestData.type || 'other',
    priority: requestData.priority || 'medium',
    status: 'new',
    attachments: JSON.stringify(requestData.attachments || []),
    comments: JSON.stringify([]),
  };

  const { data, error } = await supabase
    .from('it_requests')
    .insert(newRequest)
    .select(`
      *,
      profiles!it_requests_user_id_fkey(name, email)
    `)
    .single();

  if (error) {
    console.error('Error creating request:', error);
    throw error;
  }

  console.log('Request created successfully:', data);

  return {
    id: data.id,
    requesterId: data.user_id,
    requesterName: (data.profiles as any)?.name || 'Usuário',
    requesterEmail: (data.profiles as any)?.email || '',
    title: data.title,
    description: data.description,
    type: data.type as any,
    priority: data.priority as any,
    status: data.status as any,
    createdAt: data.created_at,
    deadlineAt: new Date(new Date(data.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: data.assigned_to,
    attachments: safeParseJson(data.attachments) as Attachment[],
    comments: safeParseJson(data.comments) as Comment[],
    resolution: data.resolution_notes,
    resolvedAt: data.resolved_at,
  };
};

export const updateRequest = async (id: string, updates: Partial<ITRequest>): Promise<ITRequest> => {
  const updateData: any = {};
  
  if (updates.status) updateData.status = updates.status;
  if (updates.assignedTo) updateData.assigned_to = updates.assignedTo;
  if (updates.resolution) updateData.resolution_notes = updates.resolution;
  if (updates.comments) updateData.comments = JSON.stringify(updates.comments);
  if (updates.status === 'resolved') updateData.resolved_at = new Date().toISOString();
  if (updates.status === 'closed') updateData.closed_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('it_requests')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      profiles!it_requests_user_id_fkey(name, email)
    `)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    requesterId: data.user_id,
    requesterName: (data.profiles as any)?.name || 'Usuário',
    requesterEmail: (data.profiles as any)?.email || '',
    title: data.title,
    description: data.description,
    type: data.type as any,
    priority: data.priority as any,
    status: data.status as any,
    createdAt: data.created_at,
    deadlineAt: new Date(new Date(data.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: data.assigned_to,
    attachments: safeParseJson(data.attachments) as Attachment[],
    comments: safeParseJson(data.comments) as Comment[],
    resolution: data.resolution_notes,
    resolvedAt: data.resolved_at,
  };
};

export const uploadFile = async (file: File): Promise<string> => {
  // For now, return a mock URL. In a real implementation, you would upload to Supabase Storage
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`https://example.com/uploads/${file.name}`);
    }, 1000);
  });
};

export const updateRequestStatus = async (id: string, status: string): Promise<void> => {
  const updateData: any = { status };
  
  if (status === 'resolved') {
    updateData.resolved_at = new Date().toISOString();
  }
  
  if (status === 'closed') {
    updateData.closed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('it_requests')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;
};

export const addComment = async (requestId: string, comment: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Get current request to append to comments
  const { data: request, error: fetchError } = await supabase
    .from('it_requests')
    .select('comments')
    .eq('id', requestId)
    .single();

  if (fetchError) throw fetchError;

  const currentComments = safeParseJson(request.comments);
  const newComment = {
    id: crypto.randomUUID(),
    userId: user.id,
    userName: user.user_metadata?.name || user.email || 'Usuário',
    text: comment,
    createdAt: new Date().toISOString(),
  };

  const updatedComments = [...currentComments, newComment];

  const { error } = await supabase
    .from('it_requests')
    .update({ comments: JSON.stringify(updatedComments) })
    .eq('id', requestId);

  if (error) throw error;
};

// Mock functions for backwards compatibility
export const initEmailScheduler = () => {
  console.log('Email scheduler initialized (mock)');
};

export const forgotPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
};

export const createUser = async (userData: any) => {
  // Mock implementation
  console.log('Create user:', userData);
  return { id: 'mock-id', ...userData };
};

export const updateUser = async (id: string, userData: any) => {
  // Mock implementation
  console.log('Update user:', id, userData);
  return { id, ...userData };
};

export const updateUserPassword = async (id: string, password: string) => {
  // Mock implementation
  console.log('Update password for user:', id);
  return { success: true };
};
