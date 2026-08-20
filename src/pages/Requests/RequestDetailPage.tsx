import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { cn, tryFormatDateTime, translate, getStatusStyle, getPriorityStyle, getSemanticIcon, SemanticIconName } from '@/lib/utils';
import { RejectRequestModal } from '@/components/requests/modals/RejectRequestModal';
import { ExtendDeadlineModal } from '@/components/requests/modals/ExtendDeadlineModal';
import { EditDeliveryModal } from '@/components/requests/modals/EditDeliveryModal';
import { ResolutionModal } from '@/components/requests/modals/ResolutionModal';
import { DeleteRequestDialog } from '@/components/requests/modals/DeleteRequestDialog';
import { RequestHeader } from '@/components/requests/sections/RequestHeader';
import { RequestAttachments } from '@/components/requests/sections/RequestAttachments';
import { ResolutionPanel } from '@/components/requests/sections/ResolutionPanel';
import { StatusFlowPanel } from '@/components/requests/sections/StatusFlowPanel';
import { RequestComments } from '@/components/requests/sections/RequestComments';
import { RequestSidebar } from '@/components/requests/sections/RequestSidebar';
import { extractLifecycleLinks } from '@/utils/lifecycle-links';
import { useRequestDetail } from '@/hooks/use-request-detail';

const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
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
  } = useRequestDetail(id);

  const getStatusColor = (status: string | null | undefined) => {
    return getStatusStyle(status).color || 'bg-muted-foreground';
  };

  const getPriorityBadge = (priority: string | null | undefined) => {
    const style = getPriorityStyle(priority);
    const isHigh = priority === 'high';
    const isMedium = priority === 'medium';

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
                    {request.title || (request.description || '').substring(0, 50)}
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

                {request.resolution && (request.status === 'resolved' || request.status === 'closed') && (
                  <ResolutionPanel request={request} onView={handleViewAttachment} />
                )}

                {request.comments && request.comments.some(c => c.text.startsWith('[REABERTURA]')) && request.status === 'reopened' && (
                  (() => {
                    const reopen = request.comments.find(c => c.text.startsWith('[REABERTURA]'));
                    if (!reopen) return null;
                    return (
                      <StatusFlowPanel
                        comment={reopen}
                        title="Reaberta"
                        prefix="[REABERTURA]"
                        accentClass="border-muted-foreground"
                        attachmentsLabel="Anexos da Reabertura:"
                        actorLabel="Reaberta por"
                        onView={handleViewAttachment}
                      />
                    );
                  })()
                )}

                {request.comments && request.comments.some(c => c.text.startsWith('[REJEITADA]')) && request.status === 'rejected' && (
                  (() => {
                    const reject = request.comments.find(c => c.text.startsWith('[REJEITADA]'));
                    if (!reject) return null;
                    return (
                      <StatusFlowPanel
                        comment={reject}
                        title="Rejeitada"
                        prefix="[REJEITADA]"
                        accentClass="border-destructive"
                        attachmentsLabel="Anexos da Rejeição:"
                        actorLabel="Rejeitada por"
                        onView={handleViewAttachment}
                      />
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

        {user?.role !== 'admin' && request.status === 'resolved' && (
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
