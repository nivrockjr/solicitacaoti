import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ITRequest } from '@/types';

// Função para traduzir tipos de solicitação
function translateRequestType(type: string): string {
  const typeMap: { [key: string]: string } = {
    'geral': 'Geral',
    'sistemas': 'Sistemas',
    'ajuste_estoque': 'Ajuste de Estoque',
    'solicitacao_equipamento': 'Solicitação de Equipamento',
    'manutencao_preventiva': 'Manutenção Preventiva',
  };
  
  return typeMap[type] || type;
}

// Função para traduzir prioridades
function translatePriority(priority: string): string {
  const priorityMap: { [key: string]: string } = {
    'alta': 'Alta',
    'media': 'Média',
    'baixa': 'Baixa',
    'high': 'Alta',
    'medium': 'Média',
    'low': 'Baixa',
  };
  
  return priorityMap[priority] || priority;
}

// Função para traduzir status para português
function translateStatus(status) {
  const statusMap = {
    'nova': 'Nova',
    'atribuida': 'Atribuída',
    'assigned': 'Atribuída',
    'em_andamento': 'Em andamento',
    'in_progress': 'Em andamento',
    'reaberta': 'Reaberta',
    'resolvida': 'Resolvida',
    'resolved': 'Resolvida',
    'fechada': 'Fechada',
    'closed': 'Fechada',
    'cancelada': 'Cancelada',
    'canceled': 'Cancelada',
  };
  return statusMap[status] || status;
}

// Função utilitária para formatação segura de datas
function formatDateSafe(date: string | Date | null | undefined) {
  if (!date) return '-';
  const d = new Date(date);
  return isNaN(d.getTime()) ? '-' : format(d, 'dd/MM/yyyy');
}

// Função para calcular o valor da coluna "Prazo"
function getPrazoStatus(request) {
  if (!request.resolvedat) return 'Em aberto';
  if (!request.deadlineat) return '-';
  const deadline = new Date(request.deadlineat);
  const resolved = new Date(request.resolvedat);
  if (resolved <= deadline) return 'No prazo';
  return 'Fora do prazo';
}

// Função para exportar para PDF
export function exportToPdf(requests: ITRequest[], filters: any) {
  // Criar o PDF em modo paisagem
  const doc = new jsPDF({ orientation: 'landscape' });
  
  // Título do relatório - fonte um pouco menor
  doc.setFontSize(16);
  doc.text('Relatório de Solicitações', 14, 22);
  doc.setFontSize(10);
  
  // Data de geração
  const today = format(new Date(), 'dd/MM/yyyy HH:mm');
  doc.text(`Gerado em: ${today}`, 14, 30);
  
  // Filtros aplicados
  let filtersText = 'Filtros: ';
  
  if (filters.status !== 'all') {
    filtersText += `Status: ${filters.status === 'pending' ? 'Pendentes' : filters.status}, `;
  }
  
  if (filters.type !== 'all') {
    filtersText += `Tipo: ${translateRequestType(filters.type)}, `;
  }
  
  if (filters.startDate) {
    filtersText += `De: ${format(filters.startDate, 'dd/MM/yyyy')}, `;
  }
  
  if (filters.endDate) {
    filtersText += `Até: ${format(filters.endDate, 'dd/MM/yyyy')}, `;
  }
  
  // Remove a última vírgula
  filtersText = filtersText.endsWith(', ') 
    ? filtersText.slice(0, -2) 
    : filtersText === 'Filtros: ' ? 'Filtros: Nenhum' : filtersText;
  
  doc.text(filtersText, 14, 38);
  
  // Preparar os dados para a tabela
  const tableColumn = [
    "ID",
    "Solicitante",
    "Tipo",
    "Prioridade",
    "Status",
    "Data Criação",
    "Data Resolução",
    "Vencimento",
    "Prazo",
    "Descrição"
  ];
  
  const tableRows = requests.map(request => [
    request.id,
    request.requestername,
    translateRequestType(request.type),
    translatePriority(request.priority),
    translateStatus(request.status),
    formatDateSafe(request.createdat),
    request.resolvedat ? formatDateSafe(request.resolvedat) : '-',
    formatDateSafe(request.deadlineat),
    getPrazoStatus(request),
    request.description
  ]);
  
  // Ajustar os espaçamentos das colunas para modo paisagem
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 45,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: 15 },  // ID
      1: { cellWidth: 28 },  // Solicitante
      2: { cellWidth: 22 },  // Tipo
      3: { cellWidth: 20 },  // Prioridade
      4: { cellWidth: 22 },  // Status
      5: { cellWidth: 22 },  // Data Criação
      6: { cellWidth: 26 },  // Data Resolução
      7: { cellWidth: 22 },  // Vencimento
      8: { cellWidth: 22 },  // Prazo
      9: { cellWidth: 80, overflow: 'linebreak' } // Descrição (bem mais larga)
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      valign: 'middle',
      minCellHeight: 14
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    willDrawCell: function(data) {
      if (data.column.index === 9) {
        doc.setFontSize(8);
      }
    }
  });
  
  // Número total de solicitações
  const finalY = (doc as any).lastAutoTable.finalY || 45;
  doc.setFontSize(10);
  doc.text(`Total de solicitações: ${requests.length}`, 14, finalY + 10);
  
  // Salvar o PDF
  doc.save('relatorio-solicitacoes.pdf');
}

// Função para exportar para Excel
export function exportToExcel(requests: ITRequest[], filters: any) {
  // Preparar os dados para o Excel
  const worksheetData = requests.map(request => ({
    'ID': request.id,
    'Solicitante': request.requestername,
    'Tipo': translateRequestType(request.type),
    'Prioridade': translatePriority(request.priority),
    'Status': translateStatus(request.status),
    'Data Criação': formatDateSafe(request.createdat),
    'Data Resolução': request.resolvedat ? formatDateSafe(request.resolvedat) : '-',
    'Vencimento': formatDateSafe(request.deadlineat),
    'Prazo': getPrazoStatus(request),
    'Descrição': request.description
  }));
  
  // Criar uma planilha
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  
  // Criar um livro
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Solicitações');
  
  // Gerar o arquivo Excel
  XLSX.writeFile(workbook, 'relatorio-solicitacoes.xlsx');
}
