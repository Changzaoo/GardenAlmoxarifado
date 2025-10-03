import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Users, Edit2, Trash2, Clock, Copy } from 'lucide-react';
import { collection, addDoc, query, onSnapshot, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ToastProvider';
import { notificarCronogramaSemanal } from '../../services/tarefaNotificationService';
import { useFuncionarios } from '../Funcionarios/FuncionariosProvider';

const CriarCronogramaSemanal = ({ onClose, onCronogramaCriado }) => {
  const [etapa, setEtapa] = useState(1); // 1: Funcionários, 2: Tarefas por dia, 3: Revisão
  const [funcionarios, setFuncionarios] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState([]);
  const [dataInicio, setDataInicio] = useState('');
  const [semanaSelecionada, setSemanaSelecionada] = useState('');
  const [semanasMes, setSemanasMes] = useState([]);
  const [tarefasPorDia, setTarefasPorDia] = useState({
    domingo: [],
    segunda: [],
    terca: [],
    quarta: [],
    quinta: [],
    sexta: [],
    sabado: []
  });
  const [diaSelecionado, setDiaSelecionado] = useState('domingo');
  const [mostrarFormNovaTarefa, setMostrarFormNovaTarefa] = useState(false);
  const [mostrarSeletorModelos, setMostrarSeletorModelos] = useState(false);
  const [editandoTarefa, setEditandoTarefa] = useState(null);
  const [novaTarefa, setNovaTarefa] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'media',
    tipo: 'manutencao',
    horario: '08:00'
  });

  const { usuario } = useAuth();
  const { showToast } = useToast();
  const { funcionarios: funcionariosContext } = useFuncionarios(); // Para sincronizar fotos

  // Função para gerar semanas do mês (Domingo a Sábado)
  const gerarSemanasMes = () => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    const semanas = [];
    
    // Começar do primeiro dia do mês
    const primeiroDiaMes = new Date(anoAtual, mesAtual, 1);
    
    // Encontrar o primeiro domingo do mês (ou o próprio primeiro dia se for domingo)
    let primeiroDomingo = new Date(primeiroDiaMes);
    const diaSemana = primeiroDiaMes.getDay();
    
    // Se não for domingo, retroceder para o domingo anterior
    if (diaSemana !== 0) {
      primeiroDomingo.setDate(primeiroDiaMes.getDate() - diaSemana);
    }
    
    // Gerar todas as semanas do mês
    let numeroSemana = 1;
    let domingoAtual = new Date(primeiroDomingo);
    
    // Gerar até 6 semanas (para cobrir todos os cenários de mês)
    while (numeroSemana <= 6) {
      const sabadoAtual = new Date(domingoAtual);
      sabadoAtual.setDate(domingoAtual.getDate() + 6);
      
      // Verificar se esta semana pertence ao mês (pelo menos um dia no mês)
      const temDiaNoMes = 
        (domingoAtual.getMonth() === mesAtual) || 
        (sabadoAtual.getMonth() === mesAtual) ||
        (domingoAtual.getMonth() < mesAtual && sabadoAtual.getMonth() >= mesAtual);
      
      if (temDiaNoMes) {
        const dataInicioFormatada = domingoAtual.toISOString().split('T')[0];
        
        const labelInicio = domingoAtual.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const labelFim = sabadoAtual.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        
        // Verificar se é a semana atual
        const isAtual = hoje >= domingoAtual && hoje <= sabadoAtual;
        
        // Nome do mês para exibição
        const nomeMes = domingoAtual.toLocaleDateString('pt-BR', { month: 'long' });
        const nomeMesCapitalizado = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
        
        semanas.push({
          inicio: dataInicioFormatada,
          label: `Semana ${numeroSemana} de ${nomeMesCapitalizado} (${labelInicio} - ${labelFim})${isAtual ? ' (Semana Atual)' : ''}`,
          numeroSemana,
          isAtual
        });
        
        numeroSemana++;
      }
      
      // Avançar para o próximo domingo
      domingoAtual.setDate(domingoAtual.getDate() + 7);
      
      // Se já passou muito do próximo mês, parar
      if (domingoAtual.getMonth() > mesAtual + 1) {
        break;
      }
    }
    
    return semanas;
  };

  // Gerar semanas ao montar o componente
  useEffect(() => {
    const semanas = gerarSemanasMes();
    setSemanasMes(semanas);
    
    // Selecionar a semana atual por padrão
    const semanaAtual = semanas.find(s => s.isAtual);
    if (semanaAtual) {
      setSemanaSelecionada(semanaAtual.inicio);
      setDataInicio(semanaAtual.inicio);
    }
  }, []);

  // Atualizar dataInicio quando semanaSelecionada mudar
  useEffect(() => {
    if (semanaSelecionada) {
      setDataInicio(semanaSelecionada);
    }
  }, [semanaSelecionada]);

  const diasSemana = [
    { key: 'domingo', label: 'Domingo', emoji: '📅' },
    { key: 'segunda', label: 'Segunda-feira', emoji: '📅' },
    { key: 'terca', label: 'Terça-feira', emoji: '📅' },
    { key: 'quarta', label: 'Quarta-feira', emoji: '📅' },
    { key: 'quinta', label: 'Quinta-feira', emoji: '📅' },
    { key: 'sexta', label: 'Sexta-feira', emoji: '📅' },
    { key: 'sabado', label: 'Sábado', emoji: '📅' }
  ];

  const tiposTarefa = [
    { value: 'manutencao', label: '🔧 Manutenção' },
    { value: 'limpeza', label: '🧹 Limpeza' },
    { value: 'organizacao', label: '📦 Organização' },
    { value: 'seguranca', label: '🛡️ Segurança' },
    { value: 'inventario', label: '📋 Inventário' },
    { value: 'outro', label: '📌 Outro' }
  ];

  const prioridades = [
    { value: 'alta', label: '🔴 Alta', color: 'bg-red-100 text-red-800' },
    { value: 'media', label: '🟡 Média', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'baixa', label: '🟢 Baixa', color: 'bg-green-100 text-green-800' }
  ];

  // Carregar funcionários (apenas ativos, ordenados alfabeticamente)
  // SINCRONIZADO com página de Tarefas, Ranking e Meu Perfil
  useEffect(() => {
    const q = query(collection(db, 'funcionarios'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const funcionariosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filtrar apenas funcionários ativos (não demitidos) e ordenar alfabeticamente
      const funcionariosAtivos = funcionariosData
        .filter(func => !func.demitido)
        .sort((a, b) => {
          const nomeA = (a.nome || '').toLowerCase();
          const nomeB = (b.nome || '').toLowerCase();
          return nomeA.localeCompare(nomeB);
        });
      
      // Sincronizar photoURL com o contexto (mesma fonte que outras páginas)
      const funcionariosComFoto = funcionariosAtivos.map(func => {
        const funcionarioCompleto = funcionariosContext.find(f => 
          f.id === func.id || 
          f.email === func.email || 
          f.nome === func.nome
        );
        
        // Debug para comparar dados
        if (func.nome === 'Vinicius') {
          console.log('📅 CriarCronogramaSemanal - Vinicius:', {
            func_original: func,
            funcionarioCompleto: funcionarioCompleto,
            cargo_original: func.cargo,
            cargo_contexto: funcionarioCompleto?.cargo,
            cargo_final: funcionarioCompleto?.cargo || func.cargo
          });
        }
        
        return {
          ...func,
          photoURL: funcionarioCompleto?.photoURL || func.photoURL,
          cargo: funcionarioCompleto?.cargo || func.cargo
        };
      });
      
      setFuncionarios(funcionariosComFoto);
    });

    return () => unsubscribe();
  }, [funcionariosContext]);

  // Carregar modelos de tarefas
  useEffect(() => {
    const q = query(collection(db, 'modelosTarefas'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const modelosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setModelos(modelosData);
    });

    return () => unsubscribe();
  }, []);

  const toggleFuncionario = (id) => {
    setFuncionariosSelecionados(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const adicionarModeloAoDia = (modelo) => {
    const novaTarefaDoModelo = {
      id: Date.now() + Math.random(),
      modeloId: modelo.id,
      titulo: modelo.titulo,
      descricao: modelo.descricao || '',
      prioridade: modelo.prioridade,
      tipo: modelo.tipo,
      horario: '08:00',
      concluida: false
    };

    setTarefasPorDia(prev => ({
      ...prev,
      [diaSelecionado]: [...prev[diaSelecionado], novaTarefaDoModelo]
    }));

    setMostrarSeletorModelos(false);
    showToast('Tarefa adicionada!', 'success');
  };

  const adicionarNovaTarefa = () => {
    if (!novaTarefa.titulo.trim()) {
      showToast('Título é obrigatório', 'error');
      return;
    }

    if (editandoTarefa) {
      setTarefasPorDia(prev => ({
        ...prev,
        [diaSelecionado]: prev[diaSelecionado].map(t =>
          t.id === editandoTarefa.id ? { ...novaTarefa, id: t.id, concluida: false } : t
        )
      }));
      showToast('Tarefa atualizada!', 'success');
    } else {
      const tarefa = {
        id: Date.now() + Math.random(),
        ...novaTarefa,
        concluida: false
      };

      setTarefasPorDia(prev => ({
        ...prev,
        [diaSelecionado]: [...prev[diaSelecionado], tarefa]
      }));
      showToast('Tarefa criada!', 'success');
    }

    resetFormNovaTarefa();
  };

  const editarTarefa = (tarefa) => {
    setNovaTarefa({
      titulo: tarefa.titulo,
      descricao: tarefa.descricao || '',
      prioridade: tarefa.prioridade,
      tipo: tarefa.tipo,
      horario: tarefa.horario
    });
    setEditandoTarefa(tarefa);
    setMostrarFormNovaTarefa(true);
  };

  const removerTarefa = (tarefaId) => {
    setTarefasPorDia(prev => ({
      ...prev,
      [diaSelecionado]: prev[diaSelecionado].filter(t => t.id !== tarefaId)
    }));
    showToast('Tarefa removida!', 'success');
  };

  const copiarTarefasParaOutroDia = (diaOrigem, diaDestino) => {
    setTarefasPorDia(prev => ({
      ...prev,
      [diaDestino]: [
        ...prev[diaDestino],
        ...prev[diaOrigem].map(t => ({
          ...t,
          id: Date.now() + Math.random()
        }))
      ]
    }));
    showToast(`Tarefas copiadas para ${diasSemana.find(d => d.key === diaDestino)?.label}!`, 'success');
  };

  const resetFormNovaTarefa = () => {
    setNovaTarefa({
      titulo: '',
      descricao: '',
      prioridade: 'media',
      tipo: 'manutencao',
      horario: '08:00'
    });
    setEditandoTarefa(null);
    setMostrarFormNovaTarefa(false);
  };

  const handleCriarCronograma = async () => {
    if (funcionariosSelecionados.length === 0) {
      showToast('Selecione pelo menos um funcionário', 'error');
      return;
    }

    if (!dataInicio) {
      showToast('Selecione a data de início', 'error');
      return;
    }

    const totalTarefas = Object.values(tarefasPorDia).reduce((acc, tarefas) => acc + tarefas.length, 0);
    if (totalTarefas === 0) {
      showToast('Adicione pelo menos uma tarefa', 'error');
      return;
    }

    try {
      const cronogramaData = {
        funcionariosIds: funcionariosSelecionados,
        criadoPor: usuario.id,
        dataInicio,
        tarefasPorDia,
        status: 'ativo',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'cronogramasSemanais'), cronogramaData);

      // Enviar notificações para cada funcionário
      for (const funcionarioId of funcionariosSelecionados) {
        await notificarCronogramaSemanal(
          funcionarioId,
          totalTarefas,
          dataInicio,
          { id: docRef.id, ...cronogramaData }
        );
      }

      showToast('Cronograma criado com sucesso!', 'success');
      if (onCronogramaCriado) onCronogramaCriado();
      onClose();
    } catch (error) {
      console.error('Erro ao criar cronograma:', error);
      showToast('Erro ao criar cronograma', 'error');
    }
  };

  const getPrioridadeInfo = (prioridade) =>
    prioridades.find(p => p.value === prioridade) || prioridades[1];

  const getTipoLabel = (tipo) =>
    tiposTarefa.find(t => t.value === tipo)?.label || '📌 Outro';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1D9BF0] via-[#1A8CD8] to-[#1779BE] text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="w-7 h-7" />
                Criar Cronograma Semanal
              </h2>
              <p className="text-blue-100 mt-2">
                {etapa === 1 && '1️⃣ Selecione os funcionários'}
                {etapa === 2 && '2️⃣ Organize as tarefas da semana'}
                {etapa === 3 && '3️⃣ Revise e finalize'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map(step => (
              <div
                key={step}
                className={`h-2 flex-1 rounded-full transition-all ${
                  etapa >= step ? 'bg-white' : 'bg-white bg-opacity-30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900">
          {/* ETAPA 1: Selecionar Funcionários */}
          {etapa === 1 && (
            <div className="space-y-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selecione a Semana do Cronograma *
                </label>
                <select
                  value={semanaSelecionada}
                  onChange={(e) => setSemanaSelecionada(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-[#1D9BF0] focus:border-[#1D9BF0] transition-all font-medium [&>option]:bg-white [&>option]:dark:bg-gray-700 [&>option]:text-gray-900 [&>option]:dark:text-gray-100"
                  required
                >
                  <option value="">Selecione uma semana...</option>
                  {semanasMes.map((semana, index) => (
                    <option 
                      key={index} 
                      value={semana.inicio}
                      className={semana.isAtual ? 'bg-blue-50 dark:bg-blue-900/30 font-semibold' : ''}
                      style={semana.isAtual ? { backgroundColor: 'rgba(29, 155, 240, 0.1)' } : {}}
                    >
                      {semana.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  O cronograma começará no domingo da semana selecionada e terminará no sábado
                </p>
              </div>

              <div className="bg-gradient-to-r from-[#1D9BF0]/10 to-[#1A8CD8]/10 dark:from-[#1D9BF0]/20 dark:to-[#1A8CD8]/20 border-2 border-[#1D9BF0]/30 dark:border-[#1D9BF0]/40 rounded-xl p-4 mb-4">
                <p className="text-[#1D9BF0] dark:text-[#1D9BF0] font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {funcionariosSelecionados.length} funcionário(s) selecionado(s)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {funcionarios.map(funcionario => (
                  <div
                    key={funcionario.id}
                    onClick={() => toggleFuncionario(funcionario.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      funcionariosSelecionados.includes(funcionario.id)
                        ? 'border-[#1D9BF0] bg-gradient-to-br from-[#1D9BF0]/10 to-[#1A8CD8]/10 dark:from-[#1D9BF0]/20 dark:to-[#1A8CD8]/20 ring-2 ring-[#1D9BF0]/30 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#1D9BF0]/50 dark:hover:border-[#1D9BF0]/50 hover:shadow'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                          funcionariosSelecionados.includes(funcionario.id)
                            ? 'bg-gradient-to-br from-[#1D9BF0] to-[#1A8CD8]'
                            : 'bg-gray-400 dark:bg-gray-600'
                        }`}
                      >
                        {funcionario.photoURL ? (
                          <img
                            src={funcionario.photoURL}
                            alt={funcionario.nome}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          funcionario.nome?.charAt(0).toUpperCase() || '?'
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 dark:text-gray-100">
                          {funcionario.nome || funcionario.username}
                        </p>
                        {funcionario.cargo && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{funcionario.cargo}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ETAPA 2: Organizar Tarefas por Dia */}
          {etapa === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dias da semana */}
              <div className="lg:col-span-1">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Dias da Semana</h3>
                <div className="space-y-2">
                  {diasSemana.map(dia => (
                    <button
                      key={dia.key}
                      onClick={() => setDiaSelecionado(dia.key)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        diaSelecionado === dia.key
                          ? 'bg-gradient-to-r from-[#1D9BF0] to-[#1A8CD8] text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {dia.emoji} {dia.label}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            diaSelecionado === dia.key
                              ? 'bg-white text-[#1D9BF0]'
                              : 'bg-[#1D9BF0]/20 dark:bg-[#1D9BF0]/30 text-[#1D9BF0]'
                          }`}
                        >
                          {tarefasPorDia[dia.key].length}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tarefas do dia selecionado */}
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800 text-lg">
                    {diasSemana.find(d => d.key === diaSelecionado)?.label}
                  </h3>
                  <div className="flex gap-2">
                    {tarefasPorDia[diaSelecionado].length > 0 && (
                      <div className="relative group">
                        <button className="px-3 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors">
                          <Copy className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-2 bg-white shadow-lg rounded-lg p-2 hidden group-hover:block z-10 min-w-[200px]">
                          {diasSemana
                            .filter(d => d.key !== diaSelecionado)
                            .map(dia => (
                              <button
                                key={dia.key}
                                onClick={() => copiarTarefasParaOutroDia(diaSelecionado, dia.key)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                              >
                                Copiar para {dia.label}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => setMostrarSeletorModelos(!mostrarSeletorModelos)}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center gap-2 shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      Modelo
                    </button>
                    <button
                      onClick={() => setMostrarFormNovaTarefa(!mostrarFormNovaTarefa)}
                      className="px-4 py-2 bg-gradient-to-r from-[#1D9BF0] to-[#1A8CD8] text-white rounded-lg hover:from-[#1A8CD8] hover:to-[#1779BE] transition-all flex items-center gap-2 shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      Nova
                    </button>
                  </div>
                </div>

                {/* Seletor de Modelos */}
                {mostrarSeletorModelos && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-4 mb-4 shadow-md">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">✨ Selecionar Modelo</h4>
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                      {modelos.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          Nenhum modelo disponível
                        </p>
                      ) : (
                        modelos.map(modelo => (
                          <div
                            key={modelo.id}
                            onClick={() => adicionarModeloAoDia(modelo)}
                            className="p-3 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-500 hover:shadow-md cursor-pointer transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-800 dark:text-gray-100">{modelo.titulo}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {getTipoLabel(modelo.tipo)} • {getPrioridadeInfo(modelo.prioridade).label}
                                </p>
                              </div>
                              <Plus className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Form Nova Tarefa */}
                {mostrarFormNovaTarefa && (
                  <div className="bg-gradient-to-br from-[#1D9BF0]/10 to-[#1A8CD8]/10 dark:from-[#1D9BF0]/20 dark:to-[#1A8CD8]/20 border-2 border-[#1D9BF0]/30 dark:border-[#1D9BF0]/40 rounded-xl p-4 mb-4 shadow-md">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
                      {editandoTarefa ? '✏️ Editar Tarefa' : '➕ Nova Tarefa'}
                    </h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Título da tarefa"
                        value={novaTarefa.titulo}
                        onChange={(e) => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-[#1D9BF0]"
                      />
                      <textarea
                        placeholder="Descrição (opcional)"
                        value={novaTarefa.descricao}
                        onChange={(e) => setNovaTarefa({ ...novaTarefa, descricao: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-[#1D9BF0]"
                        rows="2"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={novaTarefa.tipo}
                          onChange={(e) => setNovaTarefa({ ...novaTarefa, tipo: e.target.value })}
                          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-[#1D9BF0]"
                        >
                          {tiposTarefa.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={novaTarefa.prioridade}
                          onChange={(e) => setNovaTarefa({ ...novaTarefa, prioridade: e.target.value })}
                          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-[#1D9BF0]"
                        >
                          {prioridades.map(p => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="time"
                          value={novaTarefa.horario}
                          onChange={(e) => setNovaTarefa({ ...novaTarefa, horario: e.target.value })}
                          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-[#1D9BF0]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={adicionarNovaTarefa}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-[#1D9BF0] to-[#1A8CD8] text-white rounded-lg hover:from-[#1A8CD8] hover:to-[#1779BE] transition-all"
                        >
                          {editandoTarefa ? 'Atualizar' : 'Adicionar'}
                        </button>
                        <button
                          onClick={resetFormNovaTarefa}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de Tarefas */}
                <div className="space-y-2">
                  {tarefasPorDia[diaSelecionado].length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <p className="text-gray-500 dark:text-gray-400">Nenhuma tarefa adicionada</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                        Use um modelo ou crie uma nova tarefa
                      </p>
                    </div>
                  ) : (
                    tarefasPorDia[diaSelecionado].map((tarefa, index) => {
                      const prioridadeInfo = getPrioridadeInfo(tarefa.prioridade);
                      return (
                        <div
                          key={tarefa.id}
                          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">{tarefa.horario}</span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${prioridadeInfo.color}`}>
                                  {prioridadeInfo.label}
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">{getTipoLabel(tarefa.tipo)}</span>
                              </div>
                              <h4 className="font-semibold text-gray-800 dark:text-gray-100">{tarefa.titulo}</h4>
                              {tarefa.descricao && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{tarefa.descricao}</p>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => editarTarefa(tarefa)}
                                className="p-2 text-[#1D9BF0] hover:bg-[#1D9BF0]/10 dark:hover:bg-[#1D9BF0]/20 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removerTarefa(tarefa.id)}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 3: Revisão */}
          {etapa === 3 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Resumo do Cronograma</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-gray-600 text-sm">Funcionários</p>
                    <p className="text-2xl font-bold text-blue-600">{funcionariosSelecionados.length}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-gray-600 text-sm">Total de Tarefas</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {Object.values(tarefasPorDia).reduce((acc, tarefas) => acc + tarefas.length, 0)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-gray-600 text-sm">Período da Semana</p>
                    <p className="text-lg font-bold text-green-600">
                      {(() => {
                        const inicio = new Date(dataInicio + 'T00:00:00');
                        const fim = new Date(inicio);
                        fim.setDate(inicio.getDate() + 6);
                        return `${inicio.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${fim.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
                      })()}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100">Funcionários Selecionados:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {funcionariosSelecionados.map(id => {
                      const func = funcionarios.find(f => f.id === id);
                      return (
                        <div key={id} className="bg-white dark:bg-gray-800 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br from-[#1D9BF0] to-[#1A8CD8]">
                              {func?.photoURL ? (
                                <img
                                  src={func.photoURL}
                                  alt={func.nome}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                func?.nome?.charAt(0).toUpperCase() || '?'
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                                {func?.nome || func?.username || 'Funcionário'}
                              </p>
                              {func?.cargo && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{func.cargo}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 text-lg">Tarefas por Dia:</h4>
                {diasSemana.map(dia => (
                  <div key={dia.key} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold text-gray-800">
                        {dia.emoji} {dia.label}
                      </h5>
                      <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                        {tarefasPorDia[dia.key].length} tarefas
                      </span>
                    </div>
                    {tarefasPorDia[dia.key].length > 0 ? (
                      <div className="space-y-2">
                        {tarefasPorDia[dia.key].map((tarefa, index) => (
                          <div key={tarefa.id} className="flex items-center gap-3 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{tarefa.horario}</span>
                            <span>•</span>
                            <span>{tarefa.titulo}</span>
                            <span className={`ml-auto px-2 py-1 rounded text-xs ${getPrioridadeInfo(tarefa.prioridade).color}`}>
                              {getPrioridadeInfo(tarefa.prioridade).label}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">Nenhuma tarefa programada</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer com botões de navegação */}
        <div className="bg-gray-50 dark:bg-gray-800 p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between">
            <button
              onClick={() => etapa > 1 ? setEtapa(etapa - 1) : onClose()}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {etapa === 1 ? 'Cancelar' : 'Voltar'}
            </button>
            {etapa < 3 ? (
              <button
                onClick={() => {
                  if (etapa === 1 && funcionariosSelecionados.length === 0) {
                    showToast('Selecione pelo menos um funcionário', 'error');
                    return;
                  }
                  if (etapa === 1 && !semanaSelecionada) {
                    showToast('Selecione a semana do cronograma', 'error');
                    return;
                  }
                  setEtapa(etapa + 1);
                }}
                className="px-6 py-3 bg-gradient-to-r from-[#1D9BF0] to-[#1A8CD8] text-white rounded-lg hover:from-[#1A8CD8] hover:to-[#1779BE] transition-all shadow-md"
              >
                Próximo
              </button>
            ) : (
              <button
                onClick={handleCriarCronograma}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg font-semibold"
              >
                ✅ Criar Cronograma
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriarCronogramaSemanal;
