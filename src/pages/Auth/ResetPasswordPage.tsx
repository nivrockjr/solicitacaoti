import React from 'react';

const ResetPasswordPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-white rounded shadow p-8">
        <h1 className="text-2xl font-bold mb-4 text-center">Redefinição de Senha</h1>
        <p className="text-center text-muted-foreground">
          A redefinição de senha deve ser feita pelo administrador no menu <b>Usuários</b> do sistema.
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 