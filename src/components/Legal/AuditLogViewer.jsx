import React, { useState, useEffect } from 'react';
import { auditService } from '../../services/auditService';
import { Activity, Filter, Search, Calendar } from 'lucide-react';

const AuditLogViewer = ({ usuario }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    operation: ''
  });

  const categories = [
    'loan_management',
    'tool_management',
    'authentication',
    'legal_documents',
    'data_privacy'
  ];

  const operations = [
    'create_loan',
    'return_tools',
    'transfer_tools',
    'sign_responsibility_term',
    'system_access'
  ];

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const logData = await auditService.getOperationLogs(filters);
      setLogs(logData);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-gray-500 dark:text-gray-400 text-sm mb-1">Data Inicial</label>
          <input
            type="date"
            className="w-full bg-[#22303C] border border-gray-200 dark:border-gray-600 dark:border-gray-600 rounded p-2 text-white"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-gray-500 dark:text-gray-400 text-sm mb-1">Data Final</label>
          <input
            type="date"
            className="w-full bg-[#22303C] border border-gray-200 dark:border-gray-600 dark:border-gray-600 rounded p-2 text-white"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-gray-500 dark:text-gray-400 text-sm mb-1">Categoria</label>
          <select
            className="w-full bg-[#22303C] border border-gray-200 dark:border-gray-600 dark:border-gray-600 rounded p-2 text-white"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">Todas</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-500 dark:text-gray-400 text-sm mb-1">Operação</label>
          <select
            className="w-full bg-[#22303C] border border-gray-200 dark:border-gray-600 dark:border-gray-600 rounded p-2 text-white"
            value={filters.operation}
            onChange={(e) => setFilters({ ...filters, operation: e.target.value })}
          >
            <option value="">Todas</option>
            {operations.map(op => (
              <option key={op} value={op}>
                {op.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Activity className="w-8 h-8 animate-spin mx-auto text-blue-500 dark:text-[#1D9BF0] mb-2" />
          <p className="text-gray-500 dark:text-gray-400">Carregando logs...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="bg-[#22303C] p-4 rounded-lg border border-gray-200 dark:border-gray-600 dark:border-gray-600">
              <div className="flex justify-between items-start mb-2">
                <span className="text-blue-500 dark:text-[#1D9BF0] font-medium">{log.operation}</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-white mb-1">{log.details}</p>
              <div className="flex space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span>Categoria: {log.category}</span>
                <span>Usuário: {log.userId}</span>
                {log.ipAddress && <span>IP: {log.ipAddress}</span>}
              </div>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="text-center py-8">
              <Search className="w-12 h-12 mx-auto text-gray-500 dark:text-gray-400 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Nenhum log encontrado para os filtros selecionados.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer;

