import React from 'react';
import { useEmprestimos } from '../../hooks/useEmprestimos';
import HistoricoEmprestimosTab from '../Emprestimos/HistoricoEmprestimosTab';

const HistoricoPage = () => {
  const { emprestimos, devolverFerramentas, removerEmprestimo, atualizarDisponibilidade } = useEmprestimos();

  return (
    <div className="container mx-auto p-4">
      <HistoricoEmprestimosTab
        emprestimos={emprestimos}
        devolverFerramentas={devolverFerramentas}
        removerEmprestimo={removerEmprestimo}
        atualizarDisponibilidade={atualizarDisponibilidade}
      />
    </div>
  );
};

export default HistoricoPage;
