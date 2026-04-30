import { Button } from '@/components/ui/button';
import { getSemanticIcon } from '@/lib/utils';
import { ITRequest } from '@/types';

interface RequestAttachmentsProps {
  request: ITRequest;
  downloading: string | null;
  onView: (filePath: string) => void;
}

export function RequestAttachments({ request, downloading, onView }: RequestAttachmentsProps) {
  if (!request.attachments || request.attachments.length === 0) return null;

  const resComment = request.comments?.find(c => c.text.startsWith('[RESOLUÇÃO]'));
  const resAttachmentIds = resComment?.attachments?.map(a => a.id) || [];
  const reopenComment = request.comments?.find(c => c.text.startsWith('[REABERTURA]'));
  const reopenAttachmentIds = reopenComment?.attachments?.map(a => a.id) || [];
  const rejectComment = request.comments?.find(c => c.text.startsWith('[REJEITADA]'));
  const rejectAttachmentIds = rejectComment?.attachments?.map(a => a.id) || [];

  const userAttachments = request.attachments.filter(att =>
    !resAttachmentIds.includes(att.id) &&
    !reopenAttachmentIds.includes(att.id) &&
    !rejectAttachmentIds.includes(att.id) &&
    !att.isSignature
  );

  if (userAttachments.length === 0) return null;

  return (
    <div className="bg-card p-3 rounded-md">
      <h3 className="text-sm font-medium mb-2">Anexos</h3>
      <div className="space-y-2">
        {userAttachments.map((attachment) => (
          <div key={attachment.id} className="flex items-center gap-2 p-2">
            {getSemanticIcon('attachment', { className: 'h-4 w-4 text-muted-foreground' })}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{attachment.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {attachment.fileSize ? `${(attachment.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Tamanho desconhecido'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => attachment.fileUrl && onView(attachment.fileUrl)}
              disabled={!attachment.fileUrl || downloading === attachment.fileUrl}
            >
              {downloading === attachment.fileUrl ? 'Abrindo...' : 'Visualizar'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
