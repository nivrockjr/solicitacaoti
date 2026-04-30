import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getSemanticIcon, tryFormatDateTime } from '@/lib/utils';
import { ITRequest, User } from '@/types';

interface RequestCommentsProps {
  request: ITRequest;
  user: User | null;
  comment: string;
  onCommentChange: (value: string) => void;
  submitting: boolean;
  onAddComment: () => void;
  onDeleteComment: (id: string) => void;
  onViewAttachment: (filePath: string) => void;
}

export function RequestComments({
  request,
  user,
  comment,
  onCommentChange,
  submitting,
  onAddComment,
  onDeleteComment,
  onViewAttachment,
}: RequestCommentsProps) {
  const isAdmin = user?.role === 'admin';

  return (
    <div>
      <h3 className="text-sm font-medium mb-4">Comentários</h3>
      {(!request.comments || request.comments.length === 0) ? (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhum comentário ainda</p>
      ) : (
        <div className="space-y-4">
          {request.comments.map((c) => (
            <div key={c.id} className="p-3 rounded relative group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm">
                  {getSemanticIcon('user', { className: 'h-4 w-4 text-muted-foreground' })}
                  <span className="text-muted-foreground">Comentado por:</span>
                  <span>{c.userName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <time className="text-xs text-muted-foreground">
                    {tryFormatDateTime(c.createdAt, 'dd/MM HH:mm') ?? '—'}
                  </time>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => onDeleteComment(c.id)}
                      disabled={submitting}
                    >
                      {getSemanticIcon('action-close', { className: 'h-3 w-3' })}
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap">{c.text}</p>
              {c.attachments && c.attachments.length > 0 && (
                <div className="mt-2 space-y-2 border-t pt-2 border-muted">
                  {c.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-2 p-1.5 bg-muted/30 rounded-md">
                      {getSemanticIcon('attachment', { className: 'h-3.5 w-3.5 text-muted-foreground' })}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{attachment.fileName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {attachment.fileSize ? `${(attachment.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Tamanho desconhecido'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px]"
                        onClick={() => attachment.fileUrl && onViewAttachment(attachment.fileUrl)}
                        disabled={!attachment.fileUrl}
                      >
                        Ver
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Textarea
          placeholder="Adicionar um comentário..."
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          className="min-h-[100px] mb-2"
        />
        <div className="flex justify-end">
          <Button onClick={onAddComment} disabled={!comment.trim() || submitting}>
            {getSemanticIcon('action-send', { className: 'h-4 w-4 mr-2' })}
            Adicionar Comentário
          </Button>
        </div>
      </div>
    </div>
  );
}
