
import { createClient } from '@supabase/supabase-js';

// Obtém as variáveis de ambiente de conexão do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verifica se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Erro: Variáveis de ambiente do Supabase não configuradas. ' +
    'Por favor, defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
  );
}

// Cria o cliente do Supabase com valores padrão para desenvolvimento
// Isso permite que o aplicativo seja carregado mesmo sem as variáveis definidas
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Função para verificar se o Supabase está configurado corretamente
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey;
};
