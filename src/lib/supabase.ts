import { createClient } from '@supabase/supabase-js';

// Obtém as variáveis de ambiente de conexão do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verifica se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  if (!import.meta.env.PROD) {
    console.error(
      'Erro: Variáveis de ambiente do Supabase não configuradas. ' +
      'Por favor, defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
    );
  }
}

// Configuração robusta do cliente Supabase para evitar conflitos de cache e cookies de terceiros
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    global: {
      headers: {
        apikey: supabaseAnonKey || 'placeholder-key',
        // Headers para evitar cache problemático
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        // Headers adicionais para prevenir cookies de terceiros
        'X-Requested-With': 'XMLHttpRequest',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
      },
    },
    // Configurações de retry e timeout
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      // Nota: `cookieOptions` foi removido das versões recentes de @supabase/supabase-js.
      // A persistência de sessão é controlada exclusivamente pelo `storage` adapter abaixo
      // (localStorage com prefixo `sb-`), o que basta para o nosso fluxo SPA.
      // Configurações de storage mais seguras
      storage: {
        // Usar localStorage com prefixo específico
        getItem: (key: string) => {
          try {
            return localStorage.getItem(`sb-${key}`);
          } catch (error) {
            if (!import.meta.env.PROD) console.warn('Erro ao ler do localStorage:', error);
            return null;
          }
        },
        setItem: (key: string, value: string) => {
          try {
            localStorage.setItem(`sb-${key}`, value);
          } catch (error) {
            if (!import.meta.env.PROD) console.warn('Erro ao escrever no localStorage:', error);
          }
        },
        removeItem: (key: string) => {
          try {
            localStorage.removeItem(`sb-${key}`);
          } catch (error) {
            if (!import.meta.env.PROD) console.warn('Erro ao remover do localStorage:', error);
          }
        },
      },
    },
    // Configurações de rede
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    // Configurações de cache
    db: {
      schema: 'public',
    },
  }
);

// Função para verificar se o Supabase está configurado corretamente
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey;
};

// Função para limpar cache e dados corrompidos
export const clearSupabaseCache = async () => {
  try {
    // Limpa o cache do Supabase
    await supabase.auth.refreshSession();
    
    // Limpa dados do localStorage relacionados ao Supabase
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    if (!import.meta.env.PROD) console.log('Cache do Supabase limpo com sucesso');
    return true;
  } catch (error) {
    if (!import.meta.env.PROD) console.error('Erro ao limpar cache do Supabase:', error);
    return false;
  }
};

// Função para verificar conectividade com timeout
export const checkSupabaseConnection = async (timeoutMs: number = 5000) => {
  try {
    // Promise com timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout na conexão')), timeoutMs)
    );

    const connectionPromise = (async () => {
      const { error } = await supabase
        .from('solicitacoes')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        if (!import.meta.env.PROD) console.error('Erro na conexão com Supabase:', error);
        return false;
      }
      
      return true;
    })();

    // Retorna o que terminar primeiro (conexão ou timeout)
    return await Promise.race([connectionPromise, timeoutPromise]) as boolean;

  } catch (error) {
    if (!import.meta.env.PROD) console.error('Erro ao verificar conexão com Supabase:', error);
    return false;
  }
};

// Interceptor para detectar problemas de dados corrompidos
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    // Limpa dados quando usuário faz logout
    clearSupabaseCache();
  }
});
