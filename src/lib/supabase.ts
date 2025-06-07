
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const supabaseUrl = "https://dsbisyrolqgrzooksheo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzYmlzeXJvbHFncnpvb2tzaGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMjk5NDAsImV4cCI6MjA2NDkwNTk0MH0.G0OtdrVX04fPLjiV7EPUqPvJZm2EdgETsa0CrQd13r0";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
