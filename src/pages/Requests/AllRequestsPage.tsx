import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RequestPriority, RequestType } from '@/types';
import RequestCard from '@/components/requests/RequestCard';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useRequestsData, useRequestsCounters } from '@/hooks/use-requests-data';
import { translate, getPriorityStyle, isResolved, isPending, getSemanticIcon } from '@/lib/utils';
import { isAssignedToSistemaEugenio } from '@/config/specialUsers';

interface Filters {
  types: RequestType[];
  priorities: RequestPriority[];
}

const TAB_VALUES = ['novas', 'high_priority', 'sistema_eugenio', 'in_progress', 'resolved', 'rejected', 'all'] as const;
type TabValue = typeof TAB_VALUES[number];

const AllRequestsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    types: [],
    priorities: []
  });
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [tab, setTab] = useState<TabValue>('novas');

  // Filtro do backend constante e leve (estável por identidade)
  const backendFilters = useMemo(() => ({ fullData: false }), []);
  
  // Usar o novo hook para gerenciar dados
  const {
    requests,
    loading,
    error,
    clearError,
  } = useRequestsData({
    page: 1,
    pageSize: 1000, // Buscar todas para calcular contadores
    autoRefresh: true,
    refreshInterval: 30000, // 30 segundos
    filters: backendFilters // Carregamento leve para performance
  });

  // Calcular contadores usando o hook específico
  const calculatedCounts = useRequestsCounters(requests);

  // Resetar página para 1 quando filtros ou aba mudam
  useEffect(() => {
    setPage(1);
  }, [tab, searchQuery, filters.types, filters.priorities]);

  const filteredRequests = useMemo(() => {
    let filtered = [...requests];

    if (tab === 'novas') {
      filtered = filtered.filter(r => r.status === 'new' && r.approvalstatus !== 'rejected');
    } else if (tab === 'high_priority') {
      filtered = filtered.filter(r => r.priority === 'high' && isPending(r.status) && r.approvalstatus !== 'rejected');
    } else if (tab === 'sistema_eugenio') {
      filtered = filtered.filter(r => isAssignedToSistemaEugenio(r.assignedto)).filter(r => isPending(r.status));
    } else if (tab === 'in_progress') {
      filtered = filtered.filter(r => ['in_progress', 'assigned', 'reopened'].includes(r.status ?? '') && r.approvalstatus !== 'rejected');
    } else if (tab === 'resolved') {
      filtered = filtered.filter(r => isResolved(r.status) && r.approvalstatus !== 'rejected');
    } else if (tab === 'rejected') {
      filtered = filtered.filter(r => r.approvalstatus === 'rejected');
    }

    filtered = filtered.sort((a, b) => new Date(b.createdat ?? 0).getTime() - new Date(a.createdat ?? 0).getTime());

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.description?.toLowerCase().includes(q) ||
        r.id?.toLowerCase().includes(q) ||
        r.requestername?.toLowerCase().includes(q) ||
        r.requesteremail?.toLowerCase().includes(q)
      );
    }
    if (filters.types.length > 0) {
      filtered = filtered.filter(r => r.type !== null && filters.types.includes(r.type));
    }
    if (filters.priorities.length > 0) {
      filtered = filtered.filter(r => r.priority !== null && filters.priorities.includes(r.priority));
    }
    return filtered;
  }, [requests, tab, searchQuery, filters.types, filters.priorities]);

  const paginatedRequests = useMemo(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    return filteredRequests.slice(from, to);
  }, [filteredRequests, page]);
  
  const handleTypeFilterChange = (type: RequestType) => {
    setFilters(prev => {
      const types = prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type];
        
      return { ...prev, types };
    });
  };
  
  const getTypeName = (type: string) => translate('type', type);
  
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

  return (
    <div className="space-y-6">
      {/* Alerta de erro */}
      {error && (
        <Alert className="border-destructive/30 bg-destructive/10">
          {getSemanticIcon('error', { className: 'h-4 w-4 text-destructive' })}
          <AlertDescription className="text-destructive">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={clearError}>
                Fechar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Todas as Solicitações</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            {getSemanticIcon('action-search', { className: 'absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' })}
            <Input
              placeholder="Buscar solicitações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                {getSemanticIcon('action-tune', { className: 'h-4 w-4' })}
                Filtros
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1">
                    {filters.types.length + filters.priorities.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Tipo</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 hover:bg-muted/60 dark:hover:bg-muted/40 rounded-md transition-colors p-1">
                      <Checkbox 
                        id="type-general" 
                        checked={filters.types.includes('general')}
                        onCheckedChange={() => handleTypeFilterChange('general')}
                      />
                      <Label htmlFor="type-general">Geral</Label>
                    </div>
                    <div className="flex items-center space-x-2 hover:bg-muted/60 dark:hover:bg-muted/40 rounded-md transition-colors p-1">
                      <Checkbox 
                        id="type-systems" 
                        checked={filters.types.includes('systems')}
                        onCheckedChange={() => handleTypeFilterChange('systems')}
                      />
                      <Label htmlFor="type-systems">Sistemas</Label>
                    </div>
                    <div className="flex items-center space-x-2 hover:bg-muted/60 dark:hover:bg-muted/40 rounded-md transition-colors p-1">
                      <Checkbox 
                        id="type-ajuste_estoque" 
                        checked={filters.types.includes('ajuste_estoque')}
                        onCheckedChange={() => handleTypeFilterChange('ajuste_estoque')}
                      />
                      <Label htmlFor="type-ajuste_estoque">Ajuste de Estoque</Label>
                    </div>
                    <div className="flex items-center space-x-2 hover:bg-muted/60 dark:hover:bg-muted/40 rounded-md transition-colors p-1">
                      <Checkbox
                        id="type-employee_lifecycle"
                        checked={filters.types.includes('employee_lifecycle')}
                        onCheckedChange={() => handleTypeFilterChange('employee_lifecycle')}
                      />
                      <Label htmlFor="type-employee_lifecycle">Ciclo de Vida</Label>
                    </div>
                    <div className="flex items-center space-x-2 hover:bg-muted/60 dark:hover:bg-muted/40 rounded-md transition-colors p-1">
                      <Checkbox
                        id="type-equipment_request"
                        checked={filters.types.includes('equipment_request')}
                        onCheckedChange={() => handleTypeFilterChange('equipment_request')}
                      />
                      <Label htmlFor="type-equipment_request">Solicitação de Equipamento</Label>
                    </div>
                    <div className="flex items-center space-x-2 hover:bg-muted/60 dark:hover:bg-muted/40 rounded-md transition-colors p-1">
                      <Checkbox
                        id="type-preventive_maintenance"
                        checked={filters.types.includes('preventive_maintenance')}
                        onCheckedChange={() => handleTypeFilterChange('preventive_maintenance')}
                      />
                      <Label htmlFor="type-preventive_maintenance">Manutenção Preventiva</Label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Prioridade</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 hover:bg-muted/60 dark:hover:bg-muted/40 rounded-md transition-colors p-1">
                      <Checkbox
                        id="priority-high"
                        checked={filters.priorities.includes('high')}
                        onCheckedChange={() => handlePriorityFilterChange('high')}
                      />
                      <Label htmlFor="priority-high">Alta</Label>
                    </div>
                    <div className="flex items-center space-x-2 hover:bg-muted/60 dark:hover:bg-muted/40 rounded-md transition-colors p-1">
                      <Checkbox
                        id="priority-medium"
                        checked={filters.priorities.includes('medium')}
                        onCheckedChange={() => handlePriorityFilterChange('medium')}
                      />
                      <Label htmlFor="priority-medium">Média</Label>
                    </div>
                    <div className="flex items-center space-x-2 hover:bg-muted/60 dark:hover:bg-muted/40 rounded-md transition-colors p-1">
                      <Checkbox
                        id="priority-low"
                        checked={filters.priorities.includes('low')}
                        onCheckedChange={() => handlePriorityFilterChange('low')}
                      />
                      <Label htmlFor="priority-low">Baixa</Label>
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
          
          <Button variant='ghost' className="flex items-center gap-2">
            {getSemanticIcon('file-add', { className: 'h-4 w-4' })}
            Nova Solicitação
          </Button>
        </div>
      </div>
      
      <Tabs
        value={tab}
        onValueChange={(value) => {
          if ((TAB_VALUES as readonly string[]).includes(value)) {
            setTab(value as TabValue);
            setPage(1);
          }
        }}
        defaultValue="novas"
      >
        <TabsList>
          <TabsTrigger value="novas">
            Novas ({calculatedCounts.novas})
          </TabsTrigger>
          <TabsTrigger value="high_priority">
            Alta Prioridade ({calculatedCounts.high_priority})
          </TabsTrigger>
          <TabsTrigger value="sistema_eugenio">
            Sistema Eugênio ({calculatedCounts.sistema_eugenio})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            Em Andamento ({calculatedCounts.in_progress})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolvidas ({calculatedCounts.resolved})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejeitadas ({calculatedCounts.rejected})
          </TabsTrigger>
          <TabsTrigger value="all">
            Todas ({calculatedCounts.all})
          </TabsTrigger>
        </TabsList>
        
        {['novas', 'high_priority', 'sistema_eugenio', 'in_progress', 'resolved', 'rejected', 'all'].map((status) => (
          <TabsContent key={status} value={status} className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
              </div>
            ) : paginatedRequests.length === 0 ? (
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
                {paginatedRequests.map((request) => (
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
            {filters.priorities.map((priority) => {
              const pStyle = getPriorityStyle(priority);
              return (
                <Badge key={`priority-${priority}`} variant={pStyle.variant || 'outline'} className="flex items-center gap-1">
                  {pStyle.label}
                  <button 
                    className="ml-1 hover:text-destructive"
                    onClick={() => handlePriorityFilterChange(priority)}
                  >
                    ×
                  </button>
                </Badge>
              );
            })}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6">
              Limpar todos
            </Button>
          </div>
        </div>
      )}
      
      {/* Controles de paginação */}
      <div className="flex justify-center gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
        <span className="px-2">Página {page} de {Math.ceil(filteredRequests.length / pageSize) || 1}</span>
        <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * pageSize >= filteredRequests.length}>Próxima</Button>
      </div>
      
      {error && <div className="text-destructive text-center my-4">{error}</div>}
    </div>
  );
};

export default AllRequestsPage;
