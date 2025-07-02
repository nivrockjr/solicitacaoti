import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUp, CheckCircle2, Clock, FilePlus, Hourglass } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ITRequest } from '@/types';
import { getRequests } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import RequestCard from '@/components/requests/RequestCard';
import { Fragment } from 'react';
import { BarChart } from '@/components/ui/chart';
import ChatAssistant from '@/components/ai/ChatAssistant';

const DashboardPage: React.FC = () => {
  const [requests, setRequests] = useState<ITRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const fetchedRequests = await getRequests(user?.role === 'admin' ? undefined : user?.id);
        setRequests(fetchedRequests.sort((a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime()));
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, [user]);
  
  // Request statistics
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status !== 'resolved' && r.status !== 'closed').length;
  const resolvedRequests = requests.filter(r => r.status === 'resolved' || r.status === 'closed').length;
  const highPriorityRequests = requests.filter(r => r.priority === 'high' && r.status !== 'resolved' && r.status !== 'closed').length;
  
  // Recent requests
  const recentRequests = [...requests]
    .sort((a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime())
    .slice(0, 3);
  
  // Chart data (simplified for demo)
  const chartData = [
    { name: 'Inventário', value: requests.filter(r => r.type === 'inventory').length },
    { name: 'Sistema', value: requests.filter(r => r.type === 'system').length },
    { name: 'Emergência', value: requests.filter(r => r.type === 'emergency').length },
    { name: 'Outros', value: requests.filter(r => r.type === 'other').length },
  ];
  
  const statusData = [
    { name: 'Novo', value: requests.filter(r => r.status === 'new').length },
    { name: 'Atribuído', value: requests.filter(r => r.status === 'assigned').length },
    { name: 'Em Progresso', value: requests.filter(r => r.status === 'in_progress').length },
    { name: 'Resolvido', value: requests.filter(r => r.status === 'resolved').length },
    { name: 'Fechado', value: requests.filter(r => r.status === 'closed').length },
  ];
  
  return (
    <div>
      <ChatAssistant />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Painel</h1>
          <Button asChild>
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
  );
};

export default DashboardPage;
