import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface DeleteRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string | undefined;
  submitting: boolean;
  onConfirm: () => void;
}

export function DeleteRequestDialog({
  open,
  onOpenChange,
  requestId,
  submitting,
  onConfirm,
}: DeleteRequestDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && !submitting && onOpenChange(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir solicitação?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação removerá permanentemente a solicitação #{requestId} e seus anexos. Não é possível desfazer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={submitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {submitting ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
