import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSemanticIcon } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ITRequest } from '@/types';
import { getRequests } from '@/services/requestService';
import { useAuth } from '@/contexts/AuthContext';
import RequestCard from '@/components/requests/RequestCard';

const TAB_VALUES = ['active', 'resolved', 'high_priority', 'rejected'] as const;
type TabValue = typeof TAB_VALUES[number];

const MyRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<ITRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
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

  // useEffect para buscar solicitações (remover approvalStatus do fetch)
  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      // Buscar todas as solicitações do usuário (sem paginação)
      const { data: allRequests = [] } = await getRequests(
        user.email,
        1,
        1000,
        undefined,
        logout,
        { fullData: false } // Carregamento leve para performance
      );
      setRequests(allRequests);
      setLoading(false);
    };
    fetchRequests();
  }, [user, logout]);
  
  const filteredRequests = useMemo(() => {
    let filtered = [...requests];
    const statusLower = (s: unknown) => (typeof s === 'string' ? s.toLowerCase() : '');
    const priorityLower = (p: unknown) => (typeof p === 'string' ? p.toLowerCase() : '');

    if (tab === 'active') {
      filtered = filtered.filter(r =>
        ['new', 'assigned', 'in_progress', 'reopened'].includes(statusLower(r.status))
      );
    } else if (tab === 'resolved') {
      filtered = filtered.filter(r => statusLower(r.status) === 'resolved');
    } else if (tab === 'high_priority') {
      filtered = filtered.filter(r => priorityLower(r.priority) === 'high' && statusLower(r.status) !== 'resolved');
    } else if (tab === 'rejected') {
      filtered = filtered.filter(r => r.approvalstatus === 'rejected');
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.description?.toLowerCase().includes(q) ||
        r.id?.toLowerCase().includes(q)
      );
    }

    filtered = filtered.sort((a, b) => new Date(b.createdat ?? 0).getTime() - new Date(a.createdat ?? 0).getTime());
    return filtered;
  }, [requests, tab, searchQuery]);

  const tabCounts = useMemo(() => {
    if (requests.length === 0) {
      return { active: 0, resolved: 0, high_priority: 0, rejected: 0 };
    }

    const active = requests.filter(r =>
      ['new', 'assigned', 'in_progress', 'reopened'].includes(r.status ?? '') &&
      r.approvalstatus !== 'rejected'
    ).length;

    const resolved = requests.filter(r =>
      r.status === 'resolved' &&
      r.approvalstatus !== 'rejected'
    ).length;

    const high_priority = requests.filter(r =>
      r.priority === 'high' &&
      r.status !== 'resolved' &&
      r.approvalstatus !== 'rejected'
    ).length;

    const rejected = requests.filter(r => r.approvalstatus === 'rejected').length;

    return { active, resolved, high_priority, rejected };
  }, [requests]);

  // Paginação frontend
  const paginatedRequests = useMemo(() => {
    const filtered = filteredRequests;
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    return filtered.slice(from, to);
  }, [filteredRequests, page]);

  const totalCount = filteredRequests.length;
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
