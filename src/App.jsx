import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './hooks/useAuth';
import Chat from './components/Chat/Chat';
import { FuncionariosProvider } from './components/Funcionarios/FuncionariosProvider';
import { InventarioProvider } from './components/Inventario/InventarioProvider';
import { ThemeProvider } from './components/Theme/ThemeSystem';
import { RouteStateManager } from './components/RouteStateManager';
import { ScrollPersistence } from './hooks/useScrollPersistence';
import Layout from './components/Layout/Layout';
import LoginForm from './components/Auth/LoginForm';
import PrivateRoute from './components/Auth/PrivateRoute';
import UserProfileModal from './components/Auth/UserProfileModal';
import 'react-toastify/dist/ReactToastify.css';

// Componentes das páginas
import InventarioTab from './components/Inventario/InventarioTab';
import MeuInventarioTab from './components/Inventario/MeuInventarioTab';
import EmprestimosTab from './components/Emprestimos/EmprestimosTab';
import FuncionariosTab from './components/Funcionarios/FuncionariosTab';
import ComprasTab from './components/Compras/ComprasTab';
import HistoricoPage from './pages/HistoricoPage';
import FerramentasDanificadasTab from './components/Danificadas/FerramentasDanificadasTab';
import Workflow from './components/Workflow';

import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <FuncionariosProvider>
            <InventarioProvider>
              <div className="App">
                <RouteStateManager />
                <ScrollPersistence />
                <Chat />
                <ToastContainer 
                  position="top-right" 
                  autoClose={3000}
                  theme="dark"
                  toastStyle={{
                    background: 'var(--color-card)',
                    color: 'var(--color-text)',
                    borderRadius: '1rem',
                    border: '1px solid var(--color-border)'
                  }}
                />
                <Routes>
                  <Route path="/login" element={<LoginForm />} />
                  <Route path="/" element={<Layout />}>
                    <Route index element={<PrivateRoute requiredLevel={1}><Workflow /></PrivateRoute>} />
                    <Route path="funcionarios" element={<PrivateRoute requiredLevel={2}><FuncionariosTab /></PrivateRoute>} />
                    <Route path="compras" element={<PrivateRoute requiredLevel={2}><ComprasTab /></PrivateRoute>} />
                    <Route path="inventario" element={<PrivateRoute requiredLevel={1}><InventarioTab /></PrivateRoute>} />
                    <Route path="emprestimos" element={<PrivateRoute requiredLevel={1}><EmprestimosTab /></PrivateRoute>} />
                    <Route path="historico-emprestimos" element={<PrivateRoute requiredLevel={1}><HistoricoPage /></PrivateRoute>} />
                    <Route path="danificadas" element={<PrivateRoute requiredLevel={1}><FerramentasDanificadasTab /></PrivateRoute>} />
                  </Route>
                </Routes>
              </div>
            </InventarioProvider>
          </FuncionariosProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;