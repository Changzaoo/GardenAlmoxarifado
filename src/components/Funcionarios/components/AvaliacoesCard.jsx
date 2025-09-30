import React from 'react';
import { Star, Clock, Users, ThumbsUp } from 'lucide-react';
import { getTipoAvaliacaoConfig } from '../../../constants/avaliacoes';

const AvaliacoesCard = ({ 
  avaliacoes,
  tipo, 
  avaliacoesExpandidas, 
  setAvaliacoesExpandidas, 
  funcionarioId, 
  calcularMediaAvaliacoesDesempenho 
}) => {
  const avaliacoesFiltradas = avaliacoes.filter(av => {
    if (tipo === 'desempenho') {
      return av.tipo === 'desempenho';
    } else {
      // Para avaliações regulares, incluir tanto as avaliações de tarefa quanto as regulares
      return av.tipo === 'regular' || av.tipoAvaliacao === 'tarefa';
    }
  });

  if (avaliacoesFiltradas.length === 0) return null;

  const mediaDesempenho = tipo === 'desempenho' 
    ? avaliacoesFiltradas.length > 0
      ? (avaliacoesFiltradas.reduce((sum, av) => sum + (av.nota || 0), 0) / avaliacoesFiltradas.length).toFixed(1)
      : '0'
    : '0';

  return (
    <div className="bg-[#253341] rounded-xl p-3 mb-3">


      <button
        onClick={(e) => {
          e.stopPropagation();
          setAvaliacoesExpandidas(avaliacoesExpandidas === funcionarioId ? null : funcionarioId);
        }}
        className="w-full hover:bg-[#2C3E50] rounded-lg transition-colors p-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-[#1DA1F2]" />
            <span className="text-sm font-bold text-white">
              {tipo === 'desempenho' ? 'Avaliações de Desempenho' : 'Avaliações de Tarefas'}
            </span>
            <div className="flex items-center">
              <span className="text-xs text-[#8899A6] ml-2">
                {avaliacoesExpandidas === funcionarioId ? 'Clique para recolher' : `Clique para ver (${avaliacoesFiltradas.length})`}
              </span>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-[#8899A6] transform transition-transform duration-200 ${
              avaliacoesExpandidas === funcionarioId ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {avaliacoesExpandidas === funcionarioId && (
        <div className="mt-3">
          <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#38444D] scrollbar-track-[#192734]">
            {avaliacoesFiltradas
              .sort((a, b) => new Date(b.data) - new Date(a.data))
              .map((avaliacao, index) => (
                <div key={index} className="bg-[#1E2732] rounded-lg p-3 border border-[#38444D] min-h-[180px] flex flex-col">
                  {/* Cabeçalho da avaliação */}
                  <div className="space-y-2 mb-3">
                    {/* Tipo de avaliação */}
                    {avaliacao.tipoAvaliacao && (
                      <div>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                              getTipoAvaliacaoConfig(avaliacao.tipoAvaliacao).cor
                            }`}>
                              {getTipoAvaliacaoConfig(avaliacao.tipoAvaliacao).label}
                            </span>
                            {avaliacao.tipoAvaliacao === 'tarefa' && avaliacao.nomeTarefa && (
                              <span className="text-xs text-[#8899A6]">
                                - {avaliacao.nomeTarefa}
                              </span>
                            )}
                          </div>
                          {avaliacao.tipoAvaliacao === 'tarefa' && avaliacao.descricaoTarefa && (
                            <p className="text-xs text-[#8899A6] leading-relaxed pl-2">
                              {avaliacao.descricaoTarefa}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Linha com as Estrelas */}
                    <div className="flex flex-col space-y-2">
                      {/* Estrelas */}
                      <div className="flex items-center gap-1 bg-[#253341] px-2 py-1 rounded-md">
                        {[1, 2, 3, 4, 5].map((estrela) => (
                          <Star 
                            key={estrela} 
                            className={`w-4 h-4 ${
                              estrela <= (avaliacao.nota || avaliacao.estrelas || 0)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-[#8899A6]'
                            }`}
                          />
                        ))}
                        <span className="text-sm font-medium text-yellow-400 ml-1">
                          {avaliacao.nota || avaliacao.estrelas || 0}
                        </span>
                      </div>

                      {/* Data, hora e avaliador */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-[#253341] px-2 py-1 rounded-md">
                          <Clock className="w-3 h-3 text-[#1DA1F2]" />
                          <span className="text-xs text-white">
                            {new Date(avaliacao.data).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit'
                            })}
                            {', '}
                            {avaliacao.hora || '00:00'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 bg-[#253341] px-2 py-1 rounded-md">
                          <Users className="w-3 h-3 text-[#1DA1F2]" />
                          <span className="text-xs text-white">
                            {avaliacao.anonimo || avaliacao.anonima ? "Anônimo" : (avaliacao.avaliador || avaliacao.autor || avaliacao.supervisorNome)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comentário da avaliação */}
                  {avaliacao.comentario && (
                    <div className="bg-[#253341] rounded-md p-2">
                      <p className="text-[#8899A6] text-sm leading-relaxed">
                        {avaliacao.comentario}
                      </p>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AvaliacoesCard;