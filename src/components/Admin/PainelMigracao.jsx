import React, { useState } from 'react';
import { 
  identificarUsuariosAntigos, 
  executarMigracaoCompleta,
  gerarRelatorioUsuarios,
  migrarUsuario
} from '../../utils/migrarUsuariosAntigos';
import { Download, AlertTriangle, CheckCircle, Users, RefreshCw } from 'lucide-react';

/**
 * Componente de Interface para Migração de Usuários
 * 
 * Permite ao admin:
 * - Identificar usuários antigos
 * - Ver estatísticas detalhadas
 * - Executar migração automática
 * - Exportar relatórios
 */
export default function PainelMigracao() {
  const [analise, setAnalise] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [ultimaMigracao, setUltimaMigracao] = useState(null);
  const [expandido, setExpandido] = useState({});

  // Identificar usuários antigos
  const handleIdentificar = async () => {
    setCarregando(true);
    try {
      const resultado = await identificarUsuariosAntigos();
      setAnalise(resultado);
      console.log('✅ Identificação concluída:', resultado);
    } catch (error) {
      console.error('❌ Erro ao identificar:', error);
      alert('Erro ao identificar usuários: ' + error.message);
    }
    setCarregando(false);
  };

  // Executar migração completa
  const handleMigrar = async () => {
    if (!analise) {
      alert('Primeiro identifique os usuários!');
      return;
    }

    if (analise.precisamMigracao.length === 0) {
      alert('Nenhum usuário precisa de migração!');
      return;
    }

    const confirmacao = confirm(
      `⚠️ ATENÇÃO!\n\n` +
      `Esta ação irá:\n` +
      `• Criar empresa "Zendaya Jardinagem" (se não existir)\n` +
      `• Criar setores: Jardim, Administrativo, Manutenção\n` +
      `• Migrar ${analise.precisamMigracao.length} usuário(s)\n` +
      `• Atribuir empresa/setor/cargo automaticamente\n\n` +
      `⚠️ SENHAS NÃO SERÃO MIGRADAS (precisam ser redefinidas)\n\n` +
      `Deseja continuar?`
    );

    if (!confirmacao) return;

    setCarregando(true);
    try {
      const resultado = await executarMigracaoCompleta();
      setUltimaMigracao(resultado);
      
      // Atualizar análise
      await handleIdentificar();

      alert(
        `✅ Migração concluída!\n\n` +
        `Usuários migrados: ${resultado.migracao.migrados}\n` +
        `Erros: ${resultado.migracao.erros}\n` +
        `Empresa: ${resultado.empresa.nome}\n` +
        `Setores: ${Object.keys(resultado.setores).join(', ')}`
      );
    } catch (error) {
      console.error('❌ Erro na migração:', error);
      alert('Erro na migração: ' + error.message);
    }
    setCarregando(false);
  };

  // Gerar e exportar relatório
  const handleExportarRelatorio = async () => {
    setCarregando(true);
    try {
      const relatorio = await gerarRelatorioUsuarios();
      
      const json = JSON.stringify(relatorio, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-usuarios-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('✅ Relatório exportado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao exportar:', error);
      alert('Erro ao exportar relatório: ' + error.message);
    }
    setCarregando(false);
  };

  // Toggle expandir/colapsar seção
  const toggleExpandir = (secao) => {
    setExpandido(prev => ({
      ...prev,
      [secao]: !prev[secao]
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6" />
            Sistema de Migração de Usuários
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Identifique e migre usuários antigos para a nova estrutura
          </p>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={handleIdentificar}
          disabled={carregando}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
          {carregando ? 'Analisando...' : '🔍 Identificar Usuários'}
        </button>

        <button
          onClick={handleMigrar}
          disabled={carregando || !analise || analise.precisamMigracao.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          {carregando ? 'Migrando...' : '🚀 Migrar Automaticamente'}
        </button>

        <button
          onClick={handleExportarRelatorio}
          disabled={carregando || !analise}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          📊 Exportar Relatório
        </button>
      </div>

      {/* Resultados da Análise */}
      {analise && (
        <div className="space-y-6">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow">
              <div className="text-3xl font-bold">{analise.total}</div>
              <div className="text-sm opacity-90">Total de Usuários</div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow">
              <div className="text-3xl font-bold">{analise.migrados}</div>
              <div className="text-sm opacity-90">Já Migrados</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-lg shadow">
              <div className="text-3xl font-bold">{analise.precisamMigracao.length}</div>
              <div className="text-sm opacity-90">Precisam Migração</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow">
              <div className="text-3xl font-bold">
                {((analise.migrados / analise.total) * 100).toFixed(1)}%
              </div>
              <div className="text-sm opacity-90">Completo</div>
            </div>
          </div>

          {/* Detalhes de Problemas */}
          {analise.precisamMigracao.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  Usuários que Precisam Migração ({analise.precisamMigracao.length})
                </h4>
              </div>

              {/* Resumo de Problemas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                  <div className="text-xl font-bold text-red-600">{analise.semSenhaCriptografada.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Senha não criptografada</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                  <div className="text-xl font-bold text-orange-600">{analise.semEmpresa.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Sem empresa</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                  <div className="text-xl font-bold text-orange-600">{analise.semSetor.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Sem setor</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                  <div className="text-xl font-bold text-yellow-600">{analise.semCargo.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Sem cargo</div>
                </div>
              </div>

              {/* Lista Expandível */}
              <div>
                <button
                  onClick={() => toggleExpandir('problematicos')}
                  className="w-full text-left px-4 py-2 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="font-semibold">
                    {expandido.problematicos ? '▼' : '▶'} Ver Detalhes dos Usuários
                  </span>
                </button>

                {expandido.problematicos && (
                  <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
                    {analise.precisamMigracao.map(usuario => (
                      <div
                        key={usuario.id}
                        className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {usuario.nome}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Email: {usuario.email} | Nível: {usuario.nivel}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {usuario.problemas.map(problema => (
                            <span
                              key={problema}
                              className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded"
                            >
                              {problema.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Usuários OK */}
          {analise.ok.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  Usuários Migrados Corretamente ({analise.ok.length})
                </h4>
              </div>

              <button
                onClick={() => toggleExpandir('ok')}
                className="w-full text-left px-4 py-2 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="font-semibold">
                  {expandido.ok ? '▼' : '▶'} Ver Usuários Migrados
                </span>
              </button>

              {expandido.ok && (
                <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
                  {analise.ok.map(usuario => (
                    <div
                      key={usuario.id}
                      className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700"
                    >
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {usuario.nome}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {usuario.empresaNome} • {usuario.setorNome} • {usuario.cargo}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Resultado da Última Migração */}
          {ultimaMigracao && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                📊 Resultado da Última Migração
              </h4>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded">
                  <div className="text-2xl font-bold text-green-600">{ultimaMigracao.migracao.migrados}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Usuários Migrados</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded">
                  <div className="text-2xl font-bold text-red-600">{ultimaMigracao.migracao.erros}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Erros</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Empresa criada:</strong> {ultimaMigracao.empresa.nome}
                </div>
                <div className="text-sm">
                  <strong>Setores criados:</strong> {Object.keys(ultimaMigracao.setores).join(', ')}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estado Inicial */}
      {!analise && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Clique em "Identificar Usuários" para começar a análise
          </p>
        </div>
      )}

      {/* Avisos Importantes */}
      <div className="mt-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
        <h5 className="font-bold text-orange-800 dark:text-orange-300 mb-2">
          ⚠️ Avisos Importantes
        </h5>
        <ul className="text-sm text-orange-700 dark:text-orange-400 space-y-1 list-disc list-inside">
          <li>A migração automática NÃO pode migrar senhas (estão criptografadas)</li>
          <li>Usuários migrados precisarão redefinir suas senhas</li>
          <li>Faça backup do banco de dados antes de executar a migração</li>
          <li>A empresa padrão criada será "Zendaya Jardinagem"</li>
          <li>Todos os usuários serão alocados no setor "Jardim" inicialmente</li>
          <li>Admins não precisam de empresa/setor associados</li>
        </ul>
      </div>
    </div>
  );
}
