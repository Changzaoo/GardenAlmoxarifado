import React, { useState } from 'react';
import { Search, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { formatarData } from '../../utils/dateUtils';
import { useTheme } from '../AlmoxarifadoJardim';

const ListaEmprestimos = ({ 
  emprestimos, 
  devolverFerramentas, 
  removerEmprestimo,
  atualizarDisponibilidade 
}) => {
  const { classes } = useTheme();
  const [filtroEmprestimos, setFiltroEmprestimos] = useState('');

  const emprestimosFiltrados = emprestimos
    .filter(emp =>
      emp.colaborador.toLowerCase().includes(filtroEmprestimos.toLowerCase()) ||
      emp.ferramentas.some(f => f.toLowerCase().includes(filtroEmprestimos.toLowerCase()))
    )
    .sort((a, b) => {
      // Ordena por data/hora de retirada mais recente
      const dataA = new Date(a.dataRetirada + 'T' + (a.horaRetirada || '00:00'));
      const dataB = new Date(b.dataRetirada + 'T' + (b.horaRetirada || '00:00'));
      return dataB - dataA;
    });

  const handleDevolverFerramentas = (id) => {
    devolverFerramentas(id, atualizarDisponibilidade);
  };

  const handleRemoverEmprestimo = (id) => {
    removerEmprestimo(id, atualizarDisponibilidade);
  };

  return (
    <div className={`${classes.card} p-6`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl font-bold ${classes.textPrimary}`}>
          Histórico de Empréstimos
        </h2>
        <div className="relative">
          <Search className={`w-4 h-4 absolute left-3 top-3 ${classes.textLight}`} />
          <input
            type="text"
            placeholder="Buscar por colaborador ou ferramenta..."
            value={filtroEmprestimos}
            onChange={(e) => setFiltroEmprestimos(e.target.value)}
            className={`pl-10 pr-4 py-2 ${classes.input} focus:ring-2 focus:border-transparent`}
            style={{ '--tw-ring-color': '#bd9967' }}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className={classes.table}>
          <table className="w-full">
            <thead className={classes.tableHeader}>
              <tr>
                <th className={`text-left py-3 px-2 ${classes.tableHeaderCell}`}>ID</th>
                <th className={`text-left py-3 px-2 ${classes.tableHeaderCell}`}>Colaborador</th>
                <th className={`text-left py-3 px-2 ${classes.tableHeaderCell}`}>Ferramentas</th>
                <th className={`text-left py-3 px-2 ${classes.tableHeaderCell}`}>Retirada</th>
                <th className={`text-left py-3 px-2 ${classes.tableHeaderCell}`}>Devolução</th>
                <th className={`text-left py-3 px-2 ${classes.tableHeaderCell}`}>Status</th>
                <th className={`text-left py-3 px-2 ${classes.tableHeaderCell}`}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {emprestimosFiltrados.sort((a, b) => b.id - a.id).map(emprestimo => (
                <tr key={emprestimo.id} className={classes.tableRow}>
                  <td className={`py-3 px-2 font-mono text-sm ${classes.tableCell}`}>
                    #{emprestimo.id}
                  </td>
                  <td className={`py-3 px-2 font-medium ${classes.tableCell}`}>
                    {emprestimo.colaborador}
                  </td>
                  <td className={`py-3 px-2 ${classes.tableCell}`}>
                    <div className="max-w-xs">
                      {emprestimo.ferramentas.length > 2 ? (
                        <div className="text-sm">
                          <div>{emprestimo.ferramentas.slice(0, 2).join(', ')}</div>
                          <div className={classes.textMuted}>
                            +{emprestimo.ferramentas.length - 2} outras
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm">
                          {emprestimo.ferramentas.join(', ')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className={`py-3 px-2 text-sm ${classes.tableCell}`}>
                    <div>{formatarData(emprestimo.dataRetirada)}</div>
                    <div className={classes.textMuted}>{emprestimo.horaRetirada}</div>
                  </td>
                  <td className={`py-3 px-2 text-sm ${classes.tableCell}`}>
                    {emprestimo.dataDevolucao ? (
                      <div>
                        <div>{formatarData(emprestimo.dataDevolucao)}</div>
                        <div className={classes.textMuted}>{emprestimo.horaDevolucao}</div>
                      </div>
                    ) : (
                      <span className={classes.textLight}>-</span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      emprestimo.status === 'emprestado'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    }`}>
                      {emprestimo.status === 'emprestado' ? (
                        <>
                          <Clock className="w-3 h-3 inline mr-1" />
                          Emprestado
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                          Devolvido
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex gap-2">
                      {emprestimo.status === 'emprestado' && (
                        <button
                          onClick={() => handleDevolverFerramentas(emprestimo.id)}
                          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 p-1 transition-colors duration-200"
                          title="Marcar como devolvido"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoverEmprestimo(emprestimo.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 p-1 transition-colors duration-200"
                        title="Remover registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ListaEmprestimos;