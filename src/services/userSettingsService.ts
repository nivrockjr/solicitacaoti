import { supabase } from '../lib/supabase';

/**
 * userSettingsService
 * Centraliza leituras e escritas na tabela `user_settings`.
 * Componentes devem consumir este service em vez de chamar `supabase` direto
 * (Diretiva 6 #8 do CLAUDE.md).
 *
 * Schema confirmado em 28/04/2026: id (uuid), theme (text), notifications_enabled
 * (boolean), language (text). Coluna `theme` está hoje sem leitura/escrita
 * pela UI (gestão real do tema fica no ThemeContext via localStorage).
 */

export interface UserSettings {
  id: string;
  theme?: string | null;
  notifications_enabled?: boolean | null;
  language?: string | null;
}

/**
 * Código retornado pelo PostgREST quando `.single()` não encontra a linha.
 * Usado pela `loadUserSettings` para distinguir "ainda não existe" de erro real.
 */
export const NOT_FOUND_ERROR_CODE = 'PGRST116';

/**
 * Código retornado quando há violação de UNIQUE — pode ocorrer em corrida ao
 * inserir o registro padrão (dois clientes ao mesmo tempo).
 */
export const UNIQUE_VIOLATION_CODE = '23505';

/**
 * Lê o registro de configurações do usuário pelo id.
 * Retorna `null` se não existir (em vez de lançar) para o caller decidir
 * se cria um padrão.
 */
export const getUserSettings = async (
  userId: string
): Promise<{ data: UserSettings | null; notFound: boolean; error: Error | null }> => {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === NOT_FOUND_ERROR_CODE) {
      return { data: null, notFound: true, error: null };
    }
    return { data: null, notFound: false, error: error as Error };
  }
  return { data: data as UserSettings, notFound: false, error: null };
};

/**
 * Cria o registro padrão de configurações para um usuário recém-cadastrado.
 * Tolera violação de UNIQUE (alguém pode ter inserido em paralelo).
 */
export const createDefaultUserSettings = async (
  userId: string
): Promise<{ error: Error | null }> => {
  const { error } = await supabase
    .from('user_settings')
    .insert({ id: userId, theme: 'light', notifications_enabled: true, language: 'pt' });

  if (error && error.code !== UNIQUE_VIOLATION_CODE) {
    return { error: error as Error };
  }
  return { error: null };
};

/**
 * Atualiza/insere a preferência de notificações do navegador para o usuário.
 * Usa upsert por `id` para cobrir ambos os casos (já existente e novo).
 */
export const updateNotificationsEnabled = async (
  userId: string,
  enabled: boolean
): Promise<void> => {
  const { error } = await supabase
    .from('user_settings')
    .upsert(
      { id: userId, notifications_enabled: enabled },
      { onConflict: 'id' }
    );
  if (error) throw error;
};
