import { cn, tryFormatDateTime } from '@/lib/utils';
import { Comment } from '@/types';
import { AttachmentList } from './AttachmentList';

interface StatusFlowPanelProps {
  /** Comentário de fluxo que originou o painel (prefixado, ex.: `[REABERTURA] ...`). */
  comment: Comment;
  /** Título do painel (ex.: "Reaberta", "Rejeitada"). */
  title: string;
  /** Prefixo a remover do texto exibido (ex.: "[REABERTURA]"). */
  prefix: string;
  /** Classe da borda lateral (ex.: "border-muted-foreground", "border-destructive"). */
  accentClass: string;
  /** Rótulo da lista de anexos (ex.: "Anexos da Reabertura:"). */
  attachmentsLabel: string;
  /** Verbo + preposição da linha de autoria (ex.: "Reaberta por"). */
  actorLabel: string;
  onView: (filePath: string) => void;
}

/**
 * Painel de fluxo de status baseado em comentário prefixado (Reaberta, Rejeitada).
 * Extraído de `RequestDetailPage` para eliminar a duplicação entre os dois painéis
 * quase idênticos (Passo D2 da auditoria). Preserva 1:1 o visual original.
 */
export function StatusFlowPanel({
  comment,
  title,
  prefix,
  accentClass,
  attachmentsLabel,
  actorLabel,
  onView,
}: StatusFlowPanelProps) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-2">{title}</h3>
      <div className={cn('bg-card p-3 rounded-md text-sm whitespace-pre-wrap border-l-4 shadow-none', accentClass)}>
        <p>{comment.text.replace(prefix, '').trim()}</p>
        {comment.attachments && comment.attachments.length > 0 && (
          <AttachmentList attachments={comment.attachments} label={attachmentsLabel} onView={onView} />
        )}
        <p className="text-xs text-muted-foreground mt-2">
          {actorLabel} {comment.userName} em {tryFormatDateTime(comment.createdAt, 'dd/MM/yyyy HH:mm') ?? '—'}
        </p>
      </div>
    </div>
  );
}
