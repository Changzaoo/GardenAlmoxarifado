import React, { useState } from 'react';
import { useTheme } from '../AlmoxarifadoJardim';
import { useAuth } from '../../hooks/useAuth';
import { Users, Trash2, Plus, Edit, Search } from 'lucide-react';

const FuncionariosTab = ({ funcionarios, adicionarFuncionario, removerFuncionario, atualizarFuncionario, readonly }) => {
  const [novoFuncionario, setNovoFuncionario] = useState({ nome: '', cargo: '', telefone: '' });
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({ nome: '', cargo: '', telefone: '' });
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState('');
  const { usuario } = useAuth();
  const { classes } = useTheme();
  
  const isFuncionario = usuario?.nivel === 'funcionario';

  const funcionariosFiltrados = funcionarios.filter(func =>
    func.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    func.cargo.toLowerCase().includes(filtro.toLowerCase()) ||
    func.telefone.includes(filtro)
  );

  const handleEditar = (func) => {
    setEditando(func);
    setFormEdit({ nome: func.nome, cargo: func.cargo, telefone: func.telefone });
  };

  const handleAdicionar = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await adicionarFuncionario(novoFuncionario);
      setNovoFuncionario({ nome: '', cargo: '', telefone: '' });
    } catch (err) {
      setErro(err.message || 'Erro ao adicionar funcionário');
    }
    setLoading(false);
  };

  const handleSalvarEdicao = async () => {
    setLoading(true);
    try {
      await atualizarFuncionario(editando.id, formEdit);
      setEditando(null);
      setErro('');
    } catch (err) {
      setErro(err.message || 'Erro ao atualizar funcionário');
    }
    setLoading(false);
  };

  const handleRemover = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover este funcionário?')) return;
    
    setLoading(true);
    try {
      await removerFuncionario(id);
      setErro('');
    } catch (err) {
      setErro(err.message || 'Erro ao remover funcionário');
    }
    setLoading(false);
  };

  return (
    <div className={`space-y-6 ${classes.backgroundPrimary}`}>
      {/* Header */}
      <div className={classes.sectionHeader}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className={`${classes.sectionTitle} flex items-center gap-2`}>
              <Users className="w-6 h-6" style={{ color: '#bd9967' }} />
              Funcionários
            </h2>
            <p className={classes.sectionSubtitle}>Gestão de funcionários do almoxarifado</p>
          </div>
        </div>

        {/* Filtro */}
        <div className="relative mb-6">
          <Search className={`w-4 h-4 absolute left-3 top-3 ${classes.textLight}`} />
          <input
            type="text"
            placeholder="Buscar por nome, cargo ou telefone..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className={`pl-10 w-full px-3 py-2 ${classes.input} focus:ring-2 focus:border-transparent`}
            style={{ '--tw-ring-color': '#bd9967' }}
          />
        </div>

        {/* Formulário de adição */}
        {!isFuncionario && !readonly && (
          <form onSubmit={handleAdicionar} className={`${classes.card} p-4 mb-6`}>
            <h3 className={`text-lg font-medium ${classes.textPrimary} mb-4`}>Adicionar Novo Funcionário</h3>
            
            {erro && (
              <div className={`${classes.alertError} p-3 rounded-lg mb-4`}>
                {erro}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className={classes.formLabel}>Nome *</label>
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={novoFuncionario.nome}
                  onChange={e => setNovoFuncionario({ ...novoFuncionario, nome: e.target.value })}
                  className={`w-full ${classes.input} px-3 py-2 focus:ring-2 focus:border-transparent`}
                  style={{ '--tw-ring-color': '#bd9967' }}
                  required
                />
              </div>
              
              <div>
                <label className={classes.formLabel}>Cargo *</label>
                <input
                  type="text"
                  placeholder="Cargo/função"
                  value={novoFuncionario.cargo}
                  onChange={e => setNovoFuncionario({ ...novoFuncionario, cargo: e.target.value })}
                  className={`w-full ${classes.input} px-3 py-2 focus:ring-2 focus:border-transparent`}
                  style={{ '--tw-ring-color': '#bd9967' }}
                  required
                />
              </div>
              
              <div>
                <label className={classes.formLabel}>Telefone *</label>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={novoFuncionario.telefone}
                  onChange={e => {
                    const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                    setNovoFuncionario({ ...novoFuncionario, telefone: onlyNums });
                  }}
                  className={`w-full ${classes.input} px-3 py-2 focus:ring-2 focus:border-transparent`}
                  style={{ '--tw-ring-color': '#bd9967' }}
                  required
                  maxLength={15}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={`${classes.buttonPrimary} flex items-center gap-2 px-4 py-2`}
              style={{ backgroundColor: '#bd9967' }}
              disabled={loading}
            >
              <Plus className="w-4 h-4" />
              {loading ? 'Adicionando...' : 'Adicionar Funcionário'}
            </button>
          </form>
        )}
      </div>

      {/* Tabela de funcionários */}
      <div className={classes.table}>
        <table className="w-full">
          <thead className={classes.tableHeader}>
            <tr>
              <th className={`text-left py-3 px-4 ${classes.tableHeaderCell}`}>Nome</th>
              <th className={`text-left py-3 px-4 ${classes.tableHeaderCell}`}>Cargo</th>
              <th className={`text-left py-3 px-4 ${classes.tableHeaderCell}`}>Telefone</th>
              {!isFuncionario && !readonly && (
                <th className={`text-left py-3 px-4 ${classes.tableHeaderCell}`}>Ações</th>
              )}
            </tr>
          </thead>
          <tbody>
            {funcionariosFiltrados.map((func) => (
              <tr key={func.id} className={classes.tableRow}>
                <td className={`py-3 px-4 ${classes.tableCell}`}>
                  <div className="font-medium">{func.nome}</div>
                </td>
                <td className={`py-3 px-4 ${classes.tableCell}`}>
                  <div className={classes.textSecondary}>{func.cargo}</div>
                </td>
                <td className={`py-3 px-4 ${classes.tableCell}`}>
                  <div className={classes.textSecondary}>
                    {func.telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                  </div>
                </td>
                {!isFuncionario && !readonly && (
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditar(func)}
                        className={`p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200`}
                        title="Editar funcionário"
                      >
                        <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleRemover(func.id)}
                        className={`p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200`}
                        title="Remover funcionário"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {funcionariosFiltrados.length === 0 && (
          <div className={`p-8 text-center ${classes.tableCell}`}>
            <Users className="w-16 h-16 mx-auto mb-4" style={{ color: '#bd9967' }} />
            <p className={classes.textSecondary}>
              {filtro ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário cadastrado'}
            </p>
            <p className={`text-sm ${classes.textMuted} mt-2`}>
              {filtro ? 'Tente alterar o termo de busca' : 'Adicione o primeiro funcionário usando o formulário acima'}
            </p>
          </div>
        )}
      </div>

      {/* Modal de edição */}
      {editando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${classes.modal} max-w-md w-full p-6`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-lg font-bold ${classes.textPrimary}`}>Editar Funcionário</h3>
              <button
                onClick={() => setEditando(null)}
                className={`${classes.textLight} hover:${classes.textSecondary}`}
              >
                ✕
              </button>
            </div>

            {erro && (
              <div className={`${classes.alertError} p-3 rounded-lg mb-4`}>
                {erro}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className={classes.formLabel}>Nome *</label>
                <input
                  type="text"
                  value={formEdit.nome}
                  onChange={e => setFormEdit({ ...formEdit, nome: e.target.value })}
                  className={`w-full ${classes.input} px-3 py-2 focus:ring-2 focus:border-transparent`}
                  style={{ '--tw-ring-color': '#bd9967' }}
                  required
                />
              </div>
              
              <div>
                <label className={classes.formLabel}>Cargo *</label>
                <input
                  type="text"
                  value={formEdit.cargo}
                  onChange={e => setFormEdit({ ...formEdit, cargo: e.target.value })}
                  className={`w-full ${classes.input} px-3 py-2 focus:ring-2 focus:border-transparent`}
                  style={{ '--tw-ring-color': '#bd9967' }}
                  required
                />
              </div>
              
              <div>
                <label className={classes.formLabel}>Telefone *</label>
                <input
                  type="text"
                  value={formEdit.telefone}
                  onChange={e => setFormEdit({ ...formEdit, telefone: e.target.value.replace(/[^0-9]/g, '') })}
                  className={`w-full ${classes.input} px-3 py-2 focus:ring-2 focus:border-transparent`}
                  style={{ '--tw-ring-color': '#bd9967' }}
                  required
                  maxLength={15}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditando(null)}
                className={`${classes.buttonSecondary} px-4 py-2`}
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarEdicao}
                className={`${classes.buttonPrimary} px-4 py-2`}
                style={{ backgroundColor: '#bd9967' }}
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuncionariosTab;