
import { User, ITRequest, Holiday, Notification } from '../types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: "1",
    email: "ti.mz@pqvirk.com.br",
    name: "Administrador TI",
    role: "admin",
    department: "TI",
    position: "Gerente de TI"
  },
  {
    id: "2",
    email: "user@company.com",
    name: "Usuário Regular",
    role: "requester",
    department: "Marketing",
    position: "Especialista de Marketing"
  }
];

// Mock IT Requests
export const mockRequests: ITRequest[] = [
  {
    id: "SOL-001",
    requesterId: "2",
    requesterName: "Usuário Regular",
    requesterEmail: "user@company.com",
    title: "Preciso de um novo monitor",
    description: "Monitor atual tem pixels mortos, preciso de substituição",
    type: "solicitacao_equipamento",
    priority: "media",
    status: "nova",
    createdAt: "2025-04-28T10:30:00Z",
    deadlineAt: "2025-05-10T18:00:00Z",
    comments: [
      {
        id: "c1",
        userId: "2",
        userName: "Usuário Regular",
        text: "Por favor, se possível agilize",
        createdAt: "2025-04-28T10:35:00Z"
      }
    ]
  },
  {
    id: "SOL-002",
    requesterId: "2",
    requesterName: "Usuário Regular",
    requesterEmail: "user@company.com",
    title: "Solicitação de acesso ao sistema",
    description: "Preciso de acesso ao sistema de relatórios",
    type: "sistemas",
    priority: "baixa",
    status: "atribuida",
    createdAt: "2025-04-27T14:15:00Z",
    deadlineAt: "2025-05-11T18:00:00Z",
    assignedTo: "1",
    comments: [
      {
        id: "c2",
        userId: "1",
        userName: "Administrador TI",
        text: "Trabalhando nisso",
        createdAt: "2025-04-28T09:00:00Z"
      }
    ]
  },
  {
    id: "SOL-003",
    requesterId: "2",
    requesterName: "Usuário Regular",
    requesterEmail: "user@company.com",
    title: "Email não está funcionando",
    description: "Não consigo enviar ou receber emails desde esta manhã",
    type: "geral",
    priority: "alta",
    status: "em_andamento",
    createdAt: "2025-04-28T08:00:00Z",
    deadlineAt: "2025-04-29T12:00:00Z",
    assignedTo: "1",
    comments: [
      {
        id: "c3",
        userId: "1",
        userName: "Administrador TI",
        text: "Investigando problemas no servidor de email",
        createdAt: "2025-04-28T08:15:00Z"
      }
    ]
  },
  {
    id: "SOL-004",
    requesterId: "2",
    requesterName: "Usuário Regular",
    requesterEmail: "user@company.com",
    title: "Instalação de software",
    description: "Preciso do Photoshop instalado na minha máquina",
    type: "sistemas",
    priority: "media",
    status: "resolvida",
    createdAt: "2025-04-25T11:20:00Z",
    deadlineAt: "2025-05-09T18:00:00Z",
    assignedTo: "1",
    resolution: "Software instalado e testado",
    resolvedAt: "2025-04-27T15:45:00Z",
    comments: [
      {
        id: "c4",
        userId: "1",
        userName: "Administrador TI",
        text: "Instalação completa",
        createdAt: "2025-04-27T15:45:00Z"
      }
    ]
  }
];

// Mock Holidays
export const mockHolidays: Holiday[] = [
  {
    id: "h1",
    name: "Ano Novo",
    date: "2025-01-01"
  },
  {
    id: "h2",
    name: "Carnaval",
    date: "2025-03-04"
  },
  {
    id: "h3",
    name: "Tiradentes",
    date: "2025-04-21"
  },
  {
    id: "h4",
    name: "Dia do Trabalhador",
    date: "2025-05-01"
  },
  {
    id: "h5",
    name: "Independência",
    date: "2025-09-07"
  },
  {
    id: "h6",
    name: "Natal",
    date: "2025-12-25"
  }
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: "n1",
    userId: "2",
    title: "Solicitação Recebida",
    message: "Sua solicitação SOL-001 foi recebida e está aguardando atribuição",
    isRead: false,
    createdAt: "2025-04-28T10:30:00Z",
    type: "request_created",
    requestId: "SOL-001"
  },
  {
    id: "n2",
    userId: "2",
    title: "Solicitação Atribuída",
    message: "Sua solicitação SOL-002 foi atribuída para Administrador TI",
    isRead: true,
    createdAt: "2025-04-28T09:00:00Z",
    type: "request_assigned",
    requestId: "SOL-002"
  },
  {
    id: "n3",
    userId: "1",
    title: "Nova Solicitação",
    message: "Uma nova solicitação de alta prioridade SOL-003 foi enviada",
    isRead: false,
    createdAt: "2025-04-28T08:00:00Z",
    type: "request_created",
    requestId: "SOL-003"
  },
  {
    id: "n4",
    userId: "2",
    title: "Solicitação Resolvida",
    message: "Sua solicitação SOL-004 foi resolvida",
    isRead: false,
    createdAt: "2025-04-27T15:45:00Z",
    type: "request_resolved",
    requestId: "SOL-004"
  }
];
