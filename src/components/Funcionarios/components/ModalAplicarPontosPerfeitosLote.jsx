import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { obterHorariosEsperados } from '../../../utils/escalaUtils';

const ModalAplicarPontosPerfeitosLote = ({ isOpen, onClose, funcionarios }) => {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState([]);
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 });
  const [resultado, setResultado] = useState(null);
  const [logs, setLogs] = useState([]);

  const adicionarLog = (mensagem, tipo = 'info') => {
    setLogs(prev => [...prev, { mensagem, tipo, timestamp: new Date() }]);
  };

  const calcularHorasDia = (horarios) => {
    if (!horarios) return 0;

    const [hE, mE] = horarios.entrada.split(':').map(Number);
    const [hSA, mSA] = horarios.almoco.split(':').map(Number);
    const [hRA, mRA] = horarios.retorno.split(':').map(Number);
    const [hS, mS] = horarios.saida.split(':').map(Number);

    const manha = (hSA * 60 + mSA) - (hE * 60 + mE);
    const tarde = (hS * 60 + mS) - (hRA * 60 + mRA);

    return manha + tarde;
  };

  const criarTimestamp = (data, horario) => {
    const [horas, minutos] = horario.split(':').map(Number);
    const novaData = new Date(data);
    novaData.setHours(horas, minutos, 0, 0);
    return Timestamp.fromDate(novaData);
  };

  const aplicarPontos = async () => {
    if (!dataInicio || !dataFim) {
      adicionarLog('❌ Selecione as datas de início e fim', 'error');
      return;
    }

    if (funcionariosSelecionados.length === 0) {
      adicionarLog('❌ Selecione pelo menos um funcionário', 'error');
      return;
    }

    setProcessando(true);
    setLogs([]);
    adicionarLog('🚀 Iniciando aplicação de pontos perfeitos...', 'info');

    try {
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      
      if (fim < inicio) {
        adicionarLog('❌ Data fim não pode ser anterior à data início', 'error');
        setProcessando(false);
        return;
      }

      const funcionariosParaProcessar = funcionarios.filter(f => 
        funcionariosSelecionados.includes(f.id)
      );

      let totalPontosInseridos = 0;
      let totalHorasAdicionadas = 0;
      let totalDiasProcessados = 0;

      setProgresso({ atual: 0, total: funcionariosParaProcessar.length });

      for (let i = 0; i < funcionariosParaProcessar.length; i++) {
        const func = funcionariosParaProcessar[i];
        const escalaKey = func.escala || func.tipoEscala || 'M';

        adicionarLog(`👤 Processando: ${func.nome} (Escala: ${escalaKey})`, 'info');

        let horasFuncionario = 0;
        let diasTrabalhados = 0;

        // Iterar por cada dia entre início e fim
        for (let data = new Date(inicio); data <= fim; data.setDate(data.getDate() + 1)) {
          const diaSemana = data.getDay();
          const dataKey = data.toISOString().split('T')[0];

          const horarios = obterHorariosEsperados(escalaKey, data);

          if (!horarios) {
            adicionarLog(`   ⏭️  ${dataKey} - Folga/Sem horário`, 'info');
            continue;
          }

          // Verificar se já existe ponto (query simples sem índice composto)
          const pontosExistentesQuery = query(
            collection(db, 'pontos'),
            where('funcionarioId', '==', String(func.id))
          );

          const pontosSnapshot = await getDocs(pontosExistentesQuery);
          
          // Filtrar localmente por data
          const dataInicioDia = new Date(data.getFullYear(), data.getMonth(), data.getDate(), 0, 0, 0);
          const dataFimDia = new Date(data.getFullYear(), data.getMonth(), data.getDate(), 23, 59, 59);
          
          const pontosNoDia = pontosSnapshot.docs.filter(doc => {
            const pontoData = doc.data().data?.toDate ? doc.data().data.toDate() : new Date(doc.data().data);
            return pontoData >= dataInicioDia && pontoData <= dataFimDia;
          });
          
          if (pontosNoDia.length > 0) {
            adicionarLog(`   ⏭️  ${dataKey} - Já possui pontos`, 'warning');
            continue;
          }

          // Criar os 4 pontos do dia
          const pontos = [
            { tipo: 'entrada', horario: horarios.entrada },
            { tipo: 'saida_almoco', horario: horarios.almoco },
            { tipo: 'retorno_almoco', horario: horarios.retorno },
            { tipo: 'saida', horario: horarios.saida }
          ];

          for (const ponto of pontos) {
            const timestamp = criarTimestamp(new Date(data), ponto.horario);
            
            await addDoc(collection(db, 'pontos'), {
              funcionarioId: String(func.id),
              funcionarioNome: func.nome,
              tipo: ponto.tipo,
              timestamp: timestamp,
              data: timestamp,
              localizacao: {
                latitude: -22.9068,
                longitude: -43.1729,
                precisao: 10
              },
              origem: 'pontos_perfeitos_lote',
              observacao: `Ponto perfeito inserido automaticamente (${dataInicio} a ${dataFim})`
            });

            totalPontosInseridos++;
          }

          // Calcular horas do dia
          const minutosDia = calcularHorasDia(horarios);
          horasFuncionario += minutosDia;
          diasTrabalhados++;
          totalDiasProcessados++;

          const h = Math.floor(minutosDia / 60);
          const m = minutosDia % 60;
          adicionarLog(`   ✅ ${dataKey} - 4 pontos inseridos (${h}h ${m}m)`, 'success');
        }

        // Atualizar banco de horas
        if (horasFuncionario > 0) {
          const funcDocRef = doc(db, 'funcionarios', func.id);
          const bancoHorasAtual = func.bancoHoras || 0;
          const novoBancoHoras = bancoHorasAtual + horasFuncionario;

          await updateDoc(funcDocRef, {
            bancoHoras: novoBancoHoras,
            ultimaAtualizacaoBancoHoras: Timestamp.now()
          });

          totalHorasAdicionadas += horasFuncionario;

          const horasTotal = Math.floor(horasFuncionario / 60);
          const minutosTotal = horasFuncionario % 60;

          adicionarLog(`   💰 Banco de Horas: +${horasTotal}h ${minutosTotal}m`, 'success');
        }

        setProgresso({ atual: i + 1, total: funcionariosParaProcessar.length });
      }

      setResultado({
        sucesso: true,
        funcionarios: funcionariosParaProcessar.length,
        pontos: totalPontosInseridos,
        dias: totalDiasProcessados,
        horas: totalHorasAdicionadas
      });

      adicionarLog('🎉 Processo concluído com sucesso!', 'success');

    } catch (error) {
      console.error('Erro ao aplicar pontos:', error);
      adicionarLog(`❌ Erro: ${error.message}`, 'error');
      setResultado({ sucesso: false, erro: error.message });
    } finally {
      setProcessando(false);
    }
  };

  const toggleFuncionario = (id) => {
    setFuncionariosSelecionados(prev => 
      prev.includes(id) 
        ? prev.filter(fId => fId !== id)
        : [...prev, id]
    );
  };

  const selecionarTodos = () => {
    if (funcionariosSelecionados.length === funcionarios.length) {
      setFuncionariosSelecionados([]);
    } else {
      setFuncionariosSelecionados(funcionarios.map(f => f.id));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Aplicar Pontos Perfeitos em Lote</h2>
                  <p className="text-blue-100 text-sm">Insira pontos exatos para múltiplos funcionários</p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={processando}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Seleção de Datas */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Período
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Data Início</label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    disabled={processando}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Data Fim</label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    disabled={processando}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Seleção de Funcionários */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Funcionários ({funcionariosSelecionados.length} selecionados)
                </label>
                <button
                  onClick={selecionarTodos}
                  disabled={processando}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium disabled:opacity-50"
                >
                  {funcionariosSelecionados.length === funcionarios.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </button>
              </div>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-60 overflow-y-auto">
                {funcionarios.filter(f => !f.demitido).map(func => (
                  <label
                    key={func.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-0"
                  >
                    <input
                      type="checkbox"
                      checked={funcionariosSelecionados.includes(func.id)}
                      onChange={() => toggleFuncionario(func.id)}
                      disabled={processando}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{func.nome}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Escala: {func.escala || func.tipoEscala || 'M'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Progresso */}
            {processando && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Processando...</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {progresso.atual} / {progresso.total}
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

            {/* Logs */}
            {logs.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Log de Execução
                </label>
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 max-h-60 overflow-y-auto font-mono text-xs">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className={`mb-1 ${
                        log.tipo === 'error' ? 'text-red-400' :
                        log.tipo === 'success' ? 'text-green-400' :
                        log.tipo === 'warning' ? 'text-yellow-400' :
                        'text-gray-300'
                      }`}
                    >
                      {log.mensagem}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resultado */}
            {resultado && (
              <div className={`p-4 rounded-lg ${
                resultado.sucesso 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-start gap-3">
                  {resultado.sucesso ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-2 ${
                      resultado.sucesso ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
                    }`}>
                      {resultado.sucesso ? '✅ Processo Concluído!' : '❌ Erro no Processo'}
                    </h3>
                    {resultado.sucesso ? (
                      <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                        <p>• {resultado.funcionarios} funcionários processados</p>
                        <p>• {resultado.pontos} pontos inseridos</p>
                        <p>• {resultado.dias} dias trabalhados</p>
                        <p>• {Math.floor(resultado.horas / 60)}h {resultado.horas % 60}m adicionadas ao banco</p>
                      </div>
                    ) : (
                      <p className="text-sm text-red-800 dark:text-red-200">{resultado.erro}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 p-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={processando}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {resultado ? 'Fechar' : 'Cancelar'}
            </button>
            {!resultado && (
              <button
                onClick={aplicarPontos}
                disabled={processando || !dataInicio || !dataFim || funcionariosSelecionados.length === 0}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {processando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    Aplicar Pontos
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ModalAplicarPontosPerfeitosLote;
