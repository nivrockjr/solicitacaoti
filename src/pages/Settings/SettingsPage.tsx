
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(true);
  const [whatsappNotifications, setWhatsappNotifications] = useState(false);
  
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
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações por email
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="browser-notifications">Notificações do Navegador</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações no navegador
                </p>
              </div>
              <Switch
                id="browser-notifications"
                checked={browserNotifications}
                onCheckedChange={setBrowserNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="whatsapp-notifications">Notificações WhatsApp</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações via WhatsApp
                </p>
              </div>
              <Switch
                id="whatsapp-notifications"
                checked={whatsappNotifications}
                onCheckedChange={setWhatsappNotifications}
              />
            </div>
            
            <Button className="mt-4">Salvar Preferências de Notificação</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
