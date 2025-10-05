import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, CheckCircle, Printer } from 'lucide-react';
import { gerarComprovantePDF, baixarPDF, gerarPreviaPDF } from '../../utils/pdfGenerator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ComprovanteEmprestimoModal = ({ 
  emprestimo, 
  ferramenta, 
  funcionario,
  empresa,
  setor,
  onClose 
}) => {
  const [pdfPreview, setPdfPreview] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadInProgress, setDownloadInProgress] = useState(false);

  useEffect(() => {
    gerarPrevia();
  }, [emprestimo]);

  const gerarPrevia = async () => {
    try {
      setLoading(true);
      const doc = await gerarComprovantePDF(emprestimo, ferramenta, funcionario, empresa, setor);
      setPdfDoc(doc);
      const preview = gerarPreviaPDF(doc);
      setPdfPreview(preview);
    } catch (error) {
      console.error('Erro ao gerar prévia do PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBaixarPDF = () => {
    if (pdfDoc) {
      setDownloadInProgress(true);
      const nomeArquivo = `Comprovante_Emprestimo_${emprestimo.id?.substring(0, 8) || 'documento'}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
      baixarPDF(pdfDoc, nomeArquivo);
      
      setTimeout(() => {
        setDownloadInProgress(false);
      }, 1500);
    }
  };

  const handleImprimir = () => {
    if (pdfDoc) {
      // Abre em nova janela para impressão
      const pdfBlob = pdfDoc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Comprovante de Empréstimo
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Prévia do documento antes de baixar
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Informações Rápidas */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Funcionário</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {funcionario?.nome || 'Não informado'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ferramenta</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {ferramenta?.nome || 'Não informado'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${emprestimo.devolvido ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {emprestimo.devolvido ? 'Devolvido' : 'Ativo'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Prévia do PDF */}
          <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Gerando comprovante...
                </p>
              </div>
            ) : pdfPreview ? (
              <div className="flex justify-center">
                <iframe
                  src={pdfPreview}
                  className="w-full h-[600px] border-0 rounded-lg shadow-xl bg-white"
                  title="Prévia do Comprovante"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <FileText className="w-16 h-16 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">
                  Não foi possível gerar a prévia
                </p>
              </div>
            )}
          </div>

          {/* Footer com ações */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Documento verificado e seguro</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Fechar
              </button>
              
              <button
                onClick={handleImprimir}
                disabled={loading || !pdfDoc}
                className="px-6 py-2.5 rounded-full bg-indigo-500 text-white font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
              
              <button
                onClick={handleBaixarPDF}
                disabled={loading || !pdfDoc || downloadInProgress}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                {downloadInProgress ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Baixando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Baixar PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ComprovanteEmprestimoModal;
