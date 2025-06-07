
import React, { useState, useEffect, useRef } from 'react';
import { Send, Minimize2, Maximize2, X, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { sendMessageToAI, ChatMessage } from '@/services/aiService';
import { useToast } from '@/hooks/use-toast';

interface EnhancedVirtualAssistantProps {
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onClose: () => void;
}

const EnhancedVirtualAssistant: React.FC<EnhancedVirtualAssistantProps> = ({
  isMinimized,
  onToggleMinimize,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { profile, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isAuthenticated && messages.length === 0) {
      // Mensagem de boas-vindas personalizada
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: `Olá ${profile?.name || 'usuário'}! 👋\n\nSou seu assistente de TI inteligente. Posso ajudar você com:\n\n🔧 **Problemas técnicos** - Diagnóstico e soluções\n📋 **Status de solicitações** - Acompanhar seus tickets\n💡 **Dicas e orientações** - Baseadas no histórico da empresa\n🔍 **Busca na base de conhecimento** - Soluções testadas\n\nComo posso ajudar você hoje?`,
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
  }, [isAuthenticated, profile]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !isAuthenticated) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await sendMessageToAI(inputMessage, conversationId);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (response.conversationId && !conversationId) {
        setConversationId(response.conversationId);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível processar sua mensagem. Tente novamente.",
        variant: "destructive",
      });
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-80 h-96 shadow-xl border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Assistente de TI
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Faça login para usar o assistente de TI</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isMinimized) {
    return (
      <Button
        onClick={onToggleMinimize}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="w-96 h-[500px] shadow-xl border-blue-200 flex flex-col">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Assistente de TI
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onToggleMinimize} className="text-white hover:bg-white/20">
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'}>
                      {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gray-500 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">Pensando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua pergunta..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              size="icon"
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedVirtualAssistant;
