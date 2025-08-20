import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTheme } from '../AlmoxarifadoJardim';
import { obterDataAtual, obterHoraAtual } from '../../utils/dateUtils';
import FerramentaSelector from './FerramentaSelector';

const NovoEmprestimo = ({ inventario, adicionarEmprestimo, atualizarDisponibilidade }) => {
  const { classes } = useTheme();
  const [novoEmprestimo, setNovoEmprestimo] = useState({
    colaborador: '',
    ferramentas: [],
    dataRetirada: obterDataAtual(),
    horaRetirada: obterHoraAtual()
  });

  const ferramentasDisponiveis = inventario.filter(item => item.disponivel > 0);

  // Adiciona ferramenta à lista
  const adicionarFerramenta = (ferramenta) => {
    if (!ferramenta || novoEmprestimo.ferramentas.includes(ferramenta)) return;
    const itemInventario = inventario.find(item => item.nome.toLowerCase() === ferramenta.toLowerCase() && item.disponivel > 0);
    if (!itemInventario) return;
    setNovoEmprestimo(prev => ({
      ...prev,
      ferramentas: [...prev.ferramentas, itemInventario.nome]
    }));
  };

  // Remove ferramenta da lista
  const removerFerramenta = (ferramenta) => {
    setNovoEmprestimo(prev => ({
      ...prev,
      ferramentas: prev.ferramentas.filter(f => f !== ferramenta)
    }));
  };

  // Submete o novo empréstimo
  const handleSubmit = () => {
    if (!novoEmprestimo.colaborador || novoEmprestimo.ferramentas.length === 0) return;
    const novo = {
      ...novoEmprestimo,
      status: 'emprestado',
      dataDevolucao: null,
      horaDevolucao: null
    };
    const emprestimoAdicionado = adicionarEmprestimo(novo, atualizarDisponibilidade);
    if (emprestimoAdicionado) {
      setNovoEmprestimo({
        colaborador: '',
        ferramentas: [],
        dataRetirada: obterDataAtual(),
        horaRetirada: obterHoraAtual()
      });
    }
  };

  return (
    <div className={`${classes.card} p-6`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nome do colaborador"
              value={novoEmprestimo.colaborador}
              onChange={(e) => setNovoEmprestimo({...novoEmprestimo, colaborador: e.target.value})}
              className={`${classes.input} px-3 py-2 focus:ring-2 focus:border-transparent`}
              style={{ '--tw-ring-color': '#bd9967' }}
            />
            <input
              type="date"
              value={novoEmprestimo.dataRetirada}
              onChange={(e) => setNovoEmprestimo({...novoEmprestimo, dataRetirada: e.target.value})}
              className={`${classes.input} px-3 py-2 focus:ring-2 focus:border-transparent`}
              style={{ '--tw-ring-color': '#bd9967' }}
            />
          </div>
          <input
            type="time"
            value={novoEmprestimo.horaRetirada}
            onChange={(e) => setNovoEmprestimo({...novoEmprestimo, horaRetirada: e.target.value})}
            className={`${classes.input} w-full px-3 py-2 focus:ring-2 focus:border-transparent`}
            style={{ '--tw-ring-color': '#bd9967' }}
          />
          <FerramentaSelector 
            ferramentasDisponiveis={ferramentasDisponiveis}
            onAdicionarFerramenta={adicionarFerramenta}
          />
        </div>
        <div>
          <h3 className={`font-medium mb-2 ${classes.textSecondary}`}>
            Ferramentas Selecionadas:
          </h3>
          <div className={`${classes.card} p-3 min-h-32 max-h-40 overflow-y-auto border-0`}>
            {novoEmprestimo.ferramentas.length === 0 ? (
              <p className={`text-sm ${classes.textLight}`}>
                Nenhuma ferramenta selecionada
              </p>
            ) : (
              <div className="space-y-2">
                {novoEmprestimo.ferramentas.map((ferramenta, index) => (
                  <div key={index} className={`flex justify-between items-center ${classes.containerSecondary} p-2 rounded`}>
                    <span className={`text-sm ${classes.textPrimary}`}>
                      {ferramenta}
                    </span>
                    <button
                      onClick={() => removerFerramenta(ferramenta)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 transition-colors duration-200"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!novoEmprestimo.colaborador || novoEmprestimo.ferramentas.length === 0}
            className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-white transition-colors duration-200 ${
              !novoEmprestimo.colaborador || novoEmprestimo.ferramentas.length === 0
                ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                : 'hover:opacity-90'
            }`}
            style={{ 
              backgroundColor: (!novoEmprestimo.colaborador || novoEmprestimo.ferramentas.length === 0) 
                ? undefined 
                : '#bd9967' 
            }}
          >
            <Plus className="w-4 h-4" />
            Registrar Empréstimo
          </button>
        </div>
      </div>
    </div>
  );
}

export default NovoEmprestimo;