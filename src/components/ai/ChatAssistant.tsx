import React, { useRef, useState } from 'react';
import { PaperclipIcon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

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
  const { theme } = useTheme();

  const handleSend = () => {
    if (!message.trim() && !image) return;
    let imageUrl = '';
    if (image) {
      imageUrl = URL.createObjectURL(image);
    }
    setMessages(prev => [
      ...prev,
      { type: 'user', text: message.trim() || undefined, image: imageUrl || undefined }
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

  return (
    <div className="w-full max-w-md mx-auto mt-10 flex flex-col items-center">
      <h2 className="text-xl font-semibold mb-4 text-center text-foreground">Como posso ajudar?</h2>
      <div
        className={
          `w-full rounded-xl shadow flex items-center px-3 py-2 gap-2 ` +
          `bg-background text-foreground border border-border`
        }
      >
        {/* Botão de adicionar fotos (apenas ícone) */}
        <button
          className="p-1 rounded hover:bg-muted transition"
          style={{ minWidth: 32, minHeight: 32 }}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Adicionar foto"
          type="button"
        >
          <PaperclipIcon className="h-5 w-5" />
        </button>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageChange}
        />
        {/* Input de texto */}
        <input
          type="text"
          className="flex-1 outline-none border-none bg-transparent text-base placeholder:text-muted-foreground px-1"
          placeholder="Pergunte alguma coisa"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
        />
        {/* Botão de envio menor */}
        <button
          onClick={handleSend}
          className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-xs font-semibold shadow hover:bg-primary/90 transition"
          aria-label="Enviar"
          type="button"
        >
          Ir
        </button>
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