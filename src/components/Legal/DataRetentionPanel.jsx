import React, { useState, useEffect } from 'react';
import { dataRetentionService } from '../../services/dataRetentionService';
import { DATA_RETENTION_PERIODS } from '../../constants/lgpd';
import { Clock, Archive, AlertTriangle, RefreshCw } from 'lucide-react';

const DataRetentionPanel = ({ usuario }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const retentionStats = await dataRetentionService.getRetentionStats();
      setStats(retentionStats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    const shouldProceed = window.confirm('Deseja iniciar a limpeza de dados expirados? Esta ação não pode ser desfeita.');
    if (!shouldProceed) {
      return;
    }

    setCleaning(true);
    try {
      await dataRetentionService.cleanupExpiredData();
      await loadStats();
      alert('Limpeza concluída com sucesso!');
    } catch (error) {
      console.error('Erro na limpeza:', error);
      alert('Erro ao realizar limpeza. Tente novamente mais tarde.');
    } finally {
      setCleaning(false);
    }
  };

  if (loading) {
    return <div className="text-[#8899A6]">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(DATA_RETENTION_PERIODS).map(([key, days]) => (
          <div key={key} className="bg-[#22303C] p-4 rounded-lg border border-[#38444D]">
            <h4 className="text-white font-medium mb-2">{formatRetentionKey(key)}</h4>
            <p className="text-[#8899A6]">{days} dias de retenção</p>
            {stats?.[key.toLowerCase()] && (
              <div className="mt-2 text-sm">
                <p className="text-[#1DA1F2]">
                  {stats[key.toLowerCase()].current} registros ativos
                </p>
                <p className="text-[#FF5555]">
                  {stats[key.toLowerCase()].expired} registros expirados
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-[#22303C] p-6 rounded-lg border border-[#38444D]">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg text-white">Limpeza Automática</h3>
            <p className="text-[#8899A6]">
              Remove automaticamente dados que excederam o período de retenção
            </p>
          </div>
          <button
            onClick={handleCleanup}
            disabled={cleaning}
            className="flex items-center space-x-2 px-4 py-2 bg-[#1DA1F2] text-white rounded hover:bg-[#1A91DA] disabled:opacity-50"
          >
            {cleaning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Limpando...</span>
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                <span>Iniciar Limpeza</span>
              </>
            )}
          </button>
        </div>

        {stats?.lastCleanup && (
          <div className="text-sm text-[#8899A6]">
            Última limpeza: {new Date(stats.lastCleanup).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

const formatRetentionKey = (key) => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default DataRetentionPanel;
