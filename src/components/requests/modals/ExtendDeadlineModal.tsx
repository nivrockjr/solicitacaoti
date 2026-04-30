import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface ExtendDeadlineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newDeadline: string;
  onNewDeadlineChange: (value: string) => void;
  reason: string;
  onReasonChange: (value: string) => void;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExtendDeadlineModal({
  open,
  onOpenChange,
  newDeadline,
  onNewDeadlineChange,
  reason,
  onReasonChange,
  submitting,
  onConfirm,
  onCancel,
}: ExtendDeadlineModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Estender Prazo da Solicitação</DialogTitle>
          <DialogDescription>Informe o novo prazo e o motivo da alteração.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Novo Prazo *</label>
            <Input
              type="date"
              value={newDeadline}
              onChange={e => onNewDeadlineChange(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Motivo *</label>
            <Textarea
              value={reason}
              onChange={e => onReasonChange(e.target.value)}
              placeholder="Descreva o motivo"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={submitting}>Cancelar</Button>
          <Button variant="outline" onClick={onConfirm} disabled={submitting || !newDeadline || !reason.trim()}>
            {submitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
