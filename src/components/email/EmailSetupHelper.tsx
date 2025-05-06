
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { sendEmail } from "@/services/apiService";
import { Settings } from "lucide-react";

const EmailSetupHelper: React.FC = () => {
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

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
          Configuração de E-mail
        </CardTitle>
        <CardDescription>
          Teste a configuração de envio de e-mails do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Servidor SMTP Configurado</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li><strong>Servidor:</strong> smtp.kinghost.net</li>
              <li><strong>Porta:</strong> 465 (SSL/TLS)</li>
              <li><strong>Usuário:</strong> ti.mz@pqvirk.com.br</li>
            </ul>
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
        <h3 className="text-sm font-medium">Configuração do EmailJS:</h3>
        <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
          <li>No EmailJS, <strong>desmarque</strong> a opção "Send test email to verify configuration" antes de criar o serviço</li>
          <li>Se o teste ainda falhar, tente as portas alternativas em ordem: 587 (sem SSL), 25 ou 2525</li>
          <li>Após criar o serviço, copie seu Service ID (já preenchido como <code>service_lu4eukn</code>)</li>
          <li>Acesse "Account" → "API Keys" para obter seu Public Key</li>
        </ol>
        
        <h3 className="text-sm font-medium mt-4">Criando um template no EmailJS:</h3>
        <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
          <li>No EmailJS, vá para "Email Templates" e clique em "Create New Template"</li>
          <li>Crie um template com as variáveis: <code>to_email</code>, <code>subject</code>, <code>message_html</code>, <code>from_name</code></li>
          <li>Depois, atualize o arquivo <code>emailService.ts</code> com seu Public Key e o Template ID</li>
        </ol>
        
        <div className="border-t border-border w-full my-3"></div>
        
        <h3 className="text-sm font-medium">Problemas de conexão comuns:</h3>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
          <li>Certifique-se que a porta 465 não está bloqueada pelo firewall da sua rede</li>
          <li>A KingHost pode estar bloqueando conexões externas para SMTP - contate o suporte</li>
          <li>Se o problema persistir, considere usar serviços como SendGrid, Mailgun ou Gmail SMTP</li>
        </ul>
      </CardFooter>
    </Card>
  );
};

export default EmailSetupHelper;
