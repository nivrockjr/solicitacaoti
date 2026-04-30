import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn, getSemanticIcon } from '@/lib/utils';
import { DeliveryItem } from '@/types';

interface EditDeliveryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: DeliveryItem[];
  onItemsChange: React.Dispatch<React.SetStateAction<DeliveryItem[]>>;
  onToggleItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  newItemText: string;
  onNewItemTextChange: (value: string) => void;
  onAddItem: () => void;
  isOffboarding: boolean;
  updating: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function EditDeliveryModal({
  open,
  onOpenChange,
  items,
  onItemsChange,
  onToggleItem,
  onRemoveItem,
  newItemText,
  onNewItemTextChange,
  onAddItem,
  isOffboarding,
  updating,
  onConfirm,
  onCancel,
}: EditDeliveryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Definir Itens de Entrega</DialogTitle>
          <DialogDescription>
            Selecione os itens originais e adicione novos se necessário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4 italic">
                Nenhum item listado. Adicione abaixo.
              </p>
            )}
            {items.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      id={`item-${item.id}`}
                      checked={item.checked}
                      onCheckedChange={() => onToggleItem(item.id)}
                    />
                    <Label
                      htmlFor={`item-${item.id}`}
                      className={cn("text-sm cursor-pointer flex-1", !item.checked && "text-muted-foreground line-through")}
                    >
                      {item.text}
                    </Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    {getSemanticIcon('action-close', { className: 'h-4 w-4' })}
                  </Button>
                </div>
                {item.checked && isOffboarding && (
                  <Input
                    placeholder="Descrever avaria técnica ou motivo de não devolução (Opcional)"
                    className="h-8 text-xs bg-background"
                    value={item.avaria || ''}
                    onChange={(e) => {
                      onItemsChange(prev => prev.map(i => i.id === item.id ? { ...i, avaria: e.target.value } : i));
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Input
              placeholder="Adicionar novo item (ex: Celular)"
              value={newItemText}
              onChange={(e) => onNewItemTextChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAddItem()}
            />
            <Button onClick={onAddItem} size="sm" type="button">
              Adicionar
            </Button>
          </div>

          <div className="p-3 rounded-md border flex gap-3">
            {getSemanticIcon('info', { className: 'h-5 w-5 text-foreground shrink-0 mt-0.5' })}
            <p className="text-[11px] text-foreground leading-normal">
              Ao salvar, a descrição do chamado será atualizada com esta lista e a original será arquivada nos comentários.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={updating}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={updating || items.filter(i => i.checked).length === 0}>
            {updating ? 'Atualizando...' : 'Confirmar e Gerar Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
