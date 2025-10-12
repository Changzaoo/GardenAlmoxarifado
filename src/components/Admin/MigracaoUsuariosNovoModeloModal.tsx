import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  ArrowRight,
  Database,
  Eye,
  Play,
  X
} from 'lucide-react';
import { 
  verificarStatusMigracaoUsuarios,
  executarMigracaoUsuarios
} from '../../utils/migrarUsuariosNovoModelo';

const MigracaoUsuariosNovoModeloModal = ({ onClose }) => {
  const [etapa, setEtapa] = useState('verificacao'); // verificacao, confirmacao, executando, resultado
  const [statusVerificacao, setStatusVerificacao] = useState(null);
  const [resultadoMigracao, setResultadoMigracao] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [modoSimulacao, setModoSimulacao] = useState(false);
  const [erro, setErro] = useState(null);

  // Verificar status ao montar o componente
  useEffect(() => {
    verificarStatus();
  }, []);

  const verificarStatus = async () => {
    setCarregando(true);
    setErro(null);
    
    try {
      const resultado = await verificarStatusMigracaoUsuarios();
      
      if (resultado.sucesso) {
        setStatusVerificacao(resultado);
        if (!resultado.precisaMigrar) {
          setEtapa('resultado');
          setResultadoMigracao({
            sucesso: true,
            resultados: {
              total: resultado.estatisticas.total,
              sucesso: resultado.estatisticas.comModeloCompleto,
              pulos: 0,
              erros: 0
            },
            simulacao: false,
            mensagem: 'Todos os usuários já estão no modelo correto!'
          });
        }
      } else {
        setErro(resultado.erro);
      }
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  };

  const executarMigracao = async () => {
    setEtapa('executando');
    setCarregando(true);
    setErro(null);
    
    try {
      const resultado = await executarMigracaoUsuarios({
        apenasSimular: modoSimulacao
      });
      
      if (resultado.sucesso) {
        setResultadoMigracao(resultado);
        setEtapa('resultado');
      } else {
        setErro(resultado.erro);
        setEtapa('confirmacao');
      }
    } catch (error) {
      setErro(error.message);
      setEtapa('confirmacao');
    } finally {
      setCarregando(false);
    }
  };

  const renderVerificacao = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Migração para Novo Modelo de Usuário
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Atualiza todos os usuários com os novos campos do sistema
        </p>
      </div>

      {carregando && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      )}

      {erro && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900 dark:text-red-200">Erro ao verificar status</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{erro}</p>
            </div>
          </div>
        </div>
      )}

      {statusVerificacao && !carregando && (
        <>
          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {statusVerificacao.estatisticas.total}
                </span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">Total de Usuários</p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {statusVerificacao.estatisticas.comModeloCompleto}
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-2">Já Atualizados</p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {statusVerificacao.estatisticas.precisamMigracao}
                </span>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-2">Precisam Migração</p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Object.keys(statusVerificacao.estatisticas.camposFaltando).length}
                </span>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">Campos Diferentes</p>
            </div>
          </div>

          {/* Campos faltando */}
          {Object.keys(statusVerificacao.estatisticas.camposFaltando).length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Campos que serão adicionados:
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(statusVerificacao.estatisticas.camposFaltando).map(([campo, quantidade]) => (
                  <div key={campo} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300 font-mono">{campo}</span>
                    <span className="text-gray-500 dark:text-gray-400">{quantidade} usuário(s)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Usuários a migrar */}
          {statusVerificacao.usuariosParaMigrar.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Usuários que serão atualizados:
              </h4>
              <div className="space-y-2">
                {statusVerificacao.usuariosParaMigrar.map(usuario => (
                  <div key={usuario.id} className="flex items-start gap-2 text-sm bg-white dark:bg-gray-900 rounded p-2">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{usuario.nome}</p>
                      <p className="text-gray-600 dark:text-gray-400 truncate text-xs">{usuario.email}</p>
                      <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                        {usuario.camposFaltando.length} campo(s) faltando
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3">
            {statusVerificacao.precisaMigrar ? (
              <>
                <button
                  onClick={() => {
                    setModoSimulacao(true);
                    setEtapa('confirmacao');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  <Eye className="w-5 h-5" />
                  Simular Migração
                </button>
                <button
                  onClick={() => {
                    setModoSimulacao(false);
                    setEtapa('confirmacao');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-md"
                >
                  <ArrowRight className="w-5 h-5" />
                  Continuar
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                Tudo Certo!
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );

  const renderConfirmacao = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className={`w-16 h-16 ${modoSimulacao ? 'bg-gray-100 dark:bg-gray-700' : 'bg-orange-100 dark:bg-orange-900/30'} rounded-full flex items-center justify-center mx-auto mb-4`}>
          {modoSimulacao ? (
            <Eye className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          )}
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {modoSimulacao ? 'Simular Migração' : 'Confirmar Migração'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {modoSimulacao 
            ? 'Nenhuma alteração será salva no banco de dados'
            : 'Esta ação irá atualizar os usuários no banco de dados'
          }
        </p>
      </div>

      <div className={`${modoSimulacao ? 'bg-gray-50 dark:bg-gray-800' : 'bg-orange-50 dark:bg-orange-900/20'} border ${modoSimulacao ? 'border-gray-200 dark:border-gray-700' : 'border-orange-200 dark:border-orange-800'} rounded-lg p-4`}>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
          {modoSimulacao ? 'Modo de Simulação' : 'O que será feito:'}
        </h4>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <span>Adicionar campo <strong>status</strong> (online/offline)</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <span>Adicionar campo <strong>ultimaVez</strong> (timestamp)</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <span>Adicionar campo <strong>itemFavorito</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <span>Adicionar campo <strong>menuConfig</strong> (configuração de menu)</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <span>Configurar menu baseado no nível de permissão</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <span>Preservar todos os dados existentes</span>
          </li>
        </ul>
      </div>

      {erro && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900 dark:text-red-200">Erro</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{erro}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setEtapa('verificacao')}
          disabled={carregando}
          className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          Voltar
        </button>
        <button
          onClick={executarMigracao}
          disabled={carregando}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 ${modoSimulacao ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700'} text-white rounded-lg font-medium transition-all shadow-md disabled:opacity-50`}
        >
          {carregando ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          {modoSimulacao ? 'Simular' : 'Executar Migração'}
        </button>
      </div>
    </div>
  );

  const renderExecutando = () => (
    <div className="py-12 text-center">
      <RefreshCw className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {modoSimulacao ? 'Simulando Migração...' : 'Executando Migração...'}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Processando usuários, por favor aguarde...
      </p>
    </div>
  );

  const renderResultado = () => {
    const resultado = resultadoMigracao?.resultados || {};
    const simulacao = resultadoMigracao?.simulacao;
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {simulacao ? 'Simulação Concluída!' : 'Migração Concluída!'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {resultadoMigracao?.mensagem || (simulacao 
              ? 'Nenhuma alteração foi feita no banco de dados'
              : 'Todos os usuários foram atualizados com sucesso'
            )}
          </p>
        </div>

        {/* Estatísticas do resultado */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {resultado.total || 0}
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Total Processados</p>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {resultado.sucesso || 0}
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {simulacao ? 'Seriam Migrados' : 'Migrados'}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                {resultado.pulos || 0}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Já Atualizados</p>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {resultado.erros || 0}
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">Erros</p>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          {simulacao && (
            <button
              onClick={() => {
                setModoSimulacao(false);
                setEtapa('confirmacao');
              }}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-md"
            >
              Executar Migração Real
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Migração de Usuários
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {etapa === 'verificacao' && renderVerificacao()}
          {etapa === 'confirmacao' && renderConfirmacao()}
          {etapa === 'executando' && renderExecutando()}
          {etapa === 'resultado' && renderResultado()}
        </div>
      </div>
    </div>
  );
};

export default MigracaoUsuariosNovoModeloModal;
