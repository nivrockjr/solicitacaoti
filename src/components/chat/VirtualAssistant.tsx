import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Minimize2, X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { aiAssistantService } from '@/services/aiAssistantService';
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}
interface VirtualAssistantProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onClose?: () => void;
}
const VirtualAssistant: React.FC<VirtualAssistantProps> = ({
  isMinimized = false,
  onToggleMinimize,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    text: '👋 Olá! Sou seu Assistente Virtual de TI especializado!\n\n🔧 Posso ajudar com:\n• Problemas de hardware (PC, impressora, periféricos)\n• Conexões de rede e internet\n• Software e aplicativos\n• Email e comunicação\n• Senhas e acessos\n• Consulta de suas solicitações\n\n💡 Digite sua dúvida ou problema e eu darei orientações detalhadas!',
    sender: 'assistant',
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const {
    user
  } = useAuth();
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    try {
      const response = await aiAssistantService.processMessage(input.trim(), user?.id);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro no assistente virtual:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '❌ Ops! Ocorreu um erro técnico. Por favor, tente novamente ou reformule sua pergunta.',
        sender: 'assistant',
        timestamp: new Date()
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
  if (isMinimized) {
    return <div className="fixed bottom-6 right-6 z-50 animate-bounce">
        <div className="relative">
          <Button onClick={onToggleMinimize} className="rounded-full h-20 w-20 shadow-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transform hover:scale-110 transition-all duration-300" size="icon">
            <MessageCircle className="h-10 w-10 text-white" />
          </Button>
          
          {/* Pulso animado */}
          <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30"></div>
          <div className="absolute -top-2 -right-2 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
            <div className="h-3 w-3 bg-white rounded-full"></div>
          </div>
          
          {/* Tooltip */}
          <div className="absolute -top-16 -left-12 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap shadow-xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            🤖 Assistente de TI
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>;
  }
  return <Card className="w-full max-w-md h-[600px] flex flex-col shadow-2xl border-2 border-blue-200 bg-white backdrop-blur-sm animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-lg">
        <CardTitle className="text-lg font-bold flex items-center gap-3">
          <div className="relative">
            <Bot className="h-7 w-7 text-white" />
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-400 rounded-full animate-pulse border-2 border-white"></div>
          </div>
          <div>
            <div className="text-lg font-bold">Assistente TI</div>
            <div className="text-xs opacity-90 font-normal">Online e pronto para ajudar</div>
          </div>
        </CardTitle>
        <div className="flex gap-1">
          {onToggleMinimize && <Button variant="ghost" size="icon" onClick={onToggleMinimize} className="h-8 w-8 text-white hover:bg-white/20">
              <Minimize2 className="h-4 w-4" />
            </Button>}
          {onClose && <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-white hover:bg-white/20">
              <X className="h-4 w-4" />
            </Button>}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map(message => <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-lg ${message.sender === 'user' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' : 'bg-gray-50 border border-gray-200 text-gray-800'}`}>
                  <div className="flex items-start gap-3">
                    {message.sender === 'assistant' && <div className="relative flex-shrink-0">
                        <Bot className="h-5 w-5 mt-0.5 text-blue-600" />
                        <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full"></div>
                      </div>}
                    {message.sender === 'user' && <User className="h-5 w-5 mt-0.5 flex-shrink-0 order-2 text-white" />}
                    <span className="whitespace-pre-wrap leading-relaxed text-sm">
                      {message.text}
                    </span>
                  </div>
                  <div className={`text-xs mt-2 opacity-70 ${message.sender === 'user' ? 'text-white' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                  </div>
                </div>
              </div>)}
            {isLoading && <div className="flex justify-start animate-fade-in">
                <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm shadow-lg">
                  <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5 text-blue-600" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-gray-600">Analisando...</span>
                  </div>
                </div>
              </div>}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-3">
            <Input value={input} onChange={e => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Digite seu problema de TI..." disabled={isLoading} className="flex-1 h-12 text-base rounded-xl border-2 border-gray-200 focus:border-blue-500 bg-gray-900" />
            <Button onClick={handleSendMessage} disabled={!input.trim() || isLoading} size="icon" className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transform hover:scale-105 transition-all duration-200">
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            💡 Dica: Seja específico sobre o problema para uma solução mais precisa
          </div>
        </div>
      </CardContent>
    </Card>;
};
export default VirtualAssistant;