import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ResolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  text: string;
  onTextChange: (value: string) => void;
  onFilesChange: (files: File[]) => void;
  uploading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ResolutionModal({
  open,
  onOpenChange,
  text,
  onTextChange,
  onFilesChange,
  uploading,
  onConfirm,
  onCancel,
}: ResolutionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Resolução</DialogTitle>
          <DialogDescription>Descreva o que foi feito e anexe arquivos, se necessário.</DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Descreva a resolução..."
          value={text}
          onChange={e => onTextChange(e.target.value)}
          className="min-h-[100px]"
        />
        <Input
          type="file"
          multiple
          onChange={e => onFilesChange(Array.from(e.target.files || []))}
          className="mt-2"
        />
        <DialogFooter>
          <Button onClick={onCancel} variant="outline">Cancelar</Button>
          <Button variant="outline" onClick={onConfirm} disabled={uploading || !text.trim()}>
            {uploading ? 'Salvando...' : 'Salvar Resolução'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
