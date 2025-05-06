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
import EmailSetupHelper from '@/components/email/EmailSetupHelper';
import { isSupabaseConfigured } from '@/lib/supabase';

const EmailSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  browserNotifications: z.boolean(),
  whatsappNotifications: z.boolean(),
  emailAccount: z.string().email('Email inválido').optional(),
  emailPassword: z.string().min(1, 'Senha é obrigatória').optional(),
});

type EmailSettings = z.infer<typeof EmailSettingsSchema>;

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<EmailSettings>({
    resolver: zodResolver(EmailSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      browserNotifications: true,
      whatsappNotifications: false,
      emailAccount: user?.email || '',
      emailPassword: '',
    },
  });

  // Carregar configurações salvas do Supabase
  useEffect(() => {
    if (!user) return;

    const loadUserSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Erro ao carregar configurações:', error);
          return;
        }

        if (data) {
          form.reset({
            emailNotifications: data.email_notifications || true,
            browserNotifications: data.browser_notifications || true,
            whatsappNotifications: data.whatsapp_notifications || false,
            emailAccount: data.email_account || user?.email || '',
            emailPassword: '',
          });
          
          if (data.email_notifications) {
            setShowEmailSettings(true);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };

    loadUserSettings();
  }, [user, form]);

  const onSubmit = async (data: EmailSettings) => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Salvar configurações no Supabase
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          email_notifications: data.emailNotifications,
          browser_notifications: data.browserNotifications,
          whatsapp_notifications: data.whatsappNotifications,
          email_account: data.emailAccount,
          // Só envie a senha se foi informada
          ...(data.emailPassword ? { email_password: data.emailPassword } : {})
        }, { onConflict: 'user_id' });

      if (error) {
        throw error;
      }
      
      // Atualiza configurações de SMTP no Supabase Edge Function como secrets
      if (data.emailNotifications && data.emailAccount && data.emailPassword) {
        // Isso seria uma chamada administrativa que atualizaria as variáveis de ambiente
        // Na implementação real, isso seria feito pelo administrador via Dashboard do Supabase
        console.log('Configurações de SMTP atualizadas para:', data.emailAccount);
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
        {/* Email Setup Helper Card - Added at the top for visibility */}
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <EmailSetupHelper />
          </CardContent>
        </Card>
        
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
                  name="emailNotifications"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Notificações por Email</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Receber notificações por email
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) setShowEmailSettings(true);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {form.watch('emailNotifications') && showEmailSettings && (
                  <div className="space-y-4 border border-border rounded-md p-4">
                    <h3 className="font-medium">Configurações de Email</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure suas credenciais para envio e recebimento de emails
                    </p>
                    
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Servidor de Entrada (IMAP)</Label>
                          <p className="text-sm font-medium">imap.kinghost.net</p>
                        </div>
                        <div>
                          <Label>Porta IMAP</Label>
                          <p className="text-sm font-medium">143</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Servidor de Saída (SMTP)</Label>
                          <p className="text-sm font-medium">smtp.kinghost.net</p>
                        </div>
                        <div>
                          <Label>Porta SMTP</Label>
                          <p className="text-sm font-medium">587</p>
                        </div>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="emailAccount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conta de Email</FormLabel>
                            <FormControl>
                              <Input placeholder="seu@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="emailPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha do Email</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Senha" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
                
                <FormField
                  control={form.control}
                  name="browserNotifications"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Notificações do Navegador</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Receber notificações no navegador
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="whatsappNotifications"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Notificações WhatsApp</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Receber notificações via WhatsApp
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Salvando...' : 'Salvar Preferências de Notificação'}
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
