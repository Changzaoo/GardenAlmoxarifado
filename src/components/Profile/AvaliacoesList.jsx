import React from 'react';
import { Star, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AvaliacoesList = ({ avaliacoes, onDelete, canDelete = false }) => {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Avaliações Recebidas
      </h3>
      <div className="space-y-4">
        {avaliacoes.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Nenhuma avaliação recebida ainda.
          </p>
        ) : (
          avaliacoes.map((avaliacao) => (
            <div
              key={avaliacao.id}
              className="bg-white dark:bg-[#192734] border border-gray-200 dark:border-[#38444D] rounded-lg p-4 relative hover:shadow-md transition-shadow duration-200"
            >
              {/* Cabeçalho */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {avaliacao.avaliadorNome}
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        • {avaliacao.avaliadorCargo || 'Supervisor'}
                      </span>
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(avaliacao.data), "d 'de' MMMM 'de' yyyy, HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                </div>
                {canDelete && (
                  <button
                    onClick={() => onDelete(avaliacao.id)}
                    className="text-red-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Excluir avaliação"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Avaliação */}
              <div className="space-y-3">
                {/* Estrelas */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((estrela) => (
                      <Star
                        key={estrela}
                        className={`w-5 h-5 ${
                          estrela <= avaliacao.estrelas
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {avaliacao.pontuacaoAtribuida} pontos
                  </span>
                </div>

                {/* Tipo de Avaliação */}
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    {avaliacao.origemAvaliacao}
                  </span>
                  {avaliacao.tipo === 'manual' && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                      Avaliação Manual
                    </span>
                  )}
                </div>

                {/* Comentário */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {avaliacao.comentario}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AvaliacoesList;