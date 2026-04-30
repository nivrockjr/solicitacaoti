import React, { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getSemanticIcon } from '@/lib/utils';

interface ChatMessage {
  type: 'user' | 'bot';
  text?: string;
  image?: string;
}

const ChatAssistant: React.FC = () => {
  const [message, setMessage] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!message.trim() && !image) return;
    let imageUrl = '';
    if (image) {
      imageUrl = URL.createObjectURL(image);
    }
    setMessages(prev => [
      ...prev,
      { type: 'user', text: message.trim() || undefined, image: imageUrl || undefined },
      { type: 'bot', text: 'A integração com inteligência artificial estará disponível em breve ;]' }
    ]);
    setMessage('');
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const placeholders = [
    "Qual é o problema que você está enfrentando?",
    "Que erro está ocorrendo no seu sistema?",
    "Como posso ajudar você com a sua dúvida de TI?",
    "Pode descrever o problema que está ocorrendo?",
  ];

  return (
    <div className="w-full max-w-md mx-auto mt-10 flex flex-col items-center">
      <div className="w-full flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl mx-auto bg-background h-12 rounded-full overflow-hidden shadow border border-border flex items-center px-4">
          <Input
            type="text"
            placeholder={placeholders[0]}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="border-none bg-transparent focus:outline-none focus:ring-0 flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSend();
              }
            }}
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            accept="image/*"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 w-8 p-0"
          >
            {getSemanticIcon('attachment', { className: 'h-4 w-4' })}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSend}
            disabled={!message.trim() && !image}
            className="h-8 w-8 p-0"
          >
            {getSemanticIcon('action-forward', { className: 'h-4 w-4' })}
          </Button>
        </div>
      </div>
      {/* Preview da imagem selecionada */}
      {image && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Imagem selecionada:</span>
          <span className="truncate max-w-[120px]">{image.name}</span>
        </div>
      )}
      {/* Histórico de mensagens */}
      <div className="w-full mt-6 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={
              `flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} `
            }
          >
            <div
              className={
                `max-w-[80%] rounded-lg px-3 py-2 ` +
                (msg.type === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground')
              }
            >
              {msg.text && <span>{msg.text}</span>}
              {msg.image && (
                <img
                  src={msg.image}
                  alt="imagem enviada"
                  className="mt-1 max-h-32 rounded"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatAssistant; 