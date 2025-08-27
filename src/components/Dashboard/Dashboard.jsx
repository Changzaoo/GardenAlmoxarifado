import React from 'react';
import { Package, Users, AlertTriangle, ShoppingCart } from 'lucide-react';

const Dashboard = ({ stats = {} }) => {
  const { 
    inventario = [],
    emprestimos = [],
    funcionarios = [],
    ferramentasDanificadas = [],
    ferramentasPerdidas = [],
    compras = []
  } = stats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
            <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Inventário</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{inventario.length || 0}</p>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded">
            <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Funcionários</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{funcionarios.length || 0}</p>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded">
            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Danificadas</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{ferramentasDanificadas.length || 0}</p>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded">
            <ShoppingCart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Compras</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{compras.length || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;