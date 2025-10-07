import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata horário para exibição
 */
const formatarHorario = (horario) => {
  if (!horario) return '--:--';
  if (typeof horario === 'string') {
    // Se já está formatado
    if (horario.match(/^\d{2}:\d{2}$/)) return horario;
    // Se é ISO string
    try {
      const date = new Date(horario);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  }
  if (horario instanceof Date) {
    return horario.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  return '--:--';
};

/**
 * Formata data para exibição
 */
const formatarData = (data) => {
  if (!data) return '';
  try {
    const date = typeof data === 'string' ? new Date(data) : data;
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '';
  }
};

/**
 * Agrupa pontos por data
 */
const agruparPontosPorData = (pontos) => {
  const agrupado = {};
  
  pontos.forEach(ponto => {
    const data = formatarData(ponto.data);
    if (!data) return;
    
    if (!agrupado[data]) {
      agrupado[data] = {
        data,
        entrada: null,
        saida_almoco: null,
        retorno_almoco: null,
        saida: null
      };
    }
    
    agrupado[data][ponto.tipo] = ponto.data;
  });
  
  return Object.values(agrupado);
};

/**
 * Calcula horas trabalhadas no dia
 */
const calcularHorasDia = (registro) => {
  const { entrada, saida_almoco, retorno_almoco, saida } = registro;
  
  if (!entrada || !saida) return '--:--';
  
  const e = new Date(entrada);
  const s = new Date(saida);
  
  let totalMinutos = (s - e) / 1000 / 60;
  
  // Subtrair intervalo de almoço se houver
  if (saida_almoco && retorno_almoco) {
    const sa = new Date(saida_almoco);
    const ra = new Date(retorno_almoco);
    const almocoMinutos = (ra - sa) / 1000 / 60;
    totalMinutos -= almocoMinutos;
  }
  
  const horas = Math.floor(totalMinutos / 60);
  const minutos = Math.floor(totalMinutos % 60);
  
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
};

/**
 * Exporta pontos para Excel (.xlsx)
 */
export const exportarPontosParaExcel = (pontos, funcionario, periodo = {}) => {
  if (!pontos || pontos.length === 0) {
    alert('Nenhum ponto para exportar');
    return;
  }

  // Agrupar pontos por data
  const pontosAgrupados = agruparPontosPorData(pontos);
  
  // Ordenar por data mais recente
  pontosAgrupados.sort((a, b) => {
    const [diaA, mesA, anoA] = a.data.split('/');
    const [diaB, mesB, anoB] = b.data.split('/');
    const dataA = new Date(anoA, mesA - 1, diaA);
    const dataB = new Date(anoB, mesB - 1, diaB);
    return dataB - dataA;
  });

  // Preparar dados para o Excel
  const dados = pontosAgrupados.map(registro => ({
    'Data': registro.data,
    'Dia da Semana': (() => {
      const [dia, mes, ano] = registro.data.split('/');
      const date = new Date(ano, mes - 1, dia);
      return format(date, 'EEEE', { locale: ptBR });
    })(),
    'Entrada': formatarHorario(registro.entrada),
    'Saída Almoço': formatarHorario(registro.saida_almoco),
    'Retorno': formatarHorario(registro.retorno_almoco),
    'Saída': formatarHorario(registro.saida),
    'Horas Trabalhadas': calcularHorasDia(registro)
  }));

  // Calcular totais
  let totalHoras = 0;
  let totalMinutos = 0;
  
  pontosAgrupados.forEach(registro => {
    const horas = calcularHorasDia(registro);
    if (horas !== '--:--') {
      const [h, m] = horas.split(':').map(Number);
      totalHoras += h;
      totalMinutos += m;
    }
  });
  
  totalHoras += Math.floor(totalMinutos / 60);
  totalMinutos = totalMinutos % 60;

  // Adicionar linha de total
  dados.push({
    'Data': '',
    'Dia da Semana': '',
    'Entrada': '',
    'Saída Almoço': '',
    'Retorno': '',
    'Saída': 'TOTAL:',
    'Horas Trabalhadas': `${String(totalHoras).padStart(2, '0')}:${String(totalMinutos).padStart(2, '0')}`
  });

  // Criar workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(dados);

  // Ajustar largura das colunas
  const colWidths = [
    { wch: 12 },  // Data
    { wch: 15 },  // Dia da Semana
    { wch: 10 },  // Entrada
    { wch: 14 },  // Saída Almoço
    { wch: 10 },  // Retorno
    { wch: 10 },  // Saída
    { wch: 18 }   // Horas Trabalhadas
  ];
  ws['!cols'] = colWidths;

  // Adicionar cabeçalho personalizado
  XLSX.utils.sheet_add_aoa(ws, [
    ['WORKFLOW - SISTEMA DE PONTO ELETRÔNICO'],
    [`Funcionário: ${funcionario.nome || 'N/A'}`],
    [`Empresa: ${funcionario.empresa || 'N/A'}   |   Setor: ${funcionario.setor || 'N/A'}   |   Cargo: ${funcionario.cargo || funcionario.funcao || 'N/A'}`],
    [`Período: ${periodo.inicio || 'Últimos 30 dias'} ${periodo.fim ? `até ${periodo.fim}` : ''}`],
    [`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`],
    [] // Linha vazia
  ], { origin: 'A1' });

  // Estilizar cabeçalho (se suportado)
  const range = XLSX.utils.decode_range(ws['!ref']);
  
  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Pontos');

  // Gerar nome do arquivo
  const nomeArquivo = `Pontos_${funcionario.nome?.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.xlsx`;
  
  // Salvar arquivo
  XLSX.writeFile(wb, nomeArquivo);
  
  return nomeArquivo;
};

/**
 * Exporta pontos para CSV
 */
export const exportarPontosParaCSV = (pontos, funcionario, periodo = {}) => {
  if (!pontos || pontos.length === 0) {
    alert('Nenhum ponto para exportar');
    return;
  }

  // Agrupar pontos por data
  const pontosAgrupados = agruparPontosPorData(pontos);
  
  // Ordenar por data mais recente
  pontosAgrupados.sort((a, b) => {
    const [diaA, mesA, anoA] = a.data.split('/');
    const [diaB, mesB, anoB] = b.data.split('/');
    const dataA = new Date(anoA, mesA - 1, diaA);
    const dataB = new Date(anoB, mesB - 1, diaB);
    return dataB - dataA;
  });

  // Cabeçalho do CSV
  let csv = 'WORKFLOW - SISTEMA DE PONTO ELETRÔNICO\n';
  csv += `Funcionário: ${funcionario.nome || 'N/A'}\n`;
  csv += `Empresa: ${funcionario.empresa || 'N/A'} | Setor: ${funcionario.setor || 'N/A'} | Cargo: ${funcionario.cargo || funcionario.funcao || 'N/A'}\n`;
  csv += `Período: ${periodo.inicio || 'Últimos 30 dias'} ${periodo.fim ? `até ${periodo.fim}` : ''}\n`;
  csv += `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}\n\n`;

  // Cabeçalhos das colunas
  csv += 'Data;Dia da Semana;Entrada;Saída Almoço;Retorno;Saída;Horas Trabalhadas\n';

  // Dados
  let totalHoras = 0;
  let totalMinutos = 0;

  pontosAgrupados.forEach(registro => {
    const [dia, mes, ano] = registro.data.split('/');
    const date = new Date(ano, mes - 1, dia);
    const diaSemana = format(date, 'EEEE', { locale: ptBR });
    
    const horas = calcularHorasDia(registro);
    if (horas !== '--:--') {
      const [h, m] = horas.split(':').map(Number);
      totalHoras += h;
      totalMinutos += m;
    }

    csv += `${registro.data};${diaSemana};${formatarHorario(registro.entrada)};${formatarHorario(registro.saida_almoco)};${formatarHorario(registro.retorno_almoco)};${formatarHorario(registro.saida)};${horas}\n`;
  });

  // Total
  totalHoras += Math.floor(totalMinutos / 60);
  totalMinutos = totalMinutos % 60;
  csv += `;;;;TOTAL:;${String(totalHoras).padStart(2, '0')}:${String(totalMinutos).padStart(2, '0')}\n`;

  // Criar blob e download
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const nomeArquivo = `Pontos_${funcionario.nome?.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', nomeArquivo);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  return nomeArquivo;
};

/**
 * Exporta resumo mensal para Excel
 */
export const exportarResumoMensal = (pontos, funcionario, mes, ano, resumo = {}) => {
  if (!pontos || pontos.length === 0) {
    alert('Nenhum ponto para exportar');
    return;
  }

  // Preparar dados resumidos
  const dados = [
    { 'Indicador': 'Total de Dias Trabalhados', 'Valor': resumo.diasTrabalhados || '--' },
    { 'Indicador': 'Total de Horas Trabalhadas', 'Valor': resumo.totalHorasFormatado || '--:--' },
    { 'Indicador': 'Média de Horas por Dia', 'Valor': resumo.mediaHorasDia || '--:--' },
    { 'Indicador': 'Horas Extras', 'Valor': resumo.horasExtrasFormatado || '--:--' },
    { 'Indicador': 'Horas Negativas', 'Valor': resumo.horasNegativasFormatado || '--:--' },
    { 'Indicador': 'Advertências', 'Valor': resumo.totalAdvertencias || 0 },
    { 'Indicador': 'Faltas', 'Valor': resumo.faltas || 0 },
    { 'Indicador': 'Assiduidade', 'Valor': resumo.temAssiduidade ? 'SIM ✓' : 'NÃO' },
    { 'Indicador': 'Prêmio Assiduidade', 'Valor': resumo.premioAssiduidade || 'R$ 0,00' }
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(dados);

  // Ajustar largura das colunas
  ws['!cols'] = [{ wch: 30 }, { wch: 20 }];

  // Adicionar cabeçalho
  const mesNome = format(new Date(ano, mes - 1), 'MMMM', { locale: ptBR }).toUpperCase();
  
  XLSX.utils.sheet_add_aoa(ws, [
    ['WORKFLOW - RESUMO MENSAL DE PONTO'],
    [`Funcionário: ${funcionario.nome || 'N/A'}`],
    [`Mês/Ano: ${mesNome}/${ano}`],
    [`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`],
    []
  ], { origin: 'A1' });

  XLSX.utils.book_append_sheet(wb, ws, 'Resumo');

  const nomeArquivo = `Resumo_${funcionario.nome?.replace(/\s+/g, '_')}_${ano}${String(mes).padStart(2, '0')}.xlsx`;
  XLSX.writeFile(wb, nomeArquivo);
  
  return nomeArquivo;
};
