import React from 'react';
import { X, Clock, User, Wrench } from 'lucide-react';

const DetailsModal = ({ isOpen, onClose, details, title, dateRange }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-[#192734] rounded-xl border border-[#38444D] p-4 shadow-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {dateRange && (
              <p className="text-sm text-[#8899A6]">{dateRange}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#253341] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[#8899A6]" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-8rem)]">
          {details.length > 0 ? (
            <div className="space-y-3">
              {details.map((emprestimo, index) => (
                <div
                  key={emprestimo.id || index}
                  className="bg-[#253341] p-3 rounded-lg space-y-2"
                >
                  {/* Hora e Funcionário */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#1DA1F2]" />
                      <span className="text-white">
                        {new Date(emprestimo.dataEmprestimo).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#1DA1F2]" />
                      <span className="text-white">{emprestimo.funcionario?.nome || 'Funcionário não encontrado'}</span>
                    </div>
                  </div>

                  {/* Ferramentas */}
                  <div className="pl-6 space-y-1">
                    {emprestimo.ferramentas.map((ferramenta, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-[#8899A6]" />
                        <span className="text-[#8899A6]">
                          {typeof ferramenta === 'object' ? ferramenta.nome : 'Ferramenta não encontrada'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Status e Data de Devolução */}
                  <div className="flex items-center justify-between text-sm">
                    <span className={`px-2 py-1 rounded ${
                      emprestimo.status === 'devolvido' ? 'bg-green-500/20 text-green-400' :
                      emprestimo.status === 'emprestado' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {emprestimo.status.charAt(0).toUpperCase() + emprestimo.status.slice(1)}
                    </span>
                    {emprestimo.dataDevolucao && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#8899A6]" />
                        <span className="text-[#8899A6]">
                          Devolvido: {new Date(emprestimo.dataDevolucao).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-[#8899A6] py-8">
              Nenhum empréstimo encontrado neste período.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;