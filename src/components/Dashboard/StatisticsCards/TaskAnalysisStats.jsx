import React from 'react';
import { Users, Activity } from 'lucide-react';

const TaskAnalysisStats = ({ emprestimos, funcionarios }) => {
  // Análise de tarefas repetidas
  const taskStats = emprestimos.reduce((acc, emp) => {
    if (emp.tarefa) {
      const tarefaKey = emp.tarefa.toLowerCase().trim();
      if (!acc[tarefaKey]) {
        acc[tarefaKey] = {
          count: 0,
          funcionarios: {},
          nome: emp.tarefa
        };
      }
      acc[tarefaKey].count += 1;
      acc[tarefaKey].funcionarios[emp.funcionarioId] = (acc[tarefaKey].funcionarios[emp.funcionarioId] || 0) + 1;
    }
    return acc;
  }, {});

  // Ordenar tarefas por frequência
  const sortedTasks = Object.values(taskStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Encontrar os funcionários mais ativos por tarefa
  const topWorkers = sortedTasks.map(task => {
    const topFuncionarios = Object.entries(task.funcionarios)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([funcionarioId, count]) => ({
        funcionario: funcionarios.find(f => f.id === funcionarioId)?.nome || 'Funcionário Removido',
        count
      }));

    return {
      ...task,
      topFuncionarios
    };
  });

  return (
    <div className="bg-gray-200 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600 dark:border-gray-600 hover:border-blue-500 dark:hover:border-[#1D9BF0] transition-colors">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-blue-500 dark:text-[#1D9BF0]" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Análise de Tarefas</h3>
      </div>

      <div className="space-y-6">
        {topWorkers.map((task, index) => (
          <div key={index} className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-gray-500 dark:text-gray-400 font-medium">{task.nome}</h4>
              <span className="text-white bg-blue-500 dark:bg-[#1D9BF0]/20 px-2 py-1 rounded-full text-sm">
                {task.count}x realizadas
              </span>
            </div>
            
            <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-600 dark:border-gray-600 space-y-2">
              {task.topFuncionarios.map((func, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500 dark:text-[#1D9BF0]" />
                  <span className="text-gray-500 dark:text-gray-400 text-sm">{func.funcionario}</span>
                  <span className="text-white text-sm">({func.count}x)</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskAnalysisStats;

