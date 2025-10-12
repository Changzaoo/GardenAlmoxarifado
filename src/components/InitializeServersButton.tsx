import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, CheckCircle, AlertCircle, Loader, Server } from 'lucide-react';
import { initializeDefaultServers } from '../scripts/initializeServers';
import { addGardenServers } from '../scripts/addGardenServers';

/**
 * 🔧 Botão para Inicializar Servidores Padrão
 * Útil para primeira configuração do sistema
 */
const InitializeServersButton = () => {
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  const handleInitialize = async () => {
    setStatus('loading');
    setMessage('Inicializando servidores...');
    
    try {
      const result = await initializeDefaultServers();
      
      if (result.success) {
        setStatus('success');
        setMessage(`✅ ${result.count} servidores inicializados com sucesso!`);
      } else {
        setStatus('error');
        setMessage(`❌ Erro: ${result.error}`);
      }
    } catch (error) {
      setStatus('error');
      setMessage(`❌ Erro ao inicializar: ${error.message}`);
    }
    
    // Resetar após 5 segundos
    setTimeout(() => {
      setStatus('idle');
      setMessage('');
    }, 5000);
  };

  const handleAddGardenServers = async () => {
    setStatus('loading');
    setMessage('Adicionando servidores Garden...');
    
    try {
      const result = await addGardenServers();
      
      if (result.success) {
        setStatus('success');
        setMessage(`✅ ${result.added} servidor(es) Garden adicionado(s)! (${result.existing} já existentes)`);
      } else {
        setStatus('error');
        setMessage(`❌ Erro: ${result.error}`);
      }
    } catch (error) {
      setStatus('error');
      setMessage(`❌ Erro ao adicionar: ${error.message}`);
    }
    
    // Resetar após 5 segundos
    setTimeout(() => {
      setStatus('idle');
      setMessage('');
    }, 5000);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-4 items-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddGardenServers}
          disabled={status === 'loading'}
          className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all ${
            status === 'loading'
              ? 'bg-gray-400 cursor-not-allowed'
              : status === 'success'
              ? 'bg-green-600 hover:bg-green-700'
              : status === 'error'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-purple-600 hover:bg-purple-700'
          } text-white`}
        >
          {status === 'loading' && <Loader className="w-5 h-5 animate-spin" />}
          {status === 'success' && <CheckCircle className="w-5 h-5" />}
          {status === 'error' && <AlertCircle className="w-5 h-5" />}
          {status === 'idle' && <Server className="w-5 h-5" />}
          
          {status === 'loading' ? 'Adicionando...' : 'Adicionar Servidores Garden'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleInitialize}
          disabled={status === 'loading'}
          className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all ${
            status === 'loading'
              ? 'bg-gray-400 cursor-not-allowed'
              : status === 'success'
              ? 'bg-green-600 hover:bg-green-700'
              : status === 'error'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          {status === 'loading' && <Loader className="w-5 h-5 animate-spin" />}
          {status === 'success' && <CheckCircle className="w-5 h-5" />}
          {status === 'error' && <AlertCircle className="w-5 h-5" />}
          {status === 'idle' && <Database className="w-5 h-5" />}
          
          {status === 'loading' ? 'Inicializando...' : 'Inicializar 3 Servidores Padrão'}
        </motion.button>
      </div>
      
      {message && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-sm font-medium ${
            status === 'success'
              ? 'text-green-600 dark:text-green-400'
              : status === 'error'
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
};

export default InitializeServersButton;
