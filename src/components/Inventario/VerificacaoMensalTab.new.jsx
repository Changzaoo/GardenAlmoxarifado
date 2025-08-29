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
  const [busca, setBusca] = useState('');
  const { usuario } = useAuth();

  // Carregar dados
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
        disponivel_temp: doc.data().disponivel
      }));
      setInventario(itens);
    } catch (error) {
      console.error('Erro ao carregar inventário:', error);
    }
  };

  const carregarVerificacoes = async () => {
    try {
      const q = query(
        collection(db, 'verificacoes_mensais'),
        where('mes', '==', mesAtual)
      );
      const querySnapshot = await getDocs(q);
      setVerificacoes(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Erro ao carregar verificações:', error);
    }
  };

  // Handlers
  const handleVerificar = async (item) => {
    if (loading) return;
    setLoading(true);
    try {
      const verificacao = {
        itemId: item.id,
        mes: mesAtual,
        quantidadeAnterior: item.disponivel,
        quantidadeVerificada: parseInt(item.disponivel_temp),
        observacao: item.observacao || '',
        verificadoPor: usuario.id,
        dataVerificacao: new Date().toISOString()
      };

      await addDoc(collection(db, 'verificacoes_mensais'), verificacao);
      
      if (item.disponivel !== item.disponivel_temp) {
        await updateDoc(doc(db, 'inventario', item.id), {
          disponivel: parseInt(item.disponivel_temp)
        });
      }

      await carregarVerificacoes();
    } catch (error) {
      console.error('Erro ao verificar item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeDisponivel = (item, value) => {
    const newInventario = inventario.map(i => 
      i.id === item.id ? { ...i, disponivel_temp: parseInt(value) || 0 } : i
    );
    setInventario(newInventario);
  };

  const handleChangeObservacao = (item, value) => {
    const newInventario = inventario.map(i => 
      i.id === item.id ? { ...i, observacao: value } : i
    );
    setInventario(newInventario);
  };

  const verificacaoPendente = (item) => {
    return !verificacoes.some(v => v.itemId === item.id);
  };

  // Estatísticas
  const stats = {
    total: inventario.length,
    verificados: verificacoes.length,
    pendentes: inventario.length - verificacoes.length,
    divergentes: verificacoes.filter(v => v.quantidadeAnterior !== v.quantidadeVerificada).length
  };

  // Filtrar itens pela busca
  const itensFiltrados = inventario.filter(item => 
    item.nome.toLowerCase().includes(busca.toLowerCase()) ||
    item.categoria.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <TwitterThemed.Container>
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center mb-6">
          <TwitterThemed.Title>
            <Calendar className="w-6 h-6" />
            Verificação Mensal
          </TwitterThemed.Title>

          <TwitterThemed.Input
            type="month"
            value={mesAtual}
            onChange={(e) => setMesAtual(e.target.value)}
            className="w-40"
          />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <TwitterThemed.Card>
            <h3 className={twitterThemeConfig.cardTitle}>Total de Itens</h3>
            <p className={`text-2xl font-bold ${twitterThemeConfig.primaryText}`}>
              {stats.total}
            </p>
          </TwitterThemed.Card>

          <TwitterThemed.Card>
            <h3 className={twitterThemeConfig.cardTitle}>Verificados</h3>
            <p className="text-2xl font-bold text-[#00BA7C]">
              {stats.verificados}
            </p>
          </TwitterThemed.Card>

          <TwitterThemed.Card>
            <h3 className={twitterThemeConfig.cardTitle}>Pendentes</h3>
            <p className="text-2xl font-bold text-[#FFD700]">
              {stats.pendentes}
            </p>
          </TwitterThemed.Card>

          <TwitterThemed.Card>
            <h3 className={twitterThemeConfig.cardTitle}>Divergentes</h3>
            <p className="text-2xl font-bold text-[#F4212E]">
              {stats.divergentes}
            </p>
          </TwitterThemed.Card>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 mb-4">
          <Search className={twitterThemeConfig.primaryIconColor} />
          <TwitterThemed.Input
            type="text"
            placeholder="Buscar item..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="flex-1"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <TwitterThemed.Table>
            <thead>
              <tr>
                <th className="w-12">Status</th>
                <th className="w-48">Nome</th>
                <th className="w-32">Categoria</th>
                <th className="w-24">Disponível</th>
                <th>Observação</th>
                <th className="w-28">Ações</th>
              </tr>
            </thead>
            <tbody>
              {itensFiltrados.map((item) => (
                <tr key={item.id}>
                  <td>
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
                  <td>{item.nome}</td>
                  <td>{item.categoria}</td>
                  <td>
                    <TwitterThemed.Input
                      type="number"
                      value={item.disponivel_temp}
                      onChange={(e) => handleChangeDisponivel(item, e.target.value)}
                      className="w-20"
                    />
                  </td>
                  <td>
                    <TwitterThemed.Input
                      type="text"
                      value={item.observacao}
                      onChange={(e) => handleChangeObservacao(item, e.target.value)}
                      placeholder="Adicionar observação..."
                      className="w-full"
                    />
                  </td>
                  <td>
                    <TwitterThemed.Button
                      onClick={() => handleVerificar(item)}
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <ClipboardList className="w-4 h-4" />
                      Verificar
                    </TwitterThemed.Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </TwitterThemed.Table>
        </div>
      </div>
    </TwitterThemed.Container>
  );
};

export default VerificacaoMensalTab;
