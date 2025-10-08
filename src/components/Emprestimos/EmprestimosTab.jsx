import { useAuth } from '../../hooks/useAuth';
import { NIVEIS_PERMISSAO } from '../../constants/permissoes';
import NovoEmprestimo from './NovoEmprestimo';
import ListaEmprestimos from './ListaEmprestimos';

const EmprestimosTab = ({
  emprestimos,
  inventario,
  adicionarEmprestimo,
  devolverFerramentas,
  removerEmprestimo,
  atualizarDisponibilidade,
  funcionarios
}) => {
  const { usuario } = useAuth();
  
  // ✅ Permite criar empréstimos: Admin (0), Funcionário (1) e Supervisor (2)
  const podeRealizarEmprestimo = usuario && usuario.nivel <= NIVEIS_PERMISSAO.SUPERVISOR;
  
  // Funcionários nível 1 têm apenas visualização
  const readonly = usuario?.nivel === NIVEIS_PERMISSAO.FUNCIONARIO;
  
  return (
    <div className="space-y-6">
      {podeRealizarEmprestimo && (
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
        readonly={readonly}
        funcionarios={funcionarios}
      />
    </div>
  );
};

export default EmprestimosTab;
