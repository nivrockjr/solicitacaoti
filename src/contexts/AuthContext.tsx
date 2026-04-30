import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '../types';
import { validateLogin } from '../services/userService';

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
      try {
        const user = JSON.parse(saved);
        user.email = user.email?.toLowerCase(); // Garante minúsculo
        setUser(user);
      } catch (error) {
        // JSON corrompido em localStorage — limpa para evitar loop e segue como deslogado.
        if (!import.meta.env.PROD) console.error('Sessão local corrompida, limpando:', error);
        localStorage.removeItem('usuarioLogado');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, senha: string) => {
    setIsLoading(true);
    try {
      // Autenticação via função SQL validate_login (SECURITY DEFINER + bcrypt).
      // Senha em texto plano nunca trafega de volta — o banco compara internamente.
      // Mensagem genérica não distingue email-inexistente de senha-errada
      // (defesa contra enumeração de usuários — Item G).
      const validatedUser = await validateLogin(email, senha);
      if (!validatedUser) throw new Error('Email ou senha incorretos');

      const secureUser: User = {
        id: validatedUser.id,
        name: validatedUser.name,
        email: validatedUser.email?.toLowerCase(),
        role: validatedUser.role,
        department: validatedUser.department,
      };

      setUser(secureUser);
      localStorage.setItem('usuarioLogado', JSON.stringify(secureUser));
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
