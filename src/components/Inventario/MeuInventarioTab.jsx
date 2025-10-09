import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { Package, ListFilter, ArrowUpDown, Calendar } from 'lucide-react';
import ListaMeuInventario from './ListaMeuInventario';
import TransferenciasRecebidas from '../Transferencias/TransferenciasRecebidas';
import { FuncionariosProvider } from '../Funcionarios/FuncionariosProvider';

const MeuInventarioTab = ({ emprestimos, readOnly = false, showEmptyMessage }) => {
  const { usuario } = useAuth();
  const [transferencias, setTransferencias] = useState([]);
  const [isLoadingTransferencias, setIsLoadingTransferencias] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroOrdenacao, setFiltroOrdenacao] = useState('mais-recente');

  // Carregar transferências pendentes
  useEffect(() => {
    let unsubscribe = () => {};

    const carregarTransferencias = async () => {
      if (!usuario?.id) return;

      const q = query(
        collection(db, 'transferencias'),
        where('funcionarioDestinoId', '==', String(usuario.id)),
        where('status', '==', 'pendente')
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const transferenciasData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setTransferencias(transferenciasData);
        setIsLoadingTransferencias(false);
      });
    };

    carregarTransferencias();
    return () => unsubscribe();
  }, [usuario]);

  // Filtrar e ordenar empréstimos
  const emprestimosFiltrados = useMemo(() => {
    if (!Array.isArray(emprestimos)) return [];

    let resultado = [...emprestimos];

    // Filtro por busca
    if (busca.trim()) {
      const buscaLower = busca.toLowerCase();
      resultado = resultado.filter(emp => 
        emp.ferramenta?.nome?.toLowerCase().includes(buscaLower) ||
        emp.funcionario?.nome?.toLowerCase().includes(buscaLower) ||
        emp.observacoes?.toLowerCase().includes(buscaLower)
      );
    }

    // Filtro por status
    if (filtroStatus !== 'todos') {
      resultado = resultado.filter(emp => emp.status === filtroStatus);
    }

    // Ordenação
    resultado.sort((a, b) => {
      switch (filtroOrdenacao) {
        case 'mais-recente':
          return new Date(b.dataEmprestimo) - new Date(a.dataEmprestimo);
        case 'mais-antigo':
          return new Date(a.dataEmprestimo) - new Date(b.dataEmprestimo);
        case 'ferramenta-az':
          return (a.ferramenta?.nome || '').localeCompare(b.ferramenta?.nome || '');
        case 'ferramenta-za':
          return (b.ferramenta?.nome || '').localeCompare(a.ferramenta?.nome || '');
        default:
          return 0;
      }
    });

    return resultado;
  }, [emprestimos, busca, filtroStatus, filtroOrdenacao]);

  const renderConteudo = () => {
    if (!usuario && !readOnly) {
      return (
        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 text-center shadow-md">
          <p className="text-gray-500 dark:text-gray-400">Você precisa estar logado para ver seus empréstimos.</p>
        </div>
      );
    }

    if (!Array.isArray(emprestimos)) {
      return (
        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 text-center shadow-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-[#1D9BF0] mx-auto"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Carregando empréstimos...</p>
        </div>
      );
    }

    return (
      <>
        {/* Badge Informativo */}
        {emprestimos.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 rounded-lg p-1.5">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Total de {emprestimos.length} empréstimo{emprestimos.length !== 1 ? 's' : ''} registrado{emprestimos.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Use os filtros abaixo para encontrar rapidamente
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Barra de Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Campo de Busca */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar
              </label>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por ferramenta, funcionário ou observações..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent
                         transition-all duration-200"
              />
            </div>

            {/* Filtro de Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <ListFilter className="w-4 h-4" />
                Status
              </label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full px-4 py-3 h-12 border border-gray-300 dark:border-gray-600 rounded-xl
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent
                         transition-all duration-200"
              >
                <option value="todos">Todos os status</option>
                <option value="ativo">Ativos</option>
                <option value="devolvido">Devolvidos</option>
                <option value="atrasado">Atrasados</option>
                <option value="cancelado">Cancelados</option>
              </select>
            </div>

            {/* Filtro de Ordenação */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4" />
                Ordenar por
              </label>
              <select
                value={filtroOrdenacao}
                onChange={(e) => setFiltroOrdenacao(e.target.value)}
                className="w-full px-4 py-3 h-12 border border-gray-300 dark:border-gray-600 rounded-xl
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent
                         transition-all duration-200"
              >
                <option value="mais-recente">Mais recentes primeiro</option>
                <option value="mais-antigo">Mais antigos primeiro</option>
                <option value="ferramenta-az">Ferramenta (A-Z)</option>
                <option value="ferramenta-za">Ferramenta (Z-A)</option>
              </select>
            </div>
          </div>

          {/* Contador de Resultados */}
          {(busca || filtroStatus !== 'todos') && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {emprestimosFiltrados.length}
                </span>
                {' '}resultado{emprestimosFiltrados.length !== 1 ? 's' : ''} encontrado{emprestimosFiltrados.length !== 1 ? 's' : ''}
                {busca && ` para "${busca}"`}
              </p>
            </div>
          )}
        </div>

        {transferencias.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 dark:border-gray-600 hover:border-blue-500 dark:border-[#1D9BF0] rounded-xl p-4 mb-6 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-semibold text-white">
                Transferências Pendentes ({transferencias.length})
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Você tem ferramentas aguardando sua confirmação de recebimento.
            </p>
          </div>
        )}
        
        <ListaMeuInventario 
          emprestimos={emprestimosFiltrados} 
          transferencias={transferencias}
          usuario={usuario} 
          isLoadingTransferencias={isLoadingTransferencias}
          showEmptyMessage={showEmptyMessage}
          readOnly={readOnly}
        />
      </>
    );
  };

  const content = (
    <div className="space-y-6">
      {renderConteudo()}
    </div>
  );

  if (readOnly) {
    return content;
  }

  return (
    <FuncionariosProvider>
      {content}
    </FuncionariosProvider>
  );
};

export default MeuInventarioTab;

