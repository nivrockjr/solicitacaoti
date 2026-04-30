import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';

/**
 * useRobustQuery
 * Hook customizado que aplica retry com backoff exponencial sobre o useQuery do
 * TanStack Query v5. Não dispara toasts automaticamente — feedback de erro é
 * responsabilidade de cada caller (via `query.isError` em useEffect, por exemplo).
 *
 * Nota: na v4 era possível usar `meta.onError`. A v5 removeu callbacks dessa
 * forma; ver https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5
 */
export function useRobustQuery<TData, TError = Error>(
  options: UseQueryOptions<TData, TError, TData, QueryKey>
) {
  return useQuery({
    ...options,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}
