// Configuração para atribuições automáticas de administradores
// Este arquivo centraliza as regras de atribuição automática

export interface AdminAssignment {
  adminName: string;
  requestTypes: string[];
  description: string;
}

// Configuração das atribuições automáticas
export const ADMIN_ASSIGNMENTS: AdminAssignment[] = [
  {
    adminName: 'Nivaldo',
    requestTypes: ['ajuste_estoque'],
    description: 'Responsável por todas as solicitações de ajuste de estoque'
  }
  // Adicione outras atribuições automáticas aqui conforme necessário
  // Exemplo:
  // {
  //   adminName: 'João',
  //   requestTypes: ['sistemas', 'manutencao_preventiva'],
  //   description: 'Responsável por solicitações de sistemas e manutenção preventiva'
  // }
];

// Função para obter o admin responsável por um tipo de solicitação
export const getAdminForRequestType = (requestType: string): AdminAssignment | null => {
  return ADMIN_ASSIGNMENTS.find(assignment => 
    assignment.requestTypes.includes(requestType)
  ) || null;
};

// Função para obter todos os tipos de solicitação que têm atribuição automática
export const getRequestTypesWithAutoAssignment = (): string[] => {
  return ADMIN_ASSIGNMENTS.flatMap(assignment => assignment.requestTypes);
};

// Função para validar se um admin existe no sistema
export const validateAdminExists = async (adminName: string): Promise<boolean> => {
  try {
    const { adminExistsByName } = await import('@/services/userService');
    return await adminExistsByName(adminName);
  } catch (error) {
    if (!import.meta.env.PROD) console.error(`[VALIDATE ADMIN] Erro ao validar admin ${adminName}:`, error);
    return false;
  }
};
