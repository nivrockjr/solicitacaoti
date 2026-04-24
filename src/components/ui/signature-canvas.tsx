import React, { useRef, useEffect, useState } from 'react';
import { Button } from './button';
import { Eraser } from 'lucide-react';

interface SignatureCanvasProps {
  onSave: (signatureData: string) => void;
  onClear?: () => void;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ onSave, onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurações de estilo do traço
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const getCoordinates = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      setIsDrawing(true);
      const { x, y } = getCoordinates(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsEmpty(false);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault(); // Previne scroll no touch
      const { x, y } = getCoordinates(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const stopDrawing = () => {
      if (isDrawing) {
        ctx.closePath();
        setIsDrawing(false);
        // Auto-captura ao fim de cada traço — elimina necessidade do botão "Confirmar Assinatura"
        if (canvasRef.current) {
          const dataUrl = canvasRef.current.toDataURL('image/png');
          onSave(dataUrl);
        }
      }
    };

    // Eventos de Mouse
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDrawing);

    // Eventos de Touch (Mobile)
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      window.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [isDrawing]);

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setIsEmpty(true);
      if (onClear) onClear();
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full print:gap-1">
      <div className="relative border-2 border-dashed border-muted-foreground/30 rounded-lg bg-white overflow-hidden touch-none print:h-16 print:border-0 print:border-b print:border-solid print:border-black print:rounded-none print:w-3/4 print:mx-auto">
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          className="w-full h-[200px] cursor-crosshair print:hidden"
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground/40 italic print:hidden">
            Assine aqui com o dedo ou mouse
          </div>
        )}
      </div>
      <div className="flex gap-2 justify-end print:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clear}
          className="flex items-center gap-2"
        >
          <Eraser className="h-4 w-4" /> Limpar
        </Button>
      </div>
    </div>
  );
};
