import { Button } from '@/components/ui/button';
import { getSemanticIcon } from '@/lib/utils';
import { ITRequest, User } from '@/types';

interface RequestHeaderProps {
  request: ITRequest;
  user: User | null;
  submitting: boolean;
  onBack: () => void;
  onStatusChange: (status: string) => void;
  onOpenResolutionModal: () => void;
  onOpenRejectModal: () => void;
  onDelete: () => void;
}

export function RequestHeader({
  request,
  user,
  submitting,
  onBack,
  onStatusChange,
  onOpenResolutionModal,
  onOpenRejectModal,
  onDelete,
}: RequestHeaderProps) {
  const status = request.status ?? '';
  const isFinished = ['resolved', 'resolvida', 'closed', 'fechada'].includes(status);
  const isPending = ['assigned', 'atribuida', 'new', 'nova'].includes(status);
  const isAdmin = user?.role === 'admin';
  const isRejected = request.approvalstatus === 'rejected';

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          {getSemanticIcon('action-back', { className: 'h-4 w-4' })}
          <span className="sr-only">Voltar</span>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Solicitação #{request.id}</h1>
      </div>
      <div className="flex gap-2">
        {isAdmin && !isFinished && !isRejected && (
          <>
            {isPending && (
              <Button onClick={() => onStatusChange('in_progress')} variant="outline" size="sm" disabled={submitting}>
                Iniciar Progresso
              </Button>
            )}
            <Button
              onClick={onOpenResolutionModal}
              variant="outline"
              size="sm"
              disabled={submitting}
              className="bg-status-resolved text-white border-status-resolved hover:bg-status-resolved/90"
            >
              Resolver
            </Button>
            <Button
              onClick={onOpenRejectModal}
              variant="destructive"
              size="sm"
              disabled={submitting}
              className="bg-status-rejected text-white border-status-rejected px-3"
              title="Rejeitar Solicitação"
            >
              {getSemanticIcon('action-close', { className: 'h-4 w-4' })}
            </Button>
          </>
        )}
        {isAdmin && (
          <Button
            onClick={onDelete}
            variant="destructive"
            size="sm"
            disabled={submitting}
            className="bg-status-rejected text-white border-status-rejected px-3"
            title="Excluir Solicitação"
          >
            {getSemanticIcon('action-delete', { className: 'h-4 w-4' })}
          </Button>
        )}
      </div>
    </div>
  );
}
