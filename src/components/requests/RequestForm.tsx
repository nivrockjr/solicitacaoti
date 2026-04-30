import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getSemanticIcon } from '@/lib/utils';

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createRequest, uploadFile } from '@/services/requestService';
import { ITRequest } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const requestSchema = z.object({
  description: z.string().min(2, 'Descrição deve ter pelo menos 2 caracteres'),
  type: z.enum(['general', 'systems', 'ajuste_estoque', 'equipment_request', 'preventive_maintenance'] as const),
  priority: z.enum(['low', 'medium', 'high'] as const),
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
  const { user } = useAuth();
  
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      description: '',
      type: 'general',
      priority: 'medium',
    },
  });
  
  const onSubmit = async (values: RequestFormValues) => {
    if (!user) return;
    try {
      setIsSubmitting(true);
      // Upload files first (if any)
      const attachmentsFinal = [];
      for (const file of files) {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const currentProgress = prev[file.name] || 0;
            if (currentProgress < 90) {
              return { ...prev, [file.name]: currentProgress + 10 };
            }
            return prev;
          });
        }, 300);
        try {
          const filePath = await uploadFile(file);
          attachmentsFinal.push({
            id: crypto.randomUUID(),
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            fileUrl: filePath,
            uploadedAt: new Date().toISOString(),
          });
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          clearInterval(progressInterval);
        } catch (error) {
          clearInterval(progressInterval);
          if (!import.meta.env.PROD) console.error('File upload error:', error);
          toast({
            title: 'Erro ao Enviar Arquivo',
            description: `Falha ao enviar ${file.name}`,
            variant: 'destructive',
          });
        }
      }
      // Criar a solicitação usando o serviço para garantir atribuição automática
      const requestData: Omit<ITRequest, 'id' | 'createdat' | 'deadlineat'> = {
        requesterid: user.id || '',
        requestername: user.name,
        requesteremail: user.email,
        title: values.description.substring(0, 100),
        description: values.description,
        type: values.type,
        priority: values.priority,
        status: 'new',
        attachments: attachmentsFinal,
        comments: [],
      };
      
      const data = await createRequest(requestData);
      toast({
        title: 'Solicitação Enviada',
        description: `Sua solicitação #${data.id} foi enviada com sucesso`,
      });
      navigate(`/request/${data.id}`);
    } catch (error) {
      if (!import.meta.env.PROD) console.error('Submit request error:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a solicitação. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
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
                          <RadioGroupItem value="general" id="general" />
                          <FormLabel htmlFor="general" className="font-normal cursor-pointer">
                            Geral (5 dias)
                          </FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="systems" id="systems" />
                          <FormLabel htmlFor="systems" className="font-normal cursor-pointer">
                            Sistemas (10 dias)
                          </FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="equipment_request" id="equipment_request" />
                          <FormLabel htmlFor="equipment_request" className="font-normal cursor-pointer">
                            Solicitação de Equipamentos (10 dias)
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
                          <RadioGroupItem value="low" id="low" />
                          <FormLabel htmlFor="low" className="font-normal cursor-pointer">
                            Baixa
                          </FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="medium" id="medium" />
                          <FormLabel htmlFor="medium" className="font-normal cursor-pointer">
                            Média
                          </FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="high" id="high" />
                          <FormLabel htmlFor="high" className="font-normal cursor-pointer">
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
                          {getSemanticIcon('action-close', { className: 'h-4 w-4' })}
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
                    className="h-10 px-3"
                  >
                    {getSemanticIcon('action-upload', { className: 'h-4 w-4 mr-2' })}
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
                className="h-10 px-3"
              >
                Cancelar
              </Button>
              <Button type="submit" variant="outline" className="h-10 px-3">Enviar Solicitação</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default RequestForm;
