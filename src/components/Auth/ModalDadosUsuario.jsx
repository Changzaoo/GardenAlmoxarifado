import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Database, User, CheckCircle, Clock, AlertCircle, 
  FileText, Calendar, Hash, MapPin, Loader, Package,
  MessageSquare, Bell, Star, TrendingUp
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { dbWorkflowBR1 } from '../../config/firebaseWorkflowBR1';

const ModalDadosUsuario = ({ usuario, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState({
    tarefas: [],
    emprestimos: [],
    mensagens: [],
    notificacoes: [],
    pontos: 0,
    avaliacoes: [],
    localizacaoBanco: {
      principal: '',
      colecoes: []
    }
  });

  useEffect(() => {
    carregarDadosCompletos();
  }, [usuario]);

  const carregarDadosCompletos = async () => {
    try {
      setLoading(true);
      
      // Detectar em qual banco o usuário está
      const localizacao = await detectarLocalizacaoUsuario();
      
      // Carregar tarefas
      const tarefasData = await carregarTarefas();
      
      // Carregar empréstimos
      const emprestimosData = await carregarEmprestimos();
      
      // Carregar mensagens
      const mensagensData = await carregarMensagens();
      
      // Carregar notificações
      const notificacoesData = await carregarNotificacoes();
      
      // Calcular pontos e avaliacoes
      const { pontos, avaliacoes } = await calcularPontosEAvaliacoes(tarefasData);
      
      setDados({
        tarefas: tarefasData,
        emprestimos: emprestimosData,
        mensagens: mensagensData,
        notificacoes: notificacoesData,
        pontos,
        avaliacoes,
        localizacaoBanco: localizacao
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectarLocalizacaoUsuario = async () => {
    const colecoesEncontradas = [];
    
    // Verificar em usuarios (workflow-cfe2e)
    try {
      const docRef = doc(db, 'usuarios', usuario.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        colecoesEncontradas.push({
          nome: 'usuarios',
          banco: 'workflow-cfe2e (Firebase Principal)',
          projectId: 'workflow-cfe2e',
          caminho: `usuarios/${usuario.id}`,
          dados: docSnap.data()
        });
      }
    } catch (error) {
      console.log('Não encontrado em workflow-cfe2e/usuarios');
    }

    // Verificar em funcionarios (workflow-cfe2e)
    try {
      const funcionariosRef = collection(db, 'funcionarios');
      const q = query(funcionariosRef, where('userId', '==', usuario.id));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        querySnapshot.forEach(doc => {
          colecoesEncontradas.push({
            nome: 'funcionarios',
            banco: 'workflow-cfe2e (Firebase Principal)',
            projectId: 'workflow-cfe2e',
            caminho: `funcionarios/${doc.id}`,
            dados: doc.data()
          });
        });
      }
    } catch (error) {
      console.log('Não encontrado em workflow-cfe2e/funcionarios');
    }

    // Verificar em workflowbr1
    try {
      const usuariosRef = collection(dbWorkflowBR1, 'usuarios');
      const q = query(usuariosRef, where('email', '==', usuario.email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        querySnapshot.forEach(doc => {
          colecoesEncontradas.push({
            nome: 'usuarios',
            banco: 'workflowbr1 (Firebase Novo)',
            projectId: 'workflowbr1',
            caminho: `usuarios/${doc.id}`,
            dados: doc.data()
          });
        });
      }
    } catch (error) {
      console.log('Não encontrado em workflowbr1/usuarios');
    }

    return {
      principal: colecoesEncontradas.length > 0 ? colecoesEncontradas[0].banco : 'Não encontrado',
      colecoes: colecoesEncontradas
    };
  };

  const carregarTarefas = async () => {
    try {
      const tarefasRef = collection(db, 'tarefas');
      
      // Buscar por funcionariosIds (array)
      const q1 = query(tarefasRef, where('funcionariosIds', 'array-contains', usuario.id));
      const snapshot1 = await getDocs(q1);
      
      // Buscar por funcionarios.nome
      const q2 = query(tarefasRef, where('funcionariosIds', 'array-contains', usuario.nome));
      const snapshot2 = await getDocs(q2);
      
      const tarefasMap = new Map();
      
      snapshot1.forEach(doc => {
        tarefasMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
      
      snapshot2.forEach(doc => {
        if (!tarefasMap.has(doc.id)) {
          tarefasMap.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });
      
      return Array.from(tarefasMap.values());
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      return [];
    }
  };

  const carregarEmprestimos = async () => {
    try {
      const emprestimosRef = collection(db, 'emprestimos');
      const q = query(emprestimosRef, where('funcionarioId', '==', usuario.id));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao carregar empréstimos:', error);
      return [];
    }
  };

  const carregarMensagens = async () => {
    try {
      const mensagensRef = collection(db, 'mensagens');
      const q = query(mensagensRef, where('userId', '==', usuario.id));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      return [];
    }
  };

  const carregarNotificacoes = async () => {
    try {
      const notificacoesRef = collection(db, 'notificacoes');
      const q = query(notificacoesRef, where('usuarioId', '==', usuario.id));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      return [];
    }
  };

  const calcularPontosEAvaliacoes = async (tarefas) => {
    let pontos = 0;
    const avaliacoes = [];
    
    tarefas.forEach(tarefa => {
      if (tarefa.status === 'concluida') {
        pontos += 50; // 50 pontos por tarefa concluída
        
        if (tarefa.avaliacao) {
          pontos += tarefa.avaliacao.estrelas * 10;
          avaliacoes.push({
            tarefaId: tarefa.id,
            titulo: tarefa.titulo,
            estrelas: tarefa.avaliacao.estrelas,
            feedback: tarefa.avaliacao.feedback,
            data: tarefa.avaliacao.data
          });
        }
      }
    });
    
    return { pontos, avaliacoes };
  };

  const formatarData = (data) => {
    if (!data) return 'N/A';
    try {
      const d = new Date(data);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return data;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pendente': 'bg-gray-100 text-gray-700 border-gray-300',
      'em_andamento': 'bg-blue-100 text-blue-700 border-blue-300',
      'pausada': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'concluida': 'bg-green-100 text-green-700 border-green-300',
      'cancelada': 'bg-red-100 text-red-700 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPrioridadeColor = (prioridade) => {
    const colors = {
      'baixa': 'text-green-600',
      'media': 'text-yellow-600',
      'alta': 'text-orange-600',
      'urgente': 'text-red-600'
    };
    return colors[prioridade] || 'text-gray-600';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-6xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1d9bf0] to-blue-600 text-white p-6">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Database className="w-8 h-8" />
              Dados Completos do Usuário
            </h2>
            <p className="text-blue-100 mt-1">Todas as informações e relações no banco de dados</p>
            
            {/* Info do Usuário */}
            <div className="mt-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                {usuario.nome?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div className="font-semibold text-lg">{usuario.nome}</div>
                <div className="text-blue-100">{usuario.email}</div>
                <div className="text-sm text-blue-200">ID: {usuario.id}</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader className="w-12 h-12 text-[#1d9bf0] animate-spin mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Carregando dados do banco...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Localização no Banco */}
                <section className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-700">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    Localização no Banco de Dados
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Banco Principal:</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{dados.localizacaoBanco.principal}</div>
                    </div>

                    {dados.localizacaoBanco.colecoes.length > 0 ? (
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Encontrado em {dados.localizacaoBanco.colecoes.length} coleção(ões):
                        </div>
                        {dados.localizacaoBanco.colecoes.map((colecao, index) => (
                          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Database className="w-4 h-4 text-[#1d9bf0]" />
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    {colecao.banco}
                                  </span>
                                </div>
                                <div className="text-sm space-y-1">
                                  <div>
                                    <span className="text-gray-600 dark:text-gray-400">Coleção: </span>
                                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                      {colecao.nome}
                                    </code>
                                  </div>
                                  <div>
                                    <span className="text-gray-600 dark:text-gray-400">Caminho: </span>
                                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                      {colecao.caminho}
                                    </code>
                                  </div>
                                  <div>
                                    <span className="text-gray-600 dark:text-gray-400">Project ID: </span>
                                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                      {colecao.projectId}
                                    </code>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          ⚠️ Usuário não encontrado em nenhuma coleção do Firebase
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Estatísticas Gerais */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#1d9bf0]" />
                    Estatísticas Gerais
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-blue-600" />
                        <div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{dados.tarefas.length}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Tarefas</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                      <div className="flex items-center gap-3">
                        <Star className="w-8 h-8 text-green-600" />
                        <div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{dados.pontos}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Pontos</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                      <div className="flex items-center gap-3">
                        <Package className="w-8 h-8 text-purple-600" />
                        <div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{dados.emprestimos.length}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Empréstimos</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-8 h-8 text-orange-600" />
                        <div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{dados.mensagens.length}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Mensagens</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Tarefas */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-[#1d9bf0]" />
                    Tarefas ({dados.tarefas.length})
                  </h3>
                  
                  {dados.tarefas.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {dados.tarefas.map((tarefa) => (
                        <div key={tarefa.id} className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">{tarefa.titulo}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{tarefa.descricao}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(tarefa.status)}`}>
                              {tarefa.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Prioridade: </span>
                              <span className={`font-semibold ${getPrioridadeColor(tarefa.prioridade)}`}>
                                {tarefa.prioridade}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Criado: </span>
                              <span className="text-gray-900 dark:text-white">{formatarData(tarefa.dataCriacao)}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">ID: </span>
                              <code className="text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">{tarefa.id}</code>
                            </div>
                            {tarefa.avaliacao && (
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Avaliação: </span>
                                <span className="text-yellow-600">{'⭐'.repeat(tarefa.avaliacao.estrelas)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">Nenhuma tarefa encontrada</p>
                    </div>
                  )}
                </section>

                {/* Empréstimos */}
                {dados.emprestimos.length > 0 && (
                  <section>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-[#1d9bf0]" />
                      Empréstimos ({dados.emprestimos.length})
                    </h3>
                    
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {dados.emprestimos.map((emprestimo) => (
                        <div key={emprestimo.id} className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">{emprestimo.ferramenta || emprestimo.item}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Emprestado em: {formatarData(emprestimo.dataEmprestimo)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Status: </span>
                                <span className={`font-semibold ${emprestimo.devolvido ? 'text-green-600' : 'text-orange-600'}`}>
                                  {emprestimo.devolvido ? 'Devolvido' : 'Pendente'}
                                </span>
                              </div>
                              <code className="text-xs text-gray-500 dark:text-gray-400">{emprestimo.id}</code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Notificações */}
                {dados.notificacoes.length > 0 && (
                  <section>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-[#1d9bf0]" />
                      Notificações ({dados.notificacoes.length})
                    </h3>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {dados.notificacoes.slice(0, 10).map((notif) => (
                        <div key={notif.id} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 text-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">{notif.titulo}</div>
                              <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">{notif.mensagem}</div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${notif.lida ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'}`}>
                              {notif.lida ? 'Lida' : 'Nova'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-between items-center border-t border-gray-200 dark:border-gray-600">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Última atualização: {new Date().toLocaleString('pt-BR')}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white rounded-lg transition-colors font-medium"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ModalDadosUsuario;
