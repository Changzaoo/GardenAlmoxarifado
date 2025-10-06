import React, { memo } from 'react';
import { CheckCircle } from 'lucide-react';

const WorkPontoSuccessMessage = memo(({ testSuccess }) => {
  if (!testSuccess) return null;

  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-4 sm:p-6 shadow-2xl animate-fade-in">
      <div className="flex items-start gap-3 sm:gap-4">
        <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 animate-bounce" />
        <div className="flex-1">
          <h3 className="font-bold text-lg sm:text-xl mb-2">
            ✅ Reconhecimento Facial Funcionando!
          </h3>
          <p className="text-sm sm:text-base mb-3 text-white/90">
            Seu rosto foi reconhecido com sucesso! O sistema está pronto para uso.
          </p>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Similaridade:</span>
              <span className="text-xl font-bold">{testSuccess.similarity}%</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-white/80">
            🎯 Agora você pode registrar seus pontos normalmente usando os botões abaixo.
          </p>
        </div>
      </div>
    </div>
  );
});

WorkPontoSuccessMessage.displayName = 'WorkPontoSuccessMessage';

export default WorkPontoSuccessMessage;
