import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Gera PDF de comprovante universal (empréstimo, devolução, tarefa, avaliação)
 */
export const gerarComprovantePDF = (tipo, dados) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 20;

  // Cores baseadas no tipo
  const cores = {
    emprestimo: { r: 59, g: 130, b: 246 }, // blue-500
    devolucao: { r: 34, g: 197, b: 94 }, // green-500
    tarefa: { r: 168, g: 85, b: 247 }, // purple-500
    avaliacao: { r: 249, g: 115, b: 22 } // orange-500
  };

  const cor = cores[tipo] || cores.emprestimo;

  // Header com fundo colorido
  pdf.setFillColor(cor.r, cor.g, cor.b);
  pdf.rect(0, 0, pageWidth, 45, 'F');

  // Logo e título (texto branco)
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  
  const titulos = {
    emprestimo: 'Comprovante de Empréstimo',
    devolucao: 'Comprovante de Devolução',
    tarefa: 'Comprovante de Tarefa',
    avaliacao: 'Comprovante de Avaliação'
  };
  
  pdf.text(titulos[tipo] || 'Comprovante', pageWidth / 2, 20, { align: 'center' });

  // Data e hora
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const dataFormatada = format(new Date(dados.data || Date.now()), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  pdf.text(dataFormatada, pageWidth / 2, 32, { align: 'center' });

  // Linha decorativa
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.5);
  pdf.line(40, 38, pageWidth - 40, 38);

  yPosition = 55;

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

  // De (remetente)
  if (dados.remetenteNome) {
    addSection('De', dados.remetenteNome);
    if (dados.remetenteCPF) {
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`CPF: ${dados.remetenteCPF}`, 25, yPosition);
      yPosition += 8;
    }
  }

  // Para (destinatário)
  if (dados.destinatarioNome) {
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
    if (yPosition > pdf.internal.pageSize.getHeight() - 40) {
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

  // Footer
  yPosition = pdf.internal.pageSize.getHeight() - 25;
  pdf.setFillColor(249, 250, 251);
  pdf.rect(0, yPosition, pageWidth, 30, 'F');

  pdf.setFontSize(8);
  pdf.setTextColor(107, 114, 128);
  pdf.setFont('helvetica', 'normal');
  pdf.text('GardenFlow - Sistema de Controle de Almoxarifado', pageWidth / 2, yPosition + 8, { align: 'center' });
  pdf.text('Este comprovante é um documento oficial', pageWidth / 2, yPosition + 13, { align: 'center' });
  pdf.setFont('courier', 'normal');
  pdf.text(format(new Date(), 'dd/MM/yyyy HH:mm:ss'), pageWidth / 2, yPosition + 18, { align: 'center' });

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
