// Identificadores especiais de usuários cujas solicitações têm tratamento próprio.
// Centralizar aqui evita UUIDs literais espalhados pela aplicação.

/**
 * UUID do usuário "Sistema Eugênio" — base do filtro/aba dedicado em
 * AllRequestsPage e do contador `sistema_eugenio` em useRequestsCounters.
 */
export const SISTEMA_EUGENIO_USER_ID = '5eb6f9f4-e0f0-4e4a-b7a6-32b2f3d23f45';

/**
 * Verifica se uma solicitação está atribuída ao Sistema Eugênio.
 */
export const isAssignedToSistemaEugenio = (assignedto: string | null | undefined): boolean => {
  return assignedto === SISTEMA_EUGENIO_USER_ID;
};
