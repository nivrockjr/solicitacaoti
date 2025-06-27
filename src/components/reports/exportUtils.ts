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
    request.description // Descrição completa, sem truncamento
  ]);
  
  // Criar a tabela com fonte menor
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 45,
    styles: {
      fontSize: 8, // Fonte menor
      cellPadding: 2, // Padding menor para caber mais informação
      overflow: 'linebreak' // Garantir que todo texto tenha quebra de linha
    },
    columnStyles: {
      0: { cellWidth: 20 }, // ID - diminuído
      1: { cellWidth: 30 }, // Solicitante
      2: { cellWidth: 20 }, // Data - diminuído
      3: { cellWidth: 25 }, // Tipo
      4: { cellWidth: 25 }, // Vencimento - aumentado para não quebrar
      5: { cellWidth: 20 }, // Prioridade - diminuído
      6: { 
        cellWidth: 50,  // Descrição - ajustado para dar mais espaço aos outros
        overflow: 'linebreak'
      }
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9, // Cabeçalho um pouco maior que o conteúdo
      halign: 'center', // Centralizar texto do cabeçalho
      valign: 'middle', // Alinhar verticalmente ao meio
      minCellHeight: 14 // Altura mínima para evitar quebras indesejadas
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    // Permite que o texto quebre em várias linhas
    willDrawCell: function(data) {
      if (data.column.index === 6) { // Coluna de descrição
        doc.setFontSize(8); // Certifica-se de que a fonte seja pequena o suficiente
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
    'Data': format(new Date(request.createdat!), 'dd/MM/yyyy'),
    'Tipo': translateRequestType(request.type!),
    'Vencimento': format(new Date(request.deadlineat!), 'dd/MM/yyyy'),
    'Prioridade': translatePriority(request.priority!),
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
