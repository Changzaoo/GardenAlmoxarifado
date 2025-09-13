import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  UserCircle, 
  Star, 
  Package, 
  CheckCircle, 
  ArrowLeft,
  Calendar
} from 'lucide-react';
import MeuInventarioTab from '../Inventario/MeuInventarioTab';
import TarefasTab from '../Tarefas/TarefasTab';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useIsMobile } from '../../hooks/useIsMobile';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ProfileTab = () => {
  const { usuario } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('inventario');
  const [emprestimos, setEmprestimos] = useState([]);
  const [cargoFuncionario, setCargoFuncionario] = useState('');
  const [stats, setStats] = useState({
    tarefasConcluidas: 0,
    ferramentasEmprestadas: 0,
    mediaEstrelas: 0,
    totalAvaliacoes: 0
  });

  // Carregar cargo do funcionário
  useEffect(() => {
    if (!usuario?.id) return;

    console.log("Buscando cargo do funcionário:", usuario.id);
    
    const unsubscribeCargo = onSnapshot(
      query(
        collection(db, 'funcionarios'),
        where('id', '==', String(usuario.id))
      ),
      (snapshot) => {
        if (!snapshot.empty) {
          const funcionarioData = snapshot.docs[0].data();
          console.log("Dados do funcionário encontrados:", funcionarioData);
          setCargoFuncionario(funcionarioData.cargo || '');
        } else {
          console.log("Funcionário não encontrado na coleção");
          setCargoFuncionario('');
        }
      }
    );

    return () => unsubscribeCargo();
  }, [usuario?.id]);

  // Carregar empréstimos do usuário
  useEffect(() => {
    console.log("Iniciando carregamento de empréstimos para usuário:", usuario?.id);
    
    if (!usuario?.id) {
      console.log("ID do usuário não disponível ainda");
      return;
    }

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'emprestimos'),
        where('funcionarioId', '==', String(usuario.id))
      ),
      (snapshot) => {
        const emprestimosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log("Empréstimos encontrados:", emprestimosData.length);
        console.log("Detalhes dos empréstimos:", emprestimosData);
        setEmprestimos(emprestimosData);
      }
    );

    return () => unsubscribe();
  }, [usuario.id]);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        console.log("Buscando estatísticas para usuário:", usuario);

        // Buscar tarefas concluídas
        const tarefasRef = collection(db, 'tarefas');
        const tarefasQuery = query(
          tarefasRef,
          where('funcionariosIds', 'array-contains', usuario.nome)
        );
        const tarefasSnap = await getDocs(tarefasQuery);
        
        let tarefasConcluidas = 0;
        let somaEstrelas = 0;
        let totalAvaliacoes = 0;
        
        console.log("Total de tarefas encontradas:", tarefasSnap.size);
        
        tarefasSnap.forEach(doc => {
          const tarefa = doc.data();
          console.log("Tarefa encontrada:", tarefa);
          
          if (tarefa.status === 'concluida') {
            tarefasConcluidas++;
            if (tarefa.avaliacaoSupervisor) {
              console.log("Avaliação encontrada:", tarefa.avaliacaoSupervisor);
              somaEstrelas += Number(tarefa.avaliacaoSupervisor);
              totalAvaliacoes++;
            }
          }
        });

        console.log("Tarefas concluídas:", tarefasConcluidas);
        console.log("Total avaliações:", totalAvaliacoes);
        console.log("Soma estrelas:", somaEstrelas);

        // Buscar empréstimos ativos
        const emprestimosRef = collection(db, 'emprestimos');
        const emprestimosQuery = query(
          emprestimosRef,
          where('funcionarioId', '==', String(usuario.id))
        );
        const emprestimosSnap = await getDocs(emprestimosQuery);
        
        let emprestimosAtivos = 0;
        emprestimosSnap.forEach(doc => {
          const emprestimo = doc.data();
          console.log("Empréstimo encontrado:", emprestimo);
          if (emprestimo.status === 'ativo' || emprestimo.status === 'emprestado') {
            // Conta todas as ferramentas do empréstimo
            emprestimosAtivos += emprestimo.ferramentas?.length || 0;
          }
        });

        console.log("Ferramentas emprestadas:", emprestimosAtivos);

        setStats({
          tarefasConcluidas: tarefasConcluidas,
          ferramentasEmprestadas: emprestimosAtivos,
          mediaEstrelas: totalAvaliacoes > 0 ? (somaEstrelas / totalAvaliacoes) : 0,
          totalAvaliacoes
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      }
    };

    fetchUserStats();
  }, [usuario.id]);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Cover & Profile Picture */}
      <div className="relative">
        <div className="h-32 bg-[#1D9BF0]/10"></div>
        <div className="absolute -bottom-12 left-4">
          <div className="w-24 h-24 rounded-full border-4 border-white dark:border-black bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
            {usuario.photoURL ? (
              <img 
                src={usuario.photoURL} 
                alt={usuario.nome} 
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCircle className="w-16 h-16 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="mt-16 px-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {usuario.nome}
        </h2>
        <div className="flex items-center gap-2 mt-1 text-gray-500 dark:text-gray-400">
          <span className="text-sm">{cargoFuncionario || 'Funcionário'}</span>
        </div>
        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>
            Entrou em {format(new Date(usuario.dataCriacao || Date.now()), 'MMMM yyyy', { locale: ptBR })}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 px-4">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center gap-2 text-[#1D9BF0]">
            <CheckCircle className="w-5 h-5" />
            <span className="text-lg font-bold">{stats.tarefasConcluidas}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tarefas Concluídas</p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center gap-2 text-[#1D9BF0]">
            <Package className="w-5 h-5" />
            <span className="text-lg font-bold">{stats.ferramentasEmprestadas}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ferramentas Emprestadas</p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center gap-2 text-[#1D9BF0]">
            <Star className="w-5 h-5" />
            <span className="text-lg font-bold">
              {stats.mediaEstrelas.toFixed(1)}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {stats.totalAvaliacoes} {stats.totalAvaliacoes === 1 ? 'Avaliação' : 'Avaliações'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b dark:border-[#2F3336]">
        <div className="flex px-4">
          <button 
            className={`px-6 py-4 font-medium text-sm relative ${
              activeTab === 'inventario' 
                ? 'text-[#1D9BF0] font-bold' 
                : 'text-gray-600 dark:text-gray-400'
            }`}
            onClick={() => setActiveTab('inventario')}
          >
            Meu Inventário
            {activeTab === 'inventario' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1D9BF0] rounded-full" />
            )}
          </button>
          <button 
            className={`px-6 py-4 font-medium text-sm relative ${
              activeTab === 'tarefas' 
                ? 'text-[#1D9BF0] font-bold' 
                : 'text-gray-600 dark:text-gray-400'
            }`}
            onClick={() => setActiveTab('tarefas')}
          >
            Minhas Tarefas
            {activeTab === 'tarefas' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1D9BF0] rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-4 px-4">
        {activeTab === 'inventario' && emprestimos && (
          <MeuInventarioTab
            emprestimos={emprestimos}
          />
        )}
        {activeTab === 'tarefas' && (
          <TarefasTab 
            showOnlyUserTasks={true}
            showAddButton={false}
          />
        )}
      </div>
    </div>
  );
};

export default ProfileTab;
