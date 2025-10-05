import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Shield, Calendar, Database, Key, Camera, Check } from 'lucide-react';

const ModalGerenciarAdmin = ({ admin, onClose, onAlterarSenha }) => {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (novaSenha.length !== 4 || !/^\d{4}$/.test(novaSenha)) {
      alert('A senha deve ter exatamente 4 dígitos numéricos!');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      alert('As senhas não coincidem!');
      return;
    }

    if (window.confirm('Deseja realmente alterar a senha do administrador?')) {
      onAlterarSenha(novaSenha);
    }
  };

  const formatarData = (dataISO) => {
    if (!dataISO) return 'N/A';
    try {
      const data = new Date(dataISO);
      return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dataISO;
    }
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
          className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1d9bf0] to-blue-600 text-white p-6">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8" />
              Gerenciar Administrador
            </h2>
            <p className="text-blue-100 mt-1">Informações e configurações do admin do sistema</p>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {/* Informações do Admin */}
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#1d9bf0]" />
                Informações Atuais
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm mb-1">
                    <User className="w-4 h-4" />
                    Nome
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {admin.nome}
                  </div>
                </div>

                {/* Email */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm mb-1">
                    <Mail className="w-4 h-4" />
                    Email/Login
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {admin.email}
                  </div>
                </div>

                {/* Nível */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm mb-1">
                    <Shield className="w-4 h-4" />
                    Nível de Acesso
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {admin.nivel} - Administrador
                  </div>
                </div>

                {/* Status */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm mb-1">
                    <Check className="w-4 h-4" />
                    Status
                  </div>
                  <div className={`font-semibold ${admin.ativo ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {admin.ativo ? '✅ Ativo' : '❌ Inativo'}
                  </div>
                </div>

                {/* Data de Criação */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    Criado em
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
                    {formatarData(admin.criadoEm)}
                  </div>
                </div>

                {/* Banco de Dados */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm mb-1">
                    <Database className="w-4 h-4" />
                    Banco de Dados
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {admin.bancoDeDados || 'workflowbr1'}
                  </div>
                </div>

                {/* Algoritmo */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm mb-1">
                    <Key className="w-4 h-4" />
                    Algoritmo de Criptografia
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {admin.algorithm || 'SHA-512'}
                  </div>
                </div>

                {/* Foto de Perfil */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm mb-1">
                    <Camera className="w-4 h-4" />
                    Foto de Perfil
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {admin.fotoPerfil ? '✅ Sim' : '❌ Não'}
                  </div>
                </div>
              </div>
            </div>

            {/* Formulário de Alteração de Senha */}
            {!mostrarFormulario ? (
              <button
                onClick={() => setMostrarFormulario(true)}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#1d9bf0] to-blue-600 hover:from-[#1a8cd8] hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Key className="w-5 h-5" />
                Alterar Senha do Admin
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="border-t pt-6 mt-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <Key className="w-5 h-5 text-[#1d9bf0]" />
                  Alterar Senha
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nova Senha (4 dígitos)
                    </label>
                    <input
                      type="password"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="••••"
                      maxLength={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d9bf0] dark:bg-gray-700 dark:text-white text-center text-2xl tracking-widest"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirmar Nova Senha
                    </label>
                    <input
                      type="password"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="••••"
                      maxLength={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d9bf0] dark:bg-gray-700 dark:text-white text-center text-2xl tracking-widest"
                    />
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ <strong>Atenção:</strong> A senha anterior será salva no histórico antes de ser alterada. Use apenas números (0-9).
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setMostrarFormulario(false);
                        setNovaSenha('');
                        setConfirmarSenha('');
                      }}
                      className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={novaSenha.length !== 4 || confirmarSenha.length !== 4}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-[#1d9bf0] to-blue-600 hover:from-[#1a8cd8] hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirmar Alteração
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ModalGerenciarAdmin;
