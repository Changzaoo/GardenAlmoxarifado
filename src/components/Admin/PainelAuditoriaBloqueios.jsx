/**
 * 🛡️ Painel de Auditoria de Bloqueios
 * 
 * Componente para visualizar tentativas de criação de usuários bloqueados
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  User,
  Trash2,
  RefreshCw,
  Info,
  CheckCircle
} from 'lucide-react';
import { 
  getEstatisticasBloqueios, 
  limparLogsBloqueios 
} from '../../utils/validacaoUsuarios';

const PainelAuditoriaBloqueios = () => {
  const [estatisticas, setEstatisticas] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const carregarEstatisticas = () => {
    setCarregando(true);
    const stats = getEstatisticasBloqueios();
    setEstatisticas(stats);
    setCarregando(false);
  };

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const handleLimpar = () => {
    if (window.confirm('⚠️ Tem certeza que deseja limpar todos os logs de bloqueio?')) {
      const sucesso = limparLogsBloqueios();
      if (sucesso) {
        carregarEstatisticas();
        alert('✅ Logs limpos com sucesso!');
      }
    }
  };

  const formatarData = (timestamp) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getCorContexto = (contexto) => {
    const cores = {
      'criação manual': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'sincronização': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'sincronização (origem)': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'sincronização (destino)': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'cópia de coleção': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'rotação': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    return cores[contexto] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Auditoria de Bloqueios</h2>
              <p className="text-white/80 text-sm">
                Sistema de proteção contra usuários admin duplicados
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={carregarEstatisticas}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title="Atualizar"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleLimpar}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title="Limpar logs"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total de Bloqueios */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Bloqueado</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {estatisticas?.total || 0}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tentativas de criação bloqueadas
          </p>
        </div>

        {/* Contextos */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Contextos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {Object.keys(estatisticas?.porContexto || {}).length}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Diferentes pontos de bloqueio
          </p>
        </div>

        {/* Status */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                ✅ Ativo
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Sistema funcionando
          </p>
        </div>
      </div>

      {/* Distribuição por Contexto */}
      {Object.keys(estatisticas?.porContexto || {}).length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Distribuição por Contexto
          </h3>
          <div className="space-y-3">
            {Object.entries(estatisticas.porContexto).map(([contexto, quantidade]) => {
              const porcentagem = ((quantidade / estatisticas.total) * 100).toFixed(1);
              return (
                <div key={contexto} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCorContexto(contexto)}`}>
                      {contexto}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 font-semibold">
                      {quantidade} ({porcentagem}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${porcentagem}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Últimos Bloqueios */}
      {estatisticas?.ultimos10?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Últimos 10 Bloqueios
          </h3>
          <div className="space-y-3">
            {estatisticas.ultimos10.map((bloqueio, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {bloqueio.usuario || 'N/A'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getCorContexto(bloqueio.contexto)}`}>
                      {bloqueio.contexto}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Nome: {bloqueio.nome || 'N/A'} | Nível: {bloqueio.nivel}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatarData(bloqueio.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem de Nenhum Bloqueio */}
      {estatisticas?.total === 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">
            🎉 Nenhuma Tentativa Bloqueada
          </h3>
          <p className="text-sm text-green-600 dark:text-green-400">
            O sistema está funcionando perfeitamente e nenhuma tentativa de criar usuários proibidos foi detectada.
          </p>
        </div>
      )}

      {/* Informações do Sistema */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-1">ℹ️ Sobre o Sistema de Bloqueio</p>
            <p className="text-blue-700 dark:text-blue-400">
              Este sistema impede automaticamente a criação de usuários com login "admin" ou variações,
              em todos os pontos do sistema: criação manual, sincronização e rotação de servidores.
              Os logs são mantidos localmente para auditoria e podem ser limpos a qualquer momento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PainelAuditoriaBloqueios;
