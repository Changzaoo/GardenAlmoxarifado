import React, { useState } from 'react';
import { RefreshCw, Wifi, Coffee, AlertTriangle, PhoneCall, Send, CheckCircle } from 'lucide-react';
import { db } from '../../firebase/config';
import { collection, addDoc } from 'firebase/firestore';

/**
 * Tela de Erro Mobile-Friendly
 * Mostra erros de forma amigável e com soluções práticas
 */
const MobileErrorScreen = ({ error, errorInfo, resetError }) => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const [showReportModal, setShowReportModal] = useState(false);
  const [enviandoRelatorio, setEnviandoRelatorio] = useState(false);
  const [relatorioEnviado, setRelatorioEnviado] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [nomeContato, setNomeContato] = useState('');
  const [emailContato, setEmailContato] = useState('');
  
  // Detectar tipo de erro
  const errorType = detectErrorType(error?.message || '');

  const handleReload = () => {
    window.location.reload();
  };

  const handleClearCache = () => {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    localStorage.clear();
    sessionStorage.clear();
    setTimeout(() => window.location.reload(), 1000);
  };

  const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    let browserName = 'Desconhecido';
    let browserVersion = 'Desconhecida';
    let osName = 'Desconhecido';

    // Detectar navegador
    if (ua.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
      browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || '';
    } else if (ua.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
      browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || '';
    } else if (ua.indexOf('Safari') > -1) {
      browserName = 'Safari';
      browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || '';
    } else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) {
      browserName = 'Edge';
      browserVersion = ua.match(/Edg\/([0-9.]+)/)?.[1] || '';
    }

    // Detectar SO
    if (ua.indexOf('Windows') > -1) osName = 'Windows';
    else if (ua.indexOf('Mac') > -1) osName = 'MacOS';
    else if (ua.indexOf('Linux') > -1) osName = 'Linux';
    else if (ua.indexOf('Android') > -1) osName = 'Android';
    else if (ua.indexOf('iOS') > -1) osName = 'iOS';

    return { name: browserName, version: browserVersion, os: osName };
  };

  const enviarRelatorioErro = async () => {
    // Validação
    if (!nomeContato.trim()) {
      alert('Por favor, informe seu nome para enviar o relatório.');
      return;
    }
    if (!emailContato.trim()) {
      alert('Por favor, informe seu email para que possamos entrar em contato.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailContato)) {
      alert('Por favor, informe um email válido.');
      return;
    }

    setEnviandoRelatorio(true);

    try {
      const errorCode = `ERR-${Date.now().toString(36).toUpperCase()}`;
      const browserInfo = getBrowserInfo();

      const relatorio = {
        errorCode,
        errorMessage: error?.message || error?.toString() || 'Erro desconhecido',
        errorStack: error?.stack || null,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        browserInfo,
        usuarioId: 'anonimo',
        usuarioNome: nomeContato || 'Usuário Anônimo',
        usuarioUsername: '',
        usuarioLogado: false,
        contatoNome: nomeContato,
        contatoEmail: emailContato,
        descricao: descricao || 'Sem descrição adicional',
        status: 'pendente',
        criadoEm: new Date().toISOString()
      };

      await addDoc(collection(db, 'errorReports'), relatorio);
      
      setRelatorioEnviado(true);
      setEnviandoRelatorio(false);
      
      // Copiar código de erro para clipboard
      navigator.clipboard.writeText(errorCode).catch(() => {});
      
      setTimeout(() => {
        setShowReportModal(false);
        setRelatorioEnviado(false);
        setDescricao('');
        setNomeContato('');
        setEmailContato('');
      }, 3000);
    } catch (err) {
      console.error('Erro ao enviar relatório:', err);
      alert('Não foi possível enviar o relatório. Por favor, tente novamente.');
      setEnviandoRelatorio(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header com animação */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
          </div>
          
          <div className="relative">
            <div className="w-24 h-24 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <AlertTriangle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Ops! Algo deu errado
            </h1>
            <p className="text-white/90 text-sm">
              Não se preocupe, vamos resolver isso juntos! 😊
            </p>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          {/* O que aconteceu */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border-2 border-red-100 dark:border-red-800">
            <h3 className="font-bold text-red-900 dark:text-red-200 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              O que aconteceu?
            </h3>
            <p className="text-sm text-red-800 dark:text-red-300">
              {errorType.description}
            </p>
            {error?.message && (
              <details className="mt-3">
                <summary className="text-xs text-red-700 dark:text-red-400 cursor-pointer font-medium">
                  Ver detalhes técnicos
                </summary>
                <pre className="mt-2 text-xs bg-red-100 dark:bg-red-950 p-2 rounded overflow-x-auto text-red-900 dark:text-red-200">
                  {error.message}
                </pre>
              </details>
            )}
          </div>

          {/* Soluções */}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Coffee className="w-5 h-5 text-orange-500" />
              Soluções rápidas:
            </h3>
            
            <div className="space-y-3">
              {errorType.solutions.map((solution, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 dark:text-gray-200">
                      {solution}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botões de ação */}
          <div className="space-y-3">
            <button
              onClick={handleReload}
              className="w-full py-4 bg-blue-500 dark:bg-[#1D9BF0] hover:bg-blue-600 dark:hover:bg-[#1A8CD8] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Recarregar Sistema
            </button>

            <button
              onClick={handleClearCache}
              className="w-full py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Wifi className="w-5 h-5" />
              Limpar Cache e Recarregar
            </button>
          </div>

          {/* Dica adicional */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg">💡</span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-1">
                  Dica profissional:
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  {errorType.tip}
                </p>
              </div>
            </div>
          </div>

          {/* Reportar Erro */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Problema persistindo?
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-all"
              >
                <AlertTriangle className="w-5 h-5" />
                Reportar este Erro
              </button>
              <a
                href="https://wa.me/5500000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-all"
              >
                <PhoneCall className="w-5 h-5" />
                Falar com Suporte
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Workflow • Versão 2.0 • {isMobile ? 'Mobile' : 'Desktop'}
          </p>
        </div>
      </div>

      {/* Modal de Reportar Erro */}
      {showReportModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Reportar Problema
              </h3>
              
              {relatorioEnviado ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Relatório Enviado!
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Obrigado por nos ajudar a melhorar o sistema. Nossa equipe irá analisar o problema.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Para que possamos entrar em contato sobre este erro, por favor preencha seus dados:
                    </p>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Seu Nome <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={nomeContato}
                        onChange={(e) => setNomeContato(e.target.value)}
                        placeholder="Digite seu nome completo"
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Seu Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={emailContato}
                        onChange={(e) => setEmailContato(e.target.value)}
                        placeholder="seu.email@exemplo.com"
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Descrição do Problema
                      </label>
                      <textarea
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="O que você estava fazendo quando o erro ocorreu?"
                        className="w-full h-24 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowReportModal(false);
                        setDescricao('');
                        setNomeContato('');
                        setEmailContato('');
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={enviarRelatorioErro}
                      disabled={enviandoRelatorio}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold transition-all flex items-center justify-center gap-2"
                    >
                      {enviandoRelatorio ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Enviar
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Detecta o tipo de erro e retorna informações contextuais
 */
function detectErrorType(errorMessage) {
  const msg = errorMessage.toLowerCase();

  // Erro de rede/conexão
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout')) {
    return {
      description: 'Parece que há um problema de conexão com a internet ou o servidor está temporariamente indisponível.',
      solutions: [
        'Verifique se seu Wi-Fi ou dados móveis estão ativos',
        'Tente desligar e ligar novamente o Wi-Fi',
        'Aguarde alguns segundos e tente novamente',
        'Se estiver usando dados móveis, verifique se tem saldo'
      ],
      tip: 'Às vezes, trocar de Wi-Fi para dados móveis (ou vice-versa) resolve o problema!'
    };
  }

  // Erro de módulo não encontrado
  if (msg.includes('module not found') || msg.includes('cannot find module')) {
    return {
      description: 'O aplicativo está tentando carregar um componente que não está disponível. Isso geralmente acontece após uma atualização.',
      solutions: [
        'Limpe o cache do navegador (botão abaixo)',
        'Feche completamente o app e abra novamente',
        'Verifique se há atualizações pendentes no app',
        'Se no navegador, pressione Ctrl+Shift+R (ou Cmd+Shift+R no Mac)'
      ],
      tip: 'Limpar o cache resolve 90% desses problemas. É como dar um "reset" no app!'
    };
  }

  // Erro de contexto/provider
  if (msg.includes('context') || msg.includes('provider') || msg.includes('usedevelopermode')) {
    return {
      description: 'Há um problema na estrutura interna do aplicativo. Um componente está tentando acessar recursos que não estão prontos ainda.',
      solutions: [
        'Recarregue a página completamente',
        'Limpe o cache e dados do site',
        'Tente fazer logout e login novamente',
        'Verifique se você tem a versão mais recente do app'
      ],
      tip: 'Este erro geralmente é temporário. Uma simples recarga da página costuma resolver!'
    };
  }

  // Erro de permissão
  if (msg.includes('permission') || msg.includes('denied') || msg.includes('forbidden')) {
    return {
      description: 'Você não tem permissão para acessar este recurso ou executar esta ação.',
      solutions: [
        'Verifique se você está logado com a conta correta',
        'Entre em contato com seu administrador',
        'Faça logout e login novamente',
        'Verifique se seu perfil tem as permissões necessárias'
      ],
      tip: 'Permissões são definidas pelo administrador do sistema. Fale com ele se precisar de acesso!'
    };
  }

  // Erro genérico
  return {
    description: 'Ocorreu um erro inesperado no aplicativo. Não se preocupe, isso pode acontecer e geralmente é fácil de resolver!',
    solutions: [
      'Recarregue a página (F5 ou puxe para atualizar)',
      'Limpe o cache do navegador',
      'Verifique sua conexão com a internet',
      'Tente novamente em alguns instantes'
    ],
    tip: 'A maioria dos erros se resolve com uma simples recarga da página. Experimente!'
  };
}

export default MobileErrorScreen;
