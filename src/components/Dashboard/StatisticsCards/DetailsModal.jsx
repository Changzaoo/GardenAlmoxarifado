import React, { useMemo, useState } from 'react';
import { X, Clock, User, Wrench, ChevronLeft, FileText } from 'lucide-react';
import ComprovanteModal from '../../Comprovantes/ComprovanteModal';

const EmprestimoCard = ({ emprestimo, onGerarComprovante }) => {
  const getFerramentaNome = (ferramenta) => {
    if (!ferramenta) return 'Ferramenta não encontrada';
    return typeof ferramenta === 'object' ? ferramenta.nome : ferramenta;
  };

  return (
    <div className="bg-white dark:bg-gray-700 rounded-xl p-4 flex flex-col h-full relative">
      {/* Cabeçalho com Data/Hora e Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500 dark:text-[#1D9BF0]" />
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            {new Date(emprestimo.dataEmprestimo).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
        <span className={`px-2 py-1 rounded text-xs ${
          emprestimo.status === 'devolvido' ? 'bg-green-500/20 text-green-400' :
          emprestimo.status === 'emprestado' ? 'bg-blue-500/20 text-blue-400' :
          'bg-yellow-500/20 text-yellow-400'
        }`}>
          {emprestimo.status.charAt(0).toUpperCase() + emprestimo.status.slice(1)}
        </span>
      </div>

      {/* Lista de Ferramentas */}
      <div className="flex-grow space-y-2">
        {(emprestimo.ferramentas || emprestimo.nomeFerramentas || []).map((ferramenta, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400 text-sm">{getFerramentaNome(ferramenta)}</span>
          </div>
        ))}
      </div>

      {/* Data de Devolução (se houver) */}
      {emprestimo.dataDevolucao && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 dark:border-gray-600 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            Devolvido: {new Date(emprestimo.dataDevolucao).toLocaleString('pt-BR')}
          </span>
        </div>
      )}

      {/* Botão de Comprovante */}
      <button
        onClick={() => onGerarComprovante(emprestimo)}
        className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 font-medium text-sm"
      >
        <FileText className="w-4 h-4" />
        Ver Comprovante
      </button>
    </div>
  );
};

const FuncionarioCard = ({ nome, emprestimos, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white dark:bg-gray-700 rounded-xl p-4 cursor-pointer hover:bg-[#2C3E50] transition-colors flex flex-col"
  >
    <div className="flex items-center gap-3 mb-2">
      <User className="w-5 h-5 text-blue-500 dark:text-[#1D9BF0]" />
      <h4 className="text-white font-medium">{nome}</h4>
    </div>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-auto">
      {emprestimos.length} empréstimo{emprestimos.length !== 1 ? 's' : ''}
    </p>
  </div>
);

const DetailsModal = ({ isOpen, onClose, details, title, dateRange }) => {
  const [selectedFuncionario, setSelectedFuncionario] = useState(null);
  const [showComprovanteModal, setShowComprovanteModal] = useState(false);
  const [emprestimoParaComprovante, setEmprestimoParaComprovante] = useState(null);

  const getFuncionarioNome = (emprestimo) => {
    return emprestimo.funcionario?.nome || 
           emprestimo.nomeFuncionario || 
           emprestimo.colaborador || 
           'Funcionário não encontrado';
  };

  // Agrupa empréstimos por funcionário
  const emprestimosAgrupados = useMemo(() => {
    const grupos = {};
    
    details.forEach(emprestimo => {
      const funcionarioNome = getFuncionarioNome(emprestimo);
      
      if (!grupos[funcionarioNome]) {
        grupos[funcionarioNome] = [];
      }
      
      grupos[funcionarioNome].push(emprestimo);
    });
    
    return Object.entries(grupos).sort(([nomeA], [nomeB]) => nomeA.localeCompare(nomeB));
  }, [details]);

  if (!isOpen) return null;

  const voltarParaLista = () => {
    setSelectedFuncionario(null);
  };

  const handleGerarComprovante = (emprestimo) => {
    setEmprestimoParaComprovante(emprestimo);
    setShowComprovanteModal(true);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 z-50">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 dark:border-gray-600 p-4 shadow-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {selectedFuncionario && (
              <button
                onClick={voltarParaLista}
                className="p-1 hover:bg-white dark:bg-gray-700 rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            )}
            <div>
              <h3 className="text-lg font-semibold text-white">
                {selectedFuncionario ? selectedFuncionario : title}
              </h3>
              {dateRange && !selectedFuncionario && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{dateRange}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white dark:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-8rem)]">
          {emprestimosAgrupados.length > 0 ? (
            !selectedFuncionario ? (
              // Grade de Funcionários
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {emprestimosAgrupados.map(([funcionarioNome, emprestimos]) => (
                  <FuncionarioCard
                    key={funcionarioNome}
                    nome={funcionarioNome}
                    emprestimos={emprestimos}
                    onClick={() => setSelectedFuncionario(funcionarioNome)}
                  />
                ))}
              </div>
            ) : (
              // Grade de Empréstimos do Funcionário Selecionado
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {emprestimosAgrupados
                  .find(([nome]) => nome === selectedFuncionario)[1]
                  .map((emprestimo, index) => (
                    <EmprestimoCard
                      key={emprestimo.id || index}
                      emprestimo={emprestimo}
                      onGerarComprovante={handleGerarComprovante}
                    />
                  ))}
              </div>
            )
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              Nenhum empréstimo encontrado neste período.
            </div>
          )}
        </div>
      </div>

      {/* Modal de Comprovante */}
      {showComprovanteModal && emprestimoParaComprovante && (
        <ComprovanteModal
          isOpen={showComprovanteModal}
          onClose={() => {
            setShowComprovanteModal(false);
            setEmprestimoParaComprovante(null);
          }}
          tipo={emprestimoParaComprovante.status === 'devolvido' ? 'devolucao' : 'emprestimo'}
          dados={{
            id: emprestimoParaComprovante.id,
            para: emprestimoParaComprovante.nomeFuncionario,
            funcionario: emprestimoParaComprovante.nomeFuncionario,
            empresa: emprestimoParaComprovante.empresaNome || 'N/A',
            setor: emprestimoParaComprovante.setorNome || 'N/A',
            cargo: emprestimoParaComprovante.funcao || emprestimoParaComprovante.cargo || 'N/A',
            status: emprestimoParaComprovante.status || 'emprestado',
            quantidade: emprestimoParaComprovante.ferramentas?.length || 0,
            ferramentas: emprestimoParaComprovante.ferramentas?.map(f => 
              typeof f === 'object' ? (f.nome || f.descricao || f.ferramenta || 'Ferramenta') : String(f)
            ) || [],
            data: emprestimoParaComprovante.dataEmprestimo || emprestimoParaComprovante.dataCriacao,
            descricao: emprestimoParaComprovante.observacao,
            transacaoId: `WF-EMP-${emprestimoParaComprovante.id?.substring(0, 8).toUpperCase() || 'XXXXXXXX'}`
          }}
        />
      )}
    </div>
  );
};

export default DetailsModal;


