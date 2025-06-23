import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Upload, X } from 'lucide-react';

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RequestType, RequestPriority } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const requestSchema = z.object({
  description: z.string().min(20, 'Descrição deve ter pelo menos 20 caracteres'),
  type: z.enum(['geral', 'sistemas', 'ajuste_estoque', 'solicitacao_equipamento', 'manutencao_preventiva'] as const),
  priority: z.enum(['baixa', 'media', 'alta'] as const),
});

type RequestFormValues = z.infer<typeof requestSchema>;

interface FileWithPreview extends File {
  preview?: string;
}

const RequestForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const navigate = useNavigate();
  const { profile } = useAuth(); // Changed from user to profile
  
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      description: '',
      type: 'geral',
      priority: 'media',
    },
  });
  
  const onSubmit = async (values: RequestFormValues) => {
    toast({
      title: 'Funcionalidade indisponível',
      description: 'Envio de solicitações não está implementado nesta versão.',
      variant: 'destructive',
    });
    setIsSubmitting(false);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Check file size
    const oversizedFiles = selectedFiles.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      toast({
        title: 'Erro de Tamanho de Arquivo',
        description: `Alguns arquivos excedem o limite de 10MB: ${oversizedFiles.map(f => f.name).join(', ')}`,
        variant: 'destructive',
      });
    }
    
    // Add preview URLs
    const validFiles = selectedFiles
      .filter(file => file.size <= MAX_FILE_SIZE)
      .map(file => {
        return Object.assign(file, {
          preview: URL.createObjectURL(file)
        });
      });
    
    setFiles(prev => [...prev, ...validFiles]);
    e.target.value = '';
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      const file = newFiles[index];
      if (file.preview) URL.revokeObjectURL(file.preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };
  
  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Criar Nova Solicitação</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qual Seu Problema?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="geral" id="geral" />
                          <FormLabel htmlFor="geral" className="font-normal cursor-pointer">
                            Geral (1 dia)
                          </FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sistemas" id="sistemas" />
                          <FormLabel htmlFor="sistemas" className="font-normal cursor-pointer">
                            Sistemas (10 dias)
                          </FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ajuste_estoque" id="ajuste_estoque" />
                          <FormLabel htmlFor="ajuste_estoque" className="font-normal cursor-pointer">
                            Ajuste de Estoque (2 dias)
                          </FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="solicitacao_equipamento" id="solicitacao_equipamento" />
                          <FormLabel htmlFor="solicitacao_equipamento" className="font-normal cursor-pointer">
                            Solicitação de Equipamentos (10 dias)
                          </FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="manutencao_preventiva" id="manutencao_preventiva" />
                          <FormLabel htmlFor="manutencao_preventiva" className="font-normal cursor-pointer">
                            Manutenção Preventiva (5 dias)
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
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="baixa" id="baixa" />
                          <FormLabel htmlFor="baixa" className="font-normal cursor-pointer">
                            Baixa
                          </FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="media" id="media" />
                          <FormLabel htmlFor="media" className="font-normal cursor-pointer">
                            Média
                          </FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="alta" id="alta" />
                          <FormLabel htmlFor="alta" className="font-normal cursor-pointer">
                            Alta
                          </FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva detalhadamente sua solicitação" 
                      className="min-h-[120px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel>Anexos</FormLabel>
              <FormDescription>
                Envie arquivos relacionados à sua solicitação (máx. 10MB por arquivo)
              </FormDescription>
              
              <div className="mt-2 space-y-4">
                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-muted/50 rounded-md">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          
                          {uploadProgress[file.name] !== undefined && (
                            <div className="w-full h-1 mt-1 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${uploadProgress[file.name]}%` }}
                              />
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar Arquivos
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enviar Solicitação
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default RequestForm;
