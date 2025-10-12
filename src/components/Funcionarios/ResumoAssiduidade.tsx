import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, AlertTriangle, Award } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { gerarResumoMensal } from '../../utils/pontoUtils';

const ResumoAssiduidade = ({ funcionarioId }) => {
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarResumo = async () => {
      if (!funcionarioId) return;

      setLoading(true);
      try {
        // Buscar pontos do mês atual
        const hoje = new Date();
        const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

        const q = query(
          collection(db, 'pontos'),
          where('funcionarioId', '==', String(funcionarioId))
        );

        const snapshot = await getDocs(q);
        const pontos = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(ponto => {
            const dataPonto = new Date(ponto.data);
            return dataPonto >= primeiroDiaMes && dataPonto <= ultimoDiaMes;
          });

        // Gerar resumo mensal
        const resumoMensal = gerarResumoMensal(pontos);
        setResumo(resumoMensal);
      } catch (error) {
        console.error('Erro ao carregar resumo:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarResumo();
  }, [funcionarioId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 animate-pulse">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!resumo) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Total de Horas */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-xl p-6 shadow-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-3">
          <div className="p-3 bg-blue-500 rounded-lg">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div className="text-xs font-semibold text-blue-600 dark:text-blue-300 bg-blue-200 dark:bg-blue-900/50 px-2 py-1 rounded">
            Mês Atual
          </div>
        </div>
        <div className="text-sm text-blue-700 dark:text-blue-300 font-semibold mb-1">
          Total de Horas
        </div>
        <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 font-mono">
          {resumo.totalHorasFormatado || '--:--'}
        </div>
        <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
          {resumo.diasTrabalhados || 0} dias trabalhados
        </div>
      </div>

      {/* Card 2: Horas Extras */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 rounded-xl p-6 shadow-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between mb-3">
          <div className="p-3 bg-green-500 rounded-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className={`text-xs font-semibold px-2 py-1 rounded ${
            (resumo.horasExtrasMinutos || 0) > 0
              ? 'text-green-600 dark:text-green-300 bg-green-200 dark:bg-green-900/50'
              : 'text-gray-500 bg-gray-200'
          }`}>
            {(resumo.horasExtrasMinutos || 0) > 0 ? 'Positivo' : 'Normal'}
          </div>
        </div>
        <div className="text-sm text-green-700 dark:text-green-300 font-semibold mb-1">
          Horas Extras
        </div>
        <div className="text-3xl font-bold text-green-900 dark:text-green-100 font-mono">
          {resumo.horasExtrasFormatado || '--:--'}
        </div>
        <div className="text-xs text-green-600 dark:text-green-400 mt-2">
          Saldo positivo: {resumo.saldoPositivoFormatado || '--:--'}
        </div>
      </div>

      {/* Card 3: Advertências */}
      <div className={`rounded-xl p-6 shadow-lg border ${
        (resumo.totalAdvertencias || 0) > 0
          ? 'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900 border-red-200 dark:border-red-800'
          : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 border-gray-200 dark:border-gray-800'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className={`p-3 rounded-lg ${
            (resumo.totalAdvertencias || 0) > 0 ? 'bg-red-500' : 'bg-gray-400'
          }`}>
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div className={`text-xs font-semibold px-2 py-1 rounded ${
            (resumo.totalAdvertencias || 0) === 0
              ? 'text-green-600 bg-green-200'
              : (resumo.totalAdvertencias || 0) >= 3
              ? 'text-red-600 bg-red-200'
              : 'text-yellow-600 bg-yellow-200'
          }`}>
            {(resumo.totalAdvertencias || 0) === 0
              ? 'Sem problemas'
              : (resumo.totalAdvertencias || 0) >= 3
              ? 'Atenção!'
              : 'Cuidado'}
          </div>
        </div>
        <div className={`text-sm font-semibold mb-1 ${
          (resumo.totalAdvertencias || 0) > 0
            ? 'text-red-700 dark:text-red-300'
            : 'text-gray-700 dark:text-gray-300'
        }`}>
          Advertências
        </div>
        <div className={`text-3xl font-bold font-mono ${
          (resumo.totalAdvertencias || 0) > 0
            ? 'text-red-900 dark:text-red-100'
            : 'text-gray-900 dark:text-gray-100'
        }`}>
          {resumo.totalAdvertencias || 0} / 3
        </div>
        <div className={`text-xs mt-2 ${
          (resumo.totalAdvertencias || 0) > 0
            ? 'text-red-600 dark:text-red-400'
            : 'text-gray-600 dark:text-gray-400'
        }`}>
          {resumo.totalAdvertencias === 0
            ? 'Nenhuma advertência este mês'
            : resumo.totalAdvertencias >= 3
            ? 'Limite máximo atingido'
            : `Restam ${3 - (resumo.totalAdvertencias || 0)} advertências`}
        </div>
      </div>

      {/* Card 4: Assiduidade */}
      <div className={`rounded-xl p-6 shadow-lg border ${
        resumo.temAssiduidade
          ? 'bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-950 dark:to-amber-900 border-yellow-200 dark:border-yellow-800'
          : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 border-gray-200 dark:border-gray-800'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className={`p-3 rounded-lg ${
            resumo.temAssiduidade ? 'bg-yellow-500' : 'bg-gray-400'
          }`}>
            <Award className="w-6 h-6 text-white" />
          </div>
          <div className={`text-xs font-semibold px-2 py-1 rounded ${
            resumo.temAssiduidade
              ? 'text-yellow-600 bg-yellow-200'
              : 'text-gray-600 bg-gray-200'
          }`}>
            {resumo.temAssiduidade ? 'Qualificado ✓' : 'Não qualificado'}
          </div>
        </div>
        <div className={`text-sm font-semibold mb-1 ${
          resumo.temAssiduidade
            ? 'text-yellow-700 dark:text-yellow-300'
            : 'text-gray-700 dark:text-gray-300'
        }`}>
          Prêmio Assiduidade
        </div>
        <div className={`text-3xl font-bold ${
          resumo.temAssiduidade
            ? 'text-yellow-900 dark:text-yellow-100'
            : 'text-gray-900 dark:text-gray-100'
        }`}>
          {resumo.premioAssiduidade || 'R$ 0,00'}
        </div>
        <div className={`text-xs mt-2 ${
          resumo.temAssiduidade
            ? 'text-yellow-600 dark:text-yellow-400'
            : 'text-gray-600 dark:text-gray-400'
        }`}>
          {resumo.temAssiduidade
            ? 'Parabéns! Sem faltas nem advertências'
            : `Faltas: ${resumo.faltas || 0} | Advertências: ${resumo.totalAdvertencias || 0}`}
        </div>
      </div>
    </div>
  );
};

export default ResumoAssiduidade;
