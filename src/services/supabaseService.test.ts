import { describe, it, expect, vi } from 'vitest';
import * as supabaseService from './supabaseService';
import { RequestType, RequestPriority } from '@/types';

// Mock do supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: '1' } } }),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'req-1',
          user_id: '1',
          title: 'Teste',
          description: 'Descrição válida',
          type: 'other',
          priority: 'high',
          status: 'new',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
          assigned_to: null,
          attachments: [],
          comments: [],
          resolution_notes: null,
          resolved_at: null,
          closed_at: null,
        },
        error: null
      }),
      eq: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('supabaseService', () => {
  it('deve lançar erro se dados inválidos forem enviados para createRequest', async () => {
    await expect(supabaseService.createRequest({ title: '', description: '' })).rejects.toThrow('Dados inválidos');
  });

  it('deve criar requisição com dados válidos', async () => {
    const validData = {
      title: 'Teste',
      description: 'Descrição válida',
      type: 'other' as RequestType,
      priority: 'high' as RequestPriority,
    };
    // Não deve lançar erro
    await expect(supabaseService.createRequest(validData)).resolves.not.toThrow();
  });
}); 