
import React, { useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { whatsapp, calendar, save } from 'lucide-react';
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
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { createRequest } from '@/services/apiService';
import { StockAdjustment } from '@/types';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  department: z.string().min(1, 'Departamento é obrigatório'),
  adjustmentType: z.string().min(1, 'Tipo de ajuste é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  productName: z.string().min(1, 'Nome do produto é obrigatório'),
  cost: z.coerce.number().min(0, 'Custo deve ser maior ou igual a zero'),
  lotNumber: z.string().min(1, 'Número do lote é obrigatório'),
  weight: z.coerce.number().min(0, 'Peso deve ser maior ou igual a zero'),
  reason: z.string().min(5, 'Descreva o motivo do ajuste'),
  requestDate: z.date({
    required_error: "Data da solicitação é obrigatória",
  }),
});

const StockAdjustmentPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || '',
      department: user?.department || '',
      adjustmentType: '',
      category: '',
      productName: '',
      cost: 0,
      lotNumber: '',
      weight: 0,
      reason: '',
      requestDate: new Date(),
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      // Criar uma solicitação de ajuste de estoque
      const requestData = {
        requesterId: user?.id || '',
        requesterName: data.name,
        requesterEmail: user?.email || '',
        title: `Solicitação de Ajuste de Estoque: ${data.productName}`,
        description: createAdjustmentDescription(data),
        type: 'ajuste_estoque' as const,
        priority: 'media' as const,
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
        description: 'Ocorreu um erro ao enviar sua solicitação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const createAdjustmentDescription = (data: z.infer<typeof formSchema>): string => {
    return `
      Nome: ${data.name}
      Setor: ${data.department}
      Data: ${format(data.requestDate, 'dd/MM/yyyy')}
      
      Detalhes do Ajuste
      Tipo: ${data.adjustmentType}
      Categoria: ${data.category}
      Nome do Produto: ${data.productName}
      Custo: R$ ${data.cost.toFixed(2)}
      Número do Lote: ${data.lotNumber}
      Peso: ${data.weight} kg
      Motivo: ${data.reason}
    `;
  };

  const sendToWhatsApp = () => {
    const formData = form.getValues();
    
    if (!validateFormBeforeWhatsApp()) {
      return;
    }

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
Número do Lote: ${formData.lotNumber}
Peso: ${formData.weight} kg
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
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                      <SelectItem value="devolucao">Devolução</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
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
                      <SelectItem value="materia_prima">Matéria Prima</SelectItem>
                      <SelectItem value="embalagem">Embalagem</SelectItem>
                      <SelectItem value="produto_acabado">Produto Acabado</SelectItem>
                      <SelectItem value="insumo">Insumo</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
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
            
            {/* Número do Lote */}
            <FormField
              control={form.control}
              name="lotNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Número do Lote</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o número do lote" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Peso */}
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Peso (kg)</FormLabel>
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
                        <calendar className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
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
              <save className="mr-2 h-4 w-4" />
              <whatsapp className="mr-2 h-4 w-4" />
              Salvar e enviar para o WhatsApp
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default StockAdjustmentPage;
