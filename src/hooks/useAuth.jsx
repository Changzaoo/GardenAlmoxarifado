import React, { useState, useEffect, createContext, useContext } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Criar o contexto
const AuthContext = createContext();

// Hook personalizado para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Gerenciador de Cookies
const CookieManager = {
  areCookiesEnabled: () => {
    try {
      document.cookie = "testcookie=1";
      const result = document.cookie.indexOf("testcookie=") !== -1;
      document.cookie = "testcookie=1; expires=Thu, 01-Jan-1970 00:00:01 GMT";
      return result;
    } catch (e) {
      return false;
    }
  },

  setCookie: (name, value, days = 7) => {
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
      return true;
    } catch (e) {
      console.error('Erro ao definir cookie:', e);
      return false;
    }
  },

  getCookie: (name) => {
    try {
      const nameEQ = name + "=";
      const ca = document.cookie.split(';');
      for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    } catch (e) {
      console.error('Erro ao ler cookie:', e);
      return null;
    }
  },

  deleteCookie: (name) => {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
};

// Provider do contexto
export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseStatus, setFirebaseStatus] = useState('connecting');
  const [cookiesEnabled, setCookiesEnabled] = useState(true);

  // Nomes dos cookies
  const COOKIE_NAMES = {
    USUARIO: 'almoxarifado_usuario',
    LEMBRAR: 'almoxarifado_lembrar',
    EXPIRACAO: 'almoxarifado_expira'
  };

  // Inicialização do sistema com Firebase
  useEffect(() => {
    const initFirebaseSystem = async () => {
      try {
        setFirebaseStatus('connecting');
        
        // Verificar se cookies estão habilitados
        const cookiesOK = CookieManager.areCookiesEnabled();
        setCookiesEnabled(cookiesOK);
        console.log('Cookies habilitados:', cookiesOK);
        
        // Verificar se existe usuário salvo nos cookies
        const usuarioSalvo = CookieManager.getCookie(COOKIE_NAMES.USUARIO);
        if (usuarioSalvo) {
          setUsuario(JSON.parse(usuarioSalvo));
        }
        
        // Carregar usuários do Firebase
        const unsubscribe = onSnapshot(collection(db, 'usuarios'), (snapshot) => {
          const usuariosData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setUsuarios(usuariosData);
        });
        
        setFirebaseStatus('connected');
        setIsLoading(false);

        return () => unsubscribe();
      } catch (error) {
        console.error('Erro ao conectar com Firebase:', error);
        setFirebaseStatus('error');
        setIsLoading(false);
      }
    };

    initFirebaseSystem();
  }, []);

  // Função de login
  const login = async (username, password, rememberMe = false) => {
    const user = usuarios.find(u => 
      u.email === username && u.senha === password && u.ativo
    );

    if (user) {
      setUsuario(user);
      
      if (rememberMe && cookiesEnabled) {
        CookieManager.setCookie(COOKIE_NAMES.USUARIO, JSON.stringify(user));
        CookieManager.setCookie(COOKIE_NAMES.LEMBRAR, 'true');
      }
      
      return { success: true, user };
    }
    
    return { success: false, error: 'Credenciais inválidas' };
  };

  // Função de logout
  const logout = () => {
    setUsuario(null);
    if (cookiesEnabled) {
      CookieManager.deleteCookie(COOKIE_NAMES.USUARIO);
      CookieManager.deleteCookie(COOKIE_NAMES.LEMBRAR);
    }
  };

  const value = {
    usuario,
    usuarios,
    isLoading,
    firebaseStatus,
    cookiesEnabled,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
