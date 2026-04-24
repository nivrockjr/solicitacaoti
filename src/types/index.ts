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

export type RequestType = 'general' | 'systems' | 'ajuste_estoque' | 'employee_lifecycle' | 'equipment_request' | 'preventive_maintenance' | 'other';
export type RequestPriority = 'low' | 'medium' | 'high';
export type RequestStatus = 'new' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'reopened' | 'cancelled';

export interface ITRequestMetadata {
  form_data?: {
    action?: 'onboarding' | 'offboarding' | string;
    relatedOnboardingId?: string;
    collaboratorName?: string;
    department?: string;
    accessItems?: string[];
    [key: string]: unknown;
  };
  delivery_items?: Array<{
    id: string;
    text: string;
    checked: boolean;
    avaria?: string;
  }>;
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

export interface Holiday {
  id: string;
  name: string;
  date: string; // ISO date string
}

export interface Notification {
  id: string;
  para: string; // id do usuário destinatário
  mensagem: string;
  lida: boolean;
  criada_em: string;
  tipo: string;
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
