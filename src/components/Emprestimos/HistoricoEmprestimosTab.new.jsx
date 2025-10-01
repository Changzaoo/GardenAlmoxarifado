import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Filter, 
  Search, 
  Clock, 
  CheckCircle, 
  Trash2, 
  X, 
  Download, 
  AlertTriangle,
  Tool,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEmprestimos } from '../../hooks/useEmprestimos';

const HistoricoEmprestimosTab = () => {
  const { emprestimos } = useEmprestimos();
  const [filtros, setFiltros] = useState({
    busca: '',
    status: 'todos', // todos, emprestado, devolvido, atrasado
    funcionario: '',
    ferramenta: '',
    dataInicio: '',
    dataFim: '',
    setor: '', // Filtrar por setor do funcionário
    categoria: '', // Filtrar por categoria da ferramenta
    diasEmprestimo: '', // Dias em que a ferramenta está/esteve emprestada
    devolvidoPorTerceiros: false,
    ordenacao: 'recentes', // recentes, antigos, maior_tempo, menor_tempo
    quantidadeFerramentas: '', // Filtro por quantidade de ferramentas emprestadas
    atrasados: false, // Empréstimos que excederam o prazo esperado
    periodo: 'todos', // todos, hoje, semana, mes, trimestre, ano
    tempoEmprestimoMaximo: '', // Tempo máximo de empréstimo em dias
    criticidade: 'todos' // todos, baixa, media, alta - baseado no atraso ou quantidade de ferramentas
  });

  const [showFiltros, setShowFiltros] = useState(false);

  // Lista de todos os funcionários e ferramentas únicas para os selects
  const { funcionariosUnicos, ferramentasUnicos } = useMemo(() => {
    const funcionarios = new Set();
    const ferramentas = new Set();
    
    emprestimos.forEach(emp => {
      funcionarios.add(emp.nomeFuncionario);
      emp.nomeFerramentas.forEach(f => ferramentas.add(f));
    });

    return {
      funcionariosUnicos: Array.from(funcionarios).sort(),
      ferramentasUnicos: Array.from(ferramentas).sort()
    };
  }, [emprestimos]);

  // Filtragem dos empréstimos
  const emprestimosFiltrados = useMemo(() => {
    const hoje = new Date();
    
    return emprestimos.filter(emp => {
      // Filtro de busca (funcionário, ferramenta ou observações)
      if (filtros.busca) {
        const termo = filtros.busca.toLowerCase();
        const encontrado = emp.nomeFuncionario.toLowerCase().includes(termo) ||
                        emp.nomeFerramentas.some(f => f.toLowerCase().includes(termo)) ||
                        (emp.observacoes || '').toLowerCase().includes(termo);
        if (!encontrado) return false;
      }
      
      // Filtro de status
      if (filtros.status !== 'todos') {
        const status = emp.status;
        const estaAtrasado = emp.dataPrevista && new Date(emp.dataPrevista) < hoje;
        
        if (filtros.status === 'emprestado' && status !== 'emprestado') return false;
        if (filtros.status === 'devolvido' && status !== 'devolvido') return false;
        if (filtros.status === 'atrasado' && (!estaAtrasado || status === 'devolvido')) return false;
      }

      // Filtro de criticidade
      if (filtros.criticidade !== 'todos') {
        const diasAtrasados = emp.dataPrevista ? Math.floor((hoje - new Date(emp.dataPrevista)) / (1000 * 60 * 60 * 24)) : 0;
        const qtdFerramentas = emp.nomeFerramentas.length;
        
        const getCriticidade = () => {
          if (diasAtrasados > 7 || qtdFerramentas > 5) return 'alta';
          if (diasAtrasados > 3 || qtdFerramentas > 3) return 'media';
          return 'baixa';
        };
        
        if (getCriticidade() !== filtros.criticidade) return false;
      }

      // Filtro de funcionário e setor
      if (filtros.funcionario && emp.nomeFuncionario !== filtros.funcionario) return false;
      if (filtros.setor && emp.setorFuncionario !== filtros.setor) return false;

      // Filtro de ferramenta e categoria
      if (filtros.ferramenta || filtros.categoria) {
        const ferramentasMatch = emp.nomeFerramentas.some(f => {
          if (filtros.ferramenta && f !== filtros.ferramenta) return false;
          if (filtros.categoria && emp.categoriaFerramentas[f] !== filtros.categoria) return false;
          return true;
        });
        if (!ferramentasMatch) return false;
      }

      // Filtro por data início
      if (filtros.dataInicio && new Date(emp.dataEmprestimo) < new Date(filtros.dataInicio)) return false;

      // Filtro por data fim
      if (filtros.dataFim && new Date(emp.dataEmprestimo) > new Date(filtros.dataFim)) return false;

      // Filtro por período
      if (filtros.periodo !== 'todos') {
        const dataEmprestimo = new Date(emp.dataEmprestimo);
        const diffDias = Math.floor((hoje - dataEmprestimo) / (1000 * 60 * 60 * 24));
        
        if (filtros.periodo === 'hoje' && diffDias > 0) return false;
        if (filtros.periodo === 'semana' && diffDias > 7) return false;
        if (filtros.periodo === 'mes' && diffDias > 30) return false;
        if (filtros.periodo === 'trimestre' && diffDias > 90) return false;
        if (filtros.periodo === 'ano' && diffDias > 365) return false;
      }

      return true;
    }).sort((a, b) => {
      if (filtros.ordenacao === 'recentes') {
        return new Date(b.dataEmprestimo) - new Date(a.dataEmprestimo);
      }
      if (filtros.ordenacao === 'antigos') {
        return new Date(a.dataEmprestimo) - new Date(b.dataEmprestimo);
      }
      // Ordenação por tempo de empréstimo
      const getTempoEmprestimo = (emp) => {
        const inicio = new Date(emp.dataEmprestimo);
        const fim = emp.dataDevolucao ? new Date(emp.dataDevolucao) : new Date();
        return fim - inicio;
      };
      if (filtros.ordenacao === 'maior_tempo') {
        return getTempoEmprestimo(b) - getTempoEmprestimo(a);
      }
      return getTempoEmprestimo(a) - getTempoEmprestimo(b);
    });
  }, [emprestimos, filtros]);

  // Estatísticas detalhadas
  const estatisticas = useMemo(() => {
    const hoje = new Date();
    const total = emprestimosFiltrados.length;
    const ativos = emprestimosFiltrados.filter(e => e.status === 'emprestado').length;
    const devolvidos = emprestimosFiltrados.filter(e => e.status === 'devolvido').length;
    const devolvidosPorTerceiros = emprestimosFiltrados.filter(e => e.devolvidoPorTerceiros).length;
    
    // Calcular atrasos
    const atrasados = emprestimosFiltrados.filter(e => {
      const dataPrevista = new Date(e.dataPrevista);
      return e.status === 'emprestado' && dataPrevista < hoje;
    }).length;

    // Média de tempo de empréstimo
    const temposEmprestimo = emprestimosFiltrados
      .filter(e => e.status === 'devolvido')
      .map(e => {
        const inicio = new Date(e.dataEmprestimo);
        const fim = new Date(e.dataDevolucao);
        return Math.floor((fim - inicio) / (1000 * 60 * 60 * 24));
      });
    
    const mediaTempoEmprestimo = temposEmprestimo.length 
      ? Math.round(temposEmprestimo.reduce((a, b) => a + b, 0) / temposEmprestimo.length)
      : 0;

    // Top ferramentas mais emprestadas
    const feramentasCount = emprestimosFiltrados.reduce((acc, emp) => {
      emp.nomeFerramentas.forEach(f => {
        acc[f] = (acc[f] || 0) + 1;
      });
      return acc;
    }, {});

    const topFerramentas = Object.entries(feramentasCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return { 
      total, 
      ativos, 
      devolvidos, 
      devolvidosPorTerceiros,
      atrasados,
      mediaTempoEmprestimo,
      topFerramentas
    };
  }, [emprestimosFiltrados]);

  // Exportar para CSV
  const exportarCSV = () => {
    const headers = [
      'Data Empréstimo',
      'Data Prevista',
      'Data Devolução',
      'Funcionário',
      'Setor',
      'Ferramentas',
      'Quantidade',
      'Status',
      'Observações'
    ];

    const dados = emprestimosFiltrados.map(emp => [
      format(new Date(emp.dataEmprestimo), 'dd/MM/yyyy HH:mm'),
      format(new Date(emp.dataPrevista), 'dd/MM/yyyy'),
      emp.dataDevolucao ? format(new Date(emp.dataDevolucao), 'dd/MM/yyyy HH:mm') : '-',
      emp.nomeFuncionario,
      emp.setorFuncionario || '-',
      emp.nomeFerramentas.join(', '),
      emp.nomeFerramentas.length,
      emp.status,
      emp.observacoes || '-'
    ]);

    const csv = [
      headers.join(','),
      ...dados.map(row => row.join(','))
    ].join('\\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `historico_emprestimos_${format(new Date(), 'dd-MM-yyyy')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      {/* Cabeçalho com Estatísticas */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>

            <p className="text-sm text-gray-600">
              Visualize e analise todos os empréstimos de ferramentas
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFiltros(!showFiltros)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
            <button
              onClick={exportarCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-gray-900 dark:text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de Empréstimos</p>
                <h3 className="text-2xl font-bold text-gray-900">{estatisticas.total}</h3>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-500">Ativos: {estatisticas.ativos}</span>
              <span className="text-gray-500">Devolvidos: {estatisticas.devolvidos}</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Empréstimos Atrasados</p>
                <h3 className="text-2xl font-bold text-red-600">{estatisticas.atrasados}</h3>
              </div>
              <div className="bg-red-100 p-2 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500">
                {((estatisticas.atrasados / estatisticas.total) * 100).toFixed(1)}% do total
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Média de Dias (Devolvidos)</p>
                <h3 className="text-2xl font-bold text-gray-900">{estatisticas.mediaTempoEmprestimo} dias</h3>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500">
                {estatisticas.devolvidosPorTerceiros} devolvidos por terceiros
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Top Ferramentas</p>
              <div className="bg-purple-100 p-2 rounded-lg">
                <Tool className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="space-y-2">
              {estatisticas.topFerramentas.map(([nome, count], i) => (
                <div key={nome} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 truncate">{nome}</span>
                  <span className="text-purple-600 font-medium">{count}x</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      {showFiltros && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filtros.status}
                onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
                className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors appearance-none"
              >
                <option value="todos" className="bg-white dark:bg-gray-800">Todos os Status</option>
                <option value="emprestado">Emprestados</option>
                <option value="devolvido">Devolvidos</option>
                <option value="atrasado">Atrasados</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
              <select
                value={filtros.periodo}
                onChange={(e) => setFiltros(prev => ({ ...prev, periodo: e.target.value }))}
                className="w-full rounded-lg border-gray-200 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todo Período</option>
                <option value="hoje">Hoje</option>
                <option value="semana">Última Semana</option>
                <option value="mes">Último Mês</option>
                <option value="trimestre">Último Trimestre</option>
                <option value="ano">Último Ano</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário</label>
              <select
                value={filtros.funcionario}
                onChange={(e) => setFiltros(prev => ({ ...prev, funcionario: e.target.value }))}
                className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors appearance-none"
              >
                <option value="" className="bg-white dark:bg-gray-800">Todos os Funcionários</option>
                {funcionariosUnicos.map(func => (
                  <option key={func} value={func}>{func}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ferramenta</label>
              <select
                value={filtros.ferramenta}
                onChange={(e) => setFiltros(prev => ({ ...prev, ferramenta: e.target.value }))}
                className="w-full rounded-lg border-gray-200 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas as Ferramentas</option>
                {ferramentasUnicos.map(ferr => (
                  <option key={ferr} value={ferr}>{ferr}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                className="w-full rounded-lg border-gray-200 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                className="w-full rounded-lg border-gray-200 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Criticidade</label>
              <select
                value={filtros.criticidade}
                onChange={(e) => setFiltros(prev => ({ ...prev, criticidade: e.target.value }))}
                className="w-full rounded-lg border-gray-200 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todas</option>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordenação</label>
              <select
                value={filtros.ordenacao}
                onChange={(e) => setFiltros(prev => ({ ...prev, ordenacao: e.target.value }))}
                className="w-full rounded-lg border-gray-200 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="recentes">Mais Recentes</option>
                <option value="antigos">Mais Antigos</option>
                <option value="maior_tempo">Maior Tempo Emprestado</option>
                <option value="menor_tempo">Menor Tempo Emprestado</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={() => setFiltros({
                busca: '',
                status: 'todos',
                funcionario: '',
                ferramenta: '',
                dataInicio: '',
                dataFim: '',
                setor: '',
                categoria: '',
                diasEmprestimo: '',
                devolvidoPorTerceiros: false,
                ordenacao: 'recentes',
                quantidadeFerramentas: '',
                atrasados: false,
                periodo: 'todos',
                tempoEmprestimoMaximo: '',
                criticidade: 'todos'
              })}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Tabela de Empréstimos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Funcionário
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ferramentas
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Devolução Prevista
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data Devolução
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {emprestimosFiltrados.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(emp.dataEmprestimo), 'dd/MM/yyyy HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{emp.nomeFuncionario}</div>
                      {emp.setorFuncionario && (
                        <div className="text-xs text-gray-500">{emp.setorFuncionario}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {emp.nomeFerramentas.join(', ')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {emp.nomeFerramentas.length} {emp.nomeFerramentas.length === 1 ? 'ferramenta' : 'ferramentas'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    emp.status === 'devolvido'
                      ? 'bg-green-100 text-green-800'
                      : new Date(emp.dataPrevista) < new Date()
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {emp.status === 'devolvido' 
                      ? 'Devolvido'
                      : new Date(emp.dataPrevista) < new Date()
                      ? 'Atrasado'
                      : 'Em Andamento'
                    }
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(emp.dataPrevista), 'dd/MM/yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {emp.dataDevolucao 
                    ? format(new Date(emp.dataDevolucao), 'dd/MM/yyyy HH:mm')
                    : '-'
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoricoEmprestimosTab;


