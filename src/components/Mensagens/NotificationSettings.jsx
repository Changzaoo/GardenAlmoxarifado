import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Volume2, VolumeX, Smartphone, Monitor, Eye, EyeOff, TestTube } from 'lucide-react';
import notificationManager from '../../services/notificationManager';
import { toast } from 'react-toastify';

/**
 * NotificationSettings - Painel de configurações de notificações
 * Permite o usuário customizar como recebe notificações
 */
const NotificationSettings = ({ onClose }) => {
  const [preferences, setPreferences] = useState(notificationManager.getPreferences());
  const [permission, setPermission] = useState(Notification.permission);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Atualizar preferências ao abrir
    setPreferences(notificationManager.getPreferences());
    setPermission(Notification.permission);
  }, []);

  /**
   * Atualiza uma preferência
   */
  const updatePreference = (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    notificationManager.savePreferences(newPreferences);
    
    toast.success('Configuração salva!', { icon: '✅', autoClose: 2000 });
  };

  /**
   * Solicita permissão de notificações
   */
  const handleRequestPermission = async () => {
    setLoading(true);
    
    try {
      const result = await notificationManager.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('Notificações ativadas!', { icon: '🔔' });
      } else {
        toast.warn('Permissão negada', { icon: '⚠️' });
      }
    } catch (error) {
      toast.error('Erro ao solicitar permissão');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Envia notificação de teste
   */
  const handleTestNotification = async () => {
    if (permission !== 'granted') {
      toast.warn('Ative as notificações primeiro!');
      return;
    }

    setLoading(true);
    try {
      // Tocar som de teste
      if (preferences.sound) {
        const audio = new Audio('/sounds/notification.wav');
        audio.volume = 0.6;
        await audio.play();
      }

      // Enviar notificação de teste
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.showNotification) {
          await registration.showNotification('Teste de Notificação 🔔', {
            body: 'Esta é uma notificação de teste do WorkFlow',
            icon: '/logo192.png',
            badge: '/logo192.png',
            tag: 'test-notification',
            requireInteraction: false,
            vibrate: preferences.vibration ? [200, 100, 200] : [],
            silent: !preferences.sound
          });
        }
      } else {
        // Notificação básica
        const notification = new Notification('Teste de Notificação 🔔', {
          body: 'Esta é uma notificação de teste do WorkFlow',
          icon: '/logo192.png',
          badge: '/logo192.png',
          requireInteraction: false,
          vibrate: preferences.vibration ? [200, 100, 200] : []
        });

        setTimeout(() => notification.close(), 5000);
      }

      toast.success('Notificação de teste enviada!', { icon: '✅' });
    } catch (error) {
      console.error('Erro ao enviar teste:', error);
      toast.error('Erro ao enviar notificação de teste');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Abre configurações do navegador
   */
  const openBrowserSettings = () => {
    toast.info('Abra as configurações do navegador para gerenciar permissões', {
      autoClose: 5000
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Configurações de Notificações</h2>
                <p className="text-blue-100 text-sm mt-1">
                  Personalize como você recebe notificações
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status de Permissão */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {permission === 'granted' ? (
                    <>
                      <Bell className="w-5 h-5 text-green-500" />
                      Notificações Ativadas
                    </>
                  ) : (
                    <>
                      <BellOff className="w-5 h-5 text-gray-400" />
                      Notificações Desativadas
                    </>
                  )}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {permission === 'granted' 
                    ? 'Você receberá notificações de novas mensagens'
                    : permission === 'denied'
                    ? 'Notificações bloqueadas. Habilite nas configurações do navegador.'
                    : 'Clique no botão para ativar notificações'
                  }
                </p>
              </div>
              
              {permission !== 'granted' && (
                <button
                  onClick={permission === 'denied' ? openBrowserSettings : handleRequestPermission}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50"
                >
                  {permission === 'denied' ? 'Configurações' : 'Ativar'}
                </button>
              )}
            </div>

            {permission === 'granted' && (
              <button
                onClick={handleTestNotification}
                disabled={loading}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 border-2 border-gray-200 dark:border-gray-600"
              >
                <TestTube className="w-4 h-4" />
                Enviar Notificação de Teste
              </button>
            )}
          </div>

          {/* Configurações Gerais */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Preferências
            </h3>

            {/* Notificações Desktop */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Notificações no Desktop
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Mostrar notificações do navegador
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.desktop}
                  onChange={(e) => updatePreference('desktop', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Som */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-3">
                {preferences.sound ? (
                  <Volume2 className="w-5 h-5 text-green-500" />
                ) : (
                  <VolumeX className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Som de Notificação
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tocar som ao receber mensagens
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.sound}
                  onChange={(e) => updatePreference('sound', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Vibração */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Vibração
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Vibrar ao receber notificações (mobile)
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.vibration}
                  onChange={(e) => updatePreference('vibration', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Preview */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-3">
                {preferences.showPreview ? (
                  <Eye className="w-5 h-5 text-blue-500" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Mostrar Preview
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Exibir conteúdo da mensagem na notificação
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.showPreview}
                  onChange={(e) => updatePreference('showPreview', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>💡 Dica:</strong> As notificações não aparecerão quando você estiver com a página de mensagens aberta e ativa. Isso evita notificações desnecessárias!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
