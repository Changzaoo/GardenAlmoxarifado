import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import NovoEmprestimo from './NovoEmprestimo';
import ListaEmprestimos from './ListaEmprestimos';

const EmprestimosTab = ({
  emprestimos,
  inventario,
  adicionarEmprestimo,
  devolverFerramentas,
  removerEmprestimo,
  atualizarDisponibilidade
}) => {
  const { usuario } = useAuth();
  const isFuncionario = usuario?.nivel === 'funcionario';
  
  return (
    <div className="space-y-6">
      {!isFuncionario && (
        <NovoEmprestimo
          inventario={inventario}
          adicionarEmprestimo={adicionarEmprestimo}
          atualizarDisponibilidade={atualizarDisponibilidade}
          emprestimos={emprestimos}
        />
      )}
      <ListaEmprestimos
        emprestimos={emprestimos}
        devolverFerramentas={devolverFerramentas}
        removerEmprestimo={removerEmprestimo}
        atualizarDisponibilidade={atualizarDisponibilidade}
        readonly={isFuncionario}
      />
    </div>
  );
};

export default EmprestimosTab;