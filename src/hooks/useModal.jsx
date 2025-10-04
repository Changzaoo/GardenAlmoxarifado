import { useState, useCallback } from 'react';

/**
 * Hook para gerenciar modais customizados
 * Substitui alert(), confirm() e prompt() nativos
 * 
 * Uso:
 * const { showAlert, showConfirm, showSuccess, showError } = useModal();
 * 
 * await showAlert('Mensagem');
 * const confirmed = await showConfirm('Deseja continuar?');
 * await showSuccess('Operação concluída!');
 * await showError('Ocorreu um erro');
 */

export const useModal = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancelar',
    showCancel: false,
    resolve: null
  });

  const closeModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const openModal = useCallback((config) => {
    return new Promise((resolve) => {
      setModalState({
        ...config,
        isOpen: true,
        resolve
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (modalState.resolve) {
      modalState.resolve(true);
    }
    closeModal();
  }, [modalState.resolve, closeModal]);

  const handleCancel = useCallback(() => {
    if (modalState.resolve) {
      modalState.resolve(false);
    }
    closeModal();
  }, [modalState.resolve, closeModal]);

  // Métodos auxiliares
  const showAlert = useCallback((message, title = 'Aviso') => {
    return openModal({
      type: 'alert',
      title,
      message,
      confirmText: 'OK',
      showCancel: false
    });
  }, [openModal]);

  const showConfirm = useCallback((message, title = 'Confirmação', options = {}) => {
    return openModal({
      type: 'confirm',
      title,
      message,
      confirmText: options.confirmText || 'OK',
      cancelText: options.cancelText || 'Cancelar',
      showCancel: true
    });
  }, [openModal]);

  const showSuccess = useCallback((message, title = 'Sucesso') => {
    return openModal({
      type: 'success',
      title,
      message,
      confirmText: 'OK',
      showCancel: false
    });
  }, [openModal]);

  const showError = useCallback((message, title = 'Erro') => {
    return openModal({
      type: 'error',
      title,
      message,
      confirmText: 'OK',
      showCancel: false
    });
  }, [openModal]);

  const showInfo = useCallback((message, title = 'Informação') => {
    return openModal({
      type: 'info',
      title,
      message,
      confirmText: 'OK',
      showCancel: false
    });
  }, [openModal]);

  return {
    modalState,
    handleConfirm,
    handleCancel,
    showAlert,
    showConfirm,
    showSuccess,
    showError,
    showInfo,
    closeModal
  };
};
