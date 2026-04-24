import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format, isAfter, isValid } from 'date-fns';
import { ArrowLeft, Calendar, Clock, FileText, PaperclipIcon, Send, User as UserIcon, ThumbsUp, ThumbsDown, AlertCircle, Trash2, X, Link as LinkIcon, ShieldCheck, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getRequestById, updateRequest, deleteRequest, uploadFile } from '@/services/requestService';
import { notificationService } from '@/services/notificationService';
import { ITRequest, User, Comment, Attachment, RequestStatus } from '@/types';
import { supabase } from '@/lib/supabase';
import { cn, tryFormatDateTime, translate, getStatusStyle, getPriorityStyle, getSemanticIcon, SemanticIconName } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { extractLifecycleLinks } from '@/utils/lifecycle-links';

const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<ITRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [reopenComment, setReopenComment] = useState('');
  const [showReopen, setShowReopen] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectFiles, setRejectFiles] = useState<File[]>([]);
  const [rejectUploading, setRejectUploading] = useState(false);
  const [showExtendDeadline, setShowExtendDeadline] = useState(false);
  const [newDeadline, setNewDeadline] = useState('');
  const [extendReason, setExtendReason] = useState('');
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionText, setResolutionText] = useState("");
  const [resolutionFiles, setResolutionFiles] = useState<File[]>([]);
  const [resolutionUploading, setResolutionUploading] = useState(false);
  const [reopenFiles, setReopenFiles] = useState<File[]>([]);
  const [reopenUploading, setReopenUploading] = useState(false);
  const [showEditDeliveryModal, setShowEditDeliveryModal] = useState(false);
  const [deliveryItemsList, setDeliveryItemsList] = useState<{ id: string, text: string, checked: boolean, avaria?: string }[]>([]);
  const [newDeliveryItem, setNewDeliveryItem] = useState("");
  const [updatingDelivery, setUpdatingDelivery] = useState(false);
  const [relatedOnboardingReq, setRelatedOnboardingReq] = useState<ITRequest | null>(null);
  const [relatedOffboardingReqs, setRelatedOffboardingReqs] = useState<ITRequest[]>([]);
  
  // Função para inicializar o checklist baseado na descrição
  const handleOpenDeliveryModal = async () => {
    if (!request) return;
    
    // Tenta extrair itens da descrição ou usa itens padrão baseados no tipo
    let items: { id: string, text: string, checked: boolean, avaria?: string }[] = [];
    
    // Se for OFFBOARDING, tentamos buscar o que foi entregue no onboarding original
    const action = request.metadata?.form_data?.action;
    const relatedOnboardingId = request.metadata?.form_data?.relatedOnboardingId;

    if (action === 'offboarding' && relatedOnboardingId) {
      try {
        const related = await getRequestById(relatedOnboardingId);
        if (related) {
          // Tenta extrair da meta estruturada (nova arquitetura) ou da descrição (fallback)
          const metaItems = related.metadata?.delivery_items;
          if (Array.isArray(metaItems)) {
            items = metaItems.map(it => ({ ...it, checked: false })); // Inicia desmarcado para conferência
          } else {
            // Fallback: extrair por regex da descrição do onboarding original
            const onbDesc = related.description || "";
            const markerMatch = onbDesc.match(/Itens a (?:Entregar|Recebidos):\n([\s\S]*)/);
            if (markerMatch && markerMatch[1]) {
              const lines = markerMatch[1].trim().split('\n');
              items = lines
                .filter(l => l.trim().startsWith('-'))
                .map(l => ({
                   id: crypto.randomUUID(),
                   text: l.trim().replace(/^- /, ""),
                   checked: false
                }));
            }
          }
        }
      } catch (err) {
        if (!import.meta.env.PROD) console.error("Erro ao buscar itens do Onboarding original:", err);
      }
    }

    // Se a lista ainda estiver vazia ou for Onboarding, usa a lógica padrão de ler o atual
    if (items.length === 0) {
      const desc = request.description || "";
      
      // Se a descrição já contém uma lista formatada (ex: "- Item"), extraímos
      const listMatches = desc.match(/^- .+/gm);
      if (listMatches && listMatches.length > 0) {
        items = listMatches.map(m => ({
          id: crypto.randomUUID(),
          text: m.replace(/^- /, "").trim(),
          checked: true
        }));
      } else {
        // Se não, tentamos encontrar a linha "Recursos/Acessos:"
        const accessMatch = desc.match(/Recursos\/Acessos: (.+)/);
        if (accessMatch && accessMatch[1]) {
          // Filtrar termos genéricos que não são itens reais de entrega
          const genericTerms = [
            'equipamentos', 
            'equipamento', 
            'sistemas', 
            'acesso aos sistemas e pastas', 
            'contas e canais corporativos', 
            'conta_canais'
          ];
          
          const rawItems = accessMatch[1].split(',').map(s => s.trim());
          items = rawItems
            .filter(text => !genericTerms.includes(text.toLowerCase()))
            .map(text => ({
              id: crypto.randomUUID(),
              text,
              checked: true
            }));
        }

        // Também tentamos extrair o que vier após "Observações:"
        const obsMatch = desc.match(/Observações: (.+)/s);
        if (obsMatch && obsMatch[1]) {
          const obsText = obsMatch[1].trim();
          // Se houver texto nas observações que não seja o padrão, adicionamos como item
          if (obsText && obsText.length > 2) {
            // Se tiver vírgulas, separa em itens, senão trata como um item só
            const obsItems = obsText.includes(',') ? obsText.split(',') : [obsText];
            obsItems.forEach(text => {
              if (text.trim()) {
                items.push({
                  id: crypto.randomUUID(),
                  text: text.trim(),
                  checked: true
                });
              }
            });
          }
        }
      }
    }

    setDeliveryItemsList(items);
    setShowEditDeliveryModal(true);
  };

  const addDeliveryItem = () => {
    if (!newDeliveryItem.trim()) return;
    setDeliveryItemsList([...deliveryItemsList, {
      id: crypto.randomUUID(),
      text: newDeliveryItem.trim(),
      checked: true
    }]);
    setNewDeliveryItem("");
  };

  const removeDeliveryItem = (id: string) => {
    setDeliveryItemsList(deliveryItemsList.filter(item => item.id !== id));
  };

  const toggleDeliveryItem = (id: string) => {
    setDeliveryItemsList(deliveryItemsList.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };
  
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
        if (user?.role !== 'admin' && fetchedRequest.requesteremail !== user?.email) {
          toast({
            title: 'Acesso Negado',
            description: 'Você não tem permissão para visualizar esta solicitação.',
            variant: 'destructive',
          });
          navigate('/dashboard');
          return;
        }
        setRequest(fetchedRequest);
      } catch (error: any) {
        if (!import.meta.env.PROD) console.error('Erro ao buscar solicitação:', error);
        toast({
          title: 'Erro',
          description: error?.message || 'Falha ao carregar a solicitação. Por favor, tente novamente.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [id, toast, navigate, user]);

  useEffect(() => {
    const fetchRelatedLifecycle = async () => {
      if (!request || (request.type !== 'employee_lifecycle' && request.type !== 'ciclo_colaborador')) {
        setRelatedOnboardingReq(null);
        setRelatedOffboardingReqs([]);
        return;
      }

      const action = request.metadata?.form_data?.action;
      const relatedId = request.metadata?.form_data?.relatedOnboardingId;

      // Se for um OFFboarding, busca o ONboarding de origem
      if ((action === 'offboarding' || request.title?.toLowerCase().startsWith('offboarding')) && relatedId) {
        try {
          const onb = await getRequestById(relatedId);
          setRelatedOnboardingReq(onb);
        } catch (err) {
          if (!import.meta.env.PROD) console.error("Erro ao buscar onboarding relacionado:", err);
        }
      }

      // Se for um ONboarding, busca se já houve algum OFFboarding para ele
      if (action === 'onboarding' || request.title?.toLowerCase().startsWith('onboarding')) {
        try {
          // Busca reversa: solicitações que citam este ID no metadata
          const { data } = await supabase
            .from('solicitacoes')
            .select('*')
            .contains('metadata', { form_data: { relatedOnboardingId: request.id } });
          
          if (data && data.length > 0) {
            setRelatedOffboardingReqs(data as ITRequest[]);
          }
        } catch (err) {
          if (!import.meta.env.PROD) console.error("Erro na busca reversa de offboarding:", err);
        }
      }
    };

    fetchRelatedLifecycle();
  }, [request]);
  
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
        if (!import.meta.env.PROD) console.error('Erro ao buscar administradores:', err);
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
      
      if (user.email === request.requesteremail) {
        await notificationService.notifyAdmins(
          `Novo comentário do solicitante na solicitação #${id}.`,
          'comentario',
          id
        );
      } else if (user.role === 'admin' && request.requesteremail) {
        const { data: solicitanteUser } = await supabase.from('usuarios').select('id').eq('email', request.requesteremail).single();
        if (solicitanteUser && solicitanteUser.id && solicitanteUser.id !== user.id) {
          await notificationService.send({
            para: solicitanteUser.id,
            mensagem: `Novo comentário do administrador na sua solicitação #${id}.`,
            tipo: 'comentario',
            request_id: id
          });
        }
      }
    } catch (error) {
      if (!import.meta.env.PROD) console.error('Erro ao adicionar comentário:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar comentário. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!request || !id || !user || user.role !== 'admin') return;
    try {
      setSubmitting(true);
      const updatedComments = request.comments?.filter(comment => comment.id !== commentId) || [];
      const updatedRequest = await updateRequest(id, {
        comments: updatedComments,
      });
      setRequest(updatedRequest);
      toast({
        title: 'Comentário Excluído',
        description: 'O comentário foi removido da solicitação.',
      });
    } catch (error) {
      if (!import.meta.env.PROD) console.error('Erro ao excluir comentário:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir comentário. Por favor, tente novamente.',
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
      const updates: Partial<ITRequest> = {
        status: newStatus as RequestStatus,
      };
      if ((newStatus === 'resolved' || newStatus === 'resolvida') && !request.resolvedat) {
        updates.resolvedat = new Date().toISOString();
        updates.resolution = `Resolvido por ${user?.name}`;
      }
      const updatedRequest = await updateRequest(id, updates);
      setRequest(updatedRequest);
      
      const statusLabel = getStatusStyle(newStatus).label;
      
      toast({
        title: 'Status Atualizado',
        description: `Status da solicitação alterado para ${statusLabel}`,
      });
    } catch (error: any) {
      if (!import.meta.env.PROD) console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Falha ao atualizar status. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const getStatusColor = (status: string | null | undefined) => {
    return getStatusStyle(status).color || 'bg-slate-500';
  };
  
  const getPriorityBadge = (priority: string | null | undefined) => {
    const style = getPriorityStyle(priority);
    const isHigh = priority === 'high' || priority === 'alta';
    const isMedium = priority === 'medium' || priority === 'media';
    
    let iconName: SemanticIconName = 'priority-low';
    if (isHigh) iconName = 'priority-high';
    else if (isMedium) iconName = 'priority-medium';

    return (
      <Badge 
        variant={style.variant || 'default'} 
        className={cn("font-bold", style.color, isHigh && "text-white")}
      >
        <span className="flex items-center gap-1">
          {getSemanticIcon(iconName, { className: cn("h-4 w-4", isHigh ? "text-white" : "text-current") })}
          {style.label} PRIORIDADE
        </span>
      </Badge>
    );
  };
  
  const formatStatus = (status: string | null | undefined) => {
    return translate('status', status).toUpperCase();
  };
  
  const formatRequestType = (type: string | null | undefined) => {
    return translate('type', type);
  };
  
  const isDeadlinePassed = (deadlineAt: string | null | undefined) => {
    if (!deadlineAt) return false;
    const deadline = new Date(deadlineAt);
    if (!isValid(deadline)) return false;
    return isAfter(new Date(), deadline);
  };
  
  const getDeadlineColorClass = (deadlineAt: string | null | undefined) => {
    if (!deadlineAt) return '';
    const now = new Date();
    const deadline = new Date(deadlineAt);
    if (!isValid(deadline)) return '';
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
      if (!import.meta.env.PROD) console.error('Erro ao processar aprovação:', error);
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
    if (!request || !id || !selectedTechnician) {
      toast({
        title: 'Erro',
        description: 'Dados inválidos para atribuição.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setSubmitting(true);
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
      if (!import.meta.env.PROD) console.error('Erro ao atribuir solicitação:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao atribuir solicitação. Por favor, tente novamente.',
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
      if (!import.meta.env.PROD) console.error('Erro ao enviar avaliação:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao enviar avaliação. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyAcceptanceLink = () => {
    const baseUrl = window.location.origin;
    const acceptanceUrl = `${baseUrl}/aceite/${id}`;
    navigator.clipboard.writeText(acceptanceUrl).then(() => {
      toast({
        title: 'Link Copiado!',
        description: 'O link do termo de aceite foi copiado para a área de transferência.',
      });
    }).catch(err => {
      if (!import.meta.env.PROD) console.error('Erro ao copiar link:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o link.',
        variant: 'destructive',
      });
    });
  };

  const handleUpdateDeliveryItems = async () => {
    if (!request || !id || !user) return;
    const activeItems = deliveryItemsList.filter(i => i.checked);
    if (activeItems.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione ou adicione ao menos um item para entrega.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUpdatingDelivery(true);
      
      // Formata a nova descrição
      const isOffboarding = (request.title || "").toLowerCase().includes("offboarding");
      const actionLabel = isOffboarding ? "Itens a Devolver" : "Itens a Entregar";
      
      let newDescription = `Ação: ${request.title?.split(' - ')[0]}\n`;
      newDescription += `Colaborador: ${request.title?.split(' - ')[1] || request.requestername}\n`;
      newDescription += `SLA: Definido automaticamente\n\n`;
      newDescription += `${actionLabel}:\n`;
      activeItems.forEach(item => {
        newDescription += `- ${item.text}${item.avaria ? ` (Obs TI: ${item.avaria})` : ''}\n`;
      });

      const originalDescComment: Comment = {
        id: crypto.randomUUID(),
        userId: user.id,
        userName: `SISTEMA (Original: ${request.requestername})`,
        text: `[SOLICITAÇÃO ORIGINAL] ${request.description}`,
        createdAt: new Date().toISOString(),
      };

      const updates = {
        description: newDescription.trim(),
        comments: [...(request.comments || []), originalDescComment],
        metadata: {
          ...(request.metadata || {}),
          delivery_items: activeItems.map(it => ({ id: it.id, text: it.text, checked: it.checked, avaria: it.avaria }))
        }
      };

      const updatedRequest = await updateRequest(id, updates);
      setRequest(updatedRequest);
      setShowEditDeliveryModal(false);
      toast({
        title: 'Itens de Entrega Atualizados',
        description: 'A descrição foi atualizada e o link de aceite está pronto.',
      });
    } catch (error) {
      if (!import.meta.env.PROD) console.error('Erro ao atualizar itens de entrega:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar os itens de entrega.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingDelivery(false);
    }
  };
  
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
        
        // Invalidar cache do React Query antes de voltar
        queryClient.invalidateQueries({ queryKey: ['requests'] });
        
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
        .createSignedUrl(filePath, 60);
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
    setReopenUploading(true);
    try {
      const newAttachments = [];
      if (reopenFiles.length > 0) {
        for (const file of reopenFiles) {
          const filePath = await uploadFile(file);
          newAttachments.push({
            id: crypto.randomUUID(),
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            fileUrl: filePath,
            uploadedAt: new Date().toISOString(),
          });
        }
      }
      const updatedAttachments = [...(request.attachments || []), ...newAttachments];
      const reopenCommentObj = {
        id: crypto.randomUUID(),
        userId: user.id,
        userName: user.name,
        text: `[REABERTURA] ${reopenComment}`,
        createdAt: new Date().toISOString(),
        attachments: newAttachments.length > 0 ? newAttachments : undefined,
      };
      const updates = {
        status: 'reopened',
        comments: [...(request.comments || []), reopenCommentObj],
        attachments: updatedAttachments,
      };
      const updatedRequest = await updateRequest(id, updates);
      setRequest(updatedRequest);
      setShowReopen(false);
      setReopenComment('');
      setReopenFiles([]);
      toast({ title: 'Solicitação Reaberta', description: 'Motivo registrado com sucesso.' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao reabrir solicitação.', variant: 'destructive' });
    } finally {
      setReopenUploading(false);
    }
  };
  
  const handleReject = async () => {
    if (!request || !id || !user || !rejectReason.trim()) return;
    try {
      setRejectUploading(true);
      const rejectAttachments: Attachment[] = [];
      if (rejectFiles.length > 0) {
        for (const file of rejectFiles) {
          try {
            const uploadedFile = await uploadFile(file, `anexos-solicitacoes/${id}/rejeicao/`);
            rejectAttachments.push({
              id: crypto.randomUUID(),
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              fileUrl: uploadedFile,
              uploadedAt: new Date().toISOString(),
            });
          } catch (error) {
            if (!import.meta.env.PROD) console.error('Erro ao fazer upload do arquivo:', error);
            toast({
              title: 'Erro no Upload',
              description: `Falha ao fazer upload do arquivo ${file.name}.`,
              variant: 'destructive',
            });
          }
        }
      }
      const newComment: Comment = {
        id: crypto.randomUUID(),
        userId: user.id,
        userName: user.name,
        text: `[REJEITADA] ${rejectReason.trim()}`,
        createdAt: new Date().toISOString(),
        attachments: rejectAttachments,
      };
      const updatedAttachments = [...(request.attachments || []), ...rejectAttachments];
      const updates: Partial<ITRequest> = {
        approvalstatus: 'rejected',
        approvedby: user.id,
        approvedbyname: user.name,
        status: 'rejected',
        comments: [...(request.comments || []), newComment],
        attachments: updatedAttachments,
      };
      const updatedRequest = await updateRequest(id, updates);
      setRequest(updatedRequest);
      setShowRejectModal(false);
      setRejectReason('');
      setRejectFiles([]);
      toast({
        title: 'Solicitação Rejeitada',
        description: 'A solicitação foi rejeitada com sucesso.',
      });
      const { data: solicitanteUser } = await supabase.from('usuarios').select('id').eq('email', request.requesteremail).single();
      if (solicitanteUser && solicitanteUser.id && solicitanteUser.id !== user.id) {
        await notificationService.send({
          para: solicitanteUser.id,
          mensagem: `Sua solicitação #${id} foi rejeitada. Motivo: ${rejectReason.trim()}`,
          tipo: 'rejeicao',
          request_id: id
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao rejeitar a solicitação. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setRejectUploading(false);
    }
  };
  
  const handleExtendDeadline = async () => {
    if (!request || !id || !user || !newDeadline || !extendReason.trim()) return;
    try {
      setSubmitting(true);
      const updatedRequest = await updateRequest(id, {
        deadlineat: new Date(newDeadline + 'T18:00:00').toISOString(),
        comments: [
          ...(request.comments || []),
          {
            id: crypto.randomUUID(),
            userId: user.id,
            userName: user.name,
            text: `Prazo estendido para ${tryFormatDateTime(newDeadline + 'T12:00:00', 'dd/MM/yyyy') ?? newDeadline}. Motivo: ${extendReason.trim()}`,
            createdAt: new Date().toISOString(),
          },
        ],
      });
      setRequest(updatedRequest);
      setShowExtendDeadline(false);
      setNewDeadline('');
      setExtendReason('');
      toast({
        title: 'Prazo Estendido',
        description: 'O novo prazo foi registrado e o solicitante notificado.',
      });
      if (request.requesteremail) {
        const { data: solicitanteUser } = await supabase.from('usuarios').select('id').eq('email', request.requesteremail).single();
        if (solicitanteUser && solicitanteUser.id && solicitanteUser.id !== user.id) {
          await notificationService.send({
            para: solicitanteUser.id,
            mensagem: `O prazo da sua solicitação #${id} foi alterado para ${tryFormatDateTime(newDeadline + 'T12:00:00', 'dd/MM/yyyy') ?? newDeadline}. Motivo: ${extendReason.trim()}`,
            tipo: 'prazo_estendido',
            request_id: id
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao estender prazo. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleOpenResolutionModal = () => {
    setResolutionText("");
    setResolutionFiles([]);
    setShowResolutionModal(true);
  };

  const handleSubmitResolution = async () => {
    if (!request || !id || !user) return;
    setResolutionUploading(true);
    try {
      const newAttachments = [];
      if (resolutionFiles.length > 0) {
        for (const file of resolutionFiles) {
          const filePath = await uploadFile(file);
          newAttachments.push({
            id: crypto.randomUUID(),
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            fileUrl: filePath,
            uploadedAt: new Date().toISOString(),
          });
        }
      }
      const updatedAttachments = [...(request.attachments || []), ...newAttachments];
      const resolutionComment = {
        id: crypto.randomUUID(),
        userId: user.id,
        userName: user.name,
        text: `[RESOLUÇÃO] ${resolutionText}`,
        createdAt: new Date().toISOString(),
        attachments: newAttachments.length > 0 ? newAttachments : undefined,
      };
      const updates = {
        status: 'resolved',
        resolvedat: new Date().toISOString(),
        resolution: resolutionText,
        attachments: updatedAttachments,
        comments: [...(request.comments || []), resolutionComment],
      };
      const updatedRequest = await updateRequest(id, updates);
      setRequest(updatedRequest);
      setShowResolutionModal(false);
      toast({ title: 'Solicitação Resolvida', description: 'Resolução registrada com sucesso.' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao registrar resolução.', variant: 'destructive' });
    } finally {
      setResolutionUploading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  if (!request) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold mb-4">Solicitação Não Encontrada</h2>
        <p className="text-muted-foreground mb-4 text-center">A solicitação que você está procurando não existe.</p>
        <Button asChild>
          <Link to="/dashboard">Voltar para Dashboard</Link>
        </Button>
      </div>
    );
  }

  const lifecycleLinks = extractLifecycleLinks(request.comments || []);
  
  const normalizeStatus = (status: string | null | undefined): string => {
    return String(status ?? '').toLowerCase();
  };

  const getStatusBadge = (status: string | null | undefined) => {
    const style = getStatusStyle(status);
    return (
      <Badge 
        variant={style.variant || 'default'} 
        className={cn("text-white font-bold", style.color)}
      >
        {style.label}
      </Badge>
    );
  };
  
  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar</span>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Solicitação #{request.id}</h1>
          </div>
          <div className="flex gap-2">
            {user?.role === 'admin' && !['resolved', 'resolvida', 'closed', 'fechada'].includes(request.status) && request.approvalstatus !== 'rejected' && (
              <>
                {(['assigned', 'atribuida', 'new', 'nova'].includes(request.status)) && (
                  <Button onClick={() => handleStatusChange('in_progress')} variant="outline" size="sm" disabled={submitting}>
                    Iniciar Progresso
                  </Button>
                )}
                <Button 
                  onClick={handleOpenResolutionModal} 
                  variant="outline" 
                  size="sm" 
                  disabled={submitting} 
                  className="bg-status-resolved text-white border-status-resolved hover:bg-status-resolved/90"
                >
                  Resolver
                </Button>
                <Button 
                  onClick={() => setShowRejectModal(true)} 
                  variant="destructive" 
                  size="sm" 
                  disabled={submitting} 
                  className="bg-status-rejected text-white border-status-rejected px-3"
                  title="Rejeitar Solicitação"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
            {user?.role === 'admin' && (
              <Button 
                onClick={handleDeleteRequest} 
                variant="destructive" 
                size="sm" 
                disabled={submitting} 
                className="bg-status-rejected text-white border-status-rejected px-3"
                title="Excluir Solicitação"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
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
                    {request.type === 'employee_lifecycle' ? request.title : (request.description || '').substring(0, 50)}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>{formatRequestType(request.type)}</span>
                    </div>
                    <span className="hidden sm:inline">•</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Criada em {tryFormatDateTime(request.createdat, 'dd/MM/yyyy') ?? '—'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {getPriorityBadge(request.priority)}
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* A rastreabilidade bidirecional (banner superior) foi removida a pedido, pois já existe no painel lateral de detalhes */}

                <div>
                  <h3 className="text-sm font-medium mb-2">Descrição</h3>
                  <div className="p-3 rounded text-sm whitespace-pre-wrap">
                    {request.description}
                  </div>
                </div>
                
                {request.resolution && (request.status === 'resolved' || request.status === 'resolvida') && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Resolução</h3>
                    <div className="bg-card p-3 rounded-md text-sm whitespace-pre-wrap border-l-4 border-green-500 shadow-none">
                      <p>{request.resolution}</p>
                      {request.comments && request.comments.length > 0 && (
                        (() => {
                          const resComment = request.comments.find(c => c.text.startsWith('[RESOLUÇÃO]'));
                          if (resComment && resComment.attachments && resComment.attachments.length > 0) {
                            return (
                              <div className="mt-2">
                                <div className="text-xs font-medium mb-1">Anexos da Resolução:</div>
                                <div className="space-y-2">
                                  {resComment.attachments.map((attachment: Attachment) => (
                                    <div key={attachment.id} className="flex items-center gap-2 p-2">
                                      <PaperclipIcon className="h-4 w-4 text-muted-foreground" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {attachment.fileSize ? `${(attachment.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Tamanho desconhecido'}
                                        </p>
                                      </div>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => attachment.fileUrl && handleViewAttachment(attachment.fileUrl)}
                                        disabled={!attachment.fileUrl}
                                      >
                                        Visualizar
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()
                      )}
                      {request.resolvedat && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Resolvida por {request.assignedtoname || 'Administrador'} em {tryFormatDateTime(request.resolvedat, 'dd/MM/yyyy HH:mm') ?? '—'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {request.comments && request.comments.some(c => c.text.startsWith('[REABERTURA]')) && (request.status === 'reopened' || request.status === 'reaberta') && (
                  (() => {
                    const reopen = request.comments.find(c => c.text.startsWith('[REABERTURA]'));
                    if (!reopen) return null;
                    return (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium mb-2">Reaberta</h3>
                        <div className="bg-card p-3 rounded-md text-sm whitespace-pre-wrap border-l-4 border-slate-500 shadow-none">
                          <p>{reopen.text.replace('[REABERTURA]', '').trim()}</p>
                          {reopen.attachments && reopen.attachments.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-medium mb-1">Anexos da Reabertura:</div>
                              <div className="space-y-2">
                                {reopen.attachments.map((attachment: Attachment) => (
                                  <div key={attachment.id} className="flex items-center gap-2 p-2">
                                    <PaperclipIcon className="h-4 w-4 text-muted-foreground" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {attachment.fileSize ? `${(attachment.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Tamanho desconhecido'}
                                      </p>
                                    </div>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => attachment.fileUrl && handleViewAttachment(attachment.fileUrl)}
                                      disabled={!attachment.fileUrl}
                                    >
                                      Visualizar
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Reaberta por {reopen.userName} em {tryFormatDateTime(reopen.createdAt, 'dd/MM/yyyy HH:mm') ?? '—'}
                          </p>
                        </div>
                      </div>
                    );
                  })()
                )}

                {request.comments && request.comments.some(c => c.text.startsWith('[REJEITADA]')) && (request.status === 'rejected' || request.status === 'rejeitada') && (
                  (() => {
                    const reject = request.comments.find(c => c.text.startsWith('[REJEITADA]'));
                    if (!reject) return null;
                    return (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium mb-2">Rejeitada</h3>
                        <div className="bg-card p-3 rounded-md text-sm whitespace-pre-wrap border-l-4 border-red-500 shadow-none">
                          <p>{reject.text.replace('[REJEITADA]', '').trim()}</p>
                          {reject.attachments && reject.attachments.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-medium mb-1">Anexos da Rejeição:</div>
                              <div className="space-y-2">
                              {reject.attachments.map((attachment: Attachment) => (
                                <div key={attachment.id} className="flex items-center gap-2 p-2">
                                    <PaperclipIcon className="h-4 w-4 text-muted-foreground" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {attachment.fileSize ? `${(attachment.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Tamanho desconhecido'}
                                      </p>
                                    </div>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => attachment.fileUrl && handleViewAttachment(attachment.fileUrl)}
                                      disabled={!attachment.fileUrl}
                                    >
                                      Visualizar
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Rejeitada por {reject.userName} em {tryFormatDateTime(reject.createdAt, 'dd/MM/yyyy HH:mm') ?? '—'}
                          </p>
                        </div>
                      </div>
                    );
                  })()
                )}

                {request.attachments && request.attachments.length > 0 && (
                  (() => {
                    const resComment = request.comments?.find(c => c.text.startsWith('[RESOLUÇÃO]'));
                    const resAttachmentIds = resComment?.attachments?.map(a => a.id) || [];
                    const reopenComment = request.comments?.find(c => c.text.startsWith('[REABERTURA]'));
                    const reopenAttachmentIds = reopenComment?.attachments?.map(a => a.id) || [];
                    const rejectComment = request.comments?.find(c => c.text.startsWith('[REJEITADA]'));
                    const rejectAttachmentIds = rejectComment?.attachments?.map(a => a.id) || [];
                    const userAttachments = request.attachments.filter(att => 
                      !resAttachmentIds.includes(att.id) && 
                      !reopenAttachmentIds.includes(att.id) && 
                      !rejectAttachmentIds.includes(att.id) &&
                      !att.isSignature
                    );
                    if (userAttachments.length === 0) return null;
                    return (
                      <div className="bg-card p-3 rounded-md">
                        <h3 className="text-sm font-medium mb-2">Anexos</h3>
                        <div className="space-y-2">
                          {userAttachments.map((attachment) => (
                            <div key={attachment.id} className="flex items-center gap-2 p-2">
                              <PaperclipIcon className="h-4 w-4 text-muted-foreground" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {attachment.fileSize ? `${(attachment.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Tamanho desconhecido'}
                                </p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => handleViewAttachment(attachment.fileUrl)} disabled={downloading === attachment.fileUrl}>
                                {downloading === attachment.fileUrl ? 'Abrindo...' : 'Visualizar'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                )}
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-4">Comentários</h3>
                  {(!request.comments || request.comments.length === 0) ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum comentário ainda</p>
                  ) : (
                    <div className="space-y-4">
                      {request.comments.map((comment) => (
                        <div key={comment.id} className="p-3 rounded relative group">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-sm">
                              <UserIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Comentado por:</span>
                              <span>{comment.userName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <time className="text-xs text-muted-foreground">
                                {tryFormatDateTime(comment.createdAt, 'dd/MM HH:mm') ?? '—'}
                              </time>
                              {user?.role === 'admin' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  disabled={submitting}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
                          {comment.attachments && comment.attachments.length > 0 && (
                            <div className="mt-2 space-y-2 border-t pt-2 border-muted">
                              {comment.attachments.map((attachment) => (
                                <div key={attachment.id} className="flex items-center gap-2 p-1.5 bg-muted/30 rounded-md">
                                  <PaperclipIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium truncate">{attachment.fileName}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {attachment.fileSize ? `${(attachment.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Tamanho desconhecido'}
                                    </p>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 text-[10px]" 
                                    onClick={() => attachment.fileUrl && handleViewAttachment(attachment.fileUrl)}
                                    disabled={!attachment.fileUrl}
                                  >
                                    Ver
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <Textarea
                      placeholder="Adicionar um comentário..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[100px] mb-2"
                    />
                    <div className="flex justify-end">
                      <Button onClick={handleAddComment} disabled={!comment.trim() || submitting}>
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
                  {request.approvalstatus === 'rejected' ? (
                    <p className="font-medium">N/A</p>
                  ) : (request.status === 'resolved' || request.status === 'resolvida') ? (
                    (() => {
                      const deadline = request.deadlineat ? new Date(request.deadlineat) : null;
                      const resolved = request.resolvedat ? new Date(request.resolvedat) : null;
                      if (!deadline || !resolved || !isValid(deadline) || !isValid(resolved)) {
                        return (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <p className="font-medium">{tryFormatDateTime(request.deadlineat, 'dd/MM/yyyy HH:mm') ?? '—'}</p>
                          </div>
                        );
                      }
                      const isOnTime = resolved <= deadline;
                      return (
                        <div className="flex items-center gap-2">
                          <Clock className={`h-4 w-4 ${isOnTime ? 'text-green-500' : 'text-red-500'}`} />
                          <p className={`font-medium ${isOnTime ? 'text-green-600' : 'text-red-600'}`}>
                            {isOnTime ? '✅ Resolvida no prazo' : '❌ Resolvida fora do prazo'}
                          </p>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className={`h-4 w-4 ${isDeadlinePassed(request.deadlineat) ? 'text-destructive' : ''}`} />
                        <p className={`font-medium ${getDeadlineColorClass(request.deadlineat)}`}>
                          {tryFormatDateTime(request.deadlineat, 'dd/MM/yyyy HH:mm') ?? '—'}
                        </p>
                      </div>
                      {user?.role === 'admin' && !['rejected', 'rejeitada', 'resolved', 'resolvida'].includes(request.status) && (
                        <Button onClick={() => setShowExtendDeadline(true)} variant="outline" size="sm" disabled={submitting}>
                          Estender Prazo
                        </Button>
                      )}
                    </div>
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

                {request.type === 'employee_lifecycle' && lifecycleLinks.onboardingId && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Onboarding Relacionado</p>
                    <Button variant="link" className="h-auto p-0 text-left font-medium" onClick={() => navigate(`/request/${lifecycleLinks.onboardingId}`)}>
                      #{lifecycleLinks.onboardingId}
                    </Button>
                  </div>
                )}

                {request.type === 'employee_lifecycle' && lifecycleLinks.offboardingIds.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Offboarding(s) Relacionado(s)</p>
                    <div className="flex flex-wrap gap-2">
                      {lifecycleLinks.offboardingIds.map((offboardingId) => (
                        <Button key={offboardingId} variant="link" className="h-auto p-0 text-left font-medium" onClick={() => navigate(`/request/${offboardingId}`)}>
                          #{offboardingId}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                <Separator />
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">ID da Solicitação</p>
                  <p className="font-medium">{request.id}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Criada em</p>
                  <p className="font-medium">{tryFormatDateTime(request.createdat, 'dd/MM/yyyy HH:mm') ?? '—'}</p>
                </div>
                
                {user?.role === 'admin' && (
                  <>
                    <Separator />
                    <div className="space-y-3 py-2">
                      <div className="flex items-center gap-2 text-primary">
                        <ShieldCheck className="h-4 w-4" />
                        <p className="text-sm font-semibold">Ações do Administrador</p>
                      </div>
                      
                      {/* Bloco de Ciclo de Vida */}
                      {(request.type === 'ciclo_colaborador' || request.type === 'employee_lifecycle') && (
                        <div className="space-y-2 mb-4">
                          {!['resolvida', 'resolved', 'closed', 'fechada'].includes(normalizeStatus(request.status)) ? (
                            <div className="flex flex-col gap-2">
                              <Button onClick={handleOpenDeliveryModal} variant="outline" size="sm" className="w-full flex items-center justify-center gap-2 bg-primary/5 border-primary/20 hover:bg-primary/10">
                                <FileText className="h-3.5 w-3.5" /> 
                                {request.metadata?.form_data?.action === 'offboarding' ? '1 - Itens a coletar' : '1. Definir Itens de Entrega'}
                              </Button>
                              <Button onClick={handleCopyAcceptanceLink} variant="outline" size="sm" className="w-full flex items-center justify-center gap-2 border-primary/30 hover:bg-primary/5">
                                <LinkIcon className="h-3.5 w-3.5" /> 2. Copiar Link de Aceite
                              </Button>
                            </div>
                          ) : (
                            <Button onClick={() => window.open(`${window.location.origin}/aceite/${id}`, '_blank')} variant="default" size="sm" className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Assinado - Ver Termo
                            </Button>
                          )}
                          <Separator className="my-2" />
                        </div>
                      )}

                      {/* Outras Ações (Aprovação e Atribuição) */}
                      {!['resolved', 'resolvida', 'closed', 'fechada'].includes(normalizeStatus(request.status)) && (
                        <div className="space-y-4">
                          {(request.type === 'solicitacao_equipamento' || request.type === 'sistemas' || request.type === 'equipment_request' || request.type === 'systems') && 
                           (normalizeStatus(request.status) === 'new' || normalizeStatus(request.status) === 'nova') && 
                           (!request.approvalstatus || request.approvalstatus === 'pending') && (
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground">Esta solicitação requer aprovação</p>
                              <div className="flex gap-2">
                                <Button onClick={() => handleApproval(true)} className="w-1/2" variant="outline" disabled={submitting}>
                                  <ThumbsUp className="h-4 w-4 mr-2" /> Aprovar
                                </Button>
                                <Button onClick={() => handleApproval(false)} className="w-1/2" variant="outline" disabled={submitting}>
                                  <ThumbsDown className="h-4 w-4 mr-2" /> Rejeitar
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {(normalizeStatus(request.status) === 'new' || normalizeStatus(request.status) === 'nova' || 
                            ((request.type === 'solicitacao_equipamento' || request.type === 'sistemas' || request.type === 'equipment_request' || request.type === 'systems') && request.approvalstatus === 'approved')) && (
                             <div className="space-y-2">
                               <p className="text-xs text-muted-foreground">Atribuir a um técnico específico</p>
                               <div className="space-y-2">
                                 <select 
                                    value={selectedTechnician} 
                                    onChange={(e) => setSelectedTechnician(e.target.value)}
                                    className="w-full p-2 border rounded-md text-sm bg-background text-foreground"
                                    disabled={submitting}
                                  >
                                   <option value="">Selecione um técnico</option>
                                   {adminUsers.map(admin => (
                                     <option key={admin.id} value={admin.id}>{admin.name}</option>
                                   ))}
                                 </select>
                                 <Button onClick={handleAssignToTechnician} className="w-full" variant="outline" size="sm" disabled={!selectedTechnician || submitting}>
                                   {submitting ? 'Atribuindo...' : 'Atribuir Solicitação'}
                                 </Button>
                               </div>
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {user?.role !== 'admin' && ['resolved', 'resolvida'].includes(request.status) && (
          <div className="mb-4">
            {!showReopen ? (
              <Button variant="outline" onClick={() => setShowReopen(true)}>Reabrir solicitação</Button>
            ) : (
              <div className="space-y-2">
                <Textarea placeholder="Explique o motivo da reabertura..." value={reopenComment} onChange={e => setReopenComment(e.target.value)} className="min-h-[80px]" />
                <Input type="file" multiple onChange={e => setReopenFiles(Array.from(e.target.files || []))} className="mt-2" />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleReopenRequest} disabled={!reopenComment.trim() || reopenUploading}>
                    {reopenUploading ? 'Enviando...' : 'Confirmar reabertura'}
                  </Button>
                  <Button variant="ghost" onClick={() => { setShowReopen(false); setReopenComment(''); setReopenFiles([]); }} disabled={reopenUploading}>Cancelar</Button>
                </div>
              </div>
            )}
          </div>
        )}

        <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Motivo da Rejeição</DialogTitle>
              <DialogDescription>Descreva o motivo da rejeição e anexe arquivos, se necessário.</DialogDescription>
            </DialogHeader>
            <Textarea placeholder="Descreva o motivo da rejeição..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="min-h-[100px]" />
            <Input type="file" multiple onChange={e => setRejectFiles(Array.from(e.target.files || []))} className="mt-2" />
            <DialogFooter>
              <Button variant="outline" onClick={handleReject} disabled={!rejectReason.trim() || rejectUploading}>
                {rejectUploading ? 'Salvando...' : 'Confirmar Rejeição'}
              </Button>
              <Button variant="ghost" onClick={() => { setShowRejectModal(false); setRejectReason(''); setRejectFiles([]); }} disabled={rejectUploading}>Cancelar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

         <Dialog open={showExtendDeadline} onOpenChange={setShowExtendDeadline}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Estender Prazo da Solicitação</DialogTitle>
               <DialogDescription>Informe o novo prazo e o motivo da alteração.</DialogDescription>
             </DialogHeader>
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium mb-1">Novo Prazo *</label>
                 <Input type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} min={format(new Date(), 'yyyy-MM-dd')} />
               </div>
               <div>
                 <label className="block text-sm font-medium mb-1">Motivo *</label>
                 <Textarea value={extendReason} onChange={e => setExtendReason(e.target.value)} placeholder="Descreva o motivo" rows={3} />
               </div>
             </div>
             <DialogFooter>
               <Button variant="outline" onClick={() => setShowExtendDeadline(false)} disabled={submitting}>Cancelar</Button>
               <Button variant="outline" onClick={handleExtendDeadline} disabled={submitting || !newDeadline || !extendReason.trim()}>
                 {submitting ? 'Salvando...' : 'Salvar'}
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>

         <Dialog open={showEditDeliveryModal} onOpenChange={setShowEditDeliveryModal}>
           <DialogContent className="max-w-md">
             <DialogHeader>
               <DialogTitle>Definir Itens de Entrega</DialogTitle>
               <DialogDescription>
                 Selecione os itens originais e adicione novos se necessário.
               </DialogDescription>
             </DialogHeader>
             
             <div className="space-y-4 py-4">
               <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                 {deliveryItemsList.length === 0 && (
                   <p className="text-sm text-muted-foreground text-center py-4 italic">
                     Nenhum item listado. Adicione abaixo.
                   </p>
                 )}
                 {deliveryItemsList.map((item) => (
                    <div key={item.id} className="flex flex-col gap-2 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox 
                            id={`item-${item.id}`} 
                            checked={item.checked} 
                            onCheckedChange={() => toggleDeliveryItem(item.id)}
                          />
                          <Label 
                            htmlFor={`item-${item.id}`} 
                            className={cn("text-sm cursor-pointer flex-1", !item.checked && "text-muted-foreground line-through")}
                          >
                            {item.text}
                          </Label>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => removeDeliveryItem(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {item.checked && request.metadata?.form_data?.action === 'offboarding' && (
                        <Input 
                          placeholder="Descrever avaria técnica ou motivo de não devolução (Opcional)" 
                          className="h-8 text-xs bg-background"
                          value={item.avaria || ''}
                          onChange={(e) => {
                            setDeliveryItemsList(prev => prev.map(i => i.id === item.id ? { ...i, avaria: e.target.value } : i));
                          }}
                        />
                      )}
                    </div>
                  ))}
               </div>

               <div className="flex gap-2 pt-2 border-t">
                 <Input 
                   placeholder="Adicionar novo item (ex: Celular)" 
                   value={newDeliveryItem} 
                   onChange={(e) => setNewDeliveryItem(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && addDeliveryItem()}
                 />
                 <Button onClick={addDeliveryItem} size="sm" type="button">
                   Adicionar
                 </Button>
               </div>

               <div className="p-3 rounded-md border flex gap-3">
                 <Info className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
                 <p className="text-[11px] text-foreground leading-normal">
                   Ao salvar, a descrição do chamado será atualizada com esta lista e a original será arquivada nos comentários.
                 </p>
               </div>
             </div>

             <DialogFooter>
               <Button variant="outline" onClick={() => setShowEditDeliveryModal(false)} disabled={updatingDelivery}>
                 Cancelar
               </Button>
               <Button onClick={handleUpdateDeliveryItems} disabled={updatingDelivery || deliveryItemsList.filter(i => i.checked).length === 0}>
                 {updatingDelivery ? 'Atualizando...' : 'Confirmar e Gerar Link'}
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
         
         <Dialog open={showResolutionModal} onOpenChange={setShowResolutionModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Resolução</DialogTitle>
              <DialogDescription>Descreva o que foi feito e anexe arquivos, se necessário.</DialogDescription>
            </DialogHeader>
            <Textarea placeholder="Descreva a resolução..." value={resolutionText} onChange={e => setResolutionText(e.target.value)} className="min-h-[100px]" />
            <Input type="file" multiple onChange={e => setResolutionFiles(Array.from(e.target.files || []))} className="mt-2" />
            <DialogFooter>
              <Button onClick={() => setShowResolutionModal(false)} variant="outline">Cancelar</Button>
              <Button variant="outline" onClick={handleSubmitResolution} disabled={resolutionUploading || !resolutionText.trim()}>
                {resolutionUploading ? 'Salvando...' : 'Salvar Resolução'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default RequestDetailPage;
