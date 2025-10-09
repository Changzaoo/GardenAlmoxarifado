import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Code, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Copy,
  MapPin,
  Database,
  Globe
} from 'lucide-react';
import { createServerFromConfig } from '../utils/firebaseConfigParser';

/**
 * 🚀 Modal Simplificado para Adicionar Servidor Firebase
 * Aceita código completo colado (com imports, comentários, etc.)
 */
const AddServerModal = ({ isOpen, onClose, onAdd }) => {
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Processar código colado
  const handleCodeChange = (text) => {
    setCode(text);
    setError('');
    setPreview(null);

    // Aguardar um pouco antes de processar (debounce)
    if (text.trim().length > 100) {
      setTimeout(() => {
        try {
          const serverData = createServerFromConfig(text);
          setPreview(serverData);
        } catch (err) {
          console.error('❌ Erro ao processar:', err);
          setError(err.message);
        }
      }, 500);
    }
  };

  // Adicionar servidor
  const handleAdd = async () => {
    if (!preview) {
      setError('Cole o código Firebase primeiro');
      return;
    }

    setIsAdding(true);
    try {
      await onAdd(preview);
      setCode('');
      setPreview(null);
      setError('');
      onClose();
    } catch (err) {
      setError('Erro ao adicionar servidor: ' + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  // Exemplo de código
  const exampleCode = `// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAnLmtlhOUUAbtRcOg64dXdCLbltv_iE4E",
  authDomain: "garden-c0b50.firebaseapp.com",
  projectId: "garden-c0b50",
  storageBucket: "garden-c0b50.firebasestorage.app",
  messagingSenderId: "467344354997",
  appId: "1:467344354997:web:3c3397e0176060bb0c98fc",
  measurementId: "G-7LML93QDTF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);`;

  const copyExample = () => {
    navigator.clipboard.writeText(exampleCode);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Adicionar Servidor Firebase</h2>
                  <p className="text-sm text-blue-100">Cole todo o código Firebase aqui</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Instrução */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">
                    🎯 Cole TODO o código Firebase
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    Pode colar com imports, comentários e tudo! O sistema detecta automaticamente.
                  </p>
                  <button
                    onClick={copyExample}
                    className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
                  >
                    <Copy className="w-3 h-3" />
                    Copiar exemplo
                  </button>
                </div>
              </div>
            </div>

            {/* Campo de Código */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Cole seu código Firebase aqui 👇
              </label>
              <textarea
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder={exampleCode}
                rows={16}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none transition-all"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                💡 Dica: Cole todo o arquivo, incluindo imports e comentários
              </p>
            </div>

            {/* Preview do Servidor */}
            <AnimatePresence>
              {preview && !error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-5"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-green-900 dark:text-green-100 text-lg mb-1">
                        ✨ Servidor Detectado!
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Pronto para adicionar ao mapa mundial
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-2">
                        <Database className="w-4 h-4" />
                        Nome do Servidor
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">
                        {preview.name}
                      </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-2">
                        <Globe className="w-4 h-4" />
                        Região
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">
                        {preview.region}
                      </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-2">
                        <MapPin className="w-4 h-4" />
                        Localização
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">
                        {preview.flag} {preview.country}
                      </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-2">
                        <MapPin className="w-4 h-4" />
                        Coordenadas GPS
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm font-mono">
                        {preview.latitude.toFixed(4)}, {preview.longitude.toFixed(4)}
                      </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm col-span-full">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-2">
                        <Code className="w-4 h-4" />
                        Project ID
                      </div>
                      <p className="font-bold text-blue-600 dark:text-blue-400 text-sm font-mono">
                        {preview.config?.projectId}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Erro */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="font-semibold">{error}</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900">
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={!preview || isAdding}
                className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  preview && !isAdding
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isAdding ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Adicionar ao Mapa
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddServerModal;
