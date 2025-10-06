import React, { useState, useEffect } from 'react';
import { Clock, Calendar, PlayCircle, Coffee, CornerDownLeft, StopCircle, CheckCircle, AlertTriangle, Loader } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const WorkPontoTab = () => {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pontos, setPontos] = useState([]);
  const [pontosHoje, setPontosHoje] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [registering, setRegistering] = useState(null);

  // Atualizar relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Carregar pontos
  useEffect(() => {
    if (!usuario?.id) return;

    const loadPontos = async () => {
      setLoading(true);
      try {
        const pontosQuery = query(
          collection(db, 'pontos'),
          where('funcionarioId', '==', usuario.id),
          orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(pontosQuery);
        const pontosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setPontos(pontosData);

        // Filtrar pontos de hoje
        const hoje = new Date();
        const pontosHojeData = pontosData.filter(p => {
          const pontoDate = p.timestamp.toDate();
          return pontoDate.toDateString() === hoje.toDateString();
        });
        setPontosHoje(pontosHojeData);
      } catch (err) {
        console.error('Erro ao carregar pontos:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPontos();
  }, [usuario?.id]);

  // Registrar ponto
  const registrarPonto = async (tipo) => {
    setRegistering(tipo);
    
    try {
      const pontoData = {
        funcionarioId: usuario.id,
        funcionarioNome: usuario.nome,
        funcionarioUsuario: usuario.usuario,
        tipo: tipo,
        timestamp: new Date(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform
        }
      };

      // Se for saída, calcular tempo total trabalhado
      if (tipo === 'saida') {
        const entrada = pontosHoje.find(p => p.tipo === 'entrada');
        const almoco = pontosHoje.find(p => p.tipo === 'almoco');
        const retorno = pontosHoje.find(p => p.tipo === 'retorno');
        
        if (entrada && almoco && retorno) {
          const tempoManha = differenceInMinutes(almoco.timestamp.toDate(), entrada.timestamp.toDate());
          const tempoTarde = differenceInMinutes(new Date(), retorno.timestamp.toDate());
          const totalMinutos = tempoManha + tempoTarde;
          const totalHoras = Math.floor(totalMinutos / 60);
          
          pontoData.horasTrabalhadas = totalHoras;
          pontoData.minutosTrabalhados = totalMinutos;
        }
      }

      await addDoc(collection(db, 'pontos'), pontoData);
      console.log(`✅ Ponto de ${tipo} registrado com sucesso!`);
      
      // Recarregar pontos
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err) {
      console.error('Erro ao registrar ponto:', err);
      alert('Erro ao registrar ponto. Tente novamente.');
    } finally {
      setRegistering(null);
    }
  };

  // Determinar qual é o próximo ponto válido
  const getProximoPonto = () => {
    if (pontosHoje.length === 0) return 'entrada';
    if (pontosHoje.length === 1 && pontosHoje[0].tipo === 'entrada') return 'almoco';
    if (pontosHoje.length === 2 && pontosHoje[1].tipo === 'almoco') return 'retorno';
    if (pontosHoje.length === 3 && pontosHoje[2].tipo === 'retorno') return 'saida';
    return null; // Todos os pontos já registrados
  };

  // Verificar status do dia
  const getStatusDia = () => {
    const proximoPonto = getProximoPonto();
    
    if (proximoPonto === 'entrada') {
      return { status: 'pending', text: 'Registre sua entrada', color: 'yellow' };
    }
    if (proximoPonto === 'almoco') {
      return { status: 'working', text: 'Trabalhando - Manhã', color: 'blue' };
    }
    if (proximoPonto === 'retorno') {
      return { status: 'lunch', text: 'Intervalo de almoço', color: 'orange' };
    }
    if (proximoPonto === 'saida') {
      return { status: 'working', text: 'Trabalhando - Tarde', color: 'blue' };
    }
    return { status: 'completed', text: 'Jornada concluída', color: 'green' };
  };

  const statusDia = getStatusDia();
  const proximoPonto = getProximoPonto();

  // Configuração dos botões de ponto
  const botoesConfig = [
    {
      tipo: 'entrada',
      label: 'Entrada',
      sublabel: 'Início do trabalho',
      icon: PlayCircle,
      color: 'from-green-500 to-green-600',
      ordem: 1
    },
    {
      tipo: 'almoco',
      label: 'Almoço',
      sublabel: 'Saída para almoço',
      icon: Coffee,
      color: 'from-orange-500 to-orange-600',
      ordem: 2
    },
    {
      tipo: 'retorno',
      label: 'Retorno',
      sublabel: 'Volta do almoço',
      icon: CornerDownLeft,
      color: 'from-blue-500 to-blue-600',
      ordem: 3
    },
    {
      tipo: 'saida',
      label: 'Saída',
      sublabel: 'Fim do trabalho',
      icon: StopCircle,
      color: 'from-red-500 to-red-600',
      ordem: 4
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header com Status */}
      <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">WorkPonto</h2>
              <p className="text-white/80 text-sm">Sistema de Ponto Eletrônico</p>
            </div>
          </div>
        </div>

        {/* Data e Hora Atual */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span className="font-medium text-sm sm:text-base">
                {format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold">
              {format(currentTime, 'HH:mm:ss')}
            </div>
          </div>
        </div>

        {/* Status do Dia */}
        <div className={`bg-${statusDia.color}-500/20 border border-${statusDia.color}-400/30 rounded-xl p-4`}>
          <div className="flex items-center gap-3">
            {statusDia.status === 'working' && <PlayCircle className="w-6 h-6" />}
            {statusDia.status === 'lunch' && <Coffee className="w-6 h-6" />}
            {statusDia.status === 'completed' && <CheckCircle className="w-6 h-6" />}
            {statusDia.status === 'pending' && <AlertTriangle className="w-6 h-6" />}
            <div>
              <p className="font-semibold text-lg">{statusDia.text}</p>
              {pontosHoje.length > 0 && (
                <p className="text-sm text-white/80">
                  {pontosHoje.length} de 4 pontos registrados
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Botões de Ponto */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {botoesConfig.map((botao) => {
          const Icon = botao.icon;
          const jaRegistrado = pontosHoje.some(p => p.tipo === botao.tipo);
          const isProximo = proximoPonto === botao.tipo;
          const isDisabled = !isProximo || registering !== null;

          return (
            <button
              key={botao.tipo}
              onClick={() => registrarPonto(botao.tipo)}
              disabled={isDisabled}
              className={`bg-gradient-to-br ${botao.color} text-white rounded-xl p-4 hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden`}
            >
              {/* Badge de ordem */}
              <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {botao.ordem}
              </div>

              <div className="flex flex-col items-center gap-2 text-center">
                <Icon className="w-8 h-8" />
                <div>
                  <p className="font-bold text-base">{botao.label}</p>
                  <p className="text-xs text-white/80">{botao.sublabel}</p>
                </div>

                {/* Indicador de status */}
                {jaRegistrado && (
                  <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1 mt-1">
                    <CheckCircle className="w-3 h-3" />
                    <span className="text-xs">Registrado</span>
                  </div>
                )}

                {registering === botao.tipo && (
                  <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1 mt-1">
                    <Loader className="w-3 h-3 animate-spin" />
                    <span className="text-xs">Salvando...</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Histórico de Pontos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4">
          <h3 className="text-white font-bold text-lg">Histórico de Pontos - Hoje</h3>
        </div>

        <div className="p-4 space-y-3">
          {pontosHoje.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Nenhum ponto registrado hoje</p>
            </div>
          ) : (
            pontosHoje.map((ponto) => {
              const botaoConfig = botoesConfig.find(b => b.tipo === ponto.tipo);
              const Icon = botaoConfig?.icon || Clock;
              
              return (
                <div
                  key={ponto.id}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center gap-3">
                    <div className={`bg-gradient-to-br ${botaoConfig?.color} text-white rounded-lg p-3`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {botaoConfig?.label || ponto.tipo}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({botaoConfig?.ordem}º ponto)
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(ponto.timestamp.toDate(), "HH:mm:ss", { locale: ptBR })}
                      </p>
                      {ponto.horasTrabalhadas !== undefined && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                          ⏱️ Total trabalhado: {ponto.horasTrabalhadas}h {ponto.minutosTrabalhados % 60}min
                        </p>
                      )}
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Histórico Completo (últimos 30 dias) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
          <h3 className="text-white font-bold text-lg">Histórico Completo</h3>
        </div>

        <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
          {pontos.slice(0, 30).map((ponto) => {
            const botaoConfig = botoesConfig.find(b => b.tipo === ponto.tipo);
            const Icon = botaoConfig?.icon || Clock;
            
            return (
              <div
                key={ponto.id}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 flex items-center gap-3"
              >
                <div className={`bg-gradient-to-br ${botaoConfig?.color} text-white rounded-lg p-2`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                      {botaoConfig?.label || ponto.tipo}
                    </span>
                    {ponto.horasTrabalhadas !== undefined && (
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                        {ponto.horasTrabalhadas}h {ponto.minutosTrabalhados % 60}min
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {format(ponto.timestamp.toDate(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WorkPontoTab;
