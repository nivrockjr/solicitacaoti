
-- Primeiro, vamos criar uma função de segurança para verificar se é o usuário principal
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.email() = 'ti.mz@pqvirk.com.br';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover TODAS as políticas existentes de profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin has full access to profiles" ON public.profiles;

-- Remover TODAS as políticas existentes de it_requests
DROP POLICY IF EXISTS "Users can view their own requests" ON public.it_requests;
DROP POLICY IF EXISTS "Users can create their own requests" ON public.it_requests;
DROP POLICY IF EXISTS "Users can update their own requests" ON public.it_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.it_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON public.it_requests;
DROP POLICY IF EXISTS "Super admin has full access to requests" ON public.it_requests;

-- Remover TODAS as políticas existentes de ai_conversations
DROP POLICY IF EXISTS "Users can manage their own conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Super admin has full access to conversations" ON public.ai_conversations;

-- Políticas para profiles - super admin tem acesso total
CREATE POLICY "Super admin has full access to profiles" 
  ON public.profiles 
  FOR ALL 
  USING (public.is_super_admin());

CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id OR public.is_super_admin());

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id OR public.is_super_admin());

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id OR public.is_super_admin());

-- Políticas para it_requests - super admin tem acesso total
CREATE POLICY "Super admin has full access to requests" 
  ON public.it_requests 
  FOR ALL 
  USING (public.is_super_admin());

CREATE POLICY "Users can view their own requests" 
  ON public.it_requests 
  FOR SELECT 
  USING (auth.uid() = user_id OR public.is_super_admin());

CREATE POLICY "Users can create their own requests" 
  ON public.it_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR public.is_super_admin());

CREATE POLICY "Users can update their own requests" 
  ON public.it_requests 
  FOR UPDATE 
  USING (auth.uid() = user_id OR public.is_super_admin());

-- Políticas para ai_conversations - super admin tem acesso total
CREATE POLICY "Super admin has full access to conversations" 
  ON public.ai_conversations 
  FOR ALL 
  USING (public.is_super_admin());

CREATE POLICY "Users can manage their own conversations" 
  ON public.ai_conversations 
  FOR ALL 
  USING (auth.uid() = user_id OR public.is_super_admin()) 
  WITH CHECK (auth.uid() = user_id OR public.is_super_admin());

-- Garantir que o perfil do super admin existe com role admin
INSERT INTO public.profiles (id, email, name, role, department)
SELECT 
  u.id,
  'ti.mz@pqvirk.com.br',
  'Administrador TI',
  'admin',
  'TI'
FROM auth.users u 
WHERE u.email = 'ti.mz@pqvirk.com.br'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = 'admin',
  department = EXCLUDED.department;
