import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Clock,
  Edit3,
  RefreshCw,
  Calendar,
  CheckCircle,
  Save
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ToastProvider';

const DetalhesHorasModal = ({ isOpen, onClose, funcionarioId, funcionarioNome }) => {
  const { usuario } = useAuth();
  const { showToast } = useToast();
  
  // Usar funcionarioId passado como prop ou o usuário logado
  const targetUserId = funcionarioId || usuario?.id;
  const targetUserName = funcionarioNome || usuario?.nome;
  
  const [tempoReal, setTempoReal] = useState({
    horas: 0,
    minutos: 0,
    segundos: 0
  });
  const [pontoDia, setPontoDia] = useState(null);
  const [mostrarModalEdicao, setMostrarModalEdicao] = useState(false);
  const [dataEdicao, setDataEdicao] = useState('');
  const [pontosEdicao, setPontosEdicao] = useState({
    entrada: '',
    saidaAlmoco: '',
    voltaAlmoco: '',
    saida: ''
  });
  const [campoFocado, setCampoFocado] = useState(null);

  // Buscar pontos do dia em tempo real - BUSCAR POR NOME
  useEffect(() => {
    if (!isOpen || !targetUserName) {
      return;
    }

    console.log('🔍 [DetalhesHoras] Buscando pontos para:', targetUserName);
    
    // Buscar por NOME do funcionário (mais confiável)
    const q = query(
      collection(db, 'pontos'),
      where('funcionarioNome', '==', targetUserName)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('📦 [DetalhesHoras] Documentos encontrados:', snapshot.docs.length);
      
      const hoje = new Date();
      // Usar formato YYYY-MM-DD para comparação mais confiável
      const hojeStr = hoje.toISOString().split('T')[0];
      
      console.log('📅 [DetalhesHoras] Data de hoje (ISO):', hojeStr);
      
      const pontosHoje = {
        entrada: null,
        saidaAlmoco: null,
        voltaAlmoco: null,
        saida: null
      };

      snapshot.docs.forEach((doc) => {
        const pontoData = doc.data();
        
        if (!pontoData || !pontoData.tipo) return;
        
        // Converter a data do ponto - priorizar timestamp
        let dataPonto;
        if (pontoData.timestamp && typeof pontoData.timestamp === 'number') {
          dataPonto = new Date(pontoData.timestamp);
        } else if (pontoData.data) {
          if (typeof pontoData.data.toDate === 'function') {
            dataPonto = pontoData.data.toDate();
          } else if (typeof pontoData.data === 'string') {
            dataPonto = new Date(pontoData.data);
          } else if (pontoData.data.seconds) {
            dataPonto = new Date(pontoData.data.seconds * 1000);
          } else {
            dataPonto = new Date(pontoData.data);
          }
        } else {
          return;
        }
        
        if (isNaN(dataPonto.getTime())) return;
        
        // Usar formato YYYY-MM-DD para comparação consistente
        const dataPontoStr = dataPonto.toISOString().split('T')[0];
        
        console.log(`🔍 [DetalhesHoras] Comparando: ${dataPontoStr} === ${hojeStr}? ${dataPontoStr === hojeStr} (Tipo: ${pontoData.tipo})`);
        
        // Apenas pontos de hoje
        if (dataPontoStr === hojeStr) {
          const hora = dataPonto.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          });

          console.log(`✓ Ponto de hoje encontrado: ${pontoData.tipo} às ${hora}`);

          if (hora === '--:--' || hora === '00:00') return;

          switch(pontoData.tipo) {
            case 'entrada':
              if (!pontosHoje.entrada) pontosHoje.entrada = hora;
              break;
            case 'saida_almoco':
              if (!pontosHoje.saidaAlmoco) pontosHoje.saidaAlmoco = hora;
              break;
            case 'retorno_almoco':
              if (!pontosHoje.voltaAlmoco) pontosHoje.voltaAlmoco = hora;
              break;
            case 'saida':
              if (!pontosHoje.saida) pontosHoje.saida = hora;
              break;
          }
        }
      });

      console.log('✅ [DetalhesHoras] Pontos consolidados:', pontosHoje);
      setPontoDia(pontosHoje);
    }, (error) => {
      console.error('❌ Erro ao buscar pontos do dia:', error);
      showToast('Erro ao carregar pontos do dia', 'error');
    });

    return () => unsubscribe();
  }, [isOpen, targetUserName, showToast]);

  // Calcular horas trabalhadas em tempo real
  useEffect(() => {
    if (!isOpen || !pontoDia) {
      return;
    }

    const calcularTempoReal = () => {
      const agora = new Date();
      
      const horarioEntrada = pontoDia.entrada;
      const horarioSaidaAlmoco = pontoDia.saidaAlmoco;
      const horarioVoltaAlmoco = pontoDia.voltaAlmoco;
      const horarioSaida = pontoDia.saida;
      
      if (!horarioEntrada) {
        setTempoReal({ horas: 0, minutos: 0, segundos: 0 });
        return;
      }
      
      const [horaEntrada, minutoEntrada] = horarioEntrada.split(':').map(Number);
      const entrada = new Date();
      entrada.setHours(horaEntrada, minutoEntrada, 0, 0);
      
      let totalSegundosTrabalhados = 0;
      
      if (horarioSaida && horarioSaidaAlmoco && horarioVoltaAlmoco) {
        const [horaSaida, minutoSaida] = horarioSaida.split(':').map(Number);
        const saida = new Date();
        saida.setHours(horaSaida, minutoSaida, 0, 0);
        
        const [horaSaidaAlmoco, minutoSaidaAlmoco] = horarioSaidaAlmoco.split(':').map(Number);
        const saidaAlmoco = new Date();
        saidaAlmoco.setHours(horaSaidaAlmoco, minutoSaidaAlmoco, 0, 0);
        
        const [horaVoltaAlmoco, minutoVoltaAlmoco] = horarioVoltaAlmoco.split(':').map(Number);
        const voltaAlmoco = new Date();
        voltaAlmoco.setHours(horaVoltaAlmoco, minutoVoltaAlmoco, 0, 0);
        
        const segundosManha = Math.floor((saidaAlmoco - entrada) / 1000);
        const segundosTarde = Math.floor((saida - voltaAlmoco) / 1000);
        totalSegundosTrabalhados = segundosManha + segundosTarde;
      }
      else if (horarioVoltaAlmoco && horarioSaidaAlmoco) {
        const [horaSaidaAlmoco, minutoSaidaAlmoco] = horarioSaidaAlmoco.split(':').map(Number);
        const saidaAlmoco = new Date();
        saidaAlmoco.setHours(horaSaidaAlmoco, minutoSaidaAlmoco, 0, 0);
        
        const [horaVoltaAlmoco, minutoVoltaAlmoco] = horarioVoltaAlmoco.split(':').map(Number);
        const voltaAlmoco = new Date();
        voltaAlmoco.setHours(horaVoltaAlmoco, minutoVoltaAlmoco, 0, 0);
        
        const segundosManha = Math.floor((saidaAlmoco - entrada) / 1000);
        const segundosTarde = Math.floor((agora - voltaAlmoco) / 1000);
        totalSegundosTrabalhados = segundosManha + segundosTarde;
      }
      else if (horarioSaidaAlmoco) {
        const [horaSaidaAlmoco, minutoSaidaAlmoco] = horarioSaidaAlmoco.split(':').map(Number);
        const saidaAlmoco = new Date();
        saidaAlmoco.setHours(horaSaidaAlmoco, minutoSaidaAlmoco, 0, 0);
        
        totalSegundosTrabalhados = Math.floor((saidaAlmoco - entrada) / 1000);
      }
      else {
        totalSegundosTrabalhados = Math.floor((agora - entrada) / 1000);
      }
      
      if (totalSegundosTrabalhados < 0) totalSegundosTrabalhados = 0;
      
      const horas = Math.floor(totalSegundosTrabalhados / 3600);
      const minutos = Math.floor((totalSegundosTrabalhados % 3600) / 60);
      const segundos = totalSegundosTrabalhados % 60;
      
      setTempoReal({ horas, minutos, segundos });
    };

    calcularTempoReal();
    const interval = setInterval(calcularTempoReal, 1000);

    return () => clearInterval(interval);
  }, [isOpen, pontoDia]);

  // Carregar pontos quando abre modal de edição OU quando muda a data
  useEffect(() => {
    if (!mostrarModalEdicao || !dataEdicao || !targetUserName) return;

    const carregarPontosDia = async () => {
      try {
        console.log('🔄 Carregando pontos para edição. Data:', dataEdicao);
        
        const q = query(
          collection(db, 'pontos'),
          where('funcionarioNome', '==', targetUserName)
        );

        const snapshot = await getDocs(q);
        
        const pontosDoDia = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(ponto => {
            let dataPonto;
            if (ponto.timestamp) {
              dataPonto = new Date(ponto.timestamp);
            } else if (ponto.data) {
              dataPonto = new Date(ponto.data);
            } else {
              return false;
            }
            
            const dataPontoStr = dataPonto.toISOString().split('T')[0];
            return dataPontoStr === dataEdicao;
          });

        console.log('📋 Pontos encontrados para edição:', pontosDoDia.length);

        // Sempre resetar os pontos primeiro
        const pontosOrganizados = {
          entrada: '',
          saidaAlmoco: '',
          voltaAlmoco: '',
          saida: ''
        };

        pontosDoDia.forEach(ponto => {
          let dataPontoObj;
          if (ponto.timestamp) {
            dataPontoObj = new Date(ponto.timestamp);
          } else if (ponto.data) {
            dataPontoObj = new Date(ponto.data);
          } else {
            return;
          }
          
          const hora = dataPontoObj.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });

          switch(ponto.tipo) {
            case 'entrada':
              pontosOrganizados.entrada = hora;
              break;
            case 'saida_almoco':
              pontosOrganizados.saidaAlmoco = hora;
              break;
            case 'retorno_almoco':
              pontosOrganizados.voltaAlmoco = hora;
              break;
            case 'saida':
              pontosOrganizados.saida = hora;
              break;
          }
        });

        console.log('✅ Pontos organizados:', pontosOrganizados);
        setPontosEdicao(pontosOrganizados);
      } catch (error) {
        console.error('Erro ao carregar pontos:', error);
        showToast('Erro ao carregar pontos', 'error');
      }
    };

    carregarPontosDia();
  }, [mostrarModalEdicao, dataEdicao, targetUserName, showToast]);

  const abrirModalEdicao = () => {
    const hoje = new Date().toISOString().split('T')[0];
    setDataEdicao(hoje);
    setMostrarModalEdicao(true);
  };

  const salvarPontosEditados = async () => {
    if (!dataEdicao) {
      showToast('Selecione uma data', 'error');
      return;
    }

    try {
      console.log('💾 Iniciando salvamento de pontos...');
      console.log('📅 Data da edição:', dataEdicao);
      console.log('👤 Funcionário:', targetUserName);
      console.log('⏰ Pontos a salvar:', pontosEdicao);

      // Remover pontos antigos do dia selecionado
      const q = query(
        collection(db, 'pontos'),
        where('funcionarioNome', '==', targetUserName)
      );
      
      const snapshot = await getDocs(q);
      console.log('📦 Total de documentos encontrados:', snapshot.docs.length);
      
      const pontosParaRemover = snapshot.docs.filter(doc => {
        const data = doc.data();
        let dataPonto;
        if (data.timestamp) {
          dataPonto = new Date(data.timestamp);
        } else if (data.data) {
          dataPonto = new Date(data.data);
        } else {
          return false;
        }
        const dataPontoStr = dataPonto.toISOString().split('T')[0];
        const match = dataPontoStr === dataEdicao;
        if (match) {
          console.log('🗑️ Removendo ponto:', data.tipo, 'de', dataPontoStr);
        }
        return match;
      });

      console.log('🗑️ Total de pontos a remover:', pontosParaRemover.length);

      for (const doc of pontosParaRemover) {
        await deleteDoc(doc.ref);
      }

      // Adicionar novos pontos
      const pontosParaAdicionar = [
        { tipo: 'entrada', hora: pontosEdicao.entrada },
        { tipo: 'saida_almoco', hora: pontosEdicao.saidaAlmoco },
        { tipo: 'retorno_almoco', hora: pontosEdicao.voltaAlmoco },
        { tipo: 'saida', hora: pontosEdicao.saida },
      ];

      let pontosAdicionados = 0;
      for (const ponto of pontosParaAdicionar) {
        if (ponto.hora && ponto.hora.trim() !== '') {
          const [hora, minuto] = ponto.hora.split(':').map(Number);
          
          // Criar data usando o formato correto para evitar problemas de fuso horário
          // dataEdicao está no formato YYYY-MM-DD
          const [ano, mes, dia] = dataEdicao.split('-').map(Number);
          const data = new Date(ano, mes - 1, dia, hora, minuto, 0, 0);

          const novoPonto = {
            funcionarioId: String(targetUserId),
            funcionarioNome: targetUserName,
            tipo: ponto.tipo,
            data: data.toISOString(),
            timestamp: data.getTime()
          };

          console.log(`➕ Adicionando ponto: ${ponto.tipo} às ${ponto.hora}`);
          console.log(`   Data ISO: ${data.toISOString()}`);
          console.log(`   Timestamp: ${data.getTime()}`);
          console.log(`   Data check: ${data.toISOString().split('T')[0]}`);
          
          await addDoc(collection(db, 'pontos'), novoPonto);
          pontosAdicionados++;
        }
      }

      console.log('✅ Pontos adicionados:', pontosAdicionados);
      showToast(`Pontos atualizados com sucesso! ${pontosAdicionados} registros salvos.`, 'success');
      setMostrarModalEdicao(false);
    } catch (error) {
      console.error('❌ Erro ao salvar pontos:', error);
      showToast('Erro ao salvar pontos. Tente novamente.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-t-2xl sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Detalhes de Horas Trabalhadas
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {targetUserName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Conteúdo */}
              <div className="p-6 space-y-6">
                {!pontoDia ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                      <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Carregando registros...
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Buscando pontos de {targetUserName}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Relógio em Tempo Real */}
                    <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 dark:from-blue-600 dark:via-blue-700 dark:to-blue-900 rounded-2xl p-6 shadow-2xl">
                      <div className="text-center mb-4">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <RefreshCw className="w-5 h-5 text-white/80 animate-spin" style={{ animationDuration: '3s' }} />
                          <span className="text-white/90 text-sm font-medium uppercase tracking-wide">
                            Tempo Real
                          </span>
                        </div>
                        {!pontoDia.entrada ? (
                          <div className="py-4">
                            <div className="text-3xl md:text-4xl font-bold text-white/90 mb-2">
                              Nenhum ponto registrado
                            </div>
                            <div className="text-white/70 text-sm">
                              {targetUserName} ainda não bateu o ponto de entrada hoje
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-6xl md:text-7xl font-bold text-white font-mono tracking-tight">
                              {String(tempoReal.horas).padStart(2, '0')}h{' '}
                              {String(tempoReal.minutos).padStart(2, '0')}m{' '}
                              <span className="text-5xl md:text-6xl text-white/90">
                                {String(tempoReal.segundos).padStart(2, '0')}s
                              </span>
                            </div>
                            <div className="text-white/80 text-sm mt-2">
                              Horas contabilizadas hoje
                            </div>
                          </>
                        )}
                      </div>
                  
                      {/* Botão de Editar Pontos */}
                      <button
                        onClick={abrirModalEdicao}
                        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all backdrop-blur-sm border border-white/30 hover:scale-105 transform"
                      >
                        <Edit3 className="w-5 h-5" />
                        <span>Corrigir Pontos do Dia</span>
                      </button>
                    </div>

                    {/* Pontos do Dia */}
                    {pontoDia && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            Pontos Registrados Hoje
                          </h3>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              {[pontoDia.entrada, pontoDia.saidaAlmoco, pontoDia.voltaAlmoco, pontoDia.saida].filter(Boolean).length} de 4
                            </span>
                            <div className="flex gap-1">
                              {[pontoDia.entrada, pontoDia.saidaAlmoco, pontoDia.voltaAlmoco, pontoDia.saida].map((ponto, idx) => (
                                <div 
                                  key={idx}
                                  className={`w-2 h-2 rounded-full transition-all ${
                                    ponto 
                                      ? 'bg-green-500 shadow-lg shadow-green-500/50' 
                                      : 'bg-gray-300 dark:bg-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                    
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => {
                              const hoje = new Date().toISOString().split('T')[0];
                              setDataEdicao(hoje);
                              setMostrarModalEdicao(true);
                            }}
                            className={`bg-white dark:bg-gray-700 rounded-lg p-4 border-2 transition-all hover:scale-105 cursor-pointer ${
                              pontoDia.entrada 
                                ? 'border-green-500 shadow-lg shadow-green-500/20 hover:shadow-green-500/40' 
                                : 'border-gray-200 dark:border-gray-600 opacity-60 hover:opacity-80'
                            }`}
                          >
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center justify-between">
                              <span>1º Ponto - Entrada</span>
                              <div className="flex items-center gap-1">
                                {pontoDia.entrada && <CheckCircle className="w-4 h-4 text-green-500" />}
                                <Edit3 className="w-3 h-3 text-gray-400" />
                              </div>
                            </div>
                            <div className={`text-2xl font-bold font-mono ${
                              pontoDia.entrada 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-gray-400 dark:text-gray-500'
                            }`}>
                              {pontoDia.entrada || '--:--'}
                            </div>
                            {!pontoDia.entrada && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Clique para registrar</div>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              const hoje = new Date().toISOString().split('T')[0];
                              setDataEdicao(hoje);
                              setMostrarModalEdicao(true);
                            }}
                            className={`bg-white dark:bg-gray-700 rounded-lg p-4 border-2 transition-all hover:scale-105 cursor-pointer ${
                              pontoDia.saidaAlmoco 
                                ? 'border-orange-500 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40' 
                                : 'border-gray-200 dark:border-gray-600 opacity-60 hover:opacity-80'
                            }`}
                          >
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center justify-between">
                              <span>2º Ponto - Saída Almoço</span>
                              <div className="flex items-center gap-1">
                                {pontoDia.saidaAlmoco && <CheckCircle className="w-4 h-4 text-orange-500" />}
                                <Edit3 className="w-3 h-3 text-gray-400" />
                              </div>
                            </div>
                            <div className={`text-2xl font-bold font-mono ${
                              pontoDia.saidaAlmoco 
                                ? 'text-orange-600 dark:text-orange-400' 
                                : 'text-gray-400 dark:text-gray-500'
                            }`}>
                              {pontoDia.saidaAlmoco || '--:--'}
                            </div>
                            {!pontoDia.saidaAlmoco && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Clique para registrar</div>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              const hoje = new Date().toISOString().split('T')[0];
                              setDataEdicao(hoje);
                              setMostrarModalEdicao(true);
                            }}
                            className={`bg-white dark:bg-gray-700 rounded-lg p-4 border-2 transition-all hover:scale-105 cursor-pointer ${
                              pontoDia.voltaAlmoco 
                                ? 'border-blue-500 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40' 
                                : 'border-gray-200 dark:border-gray-600 opacity-60 hover:opacity-80'
                            }`}
                          >
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center justify-between">
                              <span>3º Ponto - Volta Almoço</span>
                              <div className="flex items-center gap-1">
                                {pontoDia.voltaAlmoco && <CheckCircle className="w-4 h-4 text-blue-500" />}
                                <Edit3 className="w-3 h-3 text-gray-400" />
                              </div>
                            </div>
                            <div className={`text-2xl font-bold font-mono ${
                              pontoDia.voltaAlmoco 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : 'text-gray-400 dark:text-gray-500'
                            }`}>
                              {pontoDia.voltaAlmoco || '--:--'}
                            </div>
                            {!pontoDia.voltaAlmoco && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Clique para registrar</div>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              const hoje = new Date().toISOString().split('T')[0];
                              setDataEdicao(hoje);
                              setMostrarModalEdicao(true);
                            }}
                            className={`bg-white dark:bg-gray-700 rounded-lg p-4 border-2 transition-all hover:scale-105 cursor-pointer ${
                              pontoDia.saida 
                                ? 'border-red-500 shadow-lg shadow-red-500/20 hover:shadow-red-500/40' 
                                : 'border-gray-200 dark:border-gray-600 opacity-60 hover:opacity-80'
                            }`}
                          >
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center justify-between">
                              <span>4º Ponto - Saída</span>
                              <div className="flex items-center gap-1">
                                {pontoDia.saida && <CheckCircle className="w-4 h-4 text-red-500" />}
                                <Edit3 className="w-3 h-3 text-gray-400" />
                              </div>
                            </div>
                            <div className={`text-2xl font-bold font-mono ${
                              pontoDia.saida 
                                ? 'text-red-600 dark:text-red-400' 
                                : 'text-gray-400 dark:text-gray-500'
                            }`}>
                              {pontoDia.saida || '--:--'}
                            </div>
                            {!pontoDia.saida && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Clique para registrar</div>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* Modal de Edição de Pontos */}
      {mostrarModalEdicao && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMostrarModalEdicao(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
          />
          <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-blue-600" />
                    Editar Pontos do Dia
                  </h3>
                  <button
                    onClick={() => setMostrarModalEdicao(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    💡 <strong>Dica:</strong> Deixe o campo vazio para remover um registro de ponto.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      📅 Data
                    </label>
                    <input
                      type="date"
                      value={dataEdicao}
                      onChange={(e) => setDataEdicao(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className={`transition-all ${campoFocado === 'entrada' ? 'scale-105' : ''}`}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        1º - Entrada
                      </label>
                      <input
                        type="time"
                        value={pontosEdicao.entrada}
                        onChange={(e) => setPontosEdicao({ ...pontosEdicao, entrada: e.target.value })}
                        onFocus={() => setCampoFocado('entrada')}
                        onBlur={() => setCampoFocado(null)}
                        className="w-full px-4 py-3 border-2 border-green-300 dark:border-green-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all font-mono text-lg"
                        autoFocus={!pontoDia.entrada}
                      />
                    </div>

                    <div className={`transition-all ${campoFocado === 'saidaAlmoco' ? 'scale-105' : ''}`}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        2º - Saída Almoço
                      </label>
                      <input
                        type="time"
                        value={pontosEdicao.saidaAlmoco}
                        onChange={(e) => setPontosEdicao({ ...pontosEdicao, saidaAlmoco: e.target.value })}
                        onFocus={() => setCampoFocado('saidaAlmoco')}
                        onBlur={() => setCampoFocado(null)}
                        className="w-full px-4 py-3 border-2 border-orange-300 dark:border-orange-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-mono text-lg"
                      />
                    </div>

                    <div className={`transition-all ${campoFocado === 'voltaAlmoco' ? 'scale-105' : ''}`}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        3º - Volta Almoço
                      </label>
                      <input
                        type="time"
                        value={pontosEdicao.voltaAlmoco}
                        onChange={(e) => setPontosEdicao({ ...pontosEdicao, voltaAlmoco: e.target.value })}
                        onFocus={() => setCampoFocado('voltaAlmoco')}
                        onBlur={() => setCampoFocado(null)}
                        className="w-full px-4 py-3 border-2 border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono text-lg"
                      />
                    </div>

                    <div className={`transition-all ${campoFocado === 'saida' ? 'scale-105' : ''}`}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        4º - Saída
                      </label>
                      <input
                        type="time"
                        value={pontosEdicao.saida}
                        onChange={(e) => setPontosEdicao({ ...pontosEdicao, saida: e.target.value })}
                        onFocus={() => setCampoFocado('saida')}
                        onBlur={() => setCampoFocado(null)}
                        className="w-full px-4 py-3 border-2 border-red-300 dark:border-red-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all font-mono text-lg"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setMostrarModalEdicao(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={salvarPontosEditados}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DetalhesHorasModal;
