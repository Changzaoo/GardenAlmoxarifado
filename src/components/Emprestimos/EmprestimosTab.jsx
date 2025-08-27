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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Empréstimos Ativos</h2>
        <a
          href="/historico-emprestimos"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Ver Histórico Completo
        </a>
      </div>
      
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