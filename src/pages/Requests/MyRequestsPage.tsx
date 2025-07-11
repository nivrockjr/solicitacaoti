import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ITRequest } from '@/types';
import { getRequests } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import RequestCard from '@/components/requests/RequestCard';
import { supabase } from '@/lib/supabase';

const MyRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<ITRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [tab, setTab] = useState<'active' | 'resolved' | 'high_priority' | 'rejected'>('active');
  const [tabCounts, setTabCounts] = useState({
    active: 0,
    resolved: 0,
    high_priority: 0,
    rejected: 0
  });
  
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
      let statusFilter: string | string[] | undefined = undefined;
      let priorityFilter: string[] | undefined = undefined;
      let notStatus: string | undefined = undefined;
      if (tab === 'active') {
        statusFilter = ['nova', 'new', 'atribuida', 'assigned', 'em_andamento', 'in_progress'];
      } else if (tab === 'resolved') {
        statusFilter = ['resolved'];
      } else if (tab === 'high_priority') {
        priorityFilter = ['alta', 'high'];
        notStatus = 'resolved';
      }
      const { data: fetchedRequests, count } = await getRequests(
        user.email,
        page,
        pageSize,
        statusFilter,
        logout,
        { search: searchQuery, priority: priorityFilter, notStatus }
      );
      setRequests(fetchedRequests);
      setTotalCount(count || 0);
      setLoading(false);
    };
    fetchRequests();
  }, [user, tab, page, searchQuery]);

  // useEffect para contadores (remover approvalStatus do fetch, contar rejeitadas no frontend)
  useEffect(() => {
    const fetchTabCounts = async () => {
      const { data: allRequests = [] } = await getRequests(user?.email, 1, 1000, undefined, logout);
      const active = allRequests.filter(r => ['nova', 'new', 'atribuida', 'assigned', 'em_andamento', 'in_progress'].includes(r.status)).length;
      const resolved = allRequests.filter(r => r.status === 'resolved').length;
      const high_priority = allRequests.filter(r => (['alta', 'high'].includes(r.priority)) && r.status !== 'resolved').length;
      const rejected = allRequests.filter(r => r.approvalstatus === 'rejected').length;
      setTabCounts({ active, resolved, high_priority, rejected });
    };
    if (user) fetchTabCounts();
  }, [user, logout]);
  
  // Remover filtros de status redundantes no frontend
  // Apenas aplicar busca e ordenação sobre o array 'requests' retornado do backend
  const filterRequests = (requests: ITRequest[]) => {
    if (!searchQuery) return requests;
    return requests.filter(
      r => 
        r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Ordena por data de criação decrescente
  const sortByDateDesc = (requests: ITRequest[]) =>
    [...requests].sort((a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime());

  // Filtrar no frontend para a aba 'Rejeitadas'
  const filteredRequests = useMemo(() => {
    let filtered = filterRequests(requests);
    if (tab === 'rejected') {
      filtered = filtered.filter(r => r.approvalstatus === 'rejected');
    }
    return sortByDateDesc(filtered);
  }, [requests, searchQuery, tab]);
  
  console.log('Renderizou MyRequestsPage');
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Minhas Solicitações</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar solicitações..."
              className="pl-8 w-full md:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button asChild>
            <Link to="/request/new">
              <FilePlus className="h-4 w-4 mr-2" />
              Nova Solicitação
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Tabs controlado por estado */}
      <Tabs value={tab} onValueChange={(value) => setTab(value as 'active' | 'resolved' | 'high_priority' | 'rejected')}>
        <TabsList>
          <TabsTrigger value="active">
            Ativas ({tabCounts.active})
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
          ) : filteredRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <h3 className="font-medium text-lg mb-2">Nenhuma solicitação ativa encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? "Nenhuma solicitação corresponde à sua busca" 
                  : "Você não possui solicitações ativas"}
              </p>
              <Button asChild>
                <Link to="/request/new">
                  <FilePlus className="h-4 w-4 mr-2" />
                  Criar Nova Solicitação
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredRequests.map((request) => (
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
          ) : filteredRequests.length === 0 ? (
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
              {filteredRequests.map((request) => (
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
          ) : filteredRequests.length === 0 ? (
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
              {filteredRequests.map((request) => (
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
          ) : filteredRequests.length === 0 ? (
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
              {filteredRequests.map((request) => (
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
        <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={requests.length < pageSize}>Próxima</Button>
      </div>
      {error && <div className="text-red-500 text-center my-4">{error}</div>}
    </div>
  );
};

export default MyRequestsPage;
