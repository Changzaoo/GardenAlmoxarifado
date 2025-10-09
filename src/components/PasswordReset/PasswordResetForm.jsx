// 🔐 Componente de Redefinição de Senha
// Permite que usuários redefinam suas senhas usando código fornecido pelo admin

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Key, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ArrowLeft,
  Shield,
  QrCode
} from 'lucide-react';
import { redefinirSenhaComCodigo } from '../../services/passwordReset';
import { marcarQRCodeComoUsado } from '../../services/qrCodeAuth';

const PasswordResetForm = ({ onVoltar, onSucesso }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const qrData = location.state || {};
  
  const [formData, setFormData] = useState({
    email: qrData.usuarioEmail || '',
    novaSenha: '',
    confirmarSenha: '',
    codigo: ''
  });
  
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [forcaSenha, setForcaSenha] = useState({ nivel: 0, texto: '', cor: '' });
  const [viaQRCode, setViaQRCode] = useState(false);
  
  // Detectar se veio do QR Code
  useEffect(() => {
    if (qrData.qrToken && qrData.qrId) {
      setViaQRCode(true);
      // Pré-preencher email se disponível
      if (qrData.usuarioEmail) {
        setFormData(prev => ({ ...prev, email: qrData.usuarioEmail }));
      }
    }
  }, [qrData]);

  // Calcular força da senha
  const calcularForcaSenha = (senha) => {
    if (!senha) {
      return { nivel: 0, texto: '', cor: '' };
    }

    let forca = 0;
    const requisitos = {
      tamanho: senha.length >= 8,
      maiuscula: /[A-Z]/.test(senha),
      minuscula: /[a-z]/.test(senha),
      numero: /[0-9]/.test(senha),
      especial: /[^A-Za-z0-9]/.test(senha)
    };

    forca += requisitos.tamanho ? 20 : 0;
    forca += requisitos.maiuscula ? 20 : 0;
    forca += requisitos.minuscula ? 20 : 0;
    forca += requisitos.numero ? 20 : 0;
    forca += requisitos.especial ? 20 : 0;

    if (senha.length > 12) forca += 10;
    if (senha.length > 16) forca += 10;

    let nivel, texto, cor;
    if (forca < 40) {
      nivel = 1;
      texto = 'Muito Fraca';
      cor = 'bg-red-500';
    } else if (forca < 60) {
      nivel = 2;
      texto = 'Fraca';
      cor = 'bg-orange-500';
    } else if (forca < 80) {
      nivel = 3;
      texto = 'Média';
      cor = 'bg-yellow-500';
    } else if (forca < 100) {
      nivel = 4;
      texto = 'Forte';
      cor = 'bg-green-500';
    } else {
      nivel = 5;
      texto = 'Muito Forte';
      cor = 'bg-emerald-500';
    }

    return { nivel, texto, cor, requisitos };
  };

  const handleChange = (campo, valor) => {
    setFormData({ ...formData, [campo]: valor });
    setErro('');

    if (campo === 'novaSenha') {
      setForcaSenha(calcularForcaSenha(valor));
    }
  };

  const validarFormulario = () => {
    if (!formData.email.trim()) {
      setErro('Por favor, insira seu nome de usuário ou email');
      return false;
    }

    // Se não vier do QR Code, exigir código
    if (!viaQRCode && !formData.codigo.trim()) {
      setErro('Por favor, insira o código de redefinição');
      return false;
    }

    if (!formData.novaSenha) {
      setErro('Por favor, insira a nova senha');
      return false;
    }

    if (formData.novaSenha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres');
      return false;
    }

    if (formData.novaSenha !== formData.confirmarSenha) {
      setErro('As senhas não coincidem');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setCarregando(true);
    setErro('');

    try {
      let resultado;
      
      if (viaQRCode) {
        // Marcar QR Code como usado
        await marcarQRCodeComoUsado(qrData.qrId, formData.email);
        
        // Usar token do QR Code como código
        resultado = await redefinirSenhaComCodigo(
          formData.email,
          formData.novaSenha,
          qrData.qrToken
        );
      } else {
        // Fluxo tradicional com código
        resultado = await redefinirSenhaComCodigo(
          formData.email,
          formData.novaSenha,
          formData.codigo
        );
      }

      if (resultado.success) {
        setSucesso(true);
        setTimeout(() => {
          if (onSucesso) {
            onSucesso();
          } else {
            navigate('/');
          }
        }, 3000);
      } else {
        setErro(resultado.message || 'Erro ao redefinir senha');
      }
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      setErro('Erro ao processar solicitação. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  if (sucesso) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="mx-auto w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
        </motion.div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Senha Redefinida!
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Sua senha foi alterada com sucesso.
          <br />
          Você já pode fazer login com a nova senha.
        </p>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onVoltar}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          Voltar ao Login
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-md w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mx-auto w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4"
        >
          {viaQRCode ? (
            <QrCode className="w-12 h-12 text-purple-600 dark:text-purple-400" />
          ) : (
            <Shield className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          )}
        </motion.div>
        
        {viaQRCode && (
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <QrCode className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
              Autenticação via QR Code
            </span>
          </div>
        )}
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Redefinir Senha
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400">
          {viaQRCode 
            ? `Olá, ${qrData.usuarioNome || 'usuário'}! Defina sua nova senha` 
            : 'Insira o código fornecido pelo administrador'}
        </p>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email/Usuário */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Nome de Usuário ou Email
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Digite seu usuário"
              disabled={carregando || viaQRCode}
              autoFocus={!viaQRCode}
              readOnly={viaQRCode}
            />
          </div>
          {viaQRCode && (
            <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
              ✓ Email pré-preenchido via QR Code
            </p>
          )}
        </div>

        {/* Código de Redefinição - Oculto quando vier do QR Code */}
        {!viaQRCode && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Código de Redefinição
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => handleChange('codigo', e.target.value.toUpperCase())}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono tracking-wider"
              placeholder="ABC-123-XYZ"
              disabled={carregando}
              maxLength={11}
              autoFocus
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Código fornecido pelo administrador do sistema
            </p>
          </div>
        )}

        {/* Nova Senha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Nova Senha
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
            <input
              type={mostrarSenha ? 'text' : 'password'}
              value={formData.novaSenha}
              onChange={(e) => handleChange('novaSenha', e.target.value)}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Digite a nova senha"
              disabled={carregando}
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              className="absolute right-3 top-3.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={carregando}
            >
              {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Indicador de Força da Senha */}
          {formData.novaSenha && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">Força da senha:</span>
                <span className={`text-xs font-medium ${forcaSenha.cor.replace('bg-', 'text-')}`}>
                  {forcaSenha.texto}
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(forcaSenha.nivel / 5) * 100}%` }}
                  className={`h-full ${forcaSenha.cor}`}
                />
              </div>
              
              {/* Requisitos da Senha */}
              {forcaSenha.requisitos && (
                <div className="mt-2 text-xs space-y-1">
                  <div className={`flex items-center gap-1 ${forcaSenha.requisitos.tamanho ? 'text-green-600' : 'text-gray-400'}`}>
                    {forcaSenha.requisitos.tamanho ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    Mínimo 8 caracteres
                  </div>
                  <div className={`flex items-center gap-1 ${forcaSenha.requisitos.maiuscula ? 'text-green-600' : 'text-gray-400'}`}>
                    {forcaSenha.requisitos.maiuscula ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    Letra maiúscula
                  </div>
                  <div className={`flex items-center gap-1 ${forcaSenha.requisitos.numero ? 'text-green-600' : 'text-gray-400'}`}>
                    {forcaSenha.requisitos.numero ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    Número
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirmar Senha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Confirmar Nova Senha
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
            <input
              type={mostrarConfirmarSenha ? 'text' : 'password'}
              value={formData.confirmarSenha}
              onChange={(e) => handleChange('confirmarSenha', e.target.value)}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Digite a senha novamente"
              disabled={carregando}
            />
            <button
              type="button"
              onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
              className="absolute right-3 top-3.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={carregando}
            >
              {mostrarConfirmarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Indicador de Senhas Correspondentes */}
          {formData.confirmarSenha && (
            <div className="mt-2">
              {formData.novaSenha === formData.confirmarSenha ? (
                <div className="flex items-center gap-1 text-green-600 text-xs">
                  <CheckCircle className="w-3 h-3" />
                  As senhas coincidem
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600 text-xs">
                  <XCircle className="w-3 h-3" />
                  As senhas não coincidem
                </div>
              )}
            </div>
          )}
        </div>

        {/* Erro */}
        <AnimatePresence>
          {erro && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{erro}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onVoltar}
            disabled={carregando}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          
          <button
            type="submit"
            disabled={carregando}
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            {carregando ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processando...
              </div>
            ) : (
              'Redefinir Senha'
            )}
          </button>
        </div>
      </form>

      {/* Informação Adicional */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">Não tem um código?</p>
            <p>Solicite um código de redefinição ao administrador do sistema.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetForm;
