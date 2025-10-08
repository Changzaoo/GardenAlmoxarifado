import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Save, AlertCircle, CheckCircle2, Loader2, Edit3 } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { obterHorariosEsperados } from '../../../utils/escalaUtils';
import { useToast } from '../../ToastProvider';

const ModalCorrigirPontosMes = ({ isOpen, onClose, funcionario, mes, ano }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [diasDoMes, setDiasDoMes] = useState([]);
  const [pontosDoMes, setPontosDoMes] = useState({});
  const [horasPorDia, setHorasPorDia] = useState({});
  const [diasSelecionados, setDiasSelecionados] = useState([]);
  const [totalHorasAdicionar, setTotalHorasAdicionar] = useState(0);

  // Obter número de dias no mês
  const obterDiasDoMes = (mes, ano) => {
    const totalDias = new Date(ano, mes + 1, 0).getDate();
    const dias = [];
    
    for (let dia = 1; dia <= totalDias; dia++) {
      const data = new Date(ano, mes, dia);
      const diaSemana = data.getDay(); // 0 = Domingo, 6 = Sábado
      
      dias.push({
        dia,
        data,
        diaSemana,
        diaSemanaTexto: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][diaSemana],
        dataFormatada: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        dataISO: data.toISOString().split('T')[0]
      });
    }
    
    return dias;
  };

  // Carregar pontos do mês quando abrir o modal
  useEffect(() => {
    if (!isOpen || !funcionario?.id) return;

    const carregarPontos = async () => {
      setLoading(true);
      try {
        // Obter todos os dias do mês
        const dias = obterDiasDoMes(mes, ano);
        setDiasDoMes(dias);

        // Buscar pontos do funcionário no mês
        const q = query(
          collection(db, 'pontos'),
          where('funcionarioId', '==', String(funcionario.id))
        );

        const snapshot = await getDocs(q);
        
        // Organizar pontos por data
        const pontosPorData = {};
        const horasPorData = {};

        snapshot.docs.forEach(docSnap => {
          const ponto = docSnap.data();
          const dataPonto = new Date(ponto.timestamp?.toDate ? ponto.timestamp.toDate() : ponto.timestamp);
          const dataISO = dataPonto.toISOString().split('T')[0];

          // Filtrar apenas pontos do mês atual
          if (dataPonto.getMonth() === mes && dataPonto.getFullYear() === ano) {
            if (!pontosPorData[dataISO]) {
              pontosPorData[dataISO] = {
                entrada: '',
                saidaAlmoco: '',
                voltaAlmoco: '',
                saida: ''
              };
            }

            const hora = dataPonto.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            });

            switch(ponto.tipo) {
              case 'entrada':
                pontosPorData[dataISO].entrada = hora;
                break;
              case 'saida_almoco':
                pontosPorData[dataISO].saidaAlmoco = hora;
                break;
              case 'retorno_almoco':
                pontosPorData[dataISO].voltaAlmoco = hora;
                break;
              case 'saida':
                pontosPorData[dataISO].saida = hora;
                break;
            }
          }
        });

        // Calcular horas trabalhadas por dia
        Object.keys(pontosPorData).forEach(dataISO => {
          const pontos = pontosPorData[dataISO];
          const minutos = calcularMinutosDia(pontos);
          horasPorData[dataISO] = minutos;
        });

        setPontosDoMes(pontosPorData);
        setHorasPorDia(horasPorData);
      } catch (error) {
        console.error('Erro ao carregar pontos:', error);
        showToast('Erro ao carregar pontos do mês', 'error');
      } finally {
        setLoading(false);
      }
    };

    carregarPontos();
  }, [isOpen, funcionario, mes, ano]);

  // Calcular minutos trabalhados no dia
  const calcularMinutosDia = (pontos) => {
    if (!pontos.entrada || !pontos.saida) return 0;

    const [hE, mE] = pontos.entrada.split(':').map(Number);
    const [hS, mS] = pontos.saida.split(':').map(Number);

    let minutosTotal = (hS * 60 + mS) - (hE * 60 + mE);

    // Descontar almoço se houver
    if (pontos.saidaAlmoco && pontos.voltaAlmoco) {
      const [hSA, mSA] = pontos.saidaAlmoco.split(':').map(Number);
      const [hVA, mVA] = pontos.voltaAlmoco.split(':').map(Number);
      const minutosAlmoco = (hVA * 60 + mVA) - (hSA * 60 + mSA);
      minutosTotal -= minutosAlmoco;
    }

    return minutosTotal;
  };

  // Atualizar pontos de um dia específico
  const atualizarPontosDia = (dataISO, campo, valor) => {
    setPontosDoMes(prev => ({
      ...prev,
      [dataISO]: {
        ...(prev[dataISO] || { entrada: '', saidaAlmoco: '', voltaAlmoco: '', saida: '' }),
        [campo]: valor
      }
    }));

    // Recalcular horas do dia
    const pontosAtualizados = {
      ...(pontosDoMes[dataISO] || { entrada: '', saidaAlmoco: '', voltaAlmoco: '', saida: '' }),
      [campo]: valor
    };

    const minutos = calcularMinutosDia(pontosAtualizados);
    setHorasPorDia(prev => ({
      ...prev,
      [dataISO]: minutos
    }));
  };

  // Selecionar/Desselecionar dia
  const toggleDia = (dataISO) => {
    setDiasSelecionados(prev => 
      prev.includes(dataISO) 
        ? prev.filter(d => d !== dataISO)
        : [...prev, dataISO]
    );
  };

  // Calcular total de horas a adicionar
  useEffect(() => {
    const total = diasSelecionados.reduce((acc, dataISO) => {
      return acc + (horasPorDia[dataISO] || 0);
    }, 0);
    setTotalHorasAdicionar(total);
  }, [diasSelecionados, horasPorDia]);

  // Aplicar horários da escala padrão em um dia
  const aplicarHorarioPadrao = (dataISO) => {
    const dia = diasDoMes.find(d => d.dataISO === dataISO);
    if (!dia) return;

    const tipoEscala = funcionario.escala || funcionario.tipoEscala || 'M';
    const horarios = obterHorariosEsperados(tipoEscala, dia.data);

    if (!horarios) {
      showToast('Funcionário não trabalha neste dia', 'warning');
      return;
    }

    setPontosDoMes(prev => ({
      ...prev,
      [dataISO]: {
        entrada: horarios.entrada,
        saidaAlmoco: horarios.almoco,
        voltaAlmoco: horarios.retorno,
        saida: horarios.saida
      }
    }));

    const minutos = calcularMinutosDia({
      entrada: horarios.entrada,
      saidaAlmoco: horarios.almoco,
      voltaAlmoco: horarios.retorno,
      saida: horarios.saida
    });

    setHorasPorDia(prev => ({
      ...prev,
      [dataISO]: minutos
    }));

    showToast('Horário padrão aplicado!', 'success');
  };

  // Salvar pontos selecionados
  const salvarPontos = async () => {
    if (diasSelecionados.length === 0) {
      showToast('Selecione pelo menos um dia para salvar', 'warning');
      return;
    }

    setSalvando(true);
    try {
      let pontosInseridos = 0;
      let totalMinutosAdicionados = 0;

      for (const dataISO of diasSelecionados) {
        const pontos = pontosDoMes[dataISO];
        if (!pontos || !pontos.entrada || !pontos.saida) {
          continue;
        }

        const [ano, mes, dia] = dataISO.split('-').map(Number);
        const data = new Date(ano, mes - 1, dia);

        // Criar timestamp para cada ponto
        const criarTimestamp = (horario) => {
          const [h, m] = horario.split(':').map(Number);
          const dataCompleta = new Date(ano, mes - 1, dia, h, m, 0);
          return Timestamp.fromDate(dataCompleta);
        };

        // Inserir os 4 pontos
        const tiposPontos = [
          { tipo: 'entrada', horario: pontos.entrada },
          { tipo: 'saida_almoco', horario: pontos.saidaAlmoco },
          { tipo: 'retorno_almoco', horario: pontos.voltaAlmoco },
          { tipo: 'saida', horario: pontos.saida }
        ];

        for (const ponto of tiposPontos) {
          if (!ponto.horario) continue;

          await addDoc(collection(db, 'pontos'), {
            funcionarioId: String(funcionario.id),
            funcionarioNome: funcionario.nome,
            tipo: ponto.tipo,
            timestamp: criarTimestamp(ponto.horario),
            data: criarTimestamp(ponto.horario),
            localizacao: {
              latitude: -22.9068,
              longitude: -43.1729,
              precisao: 10
            },
            origem: 'correcao_mes',
            observacao: `Ponto corrigido via sistema de correção mensal`
          });

          pontosInseridos++;
        }

        // Adicionar minutos ao total
        totalMinutosAdicionados += horasPorDia[dataISO] || 0;
      }

      // Atualizar banco de horas do funcionário
      const funcionarioRef = doc(db, 'funcionarios', String(funcionario.id));
      await updateDoc(funcionarioRef, {
        bancoHoras: (funcionario.bancoHoras || 0) + totalMinutosAdicionados
      });

      const h = Math.floor(totalMinutosAdicionados / 60);
      const m = totalMinutosAdicionados % 60;

      showToast(`✅ ${pontosInseridos} pontos salvos! ${h}h ${m}m adicionados ao banco de horas.`, 'success');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar pontos:', error);
      showToast('Erro ao salvar pontos. Tente novamente.', 'error');
    } finally {
      setSalvando(false);
    }
  };

  if (!isOpen) return null;

  const totalHoras = Math.floor(totalHorasAdicionar / 60);
  const totalMinutos = totalHorasAdicionar % 60;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Corrigir Pontos do Mês</h2>
                  <p className="text-blue-100 text-sm">
                    {funcionario.nome} - {new Date(ano, mes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={salvando}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Carregando pontos do mês...</p>
              </div>
            ) : (
              <>
                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-semibold mb-1">Como funciona:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Preencha os horários dos dias que deseja adicionar ao banco de horas</li>
                        <li>Clique em "⚡ Padrão" para aplicar os horários normais da escala</li>
                        <li>Marque os dias desejados e clique em "Salvar Pontos Selecionados"</li>
                        <li>As horas serão adicionadas automaticamente ao banco de horas</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Lista de Dias */}
                <div className="space-y-3">
                  {diasDoMes.map(dia => {
                    const dataISO = dia.dataISO;
                    const pontos = pontosDoMes[dataISO] || { entrada: '', saidaAlmoco: '', voltaAlmoco: '', saida: '' };
                    const minutos = horasPorDia[dataISO] || 0;
                    const horas = Math.floor(minutos / 60);
                    const mins = minutos % 60;
                    const selecionado = diasSelecionados.includes(dataISO);
                    const temPontos = pontos.entrada || pontos.saida;

                    return (
                      <div
                        key={dataISO}
                        className={`border rounded-xl p-4 transition-all ${
                          selecionado
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Checkbox e Data */}
                          <div className="flex items-center gap-3 min-w-[140px]">
                            <input
                              type="checkbox"
                              checked={selecionado}
                              onChange={() => toggleDia(dataISO)}
                              disabled={!temPontos || salvando}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            />
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white">
                                {dia.dia.toString().padStart(2, '0')} {dia.diaSemanaTexto}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {dia.dataFormatada}
                              </div>
                            </div>
                          </div>

                          {/* Campos de Horário */}
                          <div className="flex-1 grid grid-cols-4 gap-2">
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Entrada</label>
                              <input
                                type="time"
                                value={pontos.entrada}
                                onChange={(e) => atualizarPontosDia(dataISO, 'entrada', e.target.value)}
                                disabled={salvando}
                                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Saída Almoço</label>
                              <input
                                type="time"
                                value={pontos.saidaAlmoco}
                                onChange={(e) => atualizarPontosDia(dataISO, 'saidaAlmoco', e.target.value)}
                                disabled={salvando}
                                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Volta Almoço</label>
                              <input
                                type="time"
                                value={pontos.voltaAlmoco}
                                onChange={(e) => atualizarPontosDia(dataISO, 'voltaAlmoco', e.target.value)}
                                disabled={salvando}
                                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Saída</label>
                              <input
                                type="time"
                                value={pontos.saida}
                                onChange={(e) => atualizarPontosDia(dataISO, 'saida', e.target.value)}
                                disabled={salvando}
                                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                              />
                            </div>
                          </div>

                          {/* Ações e Total */}
                          <div className="flex items-center gap-2 min-w-[180px] justify-end">
                            <button
                              onClick={() => aplicarHorarioPadrao(dataISO)}
                              disabled={salvando}
                              className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all disabled:opacity-50 flex items-center gap-1"
                              title="Aplicar horário padrão da escala"
                            >
                              ⚡ Padrão
                            </button>
                            <div className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${
                              minutos > 0 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                            }`}>
                              {horas}h {mins}m
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">{diasSelecionados.length}</span> dias selecionados
                </div>
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  Total: {totalHoras}h {totalMinutos}m
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  disabled={salvando}
                  className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarPontos}
                  disabled={diasSelecionados.length === 0 || salvando}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {salvando ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Salvar Pontos Selecionados
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ModalCorrigirPontosMes;
