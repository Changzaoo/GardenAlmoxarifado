import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTarefas } from './TarefasProvider';
import { useFuncionarios } from '../Funcionarios/FuncionariosProvider';
import NovaTarefa from './NovaTarefa';
import ListaTarefas from './ListaTarefas';
import { NIVEIS_PERMISSAO } from '../../constants/permissoes';

const TarefasTab = () => {
  const { usuario } = useAuth();
  const { funcionarios } = useFuncionarios();
  const { tarefas, loading, adicionarTarefa, atualizarTarefa, removerTarefa } = useTarefas();
  
  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {usuario?.nivel >= NIVEIS_PERMISSAO.SUPERVISOR && (
        <NovaTarefa
          adicionarTarefa={adicionarTarefa}
          funcionarios={funcionarios}
        />
      )}
      <ListaTarefas
        tarefas={tarefas}
        atualizarTarefa={atualizarTarefa}
        removerTarefa={removerTarefa}
        readonly={usuario?.nivel < NIVEIS_PERMISSAO.SUPERVISOR}
      />
    </div>
  );
};

export default TarefasTab;
