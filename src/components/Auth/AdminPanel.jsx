import React, { useState } from 'react';
import { Shield } from 'lucide-react';

const AdminPanel = ({ onClose }) => {
  const [newCredentials, setNewCredentials] = useState({ username: '', password: '' });

  const updateCredentials = () => {
    if (!newCredentials.username || !newCredentials.password) {
      alert('Por favor, preencha todos os campos');
      return;
    }
    
    alert(`Novas credenciais definidas:\nUsuário: ${newCredentials.username}\nSenha: ${newCredentials.password}\n\nATENÇÃO: Anote essas informações, pois o sistema será reinicializado.`);
    
    setNewCredentials({ username: '', password: '' });
    onClose();
  };

  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
        <Shield className="w-4 h-4" />
        Painel de Administração
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-blue-700 mb-1">
            Novo Usuário
          </label>
          <input
            type="text"
            value={newCredentials.username}
            onChange={(e) => setNewCredentials({...newCredentials, username: e.target.value})}
            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Digite o novo usuário"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-blue-700 mb-1">
            Nova Senha
          </label>
          <input
            type="password"
            value={newCredentials.password}
            onChange={(e) => setNewCredentials({...newCredentials, password: e.target.value})}
            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Digite a nova senha"
          />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={updateCredentials}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Atualizar Credenciais
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
        >
          Cancelar
        </button>
      </div>
      <div className="mt-3 p-3 bg-yellow-100 border border-yellow-400 rounded text-sm text-yellow-800">
        <strong>Atenção:</strong> As credenciais atuais só são conhecidas pelo desenvolvedor. 
        Ao alterar, anote as novas informações pois o sistema será reinicializado.
      </div>
    </div>
  );
};

export default AdminPanel;