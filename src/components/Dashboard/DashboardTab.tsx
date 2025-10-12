import React from 'react';
import { BarChart3, Users, Wrench, AlertTriangle, AlertCircle, ShoppingCart, CheckCircle } from 'lucide-react';
import ToolUsageStats from './StatisticsCards/ToolUsageStats';
import TimeAnalysisStats from './StatisticsCards/TimeAnalysisStats';
import TaskAnalysisStats from './StatisticsCards/TaskAnalysisStats';

const DashboardCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-4 hover:border-blue-500 dark:hover:border-[#1D9BF0] transition-colors">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color || 'bg-blue-500/10 dark:bg-[#1D9BF0]/10'}`}>
        <Icon className={`w-6 h-6 ${color ? 'text-white' : 'text-blue-500 dark:text-[#1D9BF0]'}`} />
      </div>
      <div>
        <h3 className="text-sm text-gray-900 dark:text-gray-300 font-medium">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  </div>
);

const DashboardTab = ({ stats }) => {
  // Calcular estatísticas
  const totalFerramentas = stats.inventario.length;
  const totalFuncionarios = stats.funcionarios.length;
  const emprestimosAtivos = stats.emprestimos.filter(emp => emp.status === 'emprestado').length;
  const ferramentasDanificadas = stats.ferramentasDanificadas.length;
  const ferramentasPerdidas = stats.ferramentasPerdidas.length;
  const comprasPendentes = stats.compras.filter(comp => comp.status === 'pendente').length;
  const comprasConcluidas = stats.compras.filter(comp => comp.status === 'concluida').length;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardCard
          title="Total de Ferramentas"
          value={totalFerramentas}
          icon={Wrench}
        />
        
        <DashboardCard
          title="Funcionários Ativos"
          value={totalFuncionarios}
          icon={Users}
          color="bg-green-500/20"
        />
        
        <DashboardCard
          title="Empréstimos Ativos"
          value={emprestimosAtivos}
          icon={BarChart3}
          color="bg-blue-500/20"
        />

        <DashboardCard
          title="Ferramentas Danificadas"
          value={ferramentasDanificadas}
          icon={AlertTriangle}
          color="bg-yellow-500/20"
        />

        <DashboardCard
          title="Ferramentas Perdidas"
          value={ferramentasPerdidas}
          icon={AlertCircle}
          color="bg-red-500/20"
        />

        <DashboardCard
          title="Compras Pendentes"
          value={comprasPendentes}
          icon={ShoppingCart}
          color="bg-orange-500/20"
        />

        <DashboardCard
          title="Compras Concluídas"
          value={comprasConcluidas}
          icon={CheckCircle}
          color="bg-emerald-500/20"
        />
      </div>

      {/* Análises Detalhadas */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ToolUsageStats 
          emprestimos={stats.emprestimos} 
          inventario={stats.inventario}
        />
        
        <TimeAnalysisStats 
          emprestimos={stats.emprestimos}
        />
        
        <TaskAnalysisStats 
          emprestimos={stats.emprestimos}
          funcionarios={stats.funcionarios}
        />
      </div>
    </div>
  );
};

export default DashboardTab;

