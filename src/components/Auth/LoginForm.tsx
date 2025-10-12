import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import OfflineLogo from '../common/OfflineLogo';
import ModalGerenciarAdmin from './ModalGerenciarAdmin';
import { twitterThemeConfig } from '../../styles/twitterThemeConfig';

const LoginForm = ({ 
  loginData, 
  setLoginData, 
  showPassword, 
  setShowPassword, 
  handleLogin, 
  loginError,
  mostrarBotaoAdmin = true,
  adminExistente = null
}) => {
  const { classes, colors } = twitterThemeConfig;
  const [mostrarModalAdmin, setMostrarModalAdmin] = useState(false);

  const handleBotaoAdmin = () => {
    if (adminExistente) {
      // Admin JÁ existe - Abrir modal
      setMostrarModalAdmin(true);
    } else {
      // Admin NÃO existe - Criar novo
      const senha = prompt('Digite a senha de 4 dígitos para o novo admin:');
      if (senha && senha.length === 4 && /^\d{4}$/.test(senha)) {
        if (window.confirm('Isso irá criar um novo admin. Continuar?')) {
          window.location.href = `/criar-admin-temp?senha=${senha}&modo=criar`;
        }
      } else {
        alert('A senha deve ter exatamente 4 dígitos numéricos!');
      }
    }
  };

  const handleAlterarSenha = (novaSenha) => {
    window.location.href = `/criar-admin-temp?senha=${novaSenha}&adminId=${adminExistente.id}&modo=alterar`;
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${colors.background}`}>
      <div className={`rounded-2xl shadow-xl p-8 w-full max-w-md ${colors.backgroundSecondary} ${colors.border}`}>
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="mx-auto w-24 h-24 flex items-center justify-center mb-4 relative">
            <div className="absolute inset-0 bg-[#1d9bf0] rounded-full opacity-60" style={{ mixBlendMode: 'multiply' }}></div>
            <OfflineLogo src="/logo.png" alt="Logo WorkFlow" className="w-full h-full object-contain relative z-10" />
          </div>
          <h1 className={`text-2xl font-bold ${colors.text}`}>
            WorkFlow
          </h1>
          <p className={colors.textSecondary}>Sistema de Gestão Empresarial</p>
        </div>

        {/* Login Form */}
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <Input
            type="text"
            value={loginData.username}
            onChange={(e) => setLoginData({...loginData, username: e.target.value})}
            placeholder="👤 Digite seu usuário"
          />

          <Input
            type={showPassword ? 'text' : 'password'}
            value={loginData.password}
            onChange={(e) => setLoginData({...loginData, password: e.target.value})}
            placeholder="🔒 Digite sua senha"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`${colors.textSecondary} hover:${colors.text} transition-colors`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            }
          />

          {/* Remember Me Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="lembrar"
              checked={loginData.lembrar || false}
              onChange={e => setLoginData({ ...loginData, lembrar: e.target.checked })}
              className={`rounded ${colors.border} ${colors.backgroundInput} checked:bg-blue-500 checked:border-blue-500 dark:checked:bg-[#1D9BF0] dark:checked:border-[#1D9BF0]`}
            />
            <label 
              htmlFor="lembrar" 
              className={`text-sm cursor-pointer ${colors.textSecondary}`}
            >
              Manter-se conectado
            </label>
          </div>

          {/* Error Message */}
          {loginError && (
            <div className={classes.alert.error}>
              {loginError}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
          >
            Entrar no Sistema
          </Button>
        </form>

        {/* Botão de gerenciamento do admin */}
        {mostrarBotaoAdmin && (
          <button
            onClick={handleBotaoAdmin}
            className="mt-4 w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors font-semibold"
          >
            {adminExistente ? '� Gerenciar Admin Existente' : '🔧 Criar Novo Admin'}
          </button>
        )}

        <div className={`mt-6 text-center text-xs ${colors.textSecondary}`}>
          <p>Sistema protegido por autenticação</p>
          <p className="mt-1">© 2024 WorkFlow</p>
        </div>
      </div>

      {/* Modal de Gerenciamento do Admin */}
      {mostrarModalAdmin && adminExistente && (
        <ModalGerenciarAdmin
          admin={adminExistente}
          onClose={() => setMostrarModalAdmin(false)}
          onAlterarSenha={handleAlterarSenha}
        />
      )}
    </div>
  );
};

export default LoginForm;
