import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import {
  listUsuariosPaginated,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  resetUsuarioPassword,
  deleteUsuario,
} from '@/services/userService';
import { useNavigate } from 'react-router-dom';
import { getSemanticIcon } from '@/lib/utils';
import { DeleteUserDialog } from '@/components/users/DeleteUserDialog';
import { ResetPasswordDialog } from '@/components/users/ResetPasswordDialog';
import { EditUserDialog } from '@/components/users/EditUserDialog';
import { CreateUserDialog } from '@/components/users/CreateUserDialog';

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
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [, setShowPasswordForm] = useState(false);
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
    if (!import.meta.env.PROD) console.time('Carregar usuários');
    const fetchUsers = async () => {
      try {
        setError(null);
        if (isAdmin) {
          setUsers(await listUsuariosPaginated(page, pageSize));
        } else if (currentUser) {
          setUsers(await getUsuarioById(currentUser.id));
        } else {
          setUsers([]);
        }
      } catch (error) {
        setUsers([]);
        setError('Erro ao carregar usuários. Veja o console para detalhes.');
        if (!import.meta.env.PROD) console.error('Erro ao buscar usuários:', error);
      } finally {
        if (!import.meta.env.PROD) console.timeEnd('Carregar usuários');
      }
    };
    fetchUsers();
  }, [isAdmin, currentUser, page]);

  const refreshUsers = async () => {
    try {
      if (isAdmin) {
        setUsers(await listUsuariosPaginated(page, pageSize));
      } else if (currentUser) {
        setUsers(await getUsuarioById(currentUser.id));
      } else {
        setUsers([]);
      }
    } catch (error) {
      setUsers([]);
      if (!import.meta.env.PROD) console.error('Erro ao recarregar usuários:', error);
    }
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
      if (!import.meta.env.PROD) console.log('UUID gerado para novo usuário:', newId);
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
      await createUsuario(userData);
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
      if (!import.meta.env.PROD) console.error('Erro detalhado ao criar usuário:', error);
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
      await updateUsuario(selectedUserForEdit.id, updateData);
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
      await resetUsuarioPassword(selectedUser.id, values.password);
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
  
  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);
    try {
      await deleteUsuario(userToDelete.id);
      await refreshUsers();
      toast({
        title: 'Usuário excluído!',
        description: `${userToDelete.name} foi excluído com sucesso.`,
      });
      setUserToDelete(null);
    } catch (error) {
      if (!import.meta.env.PROD) console.error('Erro ao excluir usuário:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao excluir usuário',
        variant: 'destructive',
      });
    } finally {
      setDeletingUser(false);
    }
  };
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }
  
  if (!import.meta.env.PROD) console.log('Renderizou UsersPage');
  
  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              {getSemanticIcon('action-search', { className: 'absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' })}
              <Input
                placeholder="Buscar usuários..."
                className="pl-8 w-full md:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <CreateUserDialog form={userForm} onSubmit={handleCreateUser} />
          </div>
        </div>
        
        {error && <div className="text-destructive text-center my-4">{error}</div>}
        
        <Card>
          <CardHeader>
            <CardTitle>Todos os Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-background">
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Departamento</TableHead>
                    <TableHead className="hidden md:table-cell">Unidade</TableHead>
                    <TableHead className="hidden md:table-cell">WhatsApp</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="hidden md:table-cell">{user.department || '-'}</TableCell>
                        <TableCell className="hidden md:table-cell">{user.position || '-'}</TableCell>
                        <TableCell className="hidden md:table-cell">{user.whatsapp || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                            {user.role === 'admin' ? 'Administrador' : 'Solicitante'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Redefinir senha do usuário"
                              onClick={() => openPasswordForm(user)}
                            >
                              {getSemanticIcon('key', { className: 'h-4 w-4' })}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar Usuário"
                            onClick={() => openEditUserForm(user)}
                          >
                            {getSemanticIcon('action-edit', { className: 'h-4 w-4' })}
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Excluir Usuário"
                              onClick={() => handleDeleteUser(user)}
                              className="text-destructive hover:text-destructive"
                            >
                              {getSemanticIcon('action-close', { className: 'h-4 w-4' })}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        <EditUserDialog
          user={selectedUserForEdit}
          form={editUserForm}
          onSubmit={handleEditUser}
          onCancel={() => setSelectedUserForEdit(null)}
        />
        
        {/* Dialog para redefinição de senha */}
        <ResetPasswordDialog
          user={selectedUser}
          form={passwordForm}
          onSubmit={handlePasswordChange}
          onCancel={() => setSelectedUser(null)}
        />

        {/* Confirmação de exclusão de usuário */}
        <DeleteUserDialog
          user={userToDelete}
          deleting={deletingUser}
          onCancel={() => setUserToDelete(null)}
          onConfirm={confirmDeleteUser}
        />

        {/* Controles de paginação para admin */}
        {isAdmin && (
          <div className="flex justify-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
            <span className="px-2">Página {page}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={users.length < pageSize}>Próxima</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
