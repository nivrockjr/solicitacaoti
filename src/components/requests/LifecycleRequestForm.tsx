import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSemanticIcon } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { createRequest, getRequests, updateRequest } from '@/services/requestService';
import { ITRequest } from '@/types';
import { buildLifecycleLinkComment } from '@/utils/lifecycle-links';

const accessOptions = [
  { id: 'conta_canais', label: 'Contas e Canais Corporativos' },
  { id: 'sistemas', label: 'Acesso aos sistemas e pastas' },
  { id: 'equipamentos', label: 'Equipamentos' },
];

const DEFAULT_SYSTEM_TRAINING_CONTENT = `Treinamento: Sistema Online de Solicitação de TI

Conteúdo abordado:
- Como abrir uma nova solicitação;
- Como acompanhar status e comentários;
- Boas práticas no preenchimento de chamados;
- Consulta e histórico de solicitações.
`;

const formSchema = z
  .object({
    action: z.enum(['onboarding', 'offboarding', 'training'], {
      required_error: 'Selecione a ação desejada',
    }),
    collaboratorName: z.string().min(1, 'Nome do colaborador é obrigatório'),
    department: z.string().min(1, 'Setor é obrigatório'),
    relatedOnboardingId: z.string().optional(),
    accessItems: z.array(z.string()).optional(),
    trainingMode: z.enum(['system', 'custom']).optional(),
    trainingContent: z.string().optional(),
    description: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === 'onboarding') {
      if (!data.accessItems || data.accessItems.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecione ao menos um recurso ou acesso.',
          path: ['accessItems'],
        });
      }
    }
    if (data.action === 'training') {
      if (!data.trainingMode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecione uma opção de treinamento.',
          path: ['trainingMode'],
        });
      }
      if (!data.trainingContent || data.trainingContent.trim().length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Informe o conteúdo do treinamento (mínimo 10 caracteres).',
          path: ['trainingContent'],
        });
      }
    }
  });

const LifecycleRequestForm: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingOnboardings, setLoadingOnboardings] = useState(false);
  const [availableOnboardings, setAvailableOnboardings] = useState<ITRequest[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      action: 'onboarding',
      collaboratorName: '',
      department: '',
      relatedOnboardingId: '',
      accessItems: [],
      trainingMode: undefined,
      trainingContent: '',
      description: '',
    },
  });

  const watchAction = form.watch('action');

  useEffect(() => {
    if (watchAction === 'training') {
      form.setValue('accessItems', []);
      if (!form.getValues('trainingMode')) {
        form.setValue('trainingMode', 'system');
      }
      if (!form.getValues('trainingContent')?.trim()) {
        form.setValue('trainingContent', DEFAULT_SYSTEM_TRAINING_CONTENT);
      }
    } else if (watchAction === 'offboarding') {
      form.setValue('accessItems', []);
      form.setValue('trainingMode', undefined);
      form.setValue('trainingContent', '');
    } else {
      form.setValue('trainingMode', undefined);
      form.setValue('trainingContent', '');
    }
  }, [watchAction, form]);

  useEffect(() => {
    const loadAvailableOnboardings = async () => {
      if (!user?.email) return;
      if (watchAction !== 'offboarding') {
        setAvailableOnboardings([]);
        return;
      }

      setLoadingOnboardings(true);
      try {
        const { data } = await getRequests(user.email, 1, 1000, undefined, undefined, { fullData: true });
        const allLifecycle = (data || []).filter((request) => request.type === 'employee_lifecycle' || request.type === 'ciclo_colaborador');
        
        const usedIds = new Set();
        allLifecycle.forEach(req => {
          const isOff = req.metadata?.form_data?.action === 'offboarding' || (req.title || '').toLowerCase().startsWith('offboarding');
          if (isOff) {
            const linkedId = req.metadata?.form_data?.relatedOnboardingId;
            if (linkedId) usedIds.add(linkedId);
            const bodyLink = req.description?.match(/\[LIFECYCLE_LINK:onboarding:(.+?)\]/);
            if (bodyLink) usedIds.add(bodyLink[1]);
          }
        });

        const activeOnboardings = allLifecycle.filter((request) => {
          const isOnb = request.metadata?.form_data?.action === 'onboarding' || (request.title || '').toLowerCase().startsWith('onboarding');
          return isOnb && !usedIds.has(request.id);
        });

        setAvailableOnboardings(activeOnboardings);
      } catch (error) {
        if (!import.meta.env.PROD) console.error('Erro ao buscar onboardings relacionados:', error);
        setAvailableOnboardings([]);
      } finally {
        setLoadingOnboardings(false);
      }
    };

    loadAvailableOnboardings();
  }, [user?.email, watchAction]);

  const watchRelatedId = form.watch('relatedOnboardingId');

  useEffect(() => {
    if (watchAction === 'offboarding' && watchRelatedId) {
      const selected = availableOnboardings.find(onb => onb.id === watchRelatedId);
      if (selected) {
        const name = selected.metadata?.form_data?.collaboratorName || selected.title?.split(' - ')[1] || selected.requestername || '';
        const depto = selected.metadata?.form_data?.department || selected.description?.match(/Setor:\s*(.+?)(?:\n|$)/)?.[1]?.trim() || '';
        
        form.setValue('collaboratorName', name);
        form.setValue('department', depto);
      }
    }
  }, [watchAction, watchRelatedId, availableOnboardings, form]);

  const getOnboardingLabel = (req: ITRequest) => {
    const name = req.metadata?.form_data?.collaboratorName || req.title?.split(' - ')[1] || req.requestername || 'Colaborador';
    const depto = req.metadata?.form_data?.department || req.description?.match(/Setor:\s*(.+?)(?:\n|$)/)?.[1]?.trim() || 'N/I';
    const dataRef = req.createdat ? new Date(req.createdat).toLocaleDateString('pt-BR') : 'N/I';
    return `Onboarding de ${name} — ${depto} (${dataRef}) | ID: #${req.id}`;
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      const normalizedAction = data.action;
      if (
        normalizedAction === 'offboarding' &&
        availableOnboardings.length > 0 &&
        !data.relatedOnboardingId
      ) {
        toast({
          title: 'Onboarding obrigatório',
          description: 'Selecione o onboarding relacionado para continuar.',
          variant: 'destructive',
        });
        return;
      }

      const actionLabels = {
        onboarding: 'Onboarding',
        offboarding: 'Offboarding',
        training: 'Treinamento',
      };

      const lifecycleComments = [];
      if (normalizedAction === 'offboarding' && data.relatedOnboardingId) {
        lifecycleComments.push(buildLifecycleLinkComment('onboarding', data.relatedOnboardingId));
      }

      const requestData: Omit<ITRequest, 'id' | 'createdat' | 'deadlineat'> = {
        requesterid: user?.id || '',
        requestername: user?.name || '',
        requesteremail: user?.email || '',
        title: `${actionLabels[data.action]} - ${data.collaboratorName}`,
        description: createCicloVidaDescription(data),
        type: 'employee_lifecycle' as const,
        priority: 'medium' as const,
        status: 'new' as const,
        comments: lifecycleComments,
        metadata: { form_data: data },
      };

      const createdRequest = await createRequest(requestData);

      if (normalizedAction === 'offboarding' && data.relatedOnboardingId) {
        try {
          const related = availableOnboardings.find((item) => item.id === data.relatedOnboardingId);
          const existingComments = Array.isArray(related?.comments) ? related.comments : [];
          const reverseComment = buildLifecycleLinkComment('offboarding', createdRequest.id);
          await updateRequest(data.relatedOnboardingId, {
            comments: [...existingComments, reverseComment],
          });
        } catch (relationError) {
          if (!import.meta.env.PROD) console.error('Falha ao registrar vínculo no onboarding original:', relationError);
          toast({
            title: 'Solicitação criada com ressalva',
            description: 'O offboarding foi criado, mas o vínculo reverso não foi salvo automaticamente.',
            variant: 'destructive',
          });
        }
      }

      toast({
        title: 'Solicitação enviada',
        description: `Sua solicitação de ${actionLabels[data.action]} foi enviada com sucesso!`,
      });

      navigate('/dashboard');
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

  const createCicloVidaDescription = (data: z.infer<typeof formSchema>): string => {
    const actionLabels = {
      onboarding: 'Onboarding',
      offboarding: 'Offboarding',
      training: 'Treinamento',
    };

    let desc = `Ação: ${actionLabels[data.action]}\n`;
    desc += `Colaborador: ${data.collaboratorName}\n`;
    desc += `Setor: ${data.department}\n`;
    desc += `Prazo: definido automaticamente pelo sistema conforme política de SLA.\n\n`;

    if (data.action === 'onboarding' && data.accessItems && data.accessItems.length > 0) {
      const getLabel = (id: string) => {
        const option = accessOptions.find(o => o.id === id);
        return option ? option.label : id;
      };
      const labels = data.accessItems.map(getLabel);
      desc += `Recursos/Acessos: ${labels.join(', ')}\n\n`;
    }

    if (data.action === 'training') {
      const trainingModeLabel =
        data.trainingMode === 'system'
          ? 'Sistema de Solicitação de TI (Guia do Usuário)'
          : 'Treinamento Personalizado';
      desc += `Tipo de Treinamento: ${trainingModeLabel}\n\n`;
      desc += `Conteúdo do Treinamento:\n${data.trainingContent?.trim() || ''}\n\n`;
    }

    if (data.description) {
      desc += `Observações: ${data.description}`;
    }

    return desc.trim();
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-xl mx-auto bg-card shadow rounded-2xl border p-6 dark-hover-gradient">
        <h1 className="text-xl font-bold mb-6 mt-2">Ciclo de Vida do Colaborador</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Ação Desejada</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="onboarding" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer flex items-center gap-2">
                          {getSemanticIcon('user-check', { className: 'h-4 w-4 text-success' })} Onboarding
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="offboarding" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer flex items-center gap-2">
                          {getSemanticIcon('user-minus', { className: 'h-4 w-4 text-destructive' })} Offboarding
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="training" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer flex items-center gap-2">
                          {getSemanticIcon('graduation', { className: 'h-4 w-4 text-primary' })} Treinamento
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchAction === 'offboarding' && (
              <FormField
                control={form.control}
                name="relatedOnboardingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vincular a qual entrega (Onboarding)?</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingOnboardings ? 'Carregando opções...' : 'Selecione o Onboarding original'} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableOnboardings.length === 0 ? (
                            <SelectItem value="none" disabled>
                              Nenhum colaborador elegível para devolução encontrado.
                            </SelectItem>
                          ) : (
                            availableOnboardings.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {getOnboardingLabel(item)}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Ao selecionar, o sistema preencherá automaticamente os dados do colaborador.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchAction !== 'offboarding' && (
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="collaboratorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Colaborador</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} className="h-10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Setor</FormLabel>
                      <FormControl>
                        <Input placeholder="Departamento" {...field} className="h-10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}



            {watchAction === 'onboarding' && (
              <FormField
                control={form.control}
                name="accessItems"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Recursos e Acessos</FormLabel>
                      <p className="text-xs text-muted-foreground mt-1">
                        Marque apenas o que se aplica a esta solicitação (obrigatório ao menos um).
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {accessOptions.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="accessItems"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), item.id])
                                        : field.onChange(
                                            field.value?.filter((value) => value !== item.id)
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {item.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchAction === 'training' && (
              <div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-primary/10">
                <div className="flex items-center gap-2 text-primary font-semibold mb-2">
                  {getSemanticIcon('book', { className: 'h-5 w-5' })}
                  <h3 className="text-sm uppercase tracking-wider">Configuração do Treinamento</h3>
                </div>

                <FormField
                  control={form.control}
                  name="trainingMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Treinamento</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value === 'system') {
                              form.setValue('trainingContent', DEFAULT_SYSTEM_TRAINING_CONTENT);
                            } else if (!form.getValues('trainingContent')?.trim()) {
                              form.setValue('trainingContent', '');
                            }
                          }}
                          value={field.value}
                          className="space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="system" id="training-system" />
                            <FormLabel htmlFor="training-system" className="font-normal cursor-pointer">
                              Treinamento do Sistema Online de Solicitação de TI
                            </FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="custom" id="training-custom" />
                            <FormLabel htmlFor="training-custom" className="font-normal cursor-pointer">
                              Treinamento Personalizado
                            </FormLabel>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trainingContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conteúdo do Treinamento</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o conteúdo que será apresentado ao colaborador."
                          className="min-h-[140px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Este texto será exibido no link de treinamento antes do aceite e da assinatura.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase font-bold text-muted-foreground">
                    {watchAction === 'training' ? 'Observações Adicionais' : 'Informações Complementares'}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        watchAction === 'training'
                          ? 'Descreva detalhes específicos do treinamento...'
                          : 'Campo opcional. Use para informar detalhes importantes desta solicitação. Se precisar adicionar novos itens após um onboarding já concluído, abra uma nova solicitação de onboarding.'
                      }
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                'Enviando...'
              ) : (
                <>
                  {getSemanticIcon('action-save', { className: 'mr-2 h-4 w-4' })} Salvar Solicitação
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default LifecycleRequestForm;
