/**
 * Exemplo Prático: Dashboard Otimizado
 * 
 * Este componente demonstra o uso do sistema de carregamento rápido
 * em um dashboard real com múltiplas coleções
 */

import React, { useMemo } from 'react';
import { useFastCollections, usePreloadData } from '../../hooks/useFastData';
import { useAuth } from '../../hooks/useAuth';
import { query, where, collection, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const DashboardOtimizado = () => {
  const { usuario } = useAuth();

  // ⚡ PRÉ-CARREGAMENTO: Dados que provavelmente serão necessários
  usePreloadData([
    { name: 'usuarios' },
    { name: 'configuracoes' }
  ]);

  // ⚡ CARREGAMENTO PARALELO: Todas as coleções necessárias
  const { data, loading, error, reload, stats } = useFastCollections([
    {
      name: 'funcionarios',
      query: usuario.setorId 
        ? query(
            collection(db, 'funcionarios'),
            where('setorId', '==', usuario.setorId),
            where('ativo', '==', true)
          )
        : query(collection(db, 'funcionarios'), where('ativo', '==', true)),
      transform: (funcionarios) => {
        // Adicionar estatísticas calculadas
        return {
          lista: funcionarios,
          total: funcionarios.length,
          comPontos: funcionarios.filter(f => (f.pontos || 0) > 0).length,
          semPontos: funcionarios.filter(f => (f.pontos || 0) === 0).length
        };
      }
    },
    {
      name: 'setores',
      query: query(collection(db, 'setores'))
    },
    {
      name: 'tarefas',
      query: usuario.setorId
        ? query(
            collection(db, 'tarefas'),
            where('setorId', '==', usuario.setorId),
            where('status', 'in', ['pendente', 'em_andamento'])
          )
        : query(
            collection(db, 'tarefas'),
            where('status', 'in', ['pendente', 'em_andamento'])
          ),
      transform: (tarefas) => {
        const agora = new Date();
        return {
          total: tarefas.length,
          pendentes: tarefas.filter(t => t.status === 'pendente').length,
          emAndamento: tarefas.filter(t => t.status === 'em_andamento').length,
          atrasadas: tarefas.filter(t => {
            return t.prazo && new Date(t.prazo.toDate()) < agora;
          }).length,
          urgentes: tarefas.filter(t => t.prioridade === 'alta').length
        };
      }
    },
    {
      name: 'emprestimos',
      query: usuario.setorId
        ? query(
            collection(db, 'emprestimos'),
            where('setorId', '==', usuario.setorId),
            where('status', '==', 'ativo'),
            orderBy('dataEmprestimo', 'desc'),
            limit(10)
          )
        : query(
            collection(db, 'emprestimos'),
            where('status', '==', 'ativo'),
            orderBy('dataEmprestimo', 'desc'),
            limit(10)
          ),
      transform: (emprestimos) => {
        const agora = new Date();
        return {
          lista: emprestimos,
          total: emprestimos.length,
          atrasados: emprestimos.filter(e => {
            return e.dataDevolucao && new Date(e.dataDevolucao.toDate()) < agora;
          }).length
        };
      }
    },
    {
      name: 'ferramentas',
      query: query(collection(db, 'ferramentas')),
      transform: (ferramentas) => {
        return {
          total: ferramentas.length,
          disponiveis: ferramentas.filter(f => f.status === 'disponivel').length,
          emprestadas: ferramentas.filter(f => f.status === 'emprestada').length,
          manutencao: ferramentas.filter(f => f.status === 'manutencao').length,
          perdidas: ferramentas.filter(f => f.status === 'perdida').length
        };
      }
    }
  ], {
    useCache: true,
    cacheTTL: 3 * 60 * 1000 // 3 minutos
  });

  // Calcular métricas derivadas
  const metrics = useMemo(() => {
    if (!data.funcionarios || !data.setores) return null;

    return {
      produtividade: {
        mediaAtividade: data.funcionarios.total > 0
          ? ((data.funcionarios.comPontos / data.funcionarios.total) * 100).toFixed(1)
          : 0,
        tarefasPorFuncionario: data.funcionarios.total > 0
          ? (data.tarefas?.total / data.funcionarios.total).toFixed(1)
          : 0
      },
      alertas: {
        tarefasAtrasadas: data.tarefas?.atrasadas || 0,
        emprestimosAtrasados: data.emprestimos?.atrasados || 0,
        ferramentasPerdidas: data.ferramentas?.perdidas || 0
      }
    };
  }, [data]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        {/* Loading Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Erro ao carregar dados</h3>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
          <button
            onClick={() => reload(true)}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            🔄 Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header com Stats de Performance */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Bem-vindo, {usuario.nome}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Performance Stats */}
          {stats && (
            <div className="text-xs text-gray-500 bg-gray-100 rounded px-3 py-2">
              ⚡ Carregado em {stats.totalLoadTime}ms
              <span className="mx-2">|</span>
              📦 {stats.fromCache} do cache
              <span className="mx-2">|</span>
              🔥 {stats.fromFirestore} do Firestore
            </div>
          )}
          
          <button
            onClick={() => reload(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            🔄 Atualizar
          </button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Funcionários */}
        <StatCard
          title="Funcionários Ativos"
          value={data.funcionarios?.total || 0}
          subtitle={`${data.funcionarios?.comPontos || 0} com atividade`}
          icon="👥"
          color="blue"
        />

        {/* Tarefas */}
        <StatCard
          title="Tarefas Pendentes"
          value={data.tarefas?.total || 0}
          subtitle={`${data.tarefas?.urgentes || 0} urgentes, ${data.tarefas?.atrasadas || 0} atrasadas`}
          icon="📋"
          color="yellow"
          alert={data.tarefas?.atrasadas > 0}
        />

        {/* Empréstimos */}
        <StatCard
          title="Empréstimos Ativos"
          value={data.emprestimos?.total || 0}
          subtitle={`${data.emprestimos?.atrasados || 0} atrasados`}
          icon="🔧"
          color="green"
          alert={data.emprestimos?.atrasados > 0}
        />

        {/* Ferramentas */}
        <StatCard
          title="Ferramentas Disponíveis"
          value={data.ferramentas?.disponiveis || 0}
          subtitle={`${data.ferramentas?.total || 0} total`}
          icon="⚒️"
          color="purple"
        />
      </div>

      {/* Métricas de Produtividade */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Taxa de Atividade"
            value={`${metrics.produtividade.mediaAtividade}%`}
            description="Funcionários com pontos registrados"
          />
          <MetricCard
            title="Tarefas por Funcionário"
            value={metrics.produtividade.tarefasPorFuncionario}
            description="Média de tarefas por pessoa"
          />
          <MetricCard
            title="Alertas Ativos"
            value={
              metrics.alertas.tarefasAtrasadas +
              metrics.alertas.emprestimosAtrasados +
              metrics.alertas.ferramentasPerdidas
            }
            description="Itens que requerem atenção"
            alert={metrics.alertas.tarefasAtrasadas > 0}
          />
        </div>
      )}

      {/* Tabela de Empréstimos Recentes */}
      {data.emprestimos?.lista && data.emprestimos.lista.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Empréstimos Recentes
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {data.emprestimos.lista.slice(0, 5).map(emprestimo => (
                <div
                  key={emprestimo.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded hover:bg-gray-100"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {emprestimo.ferramentaNome || emprestimo.ferramentaId}
                    </p>
                    <p className="text-sm text-gray-500">
                      {emprestimo.funcionarioNome || emprestimo.funcionarioId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {emprestimo.dataEmprestimo?.toDate().toLocaleDateString()}
                    </p>
                    {emprestimo.dataDevolucao && (
                      <p className="text-xs text-gray-500">
                        Devolução: {emprestimo.dataDevolucao.toDate().toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de Card de Estatística
const StatCard = ({ title, value, subtitle, icon, color = 'blue', alert = false }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600'
  };

  const borderColor = alert ? 'border-red-300' : 'border-gray-200';

  return (
    <div className={`bg-white rounded-lg shadow border-2 ${borderColor} p-6`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`${colorClasses[color]} rounded-full p-3`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
};

// Componente de Card de Métrica
const MetricCard = ({ title, value, description, alert = false }) => {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${alert ? 'border-l-4 border-red-500' : ''}`}>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      {description && (
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      )}
    </div>
  );
};

export default DashboardOtimizado;
