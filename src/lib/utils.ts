import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isValid } from "date-fns"
import { NotificationType, RequestStatus } from "@/types"
import {
  AlertCircle,
  Info,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  ShieldCheck,
  FileText,
  History,
  CircleX,
  HelpCircle,
  // Ações genéricas
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Plus,
  X,
  Edit,
  Trash2,
  Save,
  Send,
  Search,
  Filter,
  SlidersHorizontal,
  Upload,
  RefreshCw,
  Eraser,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  // Navegação / Layout
  Menu,
  LogOut,
  Settings,
  BarChart3,
  // Conteúdo / Documentos
  FilePlus,
  FilePlus2,
  FileSpreadsheet,
  PaperclipIcon,
  Link as LinkIcon,
  BookOpen,
  // Comunicação
  Bell,
  // Usuário
  UserPlus,
  UserCheck,
  UserMinus,
  Users,
  // Tempo
  Calendar,
  Hourglass,
  // Outros
  GraduationCap,
  Package,
  Key,
  // Tema
  Sun,
  Moon
} from 'lucide-react';
import React from 'react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Evita RangeError do date-fns quando o banco retorna null, string vazia ou data inválida. */
export function tryFormatDateTime(
  value: string | Date | null | undefined,
  pattern: string
): string | null {
  if (value == null || value === "") return null
  const d = value instanceof Date ? value : new Date(value)
  if (!isValid(d)) return null
  return format(d, pattern)
}

/** 
 * Dicionário centralizado de traduções (EN -> PT-BR) para a UI.
 * Mantém o código técnico em Inglês e a interface em Português.
 */
export const translations = {
  status: {
    'new': 'Nova',
    'nova': 'Nova',
    'assigned': 'Atribuída',
    'atribuida': 'Atribuída',
    'in_progress': 'Em Andamento',
    'em_andamento': 'Em Andamento',
    'resolved': 'Resolvida',
    'resolvida': 'Resolvida',
    'closed': 'Fechada',
    'fechada': 'Fechada',
    'reopened': 'Reaberta',
    'reaberta': 'Reaberta',
    'cancelled': 'Cancelada',
    'cancelada': 'Cancelada',
    'rejected': 'Rejeitada',
    'rejeitada': 'Rejeitada'
  },
  priority: {
    'low': 'Baixa',
    'baixa': 'Baixa',
    'medium': 'Média',
    'media': 'Média',
    'high': 'Alta',
    'alta': 'Alta'
  },
  type: {
    'general': 'Geral',
    'geral': 'Geral',
    'systems': 'Sistemas',
    'sistemas': 'Sistemas',
    'ajuste_estoque': 'Ajuste de Estoque',
    'employee_lifecycle': 'Ciclo de Vida',
    'ciclo_colaborador': 'Ciclo de Vida',
    'equipment_request': 'Solicitação de Equipamento',
    'solicitacao_equipamento': 'Solicitação de Equipamento',
    'preventive_maintenance': 'Manutenção Preventiva',
    'manutencao_preventiva': 'Manutenção Preventiva',
    'other': 'Outro',
    'emergencia': 'Emergência',
    'emergency': 'Emergência'
  },
  role: {
    'admin': 'Administrador',
    'requester': 'Solicitante'
  },
  department: {
    'ti': 'TI',
    'rh': 'Recursos Humanos',
    'financeiro': 'Financeiro',
    'comercial': 'Comercial',
    'operacional': 'Operacional',
    'logistica': 'Logística',
    'diretoria': 'Diretoria',
    'producao': 'Produção',
    'qualidade': 'Qualidade',
    'manutencao': 'Manutenção',
    'vendas': 'Vendas',
    'marketing': 'Marketing',
    'compras': 'Compras',
    'estoque': 'Estoque'
  },
  notificationType: {
    // EN-US — padrão canônico
    'request_created': 'Nova solicitação',
    'request_assigned': 'Solicitação atribuída',
    'request_in_progress': 'Solicitação em andamento',
    'request_resolved': 'Solicitação resolvida',
    'request_reopened': 'Solicitação reaberta',
    'request_closed': 'Solicitação fechada',
    'request_new': 'Nova solicitação',
    'request_cancelled': 'Solicitação cancelada',
    'request_rejected': 'Solicitação rejeitada',
    // PT-BR — chaves legadas mantidas para compatibilidade com dados existentes.
    // Migração planejada em DIAGNOSTICO.md Fase 1.14.
    'comentario': 'Comentário',
    'rejeicao': 'Rejeição',
    'prazo_estendido': 'Prazo estendido'
  }
};

export function translate(category: keyof typeof translations, value: string | null | undefined): string {
  if (!value) return '—';
  const val = value.toLowerCase();
  const categoryMap = translations[category] as Record<string, string>;
  return categoryMap[val] || value;
}

/**
 * Mapeamento semântico de ícones para garantir consistência visual.
 * Diretiva 6 #5 do CLAUDE.md: importação direta de `lucide-react` é proibida
 * em componentes — usar `getSemanticIcon(name, props)` referenciando este mapa.
 */
export const iconMapping = {
  // Status
  'status-new': AlertCircle,
  'status-assigned': User,
  'status-progress': Clock,
  'status-resolved': CheckCircle2,
  'status-closed': ShieldCheck,
  'status-reopened': History,
  'status-rejected': CircleX,
  'status-cancelled': CircleX,

  // Prioridade
  'priority-high': AlertTriangle,
  'priority-medium': AlertCircle,
  'priority-low': Info,

  // Geral/Sistema
  'info': Info,
  'warning': AlertTriangle,
  'error': AlertCircle,
  'success': CheckCircle2,
  'help': HelpCircle,
  'file': FileText,

  // Ações genéricas
  'action-back': ArrowLeft,
  'action-forward': ArrowRight,
  'action-up': ArrowUp,
  'action-add': Plus,
  'action-close': X,
  'action-edit': Edit,
  'action-delete': Trash2,
  'action-save': Save,
  'action-send': Send,
  'action-search': Search,
  'action-filter': Filter,
  'action-tune': SlidersHorizontal,
  'action-upload': Upload,
  'action-refresh': RefreshCw,
  'action-erase': Eraser,
  'action-approve': ThumbsUp,
  'action-reject': ThumbsDown,
  'spinner': Loader2,

  // Navegação / Layout
  'menu': Menu,
  'logout': LogOut,
  'settings': Settings,
  'dashboard': BarChart3,

  // Conteúdo / Documentos
  'file-add': FilePlus,
  'file-add-alt': FilePlus2,
  'file-spreadsheet': FileSpreadsheet,
  'attachment': PaperclipIcon,
  'link': LinkIcon,
  'book': BookOpen,

  // Comunicação
  'notification': Bell,

  // Usuário (genéricos — fora dos status)
  'user': User,
  'user-add': UserPlus,
  'user-check': UserCheck,
  'user-minus': UserMinus,
  'users': Users,

  // Tempo
  'calendar': Calendar,
  'clock': Clock,
  'pending': Hourglass,

  // Domínio (lifecycle, estoque)
  'graduation': GraduationCap,
  'package': Package,
  'key': Key,

  // Tema
  'theme-light': Sun,
  'theme-dark': Moon,
};

export type SemanticIconName = keyof typeof iconMapping;

/**
 * Retorna o componente de ícone baseado no nome semântico.
 */
export function getSemanticIcon(name: SemanticIconName, props?: React.ComponentProps<typeof AlertCircle>) {
  const IconComponent = iconMapping[name] || HelpCircle;
  return React.createElement(IconComponent, props);
}

/**
 * Helpers centralizados para estilização de Status e Prioridade.
 * Utiliza as cores semânticas definidas no tailwind.config.ts.
 *
 * `variant` espelha as variantes do componente Badge (`@/components/ui/badge`).
 * Mantemos a união declarada localmente para evitar dependência cíclica com badge.tsx.
 */
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'blueLight' | 'blueDark';

export interface VisualStyle {
  color: string;
  label: string;
  icon: SemanticIconName;
  variant?: BadgeVariant;
}

export const statusStyles = {
  new: { color: 'bg-status-new', label: 'NOVA', icon: 'status-new' as SemanticIconName },
  nova: { color: 'bg-status-new', label: 'NOVA', icon: 'status-new' as SemanticIconName },
  assigned: { color: 'bg-status-assigned', label: 'ATRIBUÍDA', icon: 'status-assigned' as SemanticIconName },
  atribuida: { color: 'bg-status-assigned', label: 'ATRIBUÍDA', icon: 'status-assigned' as SemanticIconName },
  in_progress: { color: 'bg-status-progress', label: 'EM ANDAMENTO', icon: 'status-progress' as SemanticIconName },
  em_andamento: { color: 'bg-status-progress', label: 'EM ANDAMENTO', icon: 'status-progress' as SemanticIconName },
  resolved: { color: 'bg-status-resolved', label: 'RESOLVIDA', icon: 'status-resolved' as SemanticIconName },
  resolvida: { color: 'bg-status-resolved', label: 'RESOLVIDA', icon: 'status-resolved' as SemanticIconName },
  closed: { color: 'bg-status-closed text-white', label: 'FECHADA', icon: 'status-closed' as SemanticIconName },
  fechada: { color: 'bg-status-closed text-white', label: 'FECHADA', icon: 'status-closed' as SemanticIconName },
  reopened: { color: 'bg-status-reopened', label: 'REABERTA', icon: 'status-reopened' as SemanticIconName },
  reaberta: { color: 'bg-status-reopened', label: 'REABERTA', icon: 'status-reopened' as SemanticIconName },
  rejected: { color: 'bg-status-rejected text-white', label: 'REJEITADA', icon: 'status-rejected' as SemanticIconName },
  rejeitada: { color: 'bg-status-rejected text-white', label: 'REJEITADA', icon: 'status-rejected' as SemanticIconName },
  cancelled: { color: 'bg-muted', label: 'CANCELADA', icon: 'status-cancelled' as SemanticIconName },
  cancelada: { color: 'bg-muted', label: 'CANCELADA', icon: 'status-cancelled' as SemanticIconName },
} satisfies Record<string, VisualStyle>;

export const priorityStyles = {
  high: { color: 'bg-status-rejected', label: 'ALTA', icon: 'priority-high' as SemanticIconName },
  alta: { color: 'bg-status-rejected', label: 'ALTA', icon: 'priority-high' as SemanticIconName },
  medium: { color: 'border-foreground text-foreground bg-transparent', label: 'MÉDIA', variant: 'outline' as const, icon: 'priority-medium' as SemanticIconName },
  media: { color: 'border-foreground text-foreground bg-transparent', label: 'MÉDIA', variant: 'outline' as const, icon: 'priority-medium' as SemanticIconName },
  low: { color: 'border-foreground text-foreground bg-transparent', label: 'BAIXA', variant: 'outline' as const, icon: 'priority-low' as SemanticIconName },
  baixa: { color: 'border-foreground text-foreground bg-transparent', label: 'BAIXA', variant: 'outline' as const, icon: 'priority-low' as SemanticIconName },
} satisfies Record<string, VisualStyle>;

export function getStatusStyle(status: string | null | undefined): VisualStyle {
  const s = (status || 'new').toLowerCase();
  return (statusStyles as Record<string, VisualStyle>)[s] || { color: 'bg-muted-foreground', label: (status || 'NOVA').toUpperCase(), icon: 'help' as SemanticIconName };
}

export function getPriorityStyle(priority: string | null | undefined): VisualStyle {
  const p = (priority || 'medium').toLowerCase();
  return (priorityStyles as Record<string, VisualStyle>)[p] || { color: 'bg-muted-foreground', label: (priority || 'MÉDIA').toUpperCase(), icon: 'help' as SemanticIconName };
}

/**
 * Helpers para verificação de estado da solicitação.
 */
export function isResolved(status: string | null | undefined): boolean {
  const s = (status || '').toLowerCase().trim();
  return ['resolved', 'resolvida', 'closed', 'fechada'].includes(s);
}

export function isPending(status: string | null | undefined): boolean {
  return !isResolved(status);
}

/**
 * Mapeia uma transição de status do chamado para o NotificationType correspondente.
 * Mantém o vocabulário fechado e impede strings dinâmicas (`request_${status}`)
 * com tipos que não existem na união NotificationType.
 */
export function buildRequestNotificationType(status: RequestStatus): NotificationType {
  switch (status) {
    case 'new':
    case 'nova':
      return 'request_new';
    case 'assigned':
    case 'atribuida':
      return 'request_assigned';
    case 'in_progress':
    case 'em_andamento':
      return 'request_in_progress';
    case 'resolved':
    case 'resolvida':
      return 'request_resolved';
    case 'reopened':
    case 'reaberta':
      return 'request_reopened';
    case 'closed':
    case 'fechada':
      return 'request_closed';
    case 'cancelled':
    case 'cancelada':
      return 'request_cancelled';
    case 'rejected':
    case 'rejeitada':
      return 'request_rejected';
  }
}
