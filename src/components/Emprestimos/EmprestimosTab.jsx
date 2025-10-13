import { useAuth } from '../../hooks/useAuth';
import { useContext } from 'react';
import { NIVEIS_PERMISSAO } from '../../constants/permissoes';
import NovoEmprestimo from './NovoEmprestimo';
import ListaEmprestimos from './ListaEmprestimos';

// Import opcional do DataContext
let DataContext;
try {
  const module = require('../../context/DataContext');
  DataContext = module.DataContext;
} catch (e) {
  DataContext = null;
}

const EmprestimosTab = ({
  emprestimos: emprestimosProps,
  inventario,
  adicionarEmprestimo,
  devolverFerramentas,
  removerEmprestimo,
  atualizarDisponibilidade,
  funcionarios
}) => {
  const { usuario } = useAuth();
  
  // Tentar usar DataContext se disponível
  let emprestimosGlobal = [];
  if (DataContext) {
    try {
      const context = useContext(DataContext);
      emprestimosGlobal = context?.emprestimos || [];
    } catch (e) {
      emprestimosGlobal = [];
    }
  }
  
  const emprestimos = emprestimosProps || emprestimosGlobal;
  
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
