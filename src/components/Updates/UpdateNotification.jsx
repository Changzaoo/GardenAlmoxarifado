import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, 
  Download, 
  X, 
  AlertTriangle,
  Info,
  CheckCircle2
} from 'lucide-react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const UpdateNotification = ({ userId, onClose }) => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    verificarAtualizacao();
  }, []);

  const verificarAtualizacao = async () => {
    try {
      const configRef = doc(db, 'configuracoes', 'atualizacao_app');
      const configSnap = await getDoc(configRef);
      
      if (configSnap.exists() && configSnap.data().ativo) {
        const updateData = configSnap.data();
        
        // Verificar se o usuário já viu esta atualização
        const versaoAtual = localStorage.getItem('app_version') || '0.0.0';
        const jaViu = localStorage.getItem(`update_seen_${updateData.versao}`) === 'true';
        
        if (!jaViu && updateData.versao !== versaoAtual) {
          setUpdateInfo(updateData);
          setMostrar(true);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar atualização:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAtualizar = async () => {
    try {
      // Registrar que o usuário está atualizando
      if (updateInfo) {
        const configRef = doc(db, 'configuracoes', 'atualizacao_app');
        await updateDoc(configRef, {
          usuariosAtualizados: increment(1)
        });

        // Salvar no localStorage que já viu esta versão
        localStorage.setItem(`update_seen_${updateInfo.versao}`, 'true');
        localStorage.setItem('app_version', updateInfo.versao);
      }

      // Forçar atualização da página (recarregar para pegar nova versão)
      window.location.reload(true);
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      // Mesmo com erro, recarregar a página
      window.location.reload(true);
    }
  };

  const handleFechar = () => {
    if (updateInfo) {
      // Salvar que já viu (apenas se não for obrigatória)
      if (updateInfo.tipo !== 'obrigatoria') {
        localStorage.setItem(`update_seen_${updateInfo.versao}`, 'true');
      }
    }
    setMostrar(false);
    if (onClose) onClose();
  };

  const handleMaisTarde = () => {
    // Apenas fecha, mas não marca como visto (aparecerá novamente)
    setMostrar(false);
    if (onClose) onClose();
  };

  if (loading || !mostrar || !updateInfo) {
    return null;
  }

  const isObrigatoria = updateInfo.tipo === 'obrigatoria';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={!isObrigatoria ? handleFechar : undefined}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header com gradiente */}
          <div className={`p-6 ${
            updateInfo.tipo === 'obrigatoria' 
              ? 'bg-gradient-to-br from-red-500 to-pink-600' 
              : updateInfo.tipo === 'recomendada'
              ? 'bg-gradient-to-br from-yellow-500 to-orange-600'
              : 'bg-gradient-to-br from-blue-500 to-indigo-600'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {updateInfo.tipo === 'obrigatoria' ? (
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                ) : updateInfo.tipo === 'recomendada' ? (
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Info className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {updateInfo.tipo === 'obrigatoria' ? 'Atualização Obrigatória' : 'Nova Atualização'}
                  </h3>
                  <p className="text-white/90 text-sm">
                    Versão {updateInfo.versao}
                  </p>
                </div>
              </div>
              {!isObrigatoria && (
                <button
                  onClick={handleFechar}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-6 space-y-4">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                {updateInfo.titulo}
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {updateInfo.descricao}
              </p>
            </div>

            {updateInfo.changelog && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase">
                  O que há de novo:
                </h5>
                <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-line space-y-1">
                  {updateInfo.changelog}
                </div>
              </div>
            )}

            {isObrigatoria && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 dark:text-red-300">
                  Esta atualização é obrigatória e precisa ser instalada para continuar usando o aplicativo.
                </p>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-3 pt-2">
              {!isObrigatoria && (
                <button
                  onClick={handleMaisTarde}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
                >
                  Mais Tarde
                </button>
              )}
              <button
                onClick={handleAtualizar}
                className={`${
                  isObrigatoria ? 'w-full' : 'flex-1'
                } px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2`}
              >
                <RefreshCw className="w-5 h-5" />
                Atualizar Agora
              </button>
            </div>

            {!isObrigatoria && (
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Recomendamos atualizar o quanto antes para aproveitar as melhorias
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpdateNotification;
