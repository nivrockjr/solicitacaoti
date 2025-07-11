import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AuthLayout: React.FC = () => {
  const { isLoading, user } = useAuth();
  const location = typeof window !== 'undefined' ? window.location : { hash: '', pathname: '' };
  const isRecovery = location.hash.includes('type=recovery') && location.hash.includes('access_token=');
  const isResetPasswordRoute = location.pathname === '/auth/reset-password';
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  // Se está na rota de reset e é fluxo de recuperação, NUNCA redireciona
  if (user !== null && isResetPasswordRoute && isRecovery) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    );
  }
  
  // NÃO redireciona para dashboard se for fluxo de recuperação de senha
  if (user !== null && !(isRecovery && isResetPasswordRoute)) {
    return <Navigate to="/dashboard" />;
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* <h1 className="text-3xl font-bold text-primary">Solicitação de TI</h1> */}
        {/* <p className="text-muted-foreground mt-2">Manage IT requests efficiently</p> */}
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
