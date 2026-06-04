import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRequestsData, useRequestsCountersData } from '@/hooks/use-requests-data';
import RequestCard from '@/components/requests/RequestCard';
import ChatAssistant from '@/components/ai/ChatAssistant';
import { getSemanticIcon } from '@/lib/utils';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const userEmail = isAdmin ? undefined : user?.email;
  
  // Buscar contadores via RPC
  const { counts } = useRequestsCountersData(userEmail, true, 30000);

  // Buscar apenas as 3 mais recentes (e não 1000)
  const { requests: recentRequests, loading } = useRequestsData({
    userEmail,
    page: 1,
    pageSize: 3,
    filters: { fullData: false, notStatus: 'rejected' },
  });

  const totalRequests = counts.all;
  const pendingRequests = counts.active;
  const resolvedRequests = counts.resolved;
  const highPriorityRequests = counts.high_priority;
  
  if (!import.meta.env.PROD) {
    console.log('DASHBOARD - Total:', totalRequests);
    console.log('DASHBOARD - Pendentes:', pendingRequests);
    console.log('DASHBOARD - Resolvidas:', resolvedRequests);
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
                {getSemanticIcon('file-add', { className: 'h-4 w-4 mr-2' })}
                Nova Solicitação
              </Link>
            </Button>
          </div>
        
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total de Solicitações</CardTitle>
                {getSemanticIcon('clock', { className: 'h-4 w-4 text-muted-foreground' })}
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
                {getSemanticIcon('pending', { className: 'h-4 w-4 text-warning' })}
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
                {getSemanticIcon('success', { className: 'h-4 w-4 text-success' })}
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
                {getSemanticIcon('action-up', { className: 'h-4 w-4 text-destructive' })}
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
                {getSemanticIcon('action-forward', { className: 'h-4 w-4 ml-1' })}
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
                  {getSemanticIcon('file-add', { className: 'h-4 w-4 mr-2' })}
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
