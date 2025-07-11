import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';

const EmailSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  browserNotifications: z.boolean(),
  whatsappNotifications: z.boolean(),
  emailAccount: z.string().email('Email inválido').optional(),
  emailPassword: z.string().min(1, 'Senha é obrigatória').optional(),
});

type EmailSettings = z.infer<typeof EmailSettingsSchema>;

const NotificationSettingsSchema = z.object({
  browserNotifications: z.boolean(),
});

type NotificationSettings = z.infer<typeof NotificationSettingsSchema>;

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<NotificationSettings>({
    resolver: zodResolver(NotificationSettingsSchema),
    defaultValues: {
      browserNotifications: true,
    },
  });

  // Carregar configurações salvas do Supabase
  useEffect(() => {
    if (!user) return;

    const loadUserSettings = async () => {
      try {
        // LOG para depuração das variáveis de ambiente
        console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
        console.log('API KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);
        // Requisição manual para depuração do erro 406/401
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_settings?select=*&id=eq.${user.id}`;
        const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const response = await fetch(url, {
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
          },
        });
        if (!response.ok) {
          console.error('Erro manual ao buscar user_settings:', response.status, response.statusText);
          const text = await response.text();
          console.error('Resposta:', text);
        } else {
          const json = await response.json();
          console.log('Resposta manual user_settings:', json);
        }
        // Requisição padrão supabase
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // Não existe registro, criar um novo padrão
          const { error: insertError } = await supabase
            .from('user_settings')
            .insert({ id: user.id, theme: 'light', notifications_enabled: true, language: 'pt' });
          if (insertError && insertError.code !== '23505') {
            // Só exibe erro se NÃO for duplicidade
            console.error('Erro ao criar configurações padrão:', insertError);
            return;
          }
          // Buscar novamente após criar (ou se já existe)
          const { data: newData } = await supabase
            .from('user_settings')
            .select('*')
            .eq('id', user.id)
            .single();
          if (newData) {
            form.reset({
              browserNotifications: newData.notifications_enabled ?? true,
            });
          }
          return;
        }

        if (data) {
          form.reset({
            browserNotifications: data.notifications_enabled ?? true,
          });
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };

    loadUserSettings();
  }, [user, form]);

  const onSubmit = async (data: NotificationSettings) => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Salvar configurações no Supabase
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          id: user.id,
          browser_notifications: data.browserNotifications,
        }, { onConflict: 'id' });

      if (error) {
        throw error;
      }
      
      toast({
        title: 'Configurações Salvas',
        description: 'Suas preferências de notificação foram salvas com sucesso!',
      });
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      
      toast({
        title: 'Erro',
        description: `Não foi possível salvar suas configurações: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Perfil do Usuário</CardTitle>
            <CardDescription>
              Suas informações e preferências de conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Nome</Label>
              <p className="text-sm font-medium">{user?.name}</p>
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <p className="text-sm font-medium">{user?.email}</p>
            </div>
            <div className="space-y-1">
              <Label>Função</Label>
              <p className="text-sm font-medium">{user?.role === 'admin' ? 'Administrador' : 'Solicitante'}</p>
            </div>
            {user?.department && (
              <div className="space-y-1">
                <Label>Departamento</Label>
                <p className="text-sm font-medium">{user.department}</p>
              </div>
            )}
            {user?.position && (
              <div className="space-y-1">
                <Label>Unidade</Label>
                <p className="text-sm font-medium">{user.position}</p>
              </div>
            )}
            {user?.whatsapp && (
              <div className="space-y-1">
                <Label>WhatsApp</Label>
                <p className="text-sm font-medium">{user.whatsapp}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>
              Personalize a aparência visual da aplicação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Modo Escuro</Label>
                <p className="text-sm text-muted-foreground">
                  Alternar entre temas claro e escuro
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
            <CardDescription>
              Configure como você recebe notificações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="browserNotifications"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Notificações do Navegador</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Receber notificações push no navegador
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={isLoading}>
                  Salvar Preferências
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
