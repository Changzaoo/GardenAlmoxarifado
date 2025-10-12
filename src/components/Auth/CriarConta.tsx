/**
 * Componente de Criação de Conta
 * 
 * Permite que novos usuários se registrem no sistema.
 * Utiliza passwordService para criar senha segura (authKey + senhaHash + senhaSalt).
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { User, Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff, QrCode } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { backupDb } from '../../config/firebaseDual';
import { createUserWithPassword } from '../../services/passwordService';
import { validatePasswordStrength } from '../../services/authService';

const CriarConta = ({ onVoltar, onSucesso }) => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    nome: '',
    nomePublico: '',
    senha: '',
    confirmarSenha: '',
    empresaId: '',
    empresaNome: '',
    setorId: '',
    setorNome: ''
  });
  
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [qrCodeToken, setQrCodeToken] = useState(null);
  const [qrCodeInfo, setQrCodeInfo] = useState(null);

  // Verificar se há token de QR Code na URL ou no state
  useEffect(() => {
    // Prioridade 1: Dados vindos do state (via QRCodeScanner)
    if (location.state?.qrToken) {
      setQrCodeToken(location.state.qrToken);
      
      // Se os dados já estão no state, usar diretamente
      if (location.state.empresaId) {
        setFormData(prev => ({
          ...prev,
          empresaId: location.state.empresaId || '',
          empresaNome: location.state.empresaNome || '',
          setorId: location.state.setorId || '',
          setorNome: location.state.setorNome || ''
        }));
        setQrCodeInfo({
          id: location.state.qrId,
          token: location.state.qrToken,
          tipo: 'criacao_conta'
        });
        return;
      }
      
      validarQRCode(location.state.qrToken);
      return;
    }
    
    // Prioridade 2: Token na URL (backup)
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    
    if (token) {
      setQrCodeToken(token);
      validarQRCode(token);
    }
  }, [location]);

  // Validar e buscar informações do QR Code
  const validarQRCode = async (token) => {
    try {
      const qrCodesRef = collection(backupDb, 'qr_codes_auth');
      const q = query(qrCodesRef, where('token', '==', token));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setErro('QR Code inválido ou expirado');
        console.error('❌ QR Code não encontrado');
        return;
      }

      const qrCodeDoc = snapshot.docs[0];
      const qrCodeData = qrCodeDoc.data();

      // Verificar se já foi usado
      if (qrCodeData.usado) {
        setErro('Este QR Code já foi utilizado');
        console.error('❌ QR Code já usado');
        return;
      }

      // Verificar expiração (24 horas)
      const agora = new Date();
      const criacao = qrCodeData.criadoEm?.toDate();
      const diferencaHoras = (agora - criacao) / (1000 * 60 * 60);

      if (diferencaHoras > 24) {
        setErro('QR Code expirado');
        console.error('❌ QR Code expirado');
        return;
      }
      // Preencher formulário com dados do QR Code
      if (qrCodeData.empresaId && qrCodeData.empresaNome) {
        setFormData(prev => ({
          ...prev,
          empresaId: qrCodeData.empresaId,
          empresaNome: qrCodeData.empresaNome,
          setorId: qrCodeData.setorId || '',
          setorNome: qrCodeData.setorNome || ''
        }));
      }

      setQrCodeInfo({
        id: qrCodeDoc.id,
        ...qrCodeData
      });

    } catch (error) {
      console.error('❌ Erro ao validar QR Code:', error);
      setErro('Erro ao validar QR Code');
    }
  };

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

    // Validar nome público
    if (!formData.nomePublico || formData.nomePublico.trim().length < 3) {
      setErro('Nome público deve ter no mínimo 3 caracteres');
      return false;
    }

    // Validar formato do nome público (sem espaços, apenas letras, números e _)
    const nomePublicoRegex = /^[a-zA-Z0-9_]+$/;
    if (!nomePublicoRegex.test(formData.nomePublico)) {
      setErro('Nome público deve conter apenas letras, números e underline (_)');
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
      // Verificar se nome público já existe
      const usuariosRef = collection(backupDb, 'usuarios');
      const q = query(usuariosRef, where('nomePublico', '==', formData.nomePublico.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setErro('Este nome público já está em uso. Escolha outro.');
        setLoading(false);
        return;
      }

      // Criar usuário com passwordService
      const userData = {
        nome: formData.nome.trim(),
        nomePublico: formData.nomePublico.trim().toLowerCase(),
        email: '', // Email não é mais obrigatório
        nivel: 1, // Funcionário padrão
        ativo: false, // Aguarda aprovação do admin
        empresaId: formData.empresaId || '', // Preenche se veio do QR Code
        setorId: formData.setorId || '', // Preenche se veio do QR Code
        cargo: ''
      };

      const userId = await createUserWithPassword(userData, formData.senha);
      // Se foi criado através de QR Code, marcar como usado
      if (qrCodeInfo && qrCodeInfo.id) {
        try {
          const qrCodeDocRef = doc(backupDb, 'qr_codes_auth', qrCodeInfo.id);
          await updateDoc(qrCodeDocRef, {
            usado: true,
            usadoEm: new Date(),
            usadoPor: userId
          });
        } catch (error) {
          console.error('⚠️ Erro ao marcar QR Code como usado:', error);
          // Não bloqueia o fluxo de criação de conta
        }
      }

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
            Seu nome público: <strong>@{formData.nomePublico}</strong>
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

        {/* Indicador de QR Code */}
        {qrCodeInfo && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center text-green-700 dark:text-green-400">
              <QrCode size={20} className="mr-2" />
              <span className="text-sm font-medium">
                QR Code validado com sucesso
              </span>
            </div>
            {(formData.empresaNome || formData.setorNome) && (
              <div className="mt-2 text-xs text-green-600 dark:text-green-500">
                {formData.empresaNome && <div>Empresa: {formData.empresaNome}</div>}
                {formData.setorNome && <div>Setor: {formData.setorNome}</div>}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleCriarConta} className="space-y-4">
          {/* Nome Completo */}
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
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Seu nome real (visível apenas para administradores)
            </p>
          </div>

          {/* Nome Público (Username) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome Público (Username)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                name="nomePublico"
                value={formData.nomePublico}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="joao_silva"
                disabled={loading}
                required
                maxLength={20}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Apenas letras, números e underline (_). Este será seu nome de exibição.
            </p>
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
