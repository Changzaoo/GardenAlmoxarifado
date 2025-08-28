import React, { useCallback } from 'react';
import { Download, Upload, AlertCircle } from 'lucide-react';
import { exportarDados, importarDados } from '../../utils/dataExportImport';

const ExportImportButtons = ({ colecao, onSuccess, onError }) => {
  const handleExportar = async () => {
    const resultado = await exportarDados(colecao);
    if (resultado.success) {
      onSuccess?.(resultado.message);
    } else {
      onError?.(resultado.message);
    }
  };

  const handleImportar = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const resultado = await importarDados(colecao, file);
      if (resultado.success) {
        onSuccess?.(resultado.message);
      } else {
        onError?.(resultado.message);
      }
    } catch (error) {
      onError?.(error.message);
    }
    
    // Limpa o input para permitir selecionar o mesmo arquivo novamente
    event.target.value = '';
  }, [colecao, onSuccess, onError]);

  return (
    <div className="flex items-center gap-2">
      {/* Botão de Exportar */}
      <button
        onClick={handleExportar}
        className="px-4 py-2 bg-[#1DA1F2] bg-opacity-10 hover:bg-opacity-20 text-[#1DA1F2] rounded-full text-sm font-medium flex items-center gap-2 transition-colors"
        title="Exportar dados"
      >
        <Download className="w-4 h-4" />
        Exportar
      </button>

      {/* Botão de Importar */}
      <label className="px-4 py-2 bg-[#1DA1F2] bg-opacity-10 hover:bg-opacity-20 text-[#1DA1F2] rounded-full text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer">
        <Upload className="w-4 h-4" />
        Importar
        <input
          type="file"
          accept=".json"
          onChange={handleImportar}
          className="hidden"
        />
      </label>

      {/* Ícone de ajuda */}
      <div className="group relative">
        <AlertCircle className="w-5 h-5 text-[#8899A6] cursor-help" />
        <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-64 bg-[#15202B] text-[#FFFFFF] text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-[#38444D]">
          <p className="mb-1"><strong>Exportar:</strong> Baixa os dados em formato JSON.</p>
          <p><strong>Importar:</strong> Carrega dados de um arquivo JSON compatível.</p>
        </div>
      </div>
    </div>
  );
};

export default ExportImportButtons;
