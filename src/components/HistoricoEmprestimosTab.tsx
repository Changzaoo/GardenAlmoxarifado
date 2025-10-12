import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar,
  Search,
  User,
  Package,
  Filter,
  RefreshCw,
  Download,
  Clock,
  ArrowUpDown,
  X
} from 'lucide-react';

const HistoricoEmprestimosTab = () => {
  const [emprestimos, setEmprestimos] = useState([]);
  const [filteredEmprestimos, setFilteredEmprestimos] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    funcionario: '',
    ferramenta: '',
    status: 'todos', // todos, ativos, devolvidos
    ordenacao: 'recentes' // recentes, antigos
  });

  // Carregar empréstimos do Firestore
  useEffect(() => {
    const q = query(collection(db, 'emprestimos'), orderBy('dataCriacao', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const emprestimosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEmprestimos(emprestimosData);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar empréstimos:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let resultado = [...emprestimos];

    // Filtro por data
    if (filtros.dataInicio) {
      resultado = resultado.filter(emp => 
        new Date(emp.dataCriacao) >= new Date(filtros.dataInicio)
      );
    }
    if (filtros.dataFim) {
      resultado = resultado.filter(emp => 
        new Date(emp.dataCriacao) <= new Date(filtros.dataFim)
      );
    }

    // Filtro por funcionário
    if (filtros.funcionario) {
      resultado = resultado.filter(emp =>
        emp.funcionario.nome.toLowerCase().includes(filtros.funcionario.toLowerCase())
      );
    }

    // Filtro por ferramenta
    if (filtros.ferramenta) {
      resultado = resultado.filter(emp =>
        emp.ferramentas.some(f => 
          f.nome.toLowerCase().includes(filtros.ferramenta.toLowerCase())
        )
      );
    }

    // Filtro por status
    if (filtros.status !== 'todos') {
      resultado = resultado.filter(emp =>
        filtros.status === 'ativos' ? !emp.dataDevolvido : emp.dataDevolvido
      );
    }

    // Ordenação
    resultado.sort((a, b) => {
      const dateA = new Date(a.dataCriacao);
      const dateB = new Date(b.dataCriacao);
      return filtros.ordenacao === 'recentes' ? dateB - dateA : dateA - dateB;
    });

    setFilteredEmprestimos(resultado);
  }, [emprestimos, filtros]);

  // Estatísticas
  const estatisticas = {
    total: filteredEmprestimos.length,
    ativos: filteredEmprestimos.filter(emp => !emp.dataDevolvido).length,
    devolvidos: filteredEmprestimos.filter(emp => emp.dataDevolvido).length,
    totalFerramentas: filteredEmprestimos.reduce((acc, emp) => acc + emp.ferramentas.length, 0)
  };

  // Exportar para CSV
  const exportarCSV = () => {
    const headers = ['Data', 'Funcionário', 'Ferramentas', 'Status', 'Data Devolução'];
    const rows = filteredEmprestimos.map(emp => [
      format(new Date(emp.dataCriacao), 'dd/MM/yyyy HH:mm'),
      emp.funcionario.nome,
      emp.ferramentas.map(f => f.nome).join(', '),
      emp.dataDevolvido ? 'Devolvido' : 'Ativo',
      emp.dataDevolvido ? format(new Date(emp.dataDevolvido), 'dd/MM/yyyy HH:mm') : '-'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historico-emprestimos-${format(new Date(), 'dd-MM-yyyy')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Histórico de Empréstimos</h1>
          <p className="text-gray-500">Visualize e analise todos os empréstimos realizados</p>
        </div>
        <button
          onClick={exportarCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-gray-900 dark:text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Registros</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.total}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Empréstimos Ativos</p>
              <p className="text-2xl font-bold text-green-600">{estatisticas.ativos}</p>
            </div>
            <Clock className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Empréstimos Devolvidos</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.devolvidos}</p>
            </div>
            <RefreshCw className="w-8 h-8 text-gray-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Ferramentas</p>
              <p className="text-2xl font-bold text-blue-600">{estatisticas.totalFerramentas}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Barra de pesquisa e Filtros */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600">
        {/* Barra de pesquisa com botão de filtro */}
        <div className="relative flex items-center mb-4">
          <input
            type="text"
            placeholder="Pesquisar em todo o histórico..."
            className="w-full px-2 py-1 md:px-4 md:py-2 text-sm md:text-base rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="absolute right-2 p-2 text-gray-500 hover:text-gray-700 md:hidden"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Container modal para filtros em mobile */}
        <div className={`
          fixed inset-0 z-50 md:relative md:inset-auto
          ${showFilters ? 'flex' : 'hidden md:block'}
        `}>
          {/* Overlay escuro em mobile */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 md:hidden"
            onClick={() => setShowFilters(false)}
          />
          
          {/* Conteúdo do modal em mobile, conteúdo normal em desktop */}
          <div className={`
            relative w-full md:w-auto
            bg-white dark:bg-gray-800 md:bg-transparent
            p-4 md:p-0
            ${showFilters ? 'mt-16 md:mt-0' : ''}
            rounded-t-2xl md:rounded-none
            shadow-lg md:shadow-none
            z-10 md:z-auto
            transform transition-transform duration-300 ease-in-out
            ${showFilters ? 'translate-y-0' : 'translate-y-full'}
            md:transform-none
          `}>
            {/* Cabeçalho do modal em mobile */}
            <div className="flex items-center justify-between mb-4 md:hidden">
              <h3 className="text-lg font-medium">Filtros</h3>
              <button 
                onClick={() => setShowFilters(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid de filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Data Início</label>
                <div className="mt-1 relative">
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Data Fim</label>
            <div className="mt-1 relative">
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Funcionário</label>
            <div className="mt-1 relative">
              <input
                type="text"
                value={filtros.funcionario}
                onChange={(e) => setFiltros(prev => ({ ...prev, funcionario: e.target.value }))}
                placeholder="Nome do funcionário"
                className="block w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ferramenta</label>
            <div className="mt-1 relative">
              <input
                type="text"
                value={filtros.ferramenta}
                onChange={(e) => setFiltros(prev => ({ ...prev, ferramenta: e.target.value }))}
                placeholder="Nome da ferramenta"
                className="block w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filtros.status}
              onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            >
              <option value="todos">Todos</option>
              <option value="ativos">Ativos</option>
              <option value="devolvidos">Devolvidos</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ordenação</label>
            <select
              value={filtros.ordenacao}
              onChange={(e) => setFiltros(prev => ({ ...prev, ordenacao: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            >
              <option value="recentes">Mais Recentes</option>
              <option value="antigos">Mais Antigos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Empréstimos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Funcionário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ferramentas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Devolução
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    Carregando...
                  </td>
                </tr>
              ) : filteredEmprestimos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    Nenhum empréstimo encontrado
                  </td>
                </tr>
              ) : (
                filteredEmprestimos.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(emp.dataCriacao), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {emp.funcionario.nome}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <ul>
                        {emp.ferramentas.map((f, idx) => (
                          <li key={idx}>{f.nome} ({f.quantidade})</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        emp.dataDevolvido 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {emp.dataDevolvido ? 'Devolvido' : 'Ativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {emp.dataDevolvido 
                        ? format(new Date(emp.dataDevolvido), 'dd/MM/yyyy HH:mm')
                        : '-'
                      }
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
      </div>
    </div>
  );
};

export default HistoricoEmprestimosTab;


