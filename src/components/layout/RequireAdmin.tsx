import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Componente Guardião (Route Guard)
 * Impede que usuários com cargo diferente de 'admin' acessem as rotas filhas.
 * Redireciona invasores sumariamente para o Dashboard.
 */
const RequireAdmin: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Se ainda estiver carregando, não faz nada (MainLayout já exibe o spinner)
  if (isLoading) {
    return null;
  }

  // Se estiver logado mas NÃO for admin, bloqueia e redireciona.
  // Nota: MainLayout garante que `user` existe neste ponto, mas checamos
  // por segurança caso a ordem das rotas mude no futuro.
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Se for admin, libera o acesso para a tela solicitada
  return <Outlet />;
};

export default RequireAdmin;
