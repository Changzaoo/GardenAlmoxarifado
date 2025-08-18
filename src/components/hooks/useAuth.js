import { useState } from 'react';
import { auth } from '../../firebaseConfig';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = () => {
    // Exemplo simples, ajuste conforme sua lógica
    if (loginData.username === 'admin' && loginData.password === 'admin') {
      setIsAuthenticated(true);
      setShowLogin(false);
      setLoginError('');
    } else {
      setLoginError('Credenciais inválidas. Acesso negado.');
      setTimeout(() => setLoginError(''), 3000);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowLogin(true);
    setLoginData({ username: '', password: '' });
  };

  return {
    isAuthenticated,
    showLogin,
    loginData,
    setLoginData,
    showPassword,
    setShowPassword,
    loginError,
    handleLogin,
    handleLogout
  };
};