import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Info, Filter, Check, X, Eye, EyeOff } from 'lucide-react';
import { collection, doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const EscalaPage = ({ usuarioAtual }) => {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [funcionarios, setFuncionarios] = useState([]);
  const [escalas, setEscalas] = useState({});
  const [presencas, setPresencas] = useState({});
  const [setorSelecionado, setSetorSelecionado] = useState('todos');
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarLegenda, setMostrarLegenda] = useState(true);
  const [modoVisualizacao, setModoVisualizacao] = useState('semanal');
  const [mostrarPresenca, setMostrarPresenca] = useState(true);

  // Tipos de escala com cores
  const TIPOS_ESCALA = {
    M: {
      label: 'M',
      descricao: '6x1 Segunda a Sexta 07:20-16:20, Sábado/Domingo 07:20-13:20',
      cor: 'bg-green-500 dark:bg-green-600',
      corTexto: 'text-white',
      corBorda: 'border-green-600'
    },
    M1: {
      label: 'M1',
      descricao: '6x1 Horário 07:00-15:20, almoço 12:00-13:00',
      cor: 'bg-blue-500 dark:bg-blue-600',
      corTexto: 'text-white',
      corBorda: 'border-blue-600'
    },
    M4: {
      label: 'M4',
      descricao: '5x2 Segunda a Sexta 06:00-15:40, almoço 10:30-11:30',
      cor: 'bg-purple-500 dark:bg-purple-600',
      corTexto: 'text-white',
      corBorda: 'border-purple-600'
    },
    FOLGA: {
      label: 'FOLGA',
      descricao: 'Dia de folga',
      cor: 'bg-yellow-400 dark:bg-yellow-500',
      corTexto: 'text-gray-900 dark:text-gray-900',
      corBorda: 'border-yellow-500'
    },
    FERIAS: {
      label: 'FÉRIAS',
      descricao: 'Período de férias',
      cor: 'bg-orange-500 dark:bg-orange-600',
      corTexto: 'text-white',
      corBorda: 'border-orange-600'
    },
    ATESTADO: {
      label: 'ATESTADO',
      descricao: 'Atestado médico',
      cor: 'bg-red-500 dark:bg-red-600',
      corTexto: 'text-white',
      corBorda: 'border-red-600'
    },
    FOLGA_EXTRA: {
      label: 'FOLGA EXTRA',
      descricao: 'Folga extra concedida',
      cor: 'bg-cyan-500 dark:bg-cyan-600',
      corTexto: 'text-white',
      corBorda: 'border-cyan-600'
    },
    VAZIO: {
      label: '-',
      descricao: 'Não marcado',
      cor: 'bg-gray-200 dark:bg-gray-700',
      corTexto: 'text-gray-600 dark:text-gray-400',
      corBorda: 'border-gray-300'
    }
  };

  const MODOS_VISUALIZACAO = [
    { id: 'diario', label: 'Diário', dias: 1 },
    { id: 'semanal', label: 'Semanal', dias: 7 },
    { id: 'quinzenal', label: 'Quinzenal', dias: 15 },
    { id: 'mensal', label: 'Mensal', dias: 30 },
    { id: 'trimestral', label: 'Trimestral', dias: 90 },
    { id: 'semestral', label: 'Semestral', dias: 180 },
    { id: 'anual', label: 'Anual', dias: 365 }
  ];

  // Carregar funcionários
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'funcionarios'),
      (snapshot) => {
        const funcsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFuncionarios(funcsData);

        // Extrair setores únicos
        const setoresUnicos = [...new Set(funcsData.map(f => f.setor).filter(Boolean))];
        setSetores(setoresUnicos.sort());
        
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao carregar funcionários:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Carregar escalas do mês
  useEffect(() => {
    const mesAno = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}`;
    
    const unsubscribe = onSnapshot(
      collection(db, 'escalas', mesAno, 'registros'),
      (snapshot) => {
        const escalasData = {};
        snapshot.docs.forEach(doc => {
          escalasData[doc.id] = doc.data();
        });
        setEscalas(escalasData);
      },
      (error) => {
        console.error('Erro ao carregar escalas:', error);
      }
    );

    return () => unsubscribe();
  }, [mesAtual]);

  // Carregar presenças do mês
  useEffect(() => {
    const mesAno = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}`;
    
    const unsubscribe = onSnapshot(
      collection(db, 'presencas', mesAno, 'registros'),
      (snapshot) => {
        const presencasData = {};
        snapshot.docs.forEach(doc => {
          presencasData[doc.id] = doc.data();
        });
        setPresencas(presencasData);
      },
      (error) => {
        console.error('Erro ao carregar presenças:', error);
      }
    );

    return () => unsubscribe();
  }, [mesAtual]);

  // Verificar permissão
  const temPermissao = useMemo(() => {
    if (!usuarioAtual) return false;
    return usuarioAtual.nivel >= 2; // Supervisor ou superior (nivel 2, 3 ou 4)
  }, [usuarioAtual]);

  // Filtrar funcionários por setor
  const funcionariosFiltrados = useMemo(() => {
    if (setorSelecionado === 'todos') {
      return funcionarios;
    }
    return funcionarios.filter(f => f.setor === setorSelecionado);
  }, [funcionarios, setorSelecionado]);

  // Obter dias do mês
  const diasDoMes = useMemo(() => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const dias = [];

    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const data = new Date(ano, mes, dia);
      const diaSemana = data.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
      dias.push({
        dia,
        data,
        diaSemana: diaSemana.replace('.', ''),
        ehFimDeSemana: data.getDay() === 0 || data.getDay() === 6
      });
    }

    return dias;
  }, [mesAtual]);

  // Navegar entre meses
  const navegarMes = (direcao) => {
    setMesAtual(prev => {
      const novaData = new Date(prev);
      novaData.setMonth(novaData.getMonth() + direcao);
      return novaData;
    });
  };

  // Marcar escala
  const marcarEscala = async (funcionarioId, dia, tipo) => {
    if (!temPermissao) {
      alert('Você não tem permissão para editar a escala.');
      return;
    }

    try {
      const mesAno = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}`;
      const dataFormatada = `${mesAno}-${String(dia).padStart(2, '0')}`;
      const docId = `${funcionarioId}_${dataFormatada}`;

      const escalaData = {
        funcionarioId,
        data: dataFormatada,
        tipo,
        marcadoPor: usuarioAtual?.email || 'Sistema',
        marcadoEm: new Date()
      };

      await setDoc(doc(db, 'escalas', mesAno, 'registros', docId), escalaData);
    } catch (error) {
      console.error('Erro ao marcar escala:', error);
      alert('Erro ao salvar escala. Tente novamente.');
    }
  };

  // Marcar presença
  const marcarPresenca = async (funcionarioId, dia, presente) => {
    if (!temPermissao) {
      alert('Você não tem permissão para marcar presença.');
      return;
    }

    try {
      const mesAno = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}`;
      const dataFormatada = `${mesAno}-${String(dia).padStart(2, '0')}`;
      const docId = `${funcionarioId}_${dataFormatada}`;

      if (presente === null) {
        // Remove a marcação
        await deleteDoc(doc(db, 'presencas', mesAno, 'registros', docId));
      } else {
        const presencaData = {
          funcionarioId,
          data: dataFormatada,
          presente,
          marcadoPor: usuarioAtual?.email || 'Sistema',
          marcadoEm: new Date()
        };
        await setDoc(doc(db, 'presencas', mesAno, 'registros', docId), presencaData);
      }
    } catch (error) {
      console.error('Erro ao marcar presença:', error);
      alert('Erro ao salvar presença. Tente novamente.');
    }
  };

  // Obter presença
  const obterPresenca = (funcionarioId, dia) => {
    const mesAno = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}`;
    const dataFormatada = `${mesAno}-${String(dia).padStart(2, '0')}`;
    const docId = `${funcionarioId}_${dataFormatada}`;
    const presenca = presencas[docId];
    return presenca?.presente;
  };

  // Obter tipo de escala
  const obterTipoEscala = (funcionarioId, dia) => {
    const mesAno = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}`;
    const dataFormatada = `${mesAno}-${String(dia).padStart(2, '0')}`;
    const docId = `${funcionarioId}_${dataFormatada}`;
    return escalas[docId]?.tipo || 'VAZIO';
  };

  // Estatísticas por funcionário
  const calcularEstatisticas = (funcionarioId) => {
    let diasTrabalhados = 0;
    let folgas = 0;
    let ferias = 0;
    let atestados = 0;
    let presencas = 0;
    let faltas = 0;

    diasDoMes.forEach(({ dia }) => {
      const tipo = obterTipoEscala(funcionarioId, dia);
      if (tipo === 'M' || tipo === 'M1' || tipo === 'M4') diasTrabalhados++;
      else if (tipo === 'FOLGA' || tipo === 'FOLGA_EXTRA') folgas++;
      else if (tipo === 'FERIAS') ferias++;
      else if (tipo === 'ATESTADO') atestados++;

      const presencaStatus = obterPresenca(funcionarioId, dia);
      if (presencaStatus === true) presencas++;
      else if (presencaStatus === false) faltas++;
    });

    return { diasTrabalhados, folgas, ferias, atestados, presencas, faltas };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando escala...</p>
        </div>
      </div>
    );
  }

  if (!temPermissao) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <div className="text-red-500 mb-4">
            <Calendar className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Você não tem permissão para acessar a escala de trabalho.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Apenas supervisores e administradores podem visualizar e editar escalas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      {/* Cabeçalho */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <Calendar className="w-8 h-8 text-green-600" />
              Escala de Trabalho
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie a escala de trabalho e folgas dos funcionários
            </p>
          </div>

          {/* Navegação de Mês */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navegarMes(-1)}
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
            
            <div className="text-center min-w-[180px]">
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {mesAtual.toLocaleDateString('pt-BR', { month: 'long' })}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {mesAtual.getFullYear()}
              </div>
            </div>

            <button
              onClick={() => navegarMes(1)}
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filtrar por Setor
            </label>
            <select
              value={setorSelecionado}
              onChange={(e) => setSetorSelecionado(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600"
            >
              <option value="todos">Todos os Setores</option>
              {setores.map(setor => (
                <option key={setor} value={setor}>{setor}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setMostrarPresenca(!mostrarPresenca)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                mostrarPresenca
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
            >
              {mostrarPresenca ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              {mostrarPresenca ? 'Ocultar' : 'Mostrar'} Presença
            </button>
            
            <button
              onClick={() => setMostrarLegenda(!mostrarLegenda)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Info className="w-5 h-5" />
              {mostrarLegenda ? 'Ocultar' : 'Mostrar'} Legenda
            </button>
          </div>
        </div>
      </div>

      {/* Legenda */}
      {mostrarLegenda && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Legenda de Escalas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(TIPOS_ESCALA).map(([key, tipo]) => (
              key !== 'VAZIO' && (
                <div key={key} className="flex items-start gap-3">
                  <div className={`px-3 py-1 rounded ${tipo.cor} ${tipo.corTexto} font-bold text-sm min-w-[80px] text-center`}>
                    {tipo.label}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {tipo.descricao}
                    </p>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Tabela de Escala */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-green-600 dark:bg-green-700 text-white">
                <th className="sticky left-0 z-20 bg-green-600 dark:bg-green-700 px-4 py-3 text-left font-semibold border-r border-green-500 dark:border-green-600">
                  Cargo
                </th>
                <th className="sticky left-[100px] z-20 bg-green-600 dark:bg-green-700 px-4 py-3 text-left font-semibold border-r border-green-500 dark:border-green-600 min-w-[200px]">
                  Colaborador
                </th>
                {diasDoMes.map(({ dia, diaSemana, ehFimDeSemana }) => (
                  <th
                    key={dia}
                    className={`px-2 py-3 text-center font-semibold text-xs border-r border-green-500 dark:border-green-600 min-w-[60px] ${
                      ehFimDeSemana ? 'bg-green-700 dark:bg-green-800' : ''
                    }`}
                  >
                    <div>{diaSemana}</div>
                    <div className="text-lg">{dia}</div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-semibold border-l-2 border-green-500 dark:border-green-600 min-w-[120px]">
                  Estatísticas
                </th>
              </tr>
            </thead>
            <tbody>
              {funcionariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={diasDoMes.length + 3} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Nenhum funcionário encontrado
                  </td>
                </tr>
              ) : (
                funcionariosFiltrados.map((func, index) => {
                  const stats = calcularEstatisticas(func.id);
                  return (
                    <tr
                      key={func.id}
                      className={`${
                        index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-750' : 'bg-white dark:bg-gray-800'
                      } hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                    >
                      <td className="sticky left-0 z-10 px-4 py-3 border-r border-gray-200 dark:border-gray-700 bg-inherit">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {func.cargo || 'N/A'}
                        </span>
                      </td>
                      <td className="sticky left-[100px] z-10 px-4 py-3 border-r border-gray-200 dark:border-gray-700 bg-inherit">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 dark:text-white">
                            {func.nome}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {func.setor}
                          </span>
                        </div>
                      </td>
                      {diasDoMes.map(({ dia, ehFimDeSemana }) => {
                        const tipo = obterTipoEscala(func.id, dia);
                        const config = TIPOS_ESCALA[tipo] || TIPOS_ESCALA.VAZIO;
                        const presencaStatus = obterPresenca(func.id, dia);
                        return (
                          <td
                            key={dia}
                            className={`px-1 py-1 border-r border-gray-200 dark:border-gray-700 ${
                              ehFimDeSemana ? 'bg-gray-100 dark:bg-gray-750' : ''
                            }`}
                          >
                            <div className="flex flex-col gap-1">
                              <select
                                value={tipo}
                                onChange={(e) => marcarEscala(func.id, dia, e.target.value)}
                                className={`w-full px-1 py-1 text-xs font-bold text-center rounded cursor-pointer border-0 ${config.cor} ${config.corTexto} focus:ring-2 focus:ring-green-500`}
                              >
                                {Object.entries(TIPOS_ESCALA).map(([key, t]) => (
                                  <option key={key} value={key}>
                                    {t.label}
                                  </option>
                                ))}
                              </select>
                              
                              {mostrarPresenca && (
                                <div className="flex gap-0.5 justify-center">
                                  <button
                                    onClick={() => marcarPresenca(func.id, dia, presencaStatus === true ? null : true)}
                                    className={`flex-1 px-1 py-0.5 rounded text-xs font-bold transition-all ${
                                      presencaStatus === true
                                        ? 'bg-green-600 text-white scale-105'
                                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-800'
                                    }`}
                                    title="Presente"
                                  >
                                    <Check className="w-3 h-3 mx-auto" />
                                  </button>
                                  <button
                                    onClick={() => marcarPresenca(func.id, dia, presencaStatus === false ? null : false)}
                                    className={`flex-1 px-1 py-0.5 rounded text-xs font-bold transition-all ${
                                      presencaStatus === false
                                        ? 'bg-red-600 text-white scale-105'
                                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-800'
                                    }`}
                                    title="Falta"
                                  >
                                    <X className="w-3 h-3 mx-auto" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 border-l-2 border-gray-300 dark:border-gray-600 bg-inherit">
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Trabalho:</span>
                            <span className="font-bold text-green-600 dark:text-green-400">{stats.diasTrabalhados}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Folgas:</span>
                            <span className="font-bold text-yellow-600 dark:text-yellow-400">{stats.folgas}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Férias:</span>
                            <span className="font-bold text-orange-600 dark:text-orange-400">{stats.ferias}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Atestados:</span>
                            <span className="font-bold text-red-600 dark:text-red-400">{stats.atestados}</span>
                          </div>
                          {mostrarPresenca && (
                            <>
                              <div className="h-px bg-gray-300 dark:bg-gray-600 my-1"></div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">✓ Presenças:</span>
                                <span className="font-bold text-green-600 dark:text-green-400">{stats.presencas}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">✗ Faltas:</span>
                                <span className="font-bold text-red-600 dark:text-red-400">{stats.faltas}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          Resumo do Mês
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total de Funcionários
            </div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white">
              {funcionariosFiltrados.length}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Dias no Mês
            </div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white">
              {diasDoMes.length}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Dias Úteis
            </div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white">
              {diasDoMes.filter(d => !d.ehFimDeSemana).length}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Fins de Semana
            </div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white">
              {diasDoMes.filter(d => d.ehFimDeSemana).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EscalaPage;
