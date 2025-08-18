import React, { useState } from 'react';
import { Plus } from 'lucide-react';

const FerramentaSelector = ({ ferramentasDisponiveis, onAdicionarFerramenta }) => {
  const [buscaFerramenta, setBuscaFerramenta] = useState('');
  const [ferramentaSelecionada, setFerramentaSelecionada] = useState('');
  const [sugestoesVisiveis, setSugestoesVisiveis] = useState(false);

  const filtrarFerramentas = (texto) => {
    if (!texto) return [];
    return ferramentasDisponiveis
      .filter(item => 
        item.nome.toLowerCase().includes(texto.toLowerCase())
      )
      .slice(0, 8);
  };

  const selecionarFerramenta = (ferramenta) => {
    setBuscaFerramenta(ferramenta);
    setFerramentaSelecionada(ferramenta);
    setSugestoesVisiveis(false);
  };

  const adicionarFerramenta = () => {
    const ferramenta = ferramentaSelecionada || buscaFerramenta;
    if (ferramenta) {
      onAdicionarFerramenta(ferramenta);
      setFerramentaSelecionada('');
      setBuscaFerramenta('');
      setSugestoesVisiveis(false);
    }
  };

  return (
    <div className="flex gap-2 relative">
      {/* Campo de busca com autocompletar */}
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="Digite o nome da ferramenta..."
          value={buscaFerramenta}
          onChange={(e) => {
            setBuscaFerramenta(e.target.value);
            setFerramentaSelecionada('');
            setSugestoesVisiveis(e.target.value.length > 0);
          }}
          onFocus={() => setSugestoesVisiveis(buscaFerramenta.length > 0)}
          onBlur={() => setTimeout(() => setSugestoesVisiveis(false), 200)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              adicionarFerramenta();
            }
          }}
          className="form-input"
        />
        
        {/* Dropdown de sugestões */}
        {sugestoesVisiveis && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {filtrarFerramentas(buscaFerramenta).map(item => (
              <button
                key={item.id}
                onClick={() => selecionarFerramenta(item.nome)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-sm">{item.nome}</div>
                <div className="text-xs text-gray-500">
                  {item.categoria} • Disponível: {item.disponivel}
                </div>
              </button>
            ))}
            {filtrarFerramentas(buscaFerramenta).length === 0 && buscaFerramenta && (
              <div className="px-3 py-2 text-gray-500 text-sm">
                Nenhuma ferramenta encontrada
              </div>
            )}
          </div>
        )}
      </div>

      {/* Select tradicional como alternativa */}
      <select
        value={ferramentaSelecionada}
        onChange={(e) => {
          setFerramentaSelecionada(e.target.value);
          setBuscaFerramenta(e.target.value);
          setSugestoesVisiveis(false);
        }}
        className="form-select min-w-48"
      >
        <option value="">Ou selecione...</option>
        {ferramentasDisponiveis.map(item => (
          <option key={item.id} value={item.nome}>
            {item.nome.length > 30 ? `${item.nome.substring(0, 30)}...` : item.nome} ({item.disponivel})
          </option>
        ))}
      </select>

      <button
        onClick={adicionarFerramenta}
        disabled={!buscaFerramenta && !ferramentaSelecionada}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};

export default FerramentaSelector;