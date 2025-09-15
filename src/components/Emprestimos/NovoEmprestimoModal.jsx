import React, { useState } from 'react';
import { Plus, X, Search, Wrench } from 'lucide-react';

const NovoEmprestimoModal = ({ isOpen, onClose, onConfirm, funcionarios, ferramentas }) => {
  const [filtroFerramentas, setFiltroFerramentas] = useState('');
  const [novoEmprestimo, setNovoEmprestimo] = useState({
    funcionarioId: '',
    nomeFuncionario: '',
    ferramentas: []
  });

  // Filtra as ferramentas disponíveis
  const ferramentasDisponiveis = ferramentas
    .filter(f => f.disponivel > 0)
    .filter(f => 
      filtroFerramentas === '' || 
      f.nome.toLowerCase().includes(filtroFerramentas.toLowerCase())
    );

  const handleSelectFuncionario = (e) => {
    const funcionarioId = e.target.value;
    const funcionario = funcionarios.find(f => f.id === funcionarioId);
    if (funcionario) {
      setNovoEmprestimo({
        ...novoEmprestimo,
        funcionarioId: funcionario.id,
        nomeFuncionario: funcionario.nome
      });
    }
  };

  const handleAddFerramenta = (ferramenta) => {
    if (!ferramenta) return;
    
    // Verifica se a ferramenta já foi adicionada
    if (novoEmprestimo.ferramentas.some(f => f.nome === ferramenta.nome)) {
      return;
    }

    setNovoEmprestimo(prev => ({
      ...prev,
      ferramentas: [...prev.ferramentas, {
        nome: ferramenta.nome,
        quantidade: 1,
        disponivel: ferramenta.disponivel
      }]
    }));
  };

  const handleRemoverFerramenta = (nome) => {
    setNovoEmprestimo(prev => ({
      ...prev,
      ferramentas: prev.ferramentas.filter(f => f.nome !== nome)
    }));
  };

  const handleSubmit = () => {
    if (!novoEmprestimo.funcionarioId || novoEmprestimo.ferramentas.length === 0) {
      return;
    }

    onConfirm(novoEmprestimo);
    onClose();
    // Limpa o formulário
    setNovoEmprestimo({
      funcionarioId: '',
      nomeFuncionario: '',
      ferramentas: []
    });
    setFiltroFerramentas('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#192734] rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Novo Empréstimo</h2>
          <button
            onClick={onClose}
            className="text-[#8899A6] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Seleção de Funcionário */}
          <div>
            <label className="block text-[#8899A6] mb-2">Funcionário</label>
            <select
              value={novoEmprestimo.funcionarioId}
              onChange={handleSelectFuncionario}
              className="w-full bg-[#253341] border border-[#38444D] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]"
            >
              <option value="">Selecione um funcionário</option>
              {funcionarios.map(funcionario => (
                <option key={funcionario.id} value={funcionario.id}>
                  {funcionario.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Busca de Ferramentas */}
          <div>
            <label className="block text-[#8899A6] mb-2">Ferramentas Disponíveis</label>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8899A6]" />
              <input
                type="text"
                value={filtroFerramentas}
                onChange={(e) => setFiltroFerramentas(e.target.value)}
                placeholder="Buscar ferramentas..."
                className="w-full bg-[#253341] border border-[#38444D] text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]"
              />
            </div>

            {/* Lista de Ferramentas Disponíveis */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {ferramentasDisponiveis.map(ferramenta => (
                <button
                  key={ferramenta.nome}
                  onClick={() => handleAddFerramenta(ferramenta)}
                  className="flex items-center gap-2 p-2 rounded-lg bg-[#253341] hover:bg-[#2C3E50] transition-colors text-left"
                >
                  <Wrench className="w-4 h-4 text-[#1DA1F2]" />
                  <span className="text-white">{ferramenta.nome}</span>
                  <span className="text-[#8899A6] text-sm ml-auto">
                    Disponível: {ferramenta.disponivel}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Ferramentas Selecionadas */}
          <div>
            <h3 className="text-[#8899A6] mb-2">Ferramentas Selecionadas</h3>
            <div className="space-y-2">
              {novoEmprestimo.ferramentas.map(ferramenta => (
                <div
                  key={ferramenta.nome}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#253341]"
                >
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-[#1DA1F2]" />
                    <span className="text-white">{ferramenta.nome}</span>
                  </div>
                  <button
                    onClick={() => handleRemoverFerramenta(ferramenta.nome)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#253341] text-[#8899A6] hover:bg-[#2C3E50] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!novoEmprestimo.funcionarioId || novoEmprestimo.ferramentas.length === 0}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                novoEmprestimo.funcionarioId && novoEmprestimo.ferramentas.length > 0
                  ? 'bg-[#1DA1F2] hover:bg-[#1A91DA] text-white'
                  : 'bg-[#253341] text-[#8899A6] cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              Registrar Empréstimo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NovoEmprestimoModal;
