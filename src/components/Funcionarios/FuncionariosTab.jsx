import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Users, Trash2, Plus, Edit } from 'lucide-react';

const FuncionariosTab = ({ funcionarios, adicionarFuncionario, removerFuncionario, atualizarFuncionario, readonly }) => {
  const [novoFuncionario, setNovoFuncionario] = useState({ nome: '', cargo: '', telefone: '' });
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({ nome: '', cargo: '', telefone: '' });
  const { usuario } = useAuth();
  const isFuncionario = usuario?.nivel === 'funcionario';

  const handleEditar = (func) => {
    setEditando(func);
    setFormEdit({ nome: func.nome, cargo: func.cargo, telefone: func.telefone });
  };

  const handleAdicionar = async (e) => {
    e.preventDefault();
    setLoading(true);
    await adicionarFuncionario(novoFuncionario);
    setNovoFuncionario({ nome: '', cargo: '', telefone: '' });
    setLoading(false);
  };

  const handleSalvarEdicao = async () => {
    setLoading(true);
    await atualizarFuncionario(editando.id, formEdit);
    setEditando(null);
    setLoading(false);
  };

  const handleRemover = async (id) => {
    setLoading(true);
    await removerFuncionario(id);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {!isFuncionario && !readonly && (
        <form onSubmit={handleAdicionar} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Nome"
            value={novoFuncionario.nome}
            onChange={e => setNovoFuncionario({ ...novoFuncionario, nome: e.target.value })}
            className="form-input px-3 py-2 rounded border"
            required
          />
          <input
            type="text"
            placeholder="Cargo"
            value={novoFuncionario.cargo}
            onChange={e => setNovoFuncionario({ ...novoFuncionario, cargo: e.target.value })}
            className="form-input px-3 py-2 rounded border"
            required
          />
          <input
            type="text"
            placeholder="Telefone"
            value={novoFuncionario.telefone}
            onChange={e => {
              const onlyNums = e.target.value.replace(/[^0-9]/g, '');
              setNovoFuncionario({ ...novoFuncionario, telefone: onlyNums });
            }}
            className="form-input px-3 py-2 rounded border"
            required
            maxLength={15}
          />
          <button type="submit" className="btn-primary flex items-center gap-2 px-4 py-2 rounded bg-green-600 text-white" disabled={loading}>
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </form>
      )}
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cargo</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {funcionarios.map((func) => (
            <tr key={func.id} className="bg-white">
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{func.nome}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{func.cargo}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{func.telefone}</td>
              <td className="px-4 py-2 flex gap-2">
                {!isFuncionario && !readonly && (
                  <>
                    <button onClick={() => handleEditar(func)} className="text-blue-600 hover:text-blue-800">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleRemover(func.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!isFuncionario && editando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Funcionário</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nome"
                value={formEdit.nome}
                onChange={e => setFormEdit({ ...formEdit, nome: e.target.value })}
                className="form-input w-full"
              />
              <input
                type="text"
                placeholder="Cargo"
                value={formEdit.cargo}
                onChange={e => setFormEdit({ ...formEdit, cargo: e.target.value })}
                className="form-input w-full"
              />
              <input
                type="text"
                placeholder="Telefone"
                value={formEdit.telefone}
                onChange={e => setFormEdit({ ...formEdit, telefone: e.target.value.replace(/[^0-9]/g, '') })}
                className="form-input w-full"
                maxLength={15}
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setEditando(null)} className="px-4 py-2 bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={handleSalvarEdicao} className="px-4 py-2 bg-blue-600 text-white rounded-lg" disabled={loading}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuncionariosTab;