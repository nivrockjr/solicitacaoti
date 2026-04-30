import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { LifecycleFormValues, accessOptions } from './lifecycleSchema';

interface AccessItemsCheckboxListProps {
  form: UseFormReturn<LifecycleFormValues>;
}

export function AccessItemsCheckboxList({ form }: AccessItemsCheckboxListProps) {
  return (
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
  );
}
