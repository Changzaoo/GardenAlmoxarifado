import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

const FerramentaSelector = ({ ferramentasDisponiveis, onAdicionarFerramenta }) => {
  const [buscaFerramenta, setBuscaFerramenta] = useState('');
  const [ferramentaSelecionada, setFerramentaSelecionada] = useState('');
  const [sugestoesVisiveis, setSugestoesVisiveis] = useState(false);
  const quantidadeRef = React.useRef();

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
      const itemInventario = ferramentasDisponiveis.find(
        item => item.nome.toLowerCase() === ferramenta.toLowerCase()
      );
      
      if (itemInventario) {
        const quantidade = parseInt(quantidadeRef.current?.value || '1');
        if (quantidade <= itemInventario.disponivel) {
          onAdicionarFerramenta(itemInventario.nome, quantidade);
          setFerramentaSelecionada('');
          setBuscaFerramenta('');
          setSugestoesVisiveis(false);
          if (quantidadeRef.current) quantidadeRef.current.value = '1';
        } else {
          alert(`Apenas ${itemInventario.disponivel} unidade(s) disponível(is) de ${ferramenta}`);
        }
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 relative">
      {/* Select tradicional como alternativa */}
      <select
        value={ferramentaSelecionada}
        onChange={(e) => {
          setFerramentaSelecionada(e.target.value);
          setBuscaFerramenta(e.target.value);
          setSugestoesVisiveis(false);
        }}
        className="min-w-48 mb-2 bg-[#253341] border border-[#38444D] text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] transition-colors appearance-none"
      >
        <option value="" className="bg-[#192734]">Selecione uma ferramenta...</option>
        {ferramentasDisponiveis.map(item => (
          <option key={item.id} value={item.nome} className="bg-[#192734]">
            {item.nome} ({item.disponivel})
          </option>
        ))}
      </select>

      {/* Campo de busca com autocompletar - agora maior e abaixo do select, com botão à direita */}
      <div className="w-full relative flex items-center gap-2">
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
          className="form-input w-full text-lg py-3"
        />
        <div className="flex gap-2">
          <select
            defaultValue={1}
            ref={quantidadeRef}
            onChange={(e) => {
              const quantidade = parseInt(e.target.value);
              if (isNaN(quantidade) || quantidade < 1) e.target.value = '1';
            }}
            className="w-20 bg-[#253341] border border-[#38444D] text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] transition-colors appearance-none"
          >
            {[...Array(10)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
          <button
            onClick={adicionarFerramenta}
            disabled={!buscaFerramenta && !ferramentaSelecionada}
            className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            style={{ minWidth: '2.5rem' }}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        {/* Dropdown de sugestões */}
        {sugestoesVisiveis && (
          <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
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
    </div>
  );
};

export default FerramentaSelector;