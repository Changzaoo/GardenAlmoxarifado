import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginData.username,
        loginData.password
      );
      setIsAuthenticated(true);
      setShowLogin(false);
      setLoginError('');
    } catch (error) {
      setLoginError('Credenciais inválidas. Acesso negado.');
      setTimeout(() => setLoginError(''), 3000);
    }
  };

  return {
    isAuthenticated,
    showLogin,
    loginData,
    setLoginData,
    loginError,
    handleLogin,
  };
}