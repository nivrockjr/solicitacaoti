
import { createRequest } from './requestService';
import { users } from './authService';
import { ITRequest } from '../types';

// Função para verificar se hoje é uma das datas de manutenção preventiva
export const isPreventiveMaintenanceDate = (): boolean => {
  const today = new Date();
  const month = today.getMonth() + 1; // getMonth() retorna 0-11
  const day = today.getDate();
  
  // Verifica se é 01/03 ou 01/09
  return (month === 3 && day === 1) || (month === 9 && day === 1);
};

// Função para criar solicitações de manutenção preventiva para todos os usuários
export const createPreventiveMaintenanceRequests = async (): Promise<void> => {
  console.log('Iniciando criação de solicitações de manutenção preventiva...');
  
  try {
    const allUsers = users.filter(user => user.role === 'requester' || user.role === 'admin');
    
    for (const user of allUsers) {
      const requestData = {
        requesterId: user.id,
        requesterName: user.name,
        requesterEmail: user.email,
        description: `Manutenção preventiva semestral - Verificação geral de equipamentos e sistemas do departamento ${user.department || 'não especificado'}.`,
        type: 'manutencao_preventiva' as const,
        priority: 'media' as const,
        title: 'Manutenção Preventiva Semestral'
      };
      
      try {
        const newRequest = await createRequest(requestData);
        console.log(`Solicitação de manutenção preventiva criada para ${user.name}: ${newRequest.id}`);
      } catch (error) {
        console.error(`Erro ao criar solicitação para ${user.name}:`, error);
      }
    }
    
    console.log('Criação de solicitações de manutenção preventiva concluída.');
  } catch (error) {
    console.error('Erro geral na criação de solicitações de manutenção preventiva:', error);
  }
};

// Função para verificar e executar a criação de solicitações se for a data correta
export const checkAndCreatePreventiveMaintenanceRequests = async (): Promise<void> => {
  if (isPreventiveMaintenanceDate()) {
    console.log('Data de manutenção preventiva detectada. Criando solicitações...');
    await createPreventiveMaintenanceRequests();
  }
};
