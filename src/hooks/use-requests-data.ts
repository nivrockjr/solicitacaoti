import { useState, useMemo, useCallback } from 'react';
import { useRobustQuery } from './use-robust-query';
import { getRequests } from '@/services/requestService';
import { RequestStatus, ITRequest } from '@/types';
import { isAssignedToSistemaEugenio } from '@/config/specialUsers';

interface UseRequestsDataOptions {
  userEmail?: string;
  page?: number;
  pageSize?: number;
  status?: RequestStatus | RequestStatus[];
  autoRefresh?: boolean;
  refreshInterval?: number;
  filters?: {
    priority?: string[];
    type?: string[];
    search?: string;
    notStatus?: string;
    fullData?: boolean;
  };
}

/**
 * useRequestsData
 * Hook centralizado para busca de solicitações com suporte a paginação, filtros e refresh automático.
 */
export function useRequestsData(options: UseRequestsDataOptions = {}) {
  const {
    userEmail,
    page = 1,
    pageSize = 10,
    status,
    autoRefresh = false,
    refreshInterval = 30000,
    filters = {}
  } = options;

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const query = useRobustQuery({
    queryKey: ['requests', userEmail, page, pageSize, status, filters],
    queryFn: async () => {
      const result = await getRequests(userEmail, page, pageSize, status, undefined, filters);
      setLastUpdated(new Date());
      return result;
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const refresh = useCallback(() => {
    query.refetch();
  }, [query]);

  const clearError = useCallback(() => {
    // Implementação futura se necessário
  }, []);

  return {
    requests: query.data?.data || [],
    totalCount: query.data?.count || 0,
    loading: query.isLoading || query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    lastUpdated,
    refresh,
    clearError,
  };
}

/**
 * useRequestsCounters
 * Hook para calcular contadores de solicitações baseados em uma lista.
 */
export function useRequestsCounters(requests: ITRequest[]) {
  return useMemo(() => {
    const counts = {
      novas: 0,
      high_priority: 0,
      sistema_eugenio: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0,
      all: requests.length
    };

    requests.forEach(r => {
      const s = (r.status || '').toLowerCase();
      const p = (r.priority || '').toLowerCase();
      const isRejected = r.approvalstatus === 'rejected';

      if (isRejected) {
        counts.rejected++;
      } else {
        if (['new', 'nova'].includes(s)) counts.novas++;
        if (['high', 'alta'].includes(p) && !['resolved', 'resolvida'].includes(s)) counts.high_priority++;
        if (isAssignedToSistemaEugenio(r.assignedto) && !['resolved', 'resolvida'].includes(s)) counts.sistema_eugenio++;
        if (['in_progress', 'em_andamento', 'assigned', 'atribuida', 'reopened', 'reaberta'].includes(s)) counts.in_progress++;
        if (['resolved', 'resolvida'].includes(s)) counts.resolved++;
      }
    });

    return counts;
  }, [requests]);
}
