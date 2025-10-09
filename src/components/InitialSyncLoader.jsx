import React, { useEffect, useState } from 'react';
import initialSyncService from '../services/initialSyncService';

const InitialSyncLoader = ({ onComplete }) => {
  const [syncProgress, setSyncProgress] = useState({
    total: 0,
    completed: 0,
    current: '',
    status: 'starting',
    isComplete: false,
    errors: []
  });

  useEffect(() => {
    let unsubscribe;

    const startSync = async () => {
      // Listener para progresso
      unsubscribe = initialSyncService.onProgress((progress) => {
        setSyncProgress(progress);
      });

      // Iniciar sincronização
      const result = await initialSyncService.performInitialSync();
      
      if (result.cached) {
        // Dados já estavam em cache
        if (onComplete) onComplete(result);
      } else if (result.success) {
        // Sincronização concluída
        setTimeout(() => {
          if (onComplete) onComplete(result);
        }, 1000);
      }
    };

    startSync();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [onComplete]);

  const getStatusText = () => {
    switch (syncProgress.status) {
      case 'starting':
        return 'Baixando todas as informações do sistema...';
      case 'downloading':
        return `Baixando ${syncProgress.collection}...`;
      case 'saving':
        return `Salvando ${syncProgress.collection} no cache...`;
      case 'completed':
        return syncProgress.isComplete 
          ? '✅ Tudo pronto! Carregamento será instantâneo!' 
          : `✓ ${syncProgress.collection} salvo`;
      case 'error':
        return `❌ Erro em ${syncProgress.collection}`;
      case 'complete':
        return '🎉 Sistema pronto para uso offline!';
      default:
        return 'Preparando cache local...';
    }
  };

  const percentage = syncProgress.total > 0 
    ? Math.round((syncProgress.completed / syncProgress.total) * 100)
    : 0;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      color: '#fff',
      padding: '20px'
    }}>
      {/* Logo/Título */}
      <div style={{
        fontSize: '32px',
        fontWeight: 'bold',
        marginBottom: '40px',
        textAlign: 'center'
      }}>
        🌿 WorkFlow
      </div>

      {/* Barra de progresso */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        marginBottom: '20px'
      }}>
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: '#4CAF50',
            transition: 'width 0.3s ease',
            borderRadius: '4px'
          }} />
        </div>
      </div>

      {/* Porcentagem */}
      <div style={{
        fontSize: '48px',
        fontWeight: 'bold',
        marginBottom: '10px',
        color: '#4CAF50'
      }}>
        {percentage}%
      </div>

      {/* Status atual */}
      <div style={{
        fontSize: '16px',
        marginBottom: '30px',
        opacity: 0.8,
        textAlign: 'center',
        minHeight: '24px'
      }}>
        {getStatusText()}
      </div>

      {/* Contador */}
      <div style={{
        fontSize: '14px',
        opacity: 0.6,
        marginBottom: '10px'
      }}>
        {syncProgress.completed} de {syncProgress.total} coleções
      </div>

      {/* Animação de loading */}
      {!syncProgress.isComplete && (
        <div style={{
          marginTop: '20px',
          display: 'flex',
          gap: '8px'
        }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: '#4CAF50',
                borderRadius: '50%',
                animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`
              }}
            />
          ))}
        </div>
      )}

      {/* Erros */}
      {syncProgress.errors && syncProgress.errors.length > 0 && (
        <div style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: 'rgba(244, 67, 54, 0.2)',
          borderRadius: '8px',
          fontSize: '12px',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          ⚠️ {syncProgress.errors.length} erro(s) durante a sincronização
        </div>
      )}

      {/* CSS para animação */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
};

export default InitialSyncLoader;
