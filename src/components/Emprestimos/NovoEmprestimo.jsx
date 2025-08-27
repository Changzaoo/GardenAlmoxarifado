import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { obterDataAtual, obterHoraAtual } from '../../utils/dateUtils';
import FerramentaSelector from './FerramentaSelector';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { NIVEIS_PERMISSAO } from '../AlmoxarifadoJardim';

const NovoEmprestimo = ({ inventario, adicionarEmprestimo, atualizarDisponibilidade }) => {
  const [funcionarios, setFuncionarios] = useState([]);

  // Carregar funcionários
  useEffect(() => {
    const q = query(
      collection(db, 'usuarios'),
      where('nivel', '==', NIVEIS_PERMISSAO.FUNCIONARIO)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const funcionariosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFuncionarios(funcionariosData);
    });

    return () => unsubscribe();
  }, []);

  // Adiciona ferramenta à lista com quantidade
  const adicionarFerramenta = (ferramenta, quantidade = 1) => {
    if (!ferramenta) return;
    const itemInventario = inventario.find(item => item.nome.toLowerCase() === ferramenta.toLowerCase() && item.disponivel > 0);
    if (!itemInventario) return;

    // Verifica se a ferramenta já existe na lista
    const ferramentaExistente = novoEmprestimo.ferramentas.find(f => f.nome === itemInventario.nome);
    if (ferramentaExistente) return;

    if (quantidade > itemInventario.disponivel) {
      quantidade = itemInventario.disponivel;
    }

    setNovoEmprestimo(prev => ({
      ...prev,
      ferramentas: [...prev.ferramentas, {
        nome: itemInventario.nome,
        quantidade: quantidade,
        disponivel: itemInventario.disponivel
      }]
    }));
  };

  // Remove ferramenta da lista
  const removerFerramenta = (ferramenta) => {
    setNovoEmprestimo(prev => ({
      ...prev,
      ferramentas: prev.ferramentas.filter(f => f.nome !== ferramenta)
    }));
  };

  // Atualiza a quantidade de uma ferramenta
  const atualizarQuantidade = (nome, quantidade) => {
    setNovoEmprestimo(prev => ({
      ...prev,
      ferramentas: prev.ferramentas.map(f => 
        f.nome === nome 
          ? { ...f, quantidade: parseInt(quantidade) }
          : f
      )
    }));
  };

  // Submete o novo empréstimo
  const handleSubmit = () => {
    if (!novoEmprestimo.colaborador) {
      alert('Por favor, selecione um funcionário');
      return;
    }
    
    if (novoEmprestimo.ferramentas.length === 0) {
      alert('Por favor, selecione pelo menos uma ferramenta');
      return;
    }

    const funcionarioSelecionado = funcionarios.find(f => f.nome === novoEmprestimo.colaborador);
    if (!funcionarioSelecionado) {
      alert('Funcionário não encontrado');
      return;
    }

    // Verifica se as quantidades são válidas
    for (const ferramenta of novoEmprestimo.ferramentas) {
      const itemInventario = inventario.find(item => item.nome === ferramenta.nome);
      if (!itemInventario || ferramenta.quantidade > itemInventario.disponivel) {
        alert(`Quantidade indisponível para ${ferramenta.nome}`);
        return;
      }
    }

    const novo = {
      ...novoEmprestimo,
      status: 'emprestado',
      dataDevolucao: null,
      horaDevolucao: null,
      funcionarioId: funcionarioSelecionado.id,
      // Mapeia as ferramentas para incluir apenas nome e quantidade
      ferramentas: novoEmprestimo.ferramentas.map(f => ({
        nome: f.nome,
        quantidade: f.quantidade
      }))
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
  const [novoEmprestimo, setNovoEmprestimo] = useState({
    colaborador: '',
    ferramentas: [],
    dataRetirada: obterDataAtual(),
    horaRetirada: obterHoraAtual()
  });

  const ferramentasDisponiveis = inventario.filter(item => item.disponivel > 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={novoEmprestimo.colaborador}
              onChange={(e) => setNovoEmprestimo({...novoEmprestimo, colaborador: e.target.value})}
              className="form-select w-full rounded-lg border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Selecione o funcionário</option>
              {funcionarios.map((funcionario) => (
                <option key={funcionario.id} value={funcionario.nome}>
                  {funcionario.nome}
                </option>
              ))}
            </select>
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
                    <div className="flex items-center gap-3">
                      <span className="text-sm">{ferramenta.nome}</span>
                      <select
                        value={ferramenta.quantidade}
                        onChange={(e) => atualizarQuantidade(ferramenta.nome, e.target.value)}
                        className="form-select text-sm border-gray-300 rounded-md"
                      >
                        {[...Array(ferramenta.disponivel)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => removerFerramenta(ferramenta.nome)}
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
}

export default NovoEmprestimo;