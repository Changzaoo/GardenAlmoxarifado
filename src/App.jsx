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
import 'react-toastify/dist/ReactToastify.css';

// Componentes das páginas
import Workflow from './components/Workflow';
import EstatisticasAcesso from './pages/EstatisticasAcesso/EstatisticasAcesso';

// Sistema offline
import { syncManager } from './utils/syncManager';
import { autoSyncService } from './utils/autoSyncService';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import AutoSyncIndicator from './components/Sync/AutoSyncIndicator';

// 🆘 CORREÇÃO DE EMERGÊNCIA - Firestore
import { detectarECorrigirErroFirestore, adicionarBotaoEmergencia } from './utils/firestoreEmergency';

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
  
  // Hook de status offline
  const { isOnline, wasOffline } = useOnlineStatus();
  const [hasInitialSynced, setHasInitialSynced] = useState(false);

  // Download automático ao entrar no app
  useEffect(() => {
    const performInitialSync = async () => {
      if (isOnline && !hasInitialSynced) {
        console.log('🚀 Iniciando download automático de dados...');
        try {
          await autoSyncService.downloadAllData({ 
            showToast: true, 
            force: false // Respeita intervalo mínimo
          });
          setHasInitialSynced(true);
        } catch (error) {
          console.error('❌ Erro no download inicial:', error);
        }
      }
    };

    // Executar após 2 segundos para não bloquear a inicialização
    const timer = setTimeout(performInitialSync, 2000);
    return () => clearTimeout(timer);
  }, [isOnline, hasInitialSynced]);

  // Sincronizar quando reconectar (uploads pendentes)
  useEffect(() => {
    if (isOnline && wasOffline) {
      console.log('🔄 Reconectado! Iniciando sincronização de pendências...');
      syncManager.startSync();
      
      // Também refazer download para garantir dados atualizados
      setTimeout(() => {
        autoSyncService.downloadAllData({ showToast: false, force: true });
      }, 3000);
    }
  }, [isOnline, wasOffline]);

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