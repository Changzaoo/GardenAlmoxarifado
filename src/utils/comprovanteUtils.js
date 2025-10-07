import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Gera código de assinatura único com prefixo
 */
const gerarCodigoAssinatura = (tipo, id) => {
  const prefixos = {
    emprestimo: 'WF-EMP',
    devolucao: 'WF-DEV',
    tarefa: 'WF-TAR',
    avaliacao: 'WF-AVL'
  };
  
  const prefixo = prefixos[tipo] || 'WF-DOC';
  const timestamp = Date.now().toString(36).toUpperCase();
  const idCurto = id ? id.substring(0, 8).toUpperCase() : Math.random().toString(36).substring(2, 10).toUpperCase();
  
  return `${prefixo}-${timestamp}-${idCurto}`;
};

/**
 * Gera PDF de comprovante universal (empréstimo, devolução, tarefa, avaliação)
 * Formato otimizado para tela de celular (210mm x 297mm - A4, mas design mobile)
 */
export const gerarComprovantePDF = (tipo, dados) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 20;

  // Gerar código de assinatura
  const codigoAssinatura = dados.codigoAssinatura || gerarCodigoAssinatura(tipo, dados.id);

  // Cores baseadas no tipo
  const cores = {
    emprestimo: { r: 59, g: 130, b: 246 }, // blue-500
    devolucao: { r: 34, g: 197, b: 94 }, // green-500
    tarefa: { r: 168, g: 85, b: 247 }, // purple-500
    avaliacao: { r: 249, g: 115, b: 22 } // orange-500
  };

  const cor = cores[tipo] || cores.emprestimo;

  // Header com fundo azul gradiente
  pdf.setFillColor(59, 130, 246); // blue-500
  pdf.rect(0, 0, pageWidth, 50, 'F');

  // Adicionar logo do WorkFlow
  try {
    const logoImg = new Image();
    logoImg.src = '/logo.png';
    
    // Esperar a imagem carregar (ou usar sincrono se já estiver no cache)
    if (logoImg.complete) {
      // Círculo branco de fundo
      pdf.setFillColor(255, 255, 255);
      pdf.circle(25, 18, 8, 'F');
      
      // Adicionar a imagem do logo
      pdf.addImage(logoImg, 'PNG', 18, 11, 14, 14);
    } else {
      // Fallback: círculo branco com W
      pdf.setFillColor(255, 255, 255);
      pdf.circle(25, 18, 8, 'F');
      pdf.setFontSize(10);
      pdf.setTextColor(59, 130, 246);
      pdf.setFont('helvetica', 'bold');
      pdf.text('W', 25, 20, { align: 'center' });
    }
  } catch (error) {
    // Fallback caso haja erro ao carregar imagem
    pdf.setFillColor(255, 255, 255);
    pdf.circle(25, 18, 8, 'F');
    pdf.setFontSize(10);
    pdf.setTextColor(59, 130, 246);
    pdf.setFont('helvetica', 'bold');
    pdf.text('W', 25, 20, { align: 'center' });
  }

  // Título WorkFlow
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('WorkFlow', 38, 19);
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Sistema de Gestão', 38, 24);
  
  const titulos = {
    emprestimo: 'Comprovante de Empréstimo',
    devolucao: 'Comprovante de Devolução',
    tarefa: 'Comprovante de Tarefa',
    avaliacao: 'Comprovante de Avaliação'
  };
  
  // Título do comprovante
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(titulos[tipo] || 'Comprovante', pageWidth / 2, 38, { align: 'center' });

  // Data e hora
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const dataFormatada = format(new Date(dados.data || Date.now()), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  pdf.text(dataFormatada, pageWidth / 2, 45, { align: 'center' });

  yPosition = 58;

  // Volta para texto preto
  pdf.setTextColor(0, 0, 0);

  // Box com quantidade/status
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(40, yPosition, pageWidth - 80, 25, 3, 3, 'FD');
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  const statusTexto = tipo === 'emprestimo' ? 'Emprestado' : tipo === 'devolucao' ? 'Devolvido' : 'Concluído';
  pdf.text(statusTexto, pageWidth / 2, yPosition + 8, { align: 'center' });
  
  pdf.setFontSize(32);
  pdf.text(String(dados.quantidade || 0), pageWidth / 2, yPosition + 18, { align: 'center' });
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const itemTexto = tipo === 'tarefa' ? 'Tarefa' : tipo === 'avaliacao' ? 'Avaliação' : 'Ferramentas';
  pdf.text(itemTexto, pageWidth / 2, yPosition + 23, { align: 'center' });

  yPosition += 35;

  // Linha separadora
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineDash([2, 2]);
  pdf.line(20, yPosition, pageWidth - 20, yPosition);
  pdf.setLineDash([]);

  yPosition += 10;

  // Informações principais
  const addSection = (label, value) => {
    if (!value || value === 'N/A') return;
    
    pdf.setFontSize(8);
    pdf.setTextColor(107, 114, 128);
    pdf.text(label, 25, yPosition);
    
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text(String(value), 25, yPosition + 5);
    pdf.setFont('helvetica', 'normal');
    
    yPosition += 12;
  };

  // Responsável/Colaborador (destaque especial)
  if (dados.colaborador || dados.funcionario || dados.para) {
    pdf.setFillColor(239, 246, 255); // blue-50
    pdf.setDrawColor(191, 219, 254); // blue-200
    pdf.roundedRect(25, yPosition, pageWidth - 50, 18, 3, 3, 'FD');
    
    pdf.setFontSize(7);
    pdf.setTextColor(30, 64, 175); // blue-900
    pdf.setFont('helvetica', 'bold');
    pdf.text('RESPONSÁVEL', 28, yPosition + 5);
    
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text(dados.colaborador || dados.funcionario || dados.para, 28, yPosition + 11);
    
    if (dados.paraCPF || dados.colaboradorCPF) {
      pdf.setFontSize(8);
      pdf.setTextColor(75, 85, 99);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`CPF: ${dados.paraCPF || dados.colaboradorCPF}`, 28, yPosition + 16);
    }
    
    yPosition += 22;
  }

  // De (remetente)
  if (dados.remetenteNome || dados.de) {
    addSection('De', dados.remetenteNome || dados.de);
    if (dados.remetenteCPF || dados.deCPF) {
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`CPF: ${dados.remetenteCPF || dados.deCPF}`, 25, yPosition);
      yPosition += 8;
    }
  }

  // Para (destinatário) - só se não foi usado como responsável
  if (dados.destinatarioNome && !dados.colaborador && !dados.funcionario && !dados.para) {
    addSection('Para', dados.destinatarioNome);
    if (dados.destinatarioCPF) {
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`CPF: ${dados.destinatarioCPF}`, 25, yPosition);
      yPosition += 8;
    }
  }

  // Empresa/Setor
  if (dados.empresa) {
    addSection('Empresa', dados.empresa);
    if (dados.setor) {
      pdf.setFontSize(9);
      pdf.setTextColor(75, 85, 99);
      pdf.text(`Setor: ${dados.setor}`, 25, yPosition);
      yPosition += 8;
    }
  }

  // Data e Hora detalhadas
  addSection('Data', format(new Date(dados.data || Date.now()), 'dd/MM/yyyy', { locale: ptBR }));
  pdf.setFontSize(9);
  pdf.setTextColor(75, 85, 99);
  pdf.text(format(new Date(dados.data || Date.now()), 'HH:mm:ss', { locale: ptBR }), 25, yPosition);
  yPosition += 10;

  // Número da transação
  if (dados.id) {
    pdf.setFontSize(8);
    pdf.setTextColor(107, 114, 128);
    pdf.text('Número da Transação', 25, yPosition);
    pdf.setFontSize(8);
    pdf.setFont('courier', 'normal');
    pdf.text(dados.id.substring(0, 30) + '...', 25, yPosition + 4);
    pdf.setFont('helvetica', 'normal');
    yPosition += 10;
  }

  // Linha separadora
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineDash([2, 2]);
  pdf.line(20, yPosition, pageWidth - 20, yPosition);
  pdf.setLineDash([]);

  yPosition += 8;

  // Lista de ferramentas/itens
  if ((dados.ferramentas || dados.itens) && (dados.ferramentas?.length > 0 || dados.itens?.length > 0)) {
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text(tipo === 'emprestimo' || tipo === 'devolucao' ? 'Ferramentas' : 'Itens', 25, yPosition);
    yPosition += 8;

    const itens = dados.ferramentas || dados.itens;
    itens.forEach((item, index) => {
      // Verifica se precisa de nova página
      if (yPosition > pdf.internal.pageSize.getHeight() - 30) {
        pdf.addPage();
        yPosition = 20;
      }

      // Box do item
      pdf.setFillColor(249, 250, 251);
      pdf.setDrawColor(229, 231, 235);
      pdf.roundedRect(25, yPosition, pageWidth - 50, 12, 2, 2, 'FD');

      // Número do item
      pdf.setFillColor(cor.r, cor.g, cor.b);
      pdf.setDrawColor(cor.r, cor.g, cor.b);
      pdf.roundedRect(28, yPosition + 2, 8, 8, 1, 1, 'FD');
      
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text(String(index + 1), 32, yPosition + 7, { align: 'center' });

      // Nome do item
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const nomeItem = item.nome || item.descricao || item;
      pdf.text(String(nomeItem), 40, yPosition + 7);

      // Código (se houver)
      if (item.codigo) {
        pdf.setFontSize(7);
        pdf.setTextColor(107, 114, 128);
        pdf.text(`Código: ${item.codigo}`, 40, yPosition + 10.5);
      }

      // Quantidade (se houver)
      if (item.quantidade) {
        pdf.setFontSize(9);
        pdf.setTextColor(75, 85, 99);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`x${item.quantidade}`, pageWidth - 30, yPosition + 7);
      }

      yPosition += 14;
    });
  }

  yPosition += 5;

  // Observações
  if (dados.observacoes) {
    // Verifica se precisa de nova página
    if (yPosition > pdf.internal.pageSize.getHeight() - 60) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFillColor(254, 249, 195);
    pdf.setDrawColor(250, 204, 21);
    pdf.setLineWidth(2);
    pdf.rect(25, yPosition, pageWidth - 50, 20, 'FD');

    pdf.setFontSize(10);
    pdf.setTextColor(146, 64, 14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Observações', 28, yPosition + 6);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(113, 63, 18);
    const maxWidth = pageWidth - 56;
    const linhasObs = pdf.splitTextToSize(dados.observacoes, maxWidth);
    pdf.text(linhasObs, 28, yPosition + 12);

    yPosition += 25;
  }

  // Verifica se precisa de nova página para assinatura e footer
  if (yPosition > pdf.internal.pageSize.getHeight() - 55) {
    pdf.addPage();
    yPosition = 20;
  }

  // Código de Assinatura Digital
  pdf.setFillColor(238, 242, 255); // indigo-50
  pdf.setDrawColor(165, 180, 252); // indigo-300
  pdf.setLineWidth(1.5);
  pdf.roundedRect(25, yPosition, pageWidth - 50, 22, 3, 3, 'FD');

  pdf.setFontSize(7);
  pdf.setTextColor(49, 46, 129); // indigo-900
  pdf.setFont('helvetica', 'bold');
  pdf.text('✓ ASSINATURA DIGITAL', 28, yPosition + 5);

  pdf.setFontSize(14);
  pdf.setFont('courier', 'bold');
  pdf.setTextColor(67, 56, 202); // indigo-700
  pdf.text(codigoAssinatura, pageWidth / 2, yPosition + 13, { align: 'center' });

  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(79, 70, 229); // indigo-600
  pdf.text('Use este código para buscar o comprovante', pageWidth / 2, yPosition + 18, { align: 'center' });

  yPosition += 25;

  // Footer com selo de garantia
  yPosition = pdf.internal.pageSize.getHeight() - 28;
  pdf.setFillColor(239, 246, 255); // blue-50
  pdf.rect(0, yPosition, pageWidth, 30, 'F');

  // Selo de garantia
  pdf.setFillColor(59, 130, 246); // blue-500
  pdf.circle(pageWidth / 2, yPosition + 8, 3, 'F');
  
  pdf.setFontSize(9);
  pdf.setTextColor(30, 64, 175); // blue-900
  pdf.setFont('helvetica', 'bold');
  pdf.text('DOCUMENTO GARANTIDO', pageWidth / 2, yPosition + 8, { align: 'center' });

  pdf.setFontSize(7);
  pdf.setTextColor(37, 99, 235); // blue-600
  pdf.setFont('helvetica', 'normal');
  pdf.text('Este comprovante é válido e confiável, certificado pela equipe WorkFlow.', pageWidth / 2, yPosition + 13, { align: 'center' });
  pdf.text('Documento gerado automaticamente com segurança e rastreabilidade.', pageWidth / 2, yPosition + 17, { align: 'center' });
  
  pdf.setFontSize(6);
  pdf.setTextColor(107, 114, 128);
  pdf.setFont('courier', 'normal');
  pdf.text(format(new Date(), 'dd/MM/yyyy HH:mm:ss'), pageWidth / 2, yPosition + 23, { align: 'center' });

  // Gera o nome do arquivo
  const nomeArquivo = `${tipo}_${dados.id?.substring(0, 8) || 'comprovante'}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;

  // Salva o PDF
  pdf.save(nomeArquivo);
};

/**
 * Compartilha o PDF via Web Share API ou download
 */
export const compartilharComprovantePDF = async (tipo, dados) => {
  // Se o navegador suporta Web Share API
  if (navigator.share) {
    try {
      // Gera o PDF em blob
      const pdf = new jsPDF();
      // ... (mesmo código de geração acima)
      const pdfBlob = pdf.output('blob');
      const fileName = `${tipo}_${dados.id?.substring(0, 8) || 'comprovante'}.pdf`;
      
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      await navigator.share({
        files: [file],
        title: `Comprovante de ${tipo}`,
        text: `Comprovante gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      // Se falhar, faz download normal
      gerarComprovantePDF(tipo, dados);
      return false;
    }
  } else {
    // Navegador não suporta Web Share, faz download
    gerarComprovantePDF(tipo, dados);
    return false;
  }
};

/**
 * Gera PDF de comprovante de ponto eletrônico
 */
export const gerarPDFComprovantePonto = (dados) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 20;

  const {
    funcionarioNome,
    empresa,
    setor,
    cargo,
    cpf,
    data,
    pontos = {},
    horasEsperadas,
    horasTrabalhadas,
    saldo,
    advertencias = [],
    codigoAssinatura,
    observacoes
  } = dados;

  // Gerar código de assinatura se não existir
  const codigo = codigoAssinatura || `WF-PONTO-${Date.now().toString(36).toUpperCase()}`;

  // Formatar horários
  const formatarHorario = (horario) => {
    if (!horario) return '--:--';
    if (typeof horario === 'string') return horario;
    const date = new Date(horario);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Header com fundo verde
  pdf.setFillColor(22, 163, 74); // green-600
  pdf.rect(0, 0, pageWidth, 50, 'F');

  // Título
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('WorkFlow', 20, 25);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Sistema de Ponto Eletrônico', 20, 32);

  // Tipo de documento
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('COMPROVANTE DE PONTO', pageWidth - 20, 25, { align: 'right' });

  // Data
  const dataFormatada = data ? format(new Date(data), "dd/MM/yyyy", { locale: ptBR }) : format(new Date(), "dd/MM/yyyy", { locale: ptBR });
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(dataFormatada, pageWidth / 2, 42, { align: 'center' });

  yPosition = 60;

  // Informações do Funcionário
  pdf.setFillColor(249, 250, 251); // gray-50
  pdf.rect(15, yPosition, pageWidth - 30, 40, 'F');

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('FUNCIONÁRIO', 20, yPosition + 8);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Nome: ${funcionarioNome || 'N/A'}`, 20, yPosition + 16);
  pdf.text(`Empresa: ${empresa || 'N/A'}`, 20, yPosition + 24);
  pdf.text(`Setor: ${setor || 'N/A'}`, 20, yPosition + 32);
  pdf.text(`Cargo: ${cargo || 'N/A'}`, pageWidth / 2 + 10, yPosition + 24);
  pdf.text(`CPF: ${cpf || 'N/A'}`, pageWidth / 2 + 10, yPosition + 32);

  yPosition += 50;

  // Tabela de Registros
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('REGISTROS DE PONTO', 20, yPosition);

  yPosition += 8;

  // Cabeçalho da tabela
  pdf.setFillColor(229, 231, 235); // gray-200
  pdf.rect(15, yPosition, pageWidth - 30, 8, 'F');
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Tipo', 20, yPosition + 5);
  pdf.text('Horário Registrado', 70, yPosition + 5);
  pdf.text('Horário Esperado', 125, yPosition + 5);
  pdf.text('Status', 175, yPosition + 5);

  yPosition += 8;

  // Linhas da tabela
  const registros = [
    { label: 'Entrada', campo: 'entrada', esperado: horasEsperadas?.entrada },
    { label: 'Saída p/ Almoço', campo: 'saida_almoco', esperado: horasEsperadas?.almoco },
    { label: 'Retorno', campo: 'retorno_almoco', esperado: horasEsperadas?.retorno },
    { label: 'Saída', campo: 'saida', esperado: horasEsperadas?.saida }
  ];

  pdf.setFont('helvetica', 'normal');
  registros.forEach((reg, idx) => {
    if (idx % 2 === 0) {
      pdf.setFillColor(249, 250, 251); // gray-50
      pdf.rect(15, yPosition, pageWidth - 30, 10, 'F');
    }

    pdf.text(reg.label, 20, yPosition + 7);
    pdf.setFont('helvetica', 'bold');
    pdf.text(formatarHorario(pontos[reg.campo]), 70, yPosition + 7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(reg.esperado || '--:--', 125, yPosition + 7);
    
    if (pontos[reg.campo]) {
      pdf.setTextColor(34, 197, 94); // green-600
      pdf.text('✓ Registrado', 175, yPosition + 7);
      pdf.setTextColor(0, 0, 0);
    } else {
      pdf.setTextColor(156, 163, 175); // gray-400
      pdf.text('Não batido', 175, yPosition + 7);
      pdf.setTextColor(0, 0, 0);
    }

    yPosition += 10;
  });

  yPosition += 10;

  // Resumo de Horas
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RESUMO DE HORAS', 20, yPosition);

  yPosition += 10;

  const saldoMinutos = saldo?.saldoMinutos || 0;
  const saldoCor = saldoMinutos >= 0 ? [34, 197, 94] : [239, 68, 68]; // green-600 : red-500

  // Boxes de resumo
  const boxWidth = (pageWidth - 40) / 3;
  
  // Horas Esperadas
  pdf.setFillColor(219, 234, 254); // blue-100
  pdf.rect(15, yPosition, boxWidth - 2, 20, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Horas Esperadas', 15 + boxWidth / 2, yPosition + 6, { align: 'center' });
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(horasTrabalhadas?.esperadasFormatado || '--:--', 15 + boxWidth / 2, yPosition + 15, { align: 'center' });

  // Horas Trabalhadas
  pdf.setFillColor(243, 232, 255); // purple-100
  pdf.rect(15 + boxWidth, yPosition, boxWidth - 2, 20, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Horas Trabalhadas', 15 + boxWidth + boxWidth / 2, yPosition + 6, { align: 'center' });
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(horasTrabalhadas?.formatado || '--:--', 15 + boxWidth + boxWidth / 2, yPosition + 15, { align: 'center' });

  // Saldo
  pdf.setFillColor(saldoMinutos >= 0 ? 220 : 254, saldoMinutos >= 0 ? 252 : 226, saldoMinutos >= 0 ? 231 : 230); // green-100 : red-100
  pdf.rect(15 + boxWidth * 2, yPosition, boxWidth, 20, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Saldo', 15 + boxWidth * 2 + boxWidth / 2, yPosition + 6, { align: 'center' });
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...saldoCor);
  pdf.text(saldo?.saldoFormatado || '--:--', 15 + boxWidth * 2 + boxWidth / 2, yPosition + 15, { align: 'center' });
  pdf.setTextColor(0, 0, 0);

  yPosition += 30;

  // Advertências (se houver)
  if (advertencias && advertencias.length > 0) {
    pdf.setFillColor(254, 226, 226); // red-100
    pdf.rect(15, yPosition, pageWidth - 30, 10 + (advertencias.length * 6), 'F');
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(153, 27, 27); // red-900
    pdf.text(`ADVERTÊNCIAS (${advertencias.length})`, 20, yPosition + 7);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    advertencias.forEach((adv, idx) => {
      pdf.text(`• ${adv}`, 20, yPosition + 14 + (idx * 6));
    });
    
    pdf.setTextColor(0, 0, 0);
    yPosition += 10 + (advertencias.length * 6) + 5;
  }

  // Observações (se houver)
  if (observacoes) {
    pdf.setFillColor(254, 249, 195); // yellow-100
    pdf.rect(15, yPosition, pageWidth - 30, 15, 'F');
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Observações:', 20, yPosition + 7);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(observacoes, 20, yPosition + 13);
    
    yPosition += 20;
  }

  // Assinatura Digital
  yPosition += 10;
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.line(15, yPosition, pageWidth - 15, yPosition);
  
  yPosition += 8;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Assinatura Digital:', 20, yPosition);
  
  yPosition += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(codigo, pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 8;
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(7);
  pdf.text('Este é um documento digital válido emitido pelo sistema WorkFlow', pageWidth / 2, yPosition, { align: 'center' });
  pdf.text('Verifique a autenticidade através do código de assinatura', pageWidth / 2, yPosition + 4, { align: 'center' });

  // Rodapé
  const rodapeY = pdf.internal.pageSize.getHeight() - 10;
  pdf.setFillColor(22, 163, 74); // green-600
  pdf.rect(0, rodapeY - 5, pageWidth, 15, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`WorkFlow © ${new Date().getFullYear()} - Sistema de Gestão Empresarial`, pageWidth / 2, rodapeY, { align: 'center' });

  // Salvar PDF
  const nomeArquivo = `Ponto_${funcionarioNome?.replace(/\s+/g, '_')}_${dataFormatada.replace(/\//g, '-')}.pdf`;
  pdf.save(nomeArquivo);

  return pdf;
};
