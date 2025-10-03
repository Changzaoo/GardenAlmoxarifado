// Utilitário para gerar extrato de empréstimo em PDF
import jsPDF from 'jspdf';

export const gerarExtratoPDF = async (emprestimo) => {
  if (!emprestimo) {
    alert('Dados do empréstimo não disponíveis.');
    return;
  }

  try {
    // Criar documento PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    console.log('Gerando PDF para empréstimo:', emprestimo);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Cabeçalho
    doc.setFillColor(29, 155, 240); // Azul royal #1D9BF0
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('EXTRATO DE EMPRÉSTIMO', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, 30, { align: 'center' });

    yPosition = 50;

    // Informações do Empréstimo
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO EMPRÉSTIMO', 15, yPosition);
    yPosition += 10;

    // Box com informações
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, yPosition, pageWidth - 30, 60, 3, 3);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    yPosition += 8;
    doc.text(`ID do Empréstimo: ${emprestimo.id || 'N/A'}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Funcionário: ${emprestimo.funcionarioNome || emprestimo.funcionario || 'N/A'}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Setor: ${emprestimo.setor || 'N/A'}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Data do Empréstimo: ${emprestimo.dataEmprestimo ? new Date(emprestimo.dataEmprestimo).toLocaleDateString('pt-BR') : 'N/A'}`, 20, yPosition);
    yPosition += 7;
    
    const status = emprestimo.devolvido ? 'Devolvido' : emprestimo.devolvidoParcialmente ? 'Devolução Parcial' : 'Em Aberto';
    const corStatus = emprestimo.devolvido ? '34, 197, 94' : emprestimo.devolvidoParcialmente ? '251, 191, 36' : '239, 68, 68';
    doc.setTextColor(0, 0, 0);
    doc.text(`Status: `, 20, yPosition);
    doc.setTextColor(...corStatus.split(',').map(Number));
    doc.setFont('helvetica', 'bold');
    doc.text(status, 40, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    yPosition += 7;
    
    if (emprestimo.devolvido && emprestimo.dataDevolucao) {
      doc.text(`Data de Devolução: ${new Date(emprestimo.dataDevolucao).toLocaleString('pt-BR')}`, 20, yPosition);
      yPosition += 7;
    }
    
    if (emprestimo.devolvidoPorTerceiros) {
      doc.setTextColor(255, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('⚠️ Devolvido por Terceiros', 20, yPosition);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      yPosition += 7;
    }

    yPosition += 10;

    // Lista de Ferramentas
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FERRAMENTAS EMPRESTADAS', 15, yPosition);
    yPosition += 8;

    // Cabeçalho da tabela
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPosition, pageWidth - 30, 8, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Ferramenta', 20, yPosition + 5);
    doc.text('Quantidade', pageWidth - 60, yPosition + 5);
    doc.text('Status', pageWidth - 30, yPosition + 5);
    yPosition += 10;

    // Linhas das ferramentas
    doc.setFont('helvetica', 'normal');
    const ferramentas = Array.isArray(emprestimo.ferramentas) ? emprestimo.ferramentas : [];
    
    ferramentas.forEach((ferramenta, index) => {
      // Verificar se precisa de nova página
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }

      const nome = typeof ferramenta === 'string' ? ferramenta : ferramenta.nome || ferramenta.ferramenta || 'N/A';
      const quantidade = ferramenta.quantidade || 1;
      const devolvida = ferramenta.devolvida || false;
      
      // Linha alternada
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, yPosition - 4, pageWidth - 30, 7, 'F');
      }
      
      doc.setTextColor(0, 0, 0);
      doc.text(nome, 20, yPosition);
      doc.text(String(quantidade), pageWidth - 60, yPosition);
      
      if (devolvida) {
        doc.setTextColor(34, 197, 94);
        doc.text('✓ Devolvida', pageWidth - 30, yPosition);
      } else {
        doc.setTextColor(239, 68, 68);
        doc.text('✗ Pendente', pageWidth - 30, yPosition);
      }
      
      yPosition += 7;
    });

    yPosition += 10;

    // Observações (se houver)
    if (emprestimo.observacoes) {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('OBSERVAÇÕES', 15, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(emprestimo.observacoes, pageWidth - 40);
      doc.text(lines, 20, yPosition);
      yPosition += lines.length * 5 + 10;
    }

    // Rodapé
    const footerY = pageHeight - 15;
    doc.setDrawColor(200, 200, 200);
    doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Este documento foi gerado automaticamente pelo sistema de controle de ferramentas.', pageWidth / 2, footerY, { align: 'center' });

    // Salvar PDF
    const nomeArquivo = `Extrato_Emprestimo_${emprestimo.id || Date.now()}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nomeArquivo);

    return true;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar o extrato em PDF. Tente novamente.');
    return false;
  }
};
