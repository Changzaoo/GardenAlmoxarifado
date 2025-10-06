import React from 'react';
import { X, Package, Calendar, Clock, Award } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DetalhesFerramentasModal = ({ isOpen, onClose, emprestimos, pontos }) => {
  if (!isOpen) return null;

  const devolucoes = emprestimos
    .filter(e => e.status === 'devolvido' && e.dataHoraDevolucao)
    .sort((a, b) => {
      const dateA = a.dataHoraDevolucao?.seconds || a.dataHoraDevolucao?.toDate?.() || 0;
      const dateB = b.dataHoraDevolucao?.seconds || b.dataHoraDevolucao?.toDate?.() || 0;
      return dateB - dateA;
    });

  const calcularPontosFerramentas = (emprestimo) => {
    const qtdFerramentas = emprestimo.ferramentas?.length || 0;
    const pontosPorFerramenta = 20;
    
    // Bonus por devolução no prazo
    let bonus = 0;
    if (emprestimo.dataHoraEmprestimo && emprestimo.dataHoraDevolucao) {
      const emprestDate = emprestimo.dataHoraEmprestimo.toDate?.() || new Date(emprestimo.dataHoraEmprestimo);
      const devolDate = emprestimo.dataHoraDevolucao.toDate?.() || new Date(emprestimo.dataHoraDevolucao);
      const horasDiff = (devolDate - emprestDate) / (1000 * 60 * 60);
      
      if (horasDiff <= 24) bonus = Math.round(qtdFerramentas * pontosPorFerramenta * 0.5);
      else if (horasDiff <= 72) bonus = Math.round(qtdFerramentas * pontosPorFerramenta * 0.25);
    }
    
    return {
      base: qtdFerramentas * pontosPorFerramenta,
      bonus: bonus,
      total: qtdFerramentas * pontosPorFerramenta + bonus
    };
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-2">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Ferramentas Devolvidas</h2>
              <p className="text-sm text-white/80">{devolucoes.length} devoluções registradas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {devolucoes.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Nenhuma devolução registrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {devolucoes.map((emprestimo, index) => {
                const pontosCalc = calcularPontosFerramentas(emprestimo);
                const dataDevolucao = emprestimo.dataHoraDevolucao?.toDate?.() || new Date(emprestimo.dataHoraDevolucao);
                
                return (
                  <div key={emprestimo.id || index} className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {format(dataDevolucao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{format(dataDevolucao, 'HH:mm', { locale: ptBR })}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 border border-blue-300 dark:border-blue-600">
                        <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-bold text-blue-600 dark:text-blue-400">+{pontosCalc.total} pts</span>
                      </div>
                    </div>

                    {/* Lista de ferramentas */}
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-3 mb-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {emprestimo.ferramentas?.length || 0} {emprestimo.ferramentas?.length === 1 ? 'ferramenta' : 'ferramentas'}:
                      </p>
                      <ul className="space-y-1">
                        {emprestimo.ferramentas?.map((ferramenta, idx) => (
                          <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400"></span>
                            {ferramenta.nome || ferramenta}
                            {ferramenta.quantidade && ferramenta.quantidade > 1 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">x{ferramenta.quantidade}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Breakdown de pontos */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex gap-4">
                        <span className="text-gray-600 dark:text-gray-400">
                          Base: <strong className="text-gray-800 dark:text-gray-200">{pontosCalc.base} pts</strong>
                        </span>
                        {pontosCalc.bonus > 0 && (
                          <span className="text-green-600 dark:text-green-400">
                            Bônus: <strong>+{pontosCalc.bonus} pts</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-white" />
            <span className="text-white/90 text-sm font-medium">Total Acumulado:</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {pontos} pontos
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalhesFerramentasModal;
