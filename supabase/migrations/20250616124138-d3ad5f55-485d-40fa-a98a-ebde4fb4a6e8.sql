
-- Corrigir relacionamentos e foreign keys que podem estar causando avisos

-- 1. Adicionar foreign key entre it_requests e profiles se não existir
DO $$ 
BEGIN
    -- Verificar se a foreign key já existe antes de criar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'it_requests_user_id_fkey' 
        AND table_name = 'it_requests'
    ) THEN
        ALTER TABLE public.it_requests 
        ADD CONSTRAINT it_requests_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Adicionar foreign key para assigned_to se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'it_requests_assigned_to_fkey' 
        AND table_name = 'it_requests'
    ) THEN
        ALTER TABLE public.it_requests 
        ADD CONSTRAINT it_requests_assigned_to_fkey 
        FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Garantir que as funções de trigger existam
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Recriar triggers se necessário
DROP TRIGGER IF EXISTS update_it_requests_updated_at ON public.it_requests;
CREATE TRIGGER update_it_requests_updated_at
    BEFORE UPDATE ON public.it_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Corrigir possíveis problemas com constraints de check
ALTER TABLE public.it_requests DROP CONSTRAINT IF EXISTS it_requests_status_check;
ALTER TABLE public.it_requests ADD CONSTRAINT it_requests_status_check 
    CHECK (status IN ('new', 'in_progress', 'resolved', 'closed'));

ALTER TABLE public.it_requests DROP CONSTRAINT IF EXISTS it_requests_priority_check;
ALTER TABLE public.it_requests ADD CONSTRAINT it_requests_priority_check 
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

ALTER TABLE public.it_requests DROP CONSTRAINT IF EXISTS it_requests_type_check;
ALTER TABLE public.it_requests ADD CONSTRAINT it_requests_type_check 
    CHECK (type IN ('hardware', 'software', 'network', 'access', 'other'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'admin', 'technician'));
