// Teste para verificar a atribuição automática de solicitações de estoque
// Este arquivo serve como documentação e exemplo de como testar a funcionalidade

import { createRequest, getNivaldoAdmin } from '../requestService';

// Mock do Supabase para testes
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => ({
          data: { id: 'nivaldo-id', name: 'Nivaldo' },
          error: null
        }))
      }))
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => ({
          data: { id: 'request-id' },
          error: null
        }))
      }))
    }))
  }))
};

// Exemplo de teste da função getNivaldoAdmin
describe('getNivaldoAdmin', () => {
  it('deve retornar os dados do admin Nivaldo quando encontrado', async () => {
    // Este é um exemplo de como testar a função
    // Em um ambiente real, você usaria um mock do Supabase
    const result = await getNivaldoAdmin();
    // expect(result).toEqual({ id: 'nivaldo-id', name: 'Nivaldo' });
  });
});

// Exemplo de teste da função createRequest para solicitações de estoque
describe('createRequest - Atribuição Automática de Estoque', () => {
  it('deve atribuir automaticamente solicitações de estoque ao admin Nivaldo', async () => {
    const requestData = {
      requesterid: 'user-id',
      requestername: 'Usuário Teste',
      requesteremail: 'teste@exemplo.com',
      title: 'Ajuste de Estoque Teste',
      description: 'Descrição do ajuste de estoque',
      type: 'ajuste_estoque' as const,
      priority: 'alta' as const,
      status: 'nova' as const,
    };

    // Em um teste real, você mockaria o Supabase e verificaria se:
    // 1. A função getNivaldoAdmin foi chamada
    // 2. Os campos assignedto e assignedtoname foram preenchidos
    // 3. O status foi alterado para 'atribuida'
    // 4. A notificação foi enviada para o Nivaldo
  });
});

// Instruções para testar manualmente:
/*
1. Certifique-se de que existe um usuário admin com nome "Nivaldo" no banco de dados
2. Crie uma solicitação de ajuste de estoque através do formulário
3. Verifique no banco de dados se os campos assignedto e assignedtoname foram preenchidos
4. Verifique se o status da solicitação é "atribuida"
5. Verifique se o Nivaldo recebeu uma notificação
*/ 