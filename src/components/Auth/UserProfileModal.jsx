import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ToastProvider';
import { encryptPassword } from '../../utils/crypto';
import { NIVEIS_PERMISSAO, NIVEIS_LABELS } from '../../constants/permissoes';

const UserProfileModal = ({ isOpen, onClose, userId }) => {
  const { usuario, atualizarUsuario } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

      // Prepara os dados para atualização
      const dadosParaAtualizar = {
        nome: userData.nome.trim(),
        ativo: userData.ativo
      };

      // Adiciona senha apenas se foi fornecida, e encripta antes de salvar
      if (userData.senha?.trim()) {
        const senhaCriptografada = encryptPassword(userData.senha.trim());
        dadosParaAtualizar.senha = senhaCriptografada.hash;
        dadosParaAtualizar.senhaSalt = senhaCriptografada.salt;
        dadosParaAtualizar.senhaVersion = senhaCriptografada.version;
      }

      // Atualiza no Firestore
      await updateDoc(doc(db, 'usuarios', usuario.id), dadosParaAtualizar);
      
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
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-[#FFFFFF] mb-2">
                Nome
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-100 dark:bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 dark:border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] focus:border-transparent"
                placeholder="Digite o nome completo"
                value={userData.nome || ''}
                onChange={(e) => setUserData(prev => ({ ...prev, nome: e.target.value }))}
                disabled={!canEdit}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-[#FFFFFF] mb-2">
                Senha {canEdit}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 pr-10 bg-gray-100 dark:bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 dark:border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] focus:border-transparent"
                  placeholder={canEdit ? "Nova senha" : ""}
                  value={userData.senha || ''}
                  onChange={(e) => setUserData(prev => ({ ...prev, senha: e.target.value }))}
                  disabled={!canEdit}
                />
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2 p-1 hover:bg-blue-500 hover:bg-opacity-10 dark:hover:bg-[#1D9BF0] dark:hover:bg-opacity-10 rounded-full transition-colors"
                  >
                    {showPassword ? 
                      <EyeOff className="w-5 h-5 text-blue-500 dark:text-[#1D9BF0]" /> : 
                      <Eye className="w-5 h-5 text-blue-500 dark:text-[#1D9BF0]" />
                    }
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-[#FFFFFF] mb-2">
                Telefone
              </label>
              <input
                type="tel"
                className="w-full px-3 py-2 bg-gray-100 dark:bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 dark:border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] focus:border-transparent"
                placeholder="Digite o telefone"
                value={userData.telefone || ''}
                onChange={(e) => setUserData(prev => ({ ...prev, telefone: e.target.value }))}
                disabled={!canEdit}
              />
            </div>

           
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-[#2F3336]">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-black dark:bg-opacity-5 dark:hover:bg-opacity-10 text-gray-700 dark:text-[#FFFFFF] rounded-full transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            {canEdit && (
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] text-gray-900 dark:text-white rounded-full transition-colors disabled:opacity-50"
              >
                {loading ? "Salvando..." : "Atualizar"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;



