import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight,
  UserPlus,
  RefreshCw,
  Info,
  PlayCircle
} from 'lucide-react';
import {
  exportarUsuariosParaFuncionarios,
  verificarStatusExportacao
} from '../../utils/exportarUsuariosParaFuncionarios';

const ExportacaoUsuariosModal = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [etapa, setEtapa] = useState('verificacao'); // verificacao, confirmacao, resultado

  // Carregar status ao abrir modal
  useEffect(() => {
    carregarStatus();
  }, []);

  const carregarStatus = async () => {
    setLoading(true);
    try {
      const statusData = await verificarStatusExportacao();
      setStatus(statusData);
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    } finally {
      setLoading(false);
    }
  };

  const executarExportacao = async (atualizarExistentes = false) => {
    setLoading(true);
    setEtapa('executando');
    
    try {
      const resultado = await exportarUsuariosParaFuncionarios(atualizarExistentes);
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
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-blue-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserPlus className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Exportar Usuários para Funcionários</h2>
                <p className="text-green-100 text-sm">Empresa Zendaya • Setor Jardim</p>
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
              <RefreshCw className="w-12 h-12 text-green-500 animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-300">
                {etapa === 'executando' ? 'Exportando usuários...' : 'Carregando informações...'}
              </p>
            </div>
          ) : etapa === 'verificacao' && status ? (
            <div className="space-y-6">
              {/* Status Atual */}
              <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-30 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Status Atual
                  </h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Usuários */}
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border-2 border-purple-300 dark:border-purple-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Usuários Cadastrados
                      </span>
                      <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {status.usuarios.total}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      na coleção 'usuario'
                    </p>
                  </div>

                  {/* Funcionários */}
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border-2 border-green-300 dark:border-green-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Funcionários
                      </span>
                      <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {status.funcionarios.total}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {status.funcionarios.migrados} migrados de usuários
                    </p>
                  </div>
                </div>

                {/* Empresa e Setor */}
                <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Empresa:</p>
                      <p className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        {status.empresa ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {status.empresa.nome}
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            Será criada
                          </>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Setor:</p>
                      <p className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        {status.setor ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {status.setor.nome}
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            Será criado
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* O que será feito */}
              <div className="bg-green-50 dark:bg-green-900 dark:bg-opacity-30 border-2 border-green-300 dark:border-green-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  📋 O que será feito:
                </h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Buscar ou criar a empresa <strong>"Zendaya"</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Buscar ou criar o setor <strong>"Jardim"</strong> na empresa Zendaya</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Exportar todos os {status.usuarios.total} usuários como funcionários</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Vincular automaticamente à empresa Zendaya e setor Jardim</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Preservar dados originais (nome, email, cargo, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Gerar foto de perfil padrão se não existir</span>
                  </li>
                </ul>
              </div>

              {/* Lista de Usuários */}
              {status.usuarios.total > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    👥 Usuários que serão exportados ({status.usuarios.total})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {status.usuarios.lista.slice(0, 10).map((usuario) => (
                      <div
                        key={usuario.id}
                        className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded text-sm"
                      >
                        <div>
                          <span className="font-medium text-gray-800 dark:text-white">
                            {usuario.nome || 'Sem Nome'}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">
                            {usuario.email}
                          </span>
                        </div>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">
                          {usuario.cargo || 'Funcionário'}
                        </span>
                      </div>
                    ))}
                    {status.usuarios.total > 10 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                        + {status.usuarios.total - 10} usuários...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setEtapa('confirmacao')}
                  disabled={loading || status.usuarios.total === 0}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <PlayCircle className="w-5 h-5" />
                  Continuar
                </button>
              </div>
            </div>
          ) : etapa === 'confirmacao' ? (
            <div className="space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-30 border-2 border-yellow-300 dark:border-yellow-600 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                      Confirmar Exportação
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      Esta ação irá exportar <strong>{status?.usuarios.total} usuários</strong> para a coleção de funcionários.
                    </p>
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 mb-4">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Funcionários já existentes:
                      </p>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="modo"
                            defaultChecked
                            className="w-4 h-4 text-green-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Ignorar (recomendado)
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="modo"
                            className="w-4 h-4 text-green-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Atualizar dados
                          </span>
                        </label>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ⚠️ Certifique-se de que está pronto para realizar esta operação.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setEtapa('verificacao')}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg font-semibold transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={() => {
                    const atualizarExistentes = document.querySelector('input[name="modo"]:checked')?.nextSibling?.textContent.includes('Atualizar');
                    executarExportacao(atualizarExistentes);
                  }}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <PlayCircle className="w-5 h-5" />
                  Executar Exportação
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
                      {resultado.sucesso ? 'Exportação Concluída!' : 'Atenção'}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {resultado.mensagem}
                    </p>
                    
                    {/* Estatísticas */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {resultado.criados > 0 && (
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                          <p className="text-sm text-gray-600 dark:text-gray-300">Criados</p>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {resultado.criados}
                          </p>
                        </div>
                      )}
                      {resultado.atualizados > 0 && (
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                          <p className="text-sm text-gray-600 dark:text-gray-300">Atualizados</p>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {resultado.atualizados}
                          </p>
                        </div>
                      )}
                      {resultado.ignorados > 0 && (
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                          <p className="text-sm text-gray-600 dark:text-gray-300">Ignorados</p>
                          <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                            {resultado.ignorados}
                          </p>
                        </div>
                      )}
                      {resultado.erros > 0 && (
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                          <p className="text-sm text-gray-600 dark:text-gray-300">Erros</p>
                          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {resultado.erros}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Empresa e Setor */}
                    {resultado.empresa && (
                      <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Funcionários vinculados a:
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="font-semibold text-gray-800 dark:text-white">
                              {resultado.empresa.nome}
                            </span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="font-semibold text-gray-800 dark:text-white">
                              {resultado.setor.nome}
                            </span>
                          </div>
                        </div>
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

export default ExportacaoUsuariosModal;
