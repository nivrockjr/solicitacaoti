
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format, isAfter } from 'date-fns';
import { ArrowLeft, Calendar, Clock, FileText, PaperclipIcon, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ITRequest, Comment } from '@/types';
import { getRequestById, updateRequest } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<ITRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
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
        if (user?.role !== 'admin' && fetchedRequest.requesterId !== user?.id) {
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
      if (newStatus === 'resolved' && !request.resolvedAt) {
        updates.resolvedAt = new Date().toISOString();
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
        
        {user?.role === 'admin' && request.status !== 'resolved' && request.status !== 'resolvida' && request.status !== 'closed' && request.status !== 'fechada' && (
          <div className="flex gap-2">
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
          </div>
        )}
        
        {user?.role === 'admin' && (request.status === 'resolved' || request.status === 'resolvida') && (
          <Button onClick={() => handleStatusChange('closed')} variant="outline" disabled={submitting}>
            Encerrar Solicitação
          </Button>
        )}
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className={`h-2 ${getStatusColor(request.status)}`}></div>
            <CardHeader className="flex flex-col md:flex-row justify-between md:items-start gap-4">
              <div>
                <CardTitle className="text-xl mb-1">
                  {request.title || request.description.substring(0, 50)}
                </CardTitle>
                <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>{formatRequestType(request.type)}</span>
                  </div>
                  <span className="hidden sm:inline">•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Criada em {format(new Date(request.createdAt), 'dd/MM/yyyy')}</span>
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
                    {request.resolvedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Resolvida em {format(new Date(request.resolvedAt), 'dd/MM/yyyy HH:mm')}
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
                        <Button variant="ghost" size="sm" asChild>
                          <a 
                            href={attachment.fileUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-xs"
                          >
                            Visualizar
                          </a>
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
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs">
                              {comment.userName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <p className="text-sm font-medium">{comment.userName}</p>
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
                  <Clock className="h-4 w-4" />
                  <p className={`font-medium ${isDeadlinePassed(request.deadlineAt) && request.status !== 'resolved' && request.status !== 'closed' && request.status !== 'resolvida' && request.status !== 'fechada' ? 'text-destructive' : ''}`}>
                    {format(new Date(request.deadlineAt), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                {isDeadlinePassed(request.deadlineAt) && request.status !== 'resolved' && request.status !== 'closed' && request.status !== 'resolvida' && request.status !== 'fechada' && (
                  <p className="text-xs text-destructive">Prazo expirado</p>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Solicitante</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <div>
                    <p className="font-medium">{request.requesterName}</p>
                    <p className="text-xs text-muted-foreground">{request.requesterEmail}</p>
                  </div>
                </div>
              </div>
              
              {request.assignedTo && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Atribuído a</p>
                  <p className="font-medium">Equipe de Suporte</p>
                </div>
              )}
              
              <Separator />
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">ID da Solicitação</p>
                <p className="font-medium">{request.id}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Criada em</p>
                <p className="font-medium">{format(new Date(request.createdAt), 'dd/MM/yyyy HH:mm')}</p>
              </div>
              
              {(user?.role === 'admin' && request.status !== 'resolved' && request.status !== 'resolvida' && request.status !== 'closed' && request.status !== 'fechada') && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Ações do Administrador</p>
                    <div className="space-y-2">
                      {(request.status === 'new' || request.status === 'nova') && (
                        <Button 
                          onClick={() => handleStatusChange('assigned')} 
                          className="w-full" 
                          variant="outline"
                          disabled={submitting}
                        >
                          Atribuir Solicitação
                        </Button>
                      )}
                      
                      {(request.status === 'assigned' || request.status === 'atribuida' || request.status === 'new' || request.status === 'nova') && (
                        <Button 
                          onClick={() => handleStatusChange('in_progress')} 
                          className="w-full" 
                          variant="outline"
                          disabled={submitting}
                        >
                          Iniciar Progresso
                        </Button>
                      )}
                      
                      <Button 
                        onClick={() => handleStatusChange('resolved')} 
                        className="w-full"
                        disabled={submitting}
                      >
                        Marcar como Resolvida
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailPage;
