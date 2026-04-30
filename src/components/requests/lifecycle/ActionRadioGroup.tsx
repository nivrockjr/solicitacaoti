import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getSemanticIcon } from '@/lib/utils';
import { LifecycleFormValues } from './lifecycleSchema';

interface ActionRadioGroupProps {
  form: UseFormReturn<LifecycleFormValues>;
}

export function ActionRadioGroup({ form }: ActionRadioGroupProps) {
  return (
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
  );
}
