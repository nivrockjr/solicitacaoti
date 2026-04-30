import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getSemanticIcon } from '@/lib/utils';
import { ITRequest } from '@/types';

interface LifecycleSectionProps {
  request: ITRequest;
  requestId: string | undefined;
  onOpenDeliveryModal: () => void;
  onCopyAcceptanceLink: () => void;
}

export function LifecycleSection({
  request,
  requestId,
  onOpenDeliveryModal,
  onCopyAcceptanceLink,
}: LifecycleSectionProps) {
  if (request.type !== 'ciclo_colaborador' && request.type !== 'employee_lifecycle') {
    return null;
  }

  const status = (request.status || '').toLowerCase().trim();
  const isFinished = ['resolvida', 'resolved', 'closed', 'fechada'].includes(status);

  return (
    <div className="space-y-2 mb-4">
      {!isFinished ? (
        <div className="flex flex-col gap-2">
          <Button
            onClick={onOpenDeliveryModal}
            variant="outline"
            size="sm"
            className="w-full flex items-center justify-center gap-2 bg-primary/5 border-primary/20 hover:bg-primary/10"
          >
            {getSemanticIcon('file', { className: 'h-3.5 w-3.5' })}
            {request.metadata?.form_data?.action === 'offboarding' ? '1 - Itens a coletar' : '1. Definir Itens de Entrega'}
          </Button>
          <Button
            onClick={onCopyAcceptanceLink}
            variant="outline"
            size="sm"
            className="w-full flex items-center justify-center gap-2 border-primary/30 hover:bg-primary/5"
          >
            {getSemanticIcon('link', { className: 'h-3.5 w-3.5' })} 2. Copiar Link de Aceite
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => window.open(`${window.location.origin}/aceite/${requestId}`, '_blank')}
          variant="default"
          size="sm"
          className="w-full flex items-center justify-center gap-2 bg-success hover:bg-success/90 text-success-foreground"
        >
          {getSemanticIcon('success', { className: 'h-3.5 w-3.5' })} Assinado - Ver Termo
        </Button>
      )}
      <Separator className="my-2" />
    </div>
  );
}
