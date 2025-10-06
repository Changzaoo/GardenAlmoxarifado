import React, { memo } from 'react';
import { X, Loader, AlertTriangle } from 'lucide-react';

const WorkPontoCameraModal = memo(({ 
  showCamera,
  videoRef,
  canvasRef,
  faceDetected,
  matching,
  error,
  onClose,
  onCapture,
  tipoPonto
}) => {
  if (!showCamera) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 p-3 sm:p-6 text-white flex items-center justify-between z-10">
          <h3 className="text-base sm:text-lg font-bold">
            {tipoPonto === 'teste' ? 'Teste de Reconhecimento Facial' : `Registrar ${tipoPonto === 'entrada' ? 'Entrada' : 'Saída'}`}
          </h3>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 rounded-lg p-1.5 sm:p-2 transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-2 sm:p-4">
          <div className="relative rounded-xl overflow-hidden bg-gray-900 mb-3 sm:mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full"
              style={{ maxHeight: '60vh', objectFit: 'cover' }}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
            />
            
            {/* Indicador de Rosto Detectado */}
            <div className="absolute top-2 sm:top-4 right-2 sm:right-4 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/60 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
                <span className="text-white text-xs sm:text-sm font-medium">
                  {faceDetected ? 'Rosto OK' : 'Procurando...'}
                </span>
              </div>
            </div>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          {/* Botão Registrar */}
          <button
            onClick={onCapture}
            disabled={!faceDetected || matching}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 sm:py-3 px-4 rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {matching ? (
              <>
                <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span className="hidden sm:inline">Verificando identidade...</span>
                <span className="sm:hidden">Verificando...</span>
              </>
            ) : (
              <span>{tipoPonto === 'teste' ? 'Testar Reconhecimento' : 'Registrar Ponto'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

WorkPontoCameraModal.displayName = 'WorkPontoCameraModal';

export default WorkPontoCameraModal;
