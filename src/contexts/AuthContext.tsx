import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Recupera usuário do localStorage ao iniciar
    const saved = localStorage.getItem('usuarioLogado');
    if (saved) {
      const user = JSON.parse(saved);
      user.email = user.email?.toLowerCase(); // Garante minúsculo
      setUser(user);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, senha: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email.toLowerCase()) // Busca sempre em minúsculo
        .single();
      if (error || !data) throw new Error('Usuário não encontrado');
      // Aqui você pode usar hash de senha se desejar
      if (data.senha !== senha) throw new Error('Senha incorreta');
      data.email = data.email?.toLowerCase(); // Garante minúsculo
      setUser(data);
      localStorage.setItem('usuarioLogado', JSON.stringify(data));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('usuarioLogado');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
