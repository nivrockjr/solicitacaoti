import React, { useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
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
import { getSemanticIcon } from '@/lib/utils';
import { createRequest } from '@/services/requestService';

// Define a lot entry type
interface LotEntry {
  id: string;
  lotNumber: string;
  weight: number | undefined;
}

interface ProductEntry {
  id: string;
  productName: string;
  cost: number | undefined;
  lots: LotEntry[];
}

// Updated schema to remove productName and cost as they are dynamic now
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

const StockAdjustmentPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
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
    // Validate products and lots
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
      // Criar uma solicitação de ajuste de estoque
      const requestData = {
        requesterid: user?.id || '', // Corrigido para minúsculo
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
    // Validate products and lots
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
    // Monta a mensagem e abre o WhatsApp imediatamente
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
    // Agora salva a solicitação e redireciona
    try {
      await form.handleSubmit(onSubmit)();
      navigate('/dashboard');
    } catch (error) {
      if (!import.meta.env.PROD) console.error("Erro ao salvar e enviar:", error);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-xl mx-auto bg-card shadow rounded-2xl border p-6 dark-hover-gradient">
        <h1 className="text-xl font-bold mb-6 mt-2">Ajuste de Estoque</h1>
        <Form {...form}>
          <form className="w-full" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-3">
              {/* Nome */}
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Nome <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} className="h-10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              {/* Setor */}
              <FormField control={form.control} name="department" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Setor <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} className="h-10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              {/* Tipo de Ajuste */}
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
              {/* Categoria */}
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
              {/* Renderização Dinâmica de Produtos e Lotes */}
              {products.map((product, pIndex) => (
                <div key={product.id} className="col-span-2 space-y-3">
                  {pIndex > 0 && <hr className="my-4 border-dashed border-border" />}
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* Nome do Produto */}
                    <div className="col-span-1">
                      <FormLabel className="text-sm">Nome do Produto <span className="text-destructive">*</span></FormLabel>
                      <Input
                        type="text"
                        placeholder="Digite o nome do produto"
                        value={product.productName}
                        onChange={e => updateProduct(product.id, 'productName', e.target.value)}
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
                          onChange={e => updateProduct(product.id, 'cost', e.target.value)}
                          className="h-10 w-full"
                          required
                        />
                      </div>
                      {pIndex === products.length - 1 && (
                        <Button type="button" size="icon" variant="outline" onClick={addProduct} title="Adicionar Novo Produto" className="mb-0 mt-6 shrink-0">
                          {getSemanticIcon('action-add', { className: 'h-4 w-4' })}
                        </Button>
                      )}
                      {products.length > 1 && (
                        <Button type="button" size="icon" variant="destructive" onClick={() => removeProduct(product.id)} title="Remover Produto" className="mb-0 mt-6 shrink-0">
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
                            onChange={e => updateLot(product.id, lot.id, 'lotNumber', e.target.value)}
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
                              onChange={e => updateLot(product.id, lot.id, 'weight', e.target.value)}
                              className="h-10 w-full"
                              required
                            />
                          </div>
                          {lIndex === product.lots.length - 1 && (
                            <Button type="button" size="icon" variant="outline" onClick={() => addLot(product.id)} title="Adicionar Lote" className="mb-0 mt-6 shrink-0">
                              {getSemanticIcon('action-add', { className: 'h-4 w-4' })}
                            </Button>
                          )}
                          {product.lots.length > 1 && (
                            <Button type="button" size="icon" variant="destructive" onClick={() => removeLot(product.id, lot.id)} title="Remover Lote" className="mb-0 mt-6 shrink-0">
                              ×
                            </Button>
                          )}
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
              {/* Motivo do Ajuste (colSpan=2) */}
              <FormField control={form.control} name="reason" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel className="text-sm">Motivo do Ajuste <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Textarea {...field} className="min-h-[40px] h-20" placeholder="Descreva o motivo do ajuste" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              {/* Data da Solicitação (colSpan=2) */}
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
              <Button type="button" variant="outline" className="h-10" onClick={() => navigate(-1)}>Cancelar</Button>
              <Button type="button" variant="outline" className="h-10" onClick={saveAndSendToWhatsApp}>Salvar e enviar para o WhatsApp</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default StockAdjustmentPage;
