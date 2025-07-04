import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/contexts/NotificationContext';
import { Notification } from '@/types';

const NotificationsList: React.FC = () => {
  const { notifications, markAsRead, refreshNotifications, loading } = useNotifications();
  const navigate = useNavigate();
  
  const handleClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    
    if (notification.requestId) {
      navigate(`/request/${notification.requestId}`);
    }
  };
  
  return (
    <div className="flex flex-col h-[350px]">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Notificações</h3>
          <Button variant="ghost" size="sm" onClick={refreshNotifications} disabled={loading}>
            Atualizar
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Bell className="h-10 w-10 mb-2" />
            <p>Sem notificações</p>
          </div>
        ) : (
          <ul>
            {notifications.map((notification) => (
              <li key={notification.id}>
                <Button
                  variant="ghost"
                  className={`w-full text-left p-4 h-auto justify-start border-b rounded-none ${!notification.isRead ? 'bg-muted/40' : ''}`}
                  onClick={() => handleClick(notification)}
                >
                  <div className="space-y-1 w-full">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{traduzirTitulo(notification.title)}</p>
                      <time className="text-xs text-muted-foreground">
                        {format(new Date(notification.createdAt), 'dd/MM, HH:mm')}
                      </time>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                  </div>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationsList;

// Função utilitária para traduzir os títulos das notificações
function traduzirTitulo(titulo: string) {
  const mapa = {
    'request_in_progress': 'Solicitação em andamento',
    'request_assigned': 'Solicitação atribuída',
    'comentario': 'Comentário',
    'request_created': 'Nova solicitação criada',
    'notifications': 'Notificações',
    'refresh': 'Atualizar',
  };
  return mapa[titulo] || titulo;
}
