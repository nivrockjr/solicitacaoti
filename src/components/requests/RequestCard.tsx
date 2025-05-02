import React from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ITRequest } from '@/types';
import { cn } from '@/lib/utils';

interface RequestCardProps {
  request: ITRequest;
}

const RequestCard: React.FC<RequestCardProps> = ({ request }) => {
  const navigate = useNavigate();
  
  const getStatusColor = () => {
    switch (request.status) {
      case 'new':
      case 'nova':
        return 'bg-blue-500';
      case 'assigned':
      case 'atribuida':
        return 'bg-amber-500';
      case 'in_progress':
      case 'em_andamento':
        return 'bg-purple-500';
      case 'resolved':
      case 'resolvida':
        return 'bg-green-500';
      case 'closed':
      case 'fechada':
        return 'bg-slate-500';
      default:
        return 'bg-slate-500';
    }
  };
  
  const getPriorityIcon = () => {
    switch (request.priority) {
      case 'high':
      case 'alta':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'medium':
      case 'media':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'low':
      case 'baixa':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };
  
  const formatStatus = (status: string) => {
    const statusMap = {
      'new': 'Nova',
      'nova': 'Nova',
      'assigned': 'Atribuída',
      'atribuida': 'Atribuída',
      'in_progress': 'Em Andamento',
      'em_andamento': 'Em Andamento',
      'resolved': 'Resolvida',
      'resolvida': 'Resolvida',
      'closed': 'Fechada',
      'fechada': 'Fechada'
    };
    
    return statusMap[status as keyof typeof statusMap] || status;
  };
  
  const formatPriority = (priority: string) => {
    const priorityMap = {
      'high': 'Alta',
      'alta': 'Alta',
      'medium': 'Média',
      'media': 'Média',
      'low': 'Baixa',
      'baixa': 'Baixa'
    };
    
    return priorityMap[priority as keyof typeof priorityMap] || priority;
  };
  
  return (
    <Card className="overflow-hidden">
      <div className={cn("h-1", getStatusColor())} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-medium leading-tight line-clamp-1">
              {request.title || request.description.substring(0, 50)}
            </h3>
            <p className="text-xs text-muted-foreground">Solicitação #{request.id}</p>
          </div>
          <Badge variant={(request.priority === 'high' || request.priority === 'alta') ? 'destructive' : (request.priority === 'medium' || request.priority === 'media') ? 'default' : 'outline'}>
            <span className="flex items-center gap-1">
              {getPriorityIcon()}
              {formatPriority(request.priority)}
            </span>
          </Badge>
        </div>
        
        <div className="mt-3">
          <p className="text-sm line-clamp-2">{request.description}</p>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center">
            <Badge variant="outline">{formatStatus(request.status)}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Vence em {format(new Date(request.deadlineAt), 'dd/MM/yyyy, HH:mm')}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => navigate(`/request/${request.id}`)}
        >
          Ver Detalhes
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RequestCard;
