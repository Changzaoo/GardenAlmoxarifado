import React, { useState, useEffect } from 'react';
import { X, Star, CheckCircle, Package, Trophy, User, ArrowUpDown, TrendingUp, MessageCircle } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// Sistema de análise de sentimento
const palavrasPositivas = [
  'excelente', 'ótimo', 'bom', 'muito bom', 'perfeito', 'maravilhoso', 'incrível',
  'eficiente', 'dedicado', 'competente', 'profissional', 'organizado', 'pontual',
  'responsável', 'proativo', 'criativo', 'inovador', 'colaborativo', 'produtivo',
  'capaz', 'talentoso', 'qualificado', 'comprometido', 'atencioso', 'rápido',
  'preciso', 'cuidadoso', 'melhorou', 'superou', 'sucesso', 'positivo'
];

const palavrasNegativas = [
  'ruim', 'péssimo', 'horrível', 'terrível', 'fraco', 'inadequado', 'insuficiente',
  'lento', 'atrasado', 'desorganizado', 'irresponsável', 'negligente', 'descuidado',
  'incompetente', 'despreparado', 'desmotivado', 'preguiçoso', 'ausente', 'faltou',
  'problema', 'erro', 'falha', 'defeito', 'piorou', 'negativo', 'insatisfatório',
  'decepcionante', 'abaixo', 'crítico', 'preocupante'
];

const analisarSentimento = (texto) => {
  if (!texto) return { positivo: 0, negativo: 0, score: 0 };
  
  const textoLower = texto.toLowerCase();
  let positivo = 0;
  let negativo = 0;
  
  palavrasPositivas.forEach(palavra => {
    if (textoLower.includes(palavra)) positivo++;
  });
  
  palavrasNegativas.forEach(palavra => {
    if (textoLower.includes(palavra)) negativo++;
  });
  
  // Score: +1 por palavra positiva, -1 por negativa
  const score = positivo - negativo;
  
  return { positivo, negativo, score };
};

const ModalFuncionariosSetor = ({ isOpen, onClose, setor }) => {
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avaliacoes, setAvaliacoes] = useState({});
  const [ordenacao, setOrdenacao] = useState('alfabetica'); // 'alfabetica' ou 'avaliacao'

  useEffect(() => {
    if (isOpen && setor) {
      carregarFuncionarios();
    }
  }, [isOpen, setor]);

  const carregarFuncionarios = async () => {
    try {
      setLoading(true);

      // Buscar funcionários do setor
      const funcionariosRef = collection(db, 'funcionarios');
      const usuariosRef = collection(db, 'usuario');
      
      const [funcionariosSnap, usuariosSnap] = await Promise.all([
        getDocs(funcionariosRef),
        getDocs(usuariosRef)
      ]);

      // Combinar e remover duplicatas
      const todosFuncionarios = [
        ...funcionariosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ...usuariosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      ];

      const funcionariosUnicos = Array.from(
        new Map(todosFuncionarios.map(f => [f.id, f])).values()
      );

      // Filtrar por setor E excluir usuários sem cargo E excluir demitidos
      const funcionariosDoSetor = funcionariosUnicos.filter(
        func => func.setorId === setor.id && func.cargo && func.cargo.trim() !== '' && !func.demitido
      );

      setFuncionarios(funcionariosDoSetor);

      // Carregar avaliações de cada funcionário
      await carregarAvaliacoes(funcionariosDoSetor);

    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarAvaliacoes = async (funcionarios) => {
    try {
      const avaliacoesRef = collection(db, 'avaliacoes');
      const avaliacoesSnap = await getDocs(avaliacoesRef);
      
      const tarefasRef = collection(db, 'tarefas');
      const tarefasSnap = await getDocs(tarefasRef);

      const avaliacoesMap = {};

      funcionarios.forEach(func => {
        // Avaliações de desempenho
        const avaliacoesDesempenho = avaliacoesSnap.docs
          .map(doc => doc.data())
          .filter(av => 
            (av.funcionarioId === func.id || av.funcionarioNome === func.nome) &&
            av.tipo === 'desempenho'
          );

        // Análise de sentimento nas avaliações de desempenho
        let sentimentoDesempenho = { positivo: 0, negativo: 0, score: 0 };
        avaliacoesDesempenho.forEach(av => {
          const analise = analisarSentimento(av.comentario || av.observacao || '');
          sentimentoDesempenho.positivo += analise.positivo;
          sentimentoDesempenho.negativo += analise.negativo;
          sentimentoDesempenho.score += analise.score;
        });

        // Calcular média com impacto do sentimento
        let mediaDesempenho = avaliacoesDesempenho.length > 0
          ? avaliacoesDesempenho.reduce((acc, av) => acc + (av.nota || av.estrelas || 0), 0) / avaliacoesDesempenho.length
          : 0;

        // Aplicar impacto do sentimento (+/- 0.5 estrelas baseado no score)
        if (avaliacoesDesempenho.length > 0) {
          const impactoSentimento = (sentimentoDesempenho.score / avaliacoesDesempenho.length) * 0.5;
          mediaDesempenho = Math.max(0, Math.min(5, mediaDesempenho + impactoSentimento));
        }

        // Avaliações de tarefas (estrelas gerais)
        const avaliacoesTarefas = avaliacoesSnap.docs
          .map(doc => doc.data())
          .filter(av => 
            (av.funcionarioId === func.id || av.funcionarioNome === func.nome) &&
            (!av.tipo || av.tipo !== 'desempenho')
          );

        // Análise de sentimento nas avaliações de tarefas
        let sentimentoTarefas = { positivo: 0, negativo: 0, score: 0 };
        avaliacoesTarefas.forEach(av => {
          const analise = analisarSentimento(av.comentario || av.observacao || '');
          sentimentoTarefas.positivo += analise.positivo;
          sentimentoTarefas.negativo += analise.negativo;
          sentimentoTarefas.score += analise.score;
        });

        let mediaTarefas = avaliacoesTarefas.length > 0
          ? avaliacoesTarefas.reduce((acc, av) => acc + (av.estrelas || av.nota || 0), 0) / avaliacoesTarefas.length
          : 0;

        // Aplicar impacto do sentimento
        if (avaliacoesTarefas.length > 0) {
          const impactoSentimento = (sentimentoTarefas.score / avaliacoesTarefas.length) * 0.5;
          mediaTarefas = Math.max(0, Math.min(5, mediaTarefas + impactoSentimento));
        }

        // Tarefas concluídas
        const tarefasConcluidas = tarefasSnap.docs
          .map(doc => doc.data())
          .filter(tarefa => {
            const status = (tarefa.status || '').toLowerCase();
            if (status !== 'concluida' && status !== 'concluída') return false;

            // Verificar se funcionário está atribuído
            if (tarefa.funcionariosIds && Array.isArray(tarefa.funcionariosIds)) {
              return tarefa.funcionariosIds.some(id => 
                id === func.id || id.toLowerCase() === func.nome.toLowerCase()
              );
            }

            return tarefa.responsavelId === func.id || 
                   tarefa.funcionarioId === func.id ||
                   (tarefa.responsavel && tarefa.responsavel.toLowerCase() === func.nome.toLowerCase());
          }).length;

        avaliacoesMap[func.id] = {
          desempenho: mediaDesempenho,
          tarefas: mediaTarefas,
          totalAvaliacoesDesempenho: avaliacoesDesempenho.length,
          totalAvaliacoesTarefas: avaliacoesTarefas.length,
          tarefasConcluidas,
          sentimentoDesempenho,
          sentimentoTarefas,
          mediaGeral: (mediaDesempenho + mediaTarefas) / 2
        };
      });

      setAvaliacoes(avaliacoesMap);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    }
  };

  // Função para ordenar funcionários
  const funcionariosOrdenados = () => {
    const lista = [...funcionarios];
    
    if (ordenacao === 'alfabetica') {
      return lista.sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (ordenacao === 'avaliacao') {
      return lista.sort((a, b) => {
        const mediaA = avaliacoes[a.id]?.mediaGeral || 0;
        const mediaB = avaliacoes[b.id]?.mediaGeral || 0;
        return mediaB - mediaA; // Maior primeiro
      });
    }
    
    return lista;
  };

  const renderEstrelas = (nota) => {
    const estrelas = [];
    const notaArredondada = Math.round(nota * 10) / 10;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(notaArredondada)) {
        estrelas.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
      } else if (i === Math.ceil(notaArredondada) && notaArredondada % 1 !== 0) {
        estrelas.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />);
      } else {
        estrelas.push(<Star key={i} className="w-4 h-4 text-gray-300 dark:text-gray-600" />);
      }
    }
    
    return estrelas;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Funcionários do Setor {setor?.nome}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {setor?.empresaNome} • {funcionarios.length} funcionário(s)
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Filtros de Ordenação */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" />
              Ordenar por:
            </span>
            <button
              onClick={() => setOrdenacao('alfabetica')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                ordenacao === 'alfabetica'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              A-Z (Alfabética)
            </button>
            <button
              onClick={() => setOrdenacao('avaliacao')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                ordenacao === 'avaliacao'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Melhores Avaliações
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Carregando funcionários...</p>
              </div>
            </div>
          ) : funcionarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <User className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Nenhum funcionário neste setor
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {funcionariosOrdenados().map((func) => {
                const avalFunc = avaliacoes[func.id] || {
                  desempenho: 0,
                  tarefas: 0,
                  totalAvaliacoesDesempenho: 0,
                  totalAvaliacoesTarefas: 0,
                  tarefasConcluidas: 0,
                  sentimentoDesempenho: { positivo: 0, negativo: 0, score: 0 },
                  sentimentoTarefas: { positivo: 0, negativo: 0, score: 0 },
                  mediaGeral: 0
                };

                return (
                  <div
                    key={func.id}
                    className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-600"
                  >
                    {/* Foto e Nome */}
                    <div className="p-6 text-center">
                      <div className="relative inline-block mb-4">
                        {func.photoURL ? (
                          <img
                            src={func.photoURL}
                            alt={func.nome}
                            className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-600 shadow-lg"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white dark:border-gray-600 shadow-lg">
                            <span className="text-3xl font-bold text-white">
                              {func.nome.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        {/* Badge de status */}
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 shadow-md">
                            Ativo
                          </span>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {func.nome}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {func.cargo || 'Sem cargo'}
                      </p>

                      {/* Estatísticas */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                          <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xl font-bold">{avalFunc.tarefasConcluidas}</span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Tarefas</p>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                          <div className="flex items-center justify-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                            <Trophy className="w-4 h-4" />
                            <span className="text-xl font-bold">
                              {avalFunc.totalAvaliacoesDesempenho + avalFunc.totalAvaliacoesTarefas}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Avaliações</p>
                        </div>
                      </div>

                      {/* Avaliações */}
                      <div className="space-y-3">
                        {/* Avaliação de Desempenho */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              Desempenho
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ({avalFunc.totalAvaliacoesDesempenho})
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-1">
                            {renderEstrelas(avalFunc.desempenho)}
                          </div>
                          <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-1">
                            {avalFunc.desempenho.toFixed(1)} / 5.0
                          </p>
                          
                          {/* Indicador de Sentimento */}
                          {avalFunc.totalAvaliacoesDesempenho > 0 && (
                            <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                              <MessageCircle className="w-3 h-3 text-gray-400" />
                              <div className="flex gap-1 text-xs">
                                {avalFunc.sentimentoDesempenho.positivo > 0 && (
                                  <span className="text-green-600 dark:text-green-400 font-medium">
                                    +{avalFunc.sentimentoDesempenho.positivo} positivos
                                  </span>
                                )}
                                {avalFunc.sentimentoDesempenho.negativo > 0 && (
                                  <span className="text-red-600 dark:text-red-400 font-medium">
                                    -{avalFunc.sentimentoDesempenho.negativo} negativos
                                  </span>
                                )}
                                {avalFunc.sentimentoDesempenho.positivo === 0 && avalFunc.sentimentoDesempenho.negativo === 0 && (
                                  <span className="text-gray-400">neutro</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Avaliação de Tarefas */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              Tarefas
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ({avalFunc.totalAvaliacoesTarefas})
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-1">
                            {renderEstrelas(avalFunc.tarefas)}
                          </div>
                          <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-1">
                            {avalFunc.tarefas.toFixed(1)} / 5.0
                          </p>
                          
                          {/* Indicador de Sentimento */}
                          {avalFunc.totalAvaliacoesTarefas > 0 && (
                            <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                              <MessageCircle className="w-3 h-3 text-gray-400" />
                              <div className="flex gap-1 text-xs">
                                {avalFunc.sentimentoTarefas.positivo > 0 && (
                                  <span className="text-green-600 dark:text-green-400 font-medium">
                                    +{avalFunc.sentimentoTarefas.positivo} positivos
                                  </span>
                                )}
                                {avalFunc.sentimentoTarefas.negativo > 0 && (
                                  <span className="text-red-600 dark:text-red-400 font-medium">
                                    -{avalFunc.sentimentoTarefas.negativo} negativos
                                  </span>
                                )}
                                {avalFunc.sentimentoTarefas.positivo === 0 && avalFunc.sentimentoTarefas.negativo === 0 && (
                                  <span className="text-gray-400">neutro</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total: <span className="font-bold text-gray-900 dark:text-white">{funcionarios.length}</span> funcionário(s)
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalFuncionariosSetor;
