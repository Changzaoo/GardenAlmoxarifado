/**
 * Modal para Gerar Comprovantes em Lote
 * Permite selecionar múltiplos funcionários e gerar comprovantes de uma vez
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  FileText, 
  Users, 
  Calendar, 
  CheckSquare, 
  Square,
  Download,
  Printer,
  Filter,
  Search
} from 'lucide-react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { 
  ComprovanteDiario, 
  ComprovanteSemanal, 
  ComprovanteMensal, 
  ComprovanteAnual 
} from './ComprovantesPonto';

/**
 * Modal de Geração de Comprovantes em Lote
 */
const ModalComprovantesBatch = ({ isOpen, onClose, funcionarios = [] }) => {
  // Estados principais
  const [etapa, setEtapa] = useState(1); // 1: Seleção, 2: Configuração, 3: Visualização
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState([]);
  const [tipoComprovante, setTipoComprovante] = useState('');
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
  const [mesAno, setMesAno] = useState({ mes: new Date().getMonth(), ano: new Date().getFullYear() });
  const [ano, setAno] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [dadosComprovantes, setDadosComprovantes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroSetor, setFiltroSetor] = useState('todos');

  // Reset ao fechar
  useEffect(() => {
    if (!isOpen) {
      setEtapa(1);
      setFuncionariosSelecionados([]);
      setTipoComprovante('');
      setDadosComprovantes([]);
      setSearchTerm('');
      setFiltroSetor('todos');
    }
  }, [isOpen]);

  // Filtrar funcionários
  const funcionariosFiltrados = useMemo(() => {
    return funcionarios.filter(func => {
      const matchSearch = func.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         func.setor?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSetor = filtroSetor === 'todos' || func.setor === filtroSetor;
      return matchSearch && matchSetor;
    });
  }, [funcionarios, searchTerm, filtroSetor]);

  // Obter setores únicos
  const setores = useMemo(() => {
    const setoresUnicos = [...new Set(funcionarios.map(f => f.setor).filter(Boolean))];
    return setoresUnicos.sort();
  }, [funcionarios]);

  // Selecionar todos
  const selecionarTodos = () => {
    setFuncionariosSelecionados(funcionariosFiltrados.map(f => f.id));
  };

  // Desselecionar todos
  const desselecionarTodos = () => {
    setFuncionariosSelecionados([]);
  };

  // Toggle funcionário
  const toggleFuncionario = (id) => {
    if (funcionariosSelecionados.includes(id)) {
      setFuncionariosSelecionados(funcionariosSelecionados.filter(fid => fid !== id));
    } else {
      setFuncionariosSelecionados([...funcionariosSelecionados, id]);
    }
  };

  // Buscar dados para um funcionário
  const buscarDadosFuncionario = async (funcionario) => {
    try {
      const funcionarioNome = funcionario.nome;
      let dadosComprovante = null;

      switch (tipoComprovante) {
        case 'diario':
          dadosComprovante = await buscarDadosDiario(funcionarioNome);
          break;
        case 'semanal':
          dadosComprovante = await buscarDadosSemanal(funcionarioNome);
          break;
        case 'mensal':
          dadosComprovante = await buscarDadosMensal(funcionarioNome);
          break;
        case 'anual':
          dadosComprovante = await buscarDadosAnual(funcionarioNome);
          break;
        default:
          throw new Error('Tipo de comprovante inválido');
      }

      return {
        funcionario,
        dados: dadosComprovante,
        sucesso: true
      };
    } catch (error) {
      console.error(`Erro ao buscar dados de ${funcionario.nome}:`, error);
      return {
        funcionario,
        dados: null,
        sucesso: false,
        erro: error.message
      };
    }
  };

  // Buscar dados diário - SEM índice composto
  const buscarDadosDiario = async (funcionarioNome) => {
    const data = new Date(dataSelecionada);
    const inicioDia = new Date(data.setHours(0, 0, 0, 0));
    const fimDia = new Date(data.setHours(23, 59, 59, 999));

    // Query simples - apenas por funcionário (não requer índice composto)
    const q = query(
      collection(db, 'pontos'),
      where('funcionarioNome', '==', funcionarioNome)
    );

    const snapshot = await getDocs(q);
    const pontos = { entrada: null, saidaAlmoco: null, voltaAlmoco: null, saida: null };

    // Filtra por data no código (evita índice composto)
    snapshot.docs.forEach(doc => {
      const ponto = doc.data();
      const timestamp = ponto.data?.toDate ? ponto.data.toDate() : new Date(ponto.timestamp || ponto.data);
      
      // Verifica se está no dia selecionado
      if (timestamp >= inicioDia && timestamp <= fimDia) {
        if (ponto.tipo === 'entrada') pontos.entrada = timestamp;
        else if (ponto.tipo === 'saida_almoco') pontos.saidaAlmoco = timestamp;
        else if (ponto.tipo === 'retorno_almoco') pontos.voltaAlmoco = timestamp;
        else if (ponto.tipo === 'saida') pontos.saida = timestamp;
      }
    });

    return { data: new Date(dataSelecionada), pontos };
  };

  // Buscar dados semanal - SEM índice composto
  const buscarDadosSemanal = async (funcionarioNome) => {
    const data = new Date(dataSelecionada);
    const diaSemana = data.getDay();
    const inicioSemana = new Date(data);
    inicioSemana.setDate(data.getDate() - diaSemana);
    inicioSemana.setHours(0, 0, 0, 0);
    
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    fimSemana.setHours(23, 59, 59, 999);

    // Query simples - apenas por funcionário (não requer índice composto)
    const q = query(
      collection(db, 'pontos'),
      where('funcionarioNome', '==', funcionarioNome)
    );

    const snapshot = await getDocs(q);
    const pontosPorDia = {};
    
    // Filtra por data no código (evita índice composto)
    snapshot.docs.forEach(doc => {
      const ponto = doc.data();
      const timestamp = ponto.data?.toDate ? ponto.data.toDate() : new Date(ponto.timestamp || ponto.data);
      
      // Verifica se está na semana selecionada
      if (timestamp >= inicioSemana && timestamp <= fimSemana) {
        const diaKey = timestamp.toISOString().split('T')[0];
        
        if (!pontosPorDia[diaKey]) {
          pontosPorDia[diaKey] = {
            data: new Date(diaKey),
            pontos: { entrada: null, saidaAlmoco: null, voltaAlmoco: null, saida: null }
          };
        }
        
        if (ponto.tipo === 'entrada') pontosPorDia[diaKey].pontos.entrada = timestamp;
        else if (ponto.tipo === 'saida_almoco') pontosPorDia[diaKey].pontos.saidaAlmoco = timestamp;
        else if (ponto.tipo === 'retorno_almoco') pontosPorDia[diaKey].pontos.voltaAlmoco = timestamp;
        else if (ponto.tipo === 'saida') pontosPorDia[diaKey].pontos.saida = timestamp;
      }
    });

    const diasDaSemana = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicioSemana);
      dia.setDate(inicioSemana.getDate() + i);
      const diaKey = dia.toISOString().split('T')[0];
      
      diasDaSemana.push(pontosPorDia[diaKey] || {
        data: dia,
        pontos: { entrada: null, saidaAlmoco: null, voltaAlmoco: null, saida: null }
      });
    }

    return diasDaSemana;
  };

  // Buscar dados mensal - SEM índice composto
  const buscarDadosMensal = async (funcionarioNome) => {
    const inicioMes = new Date(mesAno.ano, mesAno.mes, 1);
    const fimMes = new Date(mesAno.ano, mesAno.mes + 1, 0, 23, 59, 59, 999);

    // Query simples - apenas por funcionário (não requer índice composto)
    const q = query(
      collection(db, 'pontos'),
      where('funcionarioNome', '==', funcionarioNome)
    );

    const snapshot = await getDocs(q);
    const pontosPorDia = {};
    
    // Filtra por data no código (evita índice composto)
    snapshot.docs.forEach(doc => {
      const ponto = doc.data();
      const timestamp = ponto.data?.toDate ? ponto.data.toDate() : new Date(ponto.timestamp || ponto.data);
      
      // Verifica se está no mês selecionado
      if (timestamp >= inicioMes && timestamp <= fimMes) {
        const diaKey = timestamp.toISOString().split('T')[0];
        
        if (!pontosPorDia[diaKey]) {
          pontosPorDia[diaKey] = {
            data: new Date(diaKey),
            pontos: { entrada: null, saidaAlmoco: null, voltaAlmoco: null, saida: null }
          };
        }
        
        if (ponto.tipo === 'entrada') pontosPorDia[diaKey].pontos.entrada = timestamp;
        else if (ponto.tipo === 'saida_almoco') pontosPorDia[diaKey].pontos.saidaAlmoco = timestamp;
        else if (ponto.tipo === 'retorno_almoco') pontosPorDia[diaKey].pontos.voltaAlmoco = timestamp;
        else if (ponto.tipo === 'saida') pontosPorDia[diaKey].pontos.saida = timestamp;
      }
    });

    return Object.values(pontosPorDia);
  };

  // Buscar dados anual - SEM índice composto
  const buscarDadosAnual = async (funcionarioNome) => {
    const inicioAno = new Date(ano, 0, 1);
    const fimAno = new Date(ano, 11, 31, 23, 59, 59, 999);

    // Query simples - apenas por funcionário (não requer índice composto)
    const q = query(
      collection(db, 'pontos'),
      where('funcionarioNome', '==', funcionarioNome)
    );

    const snapshot = await getDocs(q);
    const pontosPorDia = {};
    
    // Filtra por data no código (evita índice composto)
    snapshot.docs.forEach(doc => {
      const ponto = doc.data();
      const timestamp = ponto.data?.toDate ? ponto.data.toDate() : new Date(ponto.timestamp || ponto.data);
      
      // Verifica se está no ano selecionado
      if (timestamp >= inicioAno && timestamp <= fimAno) {
        const diaKey = timestamp.toISOString().split('T')[0];
        
        if (!pontosPorDia[diaKey]) {
          pontosPorDia[diaKey] = {
            data: new Date(diaKey),
            pontos: { entrada: null, saidaAlmoco: null, voltaAlmoco: null, saida: null }
          };
        }
        
        if (ponto.tipo === 'entrada') pontosPorDia[diaKey].pontos.entrada = timestamp;
        else if (ponto.tipo === 'saida_almoco') pontosPorDia[diaKey].pontos.saidaAlmoco = timestamp;
        else if (ponto.tipo === 'retorno_almoco') pontosPorDia[diaKey].pontos.voltaAlmoco = timestamp;
        else if (ponto.tipo === 'saida') pontosPorDia[diaKey].pontos.saida = timestamp;
      }
    });

    // Calcular totais por mês
    const mesesDoAno = [];
    for (let mes = 0; mes < 12; mes++) {
      const diasDoMes = Object.values(pontosPorDia).filter(dia => {
        return dia.data.getMonth() === mes && dia.data.getFullYear() === ano;
      });

      let totalMinutos = 0;
      diasDoMes.forEach(dia => {
        if (dia.pontos.entrada && dia.pontos.saidaAlmoco) {
          totalMinutos += (dia.pontos.saidaAlmoco - dia.pontos.entrada) / (1000 * 60);
        }
        if (dia.pontos.voltaAlmoco && dia.pontos.saida) {
          totalMinutos += (dia.pontos.saida - dia.pontos.voltaAlmoco) / (1000 * 60);
        }
      });

      mesesDoAno.push({
        mes,
        diasTrabalhados: diasDoMes.length,
        totalMinutos: Math.round(totalMinutos)
      });
    }

    return mesesDoAno;
  };

  // Gerar comprovantes em lote
  const gerarComprovantesBatch = async () => {
    if (!tipoComprovante || funcionariosSelecionados.length === 0) {
      return;
    }

    setLoading(true);
    try {
      const funcionariosParaGerar = funcionarios.filter(f => 
        funcionariosSelecionados.includes(f.id)
      );

      const resultados = [];
      for (const funcionario of funcionariosParaGerar) {
        const resultado = await buscarDadosFuncionario(funcionario);
        resultados.push(resultado);
      }

      setDadosComprovantes(resultados);
      setEtapa(3);
    } catch (error) {
      console.error('Erro ao gerar comprovantes:', error);
      alert('Erro ao gerar comprovantes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Avançar etapa
  const avancarEtapa = () => {
    if (etapa === 1 && funcionariosSelecionados.length > 0) {
      setEtapa(2);
    } else if (etapa === 2 && tipoComprovante) {
      gerarComprovantesBatch();
    }
  };

  // Voltar etapa
  const voltarEtapa = () => {
    if (etapa > 1) {
      setEtapa(etapa - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 text-white">
            <FileText className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Gerar Comprovantes em Lote</h2>
              <p className="text-sm text-green-100">
                Etapa {etapa} de 3: {
                  etapa === 1 ? 'Selecionar Funcionários' :
                  etapa === 2 ? 'Configurar Comprovante' :
                  'Visualizar Comprovantes'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex-shrink-0 bg-gray-200 dark:bg-gray-800">
          <div 
            className="h-1 bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
            style={{ width: `${(etapa / 3) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {/* ETAPA 1: Seleção de Funcionários */}
            {etapa === 1 && (
              <motion.div
                key="etapa1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Filtros e Busca */}
                <div className="flex gap-3 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por nome ou setor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <select
                    value={filtroSetor}
                    onChange={(e) => setFiltroSetor(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="todos">Todos os setores</option>
                    {setores.map(setor => (
                      <option key={setor} value={setor}>{setor}</option>
                    ))}
                  </select>

                  <div className="flex gap-2">
                    <button
                      onClick={selecionarTodos}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                    >
                      <CheckSquare className="w-4 h-4" />
                      Todos
                    </button>
                    <button
                      onClick={desselecionarTodos}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Square className="w-4 h-4" />
                      Nenhum
                    </button>
                  </div>
                </div>

                {/* Contador */}
                <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <Users className="w-5 h-5" />
                    <span className="font-semibold">
                      {funcionariosSelecionados.length} de {funcionariosFiltrados.length} funcionário(s) selecionado(s)
                    </span>
                  </div>
                </div>

                {/* Lista de Funcionários */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-1">
                  {funcionariosFiltrados.map(funcionario => {
                    const isSelected = funcionariosSelecionados.includes(funcionario.id);
                    return (
                      <motion.button
                        key={funcionario.id}
                        onClick={() => toggleFuncionario(funcionario.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-green-400'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {isSelected && <CheckSquare className="w-4 h-4 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 dark:text-white truncate">
                              {funcionario.nome}
                            </div>
                            {funcionario.setor && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {funcionario.setor}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ETAPA 2: Configuração do Comprovante */}
            {etapa === 2 && (
              <motion.div
                key="etapa2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Info dos selecionados */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                    <Users className="w-5 h-5" />
                    <span className="font-semibold">
                      {funcionariosSelecionados.length} funcionário(s) selecionado(s)
                    </span>
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    {funcionarios
                      .filter(f => funcionariosSelecionados.includes(f.id))
                      .map(f => f.nome)
                      .join(', ')}
                  </div>
                </div>

                {/* Tipo de Comprovante */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Tipo de Comprovante
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { valor: 'diario', titulo: 'Diário', cor: 'blue', icone: Calendar },
                      { valor: 'semanal', titulo: 'Semanal', cor: 'purple', icone: Calendar },
                      { valor: 'mensal', titulo: 'Mensal', cor: 'indigo', icone: Calendar },
                      { valor: 'anual', titulo: 'Anual', cor: 'amber', icone: Calendar }
                    ].map(tipo => {
                      const Icon = tipo.icone;
                      const isSelected = tipoComprovante === tipo.valor;
                      return (
                        <motion.button
                          key={tipo.valor}
                          onClick={() => setTipoComprovante(tipo.valor)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`p-6 rounded-xl border-2 transition-all ${
                            isSelected
                              ? `bg-${tipo.cor}-50 dark:bg-${tipo.cor}-900/20 border-${tipo.cor}-500`
                              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          <Icon className={`w-8 h-8 mx-auto mb-2 ${
                            isSelected
                              ? `text-${tipo.cor}-600 dark:text-${tipo.cor}-400`
                              : 'text-gray-400'
                          }`} />
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {tipo.titulo}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Configurações de Data */}
                {tipoComprovante && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {(tipoComprovante === 'diario' || tipoComprovante === 'semanal') && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          {tipoComprovante === 'diario' ? 'Data' : 'Semana contendo a data'}
                        </label>
                        <input
                          type="date"
                          value={dataSelecionada}
                          onChange={(e) => setDataSelecionada(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    {tipoComprovante === 'mensal' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Mês
                          </label>
                          <select
                            value={mesAno.mes}
                            onChange={(e) => setMesAno(prev => ({ ...prev, mes: parseInt(e.target.value) }))}
                            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            {Array.from({ length: 12 }, (_, i) => (
                              <option key={i} value={i}>
                                {new Date(2024, i).toLocaleDateString('pt-BR', { month: 'long' })}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Ano
                          </label>
                          <input
                            type="number"
                            value={mesAno.ano}
                            onChange={(e) => setMesAno(prev => ({ ...prev, ano: parseInt(e.target.value) }))}
                            min={2020}
                            max={2100}
                            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}

                    {tipoComprovante === 'anual' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Ano
                        </label>
                        <input
                          type="number"
                          value={ano}
                          onChange={(e) => setAno(parseInt(e.target.value))}
                          min={2020}
                          max={2100}
                          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ETAPA 3: Visualização */}
            {etapa === 3 && (
              <motion.div
                key="etapa3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <CheckSquare className="w-5 h-5" />
                    <span className="font-semibold">
                      {dadosComprovantes.filter(d => d.sucesso).length} de {dadosComprovantes.length} comprovante(s) gerado(s) com sucesso
                    </span>
                  </div>
                </div>

                {/* Grid de Comprovantes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
                  {dadosComprovantes.map((item, index) => (
                    <div key={index} className="border-2 border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden">
                      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b-2 border-gray-300 dark:border-gray-600">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {item.funcionario.nome}
                        </div>
                        {item.funcionario.setor && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {item.funcionario.setor}
                          </div>
                        )}
                      </div>
                      <div className="p-2 bg-white dark:bg-gray-900">
                        {item.sucesso ? (
                          <div className="transform scale-75 origin-top-left">
                            {tipoComprovante === 'diario' && (
                              <ComprovanteDiario
                                funcionarioNome={item.funcionario.nome}
                                data={item.dados.data}
                                pontos={item.dados.pontos}
                                onClose={() => {}}
                                embedded={true}
                              />
                            )}
                            {tipoComprovante === 'semanal' && (
                              <ComprovanteSemanal
                                funcionarioNome={item.funcionario.nome}
                                diasDaSemana={item.dados}
                                onClose={() => {}}
                                embedded={true}
                              />
                            )}
                            {tipoComprovante === 'mensal' && (
                              <ComprovanteMensal
                                funcionarioNome={item.funcionario.nome}
                                diasDoMes={item.dados}
                                mes={mesAno.mes}
                                ano={mesAno.ano}
                                onClose={() => {}}
                                embedded={true}
                              />
                            )}
                            {tipoComprovante === 'anual' && (
                              <ComprovanteAnual
                                funcionarioNome={item.funcionario.nome}
                                mesesDoAno={item.dados}
                                ano={ano}
                                onClose={() => {}}
                                embedded={true}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="text-red-600 dark:text-red-400 text-sm p-4">
                            ❌ Erro: {item.erro}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer com Botões */}
        <div className="flex-shrink-0 bg-gray-100 dark:bg-gray-800 px-6 py-4 border-t-2 border-gray-300 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={voltarEtapa}
            disabled={etapa === 1}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            Voltar
          </button>

          <div className="flex gap-3">
            {etapa === 3 ? (
              <>
                <button
                  onClick={() => window.print()}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  Imprimir Todos
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Concluir
                </button>
              </>
            ) : (
              <button
                onClick={avancarEtapa}
                disabled={
                  (etapa === 1 && funcionariosSelecionados.length === 0) ||
                  (etapa === 2 && !tipoComprovante) ||
                  loading
                }
                className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    {etapa === 2 ? 'Gerar Comprovantes' : 'Avançar'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ModalComprovantesBatch;
