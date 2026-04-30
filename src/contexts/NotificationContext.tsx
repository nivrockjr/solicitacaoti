import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Notification } from '@/types';
import { useAuth } from './AuthContext';
import { notificationService } from '@/services/notificationService';

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

  // Polling consome `notificationService.listRecent` (janela de 15 dias)
  // para evitar acesso direto ao Supabase neste contexto.
  const NOTIFICATION_WINDOW_DAYS = 15;

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error } = await notificationService.listRecent(user.id, NOTIFICATION_WINDOW_DAYS);
    if (error) {
      setError(error);
      setNotifications([]);
    } else {
      setNotifications(data);
    }
    setLoading(false);
  }, [user?.id]);

  // Pooling: busca notificações a cada 2 minutos
  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 120000); // 2 minutos
    return () => clearInterval(interval);
  }, [user?.id, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      const success = await notificationService.markAsRead(id);
      if (success) {
        setNotifications((prev) => prev.map(n => n.id === id ? { ...n, lida: true } : n));
      }
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
