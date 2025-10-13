import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  BarChart3, Users, Package, CheckSquare, MessageSquare, Trophy, 
  Calendar, Bluetooth, Database, Activity, TrendingUp, Clock,
  Server, Zap, Shield, Globe, Smartphone, Monitor, AlertCircle, Building2,
  RefreshCw
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { NIVEIS_PERMISSAO } from '../../constants/permissoes';
import { useModal } from '../../hooks/useModal';
import CustomModal from '../common/CustomModal';
import MigracaoUsuariosModal from './MigracaoUsuariosModal';
import ExportacaoUsuariosModal from './ExportacaoUsuariosModal';
import MigracaoUsuariosNovoModeloModal from './MigracaoUsuariosNovoModeloModal';

/**
 * Página de Resumo do Sistema
 * Visível apenas para ADMINISTRADORES
 * 
 * Apresenta:
 * - Estatísticas gerais do sistema
 * - Módulos implementados
 * - Funcionalidades disponíveis
 * - Status de integrações
 * - Métricas de uso
 */
const SistemaResumo = () => {
  const { usuario, nivelPermissao, sincronizarFuncionariosComUsuarios } = useAuth();
  const { modalState, handleConfirm, handleCancel, showConfirm, showSuccess, showError } = useModal();
  const [stats, setStats] = useState({
    usuarios: 0,
    funcionarios: 0,
    empresas: 0,
    setores: 0,
    itensInventario: 0,
    tarefas: 0,
    tarefasCompletas: 0,
    mensagens: 0,
    emprestimos: 0,
    emprestimosAtivos: 0,
    avaliacoes: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [modulosAtivos, setModulosAtivos] = useState([]);
  const [mostrarMigracaoModal, setMostrarMigracaoModal] = useState(false);
  const [mostrarExportacaoModal, setMostrarExportacaoModal] = useState(false);
  const [mostrarMigracaoNovoModeloModal, setMostrarMigracaoNovoModeloModal] = useState(false);

  // Verificar permissão de admin

  const isAdmin = nivelPermissao === NIVEIS_PERMISSAO.ADMIN || usuario?.nivel === NIVEIS_PERMISSAO.ADMIN;

  useEffect(() => {
    if (isAdmin) {
      carregarEstatisticas();
      detectarModulos();
    }
  }, [isAdmin]);

  /**
   * Carregar estatísticas do Firestore
   */
  const carregarEstatisticas = async () => {
    try {
      setLoading(true);
      
      // Buscar contagens de cada coleção
      const [
        funcionariosSnap,
        empresasSnap,
        setoresSnap,
        inventarioSnap,
        tarefasSnap,
        tarefasCompletasSnap,
        mensagensSnap,
        emprestimosSnap,
        emprestimosAtivosSnap,
        avaliacoesSnap
      ] = await Promise.all([
        getDocs(collection(db, 'funcionarios')),
        getDocs(collection(db, 'empresas')),
        getDocs(collection(db, 'setores')),
        getDocs(collection(db, 'inventario')),
        getDocs(collection(db, 'tarefas')),
        getDocs(query(collection(db, 'tarefas'), where('concluida', '==', true))),
        getDocs(collection(db, 'mensagens')),
        getDocs(collection(db, 'emprestimos')),
        getDocs(query(collection(db, 'emprestimos'), where('status', '==', 'ativo'))),
        getDocs(collection(db, 'avaliacoes'))
      ]);

      setStats({
        funcionarios: funcionariosSnap.size,
        empresas: empresasSnap.size,
        setores: setoresSnap.size,
        itensInventario: inventarioSnap.size,
        tarefas: tarefasSnap.size,
        tarefasCompletas: tarefasCompletasSnap.size,
        mensagens: mensagensSnap.size,
        emprestimos: emprestimosSnap.size,
        emprestimosAtivos: emprestimosAtivosSnap.size,
        avaliacoes: avaliacoesSnap.size
      });

    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Detectar módulos implementados no sistema
   */
  const detectarModulos = () => {
    const modulos = [
      {
        nome: 'Gestão de Inventário',
        descricao: 'Sistema completo de controle de estoque com categorização, localização e rastreamento',
        icon: Package,
        cor: 'blue',
        funcionalidades: [
          'Cadastro de itens com múltiplas categorias',
          'Controle de quantidade e localização',
          'Histórico de movimentações',
          'Alertas de estoque baixo',
          'Busca e filtros avançados',
          'Importação/Exportação de dados'
        ],
        ativo: true
      },
      {
        nome: 'Sistema de Tarefas',
        descricao: 'Gerenciamento de tarefas com prioridades, prazos e acompanhamento',
        icon: CheckSquare,
        cor: 'green',
        funcionalidades: [
          'Criação e atribuição de tarefas',
          'Níveis de prioridade (Baixa, Normal, Alta, Urgente)',
          'Definição de prazos',
          'Acompanhamento de progresso',
          'Notificações de tarefas',
          'Filtros por status e prioridade'
        ],
        ativo: true
      },
      {
        nome: 'Mensagens em Tempo Real',
        descricao: 'Chat corporativo com criptografia E2E e sincronização instantânea',
        icon: MessageSquare,
        cor: 'purple',
        funcionalidades: [
          'Conversas individuais e em grupo',
          'Criptografia de ponta a ponta (E2E)',
          'Sincronização em tempo real',
          'Histórico de mensagens',
          'Indicadores de leitura',
          'Notificações push'
        ],
        ativo: true
      },
      {
        nome: 'Sistema de Ranking',
        descricao: 'Gamificação com pontos, avaliações e leaderboard',
        icon: Trophy,
        cor: 'yellow',
        funcionalidades: [
          'Pontuação por tarefas concluídas',
          'Sistema de avaliações',
          'Ranking geral e por período',
          'Badges e conquistas',
          'Estatísticas individuais',
          'Histórico de pontuações'
        ],
        ativo: true
      },
      {
        nome: 'Empréstimos de Ferramentas',
        descricao: 'Controle de empréstimos com rastreamento e histórico',
        icon: Activity,
        cor: 'orange',
        funcionalidades: [
          'Registro de empréstimos',
          'Controle de devolução',
          'Histórico completo',
          'Alertas de atraso',
          'Rastreamento por funcionário',
          'Relatórios de uso'
        ],
        ativo: true
      },
      {
        nome: 'Escalas Semanais',
        descricao: 'Gerenciamento de escalas de trabalho e plantões',
        icon: Calendar,
        cor: 'indigo',
        funcionalidades: [
          'Criação de escalas semanais',
          'Atribuição de turnos',
          'Visualização em calendário',
          'Notificações de escala',
          'Histórico de escalas',
          'Troca de turnos'
        ],
        ativo: true
      },
      {
        nome: 'Bluetooth Mesh',
        descricao: 'Sincronização offline via Bluetooth para áreas sem internet',
        icon: Bluetooth,
        cor: 'cyan',
        funcionalidades: [
          'Sincronização automática via Bluetooth',
          'Detecção de dispositivos próximos',
          'Transferência de dados offline',
          'Auto-scan periódico (mobile)',
          'Modo desenvolvedor com debug',
          'Sincronização bidirecional'
        ],
        ativo: true,
        experimental: true
      },
      {
        nome: 'Sistema de Temas',
        descricao: 'Personalização visual com múltiplos temas',
        icon: Monitor,
        cor: 'pink',
        funcionalidades: [
          'Tema Claro/Escuro/Sistema',
          'Transições suaves',
          'Persistência de preferência',
          'Sincronização com SO',
          'Theme-color dinâmico (mobile)',
          'Suporte a cores customizadas'
        ],
        ativo: true
      },
      {
        nome: 'PWA (Progressive Web App)',
        descricao: 'Instalação como app nativo em iOS e Android',
        icon: Smartphone,
        cor: 'teal',
        funcionalidades: [
          'Instalação em iOS (Safari)',
          'Instalação em Android (Chrome)',
          'Ícones adaptativos',
          'Splash screens',
          'Funcionamento offline',
          'Notificações push',
          'Atalhos de app'
        ],
        ativo: true
      },
      {
        nome: 'Modo Desenvolvedor',
        descricao: 'Painel de diagnóstico e análise do sistema',
        icon: Server,
        cor: 'gray',
        funcionalidades: [
          'Ativação por long-press (0.5s)',
          'Análise de performance',
          'Inspeção de storage',
          'Monitoramento de Firebase',
          'Status de APIs',
          'Exportação de dados de debug',
          'Acesso exclusivo admin'
        ],
        ativo: true,
        adminOnly: true
      },
      {
        nome: 'Gestão de Perfis',
        descricao: 'Sistema completo de perfis de funcionários',
        icon: Users,
        cor: 'red',
        funcionalidades: [
          'Empresa, Setor e Função (obrigatórios)',
          'Informações de contato (Telefone, WhatsApp)',
          'Dados pessoais (CPF, Data de Nascimento)',
          'Estatísticas de uso',
          'Integração com todos módulos',
          'Validação de dados'
        ],
        ativo: true
      },
      {
        nome: 'Sistema de Backup',
        descricao: 'Backup automático e restauração de dados',
        icon: Database,
        cor: 'emerald',
        funcionalidades: [
          'Backup automático periódico',
          'Backup manual sob demanda',
          'Restauração de dados',
          'Exportação em JSON',
          'Sincronização com Firestore',
          'Histórico de backups'
        ],
        ativo: true
      }
    ];

    setModulosAtivos(modulos);
  };

  /**
   * Renderizar card de estatística
   */
  const StatCard = ({ icon: Icon, label, value, color, suffix = '' }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {loading ? '...' : value}{suffix}
          </p>
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900/30`}>
          <Icon className={`text-${color}-600 dark:text-${color}-400`} size={24} />
        </div>
      </div>
    </div>
  );

  /**
   * Renderizar card de módulo
   */
  const ModuloCard = ({ modulo }) => {
    const Icon = modulo.icon;
    const [expanded, setExpanded] = useState(false);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all">
        <div 
          className="p-6 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg bg-${modulo.cor}-100 dark:bg-${modulo.cor}-900/30 flex-shrink-0`}>
              <Icon className={`text-${modulo.cor}-600 dark:text-${modulo.cor}-400`} size={24} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                    {modulo.nome}
                    {modulo.experimental && (
                      <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded">
                        Beta
                      </span>
                    )}
                    {modulo.adminOnly && (
                      <Shield size={16} className="text-red-500" />
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {modulo.descricao}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    modulo.ativo ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {expanded ? '▼' : '▶'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Funcionalidades:
            </h4>
            <ul className="space-y-2">
              {modulo.funcionalidades.map((func, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Zap size={16} className={`text-${modulo.cor}-500 flex-shrink-0 mt-0.5`} />
                  {func}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Se não for admin, não mostrar nada
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Shield size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acesso Restrito
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Esta página é visível apenas para administradores.
          </p>
        </div>
      </div>
    );
  }

  const taxaConclusaoTarefas = stats.tarefas > 0 
    ? Math.round((stats.tarefasCompletas / stats.tarefas) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <BarChart3 className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Resumo do Sistema
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Visão geral completa • Acesso exclusivo para administradores
                </p>
              </div>
            </div>
            
            {/* Botões de Ação */}
            <div className="flex flex-wrap gap-2">
              {/* Botão de Sincronização de Funcionários */}
              <button
                onClick={async () => {
                  const confirmed = await showConfirm(
                    'Deseja sincronizar todos os funcionários com o sistema de usuários?\n\nIsso irá:\n• Criar logins para funcionários sem acesso\n• Atualizar dados de funcionários existentes\n• Preservar senhas já cadastradas\n• Senha padrão para novos: 123456',
                    '🔄 Sincronizar Funcionários'
                  );
                  
                  if (confirmed) {
                    setLoading(true);
                    try {
                      const resultado = await sincronizarFuncionariosComUsuarios();
                      const mensagem = `✨ ${resultado.criados} usuários criados\n🔄 ${resultado.atualizados} usuários atualizados${resultado.criados > 0 ? '\n\n⚠️ Novos usuários criados com senha padrão: 123456' : ''}`;
                      await showSuccess(mensagem, 'Sincronização Concluída');
                      carregarEstatisticas();
                    } catch (error) {
                      await showError(`Erro na sincronização: ${error.message}`);
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-lg shadow-md transition-all transform hover:scale-105 disabled:hover:scale-100"
              >
                <Users className="w-5 h-5" />
                <span className="hidden md:inline font-medium">
                  {loading ? 'Sincronizando...' : 'Sincronizar Funcionários'}
                </span>
                <span className="md:hidden font-medium">
                  {loading ? '...' : 'Sync'}
                </span>
              </button>

              {/* Botão de Migração de Coleção */}
              <button
                onClick={() => setMostrarMigracaoModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-md transition-all transform hover:scale-105"
                title="Migrar coleção 'usuarios' para 'usuario'"
              >
                <Database className="w-5 h-5" />
                <span className="hidden md:inline font-medium">
                  Migração de Usuários
                </span>
                <span className="md:hidden font-medium">
                  Migrar
                </span>
              </button>

              {/* Botão de Exportação para Funcionários */}
              <button
                onClick={() => setMostrarExportacaoModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white rounded-lg shadow-md transition-all transform hover:scale-105"
                title="Exportar usuários para funcionários (Zendaya/Jardim)"
              >
                <Building2 className="w-5 h-5" />
                <span className="hidden md:inline font-medium">
                  Exportar para Funcionários
                </span>
                <span className="md:hidden font-medium">
                  Exportar
                </span>
              </button>

              {/* Botão de Migração para Novo Modelo */}
              <button
                onClick={() => setMostrarMigracaoNovoModeloModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white rounded-lg shadow-md transition-all transform hover:scale-105"
                title="Migrar usuários para novo modelo (status, menuConfig, etc)"
              >
                <Activity className="w-5 h-5" />
                <span className="hidden md:inline font-medium">
                  Atualizar Modelo de Usuários
                </span>
                <span className="md:hidden font-medium">
                  Atualizar
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Alerta de Admin */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-3">
          <Shield className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
              Painel Administrativo
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Esta página contém informações sensíveis do sistema e está visível apenas para você como administrador.
            </p>
          </div>
        </div>

        {/* Estatísticas Gerais */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={24} className="text-blue-600" />
            Estatísticas Gerais
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatCard 
              icon={Users} 
              label="Funcionários" 
              value={stats.funcionarios} 
              color="blue" 
            />
            <StatCard 
              icon={Building2} 
              label="Empresas" 
              value={stats.empresas} 
              color="purple" 
            />
            <StatCard 
              icon={Package} 
              label="Itens no Inventário" 
              value={stats.itensInventario} 
              color="green" 
            />
            <StatCard 
              icon={MessageSquare} 
              label="Mensagens Enviadas" 
              value={stats.mensagens} 
              color="cyan" 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              icon={CheckSquare} 
              label="Tarefas Totais" 
              value={stats.tarefas} 
              color="orange" 
            />
            <StatCard 
              icon={TrendingUp} 
              label="Taxa de Conclusão" 
              value={taxaConclusaoTarefas} 
              color="green"
              suffix="%" 
            />
            <StatCard 
              icon={Activity} 
              label="Empréstimos Ativos" 
              value={stats.emprestimosAtivos} 
              color="red" 
            />
            <StatCard 
              icon={Trophy} 
              label="Avaliações" 
              value={stats.avaliacoes} 
              color="yellow" 
            />
          </div>
        </div>

        {/* Módulos do Sistema */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Server size={24} className="text-purple-600" />
            Módulos Implementados
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {modulosAtivos.map((modulo, idx) => (
              <ModuloCard key={idx} modulo={modulo} />
            ))}
          </div>
        </div>

        {/* Informações Técnicas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Globe size={24} className="text-green-600" />
            Informações Técnicas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Stack Tecnológica:
              </h3>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• React 18+ com Hooks</li>
                <li>• Firebase (Firestore + Auth)</li>
                <li>• Tailwind CSS</li>
                <li>• IndexedDB para cache offline</li>
                <li>• Service Workers (PWA)</li>
                <li>• Web Bluetooth API</li>
                <li>• Lucide React (Icons)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Integrações:
              </h3>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Firebase Firestore
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Firebase Authentication
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  IndexedDB Local
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  Web Bluetooth (Beta)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Push Notifications
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock size={16} />
              Última atualização: {new Date().toLocaleString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Workflow Sistema de Gestão v2.0</p>
          <p className="mt-1">© 2025 - Todos os direitos reservados</p>
        </div>
      </div>

      {/* Modal Customizado */}
      <CustomModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        showCancel={modalState.showCancel}
        onConfirm={handleConfirm}
        onClose={handleCancel}
      />

      {/* Modal de Migração de Usuários */}
      {mostrarMigracaoModal && (
        <MigracaoUsuariosModal 
          onClose={() => setMostrarMigracaoModal(false)}
        />
      )}

      {/* Modal de Exportação de Usuários para Funcionários */}
      {mostrarExportacaoModal && (
        <ExportacaoUsuariosModal 
          onClose={() => setMostrarExportacaoModal(false)}
        />
      )}

      {/* Modal de Migração para Novo Modelo */}
      {mostrarMigracaoNovoModeloModal && (
        <MigracaoUsuariosNovoModeloModal 
          onClose={() => setMostrarMigracaoNovoModeloModal(false)}
        />
      )}
    </div>
  );
};

export default SistemaResumo;
