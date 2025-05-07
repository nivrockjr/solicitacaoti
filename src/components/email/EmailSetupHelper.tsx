
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { sendEmail } from "@/services/emailService";
import { Settings, Copy, Check, Mail } from "lucide-react";
import kingHostMailService from "@/services/kingHostMailService";

const EmailSetupHelper: React.FC = () => {
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [accountStatus, setAccountStatus] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Usar as configurações do serviço KingHost
  const smtpConfig = kingHostMailService.config;

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
        <p>Este é um teste de configuração do serviço de e-mail SMTP Transacional da KingHost. Se você recebeu este e-mail, a configuração está funcionando corretamente!</p>
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

  const handleCheckStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const status = await kingHostMailService.checkStatus();
      setAccountStatus(status);
      
      if (status.success) {
        toast({
          title: "Status da conta",
          description: `Quota: ${status.quota}, Usado: ${status.used}, Restante: ${status.remaining}`,
        });
      } else {
        toast({
          title: "Falha ao verificar status",
          description: "Não foi possível verificar o status da conta.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao verificar status:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao verificar o status da conta.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuração de SMTP Transacional KingHost
        </CardTitle>
        <CardDescription>
          O serviço SMTP Transacional da KingHost está configurado e pronto para uso
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Status da Configuração</h3>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 rounded-full bg-green-500"></div>
              <span className="text-sm">Configurado e Ativo</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Servidor SMTP Configurado</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between bg-muted/50 p-2 rounded">
                <span><strong>Servidor:</strong> {smtpConfig.smtpServer}</span>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => handleCopy(smtpConfig.smtpServer, 'host')}
                >
                  {copied === 'host' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex items-center justify-between bg-muted/50 p-2 rounded">
                <span><strong>Usuário:</strong> {smtpConfig.smtpUser}</span>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => handleCopy(smtpConfig.smtpUser, 'user')}
                >
                  {copied === 'user' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex items-center justify-between bg-muted/50 p-2 rounded">
                <span><strong>Porta:</strong> {smtpConfig.smtpPort} (SMTP)</span>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => handleCopy(smtpConfig.smtpPort.toString(), 'port')}
                >
                  {copied === 'port' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex items-center justify-between bg-muted/50 p-2 rounded">
                <span><strong>SSL/TLS:</strong> {smtpConfig.sslPort}</span>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => handleCopy(smtpConfig.sslPort.toString(), 'ssl')}
                >
                  {copied === 'ssl' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Ações</h3>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Button 
                  onClick={handleCheckStatus} 
                  variant="outline"
                  disabled={isCheckingStatus}
                  className="w-full"
                >
                  {isCheckingStatus ? "Verificando..." : "Verificar Status da Conta"}
                </Button>
              </div>
              
              <div>
                {accountStatus && accountStatus.success && (
                  <div className="bg-muted/50 p-2 rounded text-center">
                    <div className="text-xs">Quota: <span className="font-medium">{accountStatus.quota}</span></div>
                    <div className="text-xs">Usado: <span className="font-medium">{accountStatus.used}</span></div>
                    <div className="text-xs">Restante: <span className="font-medium">{accountStatus.remaining}</span></div>
                  </div>
                )}
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
              <Button 
                onClick={handleTestEmail} 
                disabled={isSending}
                className="flex gap-2 items-center"
              >
                <Mail className="h-4 w-4" />
                {isSending ? "Enviando..." : "Testar"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 border-t p-4 mt-4">
        <h3 className="text-sm font-medium">Instruções para Domínios de Envio:</h3>
        <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
          <li>Acesse o painel da KingHost e vá até o menu "SMTP Transacional"</li>
          <li>Clique em "Domínios de Envio" e depois em "Adicionar Domínio"</li>
          <li>Adicione o domínio que será usado como remetente dos emails (ex: seudominio.com.br)</li>
          <li>Configure os registros DNS conforme instruções (SPF, DKIM, DMARC)</li>
          <li>Aguarde a verificação do domínio (pode levar até 48 horas)</li>
          <li>Após verificado, use este domínio no campo "from" ao enviar emails</li>
        </ol>
        
        <div className="border-t border-border w-full my-3"></div>
        
        <h3 className="text-sm font-medium">Dicas para resolução de problemas:</h3>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
          <li>Certifique-se que as portas 587 (SMTP) e 465 (SSL/TLS) não estão bloqueadas pelo firewall da sua rede</li>
          <li>Verifique se o domínio de destino não está bloqueando emails do seu servidor</li>
          <li>Configure corretamente os registros SPF e DKIM para melhorar a entregabilidade</li>
          <li>Se precisar de mais ajuda, entre em contato com o suporte da KingHost</li>
        </ul>
      </CardFooter>
    </Card>
  );
};

export default EmailSetupHelper;
