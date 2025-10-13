import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './hooks/useAuth';
import { useAnalytics } from './hooks/useAnalytics';
import { Capacitor } from '@capacitor/core';
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
import BiometricAuth from './components/Auth/BiometricAuth';
import CriarAdminTemp from './components/Auth/CriarAdminTemp';
import OfflineIndicator from './components/OfflineIndicator';
import QRCodeScanner from './components/QRCode/QRCodeScanner';
import PasswordResetForm from './components/PasswordReset/PasswordResetForm';
import CriarConta from './components/Auth/CriarConta';
import { DataProvider } from './context/DataContext';
import 'react-toastify/dist/ReactToastify.css';

// Componentes das páginas
import Workflow from './components/Workflow';
import EstatisticasAcesso from './pages/EstatisticasAcesso/EstatisticasAcesso';

// Sistema offline
import { syncManager } from './utils/syncManager';
import { autoSyncService } from './utils/autoSyncService';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import AutoSyncIndicator from './components/Sync/AutoSyncIndicator';
import InitialSyncLoader from './components/InitialSyncLoader';
import initialSyncService from './services/initialSyncService';
import BackgroundJobsIndicator from './components/BackgroundJobsIndicator';

// 🆘 CORREÇÃO DE EMERGÊNCIA - Firestore
import { detectarECorrigirErroFirestore, adicionarBotaoEmergencia } from './utils/firestoreEmergency';

// ✨ Auto-Update Manager
import AutoUpdateManager from './components/AutoUpdateManager';

import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// 🔥 Ativar detecção automática de erros do Firestore
detectarECorrigirErroFirestore();

// Componente interno para usar o hook de analytics
function AppContent() {
  // Registra analytics automaticamente
  useAnalytics();
  
  const [showBiometric, setShowBiometric] = useState(false);
  const [biometricChecked, setBiometricChecked] = useState(false);
  const [isInitialSyncing, setIsInitialSyncing] = useState(true);
  const [syncComplete, setSyncComplete] = useState(false);
  
  // Hook de status offline
  const { isOnline, wasOffline } = useOnlineStatus();

  // Sincronização inicial ao abrir o app
  useEffect(() => {
    const checkInitialSync = async () => {
      const syncStatus = initialSyncService.checkSyncStatus();
      
      if (syncStatus.needsSync) {
        // Precisa sincronizar
        setIsInitialSyncing(true);
      } else {
        // Dados já em cache
        setIsInitialSyncing(false);
        setSyncComplete(true);
      }
    };

    checkInitialSync();
  }, []);

  const handleSyncComplete = (result) => {
    // ✨ Adiciona delay mínimo de 1.5 segundos para evitar piscar da tela de login
    setTimeout(() => {
      setIsInitialSyncing(false);
      setSyncComplete(true);
      
      if (result.success) {
        // Sincronização concluída
      } else if (result.cached) {
        // Dados já estavam em cache
      }
    }, 1500); // Delay de 1.5 segundos para transição suave
  };

  // Sincronizar quando reconectar (uploads pendentes)
  useEffect(() => {
    if (isOnline && wasOffline && syncComplete) {
      syncManager.startSync();
      
      // Re-sincronizar dados do Firebase
      setTimeout(() => {
        initialSyncService.performInitialSync(true);
      }, 2000);
    }
  }, [isOnline, wasOffline, syncComplete]);

  useEffect(() => {
    // Verifica se está em plataforma nativa (Android/iOS)
    const isNative = Capacitor.isNativePlatform();
    
    if (isNative) {
      // Verifica se já foi autenticado nesta sessão
      const biometricAuthenticated = sessionStorage.getItem('biometric_authenticated');
      
      if (!biometricAuthenticated) {
        setShowBiometric(true);
      } else {
        setBiometricChecked(true);
      }
    } else {
      // Se não for nativo, pula a biometria
      setBiometricChecked(true);
    }
  }, []);

  const handleBiometricSuccess = () => {
    // Marca como autenticado nesta sessão
    sessionStorage.setItem('biometric_authenticated', 'true');
    setShowBiometric(false);
    setBiometricChecked(true);
  };

  const handleBiometricSkip = () => {
    // Permite pular a biometria e usar login manual
    setShowBiometric(false);
    setBiometricChecked(true);
  };

  // Mostra tela de sincronização inicial
  if (isInitialSyncing && isOnline) {
    return <InitialSyncLoader onComplete={handleSyncComplete} />;
  }

  // Mostra tela de biometria se necessário
  if (showBiometric) {
    return <BiometricAuth onSuccess={handleBiometricSuccess} onSkip={handleBiometricSkip} />;
  }

  // Aguarda verificação da biometria antes de mostrar o app
  if (!biometricChecked) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Carregando...</p>
        </div>
      </div>
    );
  }

  // 🆘 Adicionar botão de emergência ao DOM
  useEffect(() => {
    adicionarBotaoEmergencia();
  }, []);
  
  return (
    <div className="App">
      <RouteStateManager />
      <ScrollPersistence />
      <NotificationPermissionModal />
      
      {/* Indicador de status offline */}
      <OfflineIndicator />
      
      {/* Indicador de sincronização automática */}
      <AutoSyncIndicator />
      
      {/* Indicador de tarefas em segundo plano */}
      <BackgroundJobsIndicator />
      
      {/* ✨ Gerenciador de atualizações automáticas */}
      <AutoUpdateManager />
      
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
        <Route path="/qr-auth" element={<QRCodeScanner />} />
        <Route path="/criar-conta" element={<CriarConta onVoltar={() => window.location.href = '/login'} />} />
        <Route path="/redefinir-senha" element={<PasswordResetForm onVoltar={() => window.location.href = '/'} />} />
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
          <DataProvider>
            <FuncionariosProvider>
              <InventarioProvider>
                <MessageNotificationProvider>
                  <AppContent />
                </MessageNotificationProvider>
              </InventarioProvider>
            </FuncionariosProvider>
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;