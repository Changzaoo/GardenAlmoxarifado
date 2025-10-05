import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './hooks/useAuth';
import { useAnalytics } from './hooks/useAnalytics';
import Chat from './components/Chat/Chat';
import { FuncionariosProvider } from './components/Funcionarios/FuncionariosProvider';
import { InventarioProvider } from './components/Inventario/InventarioProvider';
import { ThemeProvider } from './components/Theme/ThemeSystem';
import { RouteStateManager } from './components/RouteStateManager';
import { ScrollPersistence } from './hooks/useScrollPersistence';
import Layout from './components/Layout/Layout';
import { MessageNotificationProvider } from './components/Chat/MessageNotificationContext';
import LoginFormContainer from './components/Auth/LoginFormContainer';
import PrivateRoute from './components/Auth/PrivateRoute';
import UserProfileModal from './components/Auth/UserProfileModal';
import NotificationPermissionModal from './components/Notifications/NotificationPermissionModal';
import CriarAdminTemp from './components/Auth/CriarAdminTemp';
import 'react-toastify/dist/ReactToastify.css';

// Componentes das páginas
import Workflow from './components/Workflow';
import EstatisticasAcesso from './pages/EstatisticasAcesso/EstatisticasAcesso';

import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Componente interno para usar o hook de analytics
function AppContent() {
  // Registra analytics automaticamente
  useAnalytics();
  
  return (
    <div className="App">
      <RouteStateManager />
      <ScrollPersistence />
      <NotificationPermissionModal />
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
        <Route path="/login" element={<LoginFormContainer />} />
        <Route path="/criar-admin-temp" element={<CriarAdminTemp />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<PrivateRoute requiredLevel={1}><Workflow /></PrivateRoute>} />
          <Route path="/estatisticas-acesso" element={<PrivateRoute requiredLevel={4}><EstatisticasAcesso /></PrivateRoute>} />
        </Route>
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <FuncionariosProvider>
            <InventarioProvider>
              <MessageNotificationProvider>
                <AppContent />
              </MessageNotificationProvider>
            </InventarioProvider>
          </FuncionariosProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;