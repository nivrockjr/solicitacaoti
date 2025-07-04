import { supabase } from '../lib/supabase';
import { User } from '../types';

// Login
export const login = async (email: string, password: string): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error('Email ou senha inválidos');
  // Aguarda a sessão estar pronta
  await supabase.auth.getSession();
  // Buscar dados adicionais do usuário na tabela 'usuarios'
  const { data: userData, error: userError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', data.user.id)
    .single();
  if (userError) {
    console.error('Erro ao buscar usuário na tabela usuarios:', userError);
    throw new Error('Usuário não encontrado no banco de dados');
  }
  // console.log('Usuário encontrado na tabela usuarios:', userData);
  return userData;
};

// Logout
export const logout = async (): Promise<void> => {
  await supabase.auth.signOut();
};

// Esqueci a senha
export const forgotPassword = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://it.pqvirk.com.br/auth/reset-password'
  });
  if (error) throw new Error('Erro ao enviar email de redefinição de senha');
};

// Usuário atual
export const getCurrentUser = async (): Promise<User | null> => {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: userData } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', data.user.id)
    .single();
  return userData || null;
};

// Cadastro de usuário
export const createUser = async (userData: Omit<User, 'id'> & { password: string }): Promise<User> => {
  // Cria usuário no Auth
  const { data, error } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
  });
  if (error) throw new Error('Erro ao criar usuário: ' + error.message);
  // Cria registro na tabela 'usuarios'
  const { error: dbError } = await supabase
    .from('usuarios')
    .insert({
      id: data.user?.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      department: userData.department,
      position: userData.position,
      whatsapp: userData.whatsapp,
    });
  if (dbError) throw new Error('Erro ao salvar usuário no banco de dados');
  return {
    id: data.user?.id,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    department: userData.department,
    position: userData.position,
    whatsapp: userData.whatsapp,
  };
};

// Atualizar usuário
export const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
  const { data, error } = await supabase
    .from('usuarios')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error('Erro ao atualizar usuário');
  return data;
};

// Alterar senha
export const updateUserPassword = async (userId: string, newPassword: string): Promise<void> => {
  // Apenas o próprio usuário pode alterar sua senha via Supabase Auth
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error('Erro ao alterar senha');
};

// Busca paginada de usuários (apenas para admin)
export const getUsers = async (page: number = 1, pageSize: number = 10): Promise<User[]> => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error } = await supabase.from('usuarios').select('*').range(from, to);
  if (error) throw new Error('Erro ao buscar usuários');
  return data || [];
};
