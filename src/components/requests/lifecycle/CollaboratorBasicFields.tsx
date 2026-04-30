import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LifecycleFormValues } from './lifecycleSchema';

interface CollaboratorBasicFieldsProps {
  form: UseFormReturn<LifecycleFormValues>;
}

export function CollaboratorBasicFields({ form }: CollaboratorBasicFieldsProps) {
  return (
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
  );
}
