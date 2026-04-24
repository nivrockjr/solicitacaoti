import { supabase } from '../lib/supabase';
import { Notification } from '../types';

/**
 * Serviço especializado para envio e gestão de notificações.
 * Centraliza toda a lógica de escrita na tabela 'notificacoes' do Supabase.
 */

interface CreateNotificationParams {
  para: string;
  mensagem: string;
  tipo: string;
  request_id?: string;
}

export const notificationService = {
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
        criada_em: new Date().toISOString()
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
   * Marca uma notificação como lida.
   */
  async markAsRead(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      if (!import.meta.env.PROD) console.error('Erro ao marcar notificação como lida:', err);
      return false;
    }
  },

  /**
   * Notifica todos os administradores.
   * Útil para novos chamados ou atualizações críticas.
   */
  async notifyAdmins(mensagem: string, tipo: string, requestId?: string): Promise<void> {
    try {
      const { data: admins, error } = await supabase
        .from('usuarios')
        .select('id')
        .eq('role', 'admin');

      if (error || !admins) return;

      const notifications = admins.map(admin => ({
        para: admin.id,
        mensagem,
        tipo,
        request_id: requestId,
        lida: false,
        criada_em: new Date().toISOString()
      }));

      await supabase.from('notificacoes').insert(notifications);
    } catch (err) {
      if (!import.meta.env.PROD) console.error('Erro ao notificar administradores:', err);
    }
  }
};
