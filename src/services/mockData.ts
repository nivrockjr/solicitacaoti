import { User, ITRequest, Holiday, Notification } from "../types";

// Mock users
export const mockUsers: User[] = [
  {
    id: "1",
    email: "admin@company.com", // Atualizado para novo admin
    name: "Administrador",
    role: "admin",
    department: "TI",
    position: "Administrador de Sistema",
    whatsapp: "+55 11 99999-9999"
  },
  {
    id: "2",
    email: "user@company.com", // Updated email to match login screen
    name: "Usuário Padrão",
    role: "requester",
    department: "Vendas",
    position: "Analista de Vendas",
    whatsapp: "+55 11 88888-8888" // Added WhatsApp field
  },
];

// Mock passwords (normally would be stored securely, hashed)
export const mockPasswords: Record<string, string> = {
  "1": "admin123",  // Nova senha admin@company.com
  "2": "user123",   // Regular user password - user@company.com
};

// Mock requests
export const mockRequests: ITRequest[] = [
  {
    id: "01052025-000001",
    requesterId: "2",
    requesterName: "Usuário Padrão",
    requesterEmail: "usuario@empresa.com.br",
    title: "Problema com acesso ao sistema",
    description: "Não consigo acessar o sistema de vendas desde ontem.",
    type: "sistemas",
    priority: "alta",
    status: "nova",
    createdAt: "2025-05-01T10:30:00Z",
    deadlineAt: "2025-05-02T18:00:00Z",
    comments: [
      {
        id: "c1",
        userId: "2",
        userName: "Usuário Padrão",
        text: "Ainda não consigo acessar o sistema. Alguém pode me ajudar?",
        createdAt: "2025-05-01T14:45:00Z",
      },
    ],
  },
  {
    id: "01052025-000002",
    requesterId: "2",
    requesterName: "Usuário Padrão",
    requesterEmail: "usuario@empresa.com.br",
    title: "Solicitação de novo equipamento",
    description: "Preciso de um novo monitor para minha estação de trabalho.",
    type: "solicitacao_equipamento",
    priority: "baixa",
    status: "atribuida",
    createdAt: "2025-05-01T09:15:00Z",
    deadlineAt: "2025-05-11T18:00:00Z",
    assignedTo: "1",
  },
  {
    id: "30042025-000001",
    requesterId: "2",
    requesterName: "Usuário Padrão",
    requesterEmail: "usuario@empresa.com.br",
    description: "Preciso de ajuste no estoque do produto XYZ.",
    type: "ajuste_estoque",
    priority: "media",
    status: "em_andamento",
    createdAt: "2025-04-30T15:20:00Z",
    deadlineAt: "2025-05-02T18:00:00Z",
    assignedTo: "1",
    comments: [
      {
        id: "c2",
        userId: "1",
        userName: "Administrador",
        text: "Estamos verificando a situação.",
        createdAt: "2025-04-30T16:30:00Z",
      },
    ],
  },
  {
    id: "29042025-000001",
    requesterId: "2",
    requesterName: "Usuário Padrão",
    requesterEmail: "usuario@empresa.com.br",
    description: "Meu computador está muito lento.",
    type: "geral",
    priority: "baixa",
    status: "resolvida",
    createdAt: "2025-04-29T11:30:00Z",
    deadlineAt: "2025-04-30T18:00:00Z",
    assignedTo: "1",
    resolvedAt: "2025-04-30T09:45:00Z",
    resolution: "Realizada limpeza de arquivos temporários e atualização do sistema.",
  },
];

// Mock holidays
export const mockHolidays: Holiday[] = [
  {
    id: "h1",
    name: "Dia do Trabalho",
    date: "2025-05-01",
  },
  {
    id: "h2",
    name: "Proclamação da República",
    date: "2025-11-15",
  },
  {
    id: "h3",
    name: "Natal",
    date: "2025-12-25",
  },
];

// Mock notifications
export const mockNotifications: Notification[] = [
  {
    id: "n1",
    userId: "2",
    title: "Solicitação Atribuída",
    message: "Sua solicitação 01052025-000002 foi atribuída a um técnico",
    isRead: false,
    createdAt: "2025-05-01T09:45:00Z",
    type: "request_assigned",
    requestId: "01052025-000002",
  },
  {
    id: "n2",
    userId: "1",
    title: "Nova Solicitação",
    message: "Uma nova solicitação de prioridade alta 01052025-000001 foi enviada",
    isRead: true,
    createdAt: "2025-05-01T10:30:00Z",
    type: "request_created",
    requestId: "01052025-000001",
  },
];
