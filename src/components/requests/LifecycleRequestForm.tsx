import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSemanticIcon } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import { lifecycleFormSchema as formSchema, LifecycleFormValues, DEFAULT_SYSTEM_TRAINING_CONTENT, accessOptions } from './lifecycle/lifecycleSchema';
import { ActionRadioGroup } from './lifecycle/ActionRadioGroup';
import { OffboardingLinkSelect } from './lifecycle/OffboardingLinkSelect';
import { CollaboratorBasicFields } from './lifecycle/CollaboratorBasicFields';
import { AccessItemsCheckboxList } from './lifecycle/AccessItemsCheckboxList';
import { TrainingFields } from './lifecycle/TrainingFields';

const LifecycleRequestForm: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingOnboardings, setLoadingOnboardings] = useState(false);
  const [availableOnboardings, setAvailableOnboardings] = useState<ITRequest[]>([]);

  const form = useForm<LifecycleFormValues>({
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

  const onSubmit = async (data: LifecycleFormValues) => {
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

  const createCicloVidaDescription = (data: LifecycleFormValues): string => {
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
            <ActionRadioGroup form={form} />

            {watchAction === 'offboarding' && (
              <OffboardingLinkSelect
                form={form}
                loading={loadingOnboardings}
                availableOnboardings={availableOnboardings}
                getOnboardingLabel={getOnboardingLabel}
              />
            )}

            {watchAction !== 'offboarding' && <CollaboratorBasicFields form={form} />}



            {watchAction === 'onboarding' && <AccessItemsCheckboxList form={form} />}

            {watchAction === 'training' && <TrainingFields form={form} />}

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
