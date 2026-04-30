import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { getSemanticIcon } from '@/lib/utils';
import { LifecycleFormValues, DEFAULT_SYSTEM_TRAINING_CONTENT } from './lifecycleSchema';

interface TrainingFieldsProps {
  form: UseFormReturn<LifecycleFormValues>;
}

export function TrainingFields({ form }: TrainingFieldsProps) {
  return (
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
  );
}
