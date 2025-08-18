import React, { useState } from 'react';
import { Package, Users } from 'lucide-react';
import LoginForm from './Auth/LoginForm';
import Header from './Layout/Header';
import Dashboard from './Dashboard/Dashboard';
import EmprestimosTab from './Emprestimos/EmprestimosTab';
import InventarioTab from './Inventario/InventarioTab';
import { useAuth } from '../hooks/useAuth';
import { useEmprestimos } from '../hooks/useEmprestimos';
import { useInventario } from '../hooks/useInventario';

const AlmoxarifadoJardim = () => {
  const { isAuthenticated, showLogin, handleLogin, handleLogout, loginError, loginData, setLoginData, showPassword, setShowPassword } = useAuth();
  const { emprestimos, adicionarEmprestimo, devolverFerramentas, removerEmprestimo } = useEmprestimos();
  const { inventario, adicionarItem, removerItem, atualizarDisponibilidade } = useInventario();
  
  const [activeTab, setActiveTab] = useState('emprestimos');

  // Se não está autenticado, mostrar tela de login
  if (!isAuthenticated) {
    return (
      <LoginForm
        loginData={loginData}
        setLoginData={setLoginData}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        handleLogin={handleLogin}
        loginError={loginError}
      />
    );
  }

  // Calcular estatísticas
  const stats = {
    emprestimosAtivos: emprestimos.filter(e => e.status === 'emprestado').length,
    itensDisponiveis: inventario.reduce((acc, item) => acc + item.disponivel, 0),
    itensEmUso: inventario.reduce((acc, item) => acc + (item.quantidade - item.disponivel), 0),
    totalItens: inventario.length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <Header handleLogout={handleLogout} />
        
        <Dashboard stats={stats} />
        
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('emprestimos')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'emprestimos'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Empréstimos
          </button>
          <button
            onClick={() => setActiveTab('inventario')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'inventario'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            Inventário
          </button>
        </div>

        {/* Conteúdo das abas */}
        {activeTab === 'emprestimos' && (
          <EmprestimosTab
            emprestimos={emprestimos}
            inventario={inventario}
            adicionarEmprestimo={adicionarEmprestimo}
            devolverFerramentas={devolverFerramentas}
            removerEmprestimo={removerEmprestimo}
            atualizarDisponibilidade={atualizarDisponibilidade}
          />
        )}

        {activeTab === 'inventario' && (
          <InventarioTab
            inventario={inventario}
            emprestimos={emprestimos}
            adicionarItem={adicionarItem}
            removerItem={removerItem}
          />
        )}
      </div>
    </div>
  );
};

export default AlmoxarifadoJardim;