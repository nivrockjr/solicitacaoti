import { tryFormatDateTime } from '@/lib/utils';
import { ITRequest } from '@/types';
import { AttachmentList } from './AttachmentList';

interface ResolutionPanelProps {
  request: ITRequest;
  onView: (filePath: string) => void;
}

/**
 * Painel de Resolução do chamado. Diferente dos painéis de fluxo por comentário:
 * lê `request.resolution`/`resolvedat` e exibe a validação feita pelo usuário via
 * WhatsApp quando houver. Extraído de `RequestDetailPage` (Passo D2 da auditoria),
 * preservando 1:1 o visual original.
 */
export function ResolutionPanel({ request, onView }: ResolutionPanelProps) {
  const resComment = request.comments?.find(c => c.text.startsWith('[RESOLUÇÃO]'));
  const whatsappComment = request.comments?.find(c => c.text.includes('validada pelo usuário via WhatsApp'));

  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Resolução</h3>
      <div className="bg-card p-3 rounded-md text-sm whitespace-pre-wrap border-l-4 border-success shadow-none">
        <p>{request.resolution}</p>
        {resComment?.attachments && resComment.attachments.length > 0 && (
          <AttachmentList attachments={resComment.attachments} label="Anexos da Resolução:" onView={onView} />
        )}
        {request.resolvedat && (
          <p className="text-xs text-muted-foreground mt-2">
            Resolvida por {
              request.type === 'employee_lifecycle' && request.metadata?.form_data?.action === 'training'
                ? request.metadata?.form_data?.collaboratorName || request.requestername || 'Colaborador'
                : request.assignedtoname || 'Administrador'
            } em {tryFormatDateTime(request.resolvedat, 'dd/MM/yyyy HH:mm') ?? '—'}
            {whatsappComment && (
              <>
                <br />
                Validada pelo usuário via WhatsApp em {tryFormatDateTime(whatsappComment.createdAt, 'dd/MM/yyyy HH:mm') ?? '—'}
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
