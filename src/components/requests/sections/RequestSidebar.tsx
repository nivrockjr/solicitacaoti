import { isAfter, isValid } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSemanticIcon, translate, tryFormatDateTime } from '@/lib/utils';
import { ITRequest, User } from '@/types';
import { LifecycleSection } from './LifecycleSection';

interface LifecycleLinks {
  onboardingId?: string;
  offboardingIds: string[];
}

interface RequestSidebarProps {
  request: ITRequest;
  user: User | null;
  requestId: string | undefined;
  submitting: boolean;
  lifecycleLinks: LifecycleLinks;
  selectedTechnician: string;
  onSelectedTechnicianChange: (id: string) => void;
  adminUsers: User[];
  onNavigate: (path: string) => void;
  onExtendDeadline: () => void;
  onOpenDeliveryModal: () => void;
  onCopyAcceptanceLink: () => void;
  onApprove: () => void;
  onApprovalReject: () => void;
  onAssignToTechnician: () => void;
}

const formatStatus = (status: string | null | undefined) =>
  translate('status', status).toUpperCase();

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
  if (diffDays < 0) return 'text-destructive font-bold';
  if (diffDays < 1) return 'text-warning font-bold';
  if (diffDays < 2) return 'text-warning/80';
  return '';
};

const normalizeStatus = (status: string | null | undefined): string =>
  (status || '').toLowerCase().trim();

export function RequestSidebar({
  request,
  user,
  requestId,
  submitting,
  lifecycleLinks,
  selectedTechnician,
  onSelectedTechnicianChange,
  adminUsers,
  onNavigate,
  onExtendDeadline,
  onOpenDeliveryModal,
  onCopyAcceptanceLink,
  onApprove,
  onApprovalReject,
  onAssignToTechnician,
}: RequestSidebarProps) {
  const status = normalizeStatus(request.status);
  const isFinished = ['resolved', 'closed'].includes(status);
  const isNew = status === 'new';
  const isApprovableType =
    request.type === 'equipment_request' ||
    request.type === 'systems';

  return (
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
          ) : request.status === 'resolved' ? (
            (() => {
              const deadline = request.deadlineat ? new Date(request.deadlineat) : null;
              const resolved = request.resolvedat ? new Date(request.resolvedat) : null;
              if (!deadline || !resolved || !isValid(deadline) || !isValid(resolved)) {
                return (
                  <div className="flex items-center gap-2">
                    {getSemanticIcon('clock', { className: 'h-4 w-4' })}
                    <p className="font-medium">{tryFormatDateTime(request.deadlineat, 'dd/MM/yyyy HH:mm') ?? '—'}</p>
                  </div>
                );
              }
              const isOnTime = resolved <= deadline;
              return (
                <div className="flex items-center gap-2">
                  {getSemanticIcon('clock', { className: `h-4 w-4 ${isOnTime ? 'text-success' : 'text-destructive'}` })}
                  <p className={`font-medium ${isOnTime ? 'text-success' : 'text-destructive'}`}>
                    {isOnTime ? '✅ Resolvida no prazo' : '❌ Resolvida fora do prazo'}
                  </p>
                </div>
              );
            })()
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getSemanticIcon('clock', { className: `h-4 w-4 ${isDeadlinePassed(request.deadlineat) ? 'text-destructive' : ''}` })}
                <p className={`font-medium ${getDeadlineColorClass(request.deadlineat)}`}>
                  {tryFormatDateTime(request.deadlineat, 'dd/MM/yyyy HH:mm') ?? '—'}
                </p>
              </div>
              {user?.role === 'admin' && !['rejected', 'resolved'].includes(request.status ?? '') && (
                <Button onClick={onExtendDeadline} variant="outline" size="sm" disabled={submitting}>
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
            {getSemanticIcon('user', { className: 'h-4 w-4' })}
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
            <Button variant="link" className="h-auto p-0 text-left font-medium" onClick={() => onNavigate(`/request/${lifecycleLinks.onboardingId}`)}>
              #{lifecycleLinks.onboardingId}
            </Button>
          </div>
        )}

        {request.type === 'employee_lifecycle' && lifecycleLinks.offboardingIds.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Offboarding(s) Relacionado(s)</p>
            <div className="flex flex-wrap gap-2">
              {lifecycleLinks.offboardingIds.map((offboardingId) => (
                <Button key={offboardingId} variant="link" className="h-auto p-0 text-left font-medium" onClick={() => onNavigate(`/request/${offboardingId}`)}>
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
                {getSemanticIcon('status-closed', { className: 'h-4 w-4' })}
                <p className="text-sm font-semibold">Ações do Administrador</p>
              </div>

              <LifecycleSection
                request={request}
                requestId={requestId}
                onOpenDeliveryModal={onOpenDeliveryModal}
                onCopyAcceptanceLink={onCopyAcceptanceLink}
              />

              {!isFinished && (
                <div className="space-y-4">
                  {isApprovableType && isNew && (!request.approvalstatus || request.approvalstatus === 'pending') && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Esta solicitação requer aprovação</p>
                      <div className="flex gap-2">
                        <Button onClick={onApprove} className="w-1/2" variant="outline" disabled={submitting}>
                          {getSemanticIcon('action-approve', { className: 'h-4 w-4 mr-2' })} Aprovar
                        </Button>
                        <Button onClick={onApprovalReject} className="w-1/2" variant="outline" disabled={submitting}>
                          {getSemanticIcon('action-reject', { className: 'h-4 w-4 mr-2' })} Rejeitar
                        </Button>
                      </div>
                    </div>
                  )}

                  {(isNew || (isApprovableType && request.approvalstatus === 'approved')) && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Atribuir a um técnico específico</p>
                      <div className="space-y-2">
                        <Select
                          value={selectedTechnician || undefined}
                          onValueChange={onSelectedTechnicianChange}
                          disabled={submitting}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione um técnico" />
                          </SelectTrigger>
                          <SelectContent>
                            {adminUsers.map(admin => (
                              <SelectItem key={admin.id} value={admin.id}>{admin.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={onAssignToTechnician} className="w-full" variant="outline" size="sm" disabled={!selectedTechnician || submitting}>
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
  );
}
