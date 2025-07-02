import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format, isAfter } from 'date-fns';
import { ArrowLeft, Calendar, Clock, FileText, PaperclipIcon, Send, User as UserIcon, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getRequestById, updateRequest, deleteRequest } from '@/services/requestService';
import { ITRequest, User } from '@/types';
// import { users } from '@/services/authService';
import { Comment } from '@/types';
import { supabase } from '@/lib/supabase';
import { createNotification } from '@/services/utils';

const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<ITRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Adicionar estas variáveis de estado
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [reopenComment, setReopenComment] = useState('');
  const [showReopen, setShowReopen] = useState(false);
  
  useEffect(() => {
    const fetchRequest = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const fetchedRequest = await getRequestById(id);
        
        if (!fetchedRequest) {
          toast({
            title: 'Solicitação Não Encontrada',
            description: `A solicitação #${id} não existe ou você não tem permissão para visualizá-la.`,
            variant: 'destructive',
          });
          navigate('/dashboard');
          return;
        }
        
        // Check if the user has permission to view the request
        if (user?.role !== 'admin' && fetchedRequest.requesterid !== user?.id) {
          toast({
            title: 'Acesso Negado',
            description: 'Você não tem permissão para visualizar esta solicitação.',
            variant: 'destructive',
          });
          navigate('/dashboard');
          return;
        }
        
        setRequest(fetchedRequest);
      } catch (error) {
        console.error('Erro ao buscar solicitação:', error);
        toast({
          title: 'Erro',
          description: 'Falha ao carregar a solicitação. Por favor, tente novamente.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequest();
  }, [id, toast, navigate, user]);
  
  // Adicionar este novo useEffect para carregar os administradores
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('role', 'admin');
        if (error) throw error;
        setAdminUsers(data || []);
      } catch (err) {
        console.error('Erro ao buscar administradores:', err);
        setAdminUsers([]);
      }
    };
    fetchAdmins();
  }, []);
  const handleAddComment = async () => {
    if (!request || !id || !user || !comment.trim()) return;
    try {
      setSubmitting(true);
      const newComment: Comment = {
        id: crypto.randomUUID(),
        userId: user.id,
        userName: user.name,
        text: comment.trim(),
        createdAt: new Date().toISOString(),
      };
      const updatedRequest = await updateRequest(id, {
        comments: [...(request.comments || []), newComment],
      });
      setRequest(updatedRequest);
      setComment('');
      toast({
        title: 'Comentário Adicionado',
        description: 'Seu comentário foi adicionado à solicitação.',
      });
      // Lógica de notificação conforme orientação
      if (user.id === request.requesterid) {
        // Se o autor é o solicitante, notificar todos os admins (exceto o próprio autor, caso seja admin)
        if (adminUsers && Array.isArray(adminUsers)) {
          console.log('Admins encontrados:', adminUsers);
          await Promise.all(
            adminUsers.filter(admin => admin.id !== user.id).map(admin => {
              console.log('Enviando notificação para admin:', admin.id, 'nome:', admin.name);
              return createNotification({
                para: admin.id,
                mensagem: `Novo comentário do solicitante na solicitação #${id}.`,
                tipo: 'comentario',
                requestId: id
              });
            })
          );
        } else {
          console.log('adminUsers está vazio ou não é array:', adminUsers);
        }
      } else if (user.role === 'admin' && request.requesterid && user.id !== request.requesterid) {
        // Se o autor é admin, notificar apenas o solicitante (se não for o próprio admin)
        console.log('Enviando notificação para solicitante:', request.requesterid);
        createNotification({
          para: request.requesterid,
          mensagem: `Novo comentário do administrador na sua solicitação #${id}.`,
          tipo: 'comentario',
          requestId: id
        });
      }
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar comentário. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleStatusChange = async (newStatus: string) => {
    if (!request || !id) return;
    
    try {
      setSubmitting(true);
      
      let updates: Partial<ITRequest> = {
        status: newStatus as any,
      };
      
      // If resolving, add resolution details
      if (newStatus === 'resolved' && !request.resolvedat) {
        updates.resolvedat = new Date().toISOString();
        updates.resolution = `Resolvido por ${user?.name}`;
      }
      
      const updatedRequest = await updateRequest(id, updates);
      setRequest(updatedRequest);
      
      const statusMessages = {
        'assigned': 'ATRIBUÍDA',
        'in_progress': 'EM ANDAMENTO',
        'resolved': 'RESOLVIDA',
        'closed': 'FECHADA'
      };
      
      toast({
        title: 'Status Atualizado',
        description: `Status da solicitação alterado para ${statusMessages[newStatus as keyof typeof statusMessages] || newStatus.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar status. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
      case 'nova':
        return 'bg-blue-500';
      case 'assigned':
      case 'atribuida':
        return 'bg-amber-500';
      case 'in_progress':
      case 'em_andamento':
        return 'bg-purple-500';
      case 'resolved':
      case 'resolvida':
        return 'bg-green-500';
      case 'closed':
      case 'fechada':
        return 'bg-slate-500';
      default:
        return 'bg-slate-500';
    }
  };
  
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'alta':
        return <Badge variant="destructive">Alta Prioridade</Badge>;
      case 'medium':
      case 'media':
        return <Badge>Média Prioridade</Badge>;
      case 'low':
      case 'baixa':
        return <Badge variant="outline">Baixa Prioridade</Badge>;
      default:
        return null;
    }
  };
  
  const formatStatus = (status: string) => {
    const statusMap = {
      'new': 'NOVA',
      'nova': 'NOVA',
      'assigned': 'ATRIBUÍDA',
      'atribuida': 'ATRIBUÍDA',
      'in_progress': 'EM ANDAMENTO',
      'em_andamento': 'EM ANDAMENTO',
      'resolved': 'RESOLVIDA',
      'resolvida': 'RESOLVIDA',
      'closed': 'FECHADA',
      'fechada': 'FECHADA'
    };
    
    return statusMap[status as keyof typeof statusMap] || status.toUpperCase();
  };
  
  const formatRequestType = (type: string) => {
    const typeMap = {
      'geral': 'Geral',
      'sistemas': 'Sistemas',
      'ajuste_estoque': 'Ajuste de Estoque',
      'solicitacao_equipamento': 'Solicitação de Equipamento',
      'manutencao_preventiva': 'Manutenção Preventiva',
      'inventory': 'Inventário',
      'system': 'Sistema',
      'emergency': 'Emergência',
      'other': 'Outro'
    };
    
    return typeMap[type as keyof typeof typeMap] || type;
  };
  
  const isDeadlinePassed = (deadlineAt: string) => {
    return isAfter(new Date(), new Date(deadlineAt));
  };
  
  // Função para determinar a classe de cor do prazo
  const getDeadlineColorClass = (deadlineAt: string) => {
    const now = new Date();
    const deadline = new Date(deadlineAt);
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    
    if (diffDays < 0) return 'text-red-500 font-bold';
    if (diffDays < 1) return 'text-amber-500 font-bold';
    if (diffDays < 2) return 'text-amber-400';
    return '';
  };
  
  const handleApproval = async (isApproved: boolean) => {
    if (!request || !id || !user) return;
    
    try {
      setSubmitting(true);
      
      const updates: Partial<ITRequest> = {
        approvalstatus: isApproved ? 'approved' : 'rejected',
        approvedby: user.id,
        approvedbyname: user.name
      };
      
      // Se for aprovado e for uma solicitação de equipamento ou sistemas, manter como nova
      // Caso contrário, se for aprovado, mudar para atribuída
      if (isApproved && (request.type !== 'solicitacao_equipamento' && request.type !== 'sistemas')) {
        updates.status = 'assigned';
      }
      
      const updatedRequest = await updateRequest(id, updates);
      setRequest(updatedRequest);
      
      toast({
        title: isApproved ? 'Solicitação Aprovada' : 'Solicitação Rejeitada',
        description: isApproved 
          ? 'A solicitação foi aprovada com sucesso.'
          : 'A solicitação foi rejeitada.',
      });
    } catch (error) {
      console.error('Erro ao processar aprovação:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao processar aprovação. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleAssignToTechnician = async () => {
    if (!request || !id || !selectedTechnician) return;
    
    try {
      setSubmitting(true);
      
      // Encontrar o nome do técnico selecionado
      const technician = adminUsers.find(admin => admin.id === selectedTechnician);
      if (!technician) {
        throw new Error('Técnico não encontrado');
      }
      
      const updates: Partial<ITRequest> = {
        assignedto: selectedTechnician,
        assignedtoname: technician?.name || null,
        status: 'assigned',
      };
      
      const updatedRequest = await updateRequest(id, updates);
      setRequest(updatedRequest);
      
      toast({
        title: 'Solicitação Atribuída',
        description: `A solicitação foi atribuída a ${technician.name}.`,
      });
    } catch (error) {
      console.error('Erro ao atribuir solicitação:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atribuir solicitação. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleRating = async (rating: number) => {
    if (!request || !id) return;
    
    try {
      setSubmitting(true);
      
      const updatedRequest = await updateRequest(id, { rating });
      setRequest(updatedRequest);
      
      toast({
        title: 'Avaliação Enviada',
        description: 'Obrigado por avaliar esta solicitação.',
      });
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao enviar avaliação. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Função para excluir solicitação
  const handleDeleteRequest = async () => {
    if (!request || !id || !user) return;
    if (!window.confirm('Tem certeza que deseja excluir esta solicitação? Esta ação não poderá ser desfeita.')) return;
    try {
      setSubmitting(true);
      const success = await deleteRequest(id);
      if (success) {
        toast({
          title: 'Solicitação Excluída',
          description: 'A solicitação foi excluída com sucesso.',
        });
        navigate('/dashboard');
      } else {
        toast({
          title: 'Erro',
          description: 'Você não tem permissão para excluir esta solicitação.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao excluir a solicitação. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleViewAttachment = async (filePath: string) => {
    setDownloading(filePath);
    try {
      const { data, error } = await supabase
        .storage
        .from('anexos-solicitacoes')
        .createSignedUrl(filePath, 60); // 60 segundos
      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (err) {
      toast({
        title: 'Erro ao abrir anexo',
        description: 'Não foi possível gerar o link do anexo.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(null);
    }
  };
  
  const handleReopenRequest = async () => {
    if (!request || !id || !user || !reopenComment.trim()) return;
    try {
      setSubmitting(true);
      const newComment: Comment = {
        id: crypto.randomUUID(),
        userId: user.id,
        userName: user.name,
        text: `[REABERTURA] ${reopenComment.trim()}`,
        createdAt: new Date().toISOString(),
      };
      const updates: Partial<ITRequest> = {
        status: 'reaberta',
        comments: [...(request.comments || []), newComment],
      };
      const updatedRequest = await updateRequest(id, updates);
      setRequest(updatedRequest);
      setReopenComment('');
      setShowReopen(false);
      toast({
        title: 'Solicitação Reaberta',
        description: 'Sua solicitação foi reaberta e a equipe será notificada.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível reabrir a solicitação. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <h2 className="text-2xl font-bold mb-4">Solicitação Não Encontrada</h2>
        <p className="text-muted-foreground mb-4">A solicitação que você está procurando não existe.</p>
        <Button asChild>
          <Link to="/dashboard">Voltar para Dashboard</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Solicitação #{request.id}</h1>
        </div>
        <div className="flex gap-2">
          {/* Botão de exclusão para admin e solicitante */}
          {(user?.role === 'admin' || user?.id === request.requesterid) && (
            <Button onClick={handleDeleteRequest} variant="destructive" disabled={submitting}>
              Excluir Solicitação
            </Button>
          )}
          {/* Botões de status para admin */}
          {user?.role === 'admin' && request.status !== 'resolved' && request.status !== 'resolvida' && request.status !== 'closed' && request.status !== 'fechada' && (
            <>
              {(request.status === 'new' || request.status === 'nova') && (
                <Button onClick={() => handleStatusChange('assigned')} variant="outline" disabled={submitting}>
                  Atribuir
                </Button>
              )}
              {(request.status === 'assigned' || request.status === 'atribuida' || request.status === 'new' || request.status === 'nova') && (
                <Button onClick={() => handleStatusChange('in_progress')} variant="outline" disabled={submitting}>
                  Iniciar Progresso
                </Button>
              )}
              <Button onClick={() => handleStatusChange('resolved')} disabled={submitting}>
                Resolver
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className={`h-2 ${getStatusColor(request.status)}`}></div>
            <CardHeader className="flex flex-col md:flex-row justify-between md:items-start gap-4">
              <div>
                <CardTitle className="text-xl mb-1">
                  {request.description.substring(0, 50)}
                </CardTitle>
                <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>{formatRequestType(request.type)}</span>
                  </div>
                  <span className="hidden sm:inline">•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Criada em {format(new Date(request.createdat), 'dd/MM/yyyy')}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                {getPriorityBadge(request.priority)}
                <Badge variant={(request.status === 'resolved' || request.status === 'resolvida' || request.status === 'closed' || request.status === 'fechada') ? 'outline' : 'secondary'}>
                  {formatStatus(request.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Descrição</h3>
                <div className="bg-muted/40 p-3 rounded text-sm whitespace-pre-wrap">
                  {request.description}
                </div>
              </div>
              
              {request.resolution && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Resolução</h3>
                  <div className="bg-muted/40 p-3 rounded text-sm whitespace-pre-wrap border-l-4 border-green-500">
                    <p>{request.resolution}</p>
                    {request.resolvedat && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Resolvida em {format(new Date(request.resolvedat), 'dd/MM/yyyy HH:mm')}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {request.attachments && request.attachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Anexos</h3>
                  <div className="space-y-2">
                    {request.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-2 bg-muted/40 p-2 rounded"
                      >
                        <PaperclipIcon className="h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewAttachment(attachment.fileUrl)}
                          disabled={downloading === attachment.fileUrl}
                        >
                          {downloading === attachment.fileUrl ? 'Abrindo...' : 'Visualizar'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-4">Comentários</h3>
                {(!request.comments || request.comments.length === 0) ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum comentário ainda</p>
                ) : (
                  <div className="space-y-4">
                    {request.comments.map((comment) => (
                      <div key={comment.id} className="bg-muted/40 p-3 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Comentado por:</span>
                            <span>{comment.userName}</span>
                          </div>
                          <time className="text-xs text-muted-foreground">
                            {format(new Date(comment.createdAt), 'dd/MM HH:mm')}
                          </time>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Textarea
                      placeholder="Adicionar um comentário..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleAddComment} 
                      disabled={!comment.trim() || submitting}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Adicionar Comentário
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalhes da Solicitação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{formatStatus(request.status)}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Prazo</p>
                <div className="flex items-center gap-2">
                  <Clock className={`h-4 w-4 ${isDeadlinePassed(request.deadlineat) && request.status !== 'resolved' && request.status !== 'closed' && request.status !== 'resolvida' && request.status !== 'fechada' ? 'text-destructive' : ''}`} />
                  <p className={`font-medium ${getDeadlineColorClass(request.deadlineat)}`}>
                    {format(new Date(request.deadlineat), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                {isDeadlinePassed(request.deadlineat) && request.status !== 'resolved' && request.status !== 'closed' && request.status !== 'resolvida' && request.status !== 'fechada' && (
                  <p className="text-xs text-destructive">Prazo expirado</p>
                )}
                {!isDeadlinePassed(request.deadlineat) && getDeadlineColorClass(request.deadlineat).includes('amber') && (
                  <p className="text-xs text-amber-500">Prazo próximo do vencimento</p>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Solicitante</p>
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  <div>
                    <p className="font-medium">{request.requestername}</p>
                    <p className="text-xs text-muted-foreground">{request.requesteremail}</p>
                  </div>
                </div>
              </div>
              
              {request.assignedto && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Atribuído a</p>
                  <p className="font-medium">{request.assignedtoname || 'Equipe de Suporte'}</p>
                </div>
              )}
              
              <Separator />
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">ID da Solicitação</p>
                <p className="font-medium">{request.id}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Criada em</p>
                <p className="font-medium">{format(new Date(request.createdat), 'dd/MM/yyyy HH:mm')}</p>
              </div>
              
              {(user?.role === 'admin' && request.status !== 'resolved' && request.status !== 'resolvida' && request.status !== 'closed' && request.status !== 'fechada') && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Ações do Administrador</p>
                    <div className="space-y-2">
                      {/* Aprovação para solicitações de equipamentos e sistemas */}
                      {(request.type === 'solicitacao_equipamento' || request.type === 'sistemas') && 
                       (request.status === 'new' || request.status === 'nova') && 
                       (!request.approvalstatus || request.approvalstatus === 'pending') && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Esta solicitação requer aprovação</p>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleApproval(true)} 
                              className="w-1/2" 
                              variant="outline"
                              disabled={submitting}
                            >
                              <ThumbsUp className="h-4 w-4 mr-2" />
                              Aprovar
                            </Button>
                            <Button 
                              onClick={() => handleApproval(false)} 
                              className="w-1/2" 
                              variant="outline"
                              disabled={submitting}
                            >
                              <ThumbsDown className="h-4 w-4 mr-2" />
                              Rejeitar
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Atribuição a um técnico específico */}
                      {(request.status === 'new' || request.status === 'nova' || 
                        ((request.type === 'solicitacao_equipamento' || request.type === 'sistemas') && 
                         request.approvalstatus === 'approved')) && (
                        <div className="space-y-2">
                          <div className="flex flex-col gap-2">
                            <Select 
                              value={selectedTechnician} 
                              onValueChange={setSelectedTechnician}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um técnico" />
                              </SelectTrigger>
                              <SelectContent>
                                {adminUsers.map(admin => (
                                  <SelectItem key={admin.id} value={admin.id}>
                                    {admin.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button 
                              onClick={handleAssignToTechnician} 
                              className="w-full" 
                              variant="outline"
                              disabled={!selectedTechnician || submitting}
                            >
                              Atribuir Solicitação
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Botão de reabrir solicitação para o solicitante */}
      {user?.role !== 'admin' && request?.status && (request.status === 'resolved' || request.status === 'resolvida') && (
        <div className="mb-4">
          {!showReopen ? (
            <Button variant="outline" onClick={() => setShowReopen(true)}>
              Reabrir solicitação
            </Button>
          ) : (
            <div className="space-y-2">
              <Textarea
                placeholder="Explique o motivo da reabertura..."
                value={reopenComment}
                onChange={e => setReopenComment(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button onClick={handleReopenRequest} disabled={!reopenComment.trim() || submitting}>
                  Confirmar reabertura
                </Button>
                <Button variant="ghost" onClick={() => { setShowReopen(false); setReopenComment(''); }} disabled={submitting}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RequestDetailPage;
