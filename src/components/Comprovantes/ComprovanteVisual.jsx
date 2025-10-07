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
 * ComprovanteVisual - Componente de comprovante estilo Mercado Pago
 * Design limpo e profissional para empréstimos, devoluções, tarefas e avaliações
 */
const ComprovanteVisual = ({ tipo, dados, onDownload, onShare }) => {
  // Gerar código de assinatura único
  const codigoAssinatura = React.useMemo(
    () => dados.codigoAssinatura || gerarCodigoAssinatura(tipo, dados.id),
    [tipo, dados.id, dados.codigoAssinatura]
  );

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
    <div className="w-full max-w-sm mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100" style={{ maxWidth: '428px' }}>
      {/* Header com logo WorkFlow */}
      <div className="p-6 pb-4 bg-gradient-to-br from-blue-500 to-blue-600 border-b border-blue-400">
        <div className="flex items-center gap-3 mb-1">
          {/* Logo WorkFlow */}
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg p-2">
            <img 
              src="/logo.png" 
              alt="WorkFlow Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">WorkFlow</h1>
            <p className="text-sm text-blue-100">Sistema de Gestão</p>
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
        {/* Status do Empréstimo */}
        {dados.status && (
          <div className={`rounded-xl p-3 border-2 ${
            dados.status === 'devolvido' ? 'bg-green-50 border-green-200' :
            dados.status === 'emprestado' ? 'bg-blue-50 border-blue-200' :
            'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-600">SITUAÇÃO</span>
              <span className={`text-sm font-bold uppercase ${
                dados.status === 'devolvido' ? 'text-green-700' :
                dados.status === 'emprestado' ? 'text-blue-700' :
                'text-yellow-700'
              }`}>
                {dados.status}
              </span>
            </div>
          </div>
        )}

        {/* Funcionário/Colaborador - Card Principal */}
        {(dados.colaborador || dados.funcionario || dados.para) && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <div className="text-xs font-bold text-blue-900">PARA</div>
            </div>
            <div className="font-bold text-lg text-gray-900">
              {dados.colaborador || dados.funcionario || dados.para}
            </div>
            
            {/* Informações do Funcionário */}
            <div className="mt-3 space-y-1">
              {dados.empresa && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700"><strong>Empresa:</strong> {dados.empresa}</span>
                </div>
              )}
              
              {dados.setor && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 7H7v6h6V7z" />
                    <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700"><strong>Setor:</strong> {dados.setor}</span>
                </div>
              )}
              
              {dados.cargo && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                    <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                  </svg>
                  <span className="text-gray-700"><strong>Cargo:</strong> {dados.cargo}</span>
                </div>
              )}

              {(dados.paraCPF || dados.colaboradorCPF) && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600">CPF: {dados.paraCPF || dados.colaboradorCPF}</span>
                </div>
              )}
            </div>
          </div>
        )}

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

      {/* Código de Assinatura Digital */}
      <div className="px-6 mb-4">
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="text-xs font-bold text-indigo-900">ASSINATURA DIGITAL</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-mono font-bold text-indigo-700 tracking-wider break-all">
              {codigoAssinatura}
            </div>
            <div className="text-xs text-indigo-600 mt-1">
              Use este código para buscar o comprovante
            </div>
          </div>
        </div>
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

      {/* Footer com selo de garantia */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-4 border-t border-blue-100">
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-xs font-bold text-blue-900">DOCUMENTO GARANTIDO</p>
        </div>
        <p className="text-center text-xs text-blue-700 leading-relaxed">
          Este comprovante é válido e confiável, certificado pela equipe WorkFlow. 
          Documento gerado automaticamente com segurança e rastreabilidade.
        </p>
      </div>
    </div>
  );
};

export default React.memo(ComprovanteVisual);
