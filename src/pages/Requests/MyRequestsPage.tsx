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
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [error, setError] = useState<string | null>(null);
  const [filterCounts, setFilterCounts] = useState({ ativas: 0, resolvidas: 0 });
  
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setPage(1); // ou chame fetchRequests diretamente se preferir
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);
  
  useEffect(() => {
    let timerStarted = false;
    const fetchRequests = async () => {
      if (!user) return;
      try {
        if (!timerStarted) {
          console.time('Carregar minhas solicitações');
          timerStarted = true;
        }
        setLoading(true);
        setError(null);
        const { data: fetchedRequests } = await getRequests(user.id, page, pageSize);
        console.log('Solicitações recebidas do backend:', fetchedRequests);
        // Ordenar por data de criação decrescente
        const sortedRequests = [...fetchedRequests].sort((a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime());
        setRequests(sortedRequests);
      } catch (error) {
        setError('Erro ao carregar suas solicitações. Veja o console para detalhes.');
        setRequests([]);
        console.error('Erro ao buscar solicitações do usuário:', error);
      } finally {
        setLoading(false);
        if (timerStarted) console.timeEnd('Carregar minhas solicitações');
      }
    };
    fetchRequests();
  }, [user, page]);
  
  useEffect(() => {
    const fetchCounts = async () => {
      if (!user) return;
      // Busca apenas id e status para contar
      const { data, error } = await supabase
        .from('solicitacoes')
        .select('id, status')
        .eq('requesterid', user.id);
      if (error) return;
      const ativas = data.filter(r => !['resolved', 'closed', 'resolvida', 'fechada'].includes((r.status || '').toLowerCase())).length;
      const resolvidas = data.filter(r => ['resolved', 'closed', 'resolvida', 'fechada'].includes((r.status || '').toLowerCase())).length;
      setFilterCounts({ ativas, resolvidas });
    };
    fetchCounts();
  }, [user]);
  
  const activeRequests = requests.filter(
    r => !['resolved', 'closed', 'resolvida', 'fechada'].includes((r.status || '').toLowerCase())
  );
  
  const resolvedRequests = requests.filter(
    r => ['resolved', 'closed', 'resolvida', 'fechada'].includes((r.status || '').toLowerCase())
  );
  
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

  const filteredActive = useMemo(() => sortByDateDesc(filterRequests(activeRequests)), [activeRequests, searchQuery]);
  const filteredResolved = useMemo(() => sortByDateDesc(filterRequests(resolvedRequests)), [resolvedRequests, searchQuery]);
  
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
      
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Ativas ({filterCounts.ativas})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolvidas ({filterCounts.resolvidas})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : filteredActive.length === 0 ? (
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
              {filteredActive.map((request) => (
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
          ) : filteredResolved.length === 0 ? (
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
              {filteredResolved.map((request) => (
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
