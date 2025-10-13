import React, { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  Trash2,
  Info,
  PlayCircle
} from 'lucide-react';
import {
  verificarStatusMigracao,
  migrarUsuariosParaUsuario,
  sincronizarColecoes,
  compararColecoes
} from '../../utils/migrarColecaoUsuarios';

const MigracaoUsuariosModal = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [comparacao, setComparacao] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [etapa, setEtapa] = useState('verificacao'); // verificacao, confirmacao, resultado

  // Carregar status ao abrir modal
  useEffect(() => {
    carregarStatus();
  }, []);

  const carregarStatus = async () => {
    setLoading(true);
    try {
      const [statusData, comparacaoData] = await Promise.all([
        verificarStatusMigracao(),
        compararColecoes()
      ]);
      setStatus(statusData);
      setComparacao(comparacaoData);
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    } finally {
      setLoading(false);
    }
  };

  const executarMigracao = async (apagarAntiga = false) => {
    setLoading(true);
    setEtapa('executando');
    
    try {
      const resultado = await migrarUsuariosParaUsuario(apagarAntiga);
      setResultado(resultado);
      setEtapa('resultado');
      
      // Recarregar status
      await carregarStatus();
    } catch (error) {
      setResultado({
        sucesso: false,
        mensagem: `Erro: ${error.message}`
      });
      setEtapa('resultado');
    } finally {
      setLoading(false);
    }
  };

  const executarSincronizacao = async () => {
    setLoading(true);
    
    try {
      const resultado = await sincronizarColecoes();
      setResultado(resultado);
      setEtapa('resultado');
      
      // Recarregar status
      await carregarStatus();
    } catch (error) {
      setResultado({
        sucesso: false,
        mensagem: `Erro: ${error.message}`
      });
      setEtapa('resultado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Migração de Usuários</h2>
                <p className="text-blue-100 text-sm">usuarios → usuario</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && etapa !== 'resultado' ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-300">
                {etapa === 'executando' ? 'Executando migração...' : 'Carregando informações...'}
              </p>
            </div>
          ) : etapa === 'verificacao' && status ? (
            <div className="space-y-6">
              {/* Status Atual */}
              <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-30 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Status Atual das Coleções
                  </h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Coleção Antiga */}
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border-2 border-orange-300 dark:border-orange-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Coleção Antiga
                      </span>
                      <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded-full">
                        LEGADO
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                      usuarios
                    </p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {status.colecaoAntiga.total}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      documentos
                    </p>
                  </div>

                  {/* Coleção Nova */}
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border-2 border-green-300 dark:border-green-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Coleção Nova
                      </span>
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                        ATUAL
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                      usuario
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {status.colecaoNova.total}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      documentos
                    </p>
                  </div>
                </div>

                {/* Comparação */}
                {comparacao && (
                  <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                          Status da Sincronização
                        </p>
                        {comparacao.sincronizado ? (
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-semibold">Sincronizado</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-semibold">Necessita Sincronização</span>
                          </div>
                        )}
                      </div>
                      
                      {comparacao.diferencas.apenasEmUsuarios.length > 0 && (
                        <div className="text-right">
                          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {comparacao.diferencas.apenasEmUsuarios.length}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            usuários não migrados
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Ações Disponíveis */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  Ações Disponíveis
                </h3>

                {/* Sincronizar */}
                {status.colecaoAntiga.total > 0 && (
                  <button
                    onClick={executarSincronizacao}
                    disabled={loading}
                    className="w-full flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-30 hover:bg-blue-100 dark:hover:bg-blue-900 dark:hover:bg-opacity-50 rounded-lg border-2 border-blue-300 dark:border-blue-600 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:rotate-180 transition-transform duration-500" />
                      <div className="text-left">
                        <p className="font-semibold text-gray-800 dark:text-white">
                          Sincronizar Coleções
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Copia novos usuários de "usuarios" para "usuario"
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </button>
                )}

                {/* Migração Completa */}
                {status.colecaoAntiga.total > 0 && (
                  <button
                    onClick={() => setEtapa('confirmacao')}
                    disabled={loading}
                    className="w-full flex items-center justify-between p-4 bg-green-50 dark:bg-green-900 dark:bg-opacity-30 hover:bg-green-100 dark:hover:bg-green-900 dark:hover:bg-opacity-50 rounded-lg border-2 border-green-300 dark:border-green-600 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <PlayCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                      <div className="text-left">
                        <p className="font-semibold text-gray-800 dark:text-white">
                          Migração Completa
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Migra todos os documentos mantendo os IDs
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </button>
                )}
              </div>

              {/* Preview dos Usuários */}
              {status.colecaoAntiga.total > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Usuários na Coleção Antiga ({status.colecaoAntiga.total})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {status.colecaoAntiga.documentos.slice(0, 10).map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded text-sm"
                      >
                        <span className="font-medium text-gray-800 dark:text-white">
                          {doc.nome || doc.email}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">
                          {doc.email}
                        </span>
                      </div>
                    ))}
                    {status.colecaoAntiga.total > 10 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                        + {status.colecaoAntiga.total - 10} usuários...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : etapa === 'confirmacao' ? (
            <div className="space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-30 border-2 border-yellow-300 dark:border-yellow-600 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                      Confirmar Migração Completa
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      Esta ação irá:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                      <li>Copiar todos os {status?.colecaoAntiga.total} documentos de "usuarios"</li>
                      <li>Criar/atualizar documentos em "usuario" (mantendo os mesmos IDs)</li>
                      <li>Preservar todas as referências do sistema</li>
                    </ul>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      A coleção antiga será mantida como backup. Você pode apagá-la manualmente depois.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setEtapa('verificacao')}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => executarMigracao(false)}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <PlayCircle className="w-5 h-5" />
                  Executar Migração
                </button>
              </div>
            </div>
          ) : etapa === 'resultado' && resultado ? (
            <div className="space-y-6">
              {/* Resultado */}
              <div className={`rounded-lg p-6 ${
                resultado.sucesso 
                  ? 'bg-green-50 dark:bg-green-900 dark:bg-opacity-30 border-2 border-green-300 dark:border-green-600'
                  : 'bg-red-50 dark:bg-red-900 dark:bg-opacity-30 border-2 border-red-300 dark:border-red-600'
              }`}>
                <div className="flex items-start gap-3">
                  {resultado.sucesso ? (
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                      {resultado.sucesso ? 'Sucesso!' : 'Atenção'}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {resultado.mensagem}
                    </p>
                    
                    {resultado.migrados > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                          <p className="text-sm text-gray-600 dark:text-gray-300">Migrados</p>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {resultado.migrados}
                          </p>
                        </div>
                        {resultado.erros > 0 && (
                          <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                            <p className="text-sm text-gray-600 dark:text-gray-300">Erros</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                              {resultado.erros}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg font-semibold transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    setEtapa('verificacao');
                    setResultado(null);
                    carregarStatus();
                  }}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Verificar Status
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MigracaoUsuariosModal;
