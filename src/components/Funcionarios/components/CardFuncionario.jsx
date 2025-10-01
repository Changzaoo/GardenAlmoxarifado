import React, { useState, useEffect, useRef } from 'react';
import { Users, Edit, Trash2, Hammer, Gauge, Clock, UserX, UserCheck, MoreVertical } from 'lucide-react';
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
  onClick,
  demitirFuncionario,
  reintegrarFuncionario,
  filtroAtual
}) => {
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuAberto(false);
      }
    };

    if (menuAberto) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuAberto]);
  
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
      className={`bg-[#192734] rounded-2xl overflow-hidden border border-[#38444D] transition-all group ${
        func.demitido && filtroAtual !== 'demitidos' ? 'opacity-60' : ''
      }`}
    >
      {/* Header com foto e ações */}
      <div className="relative bg-[#1DA1F2]/10 p-4">
        {/* Ações do header */}
        {!isFuncionario && !readonly && (
          <div className="absolute top-2 right-2">
            <div className="relative" ref={menuRef}>
              {/* Botão de três pontos */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuAberto(!menuAberto);
                }}
                className="p-1.5 bg-[#192734] text-[#8899A6] hover:bg-[#253341] hover:text-white rounded-lg transition-colors shadow-md"
                title="Opções"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Menu dropdown */}
              {menuAberto && (
                <div className="absolute top-full right-0 mt-1 bg-[#192734] border border-[#38444D] rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuAberto(false);
                      handleEditar(func);
                    }}
                    className="w-full px-3 py-2 text-left text-[#1DA1F2] hover:bg-[#1DA1F2]/20 transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  
                  {/* Botão de Demitir/Reintegrar */}
                  {func.demitido ? (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuAberto(false);
                        reintegrarFuncionario(func);
                      }}
                      className="w-full px-3 py-2 text-left text-green-500 hover:bg-green-500/20 transition-colors flex items-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      Reintegrar
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuAberto(false);
                        demitirFuncionario(func);
                      }}
                      className="w-full px-3 py-2 text-left text-orange-500 hover:bg-orange-500/20 transition-colors flex items-center gap-2"
                    >
                      <UserX className="w-4 h-4" />
                      Demitir
                    </button>
                  )}
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuAberto(false);
                      confirmarExclusao(func);
                    }}
                    className="w-full px-3 py-2 text-left text-red-500 hover:bg-red-500/20 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                </div>
              )}
            </div>
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
            <div className="flex items-center gap-2 mb-1">
              <h3 
                className="text-xl font-bold text-white truncate cursor-pointer hover:text-[#1DA1F2] transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                title="Ver perfil do funcionário"
              >
                {func.nome}
              </h3>
              {func.demitido && (
                <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs font-medium">
                  DEMITIDO
                </span>
              )}
            </div>
            {func.matricula && (
              <p className="text-sm text-[#8899A6] mb-1">Mat: {func.matricula}</p>
            )}
            <p className="text-[#1DA1F2] font-medium truncate mb-1">{func.cargo || 'Cargo não definido'}</p>
            {func.demitido && func.dataDemissao && (
              <p className="text-xs text-red-400">
                Demitido em: {new Date(func.dataDemissao).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4 space-y-4">

        {/* Linha 1: Avaliações */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#253341] rounded-xl p-3">
            {/* Média de Desempenho */}
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
                    <div>
                      <span className={`text-lg font-bold text-white`}>{media}</span>
                      <p className="text-xs text-[#8899A6]">Desempenho</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="bg-[#253341] rounded-xl p-3">
            {(() => {
              // Avaliações regulares de tarefas
              const avaliacoesTarefas = funcionariosStats[func.id]?.avaliacoes?.filter(av => av.tipo === 'regular') || [];
              // Autoavaliações de tarefas
              const autoavaliacoesTarefas = funcionariosStats[func.id]?.avaliacoes?.filter(av => av.tipoAvaliacao === 'tarefa') || [];
              
              const mediaRegular = avaliacoesTarefas.length > 0
                ? (avaliacoesTarefas.reduce((sum, av) => sum + (av.nota || 0), 0) / avaliacoesTarefas.length)
                : 0;
                
              const mediaAutoavaliacao = autoavaliacoesTarefas.length > 0
                ? (autoavaliacoesTarefas.reduce((sum, av) => sum + (av.nota || 0), 0) / autoavaliacoesTarefas.length)
                : 0;
              
              // Calculando a média geral (regular + autoavaliação)
              const totalAvaliacoes = avaliacoesTarefas.length + autoavaliacoesTarefas.length;
              const media = totalAvaliacoes > 0
                ? ((mediaRegular * avaliacoesTarefas.length + mediaAutoavaliacao * autoavaliacoesTarefas.length) / totalAvaliacoes).toFixed(1)
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
                  <div>
                    <span className={`text-lg font-bold text-white`}>{media}</span>
                    <p className="text-xs text-[#8899A6]">Tarefas</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Avaliações */}
        {funcionariosStats[func.id]?.avaliacoes?.length > 0 && (
          <>
            {/* Autoavaliações */}
            <AvaliacoesCard 
              avaliacoes={funcionariosStats[func.id].avaliacoes}
              tipo="autoavaliacao"
              avaliacoesExpandidas={avaliacoesExpandidas}
              setAvaliacoesExpandidas={setAvaliacoesExpandidas}
              funcionarioId={`${func.id}-auto`}
              calcularMediaAvaliacoesDesempenho={calcularMediaAvaliacoesDesempenho}
            />

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


          {(() => {
            const emAndamento = funcionariosStats[func.id]?.tarefasEmAndamento || 0;
            return emAndamento > 0 ? (
              <div className="bg-[#253341] rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#1DA1F2]" />
                  <div>
                    <span className="text-lg font-bold text-white">
                      {emAndamento}
                    </span>
                    <p className="text-xs text-[#8899A6]">Em Andamento</p>
                  </div>
                </div>
              </div>
            ) : null;
          })()}
        </div>

        {/* Informações de Contato */}
        <InformacoesContato funcionario={func} />
      </div>
    </div>
  );
};

export default CardFuncionario;