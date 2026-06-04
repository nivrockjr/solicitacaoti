import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getRequestById, updateRequest, deleteRequest } from '@/services/requestService';
import { notificationService } from '@/services/notificationService';
import { listAdmins, getUserIdByEmail } from '@/services/userService';
import { getAttachmentSignedUrl, uploadFilesToAttachments } from '@/services/storageService';
import { ITRequest, User, Comment, RequestStatus, DeliveryItem } from '@/types';
import { getStatusStyle, tryFormatDateTime } from '@/lib/utils';
import { extractDeliveryItemsFromOnboarding, extractDeliveryItemsFromDescription } from '@/utils/delivery-items';

/**
 * useRequestDetail
 * Concentra todo o estado e as ações da página de detalhe de uma solicitação.
 * Extraído de `RequestDetailPage` no Passo D3 da auditoria — a lógica foi movida
 * sem alteração de comportamento; o componente passou a consumir este hook e só
 * cuidar da apresentação. A página continua resolvendo `id` via `useParams` e o
 * repassa aqui.
 */
export function useRequestDetail(id: string | undefined) {
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Inicializa o checklist de itens de entrega. O parsing puro vive em
  // utils/delivery-items; aqui apenas orquestramos a busca do onboarding de
  // origem (em offboarding) e o fallback para a descrição atual.
  const handleOpenDeliveryModal = async () => {
    if (!request) return;

    let items: DeliveryItem[] = [];

    const action = request.metadata?.form_data?.action;
    const relatedOnboardingId = request.metadata?.form_data?.relatedOnboardingId;

    // Se for OFFBOARDING, tentamos buscar o que foi entregue no onboarding original.
    if (action === 'offboarding' && relatedOnboardingId) {
      try {
        const related = await getRequestById(relatedOnboardingId);
        if (related) {
          items = extractDeliveryItemsFromOnboarding(related);
        }
      } catch (err) {
        if (!import.meta.env.PROD) console.error("Erro ao buscar itens do Onboarding original:", err);
      }
    }

    // Se a lista ainda estiver vazia ou for Onboarding, lê a descrição atual.
    if (items.length === 0) {
      items = extractDeliveryItemsFromDescription(request.description);
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

  const removeDeliveryItem = (itemId: string) => {
    setDeliveryItemsList(deliveryItemsList.filter(item => item.id !== itemId));
  };

  const toggleDeliveryItem = (itemId: string) => {
    setDeliveryItemsList(deliveryItemsList.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
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
      if (newStatus === 'resolved' && !request.resolvedat) {
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

  const handleApproval = async (isApproved: boolean) => {
    if (!request || !id || !user) return;
    try {
      setSubmitting(true);
      const updates: Partial<ITRequest> = {
        approvalstatus: isApproved ? 'approved' : 'rejected',
        approvedby: user.id,
        approvedbyname: user.name
      };
      if (isApproved && request.type !== 'equipment_request' && request.type !== 'systems') {
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
      const newAttachments = await uploadFilesToAttachments(reopenFiles);
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
      const rejectAttachments = await uploadFilesToAttachments(rejectFiles, id, (file, error) => {
        if (!import.meta.env.PROD) console.error('Erro ao fazer upload do arquivo:', error);
        toast({
          title: 'Erro no Upload',
          description: `Falha ao fazer upload do arquivo ${file.name}.`,
          variant: 'destructive',
        });
      });
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
      const newAttachments = await uploadFilesToAttachments(resolutionFiles);
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

  return {
    // estado e contexto
    request,
    loading,
    comment,
    setComment,
    submitting,
    selectedTechnician,
    setSelectedTechnician,
    adminUsers,
    user,
    navigate,
    downloading,
    reopenComment,
    setReopenComment,
    showReopen,
    setShowReopen,
    setReopenFiles,
    reopenUploading,
    showRejectModal,
    setShowRejectModal,
    rejectReason,
    setRejectReason,
    setRejectFiles,
    rejectUploading,
    showExtendDeadline,
    setShowExtendDeadline,
    newDeadline,
    setNewDeadline,
    extendReason,
    setExtendReason,
    showResolutionModal,
    setShowResolutionModal,
    resolutionText,
    setResolutionText,
    setResolutionFiles,
    resolutionUploading,
    showEditDeliveryModal,
    setShowEditDeliveryModal,
    deliveryItemsList,
    setDeliveryItemsList,
    newDeliveryItem,
    setNewDeliveryItem,
    updatingDelivery,
    showDeleteDialog,
    setShowDeleteDialog,
    // ações
    handleOpenDeliveryModal,
    addDeliveryItem,
    removeDeliveryItem,
    toggleDeliveryItem,
    handleAddComment,
    handleDeleteComment,
    handleStatusChange,
    handleApproval,
    handleAssignToTechnician,
    handleCopyAcceptanceLink,
    handleUpdateDeliveryItems,
    handleDeleteRequest,
    confirmDeleteRequest,
    handleViewAttachment,
    handleReopenRequest,
    handleReject,
    handleExtendDeadline,
    handleOpenResolutionModal,
    handleSubmitResolution,
  };
}
