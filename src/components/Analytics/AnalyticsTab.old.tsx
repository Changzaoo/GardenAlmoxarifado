import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  BarChart3,
  Clock,
  Users,
  Activity,
  Timer,
  CheckSquare,
  AlertCircle,
} from 'lucide-react';
import { useEmprestimos } from '../../hooks/useEmprestimos';
import { useFerramentasAnalytics } from '../../hooks/useFerramentasAnalytics';


const AnalyticsCard = ({ title, value, icon: Icon, changeType = 'positive' }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700/20">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${
          changeType === 'positive' ? 'bg-green-100 dark:bg-green-900' : 
          changeType === 'negative' ? 'bg-red-100 dark:bg-red-900' : 
          'bg-blue-100 dark:bg-blue-900'
        }`}>
          <Icon className={`w-6 h-6 ${
            changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 
            changeType === 'negative' ? 'text-red-600 dark:text-red-400' : 
            'text-blue-600 dark:text-blue-400'
          }`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
      {change && (
        <div className={`flex items-center ${
          changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 
          'text-red-600 dark:text-red-400'
        }`}>
          {changeType === 'positive' ? (
            <ArrowUpRight className="w-4 h-4 mr-1" />
          ) : (
            <ArrowDownRight className="w-4 h-4 mr-1" />
          )}
          <span className="text-sm font-medium">{change}%</span>
        </div>
      )}
    </div>
  </div>
);

const AnalyticsTab = () => {
  const { emprestimos } = useEmprestimos();
  const { funcionariosRanking, ferramentasRanking } = useFerramentasAnalytics();
  const [userMetrics, setUserMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    averageSessionTime: 0,
    newUsers: 0
  });

  const [emprestimosMetrics, setEmprestimosMetrics] = useState({
    totalEmprestimos: 0,
    emprestimosAtivos: 0,
    emprestimosDevolvidos: 0,
    mediaTempoEmprestimo: 0,
    topFerramentas: [],
    emprestimosAtrasados: 0
  });

  useEffect(() => {
    if (!emprestimos || emprestimos.length === 0) return;

    const hoje = new Date();
    const emprestimosAtivos = emprestimos.filter(e => e.status === 'emprestado');
    const emprestimosDevolvidos = emprestimos.filter(e => e.status === 'devolvido');
    
    // Calcula média de tempo de empréstimo em dias
    const temposEmprestimo = emprestimosDevolvidos.map(emp => {
      const inicio = new Date(emp.dataEmprestimo);
      const fim = new Date(emp.dataDevolucao);
      return Math.floor((fim - inicio) / (1000 * 60 * 60 * 24));
    });

    const mediaTempoEmprestimo = temposEmprestimo.length 
      ? Math.round(temposEmprestimo.reduce((a, b) => a + b, 0) / temposEmprestimo.length)
      : 0;

    // Conta empréstimos atrasados
    const emprestimosAtrasados = emprestimosAtivos.filter(emp => {
      if (!emp.dataPrevista) return false;
      const dataPrevista = new Date(emp.dataPrevista);
      return dataPrevista < hoje;
    }).length;

    setEmprestimosMetrics({
      totalEmprestimos: emprestimos.length,
      emprestimosAtivos: emprestimosAtivos.length,
      emprestimosDevolvidos: emprestimosDevolvidos.length,
      mediaTempoEmprestimo,
      topFerramentas: ferramentasRanking.slice(0, 5),
      emprestimosAtrasados
    });

    // Atualiza métricas de usuários
    const usuariosUnicos = new Set(emprestimos.map(e => e.nomeFuncionario || e.colaborador)).size;
    const usuariosAtivos = new Set(
      emprestimosAtivos.map(e => e.nomeFuncionario || e.colaborador)
    ).size;

    setUserMetrics({
      totalUsers: usuariosUnicos,
      activeUsers: usuariosAtivos,
      averageSessionTime: mediaTempoEmprestimo,
      newUsers: funcionariosRanking.filter(f => f.frequencia === 1).length
    });
  }, [emprestimos, funcionariosRanking, ferramentasRanking]);

  const [locationData, setLocationData] = useState({
    topLocations: [],
    totalCountries: 0
  });

  const [timeStats, setTimeStats] = useState({
    peakHours: [],
    avgResponseTime: 0,
    loadTime: 0
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Simulação de dados - em produção, você buscaria do Firestore
        setUserMetrics({
          totalUsers: 1250,
          activeUsers: 847,
          averageSessionTime: 25,
          newUsers: 127
        });

        setEngagementMetrics({
          searchCount: 3456,
          messagesSent: 12890,
          tasksCompleted: 789,
          errorRate: 1.2
        });

        setDeviceStats({
          desktop: 65,
          mobile: 35,
          browserStats: {
            chrome: 68,
            firefox: 15,
            safari: 12,
            other: 5
          }
        });

        setLocationData({
          topLocations: [
            { city: 'São Paulo', users: 450 },
            { city: 'Rio de Janeiro', users: 320 },
            { city: 'Belo Horizonte', users: 180 }
          ],
          totalCountries: 5
        });

        setTimeStats({
          peakHours: [14, 15, 16], // 14h, 15h, 16h
          avgResponseTime: 2.3,
          loadTime: 1.2
        });

      } catch (error) {
        console.error('Erro ao buscar analytics:', error);
      }
    };

    fetchAnalytics();
  }, []);

  const [locationData, setLocationData] = useState({
    topLocations: [],
    totalCountries: 0
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-5">
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
          Estatísticas do Sistema
        </h3>
        <p className="mt-2 max-w-4xl text-sm text-gray-500 dark:text-gray-400">
          Métricas detalhadas sobre empréstimos e usuários.
        </p>
      </div>

      {/* Métricas de Usuários */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-900 dark:text-white">Métricas de Usuários</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalyticsCard
            title="Total de Usuários"
            value={userMetrics.totalUsers}
            icon={Users}
          />
          <AnalyticsCard
            title="Usuários Ativos"
            value={userMetrics.activeUsers}
            icon={Activity}
          />
          <AnalyticsCard
            title="Média de Dias por Empréstimo"
            value={`${userMetrics.averageSessionTime} dias`}
            icon={Timer}
          />
          <AnalyticsCard
            title="Novos Usuários"
            value={userMetrics.newUsers}
            icon={UserPlus}
          />
        </div>
      </div>

      {/* Métricas de Empréstimos */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-900 dark:text-white">Métricas de Empréstimos</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalyticsCard
            title="Total de Empréstimos"
            value={emprestimosMetrics.totalEmprestimos}
            icon={BarChart3}
            changeType="positive"
          />
          <AnalyticsCard
            title="Empréstimos Ativos"
            value={emprestimosMetrics.emprestimosAtivos}
            icon={Clock}
            changeType={emprestimosMetrics.emprestimosAtrasados > 0 ? "negative" : "positive"}
          />
          <AnalyticsCard
            title="Empréstimos Devolvidos"
            value={emprestimosMetrics.emprestimosDevolvidos}
            icon={CheckSquare}
            changeType="positive"
          />
          <AnalyticsCard
            title="Empréstimos Atrasados"
            value={emprestimosMetrics.emprestimosAtrasados}
            icon={AlertCircle}
            changeType="negative"
          />
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Ferramentas */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top 5 Ferramentas Mais Emprestadas</h3>
          <div className="space-y-4">
            {emprestimosMetrics.topFerramentas.map((ferramenta, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{ferramenta.nome}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{ferramenta.frequencia} vezes</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${(ferramenta.frequencia / emprestimosMetrics.topFerramentas[0].frequencia) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Top Usuários */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top 5 Usuários Mais Ativos</h3>
          <div className="space-y-4">
            {funcionariosRanking.slice(0, 5).map((funcionario, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{funcionario.nome}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{funcionario.frequencia} empréstimos</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: `${(funcionario.frequencia / funcionariosRanking[0].frequencia) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
              {locationData.topLocations.map((location, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">{location.city}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {location.users} usuários
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700/20">
            <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Estatísticas de Navegador</h5>
            <div className="space-y-3">
              {Object.entries(deviceStats.browserStats).map(([browser, percentage]) => (
                <div key={browser} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {browser === 'chrome' && <Chrome className="w-4 h-4 text-gray-400" />}
                    {browser === 'firefox' && <Firefox className="w-4 h-4 text-gray-400" />}
                    {browser === 'safari' && <Safari className="w-4 h-4 text-gray-400" />}
                    {browser === 'other' && <Globe className="w-4 h-4 text-gray-400" />}
                    <span className="text-sm text-gray-900 dark:text-white capitalize">{browser}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
