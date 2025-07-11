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

// Função para extrair motivo da rejeição
function getMotivoRejeicao(request) {
  if (request.approvalstatus === 'rejected' && Array.isArray(request.comments)) {
    const motivo = request.comments.find(c => c.text && c.text.startsWith('[REJEITADA]'));
    return motivo ? motivo.text.replace('[REJEITADA]', '').trim() : '';
  }
  return '';
}

// Função para exportar para PDF
export function exportToPdf(requests: ITRequest[], filters: any) {
  // Criar o PDF em modo paisagem
  const doc = new jsPDF({ orientation: 'landscape' });
  
  // Cabeçalho discreto no topo
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80); // cinza escuro
  doc.text('Relatório de Solicitações', 14, 14);
  const today = format(new Date(), 'dd/MM/yyyy HH:mm');
  doc.text(`Gerado em: ${today}`, 14, 19);
  let filtersText = 'Filtros: ';
  if (filters.status && filters.status !== 'all') {
    filtersText += `Status: ${filters.status}, `;
  }
  if (filters.type && filters.type !== 'all') {
    filtersText += `Tipo: ${translateRequestType(filters.type)}, `;
  }
  if (filters.startDate) {
    filtersText += `De: ${format(filters.startDate, 'dd/MM/yyyy')}, `;
  }
  if (filters.endDate) {
    filtersText += `Até: ${format(filters.endDate, 'dd/MM/yyyy')}, `;
  }
  filtersText = filtersText.endsWith(', ')
    ? filtersText.slice(0, -2)
    : filtersText === 'Filtros: ' ? 'Filtros: Nenhum' : filtersText;
  doc.text(filtersText, 14, 24);
  doc.setTextColor(0, 0, 0); // volta para preto

  // Preparar os dados para a tabela
  // Montar colunas dinamicamente
  let isRejeitada = filters.status === 'rejeitada';
  const tableColumn = [
    "ID",
    "Solicitante",
    "Tipo",
    "Prioridade",
    "Status",
    "Data Criação"
  ];
  if (!isRejeitada) {
    tableColumn.push("Data Resolução", "Vencimento", "Prazo");
  }
  tableColumn.push("Descrição");
  if (isRejeitada) {
    tableColumn.push("Motivo Rejeição");
  }

  const tableRows = requests.map(request => {
    const row = [
      request.id,
      request.requestername,
      translateRequestType(request.type),
      translatePriority(request.priority),
      translateStatus(request.status),
      formatDateSafe(request.createdat)
    ];
    if (!isRejeitada) {
      row.push(
        request.resolvedat ? formatDateSafe(request.resolvedat) : '-',
        formatDateSafe(request.deadlineat),
        getPrazoStatus(request)
      );
    }
    row.push(request.description);
    if (isRejeitada) {
      row.push(getMotivoRejeicao(request));
    }
    return row;
  });
  
  // Definir margens
  const marginLeft = 14;
  const marginRight = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const totalWidth = pageWidth - marginLeft - marginRight;

  // Definir larguras fixas das colunas exceto a última
  // Para rejeitadas, remover Data Resolução, Vencimento e Prazo
  const colWidths = isRejeitada
    ? [26, 25, 20, 25, 25, 22, 50] // ID, Solicitante, Tipo, Prioridade, Status, Data Criação, Descrição (50 fixo)
    : [26, 25, 20, 25, 25, 22, 22, 26, 20]; // + Data Resolução, Vencimento, Prazo
  let sumFixed = colWidths.reduce((a, b) => a + b, 0);
  // Calcular largura da última coluna
  const lastColWidth = totalWidth - sumFixed;

  // Montar columnStyles dinamicamente
  const columnStyles = {
    0: { cellWidth: 26, cellPadding: 2, halign: 'left', valign: 'middle', fontStyle: 'bold' },
    1: { cellWidth: 25 },
    2: { cellWidth: 20 },
    3: { cellWidth: 25 },
    4: { cellWidth: 25 },
    5: { cellWidth: 22 },
  };
  if (!isRejeitada) {
    columnStyles[6] = { cellWidth: 22 };
    columnStyles[7] = { cellWidth: 26 };
    columnStyles[8] = { cellWidth: 20 };
    columnStyles[9] = { cellWidth: lastColWidth, overflow: 'linebreak' }; // Descrição
  } else {
    columnStyles[6] = { cellWidth: 50, overflow: 'linebreak' }; // Descrição
    columnStyles[7] = { cellWidth: lastColWidth, overflow: 'linebreak' }; // Motivo Rejeição
  }

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 26,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
      halign: 'left',
    },
    columnStyles,
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'left',
      valign: 'middle',
      minCellHeight: 14
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    margin: { left: marginLeft, right: marginRight },
  });
  
  // Número total de solicitações
  const finalY = (doc as any).lastAutoTable.finalY || 26;
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80); // cinza escuro
  doc.text(`Total de solicitações: ${requests.length}`, 14, finalY + 10);
  doc.setTextColor(0, 0, 0); // volta para preto
  
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
    'Descrição': request.description,
    'Motivo da Rejeição': getMotivoRejeicao(request)
  }));
  
  // Criar uma planilha
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  
  // Criar um livro
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Solicitações');
  
  // Gerar o arquivo Excel
  XLSX.writeFile(workbook, 'relatorio-solicitacoes.xlsx');
}
