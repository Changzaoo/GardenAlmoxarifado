import React, { useState } from 'react';
import { Lock, Key, Eye, EyeOff, Check, X, HelpCircle } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { encryptPassword, verifyPassword } from '../../utils/crypto';

/**
 * Modal de Recuperação de Senha
 * 
 * Exibe parte da pergunta secreta para validar identidade
 * Permite redefinir senha após responder corretamente
 */

const RecuperarSenhaModal = ({ onClose, onSuccess }) => {
  const [etapa, setEtapa] = useState(1); // 1: usuario, 2: resposta secreta, 3: nova senha
  const [usuario, setUsuario] = useState('');
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);
  const [respostaUsuario, setRespostaUsuario] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erros, setErros] = useState({});

  // Ocultar parte da frase secreta
  const ocultarFrase = (frase) => {
    if (!frase) return '';
    const palavras = frase.split(' ');
    if (palavras.length <= 2) {
      // Se for muito curta, oculta o meio
      const inicio = frase.substring(0, Math.floor(frase.length * 0.3));
      const fim = frase.substring(Math.ceil(frase.length * 0.7));
      return `${inicio}${'*'.repeat(frase.length - inicio.length - fim.length)}${fim}`;
    }
    // Oculta palavras do meio
    const inicio = palavras[0];
    const fim = palavras[palavras.length - 1];
    const meioOculto = '*'.repeat(Math.max(3, palavras.length - 2) * 4);
    return `${inicio} ${meioOculto} ${fim}`;
  };

  // Buscar usuário por nome de usuário
  const buscarUsuario = async () => {
    setCarregando(true);
    setErros({});

    try {
      const usuariosRef = collection(db, 'usuario');
      const q = query(usuariosRef, where('usuario', '==', usuario.toLowerCase().trim()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setErros({ usuario: 'Nome de usuário não encontrado no sistema' });
        setCarregando(false);
        return;
      }

      const usuarioDoc = snapshot.docs[0];
      const usuarioData = { id: usuarioDoc.id, ...usuarioDoc.data() };

      if (!usuarioData.fraseSecreta) {
        setErros({ usuario: 'Este usuário não possui pergunta de segurança configurada. Entre em contato com o administrador.' });
        setCarregando(false);
        return;
      }

      setUsuarioEncontrado(usuarioData);
      setEtapa(2);
      setCarregando(false);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      setErros({ geral: 'Erro ao buscar usuário. Tente novamente.' });
      setCarregando(false);
    }
  };

  // Validar resposta secreta
  const validarResposta = async () => {
    setCarregando(true);
    setErros({});

    try {
      // Verificar resposta (case-insensitive)
      const respostaCorreta = verifyPassword(
        respostaUsuario.toLowerCase().trim(),
        usuarioEncontrado.respostaSecretaHash,
        usuarioEncontrado.respostaSecretaSalt
      );

      if (!respostaCorreta) {
        setErros({ resposta: 'Resposta incorreta. Tente novamente.' });
        setCarregando(false);
        return;
      }

      setEtapa(3);
      setCarregando(false);
    } catch (error) {
      console.error('Erro ao validar resposta:', error);
      setErros({ geral: 'Erro ao validar resposta. Tente novamente.' });
      setCarregando(false);
    }
  };

  // Validar senha
  const validarSenha = (senha) => {
    const erros = [];
    if (senha.length < 6) erros.push('Mínimo de 6 caracteres');
    if (!/[A-Z]/.test(senha)) erros.push('Pelo menos uma letra maiúscula');
    if (!/[a-z]/.test(senha)) erros.push('Pelo menos uma letra minúscula');
    if (!/[0-9]/.test(senha)) erros.push('Pelo menos um número');
    return erros;
  };

  // Salvar nova senha
  const salvarNovaSenha = async () => {
    const novosErros = {};

    // Validar nova senha
    const errosSenha = validarSenha(novaSenha);
    if (errosSenha.length > 0) {
      novosErros.novaSenha = errosSenha.join(', ');
    }

    if (novaSenha !== confirmarSenha) {
      novosErros.confirmarSenha = 'As senhas não coincidem';
    }

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    setCarregando(true);

    try {
      // Criptografar nova senha
      const { hash, salt, version } = encryptPassword(novaSenha);

      // 🔑 ATUALIZAR AUTHKEY COM A SENHA DIGITADA (PRIORIDADE 1 NO LOGIN)
      // authKey é a senha em texto plano que será verificada PRIMEIRO no login
      const authKey = novaSenha;

      // Atualizar senha no Firestore
      await updateDoc(doc(db, 'usuarios', usuarioEncontrado.id), {
        senhaHash: hash,
        senhaSalt: salt,
        senhaVersion: version,
        senha: null,
        authKey: authKey,
        authKeyUpdatedAt: new Date(),
        dataAlteracaoSenha: new Date().toISOString()
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao salvar nova senha:', error);
      setErros({ geral: 'Erro ao salvar senha. Tente novamente.' });
      setCarregando(false);
    }
  };

  const requisitosAtendidos = validarSenha(novaSenha);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Recuperar Senha
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {etapa === 1 && 'Digite seu nome de usuário'}
                  {etapa === 2 && 'Responda a pergunta secreta'}
                  {etapa === 3 && 'Crie uma nova senha'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex gap-2 mt-4">
            <div className={`flex-1 h-1 rounded-full ${etapa >= 1 ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
            <div className={`flex-1 h-1 rounded-full ${etapa >= 2 ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
            <div className={`flex-1 h-1 rounded-full ${etapa >= 3 ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {etapa === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome de Usuário
                </label>
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && buscarUsuario()}
                  className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    erros.usuario ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } focus:ring-2 focus:ring-orange-500`}
                  placeholder="Digite seu nome de usuário"
                />
                {erros.usuario && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{erros.usuario}</p>
                )}
              </div>
            </>
          )}

          {etapa === 2 && usuarioEncontrado && (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                  Pergunta Secreta:
                </p>
                <p className="text-gray-700 dark:text-gray-300 font-mono text-sm break-words">
                  {ocultarFrase(usuarioEncontrado.fraseSecreta)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sua Resposta
                </label>
                <input
                  type="text"
                  value={respostaUsuario}
                  onChange={(e) => setRespostaUsuario(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && validarResposta()}
                  className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    erros.resposta ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } focus:ring-2 focus:ring-orange-500`}
                  placeholder="Digite sua resposta"
                />
                {erros.resposta && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{erros.resposta}</p>
                )}
              </div>
            </>
          )}

          {etapa === 3 && (
            <>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm text-green-800 dark:text-green-300">
                  ✓ Identidade verificada! Agora você pode criar uma nova senha.
                </p>
              </div>

              {/* Nova Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      erros.novaSenha ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } focus:ring-2 focus:ring-orange-500`}
                    placeholder="Digite sua nova senha"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {erros.novaSenha && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{erros.novaSenha}</p>
                )}
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Key className="w-4 h-4 inline mr-1" />
                  Confirmar Senha
                </label>
                <div className="relative">
                  <input
                    type={mostrarConfirmarSenha ? 'text' : 'password'}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && salvarNovaSenha()}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      erros.confirmarSenha ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } focus:ring-2 focus:ring-orange-500`}
                    placeholder="Digite novamente sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {mostrarConfirmarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {erros.confirmarSenha && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{erros.confirmarSenha}</p>
                )}
              </div>

              {/* Requisitos de Senha */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Requisitos da senha:</p>
                {[
                  { text: 'Mínimo de 6 caracteres', check: novaSenha.length >= 6 },
                  { text: 'Pelo menos uma letra maiúscula', check: /[A-Z]/.test(novaSenha) },
                  { text: 'Pelo menos uma letra minúscula', check: /[a-z]/.test(novaSenha) },
                  { text: 'Pelo menos um número', check: /[0-9]/.test(novaSenha) }
                ].map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    {req.check ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={req.check ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {erros.geral && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-300">{erros.geral}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            disabled={carregando}
            className="flex-1 px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (etapa === 1) buscarUsuario();
              else if (etapa === 2) validarResposta();
              else if (etapa === 3) salvarNovaSenha();
            }}
            disabled={carregando || (etapa === 3 && requisitosAtendidos.length > 0)}
            className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {carregando ? 'Processando...' : etapa === 3 ? 'Salvar Senha' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecuperarSenhaModal;
