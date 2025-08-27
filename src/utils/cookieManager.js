// Sistema de cookies
const CookieManager = {
  // Função para definir cookie
  setCookie: (name, value, days = 30) => {
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      const expiresString = expires.toUTCString();
      
      // Converter objeto para string se necessário
      const cookieValue = typeof value === 'object' ? JSON.stringify(value) : value;
      
      // Criar cookie com configurações de segurança
      document.cookie = `${name}=${encodeURIComponent(cookieValue)};expires=${expiresString};path=/;SameSite=Strict`;
      
      console.log(`Cookie ${name} definido com sucesso`);
      return true;
    } catch (error) {
      console.error('Erro ao definir cookie:', error);
      return false;
    }
  },

  // Função para obter cookie
  getCookie: (name) => {
    try {
      const nameEQ = name + "=";
      const cookies = document.cookie.split(';');
      
      for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
          cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf(nameEQ) === 0) {
          const value = decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
          
          // Tentar parsear como JSON, senão retornar como string
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter cookie:', error);
      return null;
    }
  },

  // Função para remover cookie
  removeCookie: (name) => {
    try {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;SameSite=Strict`;
      console.log(`Cookie ${name} removido com sucesso`);
      return true;
    } catch (error) {
      console.error('Erro ao remover cookie:', error);
      return false;
    }
  },

  // Função para verificar se cookies estão disponíveis
  areCookiesEnabled: () => {
    try {
      const testCookie = 'almoxarifado_test';
      CookieManager.setCookie(testCookie, 'test', 1);
      const isEnabled = CookieManager.getCookie(testCookie) === 'test';
      CookieManager.removeCookie(testCookie);
      return isEnabled;
    } catch {
      return false;
    }
  }
};

export default CookieManager;
