import React from 'react';
import { Download, X } from 'lucide-react';

const NewVersionModal = ({ isOpen, onClose, version, changes, onUpdate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
        {/* Botão de fechar */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="mb-6">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full mb-4 mx-auto">
            <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-2">
            Nova versão disponível!
          </h2>
          <p className="text-sm text-center text-gray-600 dark:text-gray-300">
            A versão {version} está disponível com novas funcionalidades e melhorias.
          </p>
        </div>

        {/* Lista de mudanças */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            O que há de novo:
          </h3>
          <ul className="space-y-2">
            {changes.map((change, index) => (
              <li key={index} className="flex items-start">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-300">{change}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onUpdate}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Atualizar agora
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
          >
            Lembrar mais tarde
          </button>
        </div>

        {/* Nota de rodapé */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
          A atualização pode levar alguns minutos. Recomendamos salvar seu trabalho antes de prosseguir.
        </p>
      </div>
    </div>
  );
};

export default NewVersionModal;
