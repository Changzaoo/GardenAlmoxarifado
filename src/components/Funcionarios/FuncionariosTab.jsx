import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Users, Trash2, Plus, Edit, Camera, Star, Wrench, CheckCircle, Clock, Phone, Trophy, ThumbsUp } from 'lucide-react';
import { storage, db } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '../ToastProvider';
import FuncionarioProfile from './FuncionarioProfile';

// Função para formatar número de telefone
const formatarTelefone = (telefone) => {
  const cleaned = telefone.replace(/\D/g, '');
  let match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return telefone;
};

const FuncionariosTab = ({ funcionarios = [], adicionarFuncionario, removerFuncionario, atualizarFuncionario, readonly }) => {
  const [novoFuncionario, setNovoFuncionario] = useState({ nome: '', cargo: '', telefone: '' });
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({ nome: '', cargo: '', telefone: '', photoURL: '' });
  const [modalConfirmacao, setModalConfirmacao] = useState(false);
  const [funcionarioParaExcluir, setFuncionarioParaExcluir] = useState(null);
  const [preview, setPreview] = useState(null);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [funcionariosStats, setFuncionariosStats] = useState({});
  const [funcionariosPontos, setFuncionariosPontos] = useState({});
  const [filtroAtual, setFiltroAtual] = useState('nome');
  const fileInputRef = useRef();

  const calcularPontuacao = (dados) => {
    const pontosPorFerramentasDevolvidas = (dados.ferramentasDevolvidas || 0) * 20;
    const pontosPorTarefasConcluidas = (dados.tarefasConcluidas || 0) * 50;
    const pontosPorAvaliacao = dados.mediaAvaliacao ? Math.round(dados.mediaAvaliacao * 10) : 0;

    return {
      total: pontosPorFerramentasDevolvidas + pontosPorTarefasConcluidas + pontosPorAvaliacao,
      detalhes: {
        ferramentas: pontosPorFerramentasDevolvidas,
        tarefas: pontosPorTarefasConcluidas,
        avaliacao: pontosPorAvaliacao
      }
    };
  };

  // Funções de ordenação
  const ordenarPorNome = (a, b) => a.nome.localeCompare(b.nome);
  const ordenarPorAvaliacao = (a, b) => (
    (funcionariosStats[b.id]?.mediaAvaliacao || 0) - (funcionariosStats[a.id]?.mediaAvaliacao || 0)
  );
  const ordenarPorTarefasConcluidas = (a, b) => (
    (funcionariosStats[b.id]?.tarefasConcluidas || 0) - (funcionariosStats[a.id]?.tarefasConcluidas || 0)
  );
  const ordenarPorEmprestimos = (a, b) => (
    (funcionariosStats[b.id]?.emprestimosAtivos || 0) - (funcionariosStats[a.id]?.emprestimosAtivos || 0)
  );
  const ordenarPorPontos = (a, b) => (
    (funcionariosPontos[b.id]?.total || 0) - (funcionariosPontos[a.id]?.total || 0)
  );

  // Função para obter a função de ordenação atual
  const getFuncaoOrdenacao = () => {
    switch (filtroAtual) {
      case 'avaliacao':
        return (a, b) => {
          const mediaA = funcionariosStats[a.id]?.avaliacoes?.length > 0
            ? (funcionariosStats[a.id].avaliacoes.reduce((sum, av) => sum + Number(av.nota || 0), 0) / funcionariosStats[a.id].avaliacoes.length)
            : 0;
          const mediaB = funcionariosStats[b.id]?.avaliacoes?.length > 0
            ? (funcionariosStats[b.id].avaliacoes.reduce((sum, av) => sum + Number(av.nota || 0), 0) / funcionariosStats[b.id].avaliacoes.length)
            : 0;
          return mediaB - mediaA;
        };
      case 'tarefas':
        return ordenarPorTarefasConcluidas;
      case 'emprestimos':
        return ordenarPorEmprestimos;
      case 'pontos':
        return ordenarPorPontos;
      default:
        return ordenarPorNome;
    }
  };

  // Função para filtrar funcionários
  const filtrarFuncionarios = (funcionarios) => {
    if (!funcionarios) return [];
    const searchLower = searchTerm.toLowerCase();
    return funcionarios.filter(func => {
      return func.nome?.toLowerCase().includes(searchLower) ||
             func.cargo?.toLowerCase().includes(searchLower) ||
             func.telefone?.includes(searchTerm) ||
             func.email?.toLowerCase().includes(searchLower) ||
             func.matricula?.toLowerCase().includes(searchLower) ||
             func.setor?.toLowerCase().includes(searchLower);
    });
  };

  // Processar funcionários com filtro e ordenação
  const funcionariosFiltrados = filtrarFuncionarios(funcionarios);

  const { usuario } = useAuth();
  const isFuncionario = usuario?.nivel === 'funcionario';

  // Buscar estatísticas dos funcionários
  useEffect(() => {
    const fetchFuncionariosStats = async () => {
      const stats = {};
      
      for (const func of funcionarios) {
        const tarefasRef = collection(db, 'tarefas');
        const emprestimosRef = collection(db, 'emprestimos');
        const avaliacoesRef = collection(db, 'avaliacoes');
        const avaliacoesDesempenhoRef = collection(db, 'avaliacoesDesempenho');
        
        // 1. Buscar todas as tarefas e avaliações do funcionário
        const [
          funcionariosIdsSnap,
          funcionarioSnap,
          funcionarioLowerSnap,
          responsavelSnap,
          responsavelLowerSnap,
          avaliacoesIdSnap,
          avaliacoesNomeSnap,
          avaliacoesDesempenhoIdSnap,
          avaliacoesDesempenhoNomeSnap
        ] = await Promise.all([
          getDocs(query(tarefasRef, where('funcionariosIds', 'array-contains', func.nome))),
          getDocs(query(tarefasRef, where('funcionario', '==', func.nome))),
          getDocs(query(tarefasRef, where('funcionario', '==', func.nome.toLowerCase()))),
          getDocs(query(tarefasRef, where('responsavel', '==', func.nome))),
          getDocs(query(tarefasRef, where('responsavel', '==', func.nome.toLowerCase()))),
          getDocs(query(avaliacoesRef, where('funcionarioId', '==', func.id))),
          getDocs(query(avaliacoesRef, where('funcionario', '==', func.nome))),
          getDocs(query(avaliacoesDesempenhoRef, where('funcionarioId', '==', func.id))),
          getDocs(query(avaliacoesDesempenhoRef, where('funcionario', '==', func.nome)))
        ]);
        
        let tarefasConcluidas = 0;
        let tarefasEmAndamento = 0;
        let somaAvaliacoes = 0;
        let totalAvaliacoes = 0;
        let avaliacoes = [];
        
        // 2. Processar dados das tarefas
        const processarTarefas = (snapshot) => {
          snapshot.forEach(doc => {
            const tarefa = doc.data();
            if (tarefa.status === 'concluida') {
              tarefasConcluidas++;
              if (tarefa.avaliacaoSupervisor) {
                somaAvaliacoes += Number(tarefa.avaliacaoSupervisor);
                totalAvaliacoes++;
              }
            } else if (tarefa.status === 'em_andamento') {
              tarefasEmAndamento++;
            }
          });
        };
        
        processarTarefas(funcionariosIdsSnap);
        processarTarefas(funcionarioSnap);
        processarTarefas(funcionarioLowerSnap);
        processarTarefas(responsavelSnap);
        processarTarefas(responsavelLowerSnap);

        // 3. Buscar todos os empréstimos do funcionário
        const [
          emprestimosIdSnap,
          emprestimosNomeSnap,
          emprestimosColabSnap,
          emprestimosRespSnap,
          emprestimosRespLowerSnap
        ] = await Promise.all([
          getDocs(query(emprestimosRef, where('funcionarioId', '==', String(func.id)))),
          getDocs(query(emprestimosRef, where('funcionario', '==', func.nome))),
          getDocs(query(emprestimosRef, where('colaborador', '==', func.nome))),
          getDocs(query(emprestimosRef, where('responsavel', '==', func.nome))),
          getDocs(query(emprestimosRef, where('responsavel', '==', func.nome.toLowerCase())))
        ]);

        // 4. Contar empréstimos ativos únicos
        const emprestimosAtivos = new Set([
          ...emprestimosIdSnap.docs,
          ...emprestimosNomeSnap.docs,
          ...emprestimosColabSnap.docs,
          ...emprestimosRespSnap.docs,
          ...emprestimosRespLowerSnap.docs
        ]
          .map(doc => ({id: doc.id, ...doc.data()}))
          .filter(emp => emp.status === 'ativo' || emp.status === 'emprestado')
        ).size;

        // Contar ferramentas devolvidas
        let ferramentasDevolvidas = 0;
        [emprestimosIdSnap, emprestimosNomeSnap, emprestimosColabSnap, emprestimosRespSnap, emprestimosRespLowerSnap]
          .forEach(snapshot => {
            snapshot.docs.forEach(doc => {
              const emp = doc.data();
              if (emp.status === 'devolvido') {
                ferramentasDevolvidas += emp.ferramentas?.length || 0;
              }
            });
          });

        // Processar todas as avaliações
        const todasAvaliacoes = [];

        // Processar avaliações regulares
        const processarAvaliacoesRegulares = (snapshot) => {
          snapshot.forEach(doc => {
            const avaliacao = doc.data();
            if (avaliacao.nota) {
              todasAvaliacoes.push({
                nota: Number(avaliacao.nota),
                comentario: avaliacao.comentario || 'Avaliação de Tarefa',
                data: avaliacao.data || new Date().toISOString(),
                tipo: 'regular',
                avaliador: avaliacao.avaliador || 'Sistema'
              });
              somaAvaliacoes += Number(avaliacao.nota);
              totalAvaliacoes++;
            }
          });
        };

        // Processar ambos os snapshots de avaliações regulares
        processarAvaliacoesRegulares(avaliacoesIdSnap);
        processarAvaliacoesRegulares(avaliacoesNomeSnap);

        // Processar avaliações de desempenho
        const processarAvaliacoesDesempenho = (snapshot) => {
          snapshot.forEach(doc => {
            const avaliacao = doc.data();
            if (avaliacao.nota) {
              todasAvaliacoes.push({
                nota: Number(avaliacao.nota),
                comentario: avaliacao.comentario || 'Avaliação de Desempenho',
                data: avaliacao.data || new Date().toISOString(),
                tipo: 'desempenho',
                avaliador: avaliacao.avaliador || 'Supervisor'
              });
              somaAvaliacoes += Number(avaliacao.nota);
              totalAvaliacoes++;
            }
          });
        };

        // Processar ambos os snapshots de avaliações de desempenho
        processarAvaliacoesDesempenho(avaliacoesDesempenhoIdSnap);
        processarAvaliacoesDesempenho(avaliacoesDesempenhoNomeSnap);

        // Ordenar avaliações por data mais recente
        todasAvaliacoes.sort((a, b) => new Date(b.data) - new Date(a.data));

        const statsData = {
          emprestimosAtivos,
          mediaAvaliacao: totalAvaliacoes > 0 ? (somaAvaliacoes / totalAvaliacoes).toFixed(1) : 0,
          totalAvaliacoes,
          tarefasConcluidas,
          tarefasEmAndamento,
          ferramentasDevolvidas,
          avaliacoes: todasAvaliacoes
        };

        stats[func.id] = statsData;

        // Calcular pontuação
        const pontuacao = calcularPontuacao({
          ferramentasDevolvidas,
          tarefasConcluidas,
          avaliacao: statsData.mediaAvaliacao
        });

        setFuncionariosPontos(prev => ({
          ...prev,
          [func.id]: pontuacao
        }));
      }

      setFuncionariosStats(stats);
    };

    if (funcionarios.length > 0) {
      fetchFuncionariosStats();
    }
  }, [funcionarios]);

  // Remover: Função movida para cima

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);

      try {
        setLoading(true);
        const storageRef = ref(storage, `funcionarios/${editando?.id || Date.now()}`);
        const snapshot = await uploadBytes(storageRef, file);
        const photoURL = await getDownloadURL(snapshot.ref);
        setFormEdit(prev => ({ ...prev, photoURL }));
        
        if (editando) {
          await atualizarFuncionario(editando.id, { ...formEdit, photoURL });
        }
      } catch (error) {
        console.error('Erro ao fazer upload da imagem:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditar = (func) => {
    setEditando(func);
    setFormEdit({
      nome: func.nome || '',
      cargo: func.cargo || '',
      telefone: func.telefone || '',
      photoURL: func.photoURL || null // usando null em vez de undefined
    });
    setPreview(func.photoURL || null);
  };

  const handleAdicionar = async (e) => {
    e.preventDefault();
    setLoading(true);
    await adicionarFuncionario({
      ...novoFuncionario,
      photoURL: formEdit.photoURL
    });
    setNovoFuncionario({ nome: '', cargo: '', telefone: '' });
    setFormEdit(prev => ({ ...prev, photoURL: '' }));
    setPreview(null);
    setLoading(false);
  };

  const handleSalvarEdicao = async () => {
    try {
      setLoading(true);
      // Criamos um objeto com os campos obrigatórios
      const dadosAtualizados = {
        nome: formEdit.nome,
        cargo: formEdit.cargo,
        telefone: formEdit.telefone
      };

      // Só incluímos a photoURL se ela existir
      if (formEdit.photoURL || editando.photoURL) {
        dadosAtualizados.photoURL = formEdit.photoURL || editando.photoURL;
      }

      await atualizarFuncionario(editando.id, dadosAtualizados);
      setEditando(null);
      setPreview(null);
      showToast('Funcionário atualizado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      showToast('Erro ao atualizar funcionário', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmarExclusao = (funcionario) => {
    setFuncionarioParaExcluir(funcionario);
    setModalConfirmacao(true);
  };

  const handleRemover = async () => {
    try {
      setLoading(true);
      await removerFuncionario(funcionarioParaExcluir.id);
      setModalConfirmacao(false);
      setFuncionarioParaExcluir(null);
    } catch (error) {
      alert('Erro ao excluir funcionário: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#15202B] p-4 rounded-xl">
      <div className="flex flex-col gap-4 mb-4">
        {/* Formulário de Adição */}
        <div className="flex items-center gap-2">
          {!isFuncionario && !readonly && (
            <form onSubmit={handleAdicionar} className="flex gap-2">
              <input
                type="text"
                placeholder="Nome"
                value={novoFuncionario.nome}
                onChange={e => setNovoFuncionario({ ...novoFuncionario, nome: e.target.value })}
                className="px-4 py-2 rounded-lg text-sm bg-[#192734] border border-[#38444D] text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] w-36"
                required
              />
              <input
                type="text"
                placeholder="Cargo"
                value={novoFuncionario.cargo}
                onChange={e => setNovoFuncionario({ ...novoFuncionario, cargo: e.target.value })}
                className="px-4 py-2 rounded-lg text-sm bg-[#192734] border border-[#38444D] text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] w-36"
                required
              />
              <input
                type="text"
                placeholder="(00) 00000-0000"
                value={novoFuncionario.telefone ? formatarTelefone(novoFuncionario.telefone) : ''}
                onChange={e => {
                  const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                  setNovoFuncionario({ ...novoFuncionario, telefone: onlyNums });
                }}
                className="px-4 py-2 rounded-lg text-sm bg-[#192734] border border-[#38444D] text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] w-36"
                required
                maxLength={15}
              />
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1a91da] transition-colors text-sm" disabled={loading}>
                <Plus className="w-3 h-3" /> Adicionar
              </button>
            </form>
          )}
        </div>

      </div>

      {/* Barra de Busca e Filtros */}
      <div className="flex items-center gap-4 mb-4">
        {/* Dropdown de Filtro */}
        <select
          value={filtroAtual}
          onChange={(e) => setFiltroAtual(e.target.value)}
          className="bg-[#192734] text-[#8899A6] hover:bg-[#253341] hover:text-white px-3 py-2 rounded-lg text-sm border border-[#38444D] focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] dark:bg-[#192734] dark:text-[#8899A6] dark:border-[#38444D] dark:hover:bg-[#253341] dark:hover:text-white transition-colors cursor-pointer w-[200px]"
        >
          <option value="nome">Nome</option>
          <option value="pontos">Mais Pontos</option>
          <option value="avaliacao">Mais Avaliados</option>
          <option value="tarefas">Mais Tarefas</option>
          <option value="emprestimos">Mais Empréstimos</option>
        </select>

        {/* Campo de Busca */}
        <div className="relative w-36">
          <input
            type="text"
            placeholder="         Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-12 rounded-lg text-sm bg-[#192734] border border-[#38444D] text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8899A6]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Lista de Funcionários */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...funcionariosFiltrados].sort(getFuncaoOrdenacao()).map((func) => (
          <div 
            key={func.id} 
            className="bg-[#192734] rounded-2xl overflow-hidden border border-[#38444D] hover:border-[#1DA1F2] transition-colors cursor-pointer group"
            onClick={() => setFuncionarioSelecionado(func)}
          >
            {/* Header com foto e ações */}
            <div className="relative bg-[#1DA1F2]/10 p-4">
              {!isFuncionario && !readonly && (
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditar(func);
                    }}
                    className="p-1.5 bg-[#192734] text-[#1DA1F2] hover:bg-[#1DA1F2]/20 rounded-lg transition-colors shadow-md"
                    title="Editar funcionário"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmarExclusao(func);
                    }}
                    className="p-1.5 bg-[#192734] text-red-500 hover:bg-red-500/20 rounded-lg transition-colors shadow-md"
                    title="Excluir funcionário"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-4">
                {func.photoURL ? (
                  <img 
                    src={func.photoURL} 
                    alt={func.nome} 
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-[#38444D]"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-[#253341] border-2 border-[#38444D] flex items-center justify-center flex-shrink-0">
                    <Users className="w-10 h-10 text-[#8899A6]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white truncate mb-1">{func.nome}</h3>
                  {func.matricula && (
                    <p className="text-sm text-[#8899A6] mb-1">Mat: {func.matricula}</p>
                  )}
                  <p className="text-[#1DA1F2] font-medium truncate mb-1">{func.cargo || 'Cargo não definido'}</p>
                  {funcionariosPontos[func.id] && (
                    <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-full w-fit">
                      <Trophy className="w-4 h-4" />
                      <span className="text-sm font-semibold">{funcionariosPontos[func.id].total} pontos</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-4 space-y-4">
              {/* Linha 1: Avaliação e Empréstimos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#253341] rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">
                          {funcionariosStats[func.id]?.avaliacoes?.length > 0
                            ? (funcionariosStats[func.id].avaliacoes.reduce((sum, av) => sum + Number(av.nota || 0), 0) / funcionariosStats[func.id].avaliacoes.length).toFixed(1)
                            : "0.0"
                          }
                        </span>
                        <span className="text-xs text-[#8899A6]">
                          ({funcionariosStats[func.id]?.avaliacoes?.length || 0} avaliações)
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((estrela) => (
                          <Star 
                            key={estrela} 
                            className={`w-3 h-3 ${
                              estrela <= (funcionariosStats[func.id]?.mediaAvaliacao || 0)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-[#8899A6]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#253341] rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <Wrench className={`w-5 h-5 ${
                      funcionariosStats[func.id]?.emprestimosAtivos > 0 
                        ? 'text-[#1DA1F2]' 
                        : 'text-[#8899A6]'
                    }`} />
                    <div>
                      <span className="text-lg font-bold text-white">
                        {funcionariosStats[func.id]?.emprestimosAtivos || 0}
                      </span>
                      <p className="text-xs text-[#8899A6]">Empréstimos</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Linha de Avaliações Recentes */}
              {funcionariosStats[func.id]?.avaliacoes?.length > 0 && (
                <div className="bg-[#253341] rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsUp className="w-5 h-5 text-[#1DA1F2]" />
                    <span className="text-sm font-bold text-white">Últimas Avaliações</span>
                  </div>
                  <div className="space-y-2">
                    {funcionariosStats[func.id].avaliacoes.slice(0, 3).map((avaliacao, index) => (
                      <div key={index} className="flex flex-col gap-1">
                        <div className="flex items-start gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((estrela) => (
                              <Star 
                                key={estrela} 
                                className={`w-3 h-3 ${
                                  estrela <= avaliacao.nota
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-[#8899A6]'
                                }`}
                              />
                            ))}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            avaliacao.tipo === 'desempenho' 
                              ? 'bg-blue-500/20 text-blue-500'
                              : 'bg-green-500/20 text-green-500'
                          }`}>
                            {avaliacao.tipo === 'desempenho' ? 'Desempenho' : 'Tarefa'}
                          </span>
                          <span className="text-xs text-[#8899A6] ml-2">
                            {new Date(avaliacao.data).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[#8899A6] text-xs line-clamp-2 ml-1">{avaliacao.comentario || 'Sem comentário'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Linha 2: Tarefas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#253341] rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <span className="text-lg font-bold text-white">
                        {funcionariosStats[func.id]?.tarefasConcluidas || 0}
                      </span>
                      <p className="text-xs text-[#8899A6]">Concluídas</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#253341] rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#1DA1F2]" />
                    <div>
                      <span className="text-lg font-bold text-white">
                        {funcionariosStats[func.id]?.tarefasEmAndamento || 0}
                      </span>
                      <p className="text-xs text-[#8899A6]">Em Andamento</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Linha 3: Informações de Contato */}
              <div className="space-y-2 pt-3 border-t border-[#38444D]">
                {func.setor && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#8899A6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m4 0v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
                    </svg>
                    <span className="text-[#8899A6]">{func.setor}</span>
                  </div>
                )}
                {func.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#8899A6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    <span className="text-[#8899A6] truncate">{func.email}</span>
                  </div>
                )}
                {func.telefone && (
                  <div className="flex items-center gap-2 text-sm bg-[#253341] rounded-xl p-3">
                    <div className="w-8 h-8 rounded-lg bg-[#1DA1F2]/10 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-[#1DA1F2]" />
                    </div>
                    <div>
                      <span className="text-[#8899A6] text-xs">Telefone</span>
                      <p className="text-white font-medium">{formatarTelefone(func.telefone)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Perfil do Funcionário */}
      {funcionarioSelecionado && (
        <FuncionarioProfile
          funcionario={funcionarioSelecionado}
          onClose={() => setFuncionarioSelecionado(null)}
        />
      )}

      {!isFuncionario && editando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#192734] rounded-2xl max-w-md w-full mx-4 p-6 border border-[#38444D]">
            <h3 className="text-xl font-semibold text-white mb-6">Editar Funcionário</h3>
            <div className="space-y-4">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {preview ? (
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-[#38444D]"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-[#253341] flex items-center justify-center border-4 border-[#38444D]">
                      <Users className="w-16 h-16 text-[#8899A6]" />
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-[#1DA1F2] text-white rounded-full p-2.5 hover:bg-[#1a91da] transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
              
              <input
                type="text"
                placeholder="Nome"
                value={formEdit.nome}
                onChange={e => setFormEdit({ ...formEdit, nome: e.target.value })}
                className="w-full px-4 py-2 rounded-lg text-sm bg-[#253341] border border-[#38444D] text-white placeholder-[#8899A6] focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]"
              />
              <input
                type="text"
                placeholder="Cargo"
                value={formEdit.cargo}
                onChange={e => setFormEdit({ ...formEdit, cargo: e.target.value })}
                className="w-full px-4 py-2 rounded-lg text-sm bg-[#253341] border border-[#38444D] text-white placeholder-[#8899A6] focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]"
              />
              <input
                type="text"
                placeholder="(00) 00000-0000"
                value={formEdit.telefone ? formatarTelefone(formEdit.telefone) : ''}
                onChange={e => setFormEdit({ ...formEdit, telefone: e.target.value.replace(/[^0-9]/g, '') })}
                className="w-full px-4 py-2 rounded-lg text-sm bg-[#253341] border border-[#38444D] text-white placeholder-[#8899A6] focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]"
                maxLength={15}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditando(null)}
                className="px-4 py-2 text-[#8899A6] bg-[#253341] hover:bg-[#192734] rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarEdicao}
                className="px-4 py-2 bg-[#1DA1F2] hover:bg-[#1a91da] text-white rounded-lg transition-colors"
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalConfirmacao && funcionarioParaExcluir && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#192734] rounded-2xl p-6 w-full max-w-md border border-[#38444D]">
            <h3 className="text-xl font-semibold text-white mb-4">
              Confirmar Exclusão
            </h3>
            <p className="text-sm text-[#8899A6] mb-4">
              Tem certeza que deseja excluir o funcionário "{funcionarioParaExcluir.nome}"?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setModalConfirmacao(false);
                  setFuncionarioParaExcluir(null);
                }}
                className="px-4 py-2 text-sm text-[#8899A6] bg-[#253341] hover:bg-[#192734] rounded-lg transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleRemover}
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                disabled={loading}
              >
                {loading ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuncionariosTab;
