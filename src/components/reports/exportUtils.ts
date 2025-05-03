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

// Função para exportar para PDF
export function exportToPdf(requests: ITRequest[], filters: any) {
  const doc = new jsPDF();
  
  // Título do relatório
  doc.setFontSize(18);
  doc.text('Relatório de Solicitações', 14, 22);
  doc.setFontSize(11);
  
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
    "Data", 
    "Tipo", 
    "Vencimento", 
    "Prioridade", 
    "Descrição"
  ];
  
  const tableRows = requests.map(request => [
    request.id,
    request.requesterName,
    format(new Date(request.createdAt), 'dd/MM/yyyy'),
    translateRequestType(request.type),
    format(new Date(request.deadlineAt), 'dd/MM/yyyy'),
    translatePriority(request.priority),
    request.description.substring(0, 30) + (request.description.length > 30 ? '...' : '')
  ]);
  
  // Criar a tabela
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 45,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      6: { cellWidth: 40 }
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    }
  });
  
  // Número total de solicitações
  const finalY = (doc as any).lastAutoTable.finalY || 45;
  doc.text(`Total de solicitações: ${requests.length}`, 14, finalY + 10);
  
  // Salvar o PDF
  doc.save('relatorio-solicitacoes.pdf');
}

// Função para exportar para Excel
export function exportToExcel(requests: ITRequest[], filters: any) {
  // Preparar os dados para o Excel
  const worksheetData = requests.map(request => ({
    'ID': request.id,
    'Solicitante': request.requesterName,
    'Data': format(new Date(request.createdAt), 'dd/MM/yyyy'),
    'Tipo': translateRequestType(request.type),
    'Vencimento': format(new Date(request.deadlineAt), 'dd/MM/yyyy'),
    'Prioridade': translatePriority(request.priority),
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
