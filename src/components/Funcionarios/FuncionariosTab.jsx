import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { storage, db } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '../ToastProvider';
import FuncionarioProfile from './FuncionarioProfile';
import { UsersRound, Users, UserX } from 'lucide-react';
import GruposModal from './components/GruposModal';

// Importando os componentes refatorados
import FormularioAdicao from './components/FormularioAdicao';
import BarraBusca from './components/BarraBusca';
import CardFuncionario from './components/CardFuncionario';
import ModalEditar from './components/ModalEditar';
import ModalConfirmacao from './components/ModalConfirmacao';

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
  const [showGruposModal, setShowGruposModal] = useState(false);
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
  const [avaliacoesExpandidas, setAvaliacoesExpandidas] = useState(null);
  const [avaliacoesDesempenhoExpandidas, setAvaliacoesDesempenhoExpandidas] = useState(null);
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
        return ordenarPorAvaliacao;
      case 'tarefas':
        return ordenarPorTarefasConcluidas;
      case 'emprestimos':
        return ordenarPorEmprestimos;
      case 'pontos':
        return ordenarPorPontos;
      case 'demitidos':
        return ordenarPorNome; // Para demitidos, usar ordenação por nome
      default:
        return ordenarPorNome;
    }
  };

  // Função para demitir funcionário
  const demitirFuncionario = async (funcionario) => {
    try {
      const funcionarioAtualizado = {
        ...funcionario,
        demitido: true,
        dataDemissao: new Date().toISOString()
      };
      
      await atualizarFuncionario(funcionario.id, funcionarioAtualizado);
      showToast('Funcionário demitido com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao demitir funcionário:', error);
      showToast('Erro ao demitir funcionário', 'error');
    }
  };

  // Função para reintegrar funcionário
  const reintegrarFuncionario = async (funcionario) => {
    try {
      const funcionarioAtualizado = {
        ...funcionario,
        demitido: false,
        dataDemissao: null,
        dataReintegracao: new Date().toISOString()
      };
      
      await atualizarFuncionario(funcionario.id, funcionarioAtualizado);
      showToast('Funcionário reintegrado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao reintegrar funcionário:', error);
      showToast('Erro ao reintegrar funcionário', 'error');
    }
  };

  // Função para calcular a média de avaliações de desempenho
  const calcularMediaAvaliacoesDesempenho = (avaliacoes) => {
    if (!avaliacoes || avaliacoes.length === 0) return 0;
    const avaliacoesDesempenho = avaliacoes.filter(av => av.tipo === 'desempenho');
    if (avaliacoesDesempenho.length === 0) return 0;
    
    const soma = avaliacoesDesempenho.reduce((acc, av) => acc + (av.nota || av.estrelas || 0), 0);
    return (soma / avaliacoesDesempenho.length).toFixed(1);
  };

  // Função para filtrar funcionários
  const filtrarFuncionarios = (funcionarios) => {
    if (!funcionarios) return [];
    const searchLower = searchTerm.toLowerCase();
    
    return funcionarios.filter(func => {
      // Filtro por texto de busca
      const matchesSearch = func.nome?.toLowerCase().includes(searchLower) ||
                           func.cargo?.toLowerCase().includes(searchLower) ||
                           func.telefone?.includes(searchTerm) ||
                           func.email?.toLowerCase().includes(searchLower) ||
                           func.matricula?.toLowerCase().includes(searchLower) ||
                           func.setor?.toLowerCase().includes(searchLower);
      
      // Filtro por status de demissão
      if (filtroAtual === 'demitidos') {
        return matchesSearch && func.demitido === true;
      } else {
        // Para outros filtros, mostrar apenas funcionários ativos (não demitidos)
        return matchesSearch && !func.demitido;
      }
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
        
        const [
          funcionariosIdsSnap,
          funcionarioSnap,
          funcionarioLowerSnap,
          responsavelSnap,
          responsavelLowerSnap,
          avaliacoesSnap,
          avaliacoesDesempenhoSnap
        ] = await Promise.all([
          getDocs(query(tarefasRef, where('funcionariosIds', 'array-contains', func.nome))),
          getDocs(query(tarefasRef, where('funcionario', '==', func.nome))),
          getDocs(query(tarefasRef, where('funcionario', '==', func.nome.toLowerCase()))),
          getDocs(query(tarefasRef, where('responsavel', '==', func.nome))),
          getDocs(query(tarefasRef, where('responsavel', '==', func.nome.toLowerCase()))),
          getDocs(query(avaliacoesRef, where('funcionarioId', '==', func.id))),
          getDocs(query(avaliacoesDesempenhoRef, where('funcionarioId', '==', func.id)))
        ]);
        
        let tarefasConcluidas = 0;
        let tarefasEmAndamento = 0;
        let somaAvaliacoes = 0;
        let totalAvaliacoes = 0;
        const avaliacoesArray = [];
        
        // Processar avaliações regulares
        avaliacoesSnap.forEach(doc => {
          const avaliacao = doc.data();
          const isDesempenho = avaliacao.tipo === 'avaliacao_supervisor';
          avaliacoesArray.push({ 
            ...avaliacao, 
            id: doc.id,
            tipo: isDesempenho ? 'desempenho' : 'regular',
            nota: Number(avaliacao.estrelas || avaliacao.nota || 0),
            data: avaliacao.data || new Date().toISOString()
          });
        });
        
        // Processar avaliações de desempenho
        avaliacoesDesempenhoSnap.forEach(doc => {
          const avaliacao = doc.data();
          avaliacoesArray.push({ 
            ...avaliacao, 
            id: doc.id,
            tipo: 'desempenho',
            nota: Number(avaliacao.estrelas || avaliacao.nota || 0),
            comentario: avaliacao.comentario || 'Avaliação de Desempenho',
            data: avaliacao.data || new Date().toISOString()
          });
        });
        
        // Ordenar avaliações por data mais recente
        avaliacoesArray.sort((a, b) => new Date(b.data) - new Date(a.data));
        
        // Processar dados das tarefas
        const processarTarefas = (snapshot) => {
          snapshot.forEach(doc => {
            const tarefa = doc.data();
            if (tarefa.status === 'concluida') {
              tarefasConcluidas++;
              
              // Adicionar autoavaliação do funcionário se existir
              if (tarefa.avaliacaoFuncionario) {
                avaliacoesArray.push({
                  id: `tarefa-${doc.id}-auto`,
                  tipo: 'regular',
                  nota: Number(tarefa.avaliacaoFuncionario),
                  comentario: tarefa.comentarioFuncionario || 'Autoavaliação',
                  data: tarefa.dataAutoavaliacao || tarefa.dataConclusao || new Date().toISOString(),
                  hora: new Date(tarefa.dataAutoavaliacao || tarefa.dataConclusao || new Date()).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }),
                  avaliador: func.nome,
                  tipoAvaliacao: 'tarefa',
                  nomeTarefa: tarefa.nome || tarefa.titulo,
                  descricaoTarefa: tarefa.descricao,
                  isAutoAvaliacao: true
                });
              }

              // Adicionar avaliação do supervisor se existir
              if (tarefa.avaliacaoSupervisor) {
                avaliacoesArray.push({
                  id: `tarefa-${doc.id}`,
                  tipo: 'regular',
                  nota: Number(tarefa.avaliacaoSupervisor),
                  comentario: tarefa.comentarioSupervisor || 'Avaliação de Tarefa',
                  data: tarefa.dataConclusao || new Date().toISOString(),
                  hora: new Date(tarefa.dataConclusao || new Date()).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }),
                  avaliador: tarefa.avaliadorNome || usuario.nome,
                  tipoAvaliacao: 'tarefa',
                  nomeTarefa: tarefa.nome || tarefa.titulo,
                  descricaoTarefa: tarefa.descricao
                });
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
        
        // Atualizar os stats do funcionário com as avaliações
        setFuncionariosStats(prev => ({
          ...prev,
          [func.id]: {
            ...prev[func.id],
            avaliacoes: avaliacoesArray,
            tarefasConcluidas,
            tarefasEmAndamento
          }
        }));
        processarTarefas(funcionarioLowerSnap);
        processarTarefas(responsavelSnap);
        processarTarefas(responsavelLowerSnap);

        // Buscar empréstimos
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

        const statsData = {
          emprestimosAtivos,
          mediaAvaliacao: totalAvaliacoes > 0 ? (somaAvaliacoes / totalAvaliacoes).toFixed(1) : 0,
          totalAvaliacoes,
          tarefasConcluidas,
          tarefasEmAndamento,
          ferramentasDevolvidas,
          avaliacoes: avaliacoesArray
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
    const originalData = {
      nome: func.nome || '',
      cargo: func.cargo || '',
      telefone: func.telefone || '',
      photoURL: func.photoURL || null
    };
    setFormEdit(originalData);
    setPreview(func.photoURL || null);
  };

  const handleAdicionar = async (novosDados) => {
    setLoading(true);
    await adicionarFuncionario({
      ...novosDados,
      photoURL: formEdit.photoURL || ''
    });
    setNovoFuncionario({ nome: '', cargo: '', telefone: '' });
    setFormEdit(prev => ({ ...prev, photoURL: '' }));
    setPreview(null);
    setLoading(false);
  };

  const handleSalvarEdicao = async (dadosAtualizados) => {
    try {
      setLoading(true);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header Corporativo */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Gestão de Funcionários
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {funcionariosFiltrados.length} {funcionariosFiltrados.length === 1 ? 'funcionário encontrado' : 'funcionários encontrados'}
              </p>
            </div>
            
            {/* Stats resumo */}
            <div className="hidden md:flex items-center gap-6">
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {funcionarios.filter(f => !f.demitido).length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Ativos</div>
              </div>
              {filtroAtual === 'demitidos' && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {funcionarios.filter(f => f.demitido).length}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Inativos</div>
                </div>
              )}
            </div>
          </div>

          {/* Barra de Busca e Filtros */}
          <BarraBusca
            filtroAtual={filtroAtual}
            setFiltroAtual={setFiltroAtual}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onManageGroups={() => setShowGruposModal(true)}
            showGroupsButton={!readonly && usuario?.nivel >= 2}
          />
        </div>
      </div>

      {/* Container Principal */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Formulário de Adição */}
        {!isFuncionario && !readonly && (
          <div className="mb-6">
            <FormularioAdicao
              onSubmit={handleAdicionar}
              loading={loading}
              formatarTelefone={formatarTelefone}
            />
          </div>
        )}

        {/* Lista de Funcionários */}
        {funcionariosFiltrados.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                {filtroAtual === 'demitidos' ? (
                  <UserX className="w-10 h-10 text-gray-400" />
                ) : (
                  <Users className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {filtroAtual === 'demitidos' ? 'Nenhum funcionário inativo' : 'Nenhum funcionário encontrado'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                {filtroAtual === 'demitidos' 
                  ? 'Não há funcionários inativos no sistema.'
                  : searchTerm 
                    ? `Não foram encontrados funcionários que correspondam ao termo "${searchTerm}".`
                    : 'Ainda não há funcionários cadastrados no sistema.'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
            {[...funcionariosFiltrados].sort(getFuncaoOrdenacao()).map((func) => (
              <CardFuncionario
                key={func.id}
                funcionario={func}
                funcionariosStats={funcionariosStats}
                funcionariosPontos={funcionariosPontos}
                isFuncionario={isFuncionario}
                readonly={readonly}
                avaliacoesExpandidas={avaliacoesExpandidas}
                avaliacoesDesempenhoExpandidas={avaliacoesDesempenhoExpandidas}
                setAvaliacoesExpandidas={setAvaliacoesExpandidas}
                setAvaliacoesDesempenhoExpandidas={setAvaliacoesDesempenhoExpandidas}
                handleEditar={handleEditar}
                confirmarExclusao={confirmarExclusao}
                calcularMediaAvaliacoesDesempenho={calcularMediaAvaliacoesDesempenho}
                onClick={() => setFuncionarioSelecionado(func)}
                demitirFuncionario={demitirFuncionario}
                reintegrarFuncionario={reintegrarFuncionario}
                filtroAtual={filtroAtual}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Perfil do Funcionário */}
      {funcionarioSelecionado && (
        <FuncionarioProfile
          funcionario={funcionarioSelecionado}
          onClose={() => setFuncionarioSelecionado(null)}
        />
      )}

      {/* Modal de Grupos */}
      <GruposModal
        isOpen={showGruposModal}
        onClose={() => setShowGruposModal(false)}
        funcionarios={funcionarios}
      />

      {/* Modal de Edição */}
      {!isFuncionario && editando && (
        <ModalEditar
          editando={editando}
          formEdit={formEdit}
          setFormEdit={setFormEdit}
          preview={preview}
          setPreview={setPreview}
          loading={loading}
          fileInputRef={fileInputRef}
          handleFileChange={handleFileChange}
          handleSalvarEdicao={handleSalvarEdicao}
          setEditando={setEditando}
          formatarTelefone={formatarTelefone}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {modalConfirmacao && funcionarioParaExcluir && (
        <ModalConfirmacao
          funcionario={funcionarioParaExcluir}
          loading={loading}
          onConfirm={handleRemover}
          onCancel={() => {
            setModalConfirmacao(false);
            setFuncionarioParaExcluir(null);
          }}
        />
      )}
    </div>
  );
};

export default FuncionariosTab;

