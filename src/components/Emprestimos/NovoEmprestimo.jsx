import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { obterDataAtual, obterHoraAtual } from '../../utils/dateUtils';
import FerramentaSelector from './FerramentaSelector';

const NovoEmprestimo = ({ inventario, adicionarEmprestimo, atualizarDisponibilidade }) => {
  const [novoEmprestimo, setNovoEmprestimo] = useState({
    colaborador: '',
    ferramentas: [],
    dataRetirada: obterDataAtual(),
    horaRetirada: obterHoraAtual()
  });

  const adicionarFerramenta = (ferramenta) => {
    if (!ferramenta || novoEmprestimo.ferramentas.includes(ferramenta)) return;

    // Verificar se a ferramenta existe no inventário
    const itemInventario = inventario.find(item => 
      item.nome.toLowerCase() === ferramenta.toLowerCase() && item.disponivel > 0
    );
    
    if (!itemInventario) return;

    setNovoEmprestimo(prev => ({
      ...prev,
      ferramentas: [...prev.ferramentas, itemInventario.nome]
    }));
  };

  const removerFerramenta = (ferramenta) => {
    setNovoEmprestimo(prev => ({
      ...prev,
      ferramentas: prev.ferramentas.filter(f => f !== ferramenta)
    }));
  };

  const handleSubmit = () => {
    if (!novoEmprestimo.colaborador || novoEmprestimo.ferramentas.length === 0) return;

    const emprestimoAdicionado = adicionarEmprestimo(novoEmprestimo, atualizarDisponibilidade);
    
    if (emprestimoAdicionado) {
      setNovoEmprestimo({
        colaborador: '',
        ferramentas: [],
        dataRetirada: obterDataAtual(),
        horaRetirada: obterHoraAtual()
      });
    }
  };

  const ferramentasDisponiveis = inventario.filter(item => item.disponivel > 0);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Novo Empréstimo</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nome do colaborador"
              value={novoEmprestimo.colaborador}
              onChange={(e) => setNovoEmprestimo({...novoEmprestimo, colaborador: e.target.value})}
              className="form-input"
            />
            <input
              type="date"
              value={novoEmprestimo.dataRetirada}
              onChange={(e) => setNovoEmprestimo({...novoEmprestimo, dataRetirada: e.target.value})}
              className="form-input"
            />
          </div>
          <input
            type="time"
            value={novoEmprestimo.horaRetirada}
            onChange={(e) => setNovoEmprestimo({...novoEmprestimo, horaRetirada: e.target.value})}
            className="form-input w-full"
          />
          
          <FerramentaSelector 
            ferramentasDisponiveis={ferramentasDisponiveis}
            onAdicionarFerramenta={adicionarFerramenta}
          />
        </div>

        <div>
          <h3 className="font-medium text-gray-700 mb-2">Ferramentas Selecionadas:</h3>
          <div className="border border-gray-200 rounded-lg p-3 min-h-32 max-h-40 overflow-y-auto">
            {novoEmprestimo.ferramentas.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhuma ferramenta selecionada</p>
            ) : (
              <div className="space-y-2">
                {novoEmprestimo.ferramentas.map((ferramenta, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <span className="text-sm">{ferramenta}</span>
                    <button
                      onClick={() => removerFerramenta(ferramenta)}
                      className="text-red-500 hover:text-red-700 p-1"
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
            className="mt-4 w-full btn-primary flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Registrar Empréstimo
          </button>
        </div>
      </div>
    </div>
  );
};

export default NovoEmprestimo;