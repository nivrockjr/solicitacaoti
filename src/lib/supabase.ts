
import { createClient } from '@supabase/supabase-js';

// Obtém as variáveis de ambiente de conexão do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Cria o cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
