import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isValid } from "date-fns"
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
  CircleCheck,
  CircleX,
  HelpCircle
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
 */
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
  cancelled: { color: 'bg-slate-400', label: 'CANCELADA', icon: 'status-cancelled' as SemanticIconName },
  cancelada: { color: 'bg-slate-400', label: 'CANCELADA', icon: 'status-cancelled' as SemanticIconName },
};

export const priorityStyles = {
  high: { color: 'bg-status-rejected', label: 'ALTA', icon: 'priority-high' as SemanticIconName },
  alta: { color: 'bg-status-rejected', label: 'ALTA', icon: 'priority-high' as SemanticIconName },
  medium: { color: 'border-foreground text-foreground bg-transparent', label: 'MÉDIA', variant: 'outline' as const, icon: 'priority-medium' as SemanticIconName },
  media: { color: 'border-foreground text-foreground bg-transparent', label: 'MÉDIA', variant: 'outline' as const, icon: 'priority-medium' as SemanticIconName },
  low: { color: 'border-foreground text-foreground bg-transparent', label: 'BAIXA', variant: 'outline' as const, icon: 'priority-low' as SemanticIconName },
  baixa: { color: 'border-foreground text-foreground bg-transparent', label: 'BAIXA', variant: 'outline' as const, icon: 'priority-low' as SemanticIconName },
};

export function getStatusStyle(status: string | null | undefined) {
  const s = (status || 'new').toLowerCase();
  return statusStyles[s as keyof typeof statusStyles] || { color: 'bg-slate-500', label: (status || 'NOVA').toUpperCase(), icon: 'help' as SemanticIconName };
}

export function getPriorityStyle(priority: string | null | undefined) {
  const p = (priority || 'medium').toLowerCase();
  return priorityStyles[p as keyof typeof priorityStyles] || { color: 'bg-slate-500', label: (priority || 'MÉDIA').toUpperCase(), icon: 'help' as SemanticIconName };
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
