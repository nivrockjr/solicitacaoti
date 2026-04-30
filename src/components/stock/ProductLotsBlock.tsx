import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormLabel } from '@/components/ui/form';
import { getSemanticIcon } from '@/lib/utils';
import { ProductEntry } from './stockTypes';

interface ProductLotsBlockProps {
  product: ProductEntry;
  index: number;
  totalProducts: number;
  onUpdateProduct: (productId: string, field: 'productName' | 'cost', value: string | number) => void;
  onRemoveProduct: (productId: string) => void;
  onAddProduct: () => void;
  onUpdateLot: (productId: string, lotId: string, field: 'lotNumber' | 'weight', value: string | number) => void;
  onAddLot: (productId: string) => void;
  onRemoveLot: (productId: string, lotId: string) => void;
}

export function ProductLotsBlock({
  product,
  index,
  totalProducts,
  onUpdateProduct,
  onRemoveProduct,
  onAddProduct,
  onUpdateLot,
  onAddLot,
  onRemoveLot,
}: ProductLotsBlockProps) {
  const isLastProduct = index === totalProducts - 1;

  return (
    <div className="col-span-2 space-y-3">
      {index > 0 && <hr className="my-4 border-dashed border-border" />}

      <div className="grid grid-cols-2 gap-3">
        {/* Nome do Produto */}
        <div className="col-span-1">
          <FormLabel className="text-sm">Nome do Produto <span className="text-destructive">*</span></FormLabel>
          <Input
            type="text"
            placeholder="Digite o nome do produto"
            value={product.productName}
            onChange={e => onUpdateProduct(product.id, 'productName', e.target.value)}
            className="h-10 w-full"
            required
          />
        </div>
        {/* Custo + Botão Adicionar Produto */}
        <div className="col-span-1 flex gap-2 items-end">
          <div className="flex-1">
            <FormLabel className="text-sm">Custo (R$) <span className="text-destructive">*</span></FormLabel>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={product.cost === undefined ? '' : product.cost}
              onChange={e => onUpdateProduct(product.id, 'cost', e.target.value)}
              className="h-10 w-full"
              required
            />
          </div>
          {isLastProduct && (
            <Button type="button" size="icon" variant="outline" onClick={onAddProduct} title="Adicionar Novo Produto" className="mb-0 mt-6 shrink-0">
              {getSemanticIcon('action-add', { className: 'h-4 w-4' })}
            </Button>
          )}
          {totalProducts > 1 && (
            <Button type="button" size="icon" variant="destructive" onClick={() => onRemoveProduct(product.id)} title="Remover Produto" className="mb-0 mt-6 shrink-0">
              ×
            </Button>
          )}
        </div>

        {/* Lotes do Produto */}
        {product.lots.map((lot, lIndex) => (
          <React.Fragment key={lot.id}>
            {/* Número do Lote */}
            <div className="col-span-1">
              <FormLabel className="text-sm">Número do Lote <span className="text-destructive">*</span></FormLabel>
              <Input
                type="text"
                placeholder="Digite o número do lote"
                value={lot.lotNumber}
                onChange={e => onUpdateLot(product.id, lot.id, 'lotNumber', e.target.value)}
                className="h-10 w-full"
                required
              />
            </div>
            {/* Peso (kg) + Botão Adicionar Lote */}
            <div className="col-span-1 flex gap-2 items-end">
              <div className="flex-1">
                <FormLabel className="text-sm">Peso (kg) <span className="text-destructive">*</span></FormLabel>
                <Input
                  type="number"
                  min="0"
                  step="0.0001"
                  placeholder="Digite o peso"
                  value={lot.weight === undefined ? '' : lot.weight}
                  onChange={e => onUpdateLot(product.id, lot.id, 'weight', e.target.value)}
                  className="h-10 w-full"
                  required
                />
              </div>
              {lIndex === product.lots.length - 1 && (
                <Button type="button" size="icon" variant="outline" onClick={() => onAddLot(product.id)} title="Adicionar Lote" className="mb-0 mt-6 shrink-0">
                  {getSemanticIcon('action-add', { className: 'h-4 w-4' })}
                </Button>
              )}
              {product.lots.length > 1 && (
                <Button type="button" size="icon" variant="destructive" onClick={() => onRemoveLot(product.id, lot.id)} title="Remover Lote" className="mb-0 mt-6 shrink-0">
                  ×
                </Button>
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
