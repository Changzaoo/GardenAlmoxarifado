import React from 'react';
import { Users, Edit, Trash2, Trophy, Hammer, Gauge, CheckCircle, Clock } from 'lucide-react';
import AvaliacoesCard from './AvaliacoesCard';
import InformacoesContato from './InformacoesContato';

const CardFuncionario = ({
  funcionario: func,
  funcionariosStats,
  funcionariosPontos,
  isFuncionario,
  readonly,
  avaliacoesExpandidas,
  avaliacoesDesempenhoExpandidas,
  setAvaliacoesExpandidas,
  setAvaliacoesDesempenhoExpandidas,
  handleEditar,
  confirmarExclusao,
  calcularMediaAvaliacoesDesempenho,
  onClick
}) => {
  // Função para calcular a média das avaliações (retorna o tipo e a média)
  const calcularMedia = (avaliacoes) => {
    // Verificar se existem avaliações
    if (!avaliacoes || !Array.isArray(avaliacoes) || avaliacoes.length === 0) {
      return { tipo: null, media: 0 };
    }
    
    // Separar avaliações por tipo
    const avaliacoesDesempenho = avaliacoes.filter(av => 
      av.tipo === 'desempenho' || av.tipo === 'avaliacao_supervisor'
    );
    const avaliacoesTarefas = avaliacoes.filter(av => 
      (av.tipo === 'regular' || av.tipoAvaliacao === 'tarefa') && av.tipo !== 'avaliacao_supervisor'
    );
    
    // Calcular médias individuais
    const mediaDesempenho = avaliacoesDesempenho.length > 0
      ? avaliacoesDesempenho.reduce((sum, av) => sum + (av.estrelas || av.nota || 0), 0) / avaliacoesDesempenho.length
      : 0;
    
    const mediaTarefas = avaliacoesTarefas.length > 0
      ? avaliacoesTarefas.reduce((sum, av) => sum + (av.nota || 0), 0) / avaliacoesTarefas.length
      : 0;
    
    // Retornar média do tipo que existe
    if (avaliacoesDesempenho.length === 0 && avaliacoesTarefas.length > 0) {
      return { tipo: 'tarefas', media: mediaTarefas };
    }
    if (avaliacoesTarefas.length === 0 && avaliacoesDesempenho.length > 0) {
      return { tipo: 'desempenho', media: mediaDesempenho };
    }
    if (avaliacoesDesempenho.length === 0 && avaliacoesTarefas.length === 0) {
      return { tipo: null, media: 0 };
    }
    
    // Se tem os dois tipos, retorna a média de desempenho
    return { 
      tipo: 'geral', 
      media: mediaDesempenho
    };
  };
  return (
    <div 
      key={func.id} 
      className="bg-[#192734] rounded-2xl overflow-hidden border border-[#38444D] hover:border-[#1DA1F2] transition-colors cursor-pointer group"
      onClick={onClick}
    >
      {/* Header com foto e ações */}
      <div className="relative bg-[#1DA1F2]/10 p-4">
        {/* Ações do header */}
        {!isFuncionario && !readonly && (
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleEditar(func);
              }}
              className="p-1.5 bg-[#192734] text-[#1DA1F2] hover:bg-[#1DA1F2]/20 rounded-lg transition-colors shadow-md"
              title="Editar funcionário"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                confirmarExclusao(func);
              }}
              className="p-1.5 bg-[#192734] text-red-500 hover:bg-red-500/20 rounded-lg transition-colors shadow-md"
              title="Excluir funcionário"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-4">
          {func.photoURL ? (
            <img 
              src={func.photoURL} 
              alt={func.nome} 
              className="w-20 h-20 rounded-2xl object-cover border-2 border-[#38444D]"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-[#253341] border-2 border-[#38444D] flex items-center justify-center flex-shrink-0">
              <Users className="w-10 h-10 text-[#8899A6]" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white truncate mb-1">{func.nome}</h3>
            {func.matricula && (
              <p className="text-sm text-[#8899A6] mb-1">Mat: {func.matricula}</p>
            )}
            <p className="text-[#1DA1F2] font-medium truncate mb-1">{func.cargo || 'Cargo não definido'}</p>
            {funcionariosPontos[func.id] && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-full">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm font-semibold">{funcionariosPontos[func.id].total} pontos</span>
                </div>
              </div>
            )}


          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4 space-y-4">

        {/* Linha 1: Avaliações */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#253341] rounded-xl p-3">
            <div className="flex flex-col gap-2">
              {/* Média de Desempenho */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const avaliacoesDesempenho = funcionariosStats[func.id]?.avaliacoes?.filter(av => 
                      av.tipo === 'desempenho' || av.tipo === 'avaliacao_supervisor'
                    ) || [];
                    const media = avaliacoesDesempenho.length > 0
                      ? (avaliacoesDesempenho.reduce((sum, av) => sum + (av.estrelas || av.nota || 0), 0) / avaliacoesDesempenho.length).toFixed(1)
                      : '0';
                    
                    // Definir a cor baseada na média
                    const mediaNum = parseFloat(media);
                    let iconColor = '';
                    if (mediaNum >= 4.5) {
                      iconColor = 'text-yellow-400'; // Dourado para notas muito altas
                    } else if (mediaNum >= 3.5) {
                      iconColor = 'text-green-500'; // Verde para notas boas
                    } else if (mediaNum >= 2.5) {
                      iconColor = 'text-yellow-500'; // Amarelo para notas médias
                    } else if (mediaNum > 0) {
                      iconColor = 'text-red-500'; // Vermelho para notas baixas
                    } else {
                      iconColor = 'text-gray-400'; // Cinza para sem avaliação
                    }

                    return (
                      <div className="flex items-center gap-2">
                        <Gauge className={`w-6 h-6 ${iconColor}`} />
                        <span className={`text-sm font-medium ${iconColor}`}>{media}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
              {/* Média de Tarefas */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const avaliacoesTarefas = funcionariosStats[func.id]?.avaliacoes?.filter(av => av.tipo === 'regular') || [];
                    const media = avaliacoesTarefas.length > 0
                      ? (avaliacoesTarefas.reduce((sum, av) => sum + (av.nota || 0), 0) / avaliacoesTarefas.length).toFixed(1)
                      : '0';
                    
                    // Definir a cor baseada na média
                    const mediaNum = parseFloat(media);
                    let iconColor = '';
                    if (mediaNum >= 4.5) {
                      iconColor = 'text-yellow-400'; // Dourado para notas muito altas
                    } else if (mediaNum >= 3.5) {
                      iconColor = 'text-green-500'; // Verde para notas boas
                    } else if (mediaNum >= 2.5) {
                      iconColor = 'text-yellow-500'; // Amarelo para notas médias
                    } else if (mediaNum > 0) {
                      iconColor = 'text-red-500'; // Vermelho para notas baixas
                    } else {
                      iconColor = 'text-gray-400'; // Cinza para sem avaliação
                    }

                    return (
                      <div className="flex items-center gap-2">
                        <Hammer className={`w-6 h-6 ${iconColor}`} />
                        <span className={`text-sm font-medium ${iconColor}`}>{media}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#253341] rounded-xl p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#1DA1F2]" />
              <div>
                <span className="text-lg font-bold text-white">
                  {funcionariosStats[func.id]?.tarefasEmAndamento || 0}
                </span>
                <p className="text-xs text-[#8899A6]">Em Andamento</p>
              </div>
            </div>
          </div>
        </div>

        {/* Avaliações */}
        {funcionariosStats[func.id]?.avaliacoes?.length > 0 && (
          <>
            {/* Avaliações Regulares */}
            <AvaliacoesCard 
              avaliacoes={funcionariosStats[func.id].avaliacoes}
              tipo="regular"
              avaliacoesExpandidas={avaliacoesExpandidas}
              setAvaliacoesExpandidas={setAvaliacoesExpandidas}
              funcionarioId={func.id}
              calcularMediaAvaliacoesDesempenho={calcularMediaAvaliacoesDesempenho}
            />

            {/* Avaliações de Desempenho */}
            <AvaliacoesCard 
              avaliacoes={funcionariosStats[func.id].avaliacoes}
              tipo="desempenho"
              avaliacoesExpandidas={avaliacoesDesempenhoExpandidas}
              setAvaliacoesExpandidas={setAvaliacoesDesempenhoExpandidas}
              funcionarioId={func.id}
              calcularMediaAvaliacoesDesempenho={calcularMediaAvaliacoesDesempenho}
            />
          </>
        )}

        {/* Linha: Tarefas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#253341] rounded-xl p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <span className="text-lg font-bold text-white">
                  {funcionariosStats[func.id]?.tarefasConcluidas || 0}
                </span>
                <p className="text-xs text-[#8899A6]">Concluídas</p>
              </div>
            </div>
          </div>

          <div className="bg-[#253341] rounded-xl p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#1DA1F2]" />
              <div>
                <span className="text-lg font-bold text-white">
                  {funcionariosStats[func.id]?.tarefasEmAndamento || 0}
                </span>
                <p className="text-xs text-[#8899A6]">Em Andamento</p>
              </div>
            </div>
          </div>
        </div>

        {/* Informações de Contato */}
        <InformacoesContato funcionario={func} />
      </div>
    </div>
  );
};

export default CardFuncionario;