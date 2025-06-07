
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { StockAdjustment, AdjustmentType, ProductCategory } from '@/types';

const stockAdjustmentSchema = z.object({
  adjustmentType: z.string().min(1, 'Tipo de ajuste é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  productName: z.string().min(1, 'Nome do produto é obrigatório'),
  cost: z.number().min(0, 'Custo deve ser um valor positivo'),
  lotNumber: z.string().min(1, 'Número do lote é obrigatório'),
  weight: z.number().min(0, 'Peso deve ser um valor positivo'),
  reason: z.string().min(10, 'Justificativa deve ter pelo menos 10 caracteres'),
});

type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;

const StockAdjustmentPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  
  const form = useForm<StockAdjustmentFormData>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      adjustmentType: '',
      category: '',
      productName: '',
      cost: 0,
      lotNumber: '',
      weight: 0,
      reason: '',
    },
  });

  const onSubmit = async (data: StockAdjustmentFormData) => {
    if (!profile) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const stockAdjustment: StockAdjustment = {
        ...data,
        name: profile.name,
        department: profile.department || '',
        requestDate: new Date().toISOString(),
      };

      // Here you would typically save to your backend/database
      console.log('Stock adjustment data:', stockAdjustment);
      
      toast({
        title: "Solicitação Enviada",
        description: "Sua solicitação de ajuste de estoque foi enviada com sucesso.",
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar a solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const adjustmentTypes: { value: AdjustmentType; label: string }[] = [
    { value: 'entrada', label: 'Entrada' },
    { value: 'saida', label: 'Saída' },
    { value: 'transferencia', label: 'Transferência' },
    { value: 'devolucao', label: 'Devolução' },
    { value: 'outro', label: 'Outro' },
  ];

  const productCategories: { value: ProductCategory; label: string }[] = [
    { value: 'materia_prima', label: 'Matéria Prima' },
    { value: 'embalagem', label: 'Embalagem' },
    { value: 'produto_acabado', label: 'Produto Acabado' },
    { value: 'insumo', label: 'Insumo' },
    { value: 'outro', label: 'Outro' },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Solicitação de Ajuste de Estoque</CardTitle>
            <CardDescription>
              Preencha os dados abaixo para solicitar um ajuste no estoque
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Solicitante</label>
                    <Input value={profile?.name || ''} disabled />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Departamento</label>
                    <Input value={profile?.department || ''} disabled />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="adjustmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Ajuste</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de ajuste" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {adjustmentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria do Produto</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {productCategories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="productName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Produto</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o nome do produto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custo (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0,00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Peso (kg)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.001" 
                            placeholder="0,000" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="lotNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Lote</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o número do lote" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Justificativa</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva o motivo do ajuste de estoque"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Forneça uma justificativa detalhada para o ajuste solicitado
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => form.reset()}>
                    Limpar
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StockAdjustmentPage;
