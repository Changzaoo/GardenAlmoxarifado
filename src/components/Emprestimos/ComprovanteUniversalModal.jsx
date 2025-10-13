import React from 'react';
import { X, Download, Share2, CheckCircle, Package, User, Calendar, Clock, Hash, Building } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { gerarComprovantePDF, compartilharComprovantePDF } from '../../utils/comprovanteUtils';

/**
 * ComprovanteModal - Comprovante estilo Mercado Pago
 * Design limpo e profissional para empréstimos, devoluções, tarefas e avaliações
 */
const ComprovanteModal = ({
  isOpen,
  onClose,
  tipo = 'emprestimo', // 'emprestimo', 'devolucao', 'tarefa', 'avaliacao'
  dados = {},
  onDownload,
  onShare
}) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    gerarComprovantePDF(tipo, dados);
    if (onDownload) onDownload();
  };

  const handleShare = async () => {
    await compartilharComprovantePDF(tipo, dados);
    if (onShare) onShare();
  };

  const getTitulo = () => {
    switch (tipo) {
      case 'emprestimo': return 'Comprovante de Empréstimo';
      case 'devolucao': return 'Comprovante de Devolução';
      case 'tarefa': return 'Comprovante de Tarefa Concluída';
      case 'avaliacao': return 'Comprovante de Avaliação';
      default: return 'Comprovante';
    }
  };

  const getIcone = () => {
    switch (tipo) {
      case 'emprestimo': return <Package className="w-8 h-8" />;
      case 'devolucao': return <Package className="w-8 h-8" />;
      case 'tarefa': return <CheckCircle className="w-8 h-8" />;
      case 'avaliacao': return <CheckCircle className="w-8 h-8" />;
      default: return <CheckCircle className="w-8 h-8" />;
    }
  };

  const getCor = () => {
    switch (tipo) {
      case 'emprestimo': return 'from-blue-500 to-indigo-600';
      case 'devolucao': return 'from-green-500 to-emerald-600';
      case 'tarefa': return 'from-purple-500 to-pink-600';
      case 'avaliacao': return 'from-orange-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header com gradiente */}
        <div className={`bg-gradient-to-r ${getCor()} p-6 text-white relative overflow-hidden`}>
          {/* Padrão de fundo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)`
            }} />
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative flex items-center gap-4">
            <div className="bg-white bg-opacity-20 p-4 rounded-2xl backdrop-blur-sm">
              {getIcone()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{getTitulo()}</h2>
              <p className="text-sm opacity-90 mt-1">
                {format(new Date(dados.data || Date.now()), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Valor/Status */}
          <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-2xl">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {tipo === 'emprestimo' ? 'Emprestado' : tipo === 'devolucao' ? 'Devolvido' : 'Concluído'}
              </span>
            </div>
            <div className="text-4xl font-bold text-gray-900 dark:text-white">
              {dados.quantidade || dados.ferramentas?.length || 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {tipo === 'tarefa' ? 'Tarefa' : tipo === 'avaliacao' ? 'Avaliação' : 'Ferramentas'}
            </div>
          </div>

          {/* Separador */}
          <div className="border-t-2 border-dashed border-gray-200 dark:border-gray-700" />

          {/* Informações principais */}
          <div className="space-y-4">
            
            {/* De (remetente) */}
            {dados.remetenteNome && (
              <div className="flex items-start gap-3">
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400">De</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{dados.remetenteNome}</div>
                  {dados.remetenteCPF && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      CPF: {dados.remetenteCPF}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Para (destinatário) */}
            {dados.destinatarioNome && (
              <div className="flex items-start gap-3">
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Para</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{dados.destinatarioNome}</div>
                  {dados.destinatarioCPF && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      CPF: {dados.destinatarioCPF}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empresa/Setor */}
            {dados.empresa && (
              <div className="flex items-start gap-3">
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                  <Building className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Empresa</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{dados.empresa}</div>
                  {dados.setor && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Setor: {dados.setor}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Data e Hora */}
            <div className="flex items-start gap-3">
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 dark:text-gray-400">Data e Hora</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {format(new Date(dados.data || Date.now()), "dd/MM/yyyy", { locale: ptBR })}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {format(new Date(dados.data || Date.now()), "HH:mm:ss", { locale: ptBR })}
                </div>
              </div>
            </div>

            {/* Número da transação */}
            {dados.id && (
              <div className="flex items-start gap-3">
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                  <Hash className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Número da Transação</div>
                  <div className="font-mono text-sm text-gray-900 dark:text-white break-all">
                    {dados.id.substring(0, 20)}...
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Separador */}
          <div className="border-t-2 border-dashed border-gray-200 dark:border-gray-700" />

          {/* Lista de ferramentas/itens */}
          {(dados.ferramentas || dados.itens) && (
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                {tipo === 'emprestimo' || tipo === 'devolucao' ? 'Ferramentas' : 'Itens'}
              </h3>
              <div className="space-y-3">
                {(dados.ferramentas || dados.itens)?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {item.nome || item.descricao || item}
                        </div>
                        {item.codigo && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Código: {item.codigo}
                          </div>
                        )}
                      </div>
                    </div>
                    {item.quantidade && (
                      <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                        x{item.quantidade}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observações */}
          {dados.observacoes && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-lg">
              <div className="font-semibold text-yellow-800 dark:text-yellow-400 mb-1">
                Observações
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                {dados.observacoes}
              </div>
            </div>
          )}

          {/* Informações do sistema */}
          <div className="text-center text-xs text-gray-400 dark:text-gray-500 space-y-1 pt-4">
            <div>GardenFlow - Sistema de Controle de Almoxarifado</div>
            <div>Este comprovante é um documento oficial</div>
            <div className="font-mono">{format(new Date(), "dd/MM/yyyy HH:mm:ss")}</div>
          </div>
        </div>

        {/* Footer com ações */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Baixar PDF
          </button>
          <button
            onClick={handleShare}
            className="py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComprovanteModal;
