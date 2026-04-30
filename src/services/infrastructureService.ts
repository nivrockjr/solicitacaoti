import { checkSupabaseConnection, clearSupabaseCache } from '../lib/supabase';

/**
 * InfrastructureService
 * Centraliza a gestão de infraestrutura, saúde do sistema e limpeza de cache.
 * Focado em performance e simplicidade para o ambiente KingHost + Supabase Free.
 */

export const infrastructureService = {
  /**
   * Inicialização do sistema.
   * Executado uma única vez no main.tsx.
   */
  async init(): Promise<boolean> {
    if (!import.meta.env.PROD) console.log('🚀 Inicializando infraestrutura...');

    try {
      // Verificação de Sessão "Infalível"
      // Se não houver um marcador na sessionStorage, significa que a aba/navegador foi reaberto
      const isSessionActive = sessionStorage.getItem('it_session_active');
      
      if (!isSessionActive) {
        if (!import.meta.env.PROD) console.log('📂 Nova sessão detectada (reabertura). Limpando persistência...');
        this.clearPersistence();
        // Marca a sessão como ativa (sessionStorage sobrevive a refreshes, mas morre ao fechar a aba)
        sessionStorage.setItem('it_session_active', 'true');
      } else {
        if (!import.meta.env.PROD) console.log('🔄 Refresh de página detectado. Mantendo sessão.');
      }

      // 2. Verificação única de saúde da conexão
      const isConnected = await checkSupabaseConnection();
      
      if (!isConnected) {
        if (!import.meta.env.PROD) console.warn('⚠️ Falha inicial de conexão com Supabase. O TanStack Query cuidará das retentativas.');
      }

      if (!import.meta.env.PROD) console.log('✅ Infraestrutura pronta.');
      return true;
    } catch (error) {
      if (!import.meta.env.PROD) console.error('❌ Erro na inicialização da infraestrutura:', error);
      return false;
    }
  },

  /**
   * Limpa persistência de dados local de forma cirúrgica.
   * Preserva apenas o que é essencial para a experiência visual (UI/UX).
   */
  clearPersistence() {
    try {
      // 1. Capturar estados que devem sobreviver à limpeza (Tema e Preferências de UI não sensíveis)
      const theme = localStorage.getItem('theme');
      const locale = localStorage.getItem('preferred_locale'); // Exemplo para o futuro
      
      // 2. Limpeza Total (LocalStorage e SessionStorage)
      // Isso remove tokens do Supabase, dados de usuário, caches do TanStack Query, etc.
      localStorage.clear();
      sessionStorage.clear();
      
      // 3. Restaurar estados de UI
      if (theme) localStorage.setItem('theme', theme);
      if (locale) localStorage.setItem('preferred_locale', locale);
      
      if (!import.meta.env.PROD) console.log('🧹 Blindagem de sessão concluída: dados sensíveis removidos.');
    } catch (e) {
      if (!import.meta.env.PROD) console.error('Erro ao executar blindagem de sessão:', e);
    }
  },

  /**
   * Atalho para limpeza de cache em caso de erro crítico detectado pelo TanStack Query.
   */
  async handleCriticalError() {
    if (!import.meta.env.PROD) console.log('🚨 Erro crítico detectado. Executando limpeza de emergência...');
    await clearSupabaseCache();
  }
};
