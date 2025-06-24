
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

export type RequestType = 'geral' | 'sistemas' | 'ajuste_estoque' | 'solicitacao_equipamento' | 'manutencao_preventiva' | 'inventory' | 'system' | 'emergency' | 'other';
export type RequestPriority = 'baixa' | 'media' | 'alta' | 'high' | 'medium' | 'low';
export type RequestStatus = 'nova' | 'atribuida' | 'em_andamento' | 'resolvida' | 'fechada' | 'new' | 'assigned' | 'in_progress' | 'resolved' | 'closed';

export interface ITRequest {
  id: string;
  requesterId: string;
  requesterName: string; 
  requesterEmail: string;
  description: string;
  type: RequestType;
  priority: RequestPriority;
  status: RequestStatus;
  createdAt: string;
  deadlineAt: string;
  assignedTo?: string;
  assignedToName?: string;
  attachments?: Attachment[];
  comments?: Comment[];
  resolution?: string;
  resolvedAt?: string;
  // title?: string; // Removido conforme solicitado
  needsApproval?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedByName?: string;
  rating?: number;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string; // ISO date string
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: 'request_created' | 'request_assigned' | 'deadline_changed' | 'request_resolved' | 'request_reminder';
  requestId?: string;
}

// Tipos para o formulário de Ajuste de Estoque
export interface StockAdjustment {
  name: string;
  department: string;
  adjustmentType: string;
  category: string;
  productName: string;
  cost: number;
  lotNumber: string;
  weight: number;
  reason: string;
  requestDate: string;
}

export type AdjustmentType = 'entrada' | 'saida' | 'transferencia' | 'devolucao' | 'outro';
export type ProductCategory = 'materia_prima' | 'embalagem' | 'produto_acabado' | 'insumo' | 'outro';
