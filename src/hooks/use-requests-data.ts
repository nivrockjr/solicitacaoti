import { useState, useMemo, useCallback } from 'react';
import { useRobustQuery } from './use-robust-query';
import { getRequests, getRequestsCounters } from '@/services/requestService';
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
    approvalStatus?: string;
    assignedTo?: string;
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
 * useRequestsCountersData
 * Hook para buscar contadores pré-calculados pelo backend via RPC.
 */
export function useRequestsCountersData(userEmail?: string, autoRefresh = false, refreshInterval = 30000) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const query = useRobustQuery({
    queryKey: ['requestsCounters', userEmail],
    queryFn: async () => {
      const result = await getRequestsCounters(userEmail);
      setLastUpdated(new Date());
      return result;
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const refresh = useCallback(() => {
    query.refetch();
  }, [query]);

  const defaultCounts = {
    novas: 0,
    in_progress: 0,
    high_priority: 0,
    sistema_eugenio: 0,
    resolved: 0,
    rejected: 0,
    active: 0,
    all: 0,
  };

  return {
    counts: query.data || defaultCounts,
    loading: query.isLoading || query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    lastUpdated,
    refresh,
  };
}

/**
 * @deprecated Use useRequestsCountersData para buscar contagens do backend em vez de contar no frontend.
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
        if (s === 'new') counts.novas++;
        if (p === 'high' && s !== 'resolved') counts.high_priority++;
        if (isAssignedToSistemaEugenio(r.assignedto) && s !== 'resolved') counts.sistema_eugenio++;
        if (['in_progress', 'assigned', 'reopened'].includes(s)) counts.in_progress++;
        if (s === 'resolved') counts.resolved++;
      }
    });

    return counts;
  }, [requests]);
}
