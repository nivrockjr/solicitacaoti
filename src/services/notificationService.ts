import { supabase } from '../lib/supabase';
import { Notification, NotificationType } from '../types';
import { listAdminIds } from './userService';

/**
 * Serviço especializado para envio e gestão de notificações.
 * Centraliza toda a lógica de escrita na tabela 'notificacoes' do Supabase.
 */

interface CreateNotificationParams {
  para: string;
  mensagem: string;
  tipo: NotificationType;
  request_id?: string;
}

export const notificationService = {
  /**
   * Lê as notificações recentes do usuário via função SQL `notify_list_mine`
   * (SECURITY DEFINER). O banco filtra internamente por `para = userId`,
   * impedindo leitura de notificações alheias mesmo com a anon key vazada.
   */
  async listRecent(
    userId: string,
    windowDays: number = 15
  ): Promise<{ data: Notification[]; error: Error | null }> {
    try {
      const { data, error } = await supabase.rpc('notify_list_mine', {
        p_user_id: userId,
        p_window_days: windowDays,
      });
      if (error) throw error;
      return { data: (data ?? []) as Notification[], error: null };
    } catch (err) {
      if (!import.meta.env.PROD) console.error('Erro ao listar notificações recentes:', err);
      return { data: [], error: err as Error };
    }
  },

  /**
   * Envia uma notificação para um usuário específico.
   * Silencia erros para não travar o fluxo principal (ex: criação de chamados).
   */
  async send(params: CreateNotificationParams): Promise<boolean> {
    try {
      const { error } = await supabase.from('notificacoes').insert([{
        para: params.para,
        mensagem: params.mensagem,
        tipo: params.tipo,
        request_id: params.request_id,
        lida: false,
      }]);

      if (error) {
        if (!import.meta.env.PROD) console.error('Erro ao enviar notificação:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      if (!import.meta.env.PROD) console.error('Falha crítica no serviço de notificações:', err);
      return false;
    }
  },

  /**
   * Marca uma notificação como lida via função SQL `notify_mark_read`
   * (SECURITY DEFINER). O banco só atualiza se a notificação pertencer ao
   * `userId` informado, impedindo marcação de notificações alheias.
   */
  async markAsRead(id: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('notify_mark_read', {
        p_user_id: userId,
        p_notification_id: id,
      });
      if (error) throw error;
      return data === true;
    } catch (err) {
      if (!import.meta.env.PROD) console.error('Erro ao marcar notificação como lida:', err);
      return false;
    }
  },

  /**
   * Marca todas as notificações do usuário como lidas em uma única chamada
   * via função SQL `notify_mark_all_read` (SECURITY DEFINER). Retorna a
   * quantidade de linhas atualizadas (apenas as que estavam não-lidas).
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('notify_mark_all_read', {
        p_user_id: userId,
      });
      if (error) throw error;
      return typeof data === 'number' ? data : 0;
    } catch (err) {
      if (!import.meta.env.PROD) console.error('Erro ao marcar todas como lidas:', err);
      return 0;
    }
  },

  /**
   * Notifica todos os administradores.
   * Útil para novos chamados ou atualizações críticas.
   */
  async notifyAdmins(mensagem: string, tipo: NotificationType, requestId?: string): Promise<void> {
    try {
      const adminIds = await listAdminIds();
      if (adminIds.length === 0) return;

      const notifications = adminIds.map(id => ({
        para: id,
        mensagem,
        tipo,
        request_id: requestId,
        lida: false,
      }));

      const { error: insertError } = await supabase.from('notificacoes').insert(notifications);
      if (insertError && !import.meta.env.PROD) {
        console.error('Erro ao inserir notificações em massa:', insertError.message);
      }
    } catch (err) {
      if (!import.meta.env.PROD) console.error('Erro ao notificar administradores:', err);
    }
  }
};
