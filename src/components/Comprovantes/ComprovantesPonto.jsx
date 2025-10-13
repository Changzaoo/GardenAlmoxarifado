import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, TrendingUp, TrendingDown, CheckCircle, FileText, Building2, Trophy } from 'lucide-react';

// Função auxiliar para formatar horário
const formatarHora = (data) => {
  if (!data) return '--:--';
  const d = data.toDate ? data.toDate() : new Date(data);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

// Função auxiliar para formatar data
const formatarData = (data) => {
  if (!data) return '';
  const d = data.toDate ? data.toDate() : new Date(data);
  return d.toLocaleDateString('pt-BR');
};

// Função auxiliar para calcular horas trabalhadas
const calcularHorasTrabalhadas = (pontos) => {
  if (!pontos.entrada) return { horas: 0, minutos: 0, total: 0 };
  
  let totalMinutos = 0;
  
  // Manhã
  if (pontos.saidaAlmoco && pontos.entrada) {
    const manha = (pontos.saidaAlmoco - pontos.entrada) / (1000 * 60);
    totalMinutos += manha;
  }
  
  // Tarde
  if (pontos.saida && pontos.voltaAlmoco) {
    const tarde = (pontos.saida - pontos.voltaAlmoco) / (1000 * 60);
    totalMinutos += tarde;
  }
  
  const horas = Math.floor(totalMinutos / 60);
  const minutos = Math.round(totalMinutos % 60);
  
  return { horas, minutos, total: totalMinutos };
};

/**
 * COMPROVANTE DIÁRIO
 */
export const ComprovanteDiario = ({ funcionarioNome, data, pontos, onClose, embedded = false }) => {
  const { horas, minutos, total } = calcularHorasTrabalhadas(pontos);
  const horasEsperadas = 480; // 8 horas = 480 minutos
  const saldo = total - horasEsperadas;
  const saldoPositivo = saldo >= 0;

  const content = (
    <motion.div
      initial={embedded ? {} : { opacity: 0, scale: 0.95 }}
      animate={embedded ? {} : { opacity: 1, scale: 1 }}
      exit={embedded ? {} : { opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-center">
        <div className="inline-block p-3 bg-white/20 rounded-full mb-4">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Comprovante de Ponto</h2>
        <p className="text-blue-100 text-sm">Registro Diário</p>
      </div>

      {/* Informações do Funcionário */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Funcionário:</span>
          <span className="font-semibold text-gray-900 dark:text-white">{funcionarioNome}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Data:</span>
          <span className="font-semibold text-gray-900 dark:text-white">{formatarData(data)}</span>
        </div>
      </div>

      {/* Pontos do Dia */}
      <div className="px-6 py-6 space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Registros de Ponto
        </h3>

        <div className="space-y-3">
          {[
            { label: '1º Ponto - Entrada', valor: pontos.entrada, cor: 'green' },
            { label: '2º Ponto - Saída Almoço', valor: pontos.saidaAlmoco, cor: 'orange' },
            { label: 'Horário de Almoço', valor: null, cor: 'gray', especial: true },
            { label: '3º Ponto - Volta Almoço', valor: pontos.voltaAlmoco, cor: 'blue' },
            { label: '4º Ponto - Saída', valor: pontos.saida, cor: 'red' }
          ].map((ponto, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3 rounded-lg ${
                ponto.especial
                  ? 'bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600'
                  : `bg-${ponto.cor}-50 dark:bg-${ponto.cor}-900/20 border border-${ponto.cor}-200 dark:border-${ponto.cor}-800`
              }`}
            >
              <span className={`text-sm font-medium ${
                ponto.especial
                  ? 'text-gray-600 dark:text-gray-400'
                  : `text-${ponto.cor}-700 dark:text-${ponto.cor}-300`
              }`}>
                {ponto.label}
              </span>
              <span className={`text-lg font-bold font-mono ${
                ponto.especial
                  ? 'text-gray-500 dark:text-gray-500'
                  : `text-${ponto.cor}-700 dark:text-${ponto.cor}-300`
              }`}>
                {ponto.especial
                  ? pontos.saidaAlmoco && pontos.voltaAlmoco
                    ? `${Math.floor((pontos.voltaAlmoco - pontos.saidaAlmoco) / (1000 * 60))} min`
                    : '--'
                  : formatarHora(ponto.valor)
                }
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Resumo de Horas */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Trabalhado:</span>
          <span className="text-xl font-bold text-gray-900 dark:text-white font-mono">
            {horas}h {minutos.toString().padStart(2, '0')}m
          </span>
        </div>
        <div className={`flex items-center justify-between p-3 rounded-lg ${
          saldoPositivo
            ? 'bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700'
            : 'bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700'
        }`}>
          <span className={`text-sm font-semibold flex items-center gap-2 ${
            saldoPositivo ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
          }`}>
            {saldoPositivo ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {saldoPositivo ? 'Horas Positivas' : 'Horas Negativas'}
          </span>
          <span className={`text-lg font-bold font-mono ${
            saldoPositivo ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
          }`}>
            {saldoPositivo ? '+' : ''}{Math.floor(Math.abs(saldo) / 60)}h {Math.abs(saldo) % 60}m
          </span>
        </div>
      </div>

      {/* Rodapé */}
      <div className="px-6 py-4 bg-gray-800 dark:bg-gray-950 text-center">
        <p className="text-xs text-gray-400 mb-2">
          Documento gerado automaticamente pelo sistema
        </p>
        <p className="text-xs text-gray-500">
          {new Date().toLocaleString('pt-BR')}
        </p>
        {!embedded && onClose && (
          <button
            onClick={onClose}
            className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Fechar
          </button>
        )}
      </div>
    </motion.div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      {content}
    </div>
  );
};

/**
 * COMPROVANTE SEMANAL
 */
export const ComprovanteSemanal = ({ funcionarioNome, diasDaSemana, onClose, embedded = false }) => {
  const totalGeral = diasDaSemana.reduce((acc, dia) => {
    const { total } = calcularHorasTrabalhadas(dia.pontos);
    return acc + total;
  }, 0);

  const horasEsperadasSemana = 480 * diasDaSemana.length; // 8h por dia
  const saldoGeral = totalGeral - horasEsperadasSemana;
  const saldoPositivo = saldoGeral >= 0;

  const content = (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-8 text-center sticky top-0 z-10">
        <div className="inline-block p-3 bg-white/20 rounded-full mb-4">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Comprovante Semanal</h2>
        <p className="text-purple-100 text-sm">{funcionarioNome}</p>
      </div>

      {/* Dias da Semana */}
      <div className="px-6 py-6 space-y-4">
        {diasDaSemana.map((dia, idx) => {
          const { horas, minutos, total } = calcularHorasTrabalhadas(dia.pontos);
          const saldoDia = total - 480;
          
          return (
            <div key={idx} className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatarData(dia.data)}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {dia.data.toLocaleDateString('pt-BR', { weekday: 'long' })}
                  </span>
                </div>
              </div>
              
              <div className="p-4 grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <div className="text-xs text-green-600 dark:text-green-400 mb-1">Entrada</div>
                  <div className="font-mono font-bold text-green-700 dark:text-green-300">{formatarHora(dia.pontos.entrada)}</div>
                </div>
                <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                  <div className="text-xs text-orange-600 dark:text-orange-400 mb-1">Saída Almoço</div>
                  <div className="font-mono font-bold text-orange-700 dark:text-orange-300">{formatarHora(dia.pontos.saidaAlmoco)}</div>
                </div>
                <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Volta Almoço</div>
                  <div className="font-mono font-bold text-blue-700 dark:text-blue-300">{formatarHora(dia.pontos.voltaAlmoco)}</div>
                </div>
                <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <div className="text-xs text-red-600 dark:text-red-400 mb-1">Saída</div>
                  <div className="font-mono font-bold text-red-700 dark:text-red-300">{formatarHora(dia.pontos.saida)}</div>
                </div>
              </div>
              
              <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800/50 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total:</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                    {horas}h {minutos}m
                  </span>
                  <span className={`text-sm font-semibold ${
                    saldoDia >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {saldoDia >= 0 ? '+' : ''}{Math.floor(Math.abs(saldoDia) / 60)}h {Math.abs(saldoDia) % 60}m
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumo Semanal */}
      <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-t-2 border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total da Semana:</span>
          <span className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
            {Math.floor(totalGeral / 60)}h {Math.round(totalGeral % 60)}m
          </span>
        </div>
        <div className={`flex items-center justify-between p-3 rounded-lg ${
          saldoPositivo
            ? 'bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700'
            : 'bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700'
        }`}>
          <span className={`text-sm font-semibold flex items-center gap-2 ${
            saldoPositivo ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
          }`}>
            {saldoPositivo ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            Saldo da Semana
          </span>
          <span className={`text-xl font-bold font-mono ${
            saldoPositivo ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
          }`}>
            {saldoPositivo ? '+' : ''}{Math.floor(Math.abs(saldoGeral) / 60)}h {Math.abs(saldoGeral) % 60}m
          </span>
        </div>
      </div>

      {/* Rodapé */}
      <div className="px-6 py-4 bg-gray-800 dark:bg-gray-950 text-center">
        <p className="text-xs text-gray-400 mb-2">
          Documento gerado automaticamente pelo sistema
        </p>
        <p className="text-xs text-gray-500">
          {new Date().toLocaleString('pt-BR')}
        </p>
        {!embedded && onClose && (
          <button
            onClick={onClose}
            className="mt-4 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
          >
            Fechar
          </button>
        )}
      </div>
    </motion.div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      {content}
    </div>
  );
};

/**
 * COMPROVANTE MENSAL
 */
export const ComprovanteMensal = ({ funcionarioNome, mes, ano, diasDoMes, onClose, embedded = false }) => {
  const totalGeral = diasDoMes.reduce((acc, dia) => {
    const { total } = calcularHorasTrabalhadas(dia.pontos);
    return acc + total;
  }, 0);

  const diasTrabalhados = diasDoMes.filter(d => d.pontos.entrada).length;
  const horasEsperadasMes = 480 * diasTrabalhados;
  const saldoGeral = totalGeral - horasEsperadasMes;
  const saldoPositivo = saldoGeral >= 0;

  const nomeMes = new Date(ano, mes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const content = (
    <motion.div
      initial={embedded ? {} : { opacity: 0, scale: 0.95 }}
      animate={embedded ? {} : { opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-8 text-center sticky top-0 z-10">
        <div className="inline-block p-3 bg-white/20 rounded-full mb-4">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Comprovante Mensal</h2>
        <p className="text-indigo-100 text-sm capitalize">{nomeMes}</p>
        <p className="text-indigo-200 text-sm mt-1">{funcionarioNome}</p>
      </div>

      {/* Estatísticas do Mês */}
      <div className="px-6 py-6 grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{diasTrabalhados}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Dias Trabalhados</div>
        </div>
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1 font-mono">
            {Math.floor(totalGeral / 60)}h
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Trabalhado</div>
        </div>
        <div className={`text-center p-4 rounded-xl border ${
          saldoPositivo
            ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <div className={`text-3xl font-bold mb-1 font-mono ${
            saldoPositivo ? 'text-cyan-600 dark:text-cyan-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {saldoPositivo ? '+' : ''}{Math.floor(Math.abs(saldoGeral) / 60)}h
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Saldo</div>
        </div>
      </div>

      {/* Lista de Dias */}
      <div className="px-6 pb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Registro Detalhado</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {diasDoMes.map((dia, idx) => {
            if (!dia.pontos.entrada) return null;
            
            const { horas, minutos, total } = calcularHorasTrabalhadas(dia.pontos);
            const saldoDia = total - 480;
            
            return (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{dia.data.getDate()}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {dia.data.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded font-mono">
                      {formatarHora(dia.pontos.entrada)}
                    </span>
                    <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded font-mono">
                      {formatarHora(dia.pontos.saida)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                    {horas}h {minutos}m
                  </span>
                  <span className={`text-sm font-semibold px-2 py-1 rounded ${
                    saldoDia >= 0
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  }`}>
                    {saldoDia >= 0 ? '+' : ''}{Math.floor(Math.abs(saldoDia) / 60)}:{(Math.abs(saldoDia) % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resumo Final */}
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-t-2 border-indigo-200 dark:border-indigo-800">
        <div className={`flex items-center justify-between p-4 rounded-lg ${
          saldoPositivo
            ? 'bg-green-100 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700'
            : 'bg-red-100 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700'
        }`}>
          <div>
            <div className={`text-sm font-semibold flex items-center gap-2 mb-1 ${
              saldoPositivo ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
            }`}>
              {saldoPositivo ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              Saldo do Mês
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {diasTrabalhados} dias • {Math.floor(horasEsperadasMes / 60)}h esperadas
            </div>
          </div>
          <span className={`text-3xl font-bold font-mono ${
            saldoPositivo ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
          }`}>
            {saldoPositivo ? '+' : ''}{Math.floor(Math.abs(saldoGeral) / 60)}h {Math.abs(saldoGeral) % 60}m
          </span>
        </div>
      </div>

      {/* Rodapé */}
      <div className="px-6 py-4 bg-gray-800 dark:bg-gray-950 text-center">
        <p className="text-xs text-gray-400 mb-2">
          Documento gerado automaticamente pelo sistema
        </p>
        <p className="text-xs text-gray-500">
          {new Date().toLocaleString('pt-BR')}
        </p>
        {!embedded && onClose && (
          <button
            onClick={onClose}
            className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
          >
            Fechar
          </button>
        )}
      </div>
    </motion.div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      {content}
    </div>
  );
};

/**
 * COMPROVANTE ANUAL
 */
export const ComprovanteAnual = ({ funcionarioNome, ano, mesesDoAno, onClose, embedded = false }) => {
  const totalGeralAno = mesesDoAno.reduce((acc, mes) => acc + mes.totalMinutos, 0);
  const diasTrabalhadosAno = mesesDoAno.reduce((acc, mes) => acc + mes.diasTrabalhados, 0);
  const horasEsperadasAno = 480 * diasTrabalhadosAno;
  const saldoGeralAno = totalGeralAno - horasEsperadasAno;
  const saldoPositivo = saldoGeralAno >= 0;

  const content = (
    <motion.div
      initial={embedded ? {} : { opacity: 0, scale: 0.95 }}
      animate={embedded ? {} : { opacity: 1, scale: 1 }}
      exit={embedded ? {} : { opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden max-h-[90vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-8 text-center sticky top-0 z-10">
        <div className="inline-block p-3 bg-white/20 rounded-full mb-4">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Comprovante Anual</h2>
        <p className="text-amber-100 text-lg">{ano}</p>
        <p className="text-amber-200 text-sm mt-1">{funcionarioNome}</p>
      </div>

      {/* Estatísticas Anuais */}
      <div className="px-6 py-6 grid grid-cols-4 gap-4">
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">{diasTrabalhadosAno}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Dias</div>
        </div>
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
          <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-1 font-mono">
            {Math.floor(totalGeralAno / 60)}h
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Trabalhadas</div>
        </div>
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1 font-mono">
            {Math.floor(horasEsperadasAno / 60)}h
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Esperadas</div>
        </div>
        <div className={`text-center p-4 rounded-xl border ${
          saldoPositivo
            ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <div className={`text-4xl font-bold mb-1 font-mono ${
            saldoPositivo ? 'text-cyan-600 dark:text-cyan-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {saldoPositivo ? '+' : ''}{Math.floor(Math.abs(saldoGeralAno) / 60)}h
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Saldo</div>
        </div>
      </div>

      {/* Meses do Ano */}
      <div className="px-6 pb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Resumo Mensal</h3>
        <div className="grid grid-cols-3 gap-4">
          {mesesDoAno.map((mes, idx) => {
            const saldoMes = mes.totalMinutos - (480 * mes.diasTrabalhados);
            const saldoMesPositivo = saldoMes >= 0;
            
            return (
              <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <div className="text-center mb-3">
                  <div className="font-bold text-gray-900 dark:text-white capitalize">
                    {new Date(ano, mes.mes).toLocaleDateString('pt-BR', { month: 'long' })}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {mes.diasTrabalhados} dias
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Trabalhadas:</span>
                    <span className="font-mono font-semibold text-gray-900 dark:text-white">
                      {Math.floor(mes.totalMinutos / 60)}h {mes.totalMinutos % 60}m
                    </span>
                  </div>
                  <div className={`flex justify-between text-sm p-2 rounded ${
                    saldoMesPositivo
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    <span className={`${
                      saldoMesPositivo ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                    }`}>
                      Saldo:
                    </span>
                    <span className={`font-mono font-bold ${
                      saldoMesPositivo ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                    }`}>
                      {saldoMesPositivo ? '+' : ''}{Math.floor(Math.abs(saldoMes) / 60)}h {Math.abs(saldoMes) % 60}m
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resumo Final Anual */}
      <div className="px-6 py-6 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-t-2 border-amber-200 dark:border-amber-800">
        <div className={`flex items-center justify-between p-6 rounded-xl ${
          saldoPositivo
            ? 'bg-green-100 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700'
            : 'bg-red-100 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700'
        }`}>
          <div>
            <div className={`text-lg font-semibold flex items-center gap-2 mb-2 ${
              saldoPositivo ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
            }`}>
              {saldoPositivo ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
              Saldo Anual de {ano}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {diasTrabalhadosAno} dias trabalhados • Média de {Math.floor((totalGeralAno / diasTrabalhadosAno) / 60)}h/dia
            </div>
          </div>
          <div className="text-right">
            <span className={`text-4xl font-bold font-mono block ${
              saldoPositivo ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
            }`}>
              {saldoPositivo ? '+' : ''}{Math.floor(Math.abs(saldoGeralAno) / 60)}h
            </span>
            <span className={`text-lg font-semibold ${
              saldoPositivo ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {Math.abs(saldoGeralAno) % 60}min
            </span>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="px-6 py-4 bg-gray-800 dark:bg-gray-950 text-center">
        <p className="text-xs text-gray-400 mb-2">
          Documento gerado automaticamente pelo sistema WorkFlow
        </p>
        <p className="text-xs text-gray-500">
          {new Date().toLocaleString('pt-BR')}
        </p>
        {!embedded && onClose && (
          <button
            onClick={onClose}
            className="mt-4 w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors"
          >
            Fechar
          </button>
        )}
      </div>
    </motion.div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      {content}
    </div>
  );
};
