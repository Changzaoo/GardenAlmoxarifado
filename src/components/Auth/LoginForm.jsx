import React from 'react';
import { Shield, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../ThemeProvider';

const LoginForm = ({ 
  loginData, 
  setLoginData, 
  showPassword, 
  setShowPassword, 
  handleLogin, 
  loginError 
}) => {
  const { theme } = useTheme();
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-green-50 to-blue-50'
    }`}>
      <div className={`rounded-lg shadow-xl p-8 w-full max-w-md ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="text-center mb-6">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            theme === 'dark' ? 'bg-green-900' : 'bg-green-100'
          }`}>
            <Shield className={`w-8 h-8 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
          </div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Almoxarifado do Jardim
          </h1>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Sistema de Controle Seguro</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Usuário
            </label>
            <div className="relative">
              <User className={`w-4 h-4 absolute left-3 top-3 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="text"
                value={loginData.username}
                onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className={`w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder="Digite seu usuário"
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Senha
            </label>
            <div className="relative">
              <Lock className={`w-4 h-4 absolute left-3 top-3 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className={`w-full pl-10 pr-12 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder="Digite sua senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-3 ${
                  theme === 'dark' 
                    ? 'text-gray-500 hover:text-gray-400'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="lembrar"
              checked={loginData.lembrar || false}
              onChange={e => setLoginData({ ...loginData, lembrar: e.target.checked })}
              className={`rounded ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-white border-gray-300'
              }`}
            />
            <label 
              htmlFor="lembrar" 
              className={`text-sm cursor-pointer ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Manter-se conectado
            </label>
          </div>

          {loginError && (
            <div className={`px-4 py-3 rounded ${
              theme === 'dark'
                ? 'bg-red-900/50 border border-red-700 text-red-200'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}>
              {loginError}
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Entrar no Sistema
          </button>
        </div>

        {/* Footer or legal info only, no test users, cookies, or login tips */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Sistema protegido por autenticação</p>
          <p className="mt-1">© 2024 Almoxarifado do Jardim</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;