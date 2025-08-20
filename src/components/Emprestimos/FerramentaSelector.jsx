import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useTheme } from '../AlmoxarifadoJardim';

const FerramentaSelector = ({ ferramentasDisponiveis, onAdicionarFerramenta }) => {
  const { classes } = useTheme();
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
    <div className="flex flex-col gap-4 relative">
      {/* Select tradicional como alternativa */}
      <select
        value={ferramentaSelecionada}
        onChange={(e) => {
          setFerramentaSelecionada(e.target.value);
          setBuscaFerramenta(e.target.value);
          setSugestoesVisiveis(false);
        }}
        className={`${classes.formSelect} min-w-48 mb-2`}
      >
        <option value="">Selecione uma ferramenta...</option>
        {ferramentasDisponiveis.map(item => (
          <option key={item.id} value={item.nome}>
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
          className={`${classes.input} w-full text-lg py-3 focus:ring-2 focus:border-transparent`}
          style={{ '--tw-ring-color': '#bd9967' }}
        />
        <button
          onClick={adicionarFerramenta}
          disabled={!buscaFerramenta && !ferramentaSelecionada}
          className={`px-3 py-2 rounded-lg text-white transition-colors duration-200 ${
            !buscaFerramenta && !ferramentaSelecionada
              ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
              : 'hover:opacity-90'
          }`}
          style={{ 
            minWidth: '2.5rem',
            backgroundColor: (!buscaFerramenta && !ferramentaSelecionada) ? undefined : '#3b82f6'
          }}
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        
        {/* Dropdown de sugestões */}
        {sugestoesVisiveis && (
          <div className={`absolute top-full left-0 right-0 ${classes.card} shadow-lg z-10 max-h-48 overflow-y-auto border-0`}>
            {filtrarFerramentas(buscaFerramenta).map(item => (
              <button
                key={item.id}
                onClick={() => selecionarFerramenta(item.nome)}
                className={`w-full text-left px-3 py-2 hover:${classes.containerSecondary} ${classes.divider} last:border-b-0 transition-colors duration-200`}
              >
                <div className={`font-medium text-sm ${classes.textPrimary}`}>
                  {item.nome}
                </div>
                <div className={`text-xs ${classes.textMuted}`}>
                  {item.categoria} • Disponível: {item.disponivel}
                </div>
              </button>
            ))}
            {filtrarFerramentas(buscaFerramenta).length === 0 && buscaFerramenta && (
              <div className={`px-3 py-2 text-sm ${classes.textMuted}`}>
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