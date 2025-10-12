/**
 * Componente de Recuperação de Senha
 * 
 * Fluxo:
 * 1. Usuário informa nome de usuário
 * 2. Sistema gera código de 6 dígitos
 * 3. Código é salvo no Firebase com expiração de 30 minutos
 * 4. Código é exibido na tela (simulação de envio)
 * 5. Usuário informa código + nova senha
 * 6. Sistema valida e atualiza senha
 */

import React, { useState } from 'react';
import { Mail, Key, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { backupDb } from '../../config/firebaseDual';
import { 
  generateRecoveryCode, 
  saveRecoveryCode, 
  validateRecoveryCode, 
  resetPasswordWithCode
} from '../../services/passwordService';
import { validatePasswordStrength } from '../../services/authService';

const RecuperarSenha = ({ onVoltar }) => {
  const [etapa, setEtapa] = useState('usuario'); // 'usuario' | 'codigo' | 'sucesso'
  const [usuario, setUsuario] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [codigoGerado, setCodigoGerado] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  // Validar nome de usuário e gerar código
  const handleEnviarCodigo = async () => {
    setErro('');

    // Validar nome de usuário
    if (!usuario) {
      setErro('Por favor, informe seu nome de usuário');
      return;
    }

    if (usuario.trim().length < 3) {
      setErro('Nome de usuário deve ter pelo menos 3 caracteres');
      return;
    }

    setLoading(true);

    try {
      // Buscar usuário por nome de usuário
      const usuariosRef = collection(backupDb, 'usuarios');
      const q = query(usuariosRef, where('usuario', '==', usuario.toLowerCase().trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setErro('Nome de usuário não encontrado');
        setLoading(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const uid = userDoc.id;

      // Verificar se usuário está ativo
      if (!userData.ativo) {
        setErro('Usuário inativo. Entre em contato com o administrador.');
        setLoading(false);
        return;
      }

      // Gerar código de recuperação
      const codigoRecuperacao = generateRecoveryCode();
      await saveRecoveryCode(uid, codigoRecuperacao);

      setCodigoGerado(codigoRecuperacao);
      setUserId(uid);
      setEtapa('codigo');
    } catch (error) {
      console.error('Erro ao enviar código:', error);
      setErro('Erro ao processar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Validar código e resetar senha
  const handleResetarSenha = async () => {
    setErro('');

    // Validações
    if (!codigo) {
      setErro('Por favor, informe o código');
      return;
    }

    if (!novaSenha) {
      setErro('Por favor, informe a nova senha');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem');
      return;
    }

    // Validar força da senha
    const validacao = validatePasswordStrength(novaSenha);
    if (!validacao.valid) {
      setErro(validacao.message);
      return;
    }

    setLoading(true);

    try {
      // Buscar dados do usuário para validar código
      const usuariosRef = collection(backupDb, 'usuarios');
      const q = query(usuariosRef, where('usuario', '==', usuario.toLowerCase().trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setErro('Usuário não encontrado');
        setLoading(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Validar código
      const codigoValido = validateRecoveryCode(userData, codigo);

      if (!codigoValido) {
        setErro('Código inválido, expirado ou já utilizado');
        setLoading(false);
        return;
      }

      // Resetar senha
      await resetPasswordWithCode(userId, novaSenha);

      setEtapa('sucesso');
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      setErro('Erro ao resetar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
        
        {/* Etapa 1: Nome de Usuário */}
        {etapa === 'usuario' && (
          <>
            <div className="flex items-center mb-6">
              <button
                onClick={onVoltar}
                className="mr-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              >
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Recuperar Senha
              </h2>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Informe seu nome de usuário para receber um código de recuperação.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome de Usuário
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Digite seu nome de usuário"
                    disabled={loading}
                  />
                </div>
              </div>

              {erro && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle size={16} />
                  {erro}
                </div>
              )}

              <button
                onClick={handleEnviarCodigo}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Processando...' : 'Enviar Código'}
              </button>
            </div>
          </>
        )}

        {/* Etapa 2: Código e Nova Senha */}
        {etapa === 'codigo' && (
          <>
            <div className="flex items-center mb-6">
              <button
                onClick={() => setEtapa('usuario')}
                className="mr-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              >
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Resetar Senha
              </h2>
            </div>

            {/* Código gerado (simulação de email) */}
            <div className="bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg p-4 mb-6">
              <p className="text-green-800 dark:text-green-200 font-semibold mb-2">
                🔐 Código de Recuperação
              </p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100 text-center tracking-wider">
                {codigoGerado}
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-2 text-center">
                Válido por 30 minutos
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Código de Recuperação
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center text-lg tracking-wider"
                    placeholder="000000"
                    maxLength={6}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nova Senha
                </label>
                <input
                  type={senhaVisivel ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Mínimo 6 caracteres"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmar Senha
                </label>
                <input
                  type={senhaVisivel ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Repita a senha"
                  disabled={loading}
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={senhaVisivel}
                  onChange={(e) => setSenhaVisivel(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrar senhas
                </span>
              </label>

              {erro && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle size={16} />
                  {erro}
                </div>
              )}

              <button
                onClick={handleResetarSenha}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetando...' : 'Resetar Senha'}
              </button>
            </div>
          </>
        )}

        {/* Etapa 3: Sucesso */}
        {etapa === 'sucesso' && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <CheckCircle size={64} className="text-green-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Senha Resetada!
            </h2>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Sua senha foi atualizada com sucesso. Você já pode fazer login com a nova senha.
            </p>
            
            <button
              onClick={onVoltar}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Voltar para Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecuperarSenha;
