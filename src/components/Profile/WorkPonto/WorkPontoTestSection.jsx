import React, { memo } from 'react';
import { CheckCircle, Camera } from 'lucide-react';

const WorkPontoTestSection = memo(({ modelsLoaded, onTestClick }) => {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-4 sm:p-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">
            Foto de Referência Cadastrada ✓
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
            Sua foto de referência está salva. Teste o reconhecimento facial antes de registrar seu ponto!
          </p>
          
          <button
            onClick={onTestClick}
            disabled={!modelsLoaded}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Camera className="w-5 h-5" />
            <span>Testar Reconhecimento Facial</span>
          </button>
        </div>
      </div>
    </div>
  );
});

WorkPontoTestSection.displayName = 'WorkPontoTestSection';

export default WorkPontoTestSection;
