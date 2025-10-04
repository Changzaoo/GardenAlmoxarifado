import React, { useState } from 'react';
import { X, Users, User, Search } from 'lucide-react';

const NovaConversaModal = ({ funcionarios, onClose, onCriarIndividual, onCriarGrupo }) => {
  const [tipo, setTipo] = useState('individual'); // 'individual' ou 'grupo'
  const [busca, setBusca] = useState('');
  const [nomeGrupo, setNomeGrupo] = useState('');
  const [selecionados, setSelecionados] = useState([]);

  const funcionariosFiltrados = funcionarios.filter(f =>
    f.nome.toLowerCase().includes(busca.toLowerCase()) ||
    f.cargo?.toLowerCase().includes(busca.toLowerCase())
  );

  const toggleSelecionado = (funcId) => {
    setSelecionados(prev =>
      prev.includes(funcId)
        ? prev.filter(id => id !== funcId)
        : [...prev, funcId]
    );
  };

  const handleCriar = () => {
    if (tipo === 'individual' && selecionados.length === 1) {
      onCriarIndividual(selecionados[0]);
    } else if (tipo === 'grupo' && nomeGrupo.trim() && selecionados.length >= 2) {
      onCriarGrupo(nomeGrupo, selecionados);
    }
  };

  const podeConfirmar = 
    (tipo === 'individual' && selecionados.length === 1) ||
    (tipo === 'grupo' && nomeGrupo.trim() && selecionados.length >= 2);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Nova Conversa
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tipo de conversa */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setTipo('individual');
                setSelecionados([]);
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                tipo === 'individual'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Individual
            </button>
            <button
              onClick={() => {
                setTipo('grupo');
                setSelecionados([]);
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                tipo === 'grupo'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Grupo
            </button>
          </div>
        </div>

        {/* Nome do grupo (apenas para grupos) */}
        {tipo === 'grupo' && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Nome do grupo"
              value={nomeGrupo}
              onChange={(e) => setNomeGrupo(e.target.value)}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Busca */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar funcionários..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Contador de selecionados */}
          {selecionados.length > 0 && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {selecionados.length} {tipo === 'grupo' ? 'participante(s)' : 'funcionário'} selecionado(s)
            </div>
          )}
        </div>

        {/* Lista de funcionários */}
        <div className="flex-1 overflow-y-auto p-4">
          {funcionariosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                {busca ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário disponível'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {funcionariosFiltrados.map((funcionario) => {
                const isSelecionado = selecionados.includes(funcionario.id);
                const podeSelecionar = tipo === 'grupo' || selecionados.length === 0 || isSelecionado;

                return (
                  <button
                    key={funcionario.id}
                    onClick={() => toggleSelecionado(funcionario.id)}
                    disabled={!podeSelecionar}
                    className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                      isSelecionado
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                        : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'
                    } ${!podeSelecionar ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isSelecionado ? 'bg-blue-500' : 'bg-gradient-to-br from-blue-500 to-blue-600'
                    } text-white font-semibold`}>
                      {funcionario.avatar ? (
                        <img 
                          src={funcionario.avatar} 
                          alt={funcionario.nome}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        funcionario.nome.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {funcionario.nome}
                      </h4>
                      {funcionario.cargo && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {funcionario.cargo}
                        </p>
                      )}
                    </div>

                    {/* Checkbox */}
                    {podeSelecionar && (
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelecionado
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelecionado && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCriar}
            disabled={!podeConfirmar}
            className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {tipo === 'individual' ? 'Iniciar Conversa' : 'Criar Grupo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NovaConversaModal;
