
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getSemanticIcon } from '@/lib/utils';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md p-4">
        <div className="mb-4 flex justify-center">
          {getSemanticIcon('warning', { className: 'h-16 w-16 text-destructive' })}
        </div>
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Ops! Página não encontrada</p>
        <p className="text-muted-foreground mb-6">
          A página que você procura não existe ou foi movida.
        </p>
        <Button asChild>
          <Link to="/dashboard">Voltar ao Painel</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
