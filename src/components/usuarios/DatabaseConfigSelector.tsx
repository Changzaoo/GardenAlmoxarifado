import React, { useState } from 'react';
import { Database, Settings, AlertTriangle, CheckCircle, Info } from 'lucide-react';

/**
 * Componente para configurar qual banco de dados usar para armazenar senhas
 * Permite alternar entre garden-c0b50 (principal) e workflowbr1 (secundário)
 */
const DatabaseConfigSelector = ({ currentDB, onChangeDB }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [selectedDB, setSelectedDB] = useState(currentDB || 'garden-c0b50');

  const databases = [
    {
      id: 'garden-c0b50',
      name: 'Garden C0B50',
      projectId: 'garden-c0b50',
      description: 'Banco de dados principal do sistema',
      status: 'active',
      isPrimary: true,
      collections: ['usuarios', 'funcionarios', 'inventario', 'emprestimos', 'tarefas']
    },
    {
      id: 'workflowbr1',
      name: 'Workflow BR1',
      projectId: 'workflowbr1',
      description: 'Banco de dados secundário (apenas para login)',
      status: 'secondary',
      isPrimary: false,
      collections: ['usuarios']
    }
  ];

  const handleSelectDB = (dbId) => {
    setSelectedDB(dbId);
    if (onChangeDB) {
      onChangeDB(dbId);
    }
    // Salvar preferência no localStorage
    localStorage.setItem('preferred_users_database', dbId);
  };

  const currentDatabase = databases.find(db => db.id === selectedDB) || databases[0];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-2">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Configuração de Banco de Dados
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gerenciar onde os usuários são armazenados
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title={showConfig ? 'Ocultar configurações' : 'Mostrar configurações'}
        >
          <Settings className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${showConfig ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Info Atual */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700/30 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-500 rounded-lg p-1.5 flex-shrink-0">
            <Database className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Banco Atual: {currentDatabase.name}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {currentDatabase.description}
            </p>
            {currentDatabase.isPrimary && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold">
                <CheckCircle className="w-3 h-3" />
                Principal
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alert sobre login */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/30 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-yellow-800 dark:text-yellow-200 font-medium">
              <strong>Atenção:</strong> Durante o login, o sistema tenta primeiro em <code className="bg-yellow-100 dark:bg-yellow-800/30 px-1 rounded">workflowbr1</code>, 
              depois em <code className="bg-yellow-100 dark:bg-yellow-800/30 px-1 rounded">garden-c0b50</code>. 
              A configuração abaixo afeta apenas onde NOVOS usuários são salvos.
            </p>
          </div>
        </div>
      </div>

      {/* Configurações Expandidas */}
      {showConfig && (
        <div className="space-y-3 animate-fadeIn">
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Selecionar Banco de Dados
            </h4>

            <div className="space-y-3">
              {databases.map((db) => (
                <button
                  key={db.id}
                  onClick={() => handleSelectDB(db.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedDB === db.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedDB === db.id 
                        ? 'bg-blue-500' 
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      <Database className={`w-4 h-4 ${
                        selectedDB === db.id 
                          ? 'text-white' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-bold text-gray-900 dark:text-white">
                          {db.name}
                        </h5>
                        {db.isPrimary && (
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold">
                            Principal
                          </span>
                        )}
                        {selectedDB === db.id && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold">
                            Selecionado
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {db.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono">
                            {db.projectId}
                          </code>
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {db.collections.map((col) => (
                          <span 
                            key={col}
                            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs"
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>

                    {selectedDB === db.id && (
                      <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Warning sobre mudança */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-orange-800 dark:text-orange-200">
                  <strong>Importante:</strong> Alterar o banco de dados afeta apenas novos usuários criados. 
                  Usuários existentes permanecerão no banco onde foram criados originalmente.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseConfigSelector;
