import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoginForm from './LoginForm';

const LoginFormUI = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    lembrar: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = async () => {
    try {
      setLoginError('');
      const { success, error, user } = await login(
        loginData.email,
        loginData.password,
        loginData.lembrar
      );

      if (success) {
        // Redirect to home page after successful login
        navigate('/');
      } else {
        setLoginError(error || 'Erro ao fazer login. Verifique suas credenciais.');
      }
    } catch (error) {
      console.error('Erro durante o login:', error);
      setLoginError('Ocorreu um erro durante o login. Tente novamente.');
    }
  };

  return (
    <LoginForm
      loginData={loginData}
      setLoginData={setLoginData}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      handleLogin={handleLogin}
      loginError={loginError}
    />
  );
};

export default LoginFormUI;
