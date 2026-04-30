import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface RejectRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  onFilesChange: (files: File[]) => void;
  uploading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RejectRequestModal({
  open,
  onOpenChange,
  reason,
  onReasonChange,
  onFilesChange,
  uploading,
  onConfirm,
  onCancel,
}: RejectRequestModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Motivo da Rejeição</DialogTitle>
          <DialogDescription>Descreva o motivo da rejeição e anexe arquivos, se necessário.</DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Descreva o motivo da rejeição..."
          value={reason}
          onChange={e => onReasonChange(e.target.value)}
          className="min-h-[100px]"
        />
        <Input
          type="file"
          multiple
          onChange={e => onFilesChange(Array.from(e.target.files || []))}
          className="mt-2"
        />
        <DialogFooter>
          <Button variant="outline" onClick={onConfirm} disabled={!reason.trim() || uploading}>
            {uploading ? 'Salvando...' : 'Confirmar Rejeição'}
          </Button>
          <Button variant="ghost" onClick={onCancel} disabled={uploading}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
