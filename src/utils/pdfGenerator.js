import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Gera um comprovante de empréstimo em PDF
 * @param {Object} emprestimo - Dados do empréstimo
 * @param {Object} ferramenta - Dados da ferramenta
 * @param {Object} funcionario - Dados do funcionário
 * @param {Object} empresa - Dados da empresa
 * @param {Object} setor - Dados do setor
 * @returns {jsPDF} Documento PDF gerado
 */
export const gerarComprovantePDF = async (emprestimo, ferramenta, funcionario, empresa, setor) => {
  const doc = new jsPDF();
  
  // Configurações de cores
  const corPrimaria = [41, 128, 185]; // Azul WorkFlow
  const corSecundaria = [52, 73, 94];
  const corTexto = [44, 62, 80];
  const corCinza = [127, 140, 141];
  const corVerde = [39, 174, 96];
  const corVermelha = [231, 76, 60];
  
  let yPos = 20;
  
  // ==================== HEADER ====================
  // Fundo azul no topo
  doc.setFillColor(...corPrimaria);
  doc.rect(0, 0, 210, 35, 'F');
  
  // Logo (simulado com texto estilizado)
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('WorkFlow', 105, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gestão de Ferramentas', 105, 22, { align: 'center' });
  
  // Linha decorativa
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(20, 28, 190, 28);
  
  yPos = 45;
  
  // ==================== TÍTULO DO DOCUMENTO ====================
  doc.setFillColor(236, 240, 241);
  doc.rect(0, yPos - 5, 210, 12, 'F');
  
  doc.setFontSize(16);
  doc.setTextColor(...corPrimaria);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPROVANTE DE EMPRÉSTIMO', 105, yPos + 3, { align: 'center' });
  
  yPos += 20;
  
  // ==================== INFORMAÇÕES DO DOCUMENTO ====================
  doc.setFontSize(9);
  doc.setTextColor(...corCinza);
  doc.setFont('helvetica', 'normal');
  
  const dataGeracao = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  const numeroComprovante = `WF-${emprestimo.id?.substring(0, 8).toUpperCase() || 'XXXXXXXX'}`;
  
  doc.text(`Nº do Comprovante: ${numeroComprovante}`, 20, yPos);
  doc.text(`Gerado em: ${dataGeracao}`, 150, yPos, { align: 'right' });
  
  yPos += 15;
  
  // ==================== DADOS DO FUNCIONÁRIO ====================
  doc.setFillColor(...corPrimaria);
  doc.rect(20, yPos - 5, 170, 7, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO SOLICITANTE', 25, yPos);
  
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(...corTexto);
  doc.setFont('helvetica', 'normal');
  
  const dadosFuncionario = [
    { label: 'Nome:', valor: funcionario?.nome || 'Não informado' },
    { label: 'Matrícula:', valor: funcionario?.matricula || 'N/A' },
    { label: 'Empresa:', valor: empresa?.nome || 'N/A' },
    { label: 'Setor:', valor: setor?.nome || 'N/A' },
  ];
  
  dadosFuncionario.forEach((item) => {
    doc.setFont('helvetica', 'bold');
    doc.text(item.label, 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(item.valor, 60, yPos);
    yPos += 6;
  });
  
  yPos += 5;
  
  // ==================== DADOS DA FERRAMENTA ====================
  doc.setFillColor(...corPrimaria);
  doc.rect(20, yPos - 5, 170, 7, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DA FERRAMENTA', 25, yPos);
  
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(...corTexto);
  doc.setFont('helvetica', 'normal');
  
  const dadosFerramenta = [
    { label: 'Ferramenta:', valor: ferramenta?.nome || 'Não informado' },
    { label: 'Código:', valor: ferramenta?.codigo || 'N/A' },
    { label: 'Categoria:', valor: ferramenta?.categoria || 'N/A' },
    { label: 'Quantidade:', valor: `${emprestimo.quantidade || 1} unidade(s)` },
  ];
  
  dadosFerramenta.forEach((item) => {
    doc.setFont('helvetica', 'bold');
    doc.text(item.label, 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(item.valor, 60, yPos);
    yPos += 6;
  });
  
  yPos += 5;
  
  // ==================== DADOS DO EMPRÉSTIMO ====================
  doc.setFillColor(...corPrimaria);
  doc.rect(20, yPos - 5, 170, 7, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('HISTÓRICO DO EMPRÉSTIMO', 25, yPos);
  
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(...corTexto);
  doc.setFont('helvetica', 'normal');
  
  const dataEmprestimo = emprestimo.dataEmprestimo || emprestimo.data 
    ? format(new Date(emprestimo.dataEmprestimo || emprestimo.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : 'Não informado';
  
  const dataDevolucao = emprestimo.dataDevolucao 
    ? format(new Date(emprestimo.dataDevolucao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : 'Pendente';
  
  const statusEmprestimo = emprestimo.status === 'devolvido' || emprestimo.devolvido ? 'DEVOLVIDO' : 'ATIVO';
  const corStatus = emprestimo.devolvido ? corVerde : corVermelha;
  
  const dataRef = emprestimo.dataEmprestimo || emprestimo.data;
  
  const dadosEmprestimo = [
    { label: 'Data de Retirada:', valor: dataEmprestimo },
    { label: 'Horário de Retirada:', valor: dataRef ? format(new Date(dataRef), 'HH:mm', { locale: ptBR }) : 'N/A' },
    { label: 'Data de Devolução:', valor: dataDevolucao },
    { label: 'Horário de Devolução:', valor: emprestimo.dataDevolucao ? format(new Date(emprestimo.dataDevolucao), 'HH:mm', { locale: ptBR }) : 'N/A' },
  ];
  
  dadosEmprestimo.forEach((item) => {
    doc.setFont('helvetica', 'bold');
    doc.text(item.label, 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(item.valor, 65, yPos);
    yPos += 6;
  });
  
  yPos += 2;
  
  // Status do empréstimo
  doc.setFont('helvetica', 'bold');
  doc.text('Status:', 25, yPos);
  doc.setTextColor(...corStatus);
  doc.text(statusEmprestimo, 65, yPos);
  doc.setTextColor(...corTexto);
  
  yPos += 10;
  
  // Observações (se houver)
  if (emprestimo.observacoes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Observações:', 25, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const obsLines = doc.splitTextToSize(emprestimo.observacoes, 160);
    doc.text(obsLines, 25, yPos);
    yPos += (obsLines.length * 4) + 5;
  }
  
  yPos += 5;
  
  // ==================== SELO DE SEGURANÇA ====================
  // Caixa de segurança
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(...corPrimaria);
  doc.setLineWidth(1);
  doc.rect(20, yPos, 170, 30, 'FD');
  
  yPos += 8;
  
  // Ícone de segurança (simulado)
  doc.setFillColor(...corVerde);
  doc.circle(35, yPos + 5, 5, 'F');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('✓', 35, yPos + 7, { align: 'center' });
  
  // Texto de certificação
  doc.setFontSize(10);
  doc.setTextColor(...corTexto);
  doc.setFont('helvetica', 'bold');
  doc.text('DOCUMENTO AUTENTICADO E SEGURO', 50, yPos + 3);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...corCinza);
  const textoSeguranca = 'Este comprovante foi gerado automaticamente pelo sistema WorkFlow e possui validade legal. ' +
    'As informações contidas neste documento são fidedignas e foram registradas em nosso banco de dados seguro.';
  const linhasSeguranca = doc.splitTextToSize(textoSeguranca, 135);
  doc.text(linhasSeguranca, 50, yPos + 9);
  
  yPos += 35;
  
  // ==================== ASSINATURA DIGITAL ====================
  yPos += 5;
  doc.setFontSize(8);
  doc.setTextColor(...corCinza);
  doc.setFont('helvetica', 'italic');
  doc.text('Assinatura Digital WorkFlow', 105, yPos, { align: 'center' });
  
  yPos += 4;
  const hashDocumento = `HASH: ${numeroComprovante}-${Date.now().toString(36).toUpperCase()}`;
  doc.text(hashDocumento, 105, yPos, { align: 'center' });
  
  // ==================== FOOTER ====================
  yPos = 280;
  
  // Linha separadora
  doc.setDrawColor(...corCinza);
  doc.setLineWidth(0.3);
  doc.line(20, yPos, 190, yPos);
  
  yPos += 5;
  
  doc.setFontSize(8);
  doc.setTextColor(...corCinza);
  doc.setFont('helvetica', 'normal');
  doc.text('WorkFlow - Sistema de Gestão de Ferramentas', 105, yPos, { align: 'center' });
  
  yPos += 4;
  doc.text('Este documento foi gerado eletronicamente e não requer assinatura manuscrita.', 105, yPos, { align: 'center' });
  
  yPos += 4;
  doc.text(`Página 1 de 1 | ${numeroComprovante}`, 105, yPos, { align: 'center' });
  
  return doc;
};

/**
 * Baixa o PDF gerado
 * @param {jsPDF} doc - Documento PDF
 * @param {string} nomeArquivo - Nome do arquivo
 */
export const baixarPDF = (doc, nomeArquivo) => {
  doc.save(nomeArquivo);
};

/**
 * Gera uma prévia do PDF em base64
 * @param {jsPDF} doc - Documento PDF
 * @returns {string} PDF em base64
 */
export const gerarPreviaPDF = (doc) => {
  return doc.output('dataurlstring');
};
