import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  AlertTriangle, 
  Merge, 
  X, 
  CheckCircle, 
  User,
  Mail,
  Briefcase,
  Phone,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { useToast } from '../../ToastProvider';
import {
  buscarEDetectarDuplicados,
  unificarGrupoDuplicados,
  unificarTodosDuplicados
} from '../../../utils/unificarFuncionarios';

const ModalUnificarDuplicados = ({ isOpen, onClose, onUnificado }) => {
  const [loading, setLoading] = useState(true);
  const [unificando, setUnificando] = useState(false);
  const [duplicados, setDuplicados] = useState(null);
  const [grupoSelecionado, setGrupoSelecionado] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      carregarDuplicados();
    }
  }, [isOpen]);

  const carregarDuplicados = async () => {
    try {
      setLoading(true);
      const resultado = await buscarEDetectarDuplicados();
      setDuplicados(resultado.duplicados);
    } catch (error) {
      console.error('Erro ao carregar duplicados:', error);
      showToast('Erro ao carregar duplicados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnificarGrupo = async (grupo) => {
    try {
      setUnificando(true);
      const resultado = await unificarGrupoDuplicados(grupo);
      
      if (resultado.sucesso) {
        showToast(
          `${resultado.removidos} funcionário(s) duplicado(s) removido(s)`,
          'success'
        );
        await carregarDuplicados(); // Recarregar lista
        onUnificado(); // Notificar componente pai
      } else {
        showToast(`Erro: ${resultado.erro}`, 'error');
      }
    } catch (error) {
      console.error('Erro ao unificar grupo:', error);
      showToast('Erro ao unificar funcionários', 'error');
    } finally {
      setUnificando(false);
    }
  };

  const handleUnificarTodos = async () => {
    if (!duplicados || duplicados.total === 0) return;

    const confirma = window.confirm(
      `Deseja unificar todos os ${duplicados.total} grupos de duplicados?\n\n` +
      `Isso irá remover ${duplicados.podeUnificar} funcionário(s) duplicado(s) e ` +
      `manter apenas 1 de cada grupo com os dados mesclados.`
    );

    if (!confirma) return;

    try {
      setUnificando(true);
      const resultado = await buscarEDetectarDuplicados();
      const resultadoUnificacao = await unificarTodosDuplicados(resultado.funcionarios);
      
      showToast(
        `${resultadoUnificacao.sucessos} grupo(s) unificado(s) com sucesso!`,
        'success'
      );
      
      await carregarDuplicados();
      onUnificado();
    } catch (error) {
      console.error('Erro ao unificar todos:', error);
      showToast('Erro ao unificar funcionários', 'error');
    } finally {
      setUnificando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Merge className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Unificar Funcionários Duplicados
                </h2>
                <p className="text-white/80 text-sm">
                  Detectar e mesclar funcionários com mesmo nome ou email
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
              disabled={unificando}
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Detectando funcionários duplicados...
              </p>
            </div>
          ) : duplicados && duplicados.total > 0 ? (
            <>
              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-orange-500" />
                    <div>
                      <p className="text-sm text-orange-600 dark:text-orange-400">
                        Grupos Duplicados
                      </p>
                      <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                        {duplicados.total}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-red-500" />
                    <div>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Total Duplicados
                      </p>
                      <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                        {duplicados.totalFuncionariosDuplicados}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Serão Removidos
                      </p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {duplicados.podeUnificar}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão Unificar Todos */}
              <div className="mb-6">
                <button
                  onClick={handleUnificarTodos}
                  disabled={unificando}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {unificando ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Unificando...</span>
                    </>
                  ) : (
                    <>
                      <Merge className="w-5 h-5" />
                      <span>Unificar Todos os Duplicados ({duplicados.total} grupos)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Lista de Grupos Duplicados */}
              <div className="space-y-4">
                {duplicados.grupos.map((grupo, index) => (
                  <GrupoDuplicado
                    key={index}
                    grupo={grupo}
                    index={index}
                    onUnificar={handleUnificarGrupo}
                    unificando={unificando}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Nenhum Duplicado Encontrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Todos os funcionários estão únicos no sistema!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={unificando}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Fechar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Componente para exibir um grupo de duplicados
const GrupoDuplicado = ({ grupo, index, onUnificar, unificando }) => {
  const [expandido, setExpandido] = useState(false);
  const { tipo, chave, funcionarios, principal } = grupo;

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setExpandido(!expandido)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {index + 1}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {tipo === 'nome' ? 'Mesmo Nome' : 'Mesmo Email'}: {chave}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {funcionarios.length} funcionários encontrados
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {expandido ? 'Ocultar' : 'Ver detalhes'}
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expandido && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 space-y-3">
              {funcionarios.map((func, idx) => (
                <FuncionarioDuplicadoCard
                  key={func.id}
                  funcionario={func}
                  isPrincipal={func.id === principal.id}
                />
              ))}

              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => onUnificar(grupo)}
                  disabled={unificando}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Merge className="w-4 h-4" />
                  <span>Unificar Este Grupo</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Card de funcionário duplicado
const FuncionarioDuplicadoCard = ({ funcionario, isPrincipal }) => {
  return (
    <div
      className={`p-3 rounded-lg border-2 ${
        isPrincipal
          ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Foto */}
        <div className="flex-shrink-0">
          {funcionario.photoURL ? (
            <img
              src={funcionario.photoURL}
              alt={funcionario.nome}
              className="w-16 h-16 rounded-lg object-cover border-2 border-white dark:border-gray-600"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Dados */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-semibold text-gray-900 dark:text-white truncate">
              {funcionario.nome}
            </p>
            {isPrincipal && (
              <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                PRINCIPAL
              </span>
            )}
            {funcionario.photoURL && (
              <ImageIcon className="w-4 h-4 text-blue-500" />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {funcionario.email && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4" />
                <span className="truncate">{funcionario.email}</span>
              </div>
            )}
            {funcionario.cargo && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Briefcase className="w-4 h-4" />
                <span className="truncate">{funcionario.cargo}</span>
              </div>
            )}
            {funcionario.telefone && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Phone className="w-4 h-4" />
                <span>{funcionario.telefone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500 text-xs">
              <span>ID: {funcionario.id.slice(0, 8)}...</span>
              <span>•</span>
              <span>{funcionario.origem}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalUnificarDuplicados;
