import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

/**
 * useRobustQuery
 * Hook customizado que utiliza as capacidades nativas do TanStack Query v5
 * para gerenciar retentativas e cache de forma eficiente no ambiente KingHost.
 */
export function useRobustQuery<TData, TError = Error>(
  options: UseQueryOptions<TData, TError, TData, QueryKey>
) {
  const { toast } = useToast();

  return useQuery({
    ...options,
    // Configurações padrão de robustez
    retry: 2, // Tenta 2 vezes em caso de falha (total 3 tentativas)
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    meta: {
      ...options.meta,
      onError: (error: TError) => {
        if (!import.meta.env.PROD) console.error('Erro na consulta robusta:', error);
        
        toast({
          title: 'Erro de Sincronização',
          description: 'Não foi possível carregar os dados. Tentando novamente...',
          variant: 'destructive',
        });
      },
    },
  });
}
