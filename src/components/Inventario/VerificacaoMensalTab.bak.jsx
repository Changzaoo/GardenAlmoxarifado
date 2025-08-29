import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, AlertCircle, ClipboardList, Search } from 'lucide-react';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { twitterThemeConfig } from '../../styles/twitterThemeConfig';
import TwitterThemed from '../common/TwitterThemed';

// Status de verificação
const STATUS_VERIFICACAO = {
  PENDENTE: 'pendente',
  VERIFICADO: 'verificado',
  DIVERGENTE: 'divergente'
};

const STATUS_LABELS = {
  pendente: 'Pendente',
  verificado: 'Verificado',
  divergente: 'Divergente'
};

const STATUS_COLORS = {
  pendente: 'bg-[#FFD700] bg-opacity-10 text-[#FFD700]',
  verificado: 'bg-[#00BA7C] bg-opacity-10 text-[#00BA7C]',
  divergente: 'bg-[#F4212E] bg-opacity-10 text-[#F4212E]'
};

const VerificacaoMensalTab = () => {
  const [inventario, setInventario] = useState([]);
  const [verificacoes, setVerificacoes] = useState([]);
  const [mesAtual, setMesAtual] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { usuario } = useAuth();

  useEffect(() => {
    carregarInventario();
    carregarVerificacoes();
  }, [mesAtual]);

  const carregarInventario = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'inventario'));
      const itens = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        verificado: false,
        observacao: '',
        disponivel_temp: doc.data().disponivel // Campo temporário para edição
      }));
      setInventario(itens);
    } catch (error) {
      console.error('Erro ao carregar inventário:', error);
    }
  };

  const carregarVerificacoes = async () => {
    try {
      const [ano, mes] = mesAtual.split('-');
      const startDate = new Date(ano, mes - 1, 1);
      const endDate = new Date(ano, mes, 0);

      const q = query(
        collection(db, 'verificacoes'),
        where('data', '>=', startDate),
        where('data', '<=', endDate)
      );

      const querySnapshot = await getDocs(q);
      const verificacoesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVerificacoes(verificacoesData);
    } catch (error) {
      console.error('Erro ao carregar verificações:', error);
    }
  };

  const handleVerificar = async (item) => {
    if (loading) return;
    setLoading(true);

    try {
      // Atualiza o item no inventário com o novo valor de disponível
      await updateDoc(doc(db, 'inventario', item.id), {
        disponivel: item.disponivel_temp
      });

      // Cria um registro de verificação
      await addDoc(collection(db, 'verificacoes'), {
        itemId: item.id,
        nome: item.nome,
        verificadorId: usuario.id,
        verificadorNome: usuario.nome,
        data: new Date(),
        disponivel: item.disponivel_temp,
        observacao: item.observacao || ''
      });

      // Recarrega os dados
      await carregarInventario();
      await carregarVerificacoes();
    } catch (error) {
      console.error('Erro ao verificar item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeDisponivel = (item, value) => {
    const novoInventario = inventario.map(i => {
      if (i.id === item.id) {
        return { ...i, disponivel_temp: parseInt(value) || 0 };
      }
      return i;
    });
    setInventario(novoInventario);
  };

  const handleChangeObservacao = (item, value) => {
    const novoInventario = inventario.map(i => {
      if (i.id === item.id) {
        return { ...i, observacao: value };
      }
      return i;
    });
    setInventario(novoInventario);
  };

  const verificacaoPendente = (item) => {
    const verificacoesMes = verificacoes.filter(v => v.itemId === item.id);
    return verificacoesMes.length === 0;
  };

  // Calcular estatísticas
  const calcularEstatisticas = () => {
    const total = inventario.length;
    const verificados = verificacoes.length;
    const pendentes = total - verificados;
    const divergentes = verificacoes.filter(v => 
      v.disponivel !== inventario.find(i => i.id === v.itemId)?.disponivel
    ).length;

    return {
      total,
      verificados,
      pendentes,
      divergentes
    };
  };

  const filtrarItens = () => {
    return inventario.filter(item =>
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.codigo.toString().includes(searchTerm.toLowerCase())
    );
  };

  const stats = calcularEstatisticas();

  return (
    <div className={`container mx-auto p-4 ${twitterThemeConfig.backgroundColor}`}>
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold flex items-center gap-2 ${twitterThemeConfig.textColor}`}>
            <Calendar className={`w-6 h-6 ${twitterThemeConfig.iconColor}`} />
            Verificação Mensal do Inventário
          </h2>
          <div className="flex items-center gap-4">
            <input
              type="month"
              value={mesAtual}
              onChange={(e) => setMesAtual(e.target.value)}
              className={`${twitterThemeConfig.input} ${twitterThemeConfig.backgroundColor} ${twitterThemeConfig.textColor}`}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className={`${twitterThemeConfig.card} p-4 rounded-lg`}>
            <h3 className="text-sm font-medium text-gray-500">Total de Itens</h3>
            <p className="text-2xl font-bold text-[#1D9BF0]">{stats.total}</p>
          </div>
          <div className={`${twitterThemeConfig.card} p-4 rounded-lg`}>
            <h3 className="text-sm font-medium text-gray-500">Verificados</h3>
            <p className="text-2xl font-bold text-[#00BA7C]">{stats.verificados}</p>
          </div>
          <div className={`${twitterThemeConfig.card} p-4 rounded-lg`}>
            <h3 className="text-sm font-medium text-gray-500">Pendentes</h3>
            <p className="text-2xl font-bold text-[#FFD700]">{stats.pendentes}</p>
          </div>
          <div className={`${twitterThemeConfig.card} p-4 rounded-lg`}>
            <h3 className="text-sm font-medium text-gray-500">Divergentes</h3>
            <p className="text-2xl font-bold text-[#F4212E]">{stats.divergentes}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className={`flex items-center gap-2 mb-4 ${twitterThemeConfig.inputWrapper}`}>
          <Search className={`w-5 h-5 ${twitterThemeConfig.iconColor}`} />
          <input
            type="text"
            placeholder="Buscar item..."
            className={`${twitterThemeConfig.input} flex-1`}
            onChange={(e) => {/* Implementar busca */}}
          />
        </div>

        <div className="overflow-x-auto">
          <table className={`min-w-full ${twitterThemeConfig.backgroundColor} shadow-md rounded-lg overflow-hidden`}>
            <thead className={twitterThemeConfig.tableHeader}>
              <tr>
                <th className={`sticky left-0 z-10 px-3 py-3 text-left text-xs font-medium uppercase tracking-wider w-12 ${twitterThemeConfig.tableHeaderCell}`}>Status</th>
                <th className={`sticky left-12 z-10 px-3 py-3 text-left text-xs font-medium uppercase tracking-wider w-48 ${twitterThemeConfig.tableHeaderCell}`}>Nome</th>
                <th className={`sticky left-60 z-10 px-3 py-3 text-left text-xs font-medium uppercase tracking-wider w-32 ${twitterThemeConfig.tableHeaderCell}`}>Categoria</th>
                <th className={`sticky left-92 z-10 px-3 py-3 text-left text-xs font-medium uppercase tracking-wider w-24 ${twitterThemeConfig.tableHeaderCell}`}>Disponível</th>
                <th className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider ${twitterThemeConfig.tableHeaderCell}`}>Observação</th>
                <th className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider w-28 ${twitterThemeConfig.tableHeaderCell}`}>Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                return (
    <TwitterThemed.Container>
      <div className={`flex items-center justify-between mb-6 ${twitterThemeConfig.headerContainer}`}>
        <h2 className={`flex items-center gap-2 ${twitterThemeConfig.title}`}>
          <Calendar className={`w-6 h-6 ${twitterThemeConfig.primaryIconColor}`} />
          Verificação Mensal
        </h2>
        <div className="flex items-center gap-4">
          <TwitterThemed.Input
            type="month"
            value={mesAtual}
            onChange={(e) => setMesAtual(e.target.value)}
            className="w-40"
          />
          <div className="relative">
            <TwitterThemed.Input
              type="text"
              placeholder="Buscar item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${twitterThemeConfig.secondaryText}`} />
          </div>
        </div>
      </div>

      <TwitterThemed.Table>
        <TwitterThemed.THead>
          <tr>
            <th scope="col">Código</th>
            <th scope="col">Nome</th>
            <th scope="col">Quantidade</th>
            <th scope="col">Status</th>
            <th scope="col">Observação</th>
            <th scope="col">Ação</th>
          </tr>
        </TwitterThemed.THead>
        <tbody className={twitterThemeConfig.tableBody}>
          {filtrarItens().map((item) => (
                <tr key={item.id} className={`${twitterThemeConfig.tableRow}`}>
                  <td className={`sticky left-0 z-10 px-3 py-4 whitespace-nowrap w-12 ${twitterThemeConfig.tableCellSticky}`}>
                    <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      verificacaoPendente(item)
                        ? STATUS_COLORS.pendente
                        : item.disponivel_temp !== item.disponivel
                        ? STATUS_COLORS.divergente
                        : STATUS_COLORS.verificado
                    }`}>
                      {verificacaoPendente(item)
                        ? STATUS_LABELS.pendente
                        : item.disponivel_temp !== item.disponivel
                        ? STATUS_LABELS.divergente
                        : STATUS_LABELS.verificado
                      }
                    </div>
                  </td>
                  <td className={`sticky left-12 z-10 px-3 py-4 whitespace-nowrap w-48 ${twitterThemeConfig.tableCellSticky}`}>{item.nome}</td>
                  <td className={`sticky left-60 z-10 px-3 py-4 whitespace-nowrap w-32 ${twitterThemeConfig.tableCellSticky}`}>{item.categoria}</td>
                  <td className={`sticky left-92 z-10 px-3 py-4 whitespace-nowrap w-24 ${twitterThemeConfig.tableCellSticky}`}>
                    <input
                      type="number"
                      value={item.disponivel_temp}
                      onChange={(e) => handleChangeDisponivel(item, e.target.value)}
                      className={`w-16 ${twitterThemeConfig.input}`}
                    />
                  </td>
                  <td className={`px-3 py-4 ${twitterThemeConfig.tableCell}`}>
                    <input
                      type="text"
                      value={item.observacao}
                      onChange={(e) => handleChangeObservacao(item, e.target.value)}
                      className={`w-full ${twitterThemeConfig.input}`}
                      placeholder="Adicionar observação..."
                    />
                  </td>
                  <td className={`px-3 py-4 whitespace-nowrap w-28 ${twitterThemeConfig.tableCell}`}>
                    <Button
                      onClick={() => handleVerificar(item)}
                      disabled={loading}
                      variant="primary"
                      className={`flex items-center gap-2 ${twitterThemeConfig.button}`}
                    >
                      <ClipboardList className="w-4 h-4" />
                      Verificar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VerificacaoMensalTab;
