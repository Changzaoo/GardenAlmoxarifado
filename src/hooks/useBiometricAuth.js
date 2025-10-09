import { useState, useEffect } from 'react';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { Capacitor } from '@capacitor/core';

export const useBiometricAuth = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    // Só funciona em dispositivos nativos (Android/iOS)
    if (!Capacitor.isNativePlatform()) {
      setIsAvailable(false);
      return;
    }

    try {
      const result = await BiometricAuth.checkBiometry();
      setIsAvailable(result.isAvailable);
      setBiometricType(result.biometryType);
    } catch (error) {
      console.error('Erro ao verificar biometria:', error);
      setIsAvailable(false);
    }
  };

  const authenticate = async (options = {}) => {
    if (!isAvailable) {
      return {
        success: false,
        error: 'Biometria não disponível neste dispositivo'
      };
    }

    setIsAuthenticating(true);

    try {
      const result = await BiometricAuth.authenticate({
        reason: options.reason || 'Autentique-se para acessar o sistema',
        cancelTitle: options.cancelTitle || 'Cancelar',
        allowDeviceCredential: options.allowDeviceCredential !== false,
        iosFallbackTitle: options.iosFallbackTitle || 'Usar senha',
        androidTitle: options.androidTitle || 'Autenticação Biométrica',
        androidSubtitle: options.androidSubtitle || 'Verificação de identidade',
        androidConfirmationRequired: options.androidConfirmationRequired !== false,
        androidBiometryStrength: options.androidBiometryStrength || 'weak'
      });

      setIsAuthenticating(false);

      if (result) {
        return {
          success: true,
          data: result
        };
      } else {
        return {
          success: false,
          error: 'Autenticação cancelada pelo usuário'
        };
      }
    } catch (error) {
      setIsAuthenticating(false);
      console.error('Erro na autenticação biométrica:', error);
      
      return {
        success: false,
        error: error.message || 'Erro ao autenticar',
        code: error.code
      };
    }
  };

  const getBiometricTypeName = () => {
    switch (biometricType) {
      case 0: // BiometryType.none
        return 'Nenhuma';
      case 1: // BiometryType.fingerprintAuthentication
        return 'Digital';
      case 2: // BiometryType.faceAuthentication
        return 'Reconhecimento Facial';
      case 3: // BiometryType.irisAuthentication
        return 'Íris';
      default:
        return 'Desconhecida';
    }
  };

  return {
    isAvailable,
    biometricType,
    biometricTypeName: getBiometricTypeName(),
    isAuthenticating,
    authenticate,
    checkBiometricAvailability
  };
};
