// 👤 Componente de Criação de Usuário - Versão Progressiva
// Formulário com etapas progressivas, upload de foto e cor #1d9bf0

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
  ArrowRight,
  Camera,
  Upload,
  X,
  Check,
  Image as ImageIcon
} from 'lucide-react';
import { criarUsuarioComCodigo } from '../../services/passwordReset';
import { db } from '../../config/firebaseDual';
import { dbWorkflowBR1, storage } from '../../config/firebaseWorkflowBR1';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { encryptPassword } from '../../utils/crypto';

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

  // Definição das etapas
  const etapas = [
    { numero: 1, icone: User, label: 'Nome', campo: 'nomeCompleto' },
    { numero: 2, icone: Mail, label: 'Email', campo: 'email' },
    { numero: 3, icone: Lock, label: 'Senha', campo: 'senha' },
    { numero: 4, icone: Lock, label: 'Confirmar', campo: 'confirmarSenha' },
    { numero: 5, icone: ImageIcon, label: 'Foto', campo: 'fotoPerfil' },
    { numero: 6, icone: Key, label: 'Código', campo: 'codigo' }
  ];

  // Função para verificar se pode avançar
  const podeProsseguir = () => {
    switch(etapaAtual) {
      case 1:
        return formData.nomeCompleto.trim().length > 0;
      case 2:
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      case 3:
        return formData.senha.length >= 8;
      case 4:
        return formData.senha === formData.confirmarSenha && formData.senha.length >= 8;
      case 5:
        return true; // Foto é opcional
      case 6:
        return formData.codigo.trim().length > 0;
      default:
        return false;
    }
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
  const forcaLabels = ['Muito Fraca', 'Fraca', 'Média', 'Forte', 'Muito Forte'];
  const forcaCores = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'];

  // Handler para mudança de campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErro('');
  };

  // Upload de foto
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErro('A foto deve ter no máximo 5MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setErro('Por favor, selecione uma imagem válida');
      return;
    }

    setUploadandoFoto(true);
    setErro('');

    try {
      // Criar preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          fotoPerfil: file,
          fotoPerfilURL: reader.result
        }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao processar foto:', error);
      setErro('Erro ao processar foto. Tente novamente.');
    } finally {
      setUploadandoFoto(false);
    }
  };

  // Remover foto
  const removerFoto = () => {
    setFormData(prev => ({
      ...prev,
      fotoPerfil: null,
      fotoPerfilURL: ''
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Avançar etapa
  const proximaEtapa = () => {
    if (podeProsseguir() && etapaAtual < 6) {
      setEtapaAtual(etapaAtual + 1);
      setErro('');
    }
  };

  // Voltar etapa
  const etapaAnterior = () => {
    if (etapaAtual > 1) {
      setEtapaAtual(etapaAtual - 1);
      setErro('');
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && podeProsseguir()) {
      if (etapaAtual < 6) {
        proximaEtapa();
      } else {
        handleSubmit(e);
      }
    }
  };

  // Submit do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (!podeProsseguir()) {
      setErro('Por favor, preencha todos os campos corretamente');
      return;
    }

    setCarregando(true);

    try {
      // 1. Verificar código e obter dados
      const resultado = await criarUsuarioComCodigo(
        formData.codigo,
        formData.email,
        formData.senha,
        formData.nomeCompleto
      );

      if (!resultado.sucesso) {
        setErro(resultado.mensagem || 'Erro ao validar código');
        setCarregando(false);
        return;
      }

      // 2. Verificar se email já existe no workflowbr1
      const usuariosRefBR1 = collection(dbWorkflowBR1, 'usuarios');
      const qBR1 = query(usuariosRefBR1, where('email', '==', formData.email));
      const querySnapshotBR1 = await getDocs(qBR1);

      if (!querySnapshotBR1.empty) {
        setErro('Já existe um usuário cadastrado com este email');
        setCarregando(false);
        return;
      }

      // 3. Upload da foto (se houver)
      let fotoURL = '';
      if (formData.fotoPerfil) {
        try {
          const timestamp = Date.now();
          const fileName = `perfil_${timestamp}_${formData.fotoPerfil.name}`;
          const storageRef = ref(storage, `usuarios/fotos_perfil/${fileName}`);
          
          await uploadBytes(storageRef, formData.fotoPerfil);
          fotoURL = await getDownloadURL(storageRef);
          
          console.log('✅ Foto de perfil enviada:', fotoURL);
        } catch (error) {
          console.warn('⚠️ Erro ao fazer upload da foto, continuando sem ela:', error);
          // Não bloqueia a criação do usuário se falhar o upload
        }
      }

      // 4. Criar usuário no workflowbr1
      const { nome, email, senha } = resultado.dadosUsuario;
      const { hash, salt, version, algorithm } = encryptPassword(senha);
      const novoUsuario = {
        nome: nome || formData.nomeCompleto,
        email,
        senha: hash,
        salt,
        version,
        algorithm,
        nivel: parseInt(resultado.dadosUsuario.nivel),
        ativo: true,
        criadoEm: new Date().toISOString(),
        criadoPorCodigo: formData.codigo,
        bancoDeDados: 'workflowbr1',
        fotoPerfil: fotoURL || ''
      };

      // Adicionar empresa e setor para níveis 1, 2 e 3
      const nivelNumerico = parseInt(resultado.dadosUsuario.nivel);
      if (nivelNumerico >= 1 && nivelNumerico <= 3) {
        novoUsuario.empresaId = resultado.dadosUsuario.empresaId;
        novoUsuario.setorId = resultado.dadosUsuario.setorId;
      }

      await addDoc(usuariosRefBR1, novoUsuario);

      console.log('✅ Usuário criado com sucesso no workflowbr1:', {
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        nivel: novoUsuario.nivel,
        banco: 'workflowbr1',
        temFoto: !!fotoURL
      });

      // 5. Sucesso
      setSucesso(true);

      // Redirecionar após 3 segundos
      setTimeout(() => {
        if (onSucesso) {
          onSucesso();
        }
      }, 3000);

    } catch (error) {
      console.error('❌ Erro ao criar conta:', error);
      setErro(error.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  // Tela de sucesso
  if (sucesso) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
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

          {formData.fotoPerfilURL && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-4"
            >
              <img
                src={formData.fotoPerfilURL}
                alt="Foto de perfil"
                className="w-24 h-24 rounded-full mx-auto border-4 border-[#1d9bf0] object-cover"
              />
            </motion.div>
          )}

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

  // Renderizar etapa atual
  const renderEtapa = () => {
    const EtapaIcone = etapas[etapaAtual - 1].icone;

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={etapaAtual}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Ícone da etapa */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="mx-auto w-20 h-20 bg-[#e8f5fe] dark:bg-[#1d9bf0]/20 rounded-full flex items-center justify-center mb-6"
          >
            <EtapaIcone className="w-10 h-10 text-[#1d9bf0]" />
          </motion.div>

          {/* Etapa 1: Nome Completo */}
          {etapaAtual === 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 text-center">
                Nome Completo
              </label>
              <input
                type="text"
                name="nomeCompleto"
                value={formData.nomeCompleto}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                placeholder="João da Silva"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#1d9bf0] focus:border-transparent text-center text-lg"
                disabled={carregando}
                autoFocus
                required
              />
            </div>
          )}

          {/* Etapa 2: Email */}
          {etapaAtual === 2 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 text-center">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#1d9bf0] focus:border-transparent text-center text-lg"
                disabled={carregando}
                autoFocus
                required
              />
            </div>
          )}

          {/* Etapa 3: Senha */}
          {etapaAtual === 3 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 text-center">
                Senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  name="senha"
                  value={formData.senha}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#1d9bf0] focus:border-transparent text-center text-lg"
                  disabled={carregando}
                  autoFocus
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
              
              {formData.senha && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2"
                >
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3, 4].map((index) => (
                      <div
                        key={index}
                        className={`h-2 flex-1 rounded-full transition-colors ${
                          index < forcaSenha ? forcaCores[forcaSenha - 1] : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                    {forcaLabels[forcaSenha - 1] || 'Muito Fraca'}
                  </p>
                </motion.div>
              )}
            </div>
          )}

          {/* Etapa 4: Confirmar Senha */}
          {etapaAtual === 4 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 text-center">
                Confirmar Senha
              </label>
              <div className="relative">
                <input
                  type={mostrarConfirmarSenha ? 'text' : 'password'}
                  name="confirmarSenha"
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite a senha novamente"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#1d9bf0] focus:border-transparent text-center text-lg"
                  disabled={carregando}
                  autoFocus
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

              {formData.confirmarSenha && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 flex items-center justify-center gap-2"
                >
                  {formData.senha === formData.confirmarSenha ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">Senhas correspondem</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600">Senhas não correspondem</span>
                    </>
                  )}
                </motion.div>
              )}
            </div>
          )}

          {/* Etapa 5: Foto de Perfil */}
          {etapaAtual === 5 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-4 text-center">
                Foto de Perfil (Opcional)
              </label>

              {formData.fotoPerfilURL ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative"
                >
                  <img
                    src={formData.fotoPerfilURL}
                    alt="Preview"
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-[#1d9bf0]"
                  />
                  <button
                    type="button"
                    onClick={removerFoto}
                    className="absolute top-0 right-1/2 transform translate-x-16 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ) : (
                <div className="flex gap-3 justify-center">
                  {/* Botão Câmera */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={uploadandoFoto}
                    className="flex flex-col items-center gap-2 px-6 py-4 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Camera className="w-8 h-8" />
                    <span className="text-sm">Câmera</span>
                  </button>

                  {/* Botão Upload */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadandoFoto}
                    className="flex flex-col items-center gap-2 px-6 py-4 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-8 h-8" />
                    <span className="text-sm">Galeria</span>
                  </button>

                  {/* Inputs ocultos */}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}

              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                Você pode pular esta etapa e adicionar depois
              </p>
            </div>
          )}

          {/* Etapa 6: Código */}
          {etapaAtual === 6 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 text-center">
                Código de Registro
              </label>
              <input
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                placeholder="ABC-123-XYZ"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#1d9bf0] focus:border-transparent text-center text-lg font-mono uppercase"
                disabled={carregando}
                autoFocus
                required
              />
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                Código fornecido pelo administrador do sistema
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  // Formulário principal
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
    >
      {/* Header com logo */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mx-auto w-16 h-16 mb-4 relative"
        >
          <div className="absolute inset-0 bg-[#1d9bf0] rounded-full opacity-70" style={{ mixBlendMode: 'multiply' }}></div>
          <img 
            src="/logo.png" 
            alt="Logo WorkFlow" 
            className="w-full h-full object-contain relative z-10"
          />
        </motion.div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Criar Nova Conta
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Etapa {etapaAtual} de 6
        </p>
      </div>

      {/* Barra de Progresso */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {etapas.map((etapa, index) => {
            if (!etapa || !etapa.icone) return null; // Proteção contra etapas sem ícone
            const Icone = etapa.icone;
            const isConcluida = etapa.numero < etapaAtual;
            const isAtual = etapa.numero === etapaAtual;
            
            return (
              <motion.div
                key={etapa.numero}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isConcluida
                      ? 'bg-[#1d9bf0] text-white'
                      : isAtual
                      ? 'bg-[#1d9bf0] text-white ring-4 ring-[#1d9bf0]/30'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  }`}
                >
                  {isConcluida ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icone className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-xs mt-1 ${isAtual ? 'text-[#1d9bf0] font-semibold' : 'text-gray-400'}`}>
                  {etapa.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Linha de progresso */}
        <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(etapaAtual / 6) * 100}%` }}
            transition={{ duration: 0.5 }}
            className="absolute left-0 top-0 h-full bg-[#1d9bf0] rounded-full"
          />
        </div>
      </div>

      {/* Mensagem de erro */}
      <AnimatePresence>
        {erro && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-2 text-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{erro}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulário */}
      <form onSubmit={handleSubmit}>
        {renderEtapa()}

        {/* Botões de navegação */}
        <div className="flex gap-3 mt-6">
          {/* Botão Voltar */}
          {etapaAtual > 1 && (
            <button
              type="button"
              onClick={etapaAnterior}
              disabled={carregando}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          )}

          {/* Botão para primeira tela */}
          {etapaAtual === 1 && (
            <button
              type="button"
              onClick={onVoltar}
              disabled={carregando}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancelar
            </button>
          )}

          {/* Botão Próximo/Criar */}
          {etapaAtual < 6 ? (
            <button
              type="button"
              onClick={proximaEtapa}
              disabled={!podeProsseguir() || carregando}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Próximo
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!podeProsseguir() || carregando}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {carregando ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <AlertCircle className="w-5 h-5" />
                  </motion.div>
                  Criando...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Criar Conta
                </>
              )}
            </button>
          )}
        </div>
      </form>

      {/* Dica de navegação */}
      <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
        Pressione Enter para avançar
      </p>
    </motion.div>
  );
};

export default UserCreationForm;
