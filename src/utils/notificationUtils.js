// Função para solicitar permissão e registrar o token
export const requestNotificationPermission = async () => {
  try {
    // Verifica se o browser suporta notificações
    if (!('Notification' in window)) {
      console.log('Este browser não suporta notificações');
      return false;
    }

    // Verifica se já temos permissão
    if (Notification.permission === 'granted') {
      return true;
    }

    // Solicita permissão
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Erro ao solicitar permissão para notificações:', error);
    return false;
  }
};

// Função para enviar notificação
export const sendNotification = ({ title, body, icon = '/logo192.png', tag, data = {} }) => {
  if (Notification.permission === 'granted') {
    const options = {
      body,
      icon,
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      tag,
      data
    };

    try {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, options);
      });
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  }
};

// Função para registrar o service worker para notificações
export const registerForPush = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Verifica se o browser suporta push notifications
    if (!('pushManager' in registration)) {
      console.log('Push notifications não são suportadas');
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY)
    });

    return subscription;
  } catch (error) {
    console.error('Erro ao registrar para push notifications:', error);
    return null;
  }
};

// Função auxiliar para converter VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
