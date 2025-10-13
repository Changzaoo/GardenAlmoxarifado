import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { RefreshCw, Users, Building2, Briefcase, CheckCircle } from 'lucide-react';
import { useToast } from '../ToastProvider';

const AtualizarFuncionariosJardim = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [empresaZendaya, setEmpresaZendaya] = useState(null);
  const [setorJardim, setSetorJardim] = useState(null);
  const [funcionarios, setFuncionarios] = useState([]);
  const [funcionariosSemEmpresa, setFuncionariosSemEmpresa] = useState([]);
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Buscar empresa Zendaya
      const empresasRef = collection(db, 'empresas');
      const empresasSnap = await getDocs(empresasRef);
      const zendaya = empresasSnap.docs.find(doc => 
        doc.data().nome.toLowerCase().includes('zendaya')
      );
      
      if (zendaya) {
        setEmpresaZendaya({ id: zendaya.id, ...zendaya.data() });
        
        // Buscar setor Jardim da empresa Zendaya
        const setoresRef = collection(db, 'setores');
        const setoresQuery = query(setoresRef, where('empresaId', '==', zendaya.id));
        const setoresSnap = await getDocs(setoresQuery);
        const jardim = setoresSnap.docs.find(doc => 
          doc.data().nome.toLowerCase().includes('jardim')
        );
        
        if (jardim) {
          setSetorJardim({ id: jardim.id, ...jardim.data() });
        }
      }
      
      // Buscar todos os funcionários
      const funcionariosRef = collection(db, 'funcionarios');
      const funcionariosSnap = await getDocs(funcionariosRef);
      const todosFunc = funcionariosSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filtrar funcionários sem empresa ou setor
      const semEmpresa = todosFunc.filter(func => 
        !func.empresaId || !func.setorId
      );
      
      setFuncionarios(todosFunc);
      setFuncionariosSemEmpresa(semEmpresa);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const atualizarFuncionarios = async () => {
    if (!empresaZendaya || !setorJardim) {
      showToast('Empresa Zendaya ou Setor Jardim não encontrados', 'error');
      return;
    }

    if (funcionariosSemEmpresa.length === 0) {
      showToast('Todos os funcionários já estão vinculados', 'info');
      return;
    }

    if (!window.confirm(
      `Deseja vincular ${funcionariosSemEmpresa.length} funcionário(s) à empresa "${empresaZendaya.nome}" e ao setor "${setorJardim.nome}"?`
    )) {
      return;
    }

    try {
      setLoading(true);
      setProgresso({ atual: 0, total: funcionariosSemEmpresa.length });
      
      let atualizados = 0;
      let erros = 0;

      for (let i = 0; i < funcionariosSemEmpresa.length; i++) {
        const func = funcionariosSemEmpresa[i];
        
        try {
          const funcionarioRef = doc(db, 'funcionarios', func.id);
          await updateDoc(funcionarioRef, {
            empresaId: empresaZendaya.id,
            empresaNome: empresaZendaya.nome,
            setorId: setorJardim.id,
            setorNome: setorJardim.nome
          });
          
          atualizados++;
          setProgresso({ atual: i + 1, total: funcionariosSemEmpresa.length });
        } catch (error) {
          console.error(`Erro ao atualizar funcionário ${func.nome}:`, error);
          erros++;
        }
      }

      // Também atualizar na coleção 'usuario' se existir
      const usuariosRef = collection(db, 'usuario');
      const usuariosSnap = await getDocs(usuariosRef);
      
      for (const userDoc of usuariosSnap.docs) {
        const userData = userDoc.data();
        const funcionarioCorrespondente = funcionariosSemEmpresa.find(
          f => f.id === userData.id || f.nome === userData.nome
        );
        
        if (funcionarioCorrespondente) {
          try {
            const usuarioRef = doc(db, 'usuario', userDoc.id);
            await updateDoc(usuarioRef, {
              empresaId: empresaZendaya.id,
              empresaNome: empresaZendaya.nome,
              setorId: setorJardim.id,
              setorNome: setorJardim.nome
            });
          } catch (error) {
            console.error(`Erro ao atualizar usuário ${userData.nome}:`, error);
          }
        }
      }

      showToast(
        `✅ ${atualizados} funcionário(s) atualizado(s) com sucesso!${erros > 0 ? ` (${erros} erro(s))` : ''}`,
        'success'
      );
      
      // Recarregar dados
      carregarDados();
      
    } catch (error) {
      console.error('Erro ao atualizar funcionários:', error);
      showToast('Erro ao atualizar funcionários', 'error');
    } finally {
      setLoading(false);
      setProgresso({ atual: 0, total: 0 });
    }
  };

  if (loading && progresso.total === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
          <RefreshCw className="w-8 h-8" />
          Atualizar Funcionários - Jardim
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Vincular funcionários existentes à empresa Zendaya e ao setor Jardim
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Empresa</div>
              <div className="font-bold text-lg">
                {empresaZendaya ? empresaZendaya.nome : 'Não encontrada'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
          <div className="flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Setor</div>
              <div className="font-bold text-lg">
                {setorJardim ? setorJardim.nome : 'Não encontrado'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Funcionários sem Vínculo</div>
              <div className="font-bold text-lg">{funcionariosSemEmpresa.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Funcionários */}
      {funcionariosSemEmpresa.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Funcionários que serão atualizados:
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {funcionariosSemEmpresa.map((func, index) => (
              <div 
                key={func.id} 
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{func.nome}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {func.cargo || 'Sem cargo'}
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {!func.empresaId && <span className="text-orange-500">Sem empresa</span>}
                  {!func.setorId && <span className="text-orange-500 ml-2">Sem setor</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progresso */}
      {progresso.total > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="font-semibold">
              Atualizando: {progresso.atual} de {progresso.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progresso.atual / progresso.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Botão de Atualização */}
      <div className="flex justify-center">
        {empresaZendaya && setorJardim ? (
          funcionariosSemEmpresa.length > 0 ? (
            <button
              onClick={atualizarFuncionarios}
              disabled={loading}
              className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Atualizando...' : `Atualizar ${funcionariosSemEmpresa.length} Funcionário(s)`}
            </button>
          ) : (
            <div className="flex items-center gap-3 px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Todos os funcionários já estão vinculados!</span>
            </div>
          )
        ) : (
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">
              ⚠️ Empresa "Zendaya" ou Setor "Jardim" não encontrados.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Certifique-se de criar a empresa "Zendaya" e o setor "Jardim" primeiro.
            </p>
          </div>
        )}
      </div>

      {/* Estatísticas */}
      <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="font-semibold mb-3">Estatísticas:</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Total de Funcionários:</span>
            <span className="ml-2 font-bold">{funcionarios.length}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Com Empresa/Setor:</span>
            <span className="ml-2 font-bold text-green-600 dark:text-green-400">
              {funcionarios.length - funcionariosSemEmpresa.length}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Sem Empresa/Setor:</span>
            <span className="ml-2 font-bold text-orange-600 dark:text-orange-400">
              {funcionariosSemEmpresa.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AtualizarFuncionariosJardim;
