import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUp, CheckCircle2, Clock, FilePlus, Hourglass } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRequestsData } from '@/hooks/use-requests-data';
import RequestCard from '@/components/requests/RequestCard';
import { Fragment } from 'react';
import { BarChart } from '@/components/ui/chart';
import ChatAssistant from '@/components/ai/ChatAssistant';
import { isResolved, isPending, translate } from '@/lib/utils';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { requests: allRequests, loading } = useRequestsData({
    userEmail: isAdmin ? undefined : user?.email,
    pageSize: 1000,
    filters: { fullData: false },
  });

  // Preserva a lógica original: total inclui rejeitados, lista exclui
  const totalRequests = allRequests.length;
  const requests = allRequests
    .filter(r => r.approvalstatus !== 'rejected')
    .sort((a, b) =>
      new Date(b.createdat ?? 0).getTime() - new Date(a.createdat ?? 0).getTime()
    );
  
  // Função utilitária para normalizar status e prioridade
  const normalizeStatus = (status: string | null | undefined) => (status || '').toLowerCase().trim();
  const normalizePriority = (priority: string | null | undefined) => (priority || '').toLowerCase().trim();

  const isHighPriority = (priority: string | null | undefined) => ['alta', 'high'].includes(normalizePriority(priority));
  const highPriorityRequests = requests.filter(r => isHighPriority(r.priority) && isPending(r.status)).length;

  // Recent requests: 3 mais recentes
  const recentRequests = [...requests]
    .sort((a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime())
    .slice(0, 3);
  
  // Chart data (simplified for demo)
  const chartData = [
    { name: translate('type', 'ajuste_estoque'), value: requests.filter(r => r.type === 'ajuste_estoque').length },
    { name: translate('type', 'systems'), value: requests.filter(r => r.type === 'systems' || r.type === 'sistemas').length },
    { name: translate('type', 'general'), value: requests.filter(r => r.type === 'general' || r.type === 'geral').length },
    { name: translate('type', 'other'), value: requests.filter(r => r.type === 'other').length },
  ];
  
  const statusData = [
    { name: translate('status', 'new'), value: requests.filter(r => ['new', 'nova'].includes(normalizeStatus(r.status))).length },
    { name: translate('status', 'assigned'), value: requests.filter(r => ['assigned', 'atribuida'].includes(normalizeStatus(r.status))).length },
    { name: translate('status', 'in_progress'), value: requests.filter(r => ['in_progress', 'em_andamento'].includes(normalizeStatus(r.status))).length },
    { name: translate('status', 'resolved'), value: requests.filter(r => ['resolved', 'resolvida'].includes(normalizeStatus(r.status))).length },
    { name: translate('status', 'closed'), value: requests.filter(r => ['closed', 'fechada'].includes(normalizeStatus(r.status))).length },
  ];
  
  // Corrigir definição das variáveis para evitar ReferenceError
  const pendingRequests = requests.filter(r => isPending(r.status)).length;
  const resolvedRequests = requests.filter(r => isResolved(r.status)).length;
  
  if (!import.meta.env.PROD) {
    console.log('DASHBOARD - Total:', requests.length);
    console.log('DASHBOARD - Pendentes:', pendingRequests);
    console.log('DASHBOARD - Resolvidas:', resolvedRequests);
    console.log('DASHBOARD - Todos os status:', requests.map(r => r.status));
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 p-6">
        <ChatAssistant />
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Painel</h1>
            <Button asChild variant="ghost">
              <Link to="/request/new">
                <FilePlus className="h-4 w-4 mr-2" />
                Nova Solicitação
              </Link>
            </Button>
          </div>
        
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total de Solicitações</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRequests}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Todas as solicitações
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Solicitações Pendentes</CardTitle>
                <Hourglass className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingRequests}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Aguardando resolução
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Solicitações Resolvidas</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resolvedRequests}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Concluídas com sucesso
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Alta Prioridade</CardTitle>
                <ArrowUp className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{highPriorityRequests}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Atenção urgente necessária
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Solicitações Recentes</CardTitle>
              <Link to={user?.role === 'admin' ? '/requests' : '/requests/my'} className="text-sm text-muted-foreground hover:text-foreground flex items-center">
                Ver todas
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                </div>
              ) : recentRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma solicitação encontrada.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {recentRequests.map((request) => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/request/new">
                  <FilePlus className="h-4 w-4 mr-2" />
                  Criar Nova Solicitação
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
