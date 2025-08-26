import React, { useState, useEffect, useRef } from 'react';
import { Users, X } from 'lucide-react';

const FuncionarioSelector = ({ funcionarios, onSelecionarFuncionarios }) => {
  const [buscaFuncionario, setBuscaFuncionario] = useState('');
  const [sugestoesVisiveis, setSugestoesVisiveis] = useState(false);
  const [selecionados, setSelecionados] = useState([]);
  const ref = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setSugestoesVisiveis(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref]);

  useEffect(() => {
    return () => {
      setSelecionados([]);
      onSelecionarFuncionarios([]);
    };
  }, []);

  const filtrarFuncionarios = (texto) => {
    return funcionarios
      .filter(item => 
        (!texto || item.nome.toLowerCase().includes(texto.toLowerCase())) &&
        !selecionados.includes(item.id)
      )
      .slice(0, 15); // Aumentei o limite para mostrar mais funcionários
  };

  const handleSelecionarFuncionario = (funcionario) => {
    if (!onSelecionarFuncionarios) return;
    const novosSelecionados = [...selecionados, funcionario.id];
    setSelecionados(novosSelecionados);
    onSelecionarFuncionarios(novosSelecionados);
    setBuscaFuncionario('');
    setSugestoesVisiveis(false);
  };

  const handleRemoverFuncionario = (funcionarioId) => {
    if (!onSelecionarFuncionarios) return;
    const novosSelecionados = selecionados.filter(id => id !== funcionarioId);
    setSelecionados(novosSelecionados);
    onSelecionarFuncionarios(novosSelecionados);
  };

  const sugestoes = filtrarFuncionarios(buscaFuncionario);
  const funcionariosSelecionados = funcionarios.filter(f => selecionados.includes(f.id));

  return (
    <div className="flex flex-col gap-2" ref={ref}>
      <div className="relative">
        <button
          onClick={() => setSugestoesVisiveis(!sugestoesVisiveis)}
          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg flex items-center justify-between hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700">
              {buscaFuncionario || "Selecionar funcionários..."}
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${
              sugestoesVisiveis ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {sugestoesVisiveis && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100">
              <div className="flex items-center px-3 py-2">
                <input
                  type="text"
                  value={buscaFuncionario}
                  onChange={(e) => setBuscaFuncionario(e.target.value)}
                  placeholder="Digite para filtrar funcionários..."
                  className="w-full px-2 py-1 text-sm border-none focus:ring-0 focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            {sugestoes.length > 0 ? (
              sugestoes.map((funcionario) => (
                <button
                  key={funcionario.id}
                  onClick={() => handleSelecionarFuncionario(funcionario)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {funcionario.nome}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {funcionario.cargo || 'Funcionário'}
                  </span>
                </button>
              ))
            ) : funcionarios.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">
                Nenhum funcionário cadastrado
              </div>
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500">
                Nenhum funcionário encontrado com esse filtro
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lista de funcionários selecionados */}
      <div className="mt-2 flex flex-wrap gap-2">
        {funcionariosSelecionados.map((funcionario) => (
          <div
            key={funcionario.id}
            className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200"
          >
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">{funcionario.nome}</span>
            <button
              onClick={() => handleRemoverFuncionario(funcionario.id)}
              className="p-0.5 hover:bg-green-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FuncionarioSelector;
