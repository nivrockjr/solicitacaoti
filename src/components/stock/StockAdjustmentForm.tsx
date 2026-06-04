import React, { useState } from 'react';
import { format } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { createRequest } from '@/services/requestService';

import { ProductEntry } from '@/components/stock/stockTypes';
import { ProductLotsBlock } from '@/components/stock/ProductLotsBlock';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  department: z.string().min(1, 'Departamento é obrigatório'),
  adjustmentType: z.string().min(1, 'Tipo de ajuste é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  reason: z.string().min(3, 'Descreva o motivo do ajuste (mínimo 3 caracteres)'),
  requestDate: z.date({
    required_error: "Data da solicitação é obrigatória",
  }),
});

interface StockAdjustmentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const StockAdjustmentForm: React.FC<StockAdjustmentFormProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductEntry[]>([{ 
    id: '1', 
    productName: '', 
    cost: undefined, 
    lots: [{ id: '1-1', lotNumber: '', weight: undefined }] 
  }]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || '',
      department: user?.department || '',
      adjustmentType: '',
      category: '',
      reason: '',
      requestDate: new Date(),
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (products.some(p => !p.productName || p.cost === undefined || p.cost < 0.01)) {
      toast({
        title: "Dados do produto obrigatórios",
        description: "Por favor, preencha o nome e um custo válido (> 0) para todos os produtos",
        variant: "destructive",
      });
      return;
    }
    for (const product of products) {
      if (product.lots.some(lot => !lot.lotNumber)) {
        toast({
          title: "Número de lote obrigatório",
          description: "Por favor, preencha o número do lote para todos os itens",
          variant: "destructive",
        });
        return;
      }
      if (product.lots.some(lot => !lot.weight || lot.weight <= 0)) {
        toast({
          title: "Peso obrigatório",
          description: "Por favor, preencha o peso (> 0) para todos os lotes",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        requesterid: user?.id || '',
        requestername: data.name,
        requesteremail: user?.email || '',
        title: `Ajuste de Estoque: ${products[0].productName}${products.length > 1 ? ' e outros' : ''}`,
        description: createAdjustmentDescription(data),
        type: 'ajuste_estoque' as const,
        priority: 'high' as const,
        status: 'new' as const,
      };

      await createRequest(requestData);

      toast({
        title: 'Solicitação enviada',
        description: 'Sua solicitação de ajuste de estoque foi enviada com sucesso!',
      });

    } catch (error) {
      if (!import.meta.env.PROD) console.error('Erro ao enviar solicitação:', error);
      toast({
        title: 'Erro',
        description: `Ocorreu um erro ao enviar sua solicitação: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const createAdjustmentDescription = (data: z.infer<typeof formSchema>): string => {
    const productsInfo = products.map((p) => {
      const lotsInfo = p.lots.map((lot, lIndex) => 
        `Lote ${lIndex + 1}: ${lot.lotNumber}, Peso: ${lot.weight || 0} kg`
      ).join('\n');
      return `Nome do Produto: ${p.productName}\nCusto: R$ ${(p.cost || 0).toFixed(2)}\n\nLotes:\n${lotsInfo}`;
    }).join('\n\n');

    return `
      Nome: ${data.name}
      Setor: ${data.department}
      Data: ${format(data.requestDate, 'dd/MM/yyyy')}
      
      Detalhes do Ajuste
      Tipo: ${data.adjustmentType}
      Categoria: ${data.category}
      
      ${productsInfo}
      
      Motivo: ${data.reason}
    `.trim();
  };

  const addProduct = () => {
    setProducts([...products, { 
      id: Date.now().toString(), 
      productName: '', 
      cost: undefined, 
      lots: [{ id: Date.now().toString() + '-1', lotNumber: '', weight: undefined }] 
    }]);
  };

  const removeProduct = (productId: string) => {
    if (products.length > 1) {
      setProducts(products.filter(p => p.id !== productId));
    }
  };

  const updateProduct = (productId: string, field: 'productName' | 'cost', value: string | number) => {
    setProducts(products.map(p => 
      p.id === productId ? { 
        ...p, 
        [field]: field === 'cost' ? (value === '' ? undefined : Number(value)) : value 
      } : p
    ));
  };

  const addLot = (productId: string) => {
    setProducts(products.map(p => 
      p.id === productId 
        ? { ...p, lots: [...p.lots, { id: Date.now().toString(), lotNumber: '', weight: undefined }] }
        : p
    ));
  };

  const removeLot = (productId: string, lotId: string) => {
    setProducts(products.map(p => {
      if (p.id === productId && p.lots.length > 1) {
        return { ...p, lots: p.lots.filter(lot => lot.id !== lotId) };
      }
      return p;
    }));
  };

  const updateLot = (productId: string, lotId: string, field: 'lotNumber' | 'weight', value: string | number) => {
    setProducts(products.map(p => 
      p.id === productId 
        ? { 
            ...p, 
            lots: p.lots.map(lot => 
              lot.id === lotId 
                ? { ...lot, [field]: field === 'weight' ? (value === '' ? undefined : Number(value)) : value }
                : lot
            )
          }
        : p
    ));
  };

  const saveAndSendToWhatsApp = async () => {
    const isFormValid = await form.trigger();
    if (!isFormValid) {
      toast({
        title: "Formulário incompleto",
        description: "Por favor, preencha todos os campos obrigatórios antes de enviar.",
        variant: "destructive",
      });
      return;
    }
    if (products.some(p => !p.productName || p.cost === undefined || p.cost < 0.01)) {
      toast({
        title: "Dados do produto obrigatórios",
        description: "Por favor, preencha o nome e um custo válido (> 0) para todos os produtos",
        variant: "destructive",
      });
      return;
    }
    for (const product of products) {
      if (product.lots.some(lot => !lot.lotNumber)) {
        toast({
          title: "Número de lote obrigatório",
          description: "Por favor, preencha o número do lote para todos os itens",
          variant: "destructive",
        });
        return;
      }
      if (product.lots.some(lot => !lot.weight || lot.weight <= 0)) {
        toast({
          title: "Peso obrigatório",
          description: "Por favor, preencha o peso (> 0) para todos os lotes",
          variant: "destructive",
        });
        return;
      }
    }
    const formData = form.getValues();
    const productsInfo = products.map((p) => {
      const lotsInfo = p.lots.map((lot, lIndex) => 
        `Lote ${lIndex + 1}: ${lot.lotNumber}, Peso: ${lot.weight || 0} kg`
      ).join('\n');
      return `Nome do Produto: ${p.productName}\nCusto: R$ ${(p.cost || 0).toFixed(2)}\n\nLotes:\n${lotsInfo}`;
    }).join('\n\n------------------------\n\n');

    const message = `\n*Genius PQVIRK - Solicitação de Ajuste de Estoque*\n\nNome: ${formData.name}\nSetor: ${formData.department}\nData: ${format(formData.requestDate, 'dd/MM/yyyy')}\n\n*Detalhes do Ajuste*\nTipo: ${formData.adjustmentType}\nCategoria: ${formData.category}\n\n${productsInfo}\n\nMotivo: ${formData.reason}`.trim();
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    
    try {
      await form.handleSubmit(onSubmit)();
      if (onSuccess) onSuccess();
    } catch (error) {
      if (!import.meta.env.PROD) console.error("Erro ao salvar e enviar:", error);
    }
  };

  return (
    <Form {...form}>
      <form className="w-full" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Nome <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input {...field} className="h-10" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="department" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Setor <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input {...field} className="h-10" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="adjustmentType" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Tipo de Ajuste <span className="text-destructive">*</span></FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="positivo">Positivo</SelectItem>
                  <SelectItem value="negativo">Negativo</SelectItem>
                  <SelectItem value="relacionamento">Relacionamento</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Categoria <span className="text-destructive">*</span></FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="composicao">Composição</SelectItem>
                  <SelectItem value="materia_prima">Matéria-prima</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          
          {products.map((product, pIndex) => (
            <ProductLotsBlock
              key={product.id}
              product={product}
              index={pIndex}
              totalProducts={products.length}
              onUpdateProduct={updateProduct}
              onRemoveProduct={removeProduct}
              onAddProduct={addProduct}
              onUpdateLot={updateLot}
              onAddLot={addLot}
              onRemoveLot={removeLot}
            />
          ))}
          
          <FormField control={form.control} name="reason" render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel className="text-sm">Motivo do Ajuste <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Textarea {...field} className="min-h-[40px] h-20" placeholder="Descreva o motivo do ajuste" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="requestDate" render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel className="text-sm">Data da Solicitação <span className="text-destructive">*</span></FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Input
                      type="text"
                      readOnly
                      value={field.value ? format(field.value, "dd/MM/yyyy") : ''}
                      className="h-10 cursor-pointer"
                      placeholder="Selecione a data"
                      onClick={e => e.preventDefault()}
                    />
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <CalendarComponent mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" className="h-10" onClick={onCancel}>Cancelar</Button>
          <Button type="button" variant="outline" className="h-10" onClick={saveAndSendToWhatsApp}>Salvar e enviar para o WhatsApp</Button>
        </div>
      </form>
    </Form>
  );
};
