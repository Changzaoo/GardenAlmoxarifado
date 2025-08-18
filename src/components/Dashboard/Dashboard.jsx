import React from 'react';

const Dashboard = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">
          {stats.emprestimosAtivos}
        </div>
        <div className="text-sm text-blue-700">Empréstimos Ativos</div>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-green-600">
          {stats.itensDisponiveis}
        </div>
        <div className="text-sm text-green-700">Itens Disponíveis</div>
      </div>
      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-yellow-600">
          {stats.itensEmUso}
        </div>
        <div className="text-sm text-yellow-700">Itens em Uso</div>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-purple-600">
          {stats.totalItens}
        </div>
        <div className="text-sm text-purple-700">Total de Itens</div>
      </div>
    </div>
  );
};

export default Dashboard;