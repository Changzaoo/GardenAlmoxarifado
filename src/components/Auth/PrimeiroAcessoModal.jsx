import React, { useState } from 'react';
import { Lock, Key, Shield, Eye, EyeOff, Check, X, AlertTriangle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { encryptPassword } from '../../utils/crypto';

/**
 * Modal de Primeiro Acesso
 * 
 * Exibido quando o usuário faz login pela primeira vez
 * Solicita criação de senha personalizada e frase de recuperação
 */

const PrimeiroAcessoModal = ({ usuario, onComplete }) => {
  const [etapa, setEtapa] = useState(1); // 1: senha, 2: confirmação, 3: frase secreta
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [fraseSecreta, setFraseSecreta] = useState('');
  const [respostaSecreta, setRespostaSecreta] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erros, setErros] = useState({});

  // Validar senha
  const validarSenha = (senha) => {
    const erros = [];
    if (senha.length < 6) erros.push('Mínimo de 6 caracteres');
    if (!/[A-Z]/.test(senha)) erros.push('Pelo menos uma letra maiúscula');
    if (!/[a-z]/.test(senha)) erros.push('Pelo menos uma letra minúscula');
    if (!/[0-9]/.test(senha)) erros.push('Pelo menos um número');
    return erros;
  };

  const handleProximaEtapa = () => {
    const novosErros = {};

    if (etapa === 1) {
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

      setEtapa(2);
    } else if (etapa === 2) {
      // Validar frase secreta
      if (!fraseSecreta.trim()) {
        novosErros.fraseSecreta = 'Digite uma pergunta secreta';
      }
      if (fraseSecreta.length < 10) {
        novosErros.fraseSecreta = 'A pergunta deve ter pelo menos 10 caracteres';
      }
      if (!respostaSecreta.trim()) {
        novosErros.respostaSecreta = 'Digite uma resposta';
      }
      if (respostaSecreta.length < 3) {
        novosErros.respostaSecreta = 'A resposta deve ter pelo menos 3 caracteres';
      }

      if (Object.keys(novosErros).length > 0) {
        setErros(novosErros);
        return;
      }

      // Salvar tudo
      handleSalvar();
    }

    setErros({});
  };

  const handleSalvar = async () => {
    setCarregando(true);
    try {
      // Criptografar senha
      const { hash, salt, version } = encryptPassword(novaSenha);

      // Criptografar resposta secreta
      const { hash: respostaHash, salt: respostaSalt } = encryptPassword(respostaSecreta.toLowerCase());

      // Atualizar usuário no Firestore
      await updateDoc(doc(db, 'usuarios', usuario.id), {
        senhaHash: hash,
        senhaSalt: salt,
        senhaVersion: version,
        senha: null, // Remover senha em texto plano
        fraseSecreta: fraseSecreta,
        respostaSecretaHash: respostaHash,
        respostaSecretaSalt: respostaSalt,
        primeiroAcesso: false,
        dataAlteracaoSenha: new Date().toISOString()
      });

      // Chamar callback de conclusão
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Erro ao salvar nova senha:', error);
      setErros({ geral: 'Erro ao salvar. Tente novamente.' });
      setCarregando(false);
    }
  };

  const requisitosAtendidos = validarSenha(novaSenha);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Primeiro Acesso
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure sua senha personalizada
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex gap-2 mt-4">
            <div className={`flex-1 h-1 rounded-full ${etapa >= 1 ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
            <div className={`flex-1 h-1 rounded-full ${etapa >= 2 ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {etapa === 1 && (
            <>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    Este é seu primeiro acesso. Por favor, crie uma senha segura para proteger sua conta.
                  </p>
                </div>
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
                    } focus:ring-2 focus:ring-blue-500`}
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
                    className={`w-full px-4 py-3 pr-12 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      erros.confirmarSenha ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } focus:ring-2 focus:ring-blue-500`}
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

          {etapa === 2 && (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Configure uma pergunta e resposta secreta para recuperação de senha.
                  </p>
                </div>
              </div>

              {/* Frase Secreta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pergunta Secreta
                </label>
                <input
                  type="text"
                  value={fraseSecreta}
                  onChange={(e) => setFraseSecreta(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    erros.fraseSecreta ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } focus:ring-2 focus:ring-blue-500`}
                  placeholder="Ex: Qual o nome do seu primeiro animal de estimação?"
                />
                {erros.fraseSecreta && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{erros.fraseSecreta}</p>
                )}
              </div>

              {/* Resposta Secreta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resposta
                </label>
                <input
                  type="text"
                  value={respostaSecreta}
                  onChange={(e) => setRespostaSecreta(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    erros.respostaSecreta ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } focus:ring-2 focus:ring-blue-500`}
                  placeholder="Digite sua resposta"
                />
                {erros.respostaSecreta && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{erros.respostaSecreta}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Guarde bem essa informação. Ela será usada para recuperar sua senha.
                </p>
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
          {etapa === 2 && (
            <button
              onClick={() => setEtapa(1)}
              disabled={carregando}
              className="flex-1 px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Voltar
            </button>
          )}
          <button
            onClick={handleProximaEtapa}
            disabled={carregando || (etapa === 1 && requisitosAtendidos.length > 0)}
            className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {carregando ? 'Salvando...' : etapa === 1 ? 'Continuar' : 'Concluir'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrimeiroAcessoModal;
