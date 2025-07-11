import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Edit, UserPlus, Key } from 'lucide-react';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

const userFormSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  role: z.enum(['admin', 'requester']),
  department: z.string().optional(),
  position: z.string().optional(), 
  whatsapp: z.string().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

const passwordFormSchema = z.object({
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

const UsersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const isAdmin = currentUser?.role === 'admin';
  
  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'requester',
      department: '',
      position: '',
      whatsapp: '',
    },
  });
  
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      password: '',
    },
  });
  
  const editUserForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'requester',
      department: '',
      position: '',
      whatsapp: '',
    },
  });
  
  useEffect(() => {
    console.time('Carregar usuários');
    const fetchUsers = async () => {
      let data = [];
      let errorObj = null;
      try {
        setError(null);
        if (isAdmin) {
          const { data: usersData, error: usersError } = await supabase
            .from('usuarios')
            .select('*')
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1);
          data = usersData || [];
          errorObj = usersError;
        } else if (currentUser) {
          const result = await supabase.from('usuarios').select('*').eq('id', currentUser.id);
          data = result.data;
          errorObj = result.error;
        }
        if (!errorObj && data) setUsers(data);
        else {
          setUsers([]);
          setError('Erro ao carregar usuários. Veja o console para detalhes.');
          console.error('Erro ao buscar usuários:', errorObj);
        }
      } catch (error) {
        setUsers([]);
        setError('Erro ao carregar usuários. Veja o console para detalhes.');
        console.error('Erro ao buscar usuários:', error);
      } finally {
        console.timeEnd('Carregar usuários');
      }
    };
    fetchUsers();
  }, [isAdmin, currentUser, page]);
  
  const refreshUsers = async () => {
    let data = [];
    let error = null;
    if (isAdmin) {
      const { data: usersData, error: usersError } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);
      data = usersData || [];
      error = usersError;
    } else if (currentUser) {
      const result = await supabase.from('usuarios').select('*').eq('id', currentUser.id);
      data = result.data;
      error = result.error;
    }
    if (!error && data) setUsers(data);
    else setUsers([]);
  };
  
  const filteredUsers = useMemo(() => users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.department && user.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.position && user.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.whatsapp && user.whatsapp.toLowerCase().includes(searchQuery.toLowerCase())) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  ), [users, searchQuery]);
  
  const handleCreateUser = async (values: UserFormValues) => {
    try {
      const newId = uuidv4();
      console.log('UUID gerado para novo usuário:', newId);
      const userData = {
        id: newId,
        name: values.name,
        email: values.email.toLowerCase(),
        role: values.role,
        department: values.department || '',
        position: values.position || '',
        whatsapp: values.whatsapp || '',
        senha: 'senha123', // campo correto na tabela
        precisa_alterar_senha: true,
        created_at: new Date().toISOString()
      };
      const { error } = await supabase.from('usuarios').insert([userData]);
      if (error) throw error;
      await refreshUsers();
      userForm.reset();
      toast({
        title: 'Usuário criado!',
        description: `${values.name} foi criado com sucesso.`,
      });
      setTimeout(() => {
        navigate('/users'); // ajuste a rota se necessário
      }, 1000);
    } catch (error) {
      let message = 'Erro ao criar usuário';
      if (error && typeof error === 'object' && 'code' in error && (error.code === '23505' || error.code === '409')) {
        message = 'Já existe um usuário com este e-mail ou ID.';
      }
      console.error('Erro detalhado ao criar usuário:', error);
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    }
  };
  
  const handleEditUser = async (values: UserFormValues) => {
    if (!selectedUserForEdit) return;
    try {
      const updateData = {
        name: values.name,
        email: values.email,
        role: values.role,
        department: values.department || '',
        position: values.position || '',
        whatsapp: values.whatsapp || ''
      };
      const { error } = await supabase.from('usuarios').update(updateData).eq('id', selectedUserForEdit.id);
      if (error) throw error;
      await refreshUsers();
      setSelectedUserForEdit(null);
      toast({
        title: 'Usuário atualizado!',
        description: `${values.name} foi atualizado com sucesso.`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar usuário',
        variant: 'destructive',
      });
    }
  };
  
  const handlePasswordChange = async (values: PasswordFormValues) => {
    if (!selectedUser) return;
    
    try {
      const { error } = await supabase.from('usuarios').update({ senha: values.password, precisa_alterar_senha: false }).eq('id', selectedUser.id);
      if (error) throw error;
      passwordForm.reset();
      toast({
        title: 'Senha redefinida!',
        description: `A senha de ${selectedUser.name} foi alterada com sucesso.`,
      });
      setTimeout(() => {
        setShowPasswordForm(false);
        setSelectedUser(null);
      }, 900);
    } catch (error) {
      toast({
        title: 'Erro ao redefinir senha',
        description: error instanceof Error ? error.message : 'Erro ao alterar senha',
        variant: 'destructive',
      });
    }
  };
  
  const openPasswordForm = (user: User) => {
    setSelectedUser(user);
    setShowPasswordForm(true);
  };
  
  const openEditUserForm = (user: User) => {
    setSelectedUserForEdit(user);
    editUserForm.reset({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
      position: user.position || '',
      whatsapp: user.whatsapp || '',
    });
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      const { error } = await supabase.from('usuarios').delete().eq('id', userId);
      if (error) throw error;
      await refreshUsers();
      toast({
        title: 'Usuário excluído!',
        description: 'O usuário foi excluído com sucesso.'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao excluir usuário',
        variant: 'destructive',
      });
    }
  };
  
  if (!isAdmin) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }
  
  console.log('Renderizou UsersPage');
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              className="pl-8 w-full md:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Preencha os dados para criar um novo usuário no sistema.
                </DialogDescription>
              </DialogHeader>
              <Form {...userForm}>
                <form onSubmit={userForm.handleSubmit(handleCreateUser)} className="space-y-4">
                  <FormField
                    control={userForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do usuário" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={userForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="email@exemplo.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={userForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Função</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma função" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="requester">Solicitante</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={userForm.control}
                      name="whatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp</FormLabel>
                          <FormControl>
                            <Input placeholder="(00) 00000-0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={userForm.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Departamento</FormLabel>
                          <FormControl>
                            <Input placeholder="Departamento" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={userForm.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Unidade" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit">Criar Usuário</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {error && <div className="text-red-500 text-center my-4">{error}</div>}
      
      <Card>
        <CardHeader>
          <CardTitle>Todos os Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 px-4 text-left font-medium">Nome</th>
                  <th className="h-10 px-4 text-left font-medium">Email</th>
                  <th className="h-10 px-4 text-left font-medium hidden md:table-cell">Departamento</th>
                  <th className="h-10 px-4 text-left font-medium hidden md:table-cell">Unidade</th>
                  <th className="h-10 px-4 text-left font-medium hidden md:table-cell">WhatsApp</th>
                  <th className="h-10 px-4 text-left font-medium">Função</th>
                  <th className="h-10 px-4 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-muted-foreground">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="p-4 align-middle font-medium">{user.name}</td>
                      <td className="p-4 align-middle">{user.email}</td>
                      <td className="p-4 align-middle hidden md:table-cell">{user.department || '-'}</td>
                      <td className="p-4 align-middle hidden md:table-cell">{user.position || '-'}</td>
                      <td className="p-4 align-middle hidden md:table-cell">{user.whatsapp || '-'}</td>
                      <td className="p-4 align-middle">
                        <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                          {user.role === 'admin' ? 'Administrador' : 'Solicitante'}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle text-right">
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Redefinir senha do usuário"
                            onClick={() => openPasswordForm(user)}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          title="Editar Usuário"
                          onClick={() => openEditUserForm(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Excluir Usuário"
                            onClick={() => handleDeleteUser(user.id)}
                            style={{ color: 'red' }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Dialog para edição de usuário */}
      <Dialog open={!!selectedUserForEdit} onOpenChange={(open) => !open && setSelectedUserForEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              {selectedUserForEdit && `Editar informações de ${selectedUserForEdit.name}.`}
            </DialogDescription>
          </DialogHeader>
          <Form {...editUserForm}>
            <form onSubmit={editUserForm.handleSubmit(handleEditUser)} className="space-y-4">
              <FormField
                control={editUserForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do usuário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@exemplo.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editUserForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Função</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma função" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="requester">Solicitante</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editUserForm.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} value={field.value || ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editUserForm.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento</FormLabel>
                      <FormControl>
                        <Input placeholder="Departamento" {...field} value={field.value || ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editUserForm.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Unidade" {...field} value={field.value || ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedUserForEdit(null)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para redefinição de senha */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              {selectedUser && `Redefinir senha de ${selectedUser.name}.`}
            </DialogDescription>
          </DialogHeader>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite a nova senha" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancelar</Button>
                <Button type="submit">Salvar Nova Senha</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Controles de paginação para admin */}
      {isAdmin && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
          <span className="px-2">Página {page}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={users.length < pageSize}>Próxima</Button>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
