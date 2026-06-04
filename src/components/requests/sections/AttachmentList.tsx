import { Button } from '@/components/ui/button';
import { getSemanticIcon } from '@/lib/utils';
import { Attachment } from '@/types';

interface AttachmentListProps {
  /** Anexos a listar. Aceita `undefined` para uso direto com `comment.attachments`. */
  attachments?: Attachment[];
  /** Rótulo exibido acima da lista (ex.: "Anexos da Resolução:"). */
  label: string;
  /** Abre o anexo (gera signed URL e abre em nova aba). */
  onView: (filePath: string) => void;
}

/**
 * Lista compacta dos anexos vinculados a um comentário de fluxo (Resolução,
 * Reabertura, Rejeição). Extraído de `RequestDetailPage` para eliminar a tripla
 * duplicação do mesmo bloco JSX (Passo A da auditoria — ver CHANGELOG 2026-06-04).
 *
 * Preserva 1:1 o visual original dos blocos inline: botão `variant="outline"`,
 * rótulo `text-xs`, wrapper `mt-2`. Não altera aparência.
 */
export function AttachmentList({ attachments, label, onView }: AttachmentListProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="text-xs font-medium mb-1">{label}</div>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div key={attachment.id} className="flex items-center gap-2 p-2">
            {getSemanticIcon('attachment', { className: 'h-4 w-4 text-muted-foreground' })}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{attachment.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {attachment.fileSize ? `${(attachment.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Tamanho desconhecido'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => attachment.fileUrl && onView(attachment.fileUrl)}
              disabled={!attachment.fileUrl}
            >
              Visualizar
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
