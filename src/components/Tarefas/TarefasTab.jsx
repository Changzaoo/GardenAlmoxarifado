import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTarefas } from './TarefasProvider';
import { useFuncionarios } from '../Funcionarios/FuncionariosProvider';
import NovaTarefa from './NovaTarefa';
import ListaTarefas from './ListaTarefas';
import { NIVEIS_PERMISSAO } from '../../constants/permissoes';
import { twitterThemeConfig } from '../../styles/twitterThemeConfig';

const TarefasTab = () => {
  const { colors, classes } = twitterThemeConfig;
  const { usuario } = useAuth();
  const { funcionarios } = useFuncionarios();
  const { tarefas, loading, adicionarTarefa, atualizarTarefa, removerTarefa } = useTarefas();
  
  if (loading) {
    return <div className={`p-4 text-center ${colors.textSecondary}`}>Carregando...</div>;
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
