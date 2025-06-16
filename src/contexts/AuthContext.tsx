
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'technician';
  department?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Test users data
const TEST_USERS = {
  'ti.mz@pqvirk.com.br': {
    password: 'Pqmz*2747',
    name: 'Administrador TI',
    role: 'admin' as const,
    department: 'TI'
  },
  'user@company.com': {
    password: 'user123',
    name: 'Usuário Teste',
    role: 'user' as const,
    department: 'Geral'
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserProfile = async (userId: string, userEmail: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create one
        console.log('Creating new profile for user:', userId);
        const testUserData = TEST_USERS[userEmail as keyof typeof TEST_USERS];
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: userEmail || '',
            name: testUserData?.name || userEmail || 'Usuário',
            role: testUserData?.role || 'user',
            department: testUserData?.department
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          toast({
            title: "Erro ao criar perfil",
            description: createError.message,
            variant: "destructive",
          });
          return null;
        } else if (newProfile) {
          console.log('Profile created successfully:', newProfile);
          return {
            id: newProfile.id,
            email: newProfile.email,
            name: newProfile.name,
            role: newProfile.role as 'user' | 'admin' | 'technician',
            department: newProfile.department
          };
        }
      } else if (!error && profileData) {
        console.log('Profile loaded:', profileData);
        return {
          id: profileData.id,
          email: profileData.email,
          name: profileData.name,
          role: profileData.role as 'user' | 'admin' | 'technician',
          department: profileData.department
        };
      } else if (error) {
        console.error('Error fetching profile:', error);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
    return null;
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch profile immediately for better UX
          const profile = await fetchUserProfile(session.user.id, session.user.email || '');
          setProfile(profile);
        } else {
          setProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id, session.user.email || '');
        setProfile(profile);
      }
      
      setIsLoading(false);
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const createTestUserIfNeeded = async (email: string, password: string) => {
    const testUser = TEST_USERS[email as keyof typeof TEST_USERS];
    if (!testUser || testUser.password !== password) {
      return false;
    }

    try {
      console.log('Creating test user:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: testUser.name,
            role: testUser.role,
            department: testUser.department
          }
        }
      });

      if (error) {
        console.error('Error creating test user:', error);
        return false;
      }

      console.log('Test user created successfully:', data);
      
      // For test users, we'll try to sign in immediately
      if (data.user && !data.session) {
        // User was created but needs email confirmation, let's try to sign in anyway
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (!signInError) {
          return true;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error in createTestUserIfNeeded:', error);
      return false;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // First try normal sign in
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If sign in fails and this is a test user, try to create it
        if (error.message.includes('Invalid login credentials')) {
          const created = await createTestUserIfNeeded(email, password);
          if (created) {
            toast({
              title: "Usuário de teste criado",
              description: "Fazendo login automaticamente...",
            });
            return;
          }
        }
        throw error;
      }

      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo de volta!",
      });
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Alias for backward compatibility
  const login = signIn;

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Conta criada com sucesso",
        description: "Verifique seu email para confirmar a conta.",
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "Erro no logout",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Alias for backward compatibility
  const logout = signOut;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        login,
        signIn,
        signUp,
        logout,
        signOut,
        isAuthenticated: Boolean(user),
      }}
    >
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
