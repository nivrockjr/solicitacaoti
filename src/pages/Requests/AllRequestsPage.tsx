import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus, Search, SlidersHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ITRequest, RequestPriority, RequestStatus, RequestType } from '@/types';
import { getRequests } from '@/services/apiService';
import RequestCard from '@/components/requests/RequestCard';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Filters {
  types: RequestType[];
  priorities: RequestPriority[];
}

const AllRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<ITRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    types: [],
    priorities: []
  });
  
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const fetchedRequests = await getRequests();
        setRequests(fetchedRequests);
      } catch (error) {
        console.error('Erro ao buscar solicitações:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, []);
  
  const normalizeStatus = (status: RequestStatus | 'all'): string[] => {
    if (status === 'all') return ['all'];
    
    const statusMap: Record<string, string[]> = {
      'new': ['new', 'nova'],
      'assigned': ['assigned', 'atribuida'],
      'in_progress': ['in_progress', 'em_andamento'],
      'resolved': ['resolved', 'resolvida'],
      'closed': ['closed', 'fechada']
    };
    
    return statusMap[status] || [status];
  };
  
  const requestsByStatus = (status: RequestStatus | 'all'): ITRequest[] => {
    let filtered = [...requests];
    const statusesToCheck = normalizeStatus(status);
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        r => 
          (r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
          r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.requesterEmail.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply type filter
    if (filters.types.length > 0) {
      filtered = filtered.filter(r => filters.types.includes(r.type));
    }
    
    // Apply priority filter
    if (filters.priorities.length > 0) {
      filtered = filtered.filter(r => filters.priorities.includes(r.priority));
    }
    
    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter(r => statusesToCheck.includes(r.status));
    }
    
    return filtered;
  };
  
  const handleTypeFilterChange = (type: RequestType) => {
    setFilters(prev => {
      const types = prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type];
        
      return { ...prev, types };
    });
  };
  
  const handlePriorityFilterChange = (priority: RequestPriority) => {
    setFilters(prev => {
      const priorities = prev.priorities.includes(priority)
        ? prev.priorities.filter(p => p !== priority)
        : [...prev.priorities, priority];
        
      return { ...prev, priorities };
    });
  };
  
  const clearFilters = () => {
    setFilters({ types: [], priorities: [] });
  };
  
  const hasActiveFilters = filters.types.length > 0 || filters.priorities.length > 0;
  
  const getTypeName = (type: RequestType): string => {
    const typeMap: Record<RequestType, string> = {
      'geral': 'Geral',
      'sistemas': 'Sistemas',
      'ajuste_estoque': 'Ajuste de Estoque',
      'solicitacao_equipamento': 'Solicitação de Equipamento',
      'manutencao_preventiva': 'Manutenção Preventiva',
      'inventory': 'Inventário',
      'system': 'Sistema',
      'emergency': 'Emergência',
      'other': 'Outro',
      'hardware': 'Hardware',
      'software': 'Software',
      'network': 'Rede',
      'access': 'Acesso',
      'maintenance': 'Manutenção'
    };
    
    return typeMap[type] || type;
  };
  
  const getPriorityName = (priority: RequestPriority): string => {
    const priorityMap: Record<RequestPriority, string> = {
      'high': 'Alta',
      'medium': 'Média',
      'low': 'Baixa',
      'alta': 'Alta',
      'media': 'Média',
      'baixa': 'Baixa',
      'urgent': 'Urgente'
    };
    
    return priorityMap[priority] || priority;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Todas as Solicitações</h1>
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
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <SlidersHorizontal className="h-4 w-4" />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    {filters.types.length + filters.priorities.length}
                  </span>
                )}
                <span className="sr-only">Filtrar solicitações</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-4" align="end">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Tipo de Solicitação</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="type-geral" 
                        checked={filters.types.includes('geral')}
                        onCheckedChange={() => handleTypeFilterChange('geral')}
                      />
                      <Label htmlFor="type-geral">Geral</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="type-sistemas" 
                        checked={filters.types.includes('sistemas')}
                        onCheckedChange={() => handleTypeFilterChange('sistemas')}
                      />
                      <Label htmlFor="type-sistemas">Sistemas</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="type-ajuste_estoque" 
                        checked={filters.types.includes('ajuste_estoque')}
                        onCheckedChange={() => handleTypeFilterChange('ajuste_estoque')}
                      />
                      <Label htmlFor="type-ajuste_estoque">Ajuste de Estoque</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="type-solicitacao_equipamento" 
                        checked={filters.types.includes('solicitacao_equipamento')}
                        onCheckedChange={() => handleTypeFilterChange('solicitacao_equipamento')}
                      />
                      <Label htmlFor="type-solicitacao_equipamento">Solicitação de Equipamento</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="type-manutencao_preventiva" 
                        checked={filters.types.includes('manutencao_preventiva')}
                        onCheckedChange={() => handleTypeFilterChange('manutencao_preventiva')}
                      />
                      <Label htmlFor="type-manutencao_preventiva">Manutenção Preventiva</Label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Prioridade</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="priority-alta" 
                        checked={filters.priorities.includes('alta')}
                        onCheckedChange={() => handlePriorityFilterChange('alta')}
                      />
                      <Label htmlFor="priority-alta">Alta</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="priority-media" 
                        checked={filters.priorities.includes('media')}
                        onCheckedChange={() => handlePriorityFilterChange('media')}
                      />
                      <Label htmlFor="priority-media">Média</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="priority-baixa" 
                        checked={filters.priorities.includes('baixa')}
                        onCheckedChange={() => handlePriorityFilterChange('baixa')}
                      />
                      <Label htmlFor="priority-baixa">Baixa</Label>
                    </div>
                  </div>
                </div>
                
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          <Button asChild>
            <Link to="/request/new">
              <FilePlus className="h-4 w-4 mr-2" />
              Nova Solicitação
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            Todas ({requestsByStatus('all').length})
          </TabsTrigger>
          <TabsTrigger value="new">
            Novas ({requestsByStatus('new').length})
          </TabsTrigger>
          <TabsTrigger value="assigned">
            Atribuídas ({requestsByStatus('assigned').length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            Em Andamento ({requestsByStatus('in_progress').length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolvidas ({requestsByStatus('resolved').length})
          </TabsTrigger>
        </TabsList>
        
        {['all', 'new', 'assigned', 'in_progress', 'resolved'].map((status) => (
          <TabsContent key={status} value={status} className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
              </div>
            ) : requestsByStatus(status as any).length === 0 ? (
              <Card className="p-8 text-center">
                <h3 className="font-medium text-lg mb-2">Nenhuma solicitação encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || hasActiveFilters 
                    ? "Nenhuma solicitação corresponde à sua busca ou filtros" 
                    : "Não há solicitações com este status"}
                </p>
                
                {hasActiveFilters && (
                  <Button onClick={clearFilters} className="mr-2">
                    Limpar Filtros
                  </Button>
                )}
                
                <Button asChild>
                  <Link to="/request/new">
                    <FilePlus className="h-4 w-4 mr-2" />
                    Criar Nova Solicitação
                  </Link>
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {requestsByStatus(status as any).map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
      
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">Filtros ativos:</p>
          <div className="flex flex-wrap gap-2">
            {filters.types.map((type) => (
              <Badge key={`type-${type}`} variant="outline" className="flex items-center gap-1">
                {getTypeName(type)}
                <button 
                  className="ml-1 hover:text-destructive"
                  onClick={() => handleTypeFilterChange(type)}
                >
                  ×
                </button>
              </Badge>
            ))}
            {filters.priorities.map((priority) => (
              <Badge key={`priority-${priority}`} variant="outline" className="flex items-center gap-1">
                {getPriorityName(priority)}
                <button 
                  className="ml-1 hover:text-destructive"
                  onClick={() => handlePriorityFilterChange(priority)}
                >
                  ×
                </button>
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6">
              Limpar todos
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllRequestsPage;
