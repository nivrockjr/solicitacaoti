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
  isSuperAdmin?: boolean;
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

// Test users data with super admin
const TEST_USERS = {
  'ti.mz@pqvirk.com.br': {
    password: 'Pqmz*2747',
    name: 'Administrador TI',
    role: 'admin' as const,
    department: 'TI',
    isSuperAdmin: true
  },
  'user@company.com': {
    password: 'user123',
    name: 'Usuário Teste',
    role: 'user' as const,
    department: 'Geral',
    isSuperAdmin: false
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
      console.log('Fetching profile for user:', userId, userEmail);
      
      let profileData;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        profileData = null;
      } else {
        profileData = data;
      }

      if (!profileData) {
        // Create profile for test users or default profile
        console.log('Creating new profile for user:', userId);
        const testUserData = TEST_USERS[userEmail as keyof typeof TEST_USERS];
        
        const newProfileData = {
          id: userId,
          email: userEmail || '',
          name: testUserData?.name || userEmail?.split('@')[0] || 'Usuário',
          role: testUserData?.role || 'user',
          department: testUserData?.department
        };

        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfileData)
          .select()
          .maybeSingle();

        if (createError) {
          console.warn('Could not create profile, using default:', createError);
        } else {
          profileData = newProfile;
        }
      }

      if (profileData) {
        const testUserData = TEST_USERS[userEmail as keyof typeof TEST_USERS];
        return {
          id: profileData.id,
          email: profileData.email,
          name: profileData.name,
          role: profileData.role as 'user' | 'admin' | 'technician',
          department: profileData.department,
          isSuperAdmin: userEmail === 'ti.mz@pqvirk.com.br' || (testUserData?.isSuperAdmin === true) || false
        };
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
    
    // Fallback profile to prevent app from breaking
    const testUserData = TEST_USERS[userEmail as keyof typeof TEST_USERS];
    return {
      id: userId,
      email: userEmail || '',
      name: testUserData?.name || 'Usuário',
      role: testUserData?.role || 'user',
      department: testUserData?.department,
      isSuperAdmin: userEmail === 'ti.mz@pqvirk.com.br' || (testUserData?.isSuperAdmin === true) || false
    };
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            const profile = await fetchUserProfile(session.user.id, session.user.email || '');
            if (mounted) {
              setProfile(profile);
            }
          } catch (error) {
            console.error('Error fetching profile on auth change:', error);
            if (mounted) {
              setProfile(null);
            }
          }
        } else {
          if (mounted) {
            setProfile(null);
          }
        }
        
        if (mounted) {
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        console.log('Initial session check:', session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id, session.user.email || '');
          if (mounted) {
            setProfile(profile);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
            department: testUser.department,
            isSuperAdmin: testUser.isSuperAdmin || false
          }
        }
      });

      if (error && !error.message.includes('already registered')) {
        console.error('Error creating test user:', error);
        return false;
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
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          const created = await createTestUserIfNeeded(email, password);
          if (created) {
            toast({
              title: "Usuário de teste criado",
              description: "Tentando fazer login...",
            });
            // Try to sign in again after creating
            const { error: retryError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            if (retryError) throw retryError;
            return;
          }
        }
        throw error;
      }

      const welcomeMessage = email === 'ti.mz@pqvirk.com.br' ? 
        'Bem-vindo, Super Administrador!' : 'Bem-vindo!';
      
      toast({
        title: "Login realizado com sucesso",
        description: welcomeMessage,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Erro no login",
        description: error.message || 'Erro desconhecido',
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

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
