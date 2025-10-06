import React, { memo } from 'react';
import { AlertTriangle, Image as ImageIcon, Loader } from 'lucide-react';

const WorkPontoReferencePhoto = memo(({ 
  imageUrl, 
  setImageUrl, 
  savingUrl, 
  handleSaveImageUrl 
}) => {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-xl p-4 sm:p-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">
            Cadastre sua Foto de Referência
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
            Para usar o sistema de ponto com reconhecimento facial, você precisa cadastrar uma foto sua de referência.
          </p>
          
          {/* Campo de URL */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Inserir link da imagem
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemplo.com/minha-foto.jpg"
                disabled={savingUrl}
                className="flex-1 px-3 sm:px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              />
              <button
                onClick={handleSaveImageUrl}
                disabled={savingUrl || !imageUrl.trim()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
              >
                {savingUrl ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Salvando...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    <span>Salvar</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Cole o link direto da sua foto (deve ser acessível publicamente)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

WorkPontoReferencePhoto.displayName = 'WorkPontoReferencePhoto';

export default WorkPontoReferencePhoto;
