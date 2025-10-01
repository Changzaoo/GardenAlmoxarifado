import React, { useState, useEffect } from 'react';
import { Star, Award, TrendingUp, MessageSquare, AlertTriangle, Calendar, Clock, Check, X, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../../components/ToastProvider';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { NIVEIS_PERMISSAO } from '../../constants/permissoes';
import { formatarData, formatarHora } from '../../utils/formatters';
import { tiposAvaliacao } from '../../constants/avaliacoes';

function AvaliacoesTab({ funcionario, pontosDesempenho = 0 }) {
  const { usuario, loading } = useAuth();
  const { showToast } = useToast();
  const [avaliacaoParaExcluir, setAvaliacaoParaExcluir] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [estatisticas, setEstatisticas] = useState({
    mediaEstrelas: 0,
    totalAvaliacoes: 0,
    avaliacoesPositivas: 0,
    avaliacoesNegativas: 0,
    ultimaAvaliacao: null
  });
  const [avaliacoesPorTipo, setAvaliacoesPorTipo] = useState({
    tarefas: { total: 0, media: 0 },
    desempenho: { total: 0, media: 0 }
  });
  
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [hoverEstrelas, setHoverEstrelas] = useState(0);
  const dataAtual = new Date();
  const horaAtual = `${String(dataAtual.getHours()).padStart(2, '0')}:${String(dataAtual.getMinutes()).padStart(2, '0')}`;
  const [novaAvaliacao, setNovaAvaliacao] = useState({
    data: dataAtual.toISOString().split('T')[0],
    hora: horaAtual,
    estrelas: 0,
    comentario: '',
    tipo: 'positiva',
    anonima: false
  });
  
  const temPermissaoDetalhes = !loading && usuario && usuario.nivel >= NIVEIS_PERMISSAO.SUPERVISOR;

  const handleDelete = async (avaliacaoId) => {
    if (!temPermissaoDetalhes) {
      showToast('Você não tem permissão para excluir avaliações', 'error');
      return;
    }
    setAvaliacaoParaExcluir(avaliacaoId);
    setShowConfirmModal(true);
  };

  const calcularPontosAvaliacao = (estrelas) => {
    // Convertendo estrelas em pontos
    // 5 estrelas = 10 pontos
    // 4 estrelas = 8 pontos
    // 3 estrelas = 6 pontos
    // 2 estrelas = 4 pontos
    // 1 estrela = 2 pontos
    return estrelas * 2;
  };

  const confirmarExclusao = async () => {
    try {
      // Primeiro, pegamos os dados da avaliação para saber quantos pontos remover
      const avaliacaoRef = doc(db, 'avaliacoes', avaliacaoParaExcluir);
      const avaliacaoSnap = await getDoc(avaliacaoRef);
      
      if (!avaliacaoSnap.exists()) {
        throw new Error('Avaliação não encontrada');
      }

      const avaliacaoData = avaliacaoSnap.data();
      const pontosParaRemover = calcularPontosAvaliacao(avaliacaoData.estrelas);

      // Atualizar os pontos do funcionário
      const funcionarioRef = doc(db, 'funcionarios', funcionario.id);
      const funcionarioSnap = await getDoc(funcionarioRef);
      
      if (!funcionarioSnap.exists()) {
        throw new Error('Funcionário não encontrado');
      }

      const funcionarioData = funcionarioSnap.data();
      const pontosAtuais = funcionarioData.pontos || 0;

      // Atualizar os pontos do funcionário
      await updateDoc(funcionarioRef, {
        pontos: Math.max(0, pontosAtuais - pontosParaRemover) // Garante que não fique negativo
      });

      // Deletar a avaliação
      await deleteDoc(avaliacaoRef);
      
      await carregarAvaliacoes();
      showToast('Avaliação excluída e pontos atualizados com sucesso!', 'success');
      setShowConfirmModal(false);
      setAvaliacaoParaExcluir(null);
    } catch (error) {
      console.error('Erro ao excluir avaliação:', error);
      showToast('Erro ao excluir avaliação. Por favor, tente novamente.', 'error');
    }
  };

  const handleSubmit = async () => {
    console.log('Dados do usuário:', usuario);
    console.log('Dados do funcionário:', funcionario);
    
    if (!funcionario?.id || !usuario?.id) {
      showToast('Erro ao salvar avaliação. Por favor, tente novamente.', 'error');
      return;
    }

    if (!temPermissaoDetalhes) {
      console.error('Usuário sem permissão para avaliar');
      showToast('Você não tem permissão para realizar avaliações', 'error');
      return;
    }

    if (novaAvaliacao.estrelas === 0) {
      showToast('Por favor, selecione uma avaliação em estrelas', 'warning');
      return;
    }
    
    if (!novaAvaliacao.estrelas) {
      showToast('Por favor, selecione uma quantidade de estrelas', 'warning');
      return;
    }

    try {
      const avaliacoesRef = collection(db, 'avaliacoes');
      
      const novaAvaliacaoData = {
        funcionarioId: String(funcionario.id),
        funcionarioNome: funcionario.nome,
        supervisorId: usuario.id,
        supervisorNome: novaAvaliacao.anonima ? 'Anônimo' : usuario.nome,
        data: novaAvaliacao.data,
        hora: novaAvaliacao.hora,
        estrelas: Number(novaAvaliacao.estrelas),
        comentario: novaAvaliacao.comentario,
        status: 'ativa',
        tipo: 'avaliacao_supervisor',
        tipoAvaliacao: novaAvaliacao.tipo,
        anonima: novaAvaliacao.anonima,
        dataCriacao: serverTimestamp()
      };

      console.log('Dados a serem salvos:', novaAvaliacaoData);

      await addDoc(avaliacoesRef, novaAvaliacaoData);

      // Atualizar os pontos do funcionário
      const funcionarioRef = doc(db, 'funcionarios', funcionario.id);
      const funcionarioSnap = await getDoc(funcionarioRef);
      
      if (funcionarioSnap.exists()) {
        const funcionarioData = funcionarioSnap.data();
        const pontosAtuais = funcionarioData.pontos || 0;
        const novoPontos = pontosAtuais + calcularPontosAvaliacao(novaAvaliacaoData.estrelas);
        
        await updateDoc(funcionarioRef, {
          pontos: novoPontos
        });
      }
      
      showToast('Avaliação salva e pontos atualizados com sucesso!', 'success');
      setShowAddModal(false);
      
      const agora = new Date();
      setNovaAvaliacao({
        data: agora.toISOString().split('T')[0],
        hora: `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`,
        estrelas: 0,
        comentario: '',
        tipo: 'positiva',
        anonima: false
      });
      
      await carregarAvaliacoes();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showToast('Erro ao salvar avaliação. Por favor, tente novamente.', 'error');
    }
  };

  // Função para carregar avaliações
  const carregarAvaliacoes = async () => {
    if (!funcionario?.id) return;

    try {
        const avaliacoesRef = collection(db, 'avaliacoes');
        const q = query(
          avaliacoesRef,
          where('funcionarioId', '==', String(funcionario.id)),
          where('tipo', '==', 'avaliacao_supervisor'),
          where('status', '==', 'ativa')
        );
        
        const snapshot = await getDocs(q);
        const avaliacoesData = snapshot.docs
          .map(doc => {
            const data = doc.data();
            const dataCompleta = new Date(data.data + 'T' + (data.hora || '00:00'));
            return {
              id: doc.id,
              data: data.data,
              hora: data.hora,
              dataCompleta: dataCompleta,
            estrelas: Number(data.estrelas),
            comentario: data.comentario,
            supervisorNome: data.supervisorNome,
            supervisorCargo: data.supervisorCargo || '',
            tipo: data.tipo,
            origemAvaliacao: data.tipo === 'avaliacao_supervisor' ? 'Avaliação de Desempenho' : 'Avaliação de Tarefa',
            status: data.status
          };
        });

        // Set avaliacoes state
        setAvaliacoes(avaliacoesData);

        // Calcula estatísticas
        const stats = avaliacoesData.reduce((acc, av) => {
          // Soma total de estrelas para média
          acc.somaEstrelas += av.estrelas;
          
          // Conta avaliações positivas (4-5 estrelas) e negativas (1-2 estrelas)
          if (av.estrelas >= 4) acc.avaliacoesPositivas++;
          if (av.estrelas <= 2) acc.avaliacoesNegativas++;
          
          // Agrupa por tipo
          const tipo = av.tipo === 'avaliacao_supervisor' ? 'desempenho' : 'tarefas';
          if (!acc.porTipo[tipo]) {
            acc.porTipo[tipo] = { total: 0, somaEstrelas: 0 };
          }
          acc.porTipo[tipo].total++;
          acc.porTipo[tipo].somaEstrelas += av.estrelas;
          
          // Encontra a avaliação mais recente
          const dataAvaliacao = new Date(av.data + 'T' + (av.hora || '00:00'));
          if (!acc.ultimaAvaliacao || dataAvaliacao > new Date(acc.ultimaAvaliacao.data + 'T' + (acc.ultimaAvaliacao.hora || '00:00'))) {
            acc.ultimaAvaliacao = av;
          }
          
          return acc;
        }, {
          somaEstrelas: 0,
          avaliacoesPositivas: 0,
          avaliacoesNegativas: 0,
          porTipo: {
            tarefas: { total: 0, somaEstrelas: 0 },
            desempenho: { total: 0, somaEstrelas: 0 }
          },
          ultimaAvaliacao: null
        });

        setEstatisticas({
          mediaEstrelas: avaliacoesData.length > 0 ? stats.somaEstrelas / avaliacoesData.length : 0,
          totalAvaliacoes: avaliacoesData.length,
          avaliacoesPositivas: stats.avaliacoesPositivas,
          avaliacoesNegativas: stats.avaliacoesNegativas,
          ultimaAvaliacao: stats.ultimaAvaliacao
        });

        setAvaliacoesPorTipo({
          tarefas: {
            total: stats.porTipo.tarefas.total,
            media: stats.porTipo.tarefas.total > 0 
              ? stats.porTipo.tarefas.somaEstrelas / stats.porTipo.tarefas.total 
              : 0
          },
          desempenho: {
            total: stats.porTipo.desempenho.total,
            media: stats.porTipo.desempenho.total > 0 
              ? stats.porTipo.desempenho.somaEstrelas / stats.porTipo.desempenho.total 
              : 0
          }
        });

      } catch (error) {
        console.error('Erro ao carregar avaliações:', error);
      }
  };

  // Carregar avaliações ao montar o componente ou quando o funcionário mudar
  useEffect(() => {
    if (funcionario?.id) {
      carregarAvaliacoes();
    }
  }, [funcionario?.id]); // funcionario?.id como dependência para recarregar quando mudar

  return (
    <div className="space-y-8">
      {/* Header com Título e Botão */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Avaliações</h2>
        {!loading && temPermissaoDetalhes && (
          <button
            onClick={() => {
              if (!usuario) {
                alert('Por favor, faça login para adicionar uma avaliação');
                return;
              }
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white rounded-full hover:bg-blue-600 dark:hover:bg-[#1a8cd8] transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Avaliação
          </button>
        )}
      </div>

      {/* Avaliação Geral */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-500 dark:text-[#1D9BF0]" />
          Avaliação Geral
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Média e Total */}
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((estrela) => (
                <Star
                  key={estrela}
                  className={`w-6 h-6 ${
                    estrela <= Math.round(estatisticas.mediaEstrelas)
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {estatisticas.mediaEstrelas.toFixed(1)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {estatisticas.totalAvaliacoes} {estatisticas.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'}
              </div>
              <div className="text-sm font-medium text-blue-500 dark:text-[#1D9BF0]">
                {pontosDesempenho} pontos
              </div>
            </div>
          </div>

          {/* Distribuição */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-red-600 dark:text-red-400">Negativas</span>
                <span className="text-green-600 dark:text-green-400">Positivas</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500"
                  style={{ 
                    width: `${estatisticas.totalAvaliacoes > 0 
                      ? (estatisticas.avaliacoesPositivas / estatisticas.totalAvaliacoes) * 100 
                      : 0}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detalhes por Tipo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Avaliações de Tarefas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
          <h4 className="text-base font-medium mb-3 text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500 dark:text-[#1D9BF0]" />
            Avaliações de Tarefas
          </h4>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((estrela) => (
                <Star
                  key={estrela}
                  className={`w-4 h-4 ${
                    estrela <= Math.round(avaliacoesPorTipo.tarefas.media)
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {avaliacoesPorTipo.tarefas.total} avaliações
            </span>
          </div>
        </div>

        {/* Avaliações de Desempenho */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
          <h4 className="text-base font-medium mb-3 text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-500 dark:text-[#1D9BF0]" />
            Avaliações de Desempenho
          </h4>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((estrela) => (
                <Star
                  key={estrela}
                  className={`w-4 h-4 ${
                    estrela <= Math.round(avaliacoesPorTipo.desempenho.media)
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {avaliacoesPorTipo.desempenho.total} avaliações
              </span>
              <span className="text-sm font-medium text-blue-500 dark:text-[#1D9BF0]">
                {pontosDesempenho} pontos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mensagem para usuários sem permissão */}
      {!temPermissaoDetalhes && estatisticas.totalAvaliacoes > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Acesso Limitado
            </h4>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
              Você pode ver apenas o resumo das avaliações. Para ver detalhes e comentários, é necessário ter nível de supervisor ou superior.
            </p>
          </div>
        </div>
      )}
      {/* Lista de Avaliações */}
      {temPermissaoDetalhes && estatisticas.totalAvaliacoes > 0 && (
        <div>
          {avaliacoes.map((avaliacao) => (
            <div
              key={avaliacao.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600 mb-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((estrela) => (
                      <Star
                        key={estrela}
                        className={`w-5 h-5 ${
                          estrela <= avaliacao.estrelas
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-[#38444D]'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">{avaliacao.comentario}</p>
                </div>
                <button
                  onClick={() => handleDelete(avaliacao.id)}
                  className="p-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-full transition-colors"
                  title="Excluir avaliação"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatarData(avaliacao.data)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatarHora(avaliacao.hora)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>
                    por {avaliacao.anonima ? "Anônimo" : avaliacao.supervisorNome}
                    {!avaliacao.anonima && avaliacao.supervisorCargo && ` (${avaliacao.supervisorCargo})`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{avaliacao.origemAvaliacao}</span>
                </div>
                {avaliacao.tipoAvaliacao && (
                  <div className={`px-2 py-0.5 rounded-full text-sm ${
                    tiposAvaliacao.find(t => t.valor === avaliacao.tipoAvaliacao)?.cor || 'text-blue-400 bg-blue-400/20'
                  }`}>
                    {tiposAvaliacao.find(t => t.valor === avaliacao.tipoAvaliacao)?.label || 'Avaliação'}
                  </div>
                )}

                {/* Data, Hora e Avaliador */}
                <div className="mt-2 flex items-center justify-between gap-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatarData(avaliacao.data)}</span>
                    <Clock className="w-4 h-4 ml-2" />
                    <span>{avaliacao.hora || '00:00'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>por {avaliacao.anonima ? "Anônimo" : avaliacao.supervisorNome}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Confirmar Exclusão</h3>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setAvaliacaoParaExcluir(null);
                }}
                className="p-2 text-gray-500 dark:text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#283340] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-500 dark:text-gray-400 mb-4">
                Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setAvaliacaoParaExcluir(null);
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#283340] rounded-full transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarExclusao}
                  className="px-4 py-2 bg-red-500 text-gray-900 dark:text-white rounded-full hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Avaliação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nova Avaliação */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nova Avaliação</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-500 dark:text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#283340] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Estrelas */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-gray-600 dark:text-gray-500 dark:text-gray-400 text-sm">Avaliação</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((estrela) => (
                    <button
                      key={estrela}
                      type="button"
                      onClick={() => setNovaAvaliacao(prev => ({ ...prev, estrelas: estrela }))}
                      onMouseEnter={() => setHoverEstrelas(estrela)}
                      onMouseLeave={() => setHoverEstrelas(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          (hoverEstrelas ? estrela <= hoverEstrelas : estrela <= novaAvaliacao.estrelas)
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300 dark:text-[#38444D]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Data e Hora */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-500 dark:text-gray-400 mb-2">Data</label>
                  <input
                    type="date"
                    value={novaAvaliacao.data}
                    onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, data: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-500 dark:text-gray-400 mb-2">Hora</label>
                  <input
                    type="time"
                    value={novaAvaliacao.hora}
                    onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, hora: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              {/* Tipo de Avaliação */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-500 dark:text-gray-400 mb-2">Tipo de Avaliação</label>
                <div className="grid grid-cols-2 gap-2">
                  {tiposAvaliacao.map((tipo) => (
                    <button
                      key={tipo.valor}
                      type="button"
                      onClick={() => setNovaAvaliacao(prev => ({ ...prev, tipo: tipo.valor }))}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        novaAvaliacao.tipo === tipo.valor
                          ? tipo.cor + ' ring-2 ring-offset-2 ring-offset-[#192734] ring-current'
                          : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-[#283340]'
                      }`}
                    >
                      {tipo.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Avaliação Anônima */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="avaliacaoAnonima"
                  checked={novaAvaliacao.anonima}
                  onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, anonima: e.target.checked }))}
                  className="w-4 h-4 text-blue-500 dark:text-[#1D9BF0] bg-white dark:bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-200 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] focus:border-transparent"
                />
                <label
                  htmlFor="avaliacaoAnonima"
                  className="text-sm text-gray-600 dark:text-gray-500 dark:text-gray-400 cursor-pointer"
                >
                  Tornar avaliação anônima
                </label>
              </div>

              {/* Comentário */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-500 dark:text-gray-400 mb-2">Comentário</label>
                <textarea
                  value={novaAvaliacao.comentario}
                  onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, comentario: e.target.value }))}
                  className="w-full h-32 px-4 py-2 bg-white dark:bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-200 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] focus:border-transparent outline-none"
                  placeholder="Deixe um feedback sobre o desempenho do funcionário..."
                  required
                />
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#283340] rounded-full transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={novaAvaliacao.estrelas === 0}
                  className="px-4 py-2 bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white rounded-full hover:bg-blue-600 dark:hover:bg-[#1a8cd8] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  Salvar Avaliação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AvaliacoesTab;






