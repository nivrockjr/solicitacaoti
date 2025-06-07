
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

export type RequestType = 'geral' | 'sistemas' | 'ajuste_estoque' | 'solicitacao_equipamento' | 'manutencao_preventiva' | 'inventory' | 'system' | 'emergency' | 'other' | 'hardware' | 'software' | 'network' | 'access' | 'maintenance';
export type RequestPriority = 'baixa' | 'media' | 'alta' | 'high' | 'medium' | 'low' | 'urgent';
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
  attachments?: Attachment[];
  comments?: Comment[];
  resolution?: string;
  resolvedAt?: string;
  title?: string; // Mantido como opcional para compatibilidade com dados existentes
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
  type: 'request_created' | 'request_assigned' | 'deadline_changed' | 'request_resolved';
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

// Tipos para Chat/AI Assistant
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Mapeamentos de tipos para exibição
export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  'geral': 'Geral',
  'sistemas': 'Sistemas',
  'ajuste_estoque': 'Ajuste de Estoque',
  'solicitacao_equipamento': 'Solicitação de Equipamento',
  'manutencao_preventiva': 'Manutenção Preventiva',
  'inventory': 'Inventário',
  'system': 'Sistema',
  'emergency': 'Emergência',
  'other': 'Outro',
  'hardware': 'Hardware',
  'software': 'Software',
  'network': 'Rede',
  'access': 'Acesso',
  'maintenance': 'Manutenção',
};

export const REQUEST_PRIORITY_LABELS: Record<RequestPriority, string> = {
  'baixa': 'Baixa',
  'media': 'Média',
  'alta': 'Alta',
  'high': 'Alta',
  'medium': 'Média',
  'low': 'Baixa',
  'urgent': 'Urgente',
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  'nova': 'Nova',
  'atribuida': 'Atribuída',
  'em_andamento': 'Em Andamento',
  'resolvida': 'Resolvida',
  'fechada': 'Fechada',
  'new': 'Nova',
  'assigned': 'Atribuída',
  'in_progress': 'Em Andamento',
  'resolved': 'Resolvida',
  'closed': 'Fechada',
};
