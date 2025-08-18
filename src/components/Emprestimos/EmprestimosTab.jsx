import React from 'react';
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
  return (
    <div className="space-y-6">
      <NovoEmprestimo 
        inventario={inventario}
        adicionarEmprestimo={adicionarEmprestimo}
        atualizarDisponibilidade={atualizarDisponibilidade}
      />
      
      <ListaEmprestimos
        emprestimos={emprestimos}
        devolverFerramentas={devolverFerramentas}
        removerEmprestimo={removerEmprestimo}
        atualizarDisponibilidade={atualizarDisponibilidade}
      />
    </div>
  );
};

export default EmprestimosTab;