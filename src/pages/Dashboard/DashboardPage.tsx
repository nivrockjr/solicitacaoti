
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUp, CheckCircle2, Clock, FilePlus, Hourglass, Bot } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ITRequest } from '@/types';
import { getRequests } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import RequestCard from '@/components/requests/RequestCard';
import EnhancedVirtualAssistant from '@/components/chat/EnhancedVirtualAssistant';
import { useVirtualAssistant } from '@/hooks/useVirtualAssistant';
import { BarChart } from '@/components/ui/chart';

const DashboardPage: React.FC = () => {
  const [requests, setRequests] = useState<ITRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, isAuthenticated } = useAuth();
  const { 
    isVisible, 
    isMinimized, 
    toggleVisibility, 
    toggleMinimize, 
    close 
  } = useVirtualAssistant();
  
  useEffect(() => {
    const fetchRequests = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const fetchedRequests = await getRequests(
          profile?.role === 'admin' || profile?.role === 'technician' ? undefined : profile?.id
        );
        setRequests(fetchedRequests);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, [isAuthenticated, profile]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Bem-vindo ao Sistema de TI</h2>
          <p className="text-muted-foreground mb-6">Faça login para acessar o painel</p>
          <Button asChild>
            <Link to="/auth/login">Fazer Login</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  // Request statistics
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => 
    r.status !== 'resolved' && r.status !== 'closed'
  ).length;
  const resolvedRequests = requests.filter(r => 
    r.status === 'resolved' || r.status === 'closed'
  ).length;
  const highPriorityRequests = requests.filter(r => 
    (r.priority === 'high' || r.priority === 'urgent') && 
    r.status !== 'resolved' && r.status !== 'closed'
  ).length;
  
  // Recent requests
  const recentRequests = [...requests]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
  
  // Chart data
  const chartData = [
    { name: 'Hardware', value: requests.filter(r => r.type === 'hardware').length },
    { name: 'Software', value: requests.filter(r => r.type === 'software').length },
    { name: 'Rede', value: requests.filter(r => r.type === 'network').length },
    { name: 'Sistema', value: requests.filter(r => r.type === 'system').length },
    { name: 'Outros', value: requests.filter(r => r.type === 'other').length },
  ].filter(item => item.value > 0);
  
  const statusData = [
    { name: 'Novo', value: requests.filter(r => r.status === 'new').length },
    { name: 'Atribuído', value: requests.filter(r => r.status === 'assigned').length },
    { name: 'Em Progresso', value: requests.filter(r => r.status === 'in_progress').length },
    { name: 'Resolvido', value: requests.filter(r => r.status === 'resolved').length },
    { name: 'Fechado', value: requests.filter(r => r.status === 'closed').length },
  ].filter(item => item.value > 0);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Painel {profile?.name && `- Bem-vindo(a), ${profile.name}`}
        </h1>
        <div className="flex gap-2">
          <Button 
            variant={isVisible ? "default" : "outline"} 
            onClick={toggleVisibility}
            className={`relative ${isVisible 
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700' 
              : 'border-blue-600 text-blue-600 hover:bg-blue-50'
            }`}
          >
            <Bot className="h-4 w-4 mr-2" />
            Assistente IA
            {!isVisible && (
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </Button>
          <Button asChild>
            <Link to="/request/new">
              <FilePlus className="h-4 w-4 mr-2" />
              Nova Solicitação
            </Link>
          </Button>
        </div>
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
              {profile?.role === 'admin' || profile?.role === 'technician' 
                ? 'Todas as solicitações' 
                : 'Suas solicitações'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
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
            <CardTitle className="text-sm font-medium">Resolvidas</CardTitle>
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
      
      {(chartData.length > 0 || statusData.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tipos de Solicitação</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <BarChart 
                  data={chartData}
                  index="name"
                  categories={['value']}
                  colors={['hsl(var(--primary))']}
                  valueFormatter={(value: number) => String(value)}
                  className="w-full aspect-[4/3]"
                  config={{
                    value: { color: 'hsl(var(--primary))' }
                  }}
                />
              </CardContent>
            </Card>
          )}
          
          {statusData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Status das Solicitações</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <BarChart 
                  data={statusData}
                  index="name"
                  categories={['value']}
                  colors={['hsl(var(--accent))']}
                  valueFormatter={(value: number) => String(value)}
                  className="w-full aspect-[4/3]"
                  config={{
                    value: { color: 'hsl(var(--accent))' }
                  }}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Solicitações Recentes</CardTitle>
          <Link 
            to={profile?.role === 'admin' || profile?.role === 'technician' ? '/requests' : '/requests/my'} 
            className="text-sm text-muted-foreground hover:text-foreground flex items-center"
          >
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

      {/* Enhanced Virtual Assistant */}
      {isVisible && isAuthenticated && (
        <div className="fixed bottom-6 right-6 z-50">
          <EnhancedVirtualAssistant 
            isMinimized={isMinimized}
            onToggleMinimize={toggleMinimize}
            onClose={close}
          />
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
