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
import LoginForm from './components/Auth/LoginForm';
import PrivateRoute from './components/Auth/PrivateRoute';

// Componentes das páginas
import InventarioTab from './components/Inventario/InventarioTab';
import MeuInventarioTab from './components/Inventario/MeuInventarioTab';
import EmprestimosTab from './components/Emprestimos/EmprestimosTab';
import FuncionariosTab from './components/Funcionarios/FuncionariosTab';
import ComprasTab from './components/Compras/ComprasTab';
import TarefasTab from './components/Tarefas/TarefasTab';
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
                      <Route path="/login" element={<LoginForm />} />
                      <Route path="/" element={<Layout />}>
                        <Route index element={<PrivateRoute><AlmoxarifadoJardim /></PrivateRoute>} />
                        <Route path="funcionarios" element={<PrivateRoute><FuncionariosTab /></PrivateRoute>} />
                        <Route path="compras" element={<PrivateRoute><ComprasTab /></PrivateRoute>} />
                        <Route path="inventario" element={<PrivateRoute><InventarioTab /></PrivateRoute>} />
                        <Route path="emprestimos" element={<PrivateRoute><EmprestimosTab /></PrivateRoute>} />
                        <Route path="danificadas" element={<PrivateRoute><FerramentasDanificadasTab /></PrivateRoute>} />
                        <Route path="tarefas" element={<PrivateRoute><TarefasTab /></PrivateRoute>} />
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