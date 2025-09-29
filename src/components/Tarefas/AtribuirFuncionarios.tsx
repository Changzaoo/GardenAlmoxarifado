import React, { useState, useEffect } from 'react';
import { TarefaSemanal, FuncionarioDisponibilidade } from '../../types/tarefasSemanal';
import { TarefasSemanaisService } from '../../services/tarefasSemanaisService';

interface FuncionarioExtendido {
  id: string;
  nome: string;
  disponibilidade: FuncionarioDisponibilidade | null;
}

interface AtribuirFuncionariosProps {
  tarefaId: string;
  diasDaSemana: number[];
  funcionariosAtuais: string[];
  onFuncionariosAtualizados: () => void;
}

const diasDaSemana = [
  { id: 0, nome: 'Domingo' },
  { id: 1, nome: 'Segunda' },
  { id: 2, nome: 'Terça' },
  { id: 3, nome: 'Quarta' },
  { id: 4, nome: 'Quinta' },
  { id: 5, nome: 'Sexta' },
  { id: 6, nome: 'Sábado' },
];

const AtribuirFuncionarios: React.FC<AtribuirFuncionariosProps> = ({
  tarefaId,
  diasDaSemana: diasTarefa,
  funcionariosAtuais,
  onFuncionariosAtualizados
}) => {
  const [funcionarios, setFuncionarios] = useState<FuncionarioExtendido[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>(funcionariosAtuais);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    carregarFuncionarios();
  }, []);

  const carregarFuncionarios = async () => {
    try {
      setLoading(true);
      // Aqui você deve implementar a busca dos funcionários da sua base de dados
      // Este é um exemplo simulado:
      const funcionariosData = await fetch('/api/funcionarios').then(res => res.json());
      
      // Busca as disponibilidades
      const disponibilidades = await TarefasSemanaisService.buscarDisponibilidades();
      
      const funcionariosComDisponibilidade = funcionariosData.map((func: any) => ({
        id: func.id,
        nome: func.nome,
        disponibilidade: disponibilidades.find((d: FuncionarioDisponibilidade) => d.funcionarioId === func.id) || null
      }));

      setFuncionarios(funcionariosComDisponibilidade);
    } catch (err) {
      setError('Erro ao carregar funcionários');
      console.error('Erro ao carregar funcionários:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFuncionario = async (funcionarioId: string) => {
    try {
      if (selecionados.includes(funcionarioId)) {
        // Remove o funcionário
        const novosSelecionados = selecionados.filter(id => id !== funcionarioId);
        setSelecionados(novosSelecionados);
        
        await TarefasSemanaisService.atualizarTarefa(tarefaId, {
          funcionariosIds: novosSelecionados
        });
      } else {
        // Verifica disponibilidade
        const funcionario = funcionarios.find(f => f.id === funcionarioId);
        if (funcionario?.disponibilidade) {
          const disponivel = diasTarefa.every(dia =>
            funcionario.disponibilidade!.diasDisponiveis.includes(dia)
          );
          
          if (!disponivel) {
            setError('Funcionário não está disponível em todos os dias necessários');
            return;
          }
        }
        
        // Adiciona o funcionário
        const novosSelecionados = [...selecionados, funcionarioId];
        setSelecionados(novosSelecionados);
        
        await TarefasSemanaisService.atualizarTarefa(tarefaId, {
          funcionariosIds: novosSelecionados
        });
      }
      
      onFuncionariosAtualizados();
    } catch (err) {
      setError('Erro ao atualizar funcionários');
      console.error('Erro ao atualizar funcionários:', err);
    }
  };

  const verificarDisponibilidade = (funcionario: FuncionarioExtendido) => {
    if (!funcionario.disponibilidade) return true;
    
    return diasTarefa.every(dia =>
      funcionario.disponibilidade!.diasDisponiveis.includes(dia)
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {funcionarios.map((funcionario) => {
          const disponivel = verificarDisponibilidade(funcionario);
          const selecionado = selecionados.includes(funcionario.id);
          
          return (
            <button
              key={funcionario.id}
              onClick={() => disponivel && toggleFuncionario(funcionario.id)}
              className={`
                p-4 rounded-lg border text-left
                ${
                  selecionado
                    ? 'bg-blue-50 border-blue-500'
                    : disponivel
                    ? 'bg-white border-gray-300 hover:border-blue-500'
                    : 'bg-gray-50 border-gray-300 cursor-not-allowed opacity-60'
                }
              `}
              disabled={!disponivel}
            >
              <div className="font-medium">{funcionario.nome}</div>
              {funcionario.disponibilidade && (
                <div className="text-sm text-gray-500 mt-1">
                  Disponível: {funcionario.disponibilidade.diasDisponiveis.map(
                    (dia: number) => diasDaSemana[dia].nome
                  ).join(', ')}
                </div>
              )}
              {!disponivel && (
                <div className="text-sm text-red-500 mt-1">
                  Indisponível nos dias necessários
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AtribuirFuncionarios;