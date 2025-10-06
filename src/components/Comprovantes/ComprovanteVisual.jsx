import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CheckCircle, 
  Package, 
  ClipboardCheck, 
  Star,
  Download,
  Share2,
  ArrowRight
} from 'lucide-react';

/**
 * ComprovanteVisual - Componente de comprovante estilo Mercado Pago
 * Design limpo e profissional para empréstimos, devoluções, tarefas e avaliações
 */
const ComprovanteVisual = ({ tipo, dados, onDownload, onShare }) => {
  // Configurações baseadas no tipo
  const configs = {
    emprestimo: {
      titulo: 'Comprovante de empréstimo',
      cor: 'from-blue-500 to-blue-600',
      corTexto: 'text-blue-600',
      corBg: 'bg-blue-50',
      corBorda: 'border-blue-200',
      icon: Package,
      status: 'Emprestado'
    },
    devolucao: {
      titulo: 'Comprovante de devolução',
      cor: 'from-green-500 to-green-600',
      corTexto: 'text-green-600',
      corBg: 'bg-green-50',
      corBorda: 'border-green-200',
      icon: CheckCircle,
      status: 'Devolvido'
    },
    tarefa: {
      titulo: 'Comprovante de tarefa concluída',
      cor: 'from-purple-500 to-purple-600',
      corTexto: 'text-purple-600',
      corBg: 'bg-purple-50',
      corBorda: 'border-purple-200',
      icon: ClipboardCheck,
      status: 'Concluída'
    },
    avaliacao: {
      titulo: 'Comprovante de avaliação',
      cor: 'from-orange-500 to-orange-600',
      corTexto: 'text-orange-600',
      corBg: 'bg-orange-50',
      corBorda: 'border-orange-200',
      icon: Star,
      status: 'Avaliado'
    }
  };

  const config = configs[tipo] || configs.emprestimo;
  const Icon = config.icon;

  // Formatar data
  const dataFormatada = format(
    new Date(dados.data || Date.now()), 
    "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss",
    { locale: ptBR }
  );

  // Capitalizar primeira letra
  const dataCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
      {/* Header com logo WorkFlow */}
      <div className="p-6 pb-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 mb-1">
          {/* Logo WorkFlow (círculo azul com aperto de mão) */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <svg 
              viewBox="0 0 24 24" 
              className="w-8 h-8 text-white"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">WorkFlow</h1>
            <p className="text-sm text-gray-500">Sistema de Gestão</p>
          </div>
        </div>
      </div>

      {/* Título do comprovante */}
      <div className="px-6 pt-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {config.titulo}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {dataCapitalizada}
        </p>
      </div>

      {/* Valor/Quantidade destaque */}
      <div className="px-6 mb-6">
        <div className={`${config.corBg} ${config.corBorda} border-2 rounded-2xl p-6 text-center`}>
          <Icon className={`w-12 h-12 mx-auto mb-3 ${config.corTexto}`} />
          <div className="text-5xl font-bold text-gray-900 mb-2">
            {dados.quantidade || dados.valor || '0'}
          </div>
          <div className="text-sm font-medium text-gray-600">
            {tipo === 'tarefa' ? 'Tarefa' : 
             tipo === 'avaliacao' ? `Estrelas` : 
             dados.quantidade === 1 ? 'Ferramenta' : 'Ferramentas'}
          </div>
        </div>
      </div>

      {/* Linha divisória */}
      <div className="px-6 mb-4">
        <div className="border-t border-dashed border-gray-300"></div>
      </div>

      {/* Detalhes da transação */}
      <div className="px-6 space-y-3 mb-6">
        {/* De/Para com setas */}
        {dados.de && (
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">De</div>
              <div className="font-bold text-gray-900">{dados.de}</div>
              {dados.deCPF && (
                <div className="text-sm text-gray-500">CPF: {dados.deCPF}</div>
              )}
              {dados.deInfo && (
                <div className="text-sm text-gray-600">{dados.deInfo}</div>
              )}
            </div>
          </div>
        )}

        {dados.para && (
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">Para</div>
              <div className="font-bold text-gray-900">{dados.para}</div>
              {dados.paraCPF && (
                <div className="text-sm text-gray-500">CPF: {dados.paraCPF}</div>
              )}
              {dados.paraInfo && (
                <div className="text-sm text-gray-600">{dados.paraInfo}</div>
              )}
            </div>
          </div>
        )}

        {/* Informações adicionais */}
        {dados.ferramentas && dados.ferramentas.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 mt-4">
            <div className="text-xs font-semibold text-gray-500 mb-2">ITENS</div>
            <div className="space-y-1">
              {dados.ferramentas.map((ferramenta, index) => (
                <div key={index} className="text-sm text-gray-700 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                  {ferramenta}
                </div>
              ))}
            </div>
          </div>
        )}

        {dados.descricao && (
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs font-semibold text-gray-500 mb-2">DESCRIÇÃO</div>
            <div className="text-sm text-gray-700">{dados.descricao}</div>
          </div>
        )}

        {tipo === 'avaliacao' && dados.comentario && (
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs font-semibold text-gray-500 mb-2">COMENTÁRIO</div>
            <div className="text-sm text-gray-700">{dados.comentario}</div>
          </div>
        )}
      </div>

      {/* Linha divisória */}
      <div className="px-6 mb-4">
        <div className="border-t border-dashed border-gray-300"></div>
      </div>

      {/* IDs e informações técnicas */}
      <div className="px-6 mb-6 space-y-2">
        {dados.transacaoId && (
          <div>
            <div className="text-xs text-gray-500">Número da transação do WorkFlow</div>
            <div className="text-sm font-mono font-semibold text-gray-900">
              {dados.transacaoId}
            </div>
          </div>
        )}

        {dados.id && (
          <div>
            <div className="text-xs text-gray-500">ID de transação</div>
            <div className="text-sm font-mono text-gray-900 break-all">
              {dados.id}
            </div>
          </div>
        )}
      </div>

      {/* Botões de ação */}
      <div className="px-6 pb-6 flex gap-3">
        {onDownload && (
          <button
            onClick={onDownload}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            <Download className="w-5 h-5" />
            Baixar PDF
          </button>
        )}
        {onShare && (
          <button
            onClick={onShare}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            <Share2 className="w-5 h-5" />
            Compartilhar
          </button>
        )}
      </div>

      {/* Footer com informações de contato */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="font-semibold text-gray-700 mb-2">Atendimento ao Cliente</div>
          <div>0800 637 7246</div>
          <div className="font-semibold text-gray-700 mt-2">Ouvidoria</div>
          <div>0800 688 4365</div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ComprovanteVisual);
