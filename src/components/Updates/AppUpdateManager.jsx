import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Send, 
  Users,
  Calendar,
  Download,
  Info,
  Zap,
  Clock,
  X
} from 'lucide-react';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import DeployInfo from './DeployInfo';

const AppUpdateManager = () => {
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  
  const [formData, setFormData] = useState({
    versao: '',
    titulo: '',
    descricao: '',
    tipo: 'obrigatoria', // obrigatoria, recomendada, opcional
    prioridade: 'alta', // alta, media, baixa
    changelog: '',
  });

  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Carregar informações de atualização atual
  useEffect(() => {
    carregarDadosAtualizacao();
    carregarUsuarios();
    carregarVersaoAtual();
  }, []);

  const carregarVersaoAtual = async () => {
    try {
      const response = await fetch('/version.json');
      const data = await response.json();
      // Preencher automaticamente o campo de versão com a versão do deploy
      setFormData(prev => ({
        ...prev,
        versao: data.version || ''
      }));
    } catch (error) {
      console.error('Erro ao carregar versão atual:', error);
    }
  };

  const carregarDadosAtualizacao = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'configuracoes', 'atualizacao_app');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setUpdateInfo(docSnap.data());
      }
    } catch (error) {
      console.error('Erro ao carregar dados de atualização:', error);
      setErro('Erro ao carregar informações de atualização');
    } finally {
      setLoading(false);
    }
  };

  const carregarUsuarios = async () => {
    try {
      const usuariosRef = collection(db, 'usuarios');
      const snapshot = await getDocs(usuariosRef);
      const usuariosList = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(usuario => {
          // Filtrar apenas usuários com empresa e setor cadastrados
          return usuario.empresa && usuario.setor;
        });
      setUsuarios(usuariosList);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validarFormulario = () => {
    if (!formData.versao.trim()) {
      setErro('Digite o número da versão');
      return false;
    }
    if (!formData.titulo.trim()) {
      setErro('Digite o título da atualização');
      return false;
    }
    if (!formData.descricao.trim()) {
      setErro('Digite a descrição da atualização');
      return false;
    }
    return true;
  };

  const enviarAtualizacao = async () => {
    if (!validarFormulario()) return;

    setEnviando(true);
    setErro('');
    setSucesso('');

    try {
      // Buscar informações do deploy atual
      let deployInfo = null;
      try {
        const response = await fetch('/version.json');
        deployInfo = await response.json();
      } catch (error) {
        console.error('Erro ao buscar info de deploy:', error);
      }

      const updateData = {
        versao: formData.versao.trim(),
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim(),
        tipo: formData.tipo,
        prioridade: formData.prioridade,
        changelog: formData.changelog.trim(),
        dataPublicacao: serverTimestamp(),
        ativo: true,
        usuariosNotificados: 0,
        usuariosAtualizados: 0,
        // Informações do deploy
        deploy: deployInfo ? {
          buildNumber: deployInfo.buildNumber,
          buildDate: deployInfo.buildDate,
          gitCommit: deployInfo.git?.commit || null,
          gitCommitFull: deployInfo.git?.commitFull || null,
          gitBranch: deployInfo.git?.branch || null,
          gitMessage: deployInfo.git?.message || null,
          gitAuthor: deployInfo.git?.author || null,
          gitDate: deployInfo.git?.date || null,
          vercelEnv: deployInfo.vercel?.env || null,
          vercelUrl: deployInfo.vercel?.url || null
        } : null
      };

      // Salvar configuração de atualização
      const configRef = doc(db, 'configuracoes', 'atualizacao_app');
      await setDoc(configRef, updateData);

      // Criar notificação para cada usuário
      const batch = [];
      for (const usuario of usuarios) {
        const notificacaoRef = doc(collection(db, 'usuarios', usuario.id, 'notificacoes'));
        batch.push(
          setDoc(notificacaoRef, {
            tipo: 'atualizacao_app',
            titulo: formData.titulo,
            mensagem: formData.descricao,
            versao: formData.versao,
            tipoAtualizacao: formData.tipo,
            prioridade: formData.prioridade,
            lida: false,
            data: serverTimestamp(),
            acao: 'atualizar_app'
          })
        );
      }

      // Executar todas as notificações
      await Promise.all(batch);

      setSucesso(`Atualização enviada com sucesso para ${usuarios.length} usuários!`);
      setUpdateInfo(updateData);
      
      // Resetar formulário
      setFormData({
        versao: '',
        titulo: '',
        descricao: '',
        tipo: 'obrigatoria',
        prioridade: 'alta',
        changelog: '',
      });
      
      setMostrarModal(false);

      // Limpar mensagem de sucesso após 5 segundos
      setTimeout(() => setSucesso(''), 5000);
      
    } catch (error) {
      console.error('Erro ao enviar atualização:', error);
      setErro('Erro ao enviar atualização. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const desativarAtualizacao = async () => {
    if (!updateInfo) return;
    
    setEnviando(true);
    try {
      const configRef = doc(db, 'configuracoes', 'atualizacao_app');
      await updateDoc(configRef, {
        ativo: false,
        dataDesativacao: serverTimestamp()
      });
      
      setSucesso('Atualização desativada com sucesso!');
      await carregarDadosAtualizacao();
      
      setTimeout(() => setSucesso(''), 5000);
    } catch (error) {
      console.error('Erro ao desativar atualização:', error);
      setErro('Erro ao desativar atualização');
    } finally {
      setEnviando(false);
    }
  };

  const getTipoBadge = (tipo) => {
    const badges = {
      obrigatoria: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: 'Obrigatória' },
      recomendada: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Recomendada' },
      opcional: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', label: 'Opcional' }
    };
    return badges[tipo] || badges.opcional;
  };

  const getPrioridadeBadge = (prioridade) => {
    const badges = {
      alta: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: 'Alta' },
      media: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Média' },
      baixa: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: 'Baixa' }
    };
    return badges[prioridade] || badges.media;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mensagens de Feedback */}
      <AnimatePresence>
        {erro && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 dark:text-red-300">{erro}</p>
            </div>
            <button
              onClick={() => setErro('')}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {sucesso && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-green-800 dark:text-green-300">{sucesso}</p>
            </div>
            <button
              onClick={() => setSucesso('')}
              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card de Atualização Ativa */}
      {updateInfo && updateInfo.ativo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Atualização Ativa
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Versão {updateInfo.versao}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTipoBadge(updateInfo.tipo).color}`}>
                {getTipoBadge(updateInfo.tipo).label}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPrioridadeBadge(updateInfo.prioridade).color}`}>
                {getPrioridadeBadge(updateInfo.prioridade).label}
              </span>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                {updateInfo.titulo}
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {updateInfo.descricao}
              </p>
            </div>

            {updateInfo.changelog && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  CHANGELOG:
                </h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {updateInfo.changelog}
                </p>
              </div>
            )}

            {/* Informações do Deploy */}
            {updateInfo.deploy && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 border-purple-500">
                <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Download className="w-3 h-3" />
                  DEPLOY INFO:
                </h5>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  {updateInfo.deploy.gitCommit && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Commit:</span>
                      <span className="font-mono">{updateInfo.deploy.gitCommit}</span>
                    </div>
                  )}
                  {updateInfo.deploy.gitMessage && (
                    <div className="flex items-start gap-2">
                      <span className="font-semibold">Mensagem:</span>
                      <span className="flex-1">{updateInfo.deploy.gitMessage}</span>
                    </div>
                  )}
                  {updateInfo.deploy.gitAuthor && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Autor:</span>
                      <span>{updateInfo.deploy.gitAuthor}</span>
                    </div>
                  )}
                  {updateInfo.deploy.buildDate && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Build:</span>
                      <span>{new Date(updateInfo.deploy.buildDate).toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                  {updateInfo.deploy.vercelUrl && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Vercel:</span>
                      <span className="text-blue-600 dark:text-blue-400">{updateInfo.deploy.vercelUrl}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{usuarios.length} usuários</span>
              </div>
              {updateInfo.dataPublicacao && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {typeof updateInfo.dataPublicacao.toDate === 'function' 
                      ? new Date(updateInfo.dataPublicacao.toDate()).toLocaleDateString('pt-BR')
                      : new Date(updateInfo.dataPublicacao).toLocaleDateString('pt-BR')
                    }
                  </span>
                </div>
              )}
            </div>
            
            <button
              onClick={desativarAtualizacao}
              disabled={enviando}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviando ? 'Desativando...' : 'Desativar Atualização'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Alerta Informativo */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-1">
            Usuários Elegíveis
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-400">
            As atualizações serão enviadas apenas para usuários que possuem <strong>empresa e setor cadastrados</strong>. 
            Atualmente há <strong>{usuarios.length} usuários elegíveis</strong> que receberão a notificação.
          </p>
        </div>
      </div>

      {/* Botão para Nova Atualização */}
      <button
        onClick={() => setMostrarModal(true)}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white rounded-xl p-6 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
      >
        <Zap className="w-6 h-6" />
        <span className="text-lg font-bold">
          {updateInfo && updateInfo.ativo ? 'Enviar Nova Atualização' : 'Criar Atualização'}
        </span>
      </button>

      {/* Informações sobre Usuários */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {usuarios.length}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Total de Usuários
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {updateInfo?.usuariosAtualizados || 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Já Atualizaram
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {usuarios.length - (updateInfo?.usuariosAtualizados || 0)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Aguardando
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Informações de Deploy */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Informações do Deploy Atual
        </h3>
        <DeployInfo />
      </div>

      {/* Modal de Nova Atualização */}
      <AnimatePresence>
        {mostrarModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setMostrarModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Nova Atualização do App
                </h2>
                <button
                  onClick={() => setMostrarModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Versão */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Número da Versão *
                  </label>
                  <input
                    type="text"
                    name="versao"
                    value={formData.versao}
                    onChange={handleInputChange}
                    placeholder="Ex: 2.5.1"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Título */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Título da Atualização *
                  </label>
                  <input
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleInputChange}
                    placeholder="Ex: Nova funcionalidade de relatórios"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Descrição *
                  </label>
                  <textarea
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleInputChange}
                    placeholder="Descreva brevemente as novidades desta versão"
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Tipo e Prioridade */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Atualização *
                    </label>
                    <select
                      name="tipo"
                      value={formData.tipo}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="obrigatoria">Obrigatória</option>
                      <option value="recomendada">Recomendada</option>
                      <option value="opcional">Opcional</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Prioridade *
                    </label>
                    <select
                      name="prioridade"
                      value={formData.prioridade}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="alta">Alta</option>
                      <option value="media">Média</option>
                      <option value="baixa">Baixa</option>
                    </select>
                  </div>
                </div>

                {/* Changelog */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Changelog (Opcional)
                  </label>
                  <textarea
                    name="changelog"
                    value={formData.changelog}
                    onChange={handleInputChange}
                    placeholder="• Adicionado nova funcionalidade X&#10;• Corrigido bug Y&#10;• Melhorias de performance"
                    rows={5}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                  />
                </div>

                {/* Info Alert */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-1">
                      Importante
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      Esta atualização será enviada para <strong>{usuarios.length} usuários elegíveis</strong> 
                      (usuários com empresa e setor cadastrados). 
                      Eles receberão uma notificação e serão alertados para atualizar o aplicativo.
                    </p>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setMostrarModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={enviarAtualizacao}
                    disabled={enviando}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {enviando ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Enviar Atualização
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppUpdateManager;
