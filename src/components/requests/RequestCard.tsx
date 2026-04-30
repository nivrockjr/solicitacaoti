import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ITRequest } from '@/types';
import { cn, tryFormatDateTime, translate, getStatusStyle, getPriorityStyle, getSemanticIcon } from '@/lib/utils';

interface RequestCardProps {
  request: ITRequest;
}

const RequestCard: React.FC<RequestCardProps> = ({ request }) => {
  const navigate = useNavigate();
  const statusStyle = getStatusStyle(request.status);
  const priorityStyle = getPriorityStyle(request.priority);
  
  const getPriorityIcon = (isHigh: boolean) => {
    // Ícone adaptado ao tema: branco no badge de status-rejected (high), foreground nos demais
    if (isHigh) {
      return getSemanticIcon('priority-high', { className: "h-4 w-4 text-white dark:text-white" });
    }
    return getSemanticIcon('priority-medium', { className: "h-4 w-4 text-foreground" });
  };
  
  const getStatusBadge = () => {
    return (
      <Badge 
        variant={statusStyle.variant || 'default'} 
        className={cn("text-white uppercase font-bold", statusStyle.color)}
      >
        {statusStyle.label}
      </Badge>
    );
  };

  // Função para verificar se a solicitação tem anexos
  const hasAttachments = () => {
    return request.attachments && 
           Array.isArray(request.attachments) && 
           request.attachments.length > 0;
  };

  const resolvedAtLabel = tryFormatDateTime(request.resolvedat, 'dd/MM/yyyy HH:mm');
  const deadlineAtLabel = tryFormatDateTime(request.deadlineat, 'dd/MM/yyyy HH:mm');

  // `productName` pode ser anexado ao request em fluxos de Ajuste de Estoque;
  // não faz parte do schema canônico de `solicitacoes`, por isso a interseção local.
  const stockProductName =
    request.type === 'ajuste_estoque'
      ? (request as ITRequest & { productName?: string }).productName
      : undefined;

  return (
    <Card className="overflow-hidden">
      <div
        className={cn("h-1 opacity-100", statusStyle.color)}
      />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-medium leading-tight line-clamp-1">
              {stockProductName
                ? `Ajuste de Estoque: ${stockProductName}`
                : request.type === 'employee_lifecycle' && request.title
                  ? request.title
                  : request.description?.substring(0, 50)}
            </h3>
            <p className="text-[11px] text-muted-foreground flex items-center gap-2">
              Solicitação #{request.id}
              {request.type && (
                <span className="ml-1">• {translate('type', request.type)}</span>
              )}
              {hasAttachments() && getSemanticIcon('attachment', { className: 'h-3 w-3 text-muted-foreground ml-1' })}
            </p>
          </div>
          <Badge 
            variant={priorityStyle.variant || 'default'} 
            className={cn("font-bold", priorityStyle.color, request.priority === 'high' && "text-white")}
          >
            <span className="flex items-center gap-1">
              {getPriorityIcon(request.priority === 'high')}
              {priorityStyle.label}
            </span>
          </Badge>
        </div>
        
        <div className="mt-3">
          <p className="text-sm line-clamp-2">{request.description}</p>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center">
            {getStatusBadge()}
          </div>
          <div className="flex items-center gap-1">
            {getSemanticIcon('calendar', { className: 'h-3 w-3' })}
            {request.approvalstatus === 'rejected' ? (
              <span>N/A</span>
            ) : request.status === 'resolved' ? (
              <span>{resolvedAtLabel ? `Resolvida em ${resolvedAtLabel}` : 'Resolvida'}</span>
            ) : (
              <span>{deadlineAtLabel ? `Vence em ${deadlineAtLabel}` : 'Prazo não definido'}</span>
            )}
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
