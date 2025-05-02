
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { FileExcel, FilePdf, Filter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { getRequests } from '@/services/apiService';
import { ITRequest, RequestType, RequestPriority, RequestStatus } from '@/types';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { exportToPdf, exportToExcel } from '@/components/reports/exportUtils';

const ReportsPage = () => {
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    startDate: null as Date | null,
    endDate: null as Date | null,
  });

  const { data: allRequests = [], isLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: () => getRequests(),
  });

  // Aplicar filtros às solicitações
  const filteredRequests = allRequests.filter((request: ITRequest) => {
    // Filtro por status
    if (filters.status !== 'all') {
      if (filters.status === 'pending') {
        if (['resolvida', 'fechada', 'resolved', 'closed'].includes(request.status)) {
          return false;
        }
      } else if (request.status !== filters.status) {
        return false;
      }
    }

    // Filtro por tipo
    if (filters.type !== 'all' && request.type !== filters.type) {
      return false;
    }

    // Filtro por período
    if (filters.startDate) {
      const requestDate = new Date(request.createdAt);
      if (requestDate < filters.startDate) {
        return false;
      }
    }

    if (filters.endDate) {
      const requestDate = new Date(request.createdAt);
      const endOfDay = new Date(filters.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      if (requestDate > endOfDay) {
        return false;
      }
    }

    return true;
  });

  const handleExportToPdf = () => {
    exportToPdf(filteredRequests, filters);
  };

  const handleExportToExcel = () => {
    exportToExcel(filteredRequests, filters);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <div className="flex gap-2">
          <Button onClick={handleExportToPdf} variant="outline" className="flex items-center gap-2">
            <FilePdf className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Button onClick={handleExportToExcel} variant="outline" className="flex items-center gap-2">
            <FileExcel className="h-4 w-4" />
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
            {filteredRequests.length} solicitações encontradas
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p>Carregando relatório...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma solicitação encontrada com os filtros selecionados.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request: ITRequest) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.id}</TableCell>
                      <TableCell>{request.requesterName}</TableCell>
                      <TableCell>{format(new Date(request.createdAt), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{getTypeLabel(request.type)}</TableCell>
                      <TableCell>{format(new Date(request.deadlineAt), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{getPriorityLabel(request.priority)}</TableCell>
                      <TableCell className="max-w-xs truncate">{request.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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

export default ReportsPage;
