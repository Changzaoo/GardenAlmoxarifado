/**
 * Card de Estatísticas de Ponto - Otimizado com Python
 * 
 * Exibe horas trabalhadas, saldo, horas extras e horas negativas
 * Usa Python para cálculos rápidos e precisos
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Clock, TrendingUp, TrendingDown, Calendar, Award, AlertCircle } from 'lucide-react';
import { usePythonCalculations } from '../../hooks/usePythonCalculations';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const CardEstatisticasPonto = ({ funcionarioId, mes, ano }) => {
  const { calcularEstatisticasPontoMes, isPythonReady } = usePythonCalculations();
  const [loading, setLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState(null);
  const [registrosPonto, setRegistrosPonto] = useState([]);

  // Carregar registros de ponto
  useEffect(() => {
    const carregarRegistros = async () => {
      if (!funcionarioId || !mes || !ano) return;

      try {
        setLoading(true);
        const q = query(
          collection(db, 'registros_ponto'),
          where('funcionarioId', '==', funcionarioId),
          where('mes', '==', mes),
          where('ano', '==', ano)
        );

        const snapshot = await getDocs(q);
        const registros = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setRegistrosPonto(registros);
      } catch (error) {
        console.error('Erro ao carregar registros de ponto:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarRegistros();
  }, [funcionarioId, mes, ano]);

  // Calcular estatísticas quando registros mudarem
  useEffect(() => {
    const calcular = async () => {
      if (registrosPonto.length === 0) {
        setEstatisticas({
          totalHorasTrabalhadas: 0,
          totalHorasEsperadas: 0,
          saldoMes: 0,
          diasTrabalhados: 0,
          diasFalta: 0,
          horasExtras: 0,
          horasNegativas: 0,
          mediaHorasDia: 0
        });
        return;
      }

      try {
        const stats = await calcularEstatisticasPontoMes(
          registrosPonto,
          funcionarioId,
          mes,
          ano
        );
        setEstatisticas(stats);
      } catch (error) {
        console.error('Erro ao calcular estatísticas:', error);
      }
    };

    calcular();
  }, [registrosPonto, funcionarioId, mes, ano, calcularEstatisticasPontoMes]);

  // Formatar minutos para horas
  const formatarHoras = (minutos) => {
    const horas = Math.floor(Math.abs(minutos) / 60);
    const mins = Math.abs(minutos) % 60;
    const sinal = minutos < 0 ? '-' : '';
    return `${sinal}${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  // Determinar cor do saldo
  const getCorSaldo = (saldo) => {
    if (saldo > 0) return 'text-green-600 dark:text-green-400';
    if (saldo < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getCorSaldoBg = (saldo) => {
    if (saldo > 0) return 'bg-green-100 dark:bg-green-900/30';
    if (saldo < 0) return 'bg-red-100 dark:bg-red-900/30';
    return 'bg-gray-100 dark:bg-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!estatisticas) return null;

  const mesNome = new Date(ano, mes - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Estatísticas de Ponto
            </h3>
            <p className="text-blue-100 text-sm capitalize">{mesNome}</p>
          </div>
          {isPythonReady && (
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-white text-xs font-semibold">🐍 Python</span>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-6 space-y-6">
        {/* Card Principal - Saldo do Mês */}
        <div className={`${getCorSaldoBg(estatisticas.saldoMes)} rounded-xl p-6 border-2 ${
          estatisticas.saldoMes > 0 
            ? 'border-green-300 dark:border-green-700' 
            : estatisticas.saldoMes < 0 
            ? 'border-red-300 dark:border-red-700'
            : 'border-gray-300 dark:border-gray-600'
        }`}>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Saldo do Mês
            </p>
            <div className={`text-5xl font-bold ${getCorSaldo(estatisticas.saldoMes)} flex items-center justify-center gap-3`}>
              {estatisticas.saldoMes > 0 ? (
                <TrendingUp className="w-10 h-10" />
              ) : estatisticas.saldoMes < 0 ? (
                <TrendingDown className="w-10 h-10" />
              ) : (
                <Clock className="w-10 h-10" />
              )}
              {formatarHoras(estatisticas.saldoMes)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {estatisticas.saldoMes > 0 
                ? '✅ Horas extras acumuladas' 
                : estatisticas.saldoMes < 0 
                ? '⚠️ Horas negativas a compensar'
                : 'Em dia com as horas'}
            </p>
          </div>
        </div>

        {/* Grid de Estatísticas */}
        <div className="grid grid-cols-2 gap-4">
          {/* Horas Trabalhadas */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                Horas Trabalhadas
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatarHoras(estatisticas.totalHorasTrabalhadas)}
            </p>
          </div>

          {/* Horas Esperadas */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                Horas Esperadas
              </span>
            </div>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatarHoras(estatisticas.totalHorasEsperadas)}
            </p>
          </div>

          {/* Horas Extras */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                Horas Extras
              </span>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatarHoras(estatisticas.horasExtras)}
            </p>
          </div>

          {/* Horas Negativas */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                Horas Negativas
              </span>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatarHoras(estatisticas.horasNegativas)}
            </p>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {estatisticas.diasTrabalhados}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Dias Trabalhados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {estatisticas.diasFalta}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Faltas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatarHoras(estatisticas.mediaHorasDia)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Média/Dia</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardEstatisticasPonto;
