import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Database,
  Activity,
  Shield,
  FileText,
  Settings,
  Server
} from 'lucide-react';
import BackupMonitoringPage from './BackupMonitoringPage';
import ErrorReportsPage from './ErrorReports/ErrorReportsPage';
import PasswordResetManager from '../components/PasswordReset/PasswordResetManager';

const SystemAdminPage = () => {
  const [abaAtiva, setAbaAtiva] = useState('backup');

  const abas = [
    {
      id: 'backup',
      label: 'Backup & Monitoramento',
      icon: Database,
      description: 'Gerenciamento de backups e sincronização de dados'
    },
    {
      id: 'reset-codes',
      label: 'Códigos de Redefinição',
      icon: Shield,
      description: 'Gerenciamento de códigos de reset de senha'
    },
    {
      id: 'error-reports',
      label: 'Relatórios de Erro',
      icon: FileText,
      description: 'Visualização e análise de erros do sistema'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
            <Settings className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Administração do Sistema
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Backup, Monitoramento, Códigos de Redefinição e Relatórios de Erro
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
        <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700">
          {abas.map((aba) => {
            const Icon = aba.icon;
            const isActive = abaAtiva === aba.id;
            
            return (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id)}
                className={`flex-1 min-w-[200px] relative px-6 py-4 text-left transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-800/50'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {aba.label}
                    </div>
                    <div className={`text-xs mt-0.5 ${
                      isActive
                        ? 'text-blue-600/70 dark:text-blue-400/70'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {aba.description}
                    </div>
                  </div>
                </div>

                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <motion.div
            key={abaAtiva}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {abaAtiva === 'backup' && <BackupMonitoringPage />}
            {abaAtiva === 'reset-codes' && <PasswordResetManager />}
            {abaAtiva === 'error-reports' && <ErrorReportsPage />}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SystemAdminPage;
