import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, getSemanticIcon } from '@/lib/utils';

export interface ReportFiltersValue {
  status: string;
  type: string;
  startDate: Date | null;
  endDate: Date | null;
}

interface FiltersProps {
  filters: ReportFiltersValue;
  onFilterChange: (filters: ReportFiltersValue) => void;
}

export function ReportFilters({ filters, onFilterChange }: FiltersProps) {
  const handleStatusChange = (value: string) => {
    onFilterChange({ ...filters, status: value });
  };

  const handleTypeChange = (value: string) => {
    onFilterChange({ ...filters, type: value });
  };

  const handleStartDateChange = (date: Date | undefined) => {
    onFilterChange({ ...filters, startDate: date || null });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    onFilterChange({ ...filters, endDate: date || null });
  };

  const clearFilters = () => {
    onFilterChange({
      status: 'all',
      type: 'all',
      startDate: null,
      endDate: null,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={filters.status}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as solicitações</SelectItem>
              <SelectItem value="pending">Solicitações pendentes</SelectItem>
              <SelectItem value="resolved">Resolvidas</SelectItem>
              <SelectItem value="rejected">Rejeitadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo</label>
          <Select
            value={filters.type}
            onValueChange={handleTypeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="general">Geral</SelectItem>
              <SelectItem value="systems">Sistemas</SelectItem>
              <SelectItem value="ajuste_estoque">Ajuste de Estoque</SelectItem>
              <SelectItem value="employee_lifecycle">Ciclo de Vida</SelectItem>
              <SelectItem value="equipment_request">Solicitação de Equipamento</SelectItem>
              <SelectItem value="preventive_maintenance">Manutenção Preventiva</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Data inicial</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.startDate && "text-muted-foreground"
                )}
              >
                {getSemanticIcon('calendar', { className: 'mr-2 h-4 w-4' })}
                {filters.startDate ? (
                  format(filters.startDate, "dd/MM/yyyy")
                ) : (
                  <span>Selecionar data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 pointer-events-auto">
              <Calendar
                mode="single"
                selected={filters.startDate || undefined}
                onSelect={handleStartDateChange}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Data final</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.endDate && "text-muted-foreground"
                )}
              >
                {getSemanticIcon('calendar', { className: 'mr-2 h-4 w-4' })}
                {filters.endDate ? (
                  format(filters.endDate, "dd/MM/yyyy")
                ) : (
                  <span>Selecionar data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 pointer-events-auto">
              <Calendar
                mode="single"
                selected={filters.endDate || undefined}
                onSelect={handleEndDateChange}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={clearFilters}>
          Limpar filtros
        </Button>
      </div>
    </div>
  );
}
