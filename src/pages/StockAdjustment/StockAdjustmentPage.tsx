import React, { useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Save } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { createRequest } from '@/services/apiService';

// Define a lot entry type
interface LotEntry {
  id: string;
  lotNumber: string;
  weight: number;
}

// Updated schema to include lots array
const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  department: z.string().min(1, 'Departamento é obrigatório'),
  adjustmentType: z.string().min(1, 'Tipo de ajuste é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  productName: z.string().min(1, 'Nome do produto é obrigatório'),
  cost: z.coerce.number().min(0.01, 'Custo é obrigatório'),
  reason: z.string().min(3, 'Descreva o motivo do ajuste (mínimo 3 caracteres)'),
  requestDate: z.date({
    required_error: "Data da solicitação é obrigatória",
  }),
});

const StockAdjustmentPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lots, setLots] = useState<LotEntry[]>([{ id: '1', lotNumber: '', weight: 0 }]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || '',
      department: user?.department || '',
      adjustmentType: '',
      category: '',
      productName: '',
      cost: 0,
      reason: '',
      requestDate: new Date(),
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    // Validate lots
    if (lots.some(lot => !lot.lotNumber)) {
      toast({
        title: "Número de lote obrigatório",
        description: "Por favor, preencha o número do lote para todos os itens",
        variant: "destructive",
      });
      return;
    }
    if (lots.some(lot => !lot.weight || lot.weight <= 0)) {
      toast({
        title: "Peso obrigatório",
        description: "Por favor, preencha o peso (> 0) para todos os lotes",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Criar uma solicitação de ajuste de estoque
      const requestData = {
        requesterId: user?.id || '',
        requesterName: data.name,
        requesterEmail: user?.email || '',
        title: `Ajuste de Estoque - ${data.name}`,
        description: createAdjustmentDescription(data),
        type: 'ajuste_estoque' as const,
        priority: 'alta' as const,
        status: 'nova' as const,
      };

      await createRequest(requestData);

      toast({
        title: 'Solicitação enviada',
        description: 'Sua solicitação de ajuste de estoque foi enviada com sucesso!',
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
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
    const lotsInfo = lots.map((lot, index) => 
      `Lote ${index + 1}: ${lot.lotNumber}, Peso: ${lot.weight} kg`
    ).join('\n');

    return `
      Nome: ${data.name}
      Setor: ${data.department}
      Data: ${format(data.requestDate, 'dd/MM/yyyy')}
      
      Detalhes do Ajuste
      Tipo: ${data.adjustmentType}
      Categoria: ${data.category}
      Nome do Produto: ${data.productName}
      Custo: R$ ${data.cost.toFixed(2)}
      
      Lotes:
      ${lotsInfo}
      
      Motivo: ${data.reason}
    `;
  };

  const addLot = () => {
    setLots([...lots, { id: Date.now().toString(), lotNumber: '', weight: 0 }]);
  };

  const removeLot = (id: string) => {
    if (lots.length > 1) {
      setLots(lots.filter(lot => lot.id !== id));
    }
  };

  const updateLot = (id: string, field: 'lotNumber' | 'weight', value: string | number) => {
    setLots(lots.map(lot => 
      lot.id === id ? { ...lot, [field]: value } : lot
    ));
  };

  const sendToWhatsApp = () => {
    const formData = form.getValues();
    
    if (!validateFormBeforeWhatsApp()) {
      return;
    }

    // Check if lots are filled out
    if (lots.some(lot => !lot.lotNumber)) {
      toast({
        title: "Número de lote obrigatório",
        description: "Por favor, preencha o número do lote para todos os itens",
        variant: "destructive",
      });
      return;
    }

    const lotsInfo = lots.map((lot, index) => 
      `Lote ${index + 1}: ${lot.lotNumber}, Peso: ${lot.weight} kg`
    ).join('\n');

    const message = `
Genius PQVIRK - Solicitação de Ajuste de Estoque

Nome: ${formData.name}
Setor: ${formData.department}
Data: ${format(formData.requestDate, 'dd/MM/yyyy')}

Detalhes do Ajuste
Tipo: ${formData.adjustmentType}
Categoria: ${formData.category}
Nome do Produto: ${formData.productName}
Custo: R$ ${formData.cost.toFixed(2)}

Lotes:
${lotsInfo}

Motivo: ${formData.reason}
    `.trim();

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const validateFormBeforeWhatsApp = (): boolean => {
    const result = form.trigger();
    if (!result) {
      toast({
        title: "Formulário incompleto",
        description: "Por favor, preencha todos os campos obrigatórios antes de enviar.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const saveAndSendToWhatsApp = async () => {
    const isFormValid = validateFormBeforeWhatsApp();
    if (!isFormValid) return;

    // Check if lots are filled out
    if (lots.some(lot => !lot.lotNumber)) {
      toast({
        title: "Número de lote obrigatório",
        description: "Por favor, preencha o número do lote para todos os itens",
        variant: "destructive",
      });
      return;
    }

    try {
      await form.handleSubmit(onSubmit)();
      sendToWhatsApp();
    } catch (error) {
      console.error("Erro ao salvar e enviar:", error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Ajuste de Estoque</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Nome <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Digite seu nome" readOnly {...field} className="bg-muted" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Departamento */}
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Departamento</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite seu setor" readOnly {...field} className="bg-muted" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Tipo de Ajuste */}
            <FormField
              control={form.control}
              name="adjustmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Tipo de Ajuste <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
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
              )}
            />
            
            {/* Categoria */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Categoria <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="composicao">Composição</SelectItem>
                      <SelectItem value="produto_acabado">Produto Acabado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Nome do Produto */}
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Nome do Produto</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome do produto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Custo */}
            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Custo (R$)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      placeholder="0" 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Lotes e Pesos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Lotes e Pesos</h3>
              <Button 
                type="button"
                variant="outline"
                size="sm"
                onClick={addLot}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Adicionar Lote
              </Button>
            </div>
            
            {lots.map((lot, index) => (
              <div key={lot.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md">
                <div>
                  <FormLabel htmlFor={`lot-${lot.id}`} className="text-base">
                    Número do Lote <span className="text-red-500">*</span>
                  </FormLabel>
                  <Input
                    id={`lot-${lot.id}`}
                    placeholder="Digite o número do lote"
                    value={lot.lotNumber}
                    onChange={(e) => updateLot(lot.id, 'lotNumber', e.target.value)}
                  />
                </div>
                <div>
                  <FormLabel htmlFor={`weight-${lot.id}`} className="text-base">Peso (kg)</FormLabel>
                  <Input
                    id={`weight-${lot.id}`}
                    type="number"
                    min="0"
                    step="0.0001"
                    placeholder="0"
                    value={lot.weight.toString()}
                    onChange={(e) => updateLot(lot.id, 'weight', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-end">
                  {lots.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeLot(lot.id)}
                      className="mt-auto"
                    >
                      Remover
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Motivo do Ajuste */}
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Motivo do Ajuste</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descreva o motivo do ajuste" rows={4} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Data da Solicitação */}
          <FormField
            control={form.control}
            name="requestDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-base">Data da Solicitação</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy")
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <Calendar className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={saveAndSendToWhatsApp}
              disabled={isSubmitting}
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar e enviar para o WhatsApp
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default StockAdjustmentPage;
