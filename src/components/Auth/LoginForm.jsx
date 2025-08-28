import React from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import { twitterThemeConfig } from '../../styles/twitterThemeConfig';
import logo from '../../assets/logo.png';

const LoginForm = ({ 
  loginData, 
  setLoginData, 
  showPassword, 
  setShowPassword, 
  handleLogin, 
  loginError 
}) => {
  const { classes, colors } = twitterThemeConfig;

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${colors.background}`}>
      <div className={`rounded-2xl shadow-xl p-8 w-full max-w-md ${colors.backgroundSecondary} ${colors.border}`}>
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="mx-auto w-24 h-24 flex items-center justify-center mb-4">
            <img src={logo} alt="Logo WorkFlow" className="w-full h-full object-contain" />
          </div>
          <h1 className={`text-2xl font-bold ${colors.text}`}>
            WorkFlow
          </h1>
          <p className={colors.textSecondary}>Sistema de Controle Seguro</p>
        </div>

        {/* Login Form */}
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <Input
            label="Usuário"
            icon={User}
            type="text"
            value={loginData.username}
            onChange={(e) => setLoginData({...loginData, username: e.target.value})}
            placeholder="Digite seu usuário"
          />

          <Input
            label="Senha"
            icon={Lock}
            type={showPassword ? 'text' : 'password'}
            value={loginData.password}
            onChange={(e) => setLoginData({...loginData, password: e.target.value})}
            placeholder="Digite sua senha"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${colors.textSecondary} hover:${colors.text} transition-colors`}
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
              className={`rounded ${colors.border} ${colors.backgroundInput} checked:bg-[#1DA1F2] checked:border-[#1DA1F2]`}
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

        <div className={`mt-6 text-center text-xs ${colors.textSecondary}`}>
          <p>Sistema protegido por autenticação</p>
          <p className="mt-1">© 2024 WorkFlow</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
