import { useEffect, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from './useAuth';
import { 
  collectAnalytics, 
  checkForUpdates, 
  forceUpdate 
} from '../utils/analytics';

/**
 * 📊 Hook para Registrar Analytics de Acesso
 * 
 * Registra automaticamente:
 * - Informações de sistema e navegador
 * - Performance de carregamento
 * - Localização (IP e GPS se permitido)
 * - Dados de conexão
 * - Versão da aplicação
 */
export const useAnalytics = () => {
  const { usuario } = useAuth();
  const registrado = useRef(false);
  const verificacaoIniciada = useRef(false);

  // Registrar acesso ao carregar a aplicação
  useEffect(() => {
    // Só registra uma vez por sessão
    if (registrado.current || !usuario) return;
    
    const registrarAcesso = async () => {
      try {

        // Coleta todos os dados
        const analytics = await collectAnalytics();
        
        // Adiciona informações do usuário
        const dadosCompletos = {
          ...analytics,
          usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            nivel: usuario.nivel,
            empresaId: usuario.empresaId,
            empresaNome: usuario.empresaNome,
            setorId: usuario.setorId,
            setorNome: usuario.setorNome
          },
          timestamp: serverTimestamp()
        };

        // Salva no Firestore
        await addDoc(collection(db, 'analytics_acessos'), dadosCompletos);

        registrado.current = true;

      } catch (error) {
        console.error('[Analytics] Erro ao registrar acesso:', error);
      }
    };

    // Aguarda 2 segundos para não afetar o carregamento inicial
    const timeout = setTimeout(() => {
      registrarAcesso();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [usuario]);

  // Verificar atualizações periodicamente
  useEffect(() => {
    if (verificacaoIniciada.current) return;
    verificacaoIniciada.current = true;

    const verificarAtualizacoes = async () => {
      try {
        const resultado = await checkForUpdates();
        
        if (resultado.hasUpdate) {

          // Notifica o usuário
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Atualização Disponível', {
              body: `Nova versão ${resultado.latestVersion} disponível! Clique para atualizar.`,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: 'app-update'
            });
          }

          // Mostra banner de atualização
          mostrarBannerAtualizacao(resultado.latestVersion);
        }
      } catch (error) {
        console.error('[Analytics] Erro ao verificar atualizações:', error);
      }
    };

    // Verifica ao carregar
    verificarAtualizacoes();

    // Verifica a cada 5 minutos
    const intervalo = setInterval(verificarAtualizacoes, 5 * 60 * 1000);

    return () => clearInterval(intervalo);
  }, []);

  // Listener para mensagens do Service Worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event) => {
      if (event.data && event.data.type === 'SW_UPDATED') {

        mostrarBannerAtualizacao(event.data.version);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  return {
    forceUpdate
  };
};

/**
 * Mostra banner de atualização
 */
const mostrarBannerAtualizacao = (novaVersao) => {
  // Verifica se já existe um banner
  if (document.getElementById('update-banner')) return;

  // Cria o banner
  const banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.className = 'fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white p-4 shadow-lg animate-slide-down';
  banner.innerHTML = `
    <div class="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-3">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        <div>
          <p class="font-semibold">Nova versão disponível!</p>
          <p class="text-sm opacity-90">Versão ${novaVersao} está pronta para ser instalada.</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button 
          id="update-later-btn"
          class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
        >
          Mais Tarde
        </button>
        <button 
          id="update-now-btn"
          class="px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
        >
          Atualizar Agora
        </button>
      </div>
    </div>
  `;

  // Adiciona ao DOM
  document.body.appendChild(banner);

  // Event listeners
  document.getElementById('update-now-btn').addEventListener('click', () => {
    forceUpdate();
  });

  document.getElementById('update-later-btn').addEventListener('click', () => {
    banner.remove();
  });

  // Remove automaticamente após 30 segundos
  setTimeout(() => {
    if (banner.parentNode) {
      banner.remove();
    }
  }, 30000);
};
