import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './hooks/useAuth';
import { FuncionariosProvider } from './components/Funcionarios/FuncionariosProvider';
import { InventarioProvider } from './components/Inventario/InventarioProvider';
import { TarefasProvider } from './components/Tarefas/TarefasProvider';
import { NotificationProvider } from './components/NotificationProvider';
import { ThemeProvider } from './components/ThemeProvider';
import Layout from './components/Layout/Layout';
import LoginFormContainer from './components/Auth/LoginFormContainer';
import PrivateRoute from './components/Auth/PrivateRoute';
import UserProfileModal from './components/Auth/UserProfileModal';
import 'react-toastify/dist/ReactToastify.css';

// Componentes das páginas
import InventarioTab from './components/Inventario/InventarioTab';
import MeuInventarioTab from './components/Inventario/MeuInventarioTab';
import EmprestimosTab from './components/Emprestimos/EmprestimosTab';
import FuncionariosTab from './components/Funcionarios/FuncionariosTab';
import ComprasTab from './components/Compras/ComprasTab';
import TarefasTab from './components/Tarefas/TarefasTab';
import HistoricoPage from './pages/HistoricoPage';
import FerramentasDanificadasTab from './components/Danificadas/FerramentasDanificadasTab';
import AlmoxarifadoJardim from './components/AlmoxarifadoJardim';

import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <FuncionariosProvider>
              <InventarioProvider>
                <TarefasProvider>
                  <div className="App">
                    <ToastContainer position="top-right" autoClose={3000} />
                    <Routes>
                      <Route path="/login" element={<LoginFormContainer />} />
                      <Route path="/" element={<Layout />}>
                        <Route index element={<PrivateRoute requiredLevel={1}><AlmoxarifadoJardim /></PrivateRoute>} />
                        <Route path="funcionarios" element={<PrivateRoute requiredLevel={2}><FuncionariosTab /></PrivateRoute>} />
                        <Route path="compras" element={<PrivateRoute requiredLevel={2}><ComprasTab /></PrivateRoute>} />
                        <Route path="inventario" element={<PrivateRoute requiredLevel={1}><InventarioTab /></PrivateRoute>} />
                        <Route path="emprestimos" element={<PrivateRoute requiredLevel={1}><EmprestimosTab /></PrivateRoute>} />
                        <Route path="historico-emprestimos" element={<PrivateRoute requiredLevel={1}><HistoricoPage /></PrivateRoute>} />
                        <Route path="danificadas" element={<PrivateRoute requiredLevel={1}><FerramentasDanificadasTab /></PrivateRoute>} />
                        <Route path="tarefas" element={<PrivateRoute requiredLevel={1}><TarefasTab /></PrivateRoute>} />
                      </Route>
                    </Routes>
                  </div>
                </TarefasProvider>
              </InventarioProvider>
            </FuncionariosProvider>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;