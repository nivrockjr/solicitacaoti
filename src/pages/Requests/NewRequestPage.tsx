
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSemanticIcon } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import RequestForm from '@/components/requests/RequestForm';
import LifecycleRequestForm from '@/components/requests/LifecycleRequestForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const NewRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const [entryMode, setEntryMode] = useState<'select' | 'general' | 'lifecycle'>('select');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => (entryMode === 'select' ? navigate(-1) : setEntryMode('select'))}
        >
          {getSemanticIcon('action-back', { className: 'h-4 w-4' })}
          <span className="sr-only">Voltar</span>
        </Button>
      </div>

      {entryMode === 'select' && (
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {getSemanticIcon('file-add-alt', { className: 'h-4 w-4' })}
                Solicitação Geral
              </CardTitle>
              <CardDescription>
                Abrir chamado comum de TI (geral, sistemas ou equipamentos).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => setEntryMode('general')}>
                Continuar
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {getSemanticIcon('action-refresh', { className: 'h-4 w-4' })}
                Ciclo de Vida
              </CardTitle>
              <CardDescription>
                Onboarding, offboarding e treinamento de colaboradores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => setEntryMode('lifecycle')}>
                Continuar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {entryMode === 'general' && <RequestForm />}
      {entryMode === 'lifecycle' && <LifecycleRequestForm />}
    </div>
  );
};

export default NewRequestPage;
