import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { EvervaultCard, Icon } from '@/components/ui/evervault-card';
import { motion } from 'framer-motion';
import { TypingAnimation } from '@/components/ui/typing-animation';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginForm: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', senha: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setError(null);
      await login(data.email, data.senha);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Texto animado no topo */}
      <div className="mb-8">
        <TypingAnimation 
          className="text-xl font-semibold text-foreground"
          duration={120}
          delay={300}
        >
          Solicitação de TI
        </TypingAnimation>
      </div>
      
      <div className="border border-black/[0.2] dark:border-white/[0.2] flex flex-col items-start max-w-sm mx-auto p-4 relative h-[30rem]">
        <Icon className="absolute h-6 w-6 -top-3 -left-3 dark:text-white text-black" />
        <Icon className="absolute h-6 w-6 -bottom-3 -left-3 dark:text-white text-black" />
        <Icon className="absolute h-6 w-6 -top-3 -right-3 dark:text-white text-black" />
        <Icon className="absolute h-6 w-6 -bottom-3 -right-3 dark:text-white text-black" />

        <EvervaultCard>
          <div className="w-full max-w-xs">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Email"
                    {...form.register('email')}
                    className="w-full max-w-[200px] mx-auto block px-4 py-3 bg-white/5 dark:bg-black/5 backdrop-blur-md border border-white/10 dark:border-white/10 rounded-xl text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-300 text-sm"
                  />
                  {form.formState.errors.email && (
                    <p className="text-red-400 text-xs mt-1 text-center">{form.formState.errors.email.message}</p>
                  )}
                </div>
                
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Senha"
                    {...form.register('senha')}
                    className="w-full max-w-[200px] mx-auto block px-4 py-3 bg-white/5 dark:bg-black/5 backdrop-blur-md border border-white/10 dark:border-white/10 rounded-xl text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-300 text-sm"
                  />
                  {form.formState.errors.senha && (
                    <p className="text-red-400 text-xs mt-1 text-center">{form.formState.errors.senha.message}</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-center">
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-32 py-3 bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-white/20 rounded-xl text-black dark:text-white font-medium hover:bg-white/20 dark:hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </motion.button>
              </div>
            </form>
          </div>
        </EvervaultCard>
      </div>
    </div>
  );
};

export default LoginForm;
