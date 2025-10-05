// 👤 Componente de Criação de Usuário
// Permite criar novos usuários usando código de redefinição gerado pelo admin

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Shield,
  Camera,
  Upload,
  X,
  Check
} from 'lucide-react';
import { criarUsuarioComCodigo } from '../../services/passwordReset';
import { db } from '../../config/firebaseDual';
import { dbWorkflowBR1 } from '../../config/firebaseWorkflowBR1'; // Novo banco
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebaseWorkflowBR1';

const UserCreationForm = ({ onVoltar, onSucesso }) => {
  const [etapaAtual, setEtapaAtual] = useState(1); // 1 a 6
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    codigo: '',
    fotoPerfil: null,
    fotoPerfilURL: ''
  });

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [uploadandoFoto, setUploadandoFoto] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Calcular força da senha
  const calcularForcaSenha = (senha) => {
    let forca = 0;
    if (senha.length >= 8) forca++;
    if (senha.length >= 12) forca++;
    if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) forca++;
    if (/[0-9]/.test(senha)) forca++;
    if (/[^a-zA-Z0-9]/.test(senha)) forca++;
    return forca;
  };

  const forcaSenha = calcularForcaSenha(formData.senha);

  // Validar formulário
  const validarFormulario = () => {
    if (!formData.nomeCompleto.trim()) {
      setErro('Por favor, informe seu nome completo');
      return false;
    }

    if (!formData.email.trim()) {
      setErro('Por favor, informe seu email');
      return false;
    }

    if (!formData.senha) {
      setErro('Por favor, defina uma senha');
      return false;
    }

    if (formData.senha.length < 8) {
      setErro('A senha deve ter no mínimo 8 caracteres');
      return false;
    }

    if (formData.senha !== formData.confirmarSenha) {
      setErro('As senhas não correspondem');
      return false;
    }

    if (!formData.codigo.trim()) {
      setErro('Por favor, informe o código de registro fornecido pelo administrador');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (!validarFormulario()) {
      return;
    }

    setCarregando(true);

    try {
      // 1. Validar código e obter dados
      const resultado = await criarUsuarioComCodigo(
        formData.nomeCompleto,
        formData.email,
        formData.senha,
        formData.codigo
      );

      if (!resultado.success) {
        setErro(resultado.error);
        setCarregando(false);
        return;
      }

      // 2. Verificar se já existe um usuário com este email no novo banco
      const usuariosRefBR1 = collection(dbWorkflowBR1, 'usuarios');
      const qBR1 = query(usuariosRefBR1, where('email', '==', formData.email));
      const querySnapshotBR1 = await getDocs(qBR1);

      if (!querySnapshotBR1.empty) {
        setErro('Já existe um usuário cadastrado com este email');
        setCarregando(false);
        return;
      }

      // 3. Criar usuário no Firebase WorkflowBR1 (banco principal)
      const novoUsuario = {
        nome: resultado.dadosUsuario.nome,
        email: resultado.dadosUsuario.email,
        senha: resultado.dadosUsuario.senha,
        nivel: resultado.dadosUsuario.nivel, // Nível definido no código (0-6)
        ativo: true,
        criadoEm: new Date().toISOString(),
        criadoPorCodigo: formData.codigo,
        bancoDeDados: 'workflowbr1' // Identificador do banco
      };

      // Adicionar empresa e setor apenas para níveis 1, 2 e 3
      const nivelNumerico = parseInt(resultado.dadosUsuario.nivel);
      if (nivelNumerico >= 1 && nivelNumerico <= 3) {
        novoUsuario.empresaId = resultado.dadosUsuario.empresaId;
        novoUsuario.setorId = resultado.dadosUsuario.setorId;
      }

      // Salvar no banco workflowbr1
      await addDoc(usuariosRefBR1, novoUsuario);

      console.log('✅ Usuário criado com sucesso no workflowbr1:', {
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        nivel: novoUsuario.nivel,
        banco: 'workflowbr1'
      });

      // 4. Marcar código como usado (fazer update)
      const { updateDoc, doc } = await import('firebase/firestore');
      const { backupDb } = await import('../../config/firebaseDual');
      const codigoRef = doc(backupDb, 'codigosRedefinicao', resultado.codigoId);
      await updateDoc(codigoRef, {
        usado: true,
        usadoEm: new Date().toISOString(),
        usadoPor: formData.email
      });

      // 5. Exibir sucesso
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
      console.error('Erro ao criar usuário:', error);
      setErro('Erro ao criar usuário: ' + error.message);
      setCarregando(false);
    }
  };

  // Tela de sucesso
  if (sucesso) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4"
          >
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Conta Criada com Sucesso! 🎉
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Sua conta foi criada e você já pode fazer login no sistema.
          </p>

          <div className="bg-[#e8f5fe] dark:bg-[#1d9bf0]/20 border border-[#1d9bf0]/30 dark:border-[#1d9bf0]/50 rounded-lg p-4 text-left mb-4">
            <p className="text-sm text-[#1d9bf0] dark:text-[#1d9bf0]">
              <strong>Email:</strong> {formData.email}
            </p>
            <p className="text-sm text-[#1d9bf0] dark:text-[#1d9bf0] mt-1">
              <strong>Nome:</strong> {formData.nomeCompleto}
            </p>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecionando para a tela de login...
          </p>
        </div>
      </motion.div>
    );
  }

  // Formulário de criação
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-[#e8f5fe] dark:bg-[#1d9bf0]/20 rounded-full flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-[#1d9bf0]" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Criar Nova Conta
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Preencha os dados abaixo para criar sua conta
        </p>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome Completo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Nome Completo
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="nomeCompleto"
              value={formData.nomeCompleto}
              onChange={handleChange}
              placeholder="João da Silva"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#1d9bf0] focus:border-transparent"
              disabled={carregando}
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#1d9bf0] focus:border-transparent"
              disabled={carregando}
              required
            />
          </div>
        </div>

        {/* Senha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={mostrarSenha ? 'text' : 'password'}
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              placeholder="Mínimo 8 caracteres"
              className="w-full pl-10 pr-12 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#1d9bf0] focus:border-transparent"
              disabled={carregando}
              required
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Indicador de Força da Senha */}
          {formData.senha && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((nivel) => (
                  <div
                    key={nivel}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      forcaSenha >= nivel
                        ? forcaSenha <= 2
                          ? 'bg-red-500'
                          : forcaSenha <= 3
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Força: {forcaSenha <= 2 ? 'Fraca' : forcaSenha <= 3 ? 'Média' : 'Forte'}
              </p>
            </div>
          )}
        </div>

        {/* Confirmar Senha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Confirmar Senha
          </label>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={mostrarConfirmarSenha ? 'text' : 'password'}
              name="confirmarSenha"
              value={formData.confirmarSenha}
              onChange={handleChange}
              placeholder="Digite a senha novamente"
              className="w-full pl-10 pr-12 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#1d9bf0] focus:border-transparent"
              disabled={carregando}
              required
            />
            <button
              type="button"
              onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {mostrarConfirmarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Indicador de Senhas Correspondentes */}
          {formData.confirmarSenha && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              {formData.senha === formData.confirmarSenha ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">Senhas correspondem</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-red-600 dark:text-red-400">Senhas não correspondem</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Código de Registro */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Código de Registro
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              placeholder="ABC-123-XYZ"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#1d9bf0] focus:border-transparent uppercase"
              disabled={carregando}
              required
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Código fornecido pelo administrador do sistema
          </p>
        </div>

        {/* Mensagem de Erro */}
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
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onVoltar}
            disabled={carregando}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          
          <button
            type="submit"
            disabled={carregando}
            className="flex-1 px-4 py-2 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {carregando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Criando...
              </>
            ) : (
              <>
                <User className="w-4 h-4" />
                Criar Conta
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default UserCreationForm;
