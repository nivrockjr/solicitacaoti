import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification } from '@/types';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  markAsRead: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  // Busca notificações do Supabase
  const fetchNotifications = async () => {
    if (!user?.id) {
      setNotifications([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('para', user.id)
        .order('criada_em', { ascending: false });
      if (error) throw error;
      setNotifications(data || []);
    } catch (err: any) {
      setError(err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Pooling: busca notificações a cada 2 minutos
  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 120000); // 2 minutos
    return () => clearInterval(interval);
  }, [user?.id]);

  const markAsRead = async (id: string) => {
    try {
      await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
      setNotifications((prev) => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    } catch (err) {
      setError(err as Error);
    }
  };

  const unreadCount = notifications.filter(n => !n.lida).length;

  return (
    <NotificationContext.Provider 
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        refreshNotifications: fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
