import React, { useState } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';

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
    <div className="bg-[#192734] border border-[#38444D] rounded-xl p-6 shadow-lg">
      <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-[#1D9BF0]" />
        Painel de Administração
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Novo Usuário"
            type="text"
            value={newCredentials.username}
            onChange={(e) => setNewCredentials({...newCredentials, username: e.target.value})}
            placeholder="Digite o novo usuário"
          />
          
          <Input
            label="Nova Senha"
            type="password"
            value={newCredentials.password}
            onChange={(e) => setNewCredentials({...newCredentials, password: e.target.value})}
            placeholder="Digite a nova senha"
          />
        </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <Button
            variant="primary"
            onClick={updateCredentials}
            className="flex-1"
          >
            Atualizar Credenciais
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
        </div>
        
        <div className="mt-4 p-4 bg-[#FFD700] bg-opacity-10 border border-[#FFD700] rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#FFD700] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[#FFD700]">
              <strong>Atenção:</strong> As credenciais atuais só são conhecidas pelo desenvolvedor. 
              Ao alterar, anote as novas informações pois o sistema será reinicializado.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;