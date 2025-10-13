import React, { useState } from 'react';
import { Search, CheckCircle, Clock, Trash2, CircleDotDashed, Edit2, Pencil, FileText } from 'lucide-react';
import { formatarData, formatarDataHora } from '../../utils/dateUtils';
import DevolucaoTerceirosModal from './DevolucaoTerceirosModal';
import DevolucaoParcialModal from './DevolucaoParcialModal';
import ComprovanteModal from '../Comprovantes/ComprovanteModal';
import { NIVEIS_PERMISSAO } from '../../constants/permissoes';
import { useAuth } from '../../hooks/useAuth';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const HistoricoEmprestimosTab = ({ 
  emprestimos = [], 
  devolverFerramentas = () => {},
  removerEmprestimo = () => {},
  atualizarDisponibilidade = () => true
}) => {
  const [filtroEmprestimos, setFiltroEmprestimos] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos'); // 'todos', 'hoje', 'semana', 'mes'
  const [filtroStatus, setFiltroStatus] = useState('todos'); // 'todos', 'emprestado', 'devolvido'
  const [ferramentasSelecionadas, setFerramentasSelecionadas] = useState({});
  const [showDevolucaoModal, setShowDevolucaoModal] = useState(false);
  const [showDevolucaoParcialModal, setShowDevolucaoParcialModal] = useState(false);
  const [selectedEmprestimo, setSelectedEmprestimo] = useState(null);
  const [emprestimoParaDevolucaoParcial, setEmprestimoParaDevolucaoParcial] = useState(null);
  const [showConfirmacaoExclusao, setShowConfirmacaoExclusao] = useState(false);
  const [emprestimoParaExcluir, setEmprestimoParaExcluir] = useState(null);
  const [showComprovanteModal, setShowComprovanteModal] = useState(false);
  const [emprestimoParaComprovante, setEmprestimoParaComprovante] = useState(null);
  const { usuario } = useAuth();
  
  // ✅ Sistema reverso: Admin (0) <= Supervisor (2) = tem permissão
  const temPermissaoEdicao = usuario && usuario.nivel <= NIVEIS_PERMISSAO.SUPERVISOR;

  const isWithinPeriod = (date, period) => {
    if (!date) return false;
    const today = new Date();
    const empDate = new Date(date);
    
    switch (period) {
      case 'hoje':
        return empDate.getDate() === today.getDate() &&
               empDate.getMonth() === today.getMonth() &&
               empDate.getFullYear() === today.getFullYear();
      case 'semana':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return empDate >= weekAgo;
      case 'mes':
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        return empDate >= monthAgo;
      default:
        return true;
    }
  };

  const emprestimosFiltrados = (emprestimos || [])
    .filter(emp => {
      if (!emp || !emp.dataEmprestimo) return false;
      
      // Filtra por período
      if (!isWithinPeriod(emp.dataEmprestimo, filtroPeriodo)) return false;

      // Filtra por status
      if (filtroStatus !== 'todos' && emp.status !== filtroStatus) return false;

      const funcionario = (emp.nomeFuncionario || emp.colaborador || '').toLowerCase();
      const ferramentas = emp.nomeFerramentas || [];
      const filtro = filtroEmprestimos.toLowerCase();
      
      return funcionario.includes(filtro) ||
             ferramentas.some(f => f.toLowerCase().includes(filtro));
    })
    .sort((a, b) => {
      // Ordena por data/hora de empréstimo mais recente primeiro
      const dataA = a?.dataEmprestimo ? new Date(a.dataEmprestimo) : new Date();
      const dataB = b?.dataEmprestimo ? new Date(b.dataEmprestimo) : new Date();
      return dataB - dataA;
    });

  const handleDevolverFerramentas = (id) => {
    if (!id || !Array.isArray(emprestimos)) {
      console.error('ID inválido ou empréstimos não é um array:', { id, emprestimos });
      return;
    }
    
    const emprestimo = emprestimos.find(e => e.id === id);
    if (!emprestimo) {
      console.error('Empréstimo não encontrado com o ID:', id);
      return;
    }

    if (!Array.isArray(emprestimo.ferramentas)) {
      console.error('Empréstimo sem array de ferramentas válido:', emprestimo);
      return;
    }

    // Faz uma cópia profunda do empréstimo para evitar problemas de referência
    const emprestimoParaDevolver = JSON.parse(JSON.stringify(emprestimo));
    
    if (emprestimoParaDevolver.ferramentas.length === 0) {
      console.error('Empréstimo sem ferramentas para devolver:', emprestimoParaDevolver);
      return;
    }

    if (emprestimo.ferramentas.length > 1) {
      setEmprestimoParaDevolucaoParcial(emprestimoParaDevolver);
      setShowDevolucaoParcialModal(true);
    } else {
      setSelectedEmprestimo(emprestimoParaDevolver);
      setShowDevolucaoModal(true);
    }
  };

  const handleDevolverFerramentasParcial = async (emprestimo, ferramentasSelecionadas, devolvidoPorTerceiros) => {
    if (!emprestimo || !Array.isArray(ferramentasSelecionadas) || ferramentasSelecionadas.length === 0) {
      console.error('Parâmetros inválidos:', { emprestimo, ferramentasSelecionadas });
      return;
    }

    if (!Array.isArray(emprestimo.ferramentas)) {
      console.error('Empréstimo sem array de ferramentas válido:', emprestimo);
      return;
    }

    try {
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
    } catch (error) {
      console.error('Erro ao fazer devolução parcial:', error);
    }
    setShowDevolucaoParcialModal(false);
    setEmprestimoParaDevolucaoParcial(null);
  };

  const handleConfirmDevolucao = async (devolvidoPorTerceiros) => {
    try {
      if (!selectedEmprestimo) {
        console.error('Nenhum empréstimo selecionado');
        return;
      }

      if (typeof devolverFerramentas !== 'function') {
        console.error('devolverFerramentas não é uma função');
        return;
      }

      // Realiza a devolução total do empréstimo

      await devolverFerramentas(selectedEmprestimo.id, atualizarDisponibilidade, devolvidoPorTerceiros);

      setSelectedEmprestimo(null);
      setShowDevolucaoModal(false);
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

  const cancelarExclusao = () => {
    setShowConfirmacaoExclusao(false);
    setEmprestimoParaExcluir(null);
  };

  const handleGerarComprovante = (emprestimo) => {
    setEmprestimoParaComprovante(emprestimo);
    setShowComprovanteModal(true);
  };

  // Verifica se há ferramentas emprestadas no array de ferramentas
  const temFerramentasEmprestadas = (emprestimo) => {
    if (!emprestimo || typeof emprestimo !== 'object') {
      console.error('Empréstimo inválido:', emprestimo);
      return false;
    }
    return Array.isArray(emprestimo.ferramentas) && emprestimo.ferramentas.length > 0;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 min-w-[350px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="       Buscar por colaborador ou ferramenta..."
              value={filtroEmprestimos}
              onChange={(e) => setFiltroEmprestimos(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border border-gray-200 dark:border-gray-600 dark:border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] dark:bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 text-sm"
            />
          </div>
          <select
            value={filtroPeriodo}
            onChange={(e) => setFiltroPeriodo(e.target.value)}
            className="border border-gray-200 dark:border-gray-600 dark:border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] dark:bg-white dark:bg-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <option value="todos">Todos os períodos</option>
            <option value="hoje">Hoje</option>
            <option value="semana">Últimos 7 dias</option>
            <option value="mes">Último mês</option>
          </select>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="border border-gray-200 dark:border-gray-600 dark:border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] dark:bg-white dark:bg-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <option value="todos">Todos os status</option>
            <option value="emprestado">Não devolvidos</option>
            <option value="devolvido">Devolvidos</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {emprestimosFiltrados.map(emprestimo => (
          <div key={emprestimo.id} className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <div className="p-4">
              {/* Cabeçalho do Card */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {emprestimo.nomeFuncionario || emprestimo.colaborador || '-'}
                  </h3>
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    emprestimo.status === 'emprestado'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {emprestimo.status === 'emprestado' ? (
                      <><Clock className="w-3 h-3 inline mr-1" />Emprestado</>
                    ) : (
                      <><CheckCircle className="w-3 h-3 inline mr-1" />Devolvido</>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">

                  {emprestimo.status === 'emprestado' && temFerramentasEmprestadas(emprestimo) && (
                    <button
                      onClick={() => handleDevolverFerramentas(emprestimo.id)}
                      className="text-green-600 hover:text-green-800 p-1.5 transition-colors duration-200 rounded-full hover:bg-green-100 dark:hover:bg-green-900"
                      title="Marcar como devolvido"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoverEmprestimo(emprestimo)}
                    className="text-red-600 hover:text-red-800 p-1.5 transition-colors duration-200 rounded-full hover:bg-red-100 dark:hover:bg-red-900"
                    title="Remover registro"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Lista de Ferramentas */}
              <div className="space-y-2 mb-4">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ferramentas:</h4>
                <div className="space-y-1">
                  {Array.isArray(emprestimo?.ferramentas) ? (
                    emprestimo.ferramentas.map((ferramenta, idx) => {
                      const ferramentaDevolvida = emprestimo.ferramentasParcialmenteDevolvidas?.some(
                        devolucao => devolucao.ferramentas.some(f => f.id === ferramenta.id)
                      );
                      
                      return (
                        <div 
                          key={idx} 
                          className={`flex items-center gap-2 text-sm ${
                            ferramentaDevolvida ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'
                          }`}
                        >
                          <CircleDotDashed className={`w-3 h-3 ${ferramentaDevolvida ? 'text-gray-400' : ''}`} />
                          <span className={ferramentaDevolvida ? 'line-through' : ''}>
                            {ferramenta.nome}
                            {ferramenta.quantidade > 1 && (
                              <span className="text-gray-500 dark:text-gray-400 ml-1">({ferramenta.quantidade} unidades)</span>
                            )}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-gray-500">Sem ferramentas</div>
                  )}
                </div>
              </div>

              {/* Datas */}
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Retirada:</span>
                  <span>{formatarDataHora(emprestimo.dataEmprestimo)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Devolução:</span>
                  <span>
                    {emprestimo.dataDevolucao ? (
                      <div className="text-right">
                        <div>{formatarDataHora(emprestimo.dataDevolucao)}</div>
                        {emprestimo.devolvidoPorTerceiros && (
                          <div className="text-xs text-orange-600 mt-1">
                            Devolvido por terceiros
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Botão de Comprovante */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-2 mb-3">
                <button
                  onClick={() => handleGerarComprovante(emprestimo)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 font-medium text-sm"
                >
                  <FileText className="w-4 h-4" />
                  Ver Comprovante
                </button>
              </div>

              {/* Campo de Observações */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-2">
                <div 
                  className={`group min-h-[60px] rounded-md relative ${
                    temPermissaoEdicao ? 'hover:bg-gray-100 dark:hover:bg-gray-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <span>Observações</span>
                    </div>
                  </div>
                  <div
                    id={`observacoes-${emprestimo.id}`}
                    contentEditable={temPermissaoEdicao}
                    onBlur={async (e) => {
                      if (!temPermissaoEdicao) return;

                      let newContent = e.target.textContent.trim();
                      const oldContent = emprestimo.observacoes || '';

                      // Se estiver vazio, restaura o texto de exemplo sem salvar
                      if (!newContent) {
                        e.target.textContent = 'Clique para adicionar observações';
                        return;
                      }

                      // Só salva se o conteúdo for diferente do anterior
                      if (newContent !== oldContent) {
                        try {
                          const emprestimoRef = doc(db, 'emprestimos', emprestimo.id);
                          const updateData = {
                            observacoes: newContent,
                            historicoObservacoes: arrayUnion({
                              data: new Date().toISOString(),
                              usuario: usuario.email,
                              observacao: newContent,
                              observacaoAnterior: oldContent
                            })
                          };
                          await updateDoc(emprestimoRef, updateData);
                        } catch (error) {
                          console.error('Erro ao salvar observações:', error);
                          alert('Erro ao salvar as observações. Por favor, tente novamente.');
                          // Restaura o conteúdo anterior em caso de erro
                          e.target.textContent = oldContent || 'Clique para adicionar observações';
                        }
                      }
                    }}
                    className={`text-sm p-2 rounded whitespace-pre-wrap transition-colors duration-200 min-h-[40px]
                      ${temPermissaoEdicao ? 'cursor-text focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:ring-1 focus:ring-blue-500' : ''}
                      ${emprestimo.observacoes ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500 italic'}
                    `}
                    suppressContentEditableWarning={true}
                  >
                    {emprestimo.observacoes || (temPermissaoEdicao ? 'Clique para adicionar observações' : 'Nenhuma observação')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showDevolucaoModal && selectedEmprestimo && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <DevolucaoTerceirosModal
            emprestimo={selectedEmprestimo}
            onClose={() => {
              setShowDevolucaoModal(false);
              setSelectedEmprestimo(null);
            }}
            onConfirm={handleConfirmDevolucao}
          />
        </div>
      )}

      {showDevolucaoParcialModal && emprestimoParaDevolucaoParcial && Array.isArray(emprestimoParaDevolucaoParcial.ferramentas) && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <DevolucaoParcialModal
            emprestimo={emprestimoParaDevolucaoParcial}
            onClose={() => {
              setShowDevolucaoParcialModal(false);
              setEmprestimoParaDevolucaoParcial(null);
            }}
            onConfirm={(ferramentasSelecionadas, devolvidoPorTerceiros) => {
              handleDevolverFerramentasParcial(
                emprestimoParaDevolucaoParcial,
                ferramentasSelecionadas,
                devolvidoPorTerceiros
              );
            }}
          />
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showConfirmacaoExclusao && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-700 rounded-lg p-6 max-w-md w-full border border-gray-200 dark:border-gray-600 dark:border-gray-600">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Confirmar Exclusão
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Tem certeza que deseja excluir este registro de empréstimo do histórico?
              {emprestimoParaExcluir?.nomeFuncionario && (
                <span className="block mt-2">
                  Empréstimo de: <span className="text-white">{emprestimoParaExcluir.nomeFuncionario}</span>
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelarExclusao}
                className="px-4 py-2 text-sm rounded-lg bg-[#38444D] text-gray-900 dark:text-white hover:bg-[#454F59] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarExclusao}
                className="px-4 py-2 text-sm rounded-lg bg-[#F4212E] text-gray-900 dark:text-white hover:bg-[#E01D29] transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

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

export default HistoricoEmprestimosTab;

