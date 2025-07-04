import React, { useEffect, useState, useMemo } from 'react';
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
import { supabase } from '@/lib/supabase';

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
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [error, setError] = useState<string | null>(null);
  const [filterCounts, setFilterCounts] = useState({
    all: 0, new: 0, assigned: 0, in_progress: 0, resolved: 0, high: 0
  });
  
  // Funções para status
  const statusMap = {
    all: undefined,
    new: ['nova', 'new'],
    assigned: ['atribuida', 'assigned'],
    in_progress: ['em_andamento', 'in_progress'],
    resolved: ['resolvida', 'resolved', 'fechada', 'closed']
  };
  const [tab, setTab] = useState<'all' | 'new' | 'assigned' | 'in_progress' | 'resolved'>('all');
  
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
    console.time('Carregar solicitações');
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        const statusFilter = statusMap[tab];
        const { data: fetchedRequests } = await getRequests(undefined, page, pageSize, statusFilter);
        console.log('Solicitações recebidas do backend:', fetchedRequests);
        // Ordenar por data de criação decrescente
        const sortedRequests = [...fetchedRequests].sort((a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime());
        setRequests(sortedRequests);
      } catch (error) {
        setError('Erro ao carregar solicitações. Veja o console para detalhes.');
        setRequests([]);
        console.error('Erro ao buscar solicitações:', error);
      } finally {
        setLoading(false);
        console.timeEnd('Carregar solicitações');
      }
    };
    fetchRequests();
  }, [page, tab]);
  
  useEffect(() => {
    const fetchCounts = async () => {
      // Busca apenas id, status e prioridade para contar
      const { data, error } = await supabase
        .from('solicitacoes')
        .select('id, status, priority');
      if (error) return;
      const all = data.length;
      const newCount = data.filter(r => ['nova', 'new'].includes((r.status || '').toLowerCase())).length;
      const assigned = data.filter(r => ['atribuida', 'assigned'].includes((r.status || '').toLowerCase())).length;
      const in_progress = data.filter(r => ['em_andamento', 'in_progress'].includes((r.status || '').toLowerCase())).length;
      const resolved = data.filter(r => ['resolvida', 'resolved', 'fechada', 'closed'].includes((r.status || '').toLowerCase())).length;
      const high = data.filter(r => ['alta', 'high'].includes((r.priority || '').toLowerCase())).length;
      setFilterCounts({ all, new: newCount, assigned, in_progress, resolved, high });
    };
    fetchCounts();
  }, []);
  
  const normalizeStatus = (status) => (status || '').toLowerCase();
  const normalizePriority = (priority) => (priority || '').toLowerCase();
  
  const filteredRequests = useMemo(() => {
    let filtered = [...requests];
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        r =>
          r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.requestername?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.requesteremail?.toLowerCase().includes(searchQuery.toLowerCase())
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
    // Ordenar por data de criação decrescente (mais recente primeiro)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdat).getTime();
      const dateB = new Date(b.createdat).getTime();
      return dateB - dateA;
    });
  }, [requests, searchQuery, filters]);
  
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
      'other': 'Outro'
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
      'baixa': 'Baixa'
    };
    
    return priorityMap[priority] || priority;
  };
  
  console.log('Renderizou AllRequestsPage');
  
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
      
      <Tabs value={tab} onValueChange={value => setTab(value as any)} defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            Todas ({filterCounts.all})
          </TabsTrigger>
          <TabsTrigger value="new">
            Novas ({filterCounts.new})
          </TabsTrigger>
          <TabsTrigger value="assigned">
            Atribuídas ({filterCounts.assigned})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            Em Andamento ({filterCounts.in_progress})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolvidas ({filterCounts.resolved})
          </TabsTrigger>
        </TabsList>
        
        {['all', 'new', 'assigned', 'in_progress', 'resolved'].map((status) => (
          <TabsContent key={status} value={status} className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <Card className="p-8 text-center">
                <h3 className="font-medium text-lg mb-2">Nenhuma solicitação encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? "Nenhuma solicitação corresponde à sua busca" 
                    : "Nenhuma solicitação encontrada"}
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

export default AllRequestsPage;
