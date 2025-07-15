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
    
    if (notification.request_id) {
      navigate(`/request/${notification.request_id}`);
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
                  className={`w-full text-left p-4 h-auto justify-start border-b rounded-none transition-all duration-150
                    ${!notification.lida ? 'bg-primary/10 border-l-4 border-primary text-foreground font-semibold shadow-sm' : ''}`}
                  onClick={() => handleClick(notification)}
                >
                  <div className="space-y-1 w-full">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium text-sm ${!notification.lida ? 'text-primary' : ''}`}>{traduzirTitulo(notification.tipo)}</p>
                      <time className="text-xs text-muted-foreground">
                        {format(new Date(notification.criada_em), 'dd/MM, HH:mm')}
                      </time>
                    </div>
                    <p className={`text-sm line-clamp-2 ${!notification.lida ? 'text-foreground' : 'text-muted-foreground'}`}>{notification.mensagem}</p>
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

// Função para traduzir o tipo de notificação para um nome amigável
function traduzirTitulo(tipo: string) {
  switch (tipo) {
    case 'request_resolved':
      return 'Solicitação resolvida';
    case 'comentario':
      return 'Comentário';
    case 'request_in_progress':
      return 'Solicitação em andamento';
    case 'request_assigned':
      return 'Solicitação atribuída';
    case 'request_reopened':
      return 'Solicitação reaberta';
    case 'request_created':
      return 'Nova solicitação';
    default:
      return tipo;
  }
}
