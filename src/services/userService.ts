import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

/**
 * userService
 * Centraliza todas as leituras e escritas na tabela `usuarios`.
 * Componentes e hooks devem consumir este service em vez de chamar `supabase`
 * diretamente (Diretiva 6 #8 do CLAUDE.md).
 *
 * Nota: este arquivo apenas espelha 1:1 as operações que já existiam espalhadas
 * no projeto. Sem mudança de comportamento. Migração para Supabase Auth nativo
 * é decisão futura (DIAGNOSTICO.md Fase 0).
 */

/**
 * Linha bruta como gravada na tabela `usuarios`.
 * Inclui campos sensíveis (`senha`, `precisa_alterar_senha`) que NÃO devem
 * vazar para a UI — usar `User` para qualquer dado renderizado.
 */
export interface UsuarioRow extends User {
  senha?: string;
  precisa_alterar_senha?: boolean;
  created_at?: string;
}

interface CreateUserPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  position?: string;
  whatsapp?: string;
  /** Senha em texto plano. NUNCA vai pro banco como texto: a função
   *  `update_user_password` aplica bcrypt e grava em `senha_hash`. */
  password: string;
  precisa_alterar_senha?: boolean;
  created_at?: string;
}

interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: UserRole;
  department?: string;
  position?: string;
  whatsapp?: string;
}

/**
 * Lê o registro completo do usuário pelo email (case-insensitive).
 * Inclui campos sensíveis — uso restrito.
 * @deprecated A partir de J.4: use `validateLogin(email, senha)` para autenticação.
 *   Será removido junto com a coluna `senha` em texto plano (Item J.6 do DIAGNOSTICO).
 */
export const getUsuarioRowByEmail = async (email: string): Promise<UsuarioRow | null> => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();
  if (error) return null;
  return data as UsuarioRow;
};

/**
 * Autenticação segura via função SQL `validate_login` (SECURITY DEFINER + bcrypt).
 * O frontend NÃO lê mais a tabela `usuarios` direto — a senha em texto plano nunca
 * trafega de volta. Retorna o usuário sem campos sensíveis em caso de sucesso, ou
 * `null` se email/senha não baterem (sem distinguir qual dos dois falhou).
 */
export const validateLogin = async (email: string, password: string): Promise<User | null> => {
  const { data, error } = await supabase.rpc('validate_login', {
    p_email: email,
    p_password: password,
  });
  if (error) {
    if (!import.meta.env.PROD) console.error('Erro ao validar login:', error);
    return null;
  }
  if (!data || (Array.isArray(data) && data.length === 0)) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return row as User;
};

/**
 * Retorna apenas o id do usuário cujo email bate. Útil para resolver
 * `requesteremail` em destinatário de notificação.
 * Usa `maybeSingle` para não lançar quando o email não existe — alinhado
 * ao uso histórico em `requestService`/`RequestDetailPage`.
 */
export const getUserIdByEmail = async (email: string): Promise<string | null> => {
  const { data } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  return data?.id ?? null;
};

/**
 * Lista todos os administradores. Retorna o objeto User completo (sem senha).
 */
export const listAdmins = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('role', 'admin');
  if (error) return [];
  return (data ?? []) as User[];
};

/**
 * Lista apenas os ids dos admins. Usado pelo notificationService para
 * disparar notificações em lote.
 */
export const listAdminIds = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id')
    .eq('role', 'admin');
  if (error || !data) return [];
  return data.map(u => u.id);
};

/**
 * Busca um admin específico por nome. Usado pela atribuição automática
 * baseada em `adminAssignments` (ex.: solicitações de estoque vão ao Nivaldo).
 */
export const findAdminByName = async (name: string): Promise<{ id: string; name: string } | null> => {
  const { data } = await supabase
    .from('usuarios')
    .select('id, name')
    .eq('name', name)
    .eq('role', 'admin')
    .maybeSingle();
  if (!data) return null;
  return { id: data.id, name: data.name };
};

/**
 * Verifica se existe um admin ativo com o nome informado.
 * Equivalente a `validateAdminExists` em `adminAssignments.ts`.
 */
export const adminExistsByName = async (name: string): Promise<boolean> => {
  const result = await findAdminByName(name);
  return result !== null;
};

/**
 * Lista usuários com role específica (requester e/ou admin).
 * Usada pelo `preventiveMaintenanceService` para criar chamados em lote.
 */
export const listUsuariosByRoles = async (roles: UserRole[]): Promise<UsuarioRow[]> => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .in('role', roles);
  if (error || !data) return [];
  return data as UsuarioRow[];
};

/**
 * Página administrativa: lista paginada por `created_at` DESC.
 */
export const listUsuariosPaginated = async (
  page: number,
  pageSize: number
): Promise<User[]> => {
  const from = (page - 1) * pageSize;
  const to = page * pageSize - 1;
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error || !data) return [];
  return data as User[];
};

/**
 * Lê o próprio registro do usuário logado (ou de qualquer id).
 * Não filtra a coluna `senha` — o caller é responsável por descartar.
 */
export const getUsuarioById = async (id: string): Promise<User[]> => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', id);
  if (error || !data) return [];
  return data as User[];
};

/**
 * Cria um novo usuário (operação administrativa).
 * 1) INSERT na tabela `usuarios` SEM o campo de senha (a coluna `senha` em
 *    texto plano será removida — Item J.6 do DIAGNOSTICO).
 * 2) Após o INSERT, chama `update_user_password` para gravar o hash bcrypt
 *    em `senha_hash`.
 */
export const createUsuario = async (payload: CreateUserPayload): Promise<void> => {
  const { password, ...userRow } = payload;
  const { error: insertError } = await supabase.from('usuarios').insert([userRow]);
  if (insertError) throw insertError;
  const { error: passwordError } = await supabase.rpc('update_user_password', {
    p_user_id: payload.id,
    p_new_password: password,
  });
  if (passwordError) throw passwordError;
};

/**
 * Atualiza dados básicos do usuário (sem mexer em senha).
 */
export const updateUsuario = async (id: string, payload: UpdateUserPayload): Promise<void> => {
  const { error } = await supabase.from('usuarios').update(payload).eq('id', id);
  if (error) throw error;
};

/**
 * Reseta a senha de um usuário (operação administrativa).
 * Usa a função SQL `update_user_password` (SECURITY DEFINER) que aplica bcrypt
 * internamente. Senha em texto plano nunca é gravada — apenas o hash em
 * `senha_hash`. Validação de tamanho mínimo (6 chars) também roda no banco.
 */
export const resetUsuarioPassword = async (id: string, newPassword: string): Promise<void> => {
  const { error } = await supabase.rpc('update_user_password', {
    p_user_id: id,
    p_new_password: newPassword,
  });
  if (error) throw error;
};

/**
 * Remove um usuário do sistema. Operação administrativa irreversível.
 */
export const deleteUsuario = async (id: string): Promise<void> => {
  const { error } = await supabase.from('usuarios').delete().eq('id', id);
  if (error) throw error;
};
