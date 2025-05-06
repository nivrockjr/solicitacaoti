
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { sendEmail } from "@/services/emailService";
import { Settings, Copy, Check } from "lucide-react";

const EmailSetupHelper: React.FC = () => {
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const smtpConfig = {
    host: 'kinghost.smtpkl.com.br',
    port: 587,
    user: '230248762c7b4076f6b27d84b2ee2387',
    ssl: 465
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!testEmail) {
      toast({
        title: "Erro",
        description: "Por favor, insira um endereço de e-mail para teste",
        variant: "destructive",
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      const result = await sendEmail(
        testEmail,
        "Teste de Configuração de E-mail",
        `
        <h1>Teste de E-mail</h1>
        <p>Este é um teste de configuração do serviço de e-mail. Se você recebeu este e-mail, a configuração está funcionando corretamente!</p>
        <p>Enviado em: ${new Date().toLocaleString('pt-BR')}</p>
        <p>Sistema de Solicitações de TI</p>
        `
      );
      
      if (result) {
        toast({
          title: "E-mail enviado!",
          description: "O e-mail de teste foi enviado com sucesso. Verifique sua caixa de entrada.",
        });
      } else {
        throw new Error("Erro ao enviar e-mail");
      }
    } catch (error) {
      console.error("Erro ao enviar e-mail de teste:", error);
      toast({
        title: "Falha no envio",
        description: "Não foi possível enviar o e-mail de teste. Verifique o console para mais detalhes.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuração de SMTP Transacional
        </CardTitle>
        <CardDescription>
          Configure o envio de e-mails utilizando SMTP Transacional da KingHost
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Servidor SMTP Configurado</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between bg-muted/50 p-2 rounded">
                <span><strong>Servidor:</strong> {smtpConfig.host}</span>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => handleCopy(smtpConfig.host, 'host')}
                >
                  {copied === 'host' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex items-center justify-between bg-muted/50 p-2 rounded">
                <span><strong>Usuário:</strong> {smtpConfig.user}</span>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => handleCopy(smtpConfig.user, 'user')}
                >
                  {copied === 'user' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex items-center justify-between bg-muted/50 p-2 rounded">
                <span><strong>Porta:</strong> {smtpConfig.port} (SMTP)</span>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => handleCopy(smtpConfig.port.toString(), 'port')}
                >
                  {copied === 'port' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex items-center justify-between bg-muted/50 p-2 rounded">
                <span><strong>SSL/TLS:</strong> {smtpConfig.ssl}</span>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => handleCopy(smtpConfig.ssl.toString(), 'ssl')}
                >
                  {copied === 'ssl' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="test-email">Enviar e-mail de teste para</Label>
            <div className="flex space-x-2">
              <Input
                id="test-email"
                type="email"
                placeholder="seu@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <Button onClick={handleTestEmail} disabled={isSending}>
                {isSending ? "Enviando..." : "Testar"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 border-t p-4 mt-4">
        <h3 className="text-sm font-medium">Configuração do SMTP Transacional:</h3>
        <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
          <li>As credenciais acima já estão configuradas no sistema</li>
          <li>Use o botão de cópia para copiar qualquer informação necessária</li>
          <li>O sistema está configurado para usar estas credenciais para todos os envios de e-mail</li>
          <li>Seu plano atual permite até 1.000 envios mensais</li>
        </ol>
        
        <div className="border-t border-border w-full my-3"></div>
        
        <h3 className="text-sm font-medium">Dicas para resolução de problemas:</h3>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
          <li>Certifique-se que as portas 587 (SMTP) e 465 (SSL/TLS) não estão bloqueadas pelo firewall da sua rede</li>
          <li>Verifique se o domínio de destino não está bloqueando emails do seu servidor</li>
          <li>Alguns serviços como Gmail podem marcar emails como spam se não estiverem corretamente configurados com SPF e DKIM</li>
          <li>Se precisar de mais ajuda, entre em contato com o suporte da KingHost</li>
        </ul>
      </CardFooter>
    </Card>
  );
};

export default EmailSetupHelper;
