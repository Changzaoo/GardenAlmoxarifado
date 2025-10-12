import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, onSnapshot, doc, setDoc, getDoc, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { 
  Calendar, Users, Check, X, Clock, Filter, Download, 
  ChevronLeft, ChevronRight, UserCheck, AlertCircle 
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useSectorPermissions } from '../../hooks/useSectorPermissions';
import { PermissionChecker } from '../../constants/permissoes';

const STATUS_PONTO = {
  PRESENTE: 'presente',
  FALTA: 'falta',
  ATESTADO: 'atestado',
  FERIAS: 'ferias',
  FOLGA: 'folga',
  NAO_MARCADO: 'nao_marcado'
};

const STATUS_INFO = {
  [STATUS_PONTO.PRESENTE]: {
    cor: 'bg-green-500',
    corTexto: 'text-green-700 dark:text-green-400',
    corBg: 'bg-green-100 dark:bg-green-900/30',
    label: 'P',
    descricao: 'Presente'
  },
  [STATUS_PONTO.FALTA]: {
    cor: 'bg-red-500',
    corTexto: 'text-red-700 dark:text-red-400',
    corBg: 'bg-red-100 dark:bg-red-900/30',
    label: 'F',
    descricao: 'Falta'
  },
  [STATUS_PONTO.ATESTADO]: {
    cor: 'bg-blue-500',
    corTexto: 'text-blue-700 dark:text-blue-400',
    corBg: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'A',
    descricao: 'Atestado'
  },
  [STATUS_PONTO.FERIAS]: {
    cor: 'bg-purple-500',
    corTexto: 'text-purple-700 dark:text-purple-400',
    corBg: 'bg-purple-100 dark:bg-purple-900/30',
    label: 'FE',
    descricao: 'Férias'
  },
  [STATUS_PONTO.FOLGA]: {
    cor: 'bg-yellow-500',
    corTexto: 'text-yellow-700 dark:text-yellow-400',
    corBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    label: 'FO',
    descricao: 'Folga'
  },
  [STATUS_PONTO.NAO_MARCADO]: {
    cor: 'bg-gray-300 dark:bg-gray-600',
    corTexto: 'text-gray-500 dark:text-gray-400',
    corBg: 'bg-gray-50 dark:bg-gray-800',
    label: '-',
    descricao: 'Não marcado'
  }
};

const PontoPage = () => {
  const { usuario } = useAuth();
  const { canViewAllSectors } = useSectorPermissions();
  const isAdmin = canViewAllSectors;
  const isFuncionario = usuario?.nivel === 'funcionario';

  const [funcionarios, setFuncionarios] = useState([]);
  const [pontos, setPontos] = useState({});
  const [mesAtual, setMesAtual] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [filtroSetor, setFiltroSetor] = useState('todos');
  const [setores, setSetores] = useState([]);

  // Buscar funcionários
  useEffect(() => {
    let q = query(collection(db, 'usuarios'));
    
    // Se não for admin, filtrar por setor
    if (!isAdmin && usuario?.setor) {
      q = query(collection(db, 'usuarios'), where('setor', '==', usuario.setor));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const funcs = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(f => f.nivel === 'funcionario' || f.nivel === 'supervisor')
        .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
      
      setFuncionarios(funcs);
      
      // Extrair setores únicos
      const setoresUnicos = [...new Set(funcs.map(f => f.setor).filter(Boolean))];
      setSetores(setoresUnicos.sort());
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin, usuario]);

  // Buscar pontos do mês
  useEffect(() => {
    const mes = mesAtual.getMonth();
    const ano = mesAtual.getFullYear();
    const mesAnoKey = `${ano}-${String(mes + 1).padStart(2, '0')}`;

    const unsubscribe = onSnapshot(
      collection(db, 'pontos', mesAnoKey, 'registros'),
      (snapshot) => {
        const pontosData = {};
        snapshot.docs.forEach(doc => {
          pontosData[doc.id] = doc.data();
        });
        setPontos(pontosData);
      }
    );

    return () => unsubscribe();
  }, [mesAtual]);

  const getDiasDoMes = () => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    
    const dias = [];
    for (let dia = 1; dia <= ultimoDia; dia++) {
      const data = new Date(ano, mes, dia);
      const diaSemana = data.getDay(); // 0 = domingo, 6 = sábado
      dias.push({
        dia,
        data,
        diaSemana,
        ehFimDeSemana: diaSemana === 0 || diaSemana === 6
      });
    }
    return dias;
  };

  const getStatusPonto = (funcionarioId, dia) => {
    const mes = mesAtual.getMonth();
    const ano = mesAtual.getFullYear();
    const diaKey = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const pontoKey = `${funcionarioId}_${diaKey}`;
    
    return pontos[pontoKey]?.status || STATUS_PONTO.NAO_MARCADO;
  };

  const marcarPonto = async (funcionarioId, dia, status) => {
    if (isFuncionario) {
      toast.error('Você não tem permissão para marcar ponto');
      return;
    }

    try {
      const mes = mesAtual.getMonth();
      const ano = mesAtual.getFullYear();
      const mesAnoKey = `${ano}-${String(mes + 1).padStart(2, '0')}`;
      const diaKey = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      const pontoKey = `${funcionarioId}_${diaKey}`;

      await setDoc(doc(db, 'pontos', mesAnoKey, 'registros', pontoKey), {
        funcionarioId,
        data: diaKey,
        status,
        marcadoPor: usuario.id,
        marcadoEm: new Date().toISOString()
      });

      toast.success('Ponto marcado com sucesso!');
    } catch (error) {
      console.error('Erro ao marcar ponto:', error);
      toast.error('Erro ao marcar ponto');
    }
  };

  const marcarDiaTodo = async (dia, status) => {
    if (isFuncionario) {
      toast.error('Você não tem permissão');
      return;
    }

    const funcionariosFiltrados = funcionarios.filter(f => {
      if (filtroSetor === 'todos') return true;
      return f.setor === filtroSetor;
    });

    try {
      const promises = funcionariosFiltrados.map(f => 
        marcarPonto(f.id, dia, status)
      );
      await Promise.all(promises);
      toast.success(`Dia ${dia} marcado para todos!`);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao marcar dia');
    }
  };

  const calcularEstatisticas = (funcionarioId) => {
    const dias = getDiasDoMes();
    let presencas = 0;
    let faltas = 0;
    let atestados = 0;
    let ferias = 0;
    let folgas = 0;

    dias.forEach(({ dia }) => {
      const status = getStatusPonto(funcionarioId, dia);
      if (status === STATUS_PONTO.PRESENTE) presencas++;
      else if (status === STATUS_PONTO.FALTA) faltas++;
      else if (status === STATUS_PONTO.ATESTADO) atestados++;
      else if (status === STATUS_PONTO.FERIAS) ferias++;
      else if (status === STATUS_PONTO.FOLGA) folgas++;
    });

    return { presencas, faltas, atestados, ferias, folgas };
  };

  const mudarMes = (direcao) => {
    const novaData = new Date(mesAtual);
    novaData.setMonth(novaData.getMonth() + direcao);
    setMesAtual(novaData);
  };

  const exportarParaExcel = () => {
    toast.info('Funcionalidade de exportação em desenvolvimento');
  };

  const dias = getDiasDoMes();
  const diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  
  const funcionariosFiltrados = funcionarios.filter(f => {
    if (filtroSetor === 'todos') return true;
    return f.setor === filtroSetor;
  });

  const mesNome = mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Controle de Ponto
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gerencie presença e faltas dos funcionários
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportarParaExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Navegação de mês */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => mudarMes(-1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-400 capitalize">
                  {mesNome}
                </span>
              </div>
              <button
                onClick={() => mudarMes(1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Filtro de setor */}
            {isAdmin && setores.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <select
                  value={filtroSetor}
                  onChange={(e) => setFiltroSetor(e.target.value)}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos os setores</option>
                  {setores.map(setor => (
                    <option key={setor} value={setor}>{setor}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {Object.entries(STATUS_INFO).map(([key, info]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-8 h-8 ${info.cor} rounded flex items-center justify-center text-white text-xs font-bold`}>
                  {info.label}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {info.descricao}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabela de Ponto */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <th className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Funcionário
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Setor
                  </th>
                  {dias.map(({ dia, diaSemana, ehFimDeSemana }) => (
                    <th
                      key={dia}
                      className={`px-2 py-3 text-center text-xs font-semibold uppercase ${
                        ehFimDeSemana 
                          ? 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px]">{diasSemana[diaSemana]}</span>
                        <span className="text-sm font-bold">{dia}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Estatísticas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {funcionariosFiltrados.map((funcionario) => {
                  const stats = calcularEstatisticas(funcionario.id);
                  return (
                    <tr key={funcionario.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                              {(funcionario.nome || 'F')[0].toUpperCase()}
                            </span>
                          </div>
                          <span className="truncate max-w-[150px]">
                            {funcionario.nome || funcionario.username || 'Sem nome'}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-xs text-center text-gray-500 dark:text-gray-400">
                        {funcionario.setor || '-'}
                      </td>
                      {dias.map(({ dia, ehFimDeSemana }) => {
                        const status = getStatusPonto(funcionario.id, dia);
                        const info = STATUS_INFO[status];
                        
                        return (
                          <td
                            key={dia}
                            className={`px-1 py-2 text-center ${
                              ehFimDeSemana ? 'bg-gray-50 dark:bg-gray-800/50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-center">
                              <select
                                value={status}
                                onChange={(e) => marcarPonto(funcionario.id, dia, e.target.value)}
                                disabled={isFuncionario}
                                className={`w-12 h-12 text-center text-xs font-bold ${info.cor} text-white rounded cursor-pointer border-2 border-transparent hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                                style={{ appearance: 'none' }}
                              >
                                {Object.entries(STATUS_PONTO).map(([key, value]) => (
                                  <option key={value} value={value}>
                                    {STATUS_INFO[value].label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-xs text-center">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <Check className="w-3 h-3" />
                            <span className="font-semibold">{stats.presencas}P</span>
                          </div>
                          <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <X className="w-3 h-3" />
                            <span className="font-semibold">{stats.faltas}F</span>
                          </div>
                          {stats.atestados > 0 && (
                            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                              <AlertCircle className="w-3 h-3" />
                              <span className="font-semibold">{stats.atestados}A</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
          {Object.entries(STATUS_INFO)
            .filter(([key]) => key !== STATUS_PONTO.NAO_MARCADO)
            .map(([key, info]) => {
              const total = funcionariosFiltrados.reduce((acc, func) => {
                const stats = calcularEstatisticas(func.id);
                if (key === STATUS_PONTO.PRESENTE) return acc + stats.presencas;
                if (key === STATUS_PONTO.FALTA) return acc + stats.faltas;
                if (key === STATUS_PONTO.ATESTADO) return acc + stats.atestados;
                if (key === STATUS_PONTO.FERIAS) return acc + stats.ferias;
                if (key === STATUS_PONTO.FOLGA) return acc + stats.folgas;
                return acc;
              }, 0);

              return (
                <div key={key} className={`${info.corBg} rounded-xl p-4 border border-gray-200 dark:border-gray-700`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs font-medium ${info.corTexto} uppercase`}>
                        {info.descricao}
                      </p>
                      <p className={`text-2xl font-bold ${info.corTexto} mt-1`}>
                        {total}
                      </p>
                    </div>
                    <div className={`w-12 h-12 ${info.cor} rounded-xl flex items-center justify-center text-white font-bold`}>
                      {info.label}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default PontoPage;
