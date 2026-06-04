import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSemanticIcon } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRequestsData, useRequestsCountersData } from '@/hooks/use-requests-data';
import { useAuth } from '@/contexts/AuthContext';
import RequestCard from '@/components/requests/RequestCard';

const TAB_VALUES = ['active', 'resolved', 'high_priority', 'rejected'] as const;
type TabValue = typeof TAB_VALUES[number];

const MyRequestsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabValue>('active');
  
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setPage(1); // ou chame fetchRequests diretamente se preferir
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);
  
  // Sempre que trocar de aba, volta para página 1 ANTES de buscar
  useEffect(() => {
    setPage(1);
  }, [tab]);

  // Atualiza os contadores via RPC
  const { counts } = useRequestsCountersData(user?.email, true, 30000);
  const tabCounts = {
    active: counts.active,
    resolved: counts.resolved,
    high_priority: counts.high_priority,
    rejected: counts.rejected,
  };

  // Mapeia a aba atual para os filtros corretos do backend
  const currentStatus = (tab === 'active' ? ['new', 'assigned', 'in_progress', 'reopened'] : tab === 'resolved' ? 'resolved' : undefined) as import('@/types').RequestStatus | import('@/types').RequestStatus[] | undefined;
  const currentPriority = tab === 'high_priority' ? ['high'] : undefined;
  const currentApprovalStatus = tab === 'rejected' ? 'rejected' : 'not_rejected';
  const notStatus = tab === 'high_priority' ? 'resolved' : undefined;

  // Busca apenas a página atual do backend
  const { requests: paginatedRequests, loading, totalCount, error: fetchError } = useRequestsData({
    userEmail: user?.email,
    page,
    pageSize,
    status: currentStatus,
    autoRefresh: true,
    refreshInterval: 30000,
    filters: {
      search: searchQuery,
      priority: currentPriority,
      approvalStatus: currentApprovalStatus,
      notStatus,
      fullData: false,
    }
  });

  // Mostra o erro do hook se houver (substitui o estado local)
  useEffect(() => {
    if (fetchError) setError(fetchError);
    else setError(null);
  }, [fetchError]);

  const hasNextPage = page * pageSize < totalCount;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Minhas Solicitações</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            {getSemanticIcon('action-search', { className: 'absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' })}
            <Input
              placeholder="Buscar solicitações..."
              className="pl-8 w-full md:w-[250px] dark-hover-gradient transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant='ghost' asChild>
            <Link to="/request/new">
              {getSemanticIcon('file-add', { className: 'h-4 w-4 mr-2' })}
              Nova Solicitação
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Tabs controlado por estado */}
      <Tabs
        value={tab}
        onValueChange={(value) => {
          if ((TAB_VALUES as readonly string[]).includes(value)) {
            setTab(value as TabValue);
            setPage(1);
          }
        }}
      >
        <TabsList>
          <TabsTrigger value="active">
            {user?.role === 'admin' ? 'Ativas' : 'Pendentes'} ({tabCounts.active})
          </TabsTrigger>
          <TabsTrigger value="high_priority">
            Alta Prioridade ({tabCounts.high_priority})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolvidas ({tabCounts.resolved})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejeitadas ({tabCounts.rejected})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : paginatedRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <h3 className="font-medium text-lg mb-2">Nenhuma solicitação ativa encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? "Nenhuma solicitação corresponde à sua busca" 
                  : "Você não possui solicitações ativas"}
              </p>
              <Button variant='ghost' asChild>
                <Link to="/request/new">
                  {getSemanticIcon('file-add', { className: 'h-4 w-4 mr-2' })}
                  Criar Nova Solicitação
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="resolved" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : paginatedRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <h3 className="font-medium text-lg mb-2">Nenhuma solicitação resolvida encontrada</h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "Nenhuma solicitação resolvida corresponde à sua busca" 
                  : "Você ainda não possui solicitações resolvidas"}
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="high_priority" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : paginatedRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <h3 className="font-medium text-lg mb-2">Nenhuma solicitação de alta prioridade encontrada</h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "Nenhuma solicitação de alta prioridade corresponde à sua busca" 
                  : "Você não possui solicitações de alta prioridade"}
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : paginatedRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <h3 className="font-medium text-lg mb-2">Nenhuma solicitação rejeitada encontrada</h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "Nenhuma solicitação rejeitada corresponde à sua busca" 
                  : "Você ainda não possui solicitações rejeitadas"}
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      {/* Controles de paginação */}
      <div className="flex justify-center gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
        <span className="px-2">Página {page}</span>
        <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!hasNextPage}>Próxima</Button>
      </div>
      {error && <div className="text-destructive text-center my-4">{error}</div>}
    </div>
  );
};

export default MyRequestsPage;
