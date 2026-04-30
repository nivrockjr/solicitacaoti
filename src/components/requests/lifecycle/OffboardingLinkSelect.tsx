import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ITRequest } from '@/types';
import { LifecycleFormValues } from './lifecycleSchema';

interface OffboardingLinkSelectProps {
  form: UseFormReturn<LifecycleFormValues>;
  loading: boolean;
  availableOnboardings: ITRequest[];
  getOnboardingLabel: (req: ITRequest) => string;
}

export function OffboardingLinkSelect({
  form,
  loading,
  availableOnboardings,
  getOnboardingLabel,
}: OffboardingLinkSelectProps) {
  return (
    <FormField
      control={form.control}
      name="relatedOnboardingId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Vincular a qual entrega (Onboarding)?</FormLabel>
          <FormControl>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? 'Carregando opções...' : 'Selecione o Onboarding original'} />
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
  );
}
