import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, User, Wrench, Backpack, HelpCircle, X, ChevronDown } from 'lucide-react';
import { obterDataAtual, obterHoraAtual } from '../../utils/dateUtils';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { NIVEIS_PERMISSAO } from '../../constants/permissoes';
import FerramentaSelector from './FerramentaSelector';
import BoxLoanAnimation from './BoxLoanAnimation';
import EmprestimoParticleAnimation from './EmprestimoParticleAnimation';
import FerramentaFlyingAnimation from './FerramentaFlyingAnimation';
import SafeImage from '../common/SafeImage';

const NovoEmprestimo = ({ inventario, adicionarEmprestimo, atualizarDisponibilidade }) => {
  const [funcionarios, setFuncionarios] = useState([]);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [emprestimoParaAnimar, setEmprestimoParaAnimar] = useState(null);
  const [showFlyingAnimation, setShowFlyingAnimation] = useState(false);
  const [ferramentaVoando, setFerramentaVoando] = useState(null);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const dropdownRef = useRef(null);

  // Carregar funcionários (nível 1, 2 e 3 - exceto Admin nível 0)
  useEffect(() => {
    const q = query(
      collection(db, 'usuarios')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const funcionariosData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(usuario => {
          // Filtra apenas usuários com nível >= 1 (excluindo Admin que é nível 0)
          const nivel = typeof usuario.nivel === 'number' ? usuario.nivel : parseInt(usuario.nivel);
          return nivel >= 1 && nivel <= 3;
        });
      
      // Ordenar por nome para melhor visualização
      funcionariosData.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
      
      // Debug: Mostrar todos os usuários carregados
      console.log('📋 Funcionários carregados para empréstimo:', funcionariosData.map(f => ({
        nome: f.nome,
        nivel: f.nivel,
        nivelTipo: f.nivel === 1 ? 'FUNCIONARIO' : f.nivel === 2 ? 'SUPERVISOR' : f.nivel === 3 ? 'GERENTE_SETOR' : 'OUTRO'
      })));
      
      setFuncionarios(funcionariosData);
    });

    return () => unsubscribe();
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownAberto(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Adiciona ferramenta à lista com quantidade
  const adicionarFerramenta = (ferramenta, quantidade = 1) => {
    if (!ferramenta) return;
    const itemInventario = inventario.find(item => item.nome.toLowerCase() === ferramenta.toLowerCase() && item.disponivel > 0);
    if (!itemInventario) return;

    // Verifica se a ferramenta já existe na lista
    const ferramentaExistente = novoEmprestimo.ferramentas.find(f => f.nome === itemInventario.nome);
    if (ferramentaExistente) return;

    if (quantidade > itemInventario.disponivel) {
      quantidade = itemInventario.disponivel;
    }

    // 🎬 Inicia animação de voo da ferramenta
    setFerramentaVoando({
      nome: itemInventario.nome,
      quantidade: quantidade,
      disponivel: itemInventario.disponivel
    });
    setShowFlyingAnimation(true);
  };

  // Remove ferramenta da lista
  const removerFerramenta = (ferramenta) => {
    setNovoEmprestimo(prev => ({
      ...prev,
      ferramentas: prev.ferramentas.filter(f => f.nome !== ferramenta)
    }));
  };

  // Atualiza a quantidade de uma ferramenta
  const atualizarQuantidade = (nome, quantidade) => {
    setNovoEmprestimo(prev => ({
      ...prev,
      ferramentas: prev.ferramentas.map(f => 
        f.nome === nome 
          ? { ...f, quantidade: parseInt(quantidade) }
          : f
      )
    }));
  };

  // Submete o novo empréstimo
  const handleSubmit = () => {
    if (!novoEmprestimo.colaborador) {
      alert('Por favor, selecione um funcionário');
      return;
    }
    
    if (novoEmprestimo.ferramentas.length === 0) {
      alert('Por favor, selecione pelo menos uma ferramenta');
      return;
    }

    const funcionarioSelecionado = funcionarios.find(f => f.nome === novoEmprestimo.colaborador);
    if (!funcionarioSelecionado) {
      alert('Funcionário não encontrado');
      return;
    }

    // Verifica se as quantidades são válidas
    for (const ferramenta of novoEmprestimo.ferramentas) {
      const itemInventario = inventario.find(item => item.nome === ferramenta.nome);
      if (!itemInventario || ferramenta.quantidade > itemInventario.disponivel) {
        alert(`Quantidade indisponível para ${ferramenta.nome}`);
        return;
      }
    }

    // Prepara os dados da animação
    setEmprestimoParaAnimar({
      ferramentas: novoEmprestimo.ferramentas,
      funcionarioNome: novoEmprestimo.colaborador,
      funcionarioFoto: funcionarioSelecionado.photoURL || null
    });

    // Mostra a animação
    setShowAnimation(true);
  };

  // Finaliza o empréstimo após a animação
  const finalizarEmprestimo = () => {
    const funcionarioSelecionado = funcionarios.find(f => f.nome === novoEmprestimo.colaborador);
    
    const novo = {
      ...novoEmprestimo,
      status: 'emprestado',
      dataEmprestimo: new Date().toISOString(),
      dataDevolucao: null,
      funcionarioId: funcionarioSelecionado.id,
      nomeFuncionario: funcionarioSelecionado.nome,
      nomeFerramentas: novoEmprestimo.ferramentas.map(f => f.nome),
      // Mapeia as ferramentas para incluir apenas nome e quantidade
      ferramentas: novoEmprestimo.ferramentas.map(f => ({
        nome: f.nome,
        quantidade: f.quantidade
      }))
    };
    
    const emprestimoAdicionado = adicionarEmprestimo(novo, atualizarDisponibilidade);
    
    if (emprestimoAdicionado) {
      setShowAnimation(false);
      setEmprestimoParaAnimar(null);
      
      // Limpar formulário
      setNovoEmprestimo({
        colaborador: '',
        ferramentas: []
      });
    }
  };
  const [novoEmprestimo, setNovoEmprestimo] = useState({
    colaborador: '',
    ferramentas: []
  });

  const ferramentasDisponiveis = inventario.filter(item => item.disponivel > 0);

  return (
    <>
      {/* Animação de voo da ferramenta */}
      {showFlyingAnimation && ferramentaVoando && (
        <FerramentaFlyingAnimation
          ferramenta={ferramentaVoando.nome}
          onComplete={() => {
            // Adiciona ferramenta à lista após animação
            setNovoEmprestimo(prev => ({
              ...prev,
              ferramentas: [...prev.ferramentas, {
                nome: ferramentaVoando.nome,
                quantidade: ferramentaVoando.quantidade,
                disponivel: ferramentaVoando.disponivel
              }]
            }));
            
            // Limpa estados da animação
            setShowFlyingAnimation(false);
            setFerramentaVoando(null);
          }}
        />
      )}

      {/* Animação de Empréstimo - Minimalista com Partículas (700ms) */}
      {showAnimation && emprestimoParaAnimar && (
        <EmprestimoParticleAnimation
          ferramentas={emprestimoParaAnimar.ferramentas}
          funcionarioNome={emprestimoParaAnimar.funcionarioNome}
          funcionarioFoto={emprestimoParaAnimar.funcionarioFoto}
          onComplete={finalizarEmprestimo}
        />
      )}

      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
        {/* Cabeçalho do Formulário */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Plus className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Novo Empréstimo
          </h2>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">Preencha os dados para registrar um novo empréstimo</p>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        <div className="space-y-4 md:space-y-6">
          <div className="space-y-2 md:space-y-3">
            <label className="flex items-center gap-2 text-sm md:text-base font-semibold text-gray-700 dark:text-gray-300">
              <User className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
              Funcionário Responsável
            </label>
            
            {/* Dropdown Customizado com Fotos */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownAberto(!dropdownAberto)}
                className="min-h-[48px] md:h-12 w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all px-3 md:px-4 font-medium shadow-sm flex items-center justify-between text-sm md:text-base"
              >
                <span className="flex items-center gap-2 md:gap-3 min-w-0">
                  {novoEmprestimo.colaborador ? (
                    <>
                      {(() => {
                        const funcSelecionado = funcionarios.find(f => f.nome === novoEmprestimo.colaborador);
                        const nivel = typeof funcSelecionado?.nivel === 'number' ? funcSelecionado.nivel : parseInt(funcSelecionado?.nivel || 0);
                        const cargo = nivel === 1 ? 'Funcionário' : nivel === 2 ? 'Supervisor' : nivel === 3 ? 'Gerente' : '';
                        
                        return (
                          <>
                            <SafeImage
                              src={funcSelecionado?.photoURL || funcSelecionado?.fotoPerfil}
                              alt={funcSelecionado?.nome}
                              className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-blue-300 dark:border-blue-600 flex-shrink-0"
                              fallback={
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center border-2 border-blue-300 dark:border-blue-600 flex-shrink-0">
                                  <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                </div>
                              }
                            />
                            <div className="flex flex-col items-start min-w-0">
                              <span className="font-semibold truncate max-w-full">{novoEmprestimo.colaborador}</span>
                              {cargo && <span className="text-xs text-gray-500 dark:text-gray-400">{cargo}</span>}
                            </div>
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">Selecione um funcionário...</span>
                  )}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${dropdownAberto ? 'rotate-180' : ''}`} />
              </button>

              {/* Lista de Funcionários */}
              {dropdownAberto && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl max-h-60 md:max-h-80 overflow-y-auto">
                  {funcionarios.length === 0 ? (
                    <div className="p-4 text-center text-sm md:text-base text-gray-500 dark:text-gray-400">
                      Nenhum funcionário disponível
                    </div>
                  ) : (
                    funcionarios.map((funcionario) => {
                      const nivel = typeof funcionario.nivel === 'number' ? funcionario.nivel : parseInt(funcionario.nivel);
                      let cargo = '';
                      let corCargo = '';
                      
                      if (nivel === 1) {
                        cargo = 'Funcionário';
                        corCargo = 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
                      } else if (nivel === 2) {
                        cargo = 'Supervisor';
                        corCargo = 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
                      } else if (nivel === 3) {
                        cargo = 'Gerente';
                        corCargo = 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
                      }
                      
                      return (
                        <button
                          key={funcionario.id}
                          type="button"
                          onClick={() => {
                            setNovoEmprestimo({...novoEmprestimo, colaborador: funcionario.nome});
                            setFuncionarioSelecionado(funcionario.nome);
                            setDropdownAberto(false);
                          }}
                          className={`w-full p-3 md:p-4 flex items-center gap-3 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors active:bg-blue-100 dark:active:bg-gray-600 min-h-[60px] ${
                            novoEmprestimo.colaborador === funcionario.nome ? 'bg-blue-50 dark:bg-gray-700' : ''
                          }`}
                        >
                          <SafeImage
                            src={funcionario.photoURL || funcionario.fotoPerfil}
                            alt={funcionario.nome}
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-blue-300 dark:border-blue-600 flex-shrink-0"
                            fallback={
                              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center border-2 border-blue-300 dark:border-blue-600 flex-shrink-0">
                                <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
                              </div>
                            }
                          />
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-white truncate">{funcionario.nome}</p>
                            {cargo && (
                              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${corCargo}`}>
                                {cargo}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Selecionar Ferramenta
            </label>
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700/50 rounded-xl p-4">
              <FerramentaSelector 
                ferramentasDisponiveis={ferramentasDisponiveis}
                onAdicionarFerramenta={adicionarFerramenta}
              />
              <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                <HelpCircle className="w-4 h-4" />
                <span>Selecione ferramentas disponíveis no inventário</span>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowHelp(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-all"
              >
                <HelpCircle className="w-4 h-4" />
                Como funciona?
              </button>
            </div>
          </div>
        </div>

        {/* Modal de Ajuda */}
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Como realizar um empréstimo</h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-medium">1</div>
                    <p className="text-gray-600 dark:text-gray-300">Selecione o funcionário responsável pelo empréstimo no campo de funcionário.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-medium">2</div>
                    <p className="text-gray-600 dark:text-gray-300">No campo de ferramentas, escolha a ferramenta desejada na lista de ferramentas disponíveis.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-medium">3</div>
                    <p className="text-gray-600 dark:text-gray-300">Após selecionar uma ferramenta, você pode ajustar a quantidade necessária no campo específico.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-medium">4</div>
                    <p className="text-gray-600 dark:text-gray-300">Repita o processo para adicionar mais ferramentas ao mesmo empréstimo, se necessário.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-medium">5</div>
                    <p className="text-gray-600 dark:text-gray-300">Você pode alterar a quantidade de qualquer ferramenta já selecionada ou removê-la usando o ícone de lixeira.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-medium">6</div>
                    <p className="text-gray-600 dark:text-gray-300">Quando estiver tudo pronto, clique em "Registrar Empréstimo" para finalizar.</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={() => setShowHelp(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Backpack className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Ferramentas Selecionadas
              </h3>
              {novoEmprestimo.ferramentas.length > 0 && (
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold px-3 py-1 rounded-full">
                  {novoEmprestimo.ferramentas.length} {novoEmprestimo.ferramentas.length === 1 ? 'item' : 'itens'}
                </span>
              )}
            </div>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 min-h-[200px] max-h-[calc(50vh-4rem)] overflow-y-auto bg-white dark:bg-gray-800/50 backdrop-blur-sm">
              {novoEmprestimo.ferramentas.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-12">
                  <Backpack className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">Nenhuma ferramenta selecionada</p>
                  <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Selecione ferramentas acima para iniciar</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {novoEmprestimo.ferramentas.map((ferramenta, index) => (
                    <div 
                      key={index} 
                      className="flex flex-col p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 break-words flex-1" title={ferramenta.nome}>
                            {ferramenta.nome}
                          </span>
                          <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-1 rounded-lg font-medium whitespace-nowrap">
                            {ferramenta.disponivel} disp.
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-auto">
                          <div className="flex-1">
                            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">Quantidade:</label>
                            <select
                              value={ferramenta.quantidade}
                              onChange={(e) => atualizarQuantidade(ferramenta.nome, e.target.value)}
                              className="h-10 w-full bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-3 transition-all font-semibold"
                            >
                              {[...Array(ferramenta.disponivel)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>
                                  {i + 1} {i + 1 === 1 ? 'unidade' : 'unidades'}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={() => removerFerramenta(ferramenta.nome)}
                            className="h-10 w-10 flex items-center justify-center text-red-600 hover:text-white dark:text-red-400 dark:hover:text-white rounded-lg border-2 border-red-200 dark:border-red-900/50 hover:bg-red-500 dark:hover:bg-red-500 hover:border-red-500 transition-all mt-5"
                            title="Remover ferramenta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!novoEmprestimo.colaborador || novoEmprestimo.ferramentas.length === 0}
            className="h-14 w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-700 dark:disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:shadow-none text-base"
          >
            <Plus className="w-5 h-5" />
            Registrar Empréstimo
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

export default NovoEmprestimo;



