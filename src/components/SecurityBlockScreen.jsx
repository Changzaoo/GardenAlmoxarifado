import React from 'react';

const SecurityBlockScreen = () => {
  return (
    <div className="fixed inset-0 bg-[#15202B] flex items-center justify-center">
      <div className="bg-[#192734] p-8 rounded-xl max-w-md w-full mx-4 border border-[#38444D] text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">🚫 Acesso Bloqueado</h2>
        <div className="text-[#8899A6] space-y-4">
          <p>
            As Ferramentas de Desenvolvedor (DevTools) foram detectadas.
            <br />
            Por motivos de segurança, o sistema não pode ser carregado.
          </p>
          <div className="bg-[#253341] p-4 rounded-lg">
            <p className="font-medium text-white">Para acessar o sistema:</p>
            <ol className="text-sm text-left mt-2 space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#192734] flex items-center justify-center text-xs">1</span>
                Feche as Ferramentas de Desenvolvedor (F12 ou DevTools)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#192734] flex items-center justify-center text-xs">2</span>
                Clique no botão abaixo para verificar
              </li>
            </ol>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 bg-[#1DA1F2] text-white px-6 py-2 rounded-lg hover:bg-[#1a91da] transition-colors"
        >
          Verificar Novamente
        </button>
      </div>
    </div>
  );
};

export default SecurityBlockScreen;