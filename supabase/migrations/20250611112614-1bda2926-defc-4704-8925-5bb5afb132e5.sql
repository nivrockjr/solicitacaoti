
-- Primeiro, vamos verificar e criar apenas as políticas que não existem

-- Políticas para a tabela it_requests (algumas podem já existir)
DO $$ 
BEGIN
    -- Tentar criar política para usuários verem suas próprias solicitações
    BEGIN
        EXECUTE 'CREATE POLICY "Users can create their own requests" 
          ON public.it_requests 
          FOR INSERT 
          WITH CHECK (auth.uid() = user_id)';
    EXCEPTION 
        WHEN duplicate_object THEN 
            NULL; -- Política já existe, ignorar
    END;

    -- Tentar criar política para usuários atualizarem suas próprias solicitações
    BEGIN
        EXECUTE 'CREATE POLICY "Users can update their own requests" 
          ON public.it_requests 
          FOR UPDATE 
          USING (auth.uid() = user_id)';
    EXCEPTION 
        WHEN duplicate_object THEN 
            NULL; -- Política já existe, ignorar
    END;

    -- Tentar criar política para admins verem todas as solicitações
    BEGIN
        EXECUTE 'CREATE POLICY "Admins can view all requests"
          ON public.it_requests
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM public.profiles 
              WHERE id = auth.uid() 
              AND role IN (''admin'', ''technician'')
            )
          )';
    EXCEPTION 
        WHEN duplicate_object THEN 
            NULL; -- Política já existe, ignorar
    END;

    -- Tentar criar política para admins atualizarem todas as solicitações
    BEGIN
        EXECUTE 'CREATE POLICY "Admins can update all requests"
          ON public.it_requests
          FOR UPDATE
          USING (
            EXISTS (
              SELECT 1 FROM public.profiles 
              WHERE id = auth.uid() 
              AND role IN (''admin'', ''technician'')
            )
          )';
    EXCEPTION 
        WHEN duplicate_object THEN 
            NULL; -- Política já existe, ignorar
    END;
END $$;

-- Habilitar RLS nas tabelas (ignorar se já estiver habilitado)
ALTER TABLE public.it_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela profiles
DO $$ 
BEGIN
    BEGIN
        EXECUTE 'CREATE POLICY "Users can view their own profile" 
          ON public.profiles 
          FOR SELECT 
          USING (auth.uid() = id)';
    EXCEPTION 
        WHEN duplicate_object THEN 
            NULL;
    END;

    BEGIN
        EXECUTE 'CREATE POLICY "Users can update their own profile" 
          ON public.profiles 
          FOR UPDATE 
          USING (auth.uid() = id)';
    EXCEPTION 
        WHEN duplicate_object THEN 
            NULL;
    END;

    BEGIN
        EXECUTE 'CREATE POLICY "Users can insert their own profile" 
          ON public.profiles 
          FOR INSERT 
          WITH CHECK (auth.uid() = id)';
    EXCEPTION 
        WHEN duplicate_object THEN 
            NULL;
    END;

    BEGIN
        EXECUTE 'CREATE POLICY "Admins can view all profiles"
          ON public.profiles
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM public.profiles 
              WHERE id = auth.uid() 
              AND role IN (''admin'', ''technician'')
            )
          )';
    EXCEPTION 
        WHEN duplicate_object THEN 
            NULL;
    END;
END $$;

-- Políticas para ai_conversations
DO $$ 
BEGIN
    BEGIN
        EXECUTE 'CREATE POLICY "Users can manage their own conversations" 
          ON public.ai_conversations 
          FOR ALL 
          USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id)';
    EXCEPTION 
        WHEN duplicate_object THEN 
            NULL;
    END;
END $$;

-- Triggers para updated_at (verificar se já existe)
DO $$ 
BEGIN
    BEGIN
        EXECUTE 'CREATE TRIGGER update_it_requests_updated_at 
            BEFORE UPDATE ON it_requests 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column()';
    EXCEPTION 
        WHEN duplicate_object THEN 
            NULL;
    END;

    BEGIN
        EXECUTE 'CREATE TRIGGER update_profiles_updated_at 
            BEFORE UPDATE ON profiles 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column()';
    EXCEPTION 
        WHEN duplicate_object THEN 
            NULL;
    END;
END $$;
