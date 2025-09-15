import React, { useState, useMemo } from 'react';
import { Search, CheckCircle, Trash2, Clock, User, Wrench, X, Plus } from 'lucide-react';
import DevolucaoModal from './DevolucaoModal';
import DevolucaoParcialModal from './DevolucaoParcialModal';
import ConfirmacaoModal from '../common/ConfirmacaoModal';
import NovoEmprestimo from './NovoEmprestimo';

const EmprestimoCard = ({ emprestimo, onDevolucao, onDevolucaoParcial, onRemover }) => {
  const getFuncionarioNome = (emprestimo) => {
    return emprestimo.funcionario?.nome || 
           emprestimo.nomeFuncionario || 
           emprestimo.colaborador || 
           'Funcionário não encontrado';
  };

  const getFerramentaNome = (ferramenta) => {
    if (!ferramenta) return 'Ferramenta não encontrada';
    return typeof ferramenta === 'object' ? ferramenta.nome : ferramenta;
  };

  return (
    <div className="bg-[#253341] rounded-xl p-4 flex flex-col h-full">
      {/* Cabeçalho com Data/Hora e Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#1DA1F2]" />
          <span className="text-[#8899A6] text-sm">
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
            <Wrench className="w-4 h-4 text-[#8899A6]" />
            <span className="text-[#8899A6] text-sm">{getFerramentaNome(ferramenta)}</span>
          </div>
        ))}
      </div>

      {/* Ações */}
      <div className="mt-4 pt-3 border-t border-[#38444D] flex justify-end gap-2">
        {emprestimo.status === 'emprestado' && (
          <>
            {emprestimo.ferramentas?.length > 1 ? (
              <button
                onClick={() => onDevolucaoParcial(emprestimo)}
                className="text-blue-400 hover:text-blue-300 p-1.5 transition-colors duration-200 rounded-full hover:bg-blue-500/20"
                title="Devolução parcial"
              >
                <CheckCircle className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => onDevolucao(emprestimo.id)}
                className="text-green-400 hover:text-green-300 p-1.5 transition-colors duration-200 rounded-full hover:bg-green-500/20"
                title="Marcar como devolvido"
              >
                <CheckCircle className="w-5 h-5" />
              </button>
            )}
          </>
        )}
        <button
          onClick={() => onRemover(emprestimo)}
          className="text-red-400 hover:text-red-300 p-1.5 transition-colors duration-200 rounded-full hover:bg-red-500/20"
          title="Remover registro"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const FuncionarioCard = ({ nome, emprestimos, expanded, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-[#253341] rounded-xl p-4 cursor-pointer hover:bg-[#2C3E50] transition-colors ${
      expanded ? 'col-span-full' : ''
    }`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <User className="w-5 h-5 text-[#1DA1F2]" />
        <div>
          <h4 className="text-white font-medium">{nome}</h4>
          <p className="text-sm text-[#8899A6]">
            {emprestimos.length} empréstimo{emprestimos.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  </div>
);

const EmprestimosTab = ({
  emprestimos,
  funcionarios,
  inventario,
  devolverFerramentas,
  removerEmprestimo,
  registrarEmprestimo,
  atualizarDisponibilidade,
  readonly
}) => {
  const [filtroEmprestimos, setFiltroEmprestimos] = useState('');
  const [selectedEmprestimo, setSelectedEmprestimo] = useState(null);
  const [emprestimoParaDevolucaoParcial, setEmprestimoParaDevolucaoParcial] = useState(null);
  const [emprestimoParaExcluir, setEmprestimoParaExcluir] = useState(null);
  const [showDevolucaoModal, setShowDevolucaoModal] = useState(false);
  const [showDevolucaoParcialModal, setShowDevolucaoParcialModal] = useState(false);
  const [showConfirmacaoExclusao, setShowConfirmacaoExclusao] = useState(false);
  const [expandedFuncionario, setExpandedFuncionario] = useState(null);

  const getFuncionarioNome = (emprestimo) => {
    // Verifica cada possível campo onde o nome do funcionário pode estar
    const possibleNames = [
      emprestimo.funcionario?.nome,
      emprestimo.nomeFuncionario,
      emprestimo.colaborador,
      emprestimo.nome_funcionario,
      emprestimo.funcionarioNome
    ];

    // Encontra o primeiro nome válido da lista
    const nome = possibleNames.find(name => name && typeof name === 'string' && name.trim() !== '');
    
    // Retorna o nome encontrado ou a mensagem de não encontrado
    return nome ? nome.trim() : 'Funcionário não identificado';
  };

  // Agrupa empréstimos por funcionário
  const emprestimosAgrupados = useMemo(() => {
    const grupos = {};
    const filtro = filtroEmprestimos.toLowerCase();
    
    emprestimos.forEach(emprestimo => {
      if (emprestimo.status !== 'emprestado') return; // Filtra apenas empréstimos ativos
      
      const funcionarioNome = getFuncionarioNome(emprestimo);
      
      // Aplica o filtro de busca
      if (filtro && !funcionarioNome.toLowerCase().includes(filtro) && 
          !emprestimo.ferramentas?.some(f => 
            (typeof f === 'string' ? f : f.nome).toLowerCase().includes(filtro)
          )) {
        return;
      }
      
      if (!grupos[funcionarioNome]) {
        grupos[funcionarioNome] = [];
      }
      
      grupos[funcionarioNome].push(emprestimo);
    });
    
    return Object.entries(grupos).sort(([nomeA], [nomeB]) => nomeA.localeCompare(nomeB));
  }, [emprestimos, filtroEmprestimos]);

  const handleDevolverFerramentas = (id) => {
    const emprestimo = emprestimos.find(e => e.id === id);
    if (!emprestimo) return;

    if (emprestimo.ferramentas?.length > 1) {
      setEmprestimoParaDevolucaoParcial(emprestimo);
      setShowDevolucaoParcialModal(true);
    } else {
      setSelectedEmprestimo(id);
      setShowDevolucaoModal(true);
    }
  };

  const handleDevolverFerramentasParcial = (emprestimo, ferramentasSelecionadas, devolvidoPorTerceiros) => {
    if (!emprestimo || !ferramentasSelecionadas.length) return;

    const ferramentasNaoDevolvidas = emprestimo.ferramentas.filter(
      f => !ferramentasSelecionadas.find(fs => fs.id === f.id)
    );

    // Atualiza o empréstimo removendo apenas as ferramentas selecionadas
    if (ferramentasNaoDevolvidas.length === 0) {
      // Se todas as ferramentas foram selecionadas, marca como totalmente devolvido
      devolverFerramentas(emprestimo.id, atualizarDisponibilidade, devolvidoPorTerceiros);
    } else {
      // Se ainda há ferramentas não devolvidas, atualiza o registro mantendo apenas elas
      const atualizacao = {
        ferramentas: ferramentasNaoDevolvidas,
        ferramentasParcialmenteDevolvidas: [
          ...(emprestimo.ferramentasParcialmenteDevolvidas || []),
          {
            ferramentas: ferramentasSelecionadas,
            dataDevolucao: new Date().toISOString(),
            devolvidoPorTerceiros
          }
        ]
      };
      
      if (typeof devolverFerramentas === 'function') {
        devolverFerramentas(emprestimo.id, atualizarDisponibilidade, devolvidoPorTerceiros, atualizacao);
      }
    }
    setShowDevolucaoParcialModal(false);
    setEmprestimoParaDevolucaoParcial(null);
  };

  const handleConfirmDevolucao = async (devolvidoPorTerceiros) => {
    try {
      if (typeof devolverFerramentas === 'function') {
        await devolverFerramentas(selectedEmprestimo, atualizarDisponibilidade, devolvidoPorTerceiros);
        setSelectedEmprestimo(null);
        setShowDevolucaoModal(false);
      }
    } catch (error) {
      console.error('Erro ao devolver ferramentas:', error);
    }
  };

  const handleRemoverEmprestimo = (emprestimo) => {
    setEmprestimoParaExcluir(emprestimo);
    setShowConfirmacaoExclusao(true);
  };

  const confirmarExclusao = () => {
    if (emprestimoParaExcluir) {
      removerEmprestimo(emprestimoParaExcluir.id, atualizarDisponibilidade);
    }
    setShowConfirmacaoExclusao(false);
    setEmprestimoParaExcluir(null);
  };

  const handleNovoEmprestimo = (dados) => {
    if (typeof registrarEmprestimo === 'function') {
      registrarEmprestimo(dados);
    }
  };

  const toggleFuncionario = (nome) => {
    setExpandedFuncionario(expandedFuncionario === nome ? null : nome);
  };

  return (
    <div className="bg-[#192734] rounded-xl p-6">
      {/* Formulário de Novo Empréstimo */}
      {!readonly && (
        <NovoEmprestimo
          funcionarios={funcionarios}
          inventario={inventario}
          registrarEmprestimo={handleNovoEmprestimo}
        />
      )}
      
      {/* Barra de pesquisa */}
      <div className="mt-6 mb-6">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8899A6]" />
          <input
            type="text"
            placeholder="    Buscar..."
            value={filtroEmprestimos}
            onChange={(e) => setFiltroEmprestimos(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#253341] text-white rounded-lg border border-[#38444D] focus:border-[#1DA1F2] focus:outline-none"
          />
        </div>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {emprestimosAgrupados.map(([funcionarioNome, emprestimosFunc]) => (
          <React.Fragment key={funcionarioNome}>
            <FuncionarioCard
              nome={funcionarioNome}
              emprestimos={emprestimosFunc}
              expanded={expandedFuncionario === funcionarioNome}
              onClick={() => toggleFuncionario(funcionarioNome)}
            />
            {expandedFuncionario === funcionarioNome && (
              <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {emprestimosFunc.map(emprestimo => (
                  <EmprestimoCard
                    key={emprestimo.id}
                    emprestimo={emprestimo}
                    onDevolucao={handleDevolverFerramentas}
                    onDevolucaoParcial={setEmprestimoParaDevolucaoParcial}
                    onRemover={handleRemoverEmprestimo}
                  />
                ))}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Modais */}
      {showDevolucaoModal && (
        <DevolucaoModal
          isOpen={showDevolucaoModal}
          onClose={() => setShowDevolucaoModal(false)}
          onConfirm={handleConfirmDevolucao}
        />
      )}

      {showDevolucaoParcialModal && (
        <DevolucaoParcialModal
          isOpen={showDevolucaoParcialModal}
          onClose={() => {
            setShowDevolucaoParcialModal(false);
            setEmprestimoParaDevolucaoParcial(null);
          }}
          emprestimo={emprestimoParaDevolucaoParcial}
          onConfirm={handleDevolverFerramentasParcial}
        />
      )}

      {showConfirmacaoExclusao && (
        <ConfirmacaoModal
          isOpen={showConfirmacaoExclusao}
          onClose={() => {
            setShowConfirmacaoExclusao(false);
            setEmprestimoParaExcluir(null);
          }}
          onConfirm={confirmarExclusao}
          titulo="Confirmar Exclusão"
          mensagem="Tem certeza que deseja remover este empréstimo?"
        />
      )}
    </div>
  );
};

export default EmprestimosTab;