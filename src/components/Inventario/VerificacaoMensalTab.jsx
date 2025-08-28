import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, AlertCircle, ClipboardList, Calendar as CalendarIcon } from 'lucide-react';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import Button from '../common/Button';
import { useAuth } from '../../hooks/useAuth';

const VerificacaoMensalTab = () => {
  const [inventario, setInventario] = useState([]);
  const [verificacoes, setVerificacoes] = useState([]);
  const [mesAtual, setMesAtual] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
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
        observacao: ''
      }));
      setInventario(itens);
    } catch (error) {
      console.error('Erro ao carregar inventário:', error);
    }
  };

  const carregarVerificacoes = async () => {
    try {
      const verificacoesRef = collection(db, 'verificacoes_mensais');
      const q = query(verificacoesRef, where('mes', '==', mesAtual));
      const querySnapshot = await getDocs(q);
      const verificacoesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVerificacoes(verificacoesData);

      // Atualizar o estado dos itens verificados
      if (verificacoesData.length > 0) {
        const verificacao = verificacoesData[0];
        setInventario(prev => prev.map(item => ({
          ...item,
          verificado: verificacao.itens[item.id]?.verificado || false,
          observacao: verificacao.itens[item.id]?.observacao || ''
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar verificações:', error);
    }
  };

  const handleVerificarItem = (id) => {
    setInventario(prev => prev.map(item => 
      item.id === id ? { ...item, verificado: !item.verificado } : item
    ));
  };

  const handleObservacao = (id, observacao) => {
    setInventario(prev => prev.map(item => 
      item.id === id ? { ...item, observacao } : item
    ));
  };

  const salvarVerificacao = async () => {
    try {
      setLoading(true);
      const verificacaoData = {
        mes: mesAtual,
        dataVerificacao: new Date().toISOString(),
        responsavel: usuario.nome,
        itens: {}
      };

      inventario.forEach(item => {
        verificacaoData.itens[item.id] = {
          verificado: item.verificado,
          observacao: item.observacao
        };
      });

      // Verificar se já existe uma verificação para este mês
      if (verificacoes.length > 0) {
        // Atualizar verificação existente
        // TODO: Implementar atualização se necessário
      } else {
        // Criar nova verificação
        await addDoc(collection(db, 'verificacoes_mensais'), verificacaoData);
      }

      alert('Verificação mensal salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar verificação:', error);
      alert('Erro ao salvar verificação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (item) => {
    if (!item.verificado) return null;
    return item.quantidade === item.disponivel ? 
      <CheckCircle className="w-5 h-5 text-green-500" /> : 
      <AlertCircle className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ClipboardList className="w-6 h-6" />
          Verificação Mensal de Estoque
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gray-500" />
            <input
              type="month"
              value={mesAtual}
              onChange={(e) => setMesAtual(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
            />
          </div>
          <Button
            onClick={salvarVerificacao}
            loading={loading}
            variant="primary"
          >
            Salvar Verificação
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Quantidade Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Disponível
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Observações
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Verificado
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {inventario.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {item.nome}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {item.quantidade}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {item.disponivel}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {getStatusIcon(item)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  <input
                    type="text"
                    value={item.observacao}
                    onChange={(e) => handleObservacao(item.id, e.target.value)}
                    placeholder="Adicionar observação..."
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <input
                    type="checkbox"
                    checked={item.verificado}
                    onChange={() => handleVerificarItem(item.id)}
                    className="h-4 w-4 text-blue-600 dark:text-blue-400 rounded border-gray-300 dark:border-gray-600"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VerificacaoMensalTab;
