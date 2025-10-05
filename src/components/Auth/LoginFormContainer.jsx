import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoginForm from './LoginForm';
import { dbWorkflowBR1 } from '../../config/firebaseWorkflowBR1';
import { collection, query, where, getDocs } from 'firebase/firestore';

const LoginFormContainer = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginData, setLoginData] = useState({ username: '', password: '', lembrar: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [mostrarBotaoAdmin, setMostrarBotaoAdmin] = useState(true);
  const [adminExistente, setAdminExistente] = useState(null);

  // Verifica se já existe admin no banco
  useEffect(() => {
    const verificarAdmin = async () => {
      try {
        const usuariosRef = collection(dbWorkflowBR1, 'usuarios');
        const q = query(usuariosRef, where('nivel', '==', 0), where('ativo', '==', true));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // Pega o primeiro admin encontrado
          const adminDoc = querySnapshot.docs[0];
          setAdminExistente({ id: adminDoc.id, ...adminDoc.data() });
        } else {
          setAdminExistente(null);
        }
        
        // Sempre mostra o botão (mas com função diferente)
        setMostrarBotaoAdmin(true);
      } catch (error) {
        console.error('Erro ao verificar admin:', error);
        setMostrarBotaoAdmin(true);
      }
    };

    verificarAdmin();
  }, []);

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
      mostrarBotaoAdmin={mostrarBotaoAdmin}
      adminExistente={adminExistente}
    />
  );
};

export default LoginFormContainer;
