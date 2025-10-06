import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Database } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { backupDb } from '../../config/firebaseDual'; // Import do Firebase Backup
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ToastProvider';
import { encryptPassword } from '../../utils/crypto';
import { NIVEIS_PERMISSAO, NIVEIS_LABELS } from '../../constants/permissoes';
import ModalDadosUsuario from './ModalDadosUsuario';

const UserProfileModal = ({ isOpen, onClose, userId }) => {
  const { usuario, atualizarUsuario } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mostrarDadosCompletos, setMostrarDadosCompletos] = useState(false);
  const canEdit = usuario?.id === userId;
  
  const [userData, setUserData] = useState({
    nome: usuario?.nome || '',
    email: usuario?.email || '',
    senha: '',
    telefone: usuario?.telefone || '',
    nivel: usuario?.nivel || NIVEIS_PERMISSAO.FUNCIONARIO,
    ativo: usuario?.ativo ?? true
  });

  useEffect(() => {
    if (isOpen && usuario) {
      setUserData({
        nome: usuario.nome || '',
        email: usuario.email || '',
        senha: '',
        telefone: usuario.telefone || '',
        nivel: usuario.nivel || NIVEIS_PERMISSAO.FUNCIONARIO,
        ativo: usuario.ativo ?? true
      });
    }
  }, [isOpen, usuario]);

  const handleSave = async () => {
    try {
      if (!canEdit) {
        showToast('Você só pode editar seu próprio perfil', 'error');
        return;
      }

      setLoading(true);

      // Validações básicas
      if (!userData.nome?.trim()) {
        showToast('O nome é obrigatório', 'error');
        setLoading(false);
        return;
      }

      // Validar email se foi alterado
      if (userData.email?.trim() && userData.email !== usuario.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email.trim())) {
          showToast('Email inválido', 'error');
          setLoading(false);
          return;
        }
      }

      // Validar telefone se foi fornecido
      if (userData.telefone?.trim()) {
        const telefoneRegex = /^[\d\s\-\(\)]+$/;
        if (!telefoneRegex.test(userData.telefone.trim())) {
          showToast('Telefone inválido. Use apenas números, espaços, parênteses e traços', 'error');
          setLoading(false);
          return;
        }
      }

      // Prepara os dados para atualização
      const dadosParaAtualizar = {
        nome: userData.nome.trim(),
        ativo: userData.ativo
      };

      // Adiciona email se foi alterado
      if (userData.email?.trim() && userData.email !== usuario.email) {
        dadosParaAtualizar.email = userData.email.trim().toLowerCase();
      }

      // Adiciona telefone se foi fornecido
      if (userData.telefone?.trim()) {
        dadosParaAtualizar.telefone = userData.telefone.trim();
      }

      // Adiciona senha apenas se foi fornecida, e encripta antes de salvar
      if (userData.senha?.trim()) {
        if (userData.senha.trim().length < 6) {
          showToast('A senha deve ter no mínimo 6 caracteres', 'error');
          setLoading(false);
          return;
        }
        const senhaCriptografada = encryptPassword(userData.senha.trim());
        
        // ✅ CAMPOS CORRETOS PARA SENHA CRIPTOGRAFADA
        dadosParaAtualizar.senhaHash = senhaCriptografada.hash;
        dadosParaAtualizar.senhaSalt = senhaCriptografada.salt;
        dadosParaAtualizar.senhaVersion = senhaCriptografada.version;
        dadosParaAtualizar.senhaAlgorithm = senhaCriptografada.algorithm;
        dadosParaAtualizar.senha = null; // Remove senha em texto plano
        
        // 🔑 ATUALIZAR AUTHKEY COM A SENHA DIGITADA (PRIORIDADE 1 NO LOGIN)
        // authKey é a senha em texto plano que será verificada PRIMEIRO no login
        dadosParaAtualizar.authKey = userData.senha.trim();
        dadosParaAtualizar.authKeyUpdatedAt = new Date();
        dadosParaAtualizar.dataAlteracaoSenha = new Date().toISOString();
        
        console.log('🔑 Campo authKey atualizado com a senha digitada pelo usuário');
        console.log('🔒 Senha criptografada com SHA-512 e authKey configurado');
      }

      // 🔄 ATUALIZAR NOS DOIS BANCOS FIREBASE (PRINCIPAL E BACKUP)
      try {
        // Atualizar no Firebase principal
        await updateDoc(doc(db, 'usuarios', usuario.id), dadosParaAtualizar);
        console.log('✅ Usuário atualizado no Firebase principal');
        
        // Atualizar no Firebase Backup também (usado pelo sistema de login)
        try {
          await updateDoc(doc(backupDb, 'usuarios', usuario.id), dadosParaAtualizar);
          console.log('✅ Usuário atualizado no Firebase Backup');
        } catch (backupError) {
          console.warn('⚠️ Erro ao atualizar Firebase Backup (não crítico):', backupError);
          // Não falha a operação se o backup der erro, apenas avisa
        }
      } catch (error) {
        console.error('❌ Erro ao atualizar Firebase principal:', error);
        throw error; // Re-throw para ser capturado pelo catch principal
      }
      
      // Atualiza o estado local
      atualizarUsuario({
        ...usuario,
        ...dadosParaAtualizar
      });
      
      showToast('Perfil atualizado com sucesso!', 'success');
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      showToast('Erro ao atualizar perfil: ' + (error.message || 'Tente novamente'), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-w-lg w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-[#FFFFFF]">
              {usuario?.id === userId ? 'Editar Perfil' : 'Visualizar Perfil'}
            </h3>
            
          </div>

          <div className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-[#FFFFFF] mb-2">
                Nome Completo
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1d9bf0] focus:border-transparent"
                placeholder="Digite o nome completo"
                value={userData.nome || ''}
                onChange={(e) => setUserData(prev => ({ ...prev, nome: e.target.value }))}
                disabled={!canEdit}
              />
            </div>

            {/* Email/Login */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-[#FFFFFF] mb-2">
                Email (Login)
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1d9bf0] focus:border-transparent"
                placeholder="seu.email@exemplo.com"
                value={userData.email || ''}
                onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                disabled={!canEdit}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Este será seu novo login de acesso
              </p>
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-[#FFFFFF] mb-2">
                Telefone
              </label>
              <input
                type="tel"
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1d9bf0] focus:border-transparent"
                placeholder="(11) 98765-4321"
                value={userData.telefone || ''}
                onChange={(e) => setUserData(prev => ({ ...prev, telefone: e.target.value }))}
                disabled={!canEdit}
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-[#FFFFFF] mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 pr-10 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1d9bf0] focus:border-transparent"
                  placeholder={canEdit ? "Deixe em branco para manter a atual" : ""}
                  value={userData.senha || ''}
                  onChange={(e) => setUserData(prev => ({ ...prev, senha: e.target.value }))}
                  disabled={!canEdit}
                />
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[#1d9bf0] hover:bg-opacity-10 rounded-full transition-colors"
                  >
                    {showPassword ? 
                      <EyeOff className="w-5 h-5 text-[#1d9bf0]" /> : 
                      <Eye className="w-5 h-5 text-[#1d9bf0]" />
                    }
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Mínimo de 6 caracteres. Deixe vazio para não alterar
              </p>
            </div>
          </div>

          {/* Botão Ver Dados Completos */}
          {canEdit && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-[#2F3336]">
              <button
                onClick={() => setMostrarDadosCompletos(true)}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
              >
                <Database className="w-5 h-5" />
                Ver Todos os Meus Dados no Sistema
              </button>
              <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
                Visualize todas as tarefas, empréstimos e localização no banco de dados
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-[#2F3336]">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            {canEdit && (
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </div>
                ) : (
                  "Atualizar"
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Dados Completos */}
      {mostrarDadosCompletos && (
        <ModalDadosUsuario
          usuario={usuario}
          onClose={() => setMostrarDadosCompletos(false)}
        />
      )}
    </div>
  );
};

export default UserProfileModal;



