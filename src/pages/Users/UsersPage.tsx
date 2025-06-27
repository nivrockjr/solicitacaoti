import React, { useState, useEffect } from 'react';
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
import { createUser, updateUser, updateUserPassword, forgotPassword } from '@/services/apiService';
import { supabase } from '@/lib/supabase';

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
    const fetchUsers = async () => {
      let data = [];
      let error = null;
      if (isAdmin) {
        // Admin: busca todos os usuários via função RPC
        const rpcResult = await supabase.rpc('admin_list_users');
        data = rpcResult.data;
        error = rpcResult.error;
      } else if (currentUser) {
        // Usuário comum: busca apenas o próprio registro
        const result = await supabase.from('usuarios').select('*').eq('id', currentUser.id);
        data = result.data;
        error = result.error;
      }
      if (!error && data) setUsers(data);
      else setUsers([]);
    };
    fetchUsers();
  }, [isAdmin, currentUser]);
  
  const refreshUsers = async () => {
    let data = [];
    let error = null;
    if (isAdmin) {
      const rpcResult = await supabase.rpc('admin_list_users');
      data = rpcResult.data;
      error = rpcResult.error;
    } else if (currentUser) {
      const result = await supabase.from('usuarios').select('*').eq('id', currentUser.id);
      data = result.data;
      error = result.error;
    }
    if (!error && data) setUsers(data);
    else setUsers([]);
  };
  
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.department && user.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.position && user.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.whatsapp && user.whatsapp.toLowerCase().includes(searchQuery.toLowerCase())) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleCreateUser = async (values: UserFormValues) => {
    try {
      const userData: Omit<User, 'id'> & { password: string } = {
        ...values,
        password: 'senha123',
      };
      await createUser(userData);
      await refreshUsers();
      userForm.reset();
      toast({
        title: 'Usuário Criado',
        description: `${values.name} foi criado com sucesso.`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar usuário',
        variant: 'destructive',
      });
    }
  };
  
  const handleEditUser = async (values: UserFormValues) => {
    if (!selectedUserForEdit) return;
    try {
      await updateUser(selectedUserForEdit.id, values);
      await refreshUsers();
      setSelectedUserForEdit(null);
      toast({
        title: 'Usuário Atualizado',
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
      await updateUserPassword(selectedUser.id, values.password);
      passwordForm.reset();
      setShowPasswordForm(false);
      toast({
        title: 'Senha Alterada',
        description: `A senha de ${selectedUser.name} foi alterada com sucesso.`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
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
        title: 'Usuário Excluído',
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
                            title="Enviar link de redefinição de senha"
                            onClick={async () => {
                              try {
                                await forgotPassword(user.email);
                                toast({
                                  title: 'E-mail enviado',
                                  description: `Link de redefinição de senha enviado para ${user.email}`,
                                });
                              } catch (error) {
                                toast({
                                  title: 'Erro',
                                  description: error instanceof Error ? error.message : 'Erro ao enviar e-mail de redefinição',
                                  variant: 'destructive',
                                });
                              }
                            }}
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
    </div>
  );
};

export default UsersPage;
