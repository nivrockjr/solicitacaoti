
import { supabase } from '@/lib/supabase';
import { getRequests as getSupabaseRequests, createRequest as createSupabaseRequest, updateRequest as updateSupabaseRequest } from './supabaseService';
import { ITRequest, User, Holiday, Notification } from '../types';

// Re-export supabase functions
export const getRequests = getSupabaseRequests;
export const createRequest = createSupabaseRequest;
export const updateRequest = updateSupabaseRequest;

// Auth functions
export const login = async (email: string, password: string): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (!profile) throw new Error('Perfil não encontrado');

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role as 'requester' | 'admin',
    department: profile.department,
  };
};

export const logout = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role as 'requester' | 'admin',
    department: profile.department,
  };
};

export const getRequestById = async (id: string): Promise<ITRequest | null> => {
  try {
    const { data, error } = await supabase
      .from('it_requests')
      .select(`
        *,
        profiles!it_requests_user_id_fkey(name, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      requesterId: data.user_id,
      requesterName: data.profiles?.name || 'Usuário',
      requesterEmail: data.profiles?.email || '',
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
  } catch (error) {
    console.error('Error fetching request:', error);
    return null;
  }
};

// Mock functions for compatibility
export const forgotPassword = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
};

export const createUser = async (userData: Omit<User, 'id'>): Promise<User> => {
  throw new Error('Use signUp instead');
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      name: updates.name,
      department: updates.department,
      role: updates.role,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role as 'requester' | 'admin',
    department: data.department,
  };
};

export const updateUserPassword = async (userId: string, newPassword: string): Promise<void> => {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
};

export const uploadFile = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { error } = await supabase.storage
    .from('attachments')
    .upload(filePath, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from('attachments')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

// Mock implementations for other functions
export const getHolidays = async (): Promise<Holiday[]> => [];
export const addHoliday = async (holiday: Omit<Holiday, 'id'>): Promise<Holiday> => ({
  id: Math.random().toString(),
  ...holiday
});

export const getNotifications = async (): Promise<Notification[]> => [];
export const markNotificationAsRead = async (id: string): Promise<void> => {};

export const initEmailScheduler = () => {};
export const checkRequestDeadlines = async () => {};
export const sendAdminDailyDigestEmails = async () => {};

export const checkAndCreatePreventiveMaintenanceRequests = async () => {};
export const createPreventiveMaintenanceRequests = async () => [];
export const isPreventiveMaintenanceDate = () => false;

export const sendEmail = async () => {};

export const aiAssistantService = {
  sendMessage: async (message: string) => 'Resposta simulada'
};
