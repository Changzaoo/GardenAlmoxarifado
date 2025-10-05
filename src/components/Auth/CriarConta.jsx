/**
 * Componente de Criação de Conta
 * 
 * Permite que novos usuários se registrem no sistema.
 * Utiliza passwordService para criar senha segura (authKey + senhaHash + senhaSalt).
 */

import React, { useState } from 'react';
import { User, Mail, Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { backupDb } from '../../config/firebaseDual';
import { createUserWithPassword } from '../../services/passwordService';
import { isValidEmail, validatePasswordStrength } from '../../services/authService';

const CriarConta = ({ onVoltar, onSucesso }) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  });
  
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErro(''); // Limpar erro ao digitar
  };

  const validarFormulario = () => {
    // Validar nome
    if (!formData.nome || formData.nome.trim().length < 3) {
      setErro('Nome deve ter no mínimo 3 caracteres');
      return false;
    }

    // Validar email
    if (!formData.email) {
      setErro('Por favor, informe seu email');
      return false;
    }

    if (!isValidEmail(formData.email)) {
      setErro('Email inválido');
      return false;
    }

    // Validar senha
    if (!formData.senha) {
      setErro('Por favor, informe uma senha');
      return false;
    }

    const validacaoSenha = validatePasswordStrength(formData.senha);
    if (!validacaoSenha.valid) {
      setErro(validacaoSenha.message);
      return false;
    }

    // Validar confirmação
    if (formData.senha !== formData.confirmarSenha) {
      setErro('As senhas não coincidem');
      return false;
    }

    return true;
  };

  const handleCriarConta = async (e) => {
    e.preventDefault();
    setErro('');

    // Validar formulário
    if (!validarFormulario()) {
      return;
    }

    setLoading(true);

    try {
      // Verificar se email já existe
      const usuariosRef = collection(backupDb, 'usuarios');
      const q = query(usuariosRef, where('email', '==', formData.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setErro('Este email já está cadastrado');
        setLoading(false);
        return;
      }

      // Criar usuário com passwordService
      const userData = {
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        nivel: 1, // Funcionário padrão
        ativo: false, // Aguarda aprovação do admin
        empresaId: '',
        setorId: '',
        cargo: ''
      };

      const userId = await createUserWithPassword(userData, formData.senha);

      console.log('✅ Conta criada com sucesso:', userId);
      setSucesso(true);

      // Redirecionar após 3 segundos
      setTimeout(() => {
        if (onSucesso) {
          onSucesso();
        } else {
          onVoltar();
        }
      }, 3000);

    } catch (error) {
      console.error('Erro ao criar conta:', error);
      setErro('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Força da senha
  const forcaSenha = formData.senha ? validatePasswordStrength(formData.senha) : null;

  if (sucesso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle size={64} className="text-green-500" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Conta Criada!
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Sua conta foi criada com sucesso e está aguardando aprovação do administrador.
          </p>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Você receberá um email quando sua conta for ativada.
          </p>
          
          <button
            onClick={onVoltar}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Voltar para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
        
        <div className="flex items-center mb-6">
          <button
            onClick={onVoltar}
            className="mr-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Criar Conta
          </h2>
        </div>

        <form onSubmit={handleCriarConta} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome Completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="João Silva"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="joao@email.com"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={senhaVisivel ? 'text' : 'password'}
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Mínimo 6 caracteres"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setSenhaVisivel(!senhaVisivel)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {senhaVisivel ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {/* Indicador de força da senha */}
            {forcaSenha && forcaSenha.valid && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded ${
                        level <= forcaSenha.strength
                          ? forcaSenha.strength <= 2
                            ? 'bg-red-500'
                            : forcaSenha.strength <= 3
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${
                  forcaSenha.strength <= 2
                    ? 'text-red-600 dark:text-red-400'
                    : forcaSenha.strength <= 3
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {forcaSenha.message}
                </p>
              </div>
            )}
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirmar Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={senhaVisivel ? 'text' : 'password'}
                name="confirmarSenha"
                value={formData.confirmarSenha}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Repita a senha"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Erro */}
          {erro && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle size={16} />
              {erro}
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Criando Conta...' : 'Criar Conta'}
          </button>

          {/* Aviso */}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
            Ao criar uma conta, você concorda com nossos Termos de Uso e Política de Privacidade.
            Sua conta será ativada após aprovação do administrador.
          </p>
        </form>
      </div>
    </div>
  );
};

export default CriarConta;
