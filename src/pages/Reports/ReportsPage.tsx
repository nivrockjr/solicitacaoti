import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { FileSpreadsheet, FileText, Filter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { getRequests } from '@/services/apiService';
import { ITRequest, RequestType, RequestPriority, RequestStatus } from '@/types';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { exportToPdf, exportToExcel } from '@/components/reports/exportUtils';
import { differenceInHours } from 'date-fns';

const ReportsPage = () => {
  const [filters, setFilters] = useState({
    status: '',
    type: 'all',
    startDate: null as Date | null,
    endDate: null as Date | null,
  });

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [error, setError] = useState<string | null>(null);

  const { data: allRequests = [], isLoading } = useQuery({
    queryKey: ['requests', page, filters],
    enabled: !!filters.status,
    queryFn: () => {
      console.time('Carregar solicitações relatório');
      let statusFilter: string | string[] | undefined = undefined;
      if (filters.status && filters.status !== 'all') {
        if (filters.status === 'pending') {
          statusFilter = ['nova', 'atribuida', 'assigned', 'em_andamento', 'in_progress', 'reaberta'];
        } else if (filters.status === 'resolvida') {
          statusFilter = ['resolvida', 'resolved'];
        }
      }
      return getRequests(undefined, page, pageSize, statusFilter)
        .then((res) => {
          console.timeEnd('Carregar solicitações relatório');
          setError(null);
          return res?.data || [];
        })
        .catch((error) => {
          setError('Erro ao carregar solicitações do relatório. Veja o console para detalhes.');
          console.error('Erro ao buscar solicitações do relatório:', error);
          return [];
        });
    },
  });

  // Aplicar filtros às solicitações
  const filteredRequests = useMemo(() => allRequests.filter((request: ITRequest) => {
    // Filtro por status
    if (filters.status === 'rejeitada') {
      if (request.approvalstatus !== 'rejected') return false;
    } else if (filters.status && filters.status !== 'all') {
      if (filters.status === 'pending') {
        const pendingStatuses = ['nova', 'atribuida', 'assigned', 'em_andamento', 'in_progress', 'reaberta'];
        if (!pendingStatuses.includes(request.status)) return false;
      } else if (filters.status === 'resolvida') {
        const resolvedStatuses = ['resolvida', 'resolved'];
        if (!resolvedStatuses.includes(request.status)) return false;
      }
    }
    // Filtro por tipo
    if (filters.type !== 'all' && request.type !== filters.type) {
      return false;
    }
    // Filtro por período
    if (filters.startDate) {
      const requestDate = new Date(request.createdat);
      if (requestDate < filters.startDate) {
        return false;
      }
    }
    if (filters.endDate) {
      const requestDate = new Date(request.createdat);
      const endOfDay = new Date(filters.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (requestDate > endOfDay) {
        return false;
      }
    }
    return true;
  }), [allRequests, filters]);

  const handleExportToPdf = () => {
    exportToPdf(filteredRequests, filters);
  };

  const handleExportToExcel = () => {
    exportToExcel(filteredRequests, filters);
  };

  // Função para calcular o tempo médio de resolução
  const calculateAverageResolutionTime = (requests: ITRequest[], filterByType?: string, filterByTechnician?: string) => {
    const resolvedRequests = requests.filter(req => 
      (req.status === 'resolvida' || req.status === 'resolved') &&
      req.resolvedat &&
      (!filterByType || req.type === filterByType) &&
      (!filterByTechnician || req.assignedto === filterByTechnician)
    );
    
    if (resolvedRequests.length === 0) return 0;
    
    const totalHours = resolvedRequests.reduce((sum, req) => {
      const createdDate = new Date(req.createdat);
      const resolvedDate = new Date(req.resolvedat!);
      return sum + differenceInHours(resolvedDate, createdDate);
    }, 0);
    
    return totalHours / resolvedRequests.length;
  };

  // Função utilitária para formatação segura de datas
  function formatDateSafe(date: string | Date | null | undefined) {
    if (!date) return '-';
    const d = new Date(date);
    return isNaN(d.getTime()) ? '-' : format(d, 'dd/MM/yyyy');
  }

  console.log('Renderizou ReportsPage');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <div className="flex gap-2">
          <Button onClick={handleExportToPdf} variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Button onClick={handleExportToExcel} variant="outline" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avançados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReportFilters 
            filters={filters}
            onFilterChange={setFilters}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Resultados</CardTitle>
          <p className="text-muted-foreground">
            {filters.status === '' ? 'Selecione um status para visualizar o relatório.' : `${filteredRequests.length} solicitações encontradas`}
          </p>
        </CardHeader>
        <CardContent>
          {filters.status === '' ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Selecione um status para visualizar o relatório.</p>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center my-4">{error}</div>
          ) : isLoading ? (
            <div className="flex justify-center py-8">
              <p>Carregando relatório...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma solicitação encontrada com os filtros selecionados.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Solicitante</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Criação</TableHead>
                      <TableHead>Data Resolução</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Descrição</TableHead>
                      {filters.status === 'rejeitada' && (
                        <TableHead>Motivo da Rejeição</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request: ITRequest) => {
                      // Função para calcular o valor da coluna "Prazo"
                      function getPrazoStatus(request: ITRequest): string {
                        if (request.approvalstatus === 'rejected') return 'N/A';
                        if (!request.resolvedat) return 'Em aberto';
                        if (!request.deadlineat) return '-';
                        const deadline = new Date(request.deadlineat);
                        const resolved = new Date(request.resolvedat);
                        if (resolved <= deadline) return 'No prazo';
                        return 'Fora do prazo';
                      }
                      // Extrair motivo da rejeição
                      let motivoRejeicao = '';
                      if (request.approvalstatus === 'rejected' && Array.isArray(request.comments)) {
                        const motivo = request.comments.find(c => c.text && c.text.startsWith('[REJEITADA]'));
                        motivoRejeicao = motivo ? motivo.text.replace('[REJEITADA]', '').trim() : '';
                      }
                      return (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium whitespace-nowrap">{request.id}</TableCell>
                          <TableCell>{request.requestername}</TableCell>
                          <TableCell>{getTypeLabel(request.type)}</TableCell>
                          <TableCell>{getPriorityLabel(request.priority)}</TableCell>
                          <TableCell>{getStatusLabel(request.status)}</TableCell>
                          <TableCell>{formatDateSafe(request.createdat)}</TableCell>
                          <TableCell>{request.resolvedat ? formatDateSafe(request.resolvedat) : '-'}</TableCell>
                          <TableCell>{formatDateSafe(request.deadlineat)}</TableCell>
                          <TableCell>{getPrazoStatus(request)}</TableCell>
                          <TableCell className="max-w-xs truncate">{request.description}</TableCell>
                          {filters.status === 'rejeitada' && (
                            <TableCell className="max-w-xs truncate">{motivoRejeicao}</TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {/* Controles de paginação */}
              <div className="flex justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
                <span className="px-2">Página {page}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={filteredRequests.length < pageSize}>Próxima</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Funções auxiliares para exibir labels em português
function getTypeLabel(type: RequestType): string {
  const typeLabels: Record<string, string> = {
    geral: 'Geral',
    sistemas: 'Sistemas',
    ajuste_estoque: 'Ajuste de Estoque',
    solicitacao_equipamento: 'Solicitação de Equipamento',
    manutencao_preventiva: 'Manutenção Preventiva',
  };
  
  return typeLabels[type] || type;
}

function getPriorityLabel(priority: RequestPriority): string {
  const priorityLabels: Record<string, string> = {
    alta: 'Alta',
    media: 'Média',
    baixa: 'Baixa',
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa',
  };
  
  return priorityLabels[priority] || priority;
}

function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    nova: 'Nova',
    atribuida: 'Atribuída',
    assigned: 'Atribuída',
    em_andamento: 'Em andamento',
    in_progress: 'Em andamento',
    reaberta: 'Reaberta',
    resolvida: 'Resolvida',
    resolved: 'Resolvida',
    fechada: 'Fechada',
    closed: 'Fechada',
    cancelada: 'Cancelada',
    canceled: 'Cancelada',
  };
  return statusLabels[status] || status;
}

// Adicionar componente de métricas de tempo médio
// const ResolutionTimeMetrics = ({ requests }: { requests: ITRequest[] }) => { ... }

export default ReportsPage;
