import React, { useState, useEffect } from 'react';
import bluetoothMeshService from '../../services/bluetoothMeshService';

/**
 * Componente para solicitar permissão de Bluetooth em dispositivos móveis
 * Aparece apenas uma vez ao iniciar o app
 */
const BluetoothPermissionRequest = () => {
  const [showRequest, setShowRequest] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    const checkAndRequest = async () => {
      // Verificar se já pediu permissão antes
      const hasAsked = localStorage.getItem('bluetooth-permission-asked');
      
      // Apenas mostrar em dispositivos móveis
      const isMobile = bluetoothMeshService.isMobile;
      
      // Verificar se Bluetooth é suportado
      const isSupported = bluetoothMeshService.isSupported;

      if (!hasAsked && isMobile && isSupported) {
        // Aguardar 2 segundos para app carregar completamente
        setTimeout(() => {
          setShowRequest(true);
        }, 2000);
      } else if (hasAsked === 'granted') {
        // Se já foi concedida, iniciar varredura automática
        startAutoScan();
      }
    };

    checkAndRequest();
  }, []);

  const startAutoScan = () => {
    try {
      bluetoothMeshService.startAutoScan();
      console.log('✅ Varredura automática iniciada');
    } catch (error) {
      console.error('❌ Erro ao iniciar varredura automática:', error);
    }
  };

  const handleAllow = async () => {
    setIsRequesting(true);
    
    try {
      // Solicitar permissão
      await bluetoothMeshService.requestPermission();
      
      // Marcar como solicitado
      localStorage.setItem('bluetooth-permission-asked', 'granted');
      
      // Iniciar varredura automática
      startAutoScan();
      
      // Fechar dialog
      setShowRequest(false);
      
      console.log('✅ Permissão de Bluetooth concedida');
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão:', error);
      localStorage.setItem('bluetooth-permission-asked', 'denied');
      setShowRequest(false);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDeny = () => {
    localStorage.setItem('bluetooth-permission-asked', 'denied');
    setShowRequest(false);
  };

  const handleLater = () => {
    // Não marcar como solicitado, perguntar novamente depois
    setShowRequest(false);
  };

  if (!showRequest) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md mx-4 overflow-hidden animate-slide-up">
        {/* Header com ícone */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Sincronização Bluetooth
          </h2>
          <p className="text-blue-100 text-sm">
            Compartilhe dados com dispositivos próximos
          </p>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-gray-700 dark:text-gray-200 text-center mb-3">
              O <strong>Workflow</strong> precisa de acesso ao Bluetooth para:
            </p>
            
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="text-xl">📡</span>
                <div>
                  <strong className="text-gray-800 dark:text-gray-100">Sincronização automática</strong>
                  <p className="text-gray-600 dark:text-gray-400">Detectar dispositivos próximos a cada 5 minutos</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-xl">🔄</span>
                <div>
                  <strong className="text-gray-800 dark:text-gray-100">Compartilhar dados offline</strong>
                  <p className="text-gray-600 dark:text-gray-400">Transferir informações quando não há internet</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-xl">💾</span>
                <div>
                  <strong className="text-gray-800 dark:text-gray-100">Backup automático</strong>
                  <p className="text-gray-600 dark:text-gray-400">Seus dados ficam seguros em múltiplos dispositivos</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              🔒 <strong>Privacidade garantida:</strong> A varredura é rápida e não compartilha 
              dados pessoais. O Bluetooth é ligado brevemente apenas para detectar outros 
              dispositivos Workflow próximos.
            </p>
          </div>
        </div>

        {/* Botões */}
        <div className="p-6 pt-0 space-y-3">
          <button
            onClick={handleAllow}
            disabled={isRequesting}
            className={`
              w-full py-4 rounded-xl font-bold text-lg transition-all
              ${isRequesting
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
              }
            `}
          >
            {isRequesting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Solicitando...
              </span>
            ) : (
              '✓ Permitir Bluetooth'
            )}
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleLater}
              className="flex-1 py-3 rounded-xl font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            >
              Perguntar depois
            </button>
            <button
              onClick={handleDeny}
              className="flex-1 py-3 rounded-xl font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
            >
              Não permitir
            </button>
          </div>
        </div>

        {/* Rodapé informativo */}
        <div className="bg-gray-100 dark:bg-gray-900 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Você pode alterar essa permissão a qualquer momento nas configurações do app
          </p>
        </div>
      </div>

      {/* CSS para animações */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
};

export default BluetoothPermissionRequest;
