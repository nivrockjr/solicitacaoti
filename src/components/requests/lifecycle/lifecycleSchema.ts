import * as z from 'zod';

export const accessOptions = [
  { id: 'conta_canais', label: 'Contas e Canais Corporativos' },
  { id: 'sistemas', label: 'Acesso aos sistemas e pastas' },
  { id: 'equipamentos', label: 'Equipamentos' },
];

export const DEFAULT_SYSTEM_TRAINING_CONTENT = `Treinamento: Sistema Online de Solicitação de TI

Conteúdo abordado:
- Como abrir uma nova solicitação;
- Como acompanhar status e comentários;
- Boas práticas no preenchimento de chamados;
- Consulta e histórico de solicitações.
`;

export const lifecycleFormSchema = z
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

export type LifecycleFormValues = z.infer<typeof lifecycleFormSchema>;
