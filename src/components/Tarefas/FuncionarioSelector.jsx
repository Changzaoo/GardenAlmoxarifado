import React, { useState, useEffect, useRef } from 'react';
import { Users, X } from 'lucide-react';
import { twitterThemeConfig } from '../../styles/twitterThemeConfig';

const FuncionarioSelector = ({ funcionarios, onSelecionarFuncionarios }) => {
  const { colors, classes } = twitterThemeConfig;
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
    const novosSelecionados = [...selecionados, funcionario.id]; // Armazena o ID
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

  // Função auxiliar para pegar o nome do funcionário pelo ID
  const getNomeFuncionario = (id) => {
    const funcionario = funcionarios.find(f => f.id === id);
    return funcionario ? funcionario.nome : 'Funcionário não encontrado';
  };

  return (
    <div className="flex flex-col gap-2" ref={ref}>
      <div className="relative">
        <button
          onClick={() => setSugestoesVisiveis(!sugestoesVisiveis)}
          className={`w-full px-4 py-2 ${classes.select} flex items-center justify-between`}
        >
          <div className="flex items-center gap-2">
            <Users className={`w-4 h-4 ${colors.textSecondary}`} />
            <span className={colors.text}>
              {buscaFuncionario || "Selecionar funcionários..."}
            </span>
          </div>
          <svg
            className={`w-4 h-4 ${colors.textSecondary} transition-transform ${
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
          <div className={`absolute z-10 w-full mt-1 ${classes.card} max-h-64 overflow-auto`}>
            <div className={`sticky top-0 ${classes.card} border-b border-gray-100`}>
              <div className="flex items-center px-3 py-2">
                <input
                  type="text"
                  value={buscaFuncionario}
                  onChange={(e) => setBuscaFuncionario(e.target.value)}
                  placeholder="Digite para filtrar funcionários..."
                  className={`w-full px-2 py-1 text-sm ${classes.input} border-none focus:ring-0`}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            {sugestoes.length > 0 ? (
              sugestoes.map((funcionario) => (
                <button
                  key={funcionario.id}
                  onClick={() => handleSelecionarFuncionario(funcionario)}
                  className={`w-full px-4 py-2 text-left ${classes.hoverBg} flex items-center gap-2 transition-colors`}
                >
                  <Users className={`w-4 h-4 ${colors.textSecondary}`} />
                  <span className={`text-sm font-medium ${colors.text}`}>
                    {funcionario.nome}
                  </span>
                  <span className={`text-xs ${colors.textSecondary} ml-auto`}>
                    {funcionario.cargo || 'Funcionário'}
                  </span>
                </button>
              ))
            ) : funcionarios.length === 0 ? (
              <div className={`px-4 py-2 text-sm ${colors.textSecondary}`}>
                Nenhum funcionário cadastrado
              </div>
            ) : (
              <div className={`px-4 py-2 text-sm ${colors.textSecondary}`}>
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
            className={`inline-flex items-center gap-2 px-3 py-1 ${colors.primaryLight} ${colors.primary} rounded-full`}
          >
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">{funcionario.nome}</span>
            <button
              onClick={() => handleRemoverFuncionario(funcionario.id)}
              className={`p-0.5 hover:${colors.primaryLightHover} rounded-full transition-colors`}
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