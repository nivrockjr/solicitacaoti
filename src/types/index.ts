export type UserRole = 'requester' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  position?: string;
  whatsapp?: string;
}

/**
 * Vocabulário canônico das solicitações.
 *
 * Banco e código em inglês; tradução só na UI via `translate()`.
 * Migração das 18 linhas legadas PT-BR concluída em 30/04/2026 (Item A da Fase 0
 * do DIAGNOSTICO). A função SQL `criar_manutencao_preventiva_em_lote` também foi
 * corrigida para gravar EN-US (Item B). Não há mais dados PT-BR no banco.
 */
export type RequestType =
  | 'general'
  | 'systems'
  | 'ajuste_estoque'
  | 'employee_lifecycle'
  | 'equipment_request'
  | 'preventive_maintenance'
  | 'other';

export type RequestPriority = 'low' | 'medium' | 'high';

export type RequestStatus =
  | 'new'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'reopened'
  | 'cancelled'
  | 'rejected';

export interface DeliveryItem {
  id: string;
  text: string;
  checked: boolean;
  avaria?: string;
}

export interface ITRequestMetadata {
  form_data?: {
    action?: 'onboarding' | 'offboarding' | string;
    relatedOnboardingId?: string;
    collaboratorName?: string;
    department?: string;
    accessItems?: string[];
    [key: string]: unknown;
  };
  delivery_items?: DeliveryItem[];
  [key: string]: unknown;
}

export interface ITRequest {
  id: string;
  requesterid: string | null;
  requestername: string | null;
  requesteremail: string | null;
  title: string | null;
  description: string | null;
  type: RequestType | null;
  priority: RequestPriority | null;
  status: RequestStatus | null;
  createdat: string | null;
  deadlineat: string | null;
  assignedto?: string | null;
  assignedtoname?: string | null;
  attachments?: Attachment[] | null;
  comments?: Comment[] | null;
  resolution?: string | null;
  resolvedat?: string | null;
  needsapproval?: boolean | null;
  approvalstatus?: 'pending' | 'approved' | 'rejected' | null;
  approvedby?: string | null;
  approvedbyname?: string | null;
  rating?: number | null;
  metadata?: ITRequestMetadata | null;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSize?: number;
  fileType: string;
  fileUrl?: string;
  uploadedAt: string;
  isSignature?: boolean;
  signatureData?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
  attachments?: Attachment[];
}

/**
 * Vocabulário fechado de tipos de notificação.
 * EN-US é canônico. Variantes PT-BR são legadas — mantidas até a migração
 * planejada em DIAGNOSTICO.md Fase 1.14.
 */
export type NotificationType =
  // EN-US — canônico (gerados no ciclo de vida do chamado)
  | 'request_created'
  | 'request_assigned'
  | 'request_new'
  | 'request_in_progress'
  | 'request_resolved'
  | 'request_reopened'
  | 'request_closed'
  | 'request_cancelled'
  | 'request_rejected'
  // PT-BR — legados, mantidos para compatibilidade
  | 'comentario'
  | 'rejeicao'
  | 'prazo_estendido';

export interface Notification {
  id: string;
  para: string; // id do usuário destinatário
  mensagem: string;
  lida: boolean;
  criada_em: string;
  tipo: NotificationType;
  request_id?: string;
}

// Tipos para o formulário de Ajuste de Estoque
export interface StockAdjustment {
  name: string;
  department: string;
  adjustmentType: string;
  category: string;
  productName: string;
  cost: string | number;
  lotNumber: string;
  weight: number;
  reason: string;
  requestDate: string;
}

export type AdjustmentType = 'entrada' | 'saida' | 'transferencia' | 'devolucao' | 'outro';
export type ProductCategory = 'materia_prima' | 'embalagem' | 'produto_acabado' | 'insumo' | 'outro';
