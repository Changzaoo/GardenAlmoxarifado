import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoginForm from './LoginForm';

const LoginFormContainer = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginData, setLoginData] = useState({ username: '', password: '', lembrar: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = async () => {
    try {
      await login(loginData.username, loginData.password, loginData.lembrar);
      navigate('/');
    } catch (error) {
      setLoginError('Usuário ou senha inválidos');
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

export default LoginFormContainer;
