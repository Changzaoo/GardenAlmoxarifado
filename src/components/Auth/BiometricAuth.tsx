import React, { useEffect, useState } from 'react';
import { useBiometricAuth } from '../../hooks/useBiometricAuth';
import { Fingerprint, Shield, Smartphone } from 'lucide-react';

const BiometricAuth = ({ onSuccess, onSkip }) => {
  const { isAvailable, biometricTypeName, isAuthenticating, authenticate } = useBiometricAuth();
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;

  useEffect(() => {
    // Tentar autenticação automaticamente quando o componente montar
    if (isAvailable) {
      handleAuthenticate();
    }
  }, [isAvailable]);

  const handleAuthenticate = async () => {
    setError('');
    
    const result = await authenticate({
      reason: 'Autentique-se para acessar o Garden Almoxarifado',
      androidTitle: 'Autenticação Biométrica',
      androidSubtitle: 'Verificação de identidade',
      cancelTitle: 'Cancelar'
    });

    if (result.success) {
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= maxAttempts) {
        setError('Número máximo de tentativas excedido. Use login manual.');
      } else {
        setError(result.error || 'Falha na autenticação. Tente novamente.');
      }
    }
  };

  const handleTryAgain = () => {
    if (attempts < maxAttempts) {
      handleAuthenticate();
    }
  };

  if (!isAvailable) {
    // Se biometria não está disponível, pular automaticamente
    useEffect(() => {
      onSkip();
    }, []);
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-2xl">
            <Shield className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Garden Almoxarifado
          </h1>
          <p className="text-blue-100 text-sm">
            Sistema de Controle de Ferramentas
          </p>
        </div>

        {/* Card de Autenticação */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            {/* Ícone de Biometria */}
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-full mb-6 relative">
              {isAuthenticating ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-ping absolute inline-flex h-20 w-20 rounded-full bg-blue-400 opacity-75"></div>
                  <Fingerprint className="w-12 h-12 text-blue-600 dark:text-blue-400 relative z-10 animate-pulse" />
                </div>
              ) : (
                <Fingerprint className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              )}
            </div>

            {/* Título */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Autenticação Biométrica
            </h2>
            
            {/* Subtítulo */}
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Use sua {biometricTypeName.toLowerCase()} para acessar o sistema
            </p>

            {/* Status */}
            {isAuthenticating && (
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                  Aguardando autenticação...
                </p>
              </div>
            )}

            {/* Erro */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                  {error}
                </p>
                {attempts < maxAttempts && (
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                    Tentativas restantes: {maxAttempts - attempts}
                  </p>
                )}
              </div>
            )}

            {/* Botões */}
            <div className="space-y-3">
              {!isAuthenticating && attempts < maxAttempts && (
                <button
                  onClick={handleTryAgain}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
                           text-white font-semibold py-3 px-6 rounded-xl
                           transform transition-all duration-200 hover:scale-105
                           shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Fingerprint className="w-5 h-5" />
                  Tentar Novamente
                </button>
              )}

              <button
                onClick={onSkip}
                disabled={isAuthenticating}
                className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                         text-gray-700 dark:text-gray-200 font-semibold py-3 px-6 rounded-xl
                         transform transition-all duration-200 hover:scale-105
                         shadow-md hover:shadow-lg flex items-center justify-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Smartphone className="w-5 h-5" />
                Usar Login Manual
              </button>
            </div>

            {/* Info */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Shield className="w-4 h-4" />
                <span>Sua biometria está protegida e criptografada</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white text-xs opacity-80">
            © 2025 Garden Almoxarifado - Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
};

export default BiometricAuth;
