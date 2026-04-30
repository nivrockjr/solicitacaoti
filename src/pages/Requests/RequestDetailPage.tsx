import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getRequestById, updateRequest, deleteRequest, uploadFile, findOffboardingsByOnboardingId } from '@/services/requestService';
import { notificationService } from '@/services/notificationService';
import { listAdmins, getUserIdByEmail } from '@/services/userService';
import { getAttachmentSignedUrl } from '@/services/storageService';
import { ITRequest, User, Comment, Attachment, RequestStatus, DeliveryItem } from '@/types';
import { cn, tryFormatDateTime, translate, getStatusStyle, getPriorityStyle, getSemanticIcon, SemanticIconName } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { RejectRequestModal } from '@/components/requests/modals/RejectRequestModal';
import { ExtendDeadlineModal } from '@/components/requests/modals/ExtendDeadlineModal';
import { EditDeliveryModal } from '@/components/requests/modals/EditDeliveryModal';
import { ResolutionModal } from '@/components/requests/modals/ResolutionModal';
import { DeleteRequestDialog } from '@/components/requests/modals/DeleteRequestDialog';
import { RequestHeader } from '@/components/requests/sections/RequestHeader';
import { RequestAttachments } from '@/components/requests/sections/RequestAttachments';
import { RequestComments } from '@/components/requests/sections/RequestComments';
import { RequestSidebar } from '@/components/requests/sections/RequestSidebar';
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
  const [deliveryItemsList, setDeliveryItemsList] = useState<DeliveryItem[]>([]);
  const [newDeliveryItem, setNewDeliveryItem] = useState("");
  const [updatingDelivery, setUpdatingDelivery] = useState(false);
  // Estados populados pelas queries de busca reversa (linhas ~225+) mas atualmente
  // não consumidos no JSX. Setters preservados para manter o efeito colateral
  // do fetch e permitir religar a UI no futuro sem reintroduzir o estado.
  const [, setRelatedOnboardingReq] = useState<ITRequest | null>(null);
  const [, setRelatedOffboardingReqs] = useState<ITRequest[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
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
      } catch (error) {
        if (!import.meta.env.PROD) console.error('Erro ao buscar solicitação:', error);
        toast({
          title: 'Erro',
          description: error instanceof Error ? error.message : 'Falha ao carregar a solicitação. Por favor, tente novamente.',
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
          const data = await findOffboardingsByOnboardingId(request.id);
          if (data.length > 0) {
            setRelatedOffboardingReqs(data);
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
        const admins = await listAdmins();
        setAdminUsers(admins);
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
        const solicitanteId = await getUserIdByEmail(request.requesteremail);
        if (solicitanteId && solicitanteId !== user.id) {
          await notificationService.send({
            para: solicitanteId,
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
    } catch (error) {
      if (!import.meta.env.PROD) console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao atualizar status. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const getStatusColor = (status: string | null | undefined) => {
    return getStatusStyle(status).color || 'bg-muted-foreground';
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
  
  const formatRequestType = (type: string | null | undefined) => {
    return translate('type', type);
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
  
  const handleDeleteRequest = () => {
    if (!request || !id || !user) return;
    setShowDeleteDialog(true);
  };

  const confirmDeleteRequest = async () => {
    if (!request || !id || !user) return;
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

        setShowDeleteDialog(false);
        navigate('/dashboard');
      } else {
        toast({
          title: 'Erro',
          description: 'Você não tem permissão para excluir esta solicitação.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      if (!import.meta.env.PROD) console.error('Erro ao excluir a solicitação:', error);
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
      const signedUrl = await getAttachmentSignedUrl(filePath);
      window.open(signedUrl, '_blank');
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
      const updates: Partial<ITRequest> = {
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
      if (!import.meta.env.PROD) console.error('Erro ao reabrir a solicitação:', error);
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
            const uploadedFile = await uploadFile(file, id);
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
      const solicitanteId = request.requesteremail ? await getUserIdByEmail(request.requesteremail) : null;
      if (solicitanteId && solicitanteId !== user.id) {
        await notificationService.send({
          para: solicitanteId,
          mensagem: `Sua solicitação #${id} foi rejeitada. Motivo: ${rejectReason.trim()}`,
          tipo: 'rejeicao',
          request_id: id
        });
      }
    } catch (error) {
      if (!import.meta.env.PROD) console.error('Erro ao rejeitar a solicitação:', error);
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
        const solicitanteId = await getUserIdByEmail(request.requesteremail);
        if (solicitanteId && solicitanteId !== user.id) {
          await notificationService.send({
            para: solicitanteId,
            mensagem: `O prazo da sua solicitação #${id} foi alterado para ${tryFormatDateTime(newDeadline + 'T12:00:00', 'dd/MM/yyyy') ?? newDeadline}. Motivo: ${extendReason.trim()}`,
            tipo: 'prazo_estendido',
            request_id: id
          });
        }
      }
    } catch (error) {
      if (!import.meta.env.PROD) console.error('Erro ao estender prazo:', error);
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
      const updates: Partial<ITRequest> = {
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
      if (!import.meta.env.PROD) console.error('Erro ao submeter resolução:', error);
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
        <RequestHeader
          request={request}
          user={user}
          submitting={submitting}
          onBack={() => navigate(-1)}
          onStatusChange={handleStatusChange}
          onOpenResolutionModal={handleOpenResolutionModal}
          onOpenRejectModal={() => setShowRejectModal(true)}
          onDelete={handleDeleteRequest}
        />
        
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
                      {getSemanticIcon('file', { className: 'h-4 w-4' })}
                      <span>{formatRequestType(request.type)}</span>
                    </div>
                    <span className="hidden sm:inline">•</span>
                    <div className="flex items-center gap-1">
                      {getSemanticIcon('calendar', { className: 'h-4 w-4' })}
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
                    <div className="bg-card p-3 rounded-md text-sm whitespace-pre-wrap border-l-4 border-success shadow-none">
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
                                      {getSemanticIcon('attachment', { className: 'h-4 w-4 text-muted-foreground' })}
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
                        <div className="bg-card p-3 rounded-md text-sm whitespace-pre-wrap border-l-4 border-muted-foreground shadow-none">
                          <p>{reopen.text.replace('[REABERTURA]', '').trim()}</p>
                          {reopen.attachments && reopen.attachments.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-medium mb-1">Anexos da Reabertura:</div>
                              <div className="space-y-2">
                                {reopen.attachments.map((attachment: Attachment) => (
                                  <div key={attachment.id} className="flex items-center gap-2 p-2">
                                    {getSemanticIcon('attachment', { className: 'h-4 w-4 text-muted-foreground' })}
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
                        <div className="bg-card p-3 rounded-md text-sm whitespace-pre-wrap border-l-4 border-destructive shadow-none">
                          <p>{reject.text.replace('[REJEITADA]', '').trim()}</p>
                          {reject.attachments && reject.attachments.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-medium mb-1">Anexos da Rejeição:</div>
                              <div className="space-y-2">
                              {reject.attachments.map((attachment: Attachment) => (
                                <div key={attachment.id} className="flex items-center gap-2 p-2">
                                    {getSemanticIcon('attachment', { className: 'h-4 w-4 text-muted-foreground' })}
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

                <RequestAttachments
                  request={request}
                  downloading={downloading}
                  onView={handleViewAttachment}
                />
                
                <Separator />
                
                <RequestComments
                  request={request}
                  user={user}
                  comment={comment}
                  onCommentChange={setComment}
                  submitting={submitting}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                  onViewAttachment={handleViewAttachment}
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <RequestSidebar
              request={request}
              user={user}
              requestId={id}
              submitting={submitting}
              lifecycleLinks={lifecycleLinks}
              selectedTechnician={selectedTechnician}
              onSelectedTechnicianChange={setSelectedTechnician}
              adminUsers={adminUsers}
              onNavigate={navigate}
              onExtendDeadline={() => setShowExtendDeadline(true)}
              onOpenDeliveryModal={handleOpenDeliveryModal}
              onCopyAcceptanceLink={handleCopyAcceptanceLink}
              onApprove={() => handleApproval(true)}
              onApprovalReject={() => handleApproval(false)}
              onAssignToTechnician={handleAssignToTechnician}
            />
          </div>
        </div>

        {user?.role !== 'admin' && ['resolved', 'resolvida'].includes(request.status ?? '') && (
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

        <RejectRequestModal
          open={showRejectModal}
          onOpenChange={setShowRejectModal}
          reason={rejectReason}
          onReasonChange={setRejectReason}
          onFilesChange={setRejectFiles}
          uploading={rejectUploading}
          onConfirm={handleReject}
          onCancel={() => { setShowRejectModal(false); setRejectReason(''); setRejectFiles([]); }}
        />

         <ExtendDeadlineModal
           open={showExtendDeadline}
           onOpenChange={setShowExtendDeadline}
           newDeadline={newDeadline}
           onNewDeadlineChange={setNewDeadline}
           reason={extendReason}
           onReasonChange={setExtendReason}
           submitting={submitting}
           onConfirm={handleExtendDeadline}
           onCancel={() => setShowExtendDeadline(false)}
         />

         <EditDeliveryModal
           open={showEditDeliveryModal}
           onOpenChange={setShowEditDeliveryModal}
           items={deliveryItemsList}
           onItemsChange={setDeliveryItemsList}
           onToggleItem={toggleDeliveryItem}
           onRemoveItem={removeDeliveryItem}
           newItemText={newDeliveryItem}
           onNewItemTextChange={setNewDeliveryItem}
           onAddItem={addDeliveryItem}
           isOffboarding={request.metadata?.form_data?.action === 'offboarding'}
           updating={updatingDelivery}
           onConfirm={handleUpdateDeliveryItems}
           onCancel={() => setShowEditDeliveryModal(false)}
         />
         
         <ResolutionModal
           open={showResolutionModal}
           onOpenChange={setShowResolutionModal}
           text={resolutionText}
           onTextChange={setResolutionText}
           onFilesChange={setResolutionFiles}
           uploading={resolutionUploading}
           onConfirm={handleSubmitResolution}
           onCancel={() => setShowResolutionModal(false)}
         />

        <DeleteRequestDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          requestId={id}
          submitting={submitting}
          onConfirm={confirmDeleteRequest}
        />
      </div>
    </div>
  );
};

export default RequestDetailPage;
