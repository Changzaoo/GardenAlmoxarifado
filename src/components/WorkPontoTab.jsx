import React, { useState, useEffect } from 'react';
import { Calendar, LogIn, LogOut, Coffee, ArrowRightLeft, Clock, CheckCircle, AlertTriangle, TrendingUp, Award, FileText } from 'lucide-react';
import { collection, addDoc, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './ToastProvider';
import { validarTolerancia, podeBaterPonto, calcularSaldoDia } from '../utils/pontoUtils';
import { obterHorariosEsperados } from '../utils/escalaUtils';
import ComprovantesPontoModal from './Comprovantes/ComprovantesPontoModal';

// Utilitário para formatar hora
function formatHora(date) {
  if (!date) return '--:--';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Utilitário para formatar data
function formatData(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
}

// Obter início do dia atual
function getInicioDia() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return hoje;
}

const WorkPontoTab = () => {
  const { usuario } = useAuth();
  const { showToast } = useToast();
  
  // Debug: verificar inicialização
  useEffect(() => {
    console.log('🔥 Firebase DB inicializado:', !!db);
    console.log('👤 Usuário logado:', usuario);
  }, []);
  
  const [registros, setRegistros] = useState([
    { tipo: 'entrada', horario: null, label: 'Início do Trabalho' },
    { tipo: 'saida_almoco', horario: null, label: 'Saída para Almoço' },
    { tipo: 'retorno_almoco', horario: null, label: 'Retorno do Almoço' },
    { tipo: 'saida', horario: null, label: 'Saída do Trabalho' },
  ]);
  const [batendo, setBatendo] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [horariosEsperados, setHorariosEsperados] = useState(null);
  const [tipoEscala, setTipoEscala] = useState(null);
  const [saldoDia, setSaldoDia] = useState(null);
  const [funcionarioData, setFuncionarioData] = useState(null);
  const [showComprovanteModal, setShowComprovanteModal] = useState(false);
  const [comprovanteData, setComprovanteData] = useState(null);

  // Relógio em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setHoraAtual(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Carregar dados do funcionário e horários esperados
  useEffect(() => {
    const carregarHorarios = async () => {
      if (!usuario?.id && !usuario?.uid) return;

      const userId = usuario.id || usuario.uid;
      
      try {
        // Tentar buscar na collection de funcionarios
        const funcionarioRef = doc(db, 'funcionarios', String(userId));
        const funcionarioSnap = await getDoc(funcionarioRef);
        
        if (funcionarioSnap.exists()) {
          const data = funcionarioSnap.data();
          setFuncionarioData(data);
          
          // Verificar se tem tipoEscala configurado
          if (data.tipoEscala) {
            setTipoEscala(data.tipoEscala);
            const horarios = obterHorariosEsperados(data.tipoEscala, new Date());
            setHorariosEsperados(horarios);
            console.log('✅ Horários esperados carregados:', horarios);
          } else {
            // Se não tem tipoEscala, usar padrão M (07:20-16:20)
            console.log('⚠️ Funcionário sem tipoEscala, usando padrão M');
            setTipoEscala('M');
            const horarios = obterHorariosEsperados('M', new Date());
            setHorariosEsperados(horarios);
          }
        } else {
          // Se não encontrar na collection, usar escala padrão
          console.log('⚠️ Funcionário não encontrado no Firestore, usando escala padrão M');
          setTipoEscala('M');
          const horarios = obterHorariosEsperados('M', new Date());
          setHorariosEsperados(horarios);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar horários:', error);
        // Em caso de erro, usar escala padrão
        setTipoEscala('M');
        const horarios = obterHorariosEsperados('M', new Date());
        setHorariosEsperados(horarios);
      }
    };

    carregarHorarios();
  }, [usuario?.id, usuario?.uid]);

  // Carregar registros do dia atual
  useEffect(() => {
    console.log('🔍 Usuario atual:', usuario);
    if (!usuario?.id && !usuario?.uid) {
      console.warn('⚠️ Usuário sem ID!');
      return;
    }

    const userId = usuario.id || usuario.uid;
    console.log('✅ UserID encontrado:', userId);
    const inicioDia = getInicioDia();
    
    console.log('🔍 Carregando pontos para usuário:', userId);

    const q = query(
      collection(db, 'pontos'),
      where('funcionarioId', '==', String(userId))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('📋 Total de pontos encontrados:', snapshot.docs.length);
      
      const pontosHoje = {
        entrada: null,
        saida_almoco: null,
        retorno_almoco: null,
        saida: null
      };
      const hoje = formatData(new Date());
      
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        
        // Verificar se os dados são válidos
        if (!data || !data.data || !data.tipo) {
          console.warn('⚠️ Ponto inválido encontrado (sem data/tipo):', doc.id);
          return;
        }

        // Verificar se a data é válida
        const dataObj = new Date(data.data);
        if (isNaN(dataObj.getTime())) {
          console.warn('⚠️ Ponto com data inválida:', doc.id, data.data);
          return;
        }

        // Verificar se o horário é válido
        const hora = formatHora(data.data);
        if (hora === '--:--' || hora === '00:00' || hora === '10:10') {
          console.warn('⚠️ Ponto com horário inválido/problemático:', doc.id, hora);
          return;
        }

        // Verificar se não é muito antigo (mais de 30 dias)
        const hojeObj = new Date();
        const trintaDiasAtras = new Date(hojeObj.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (dataObj < trintaDiasAtras) {
          console.warn('⚠️ Ponto muito antigo (>30 dias):', doc.id, formatData(data.data));
          return;
        }
        
        const dataPonto = formatData(data.data);
        
        console.log('📌 Ponto VÁLIDO encontrado:', {
          tipo: data.tipo,
          data: dataPonto,
          horario: hora,
          hoje: hoje
        });
        
        // Apenas pontos de hoje e apenas se ainda não foi registrado
        if (dataPonto === hoje && !pontosHoje[data.tipo]) {
          pontosHoje[data.tipo] = dataObj;
          console.log(`✅ ${data.tipo} registrado para hoje:`, hora);
        } else if (dataPonto !== hoje) {
          console.log(`📅 Ponto de outra data ignorado:`, dataPonto);
        }
      });

      console.log('✅ Pontos de hoje consolidados:', pontosHoje);

      setRegistros((prev) =>
        prev.map((r) => {
          const novoHorario = pontosHoje[r.tipo] || null;
          console.log(`🎯 Atualizando card ${r.tipo}:`, novoHorario ? formatHora(novoHorario) : 'null');
          return {
            ...r,
            horario: novoHorario,
          };
        })
      );

      // Calcular saldo do dia se tiver horários esperados
      if (horariosEsperados && (pontosHoje.entrada || pontosHoje.saida_almoco || pontosHoje.retorno_almoco || pontosHoje.saida)) {
        const registrosParaCalculo = [
          { tipo: 'entrada', horario: pontosHoje.entrada },
          { tipo: 'almoco', horario: pontosHoje.saida_almoco },
          { tipo: 'retorno', horario: pontosHoje.retorno_almoco },
          { tipo: 'saida', horario: pontosHoje.saida },
        ];
        
        const saldo = calcularSaldoDia(registrosParaCalculo, horariosEsperados);
        setSaldoDia(saldo);
        console.log('💰 Saldo do dia calculado:', saldo);
      }
    });

    return () => unsubscribe();
  }, [usuario?.id, usuario?.uid, horariosEsperados]);

  // Carregar histórico dos últimos 30 dias
  useEffect(() => {
    if (!usuario?.id && !usuario?.uid) {
      console.warn('⚠️ Histórico: Usuário sem ID!');
      return;
    }

    const userId = usuario.id || usuario.uid;
    console.log('📜 Carregando histórico para:', userId);

    const q = query(
      collection(db, 'pontos'),
      where('funcionarioId', '==', String(userId))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pontos = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((ponto) => {
          // Remover pontos inválidos (sem data, sem tipo, ou sem horário válido)
          if (!ponto.data || !ponto.tipo) {
            console.warn('🗑️ Histórico: Removendo ponto sem data/tipo:', ponto.id);
            return false;
          }
          
          // Verificar se a data é válida
          const dataValida = new Date(ponto.data);
          if (isNaN(dataValida.getTime())) {
            console.warn('🗑️ Histórico: Removendo ponto com data inválida:', ponto.id, ponto.data);
            return false;
          }
          
          // Verificar se tem horário válido (não é 00:00:00, --:-- ou 10:10)
          const hora = formatHora(ponto.data);
          if (hora === '--:--' || hora === '00:00' || hora === '10:10') {
            console.warn('🗑️ Histórico: Removendo ponto com horário inválido/problemático:', ponto.id, hora);
            return false;
          }

          // Verificar se não é muito antigo (mais de 30 dias)
          const hoje = new Date();
          const trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (dataValida < trintaDiasAtras) {
            console.warn('🗑️ Histórico: Removendo ponto muito antigo (>30 dias):', ponto.id, formatData(ponto.data));
            return false;
          }
          
          console.log('✅ Histórico: Ponto válido mantido:', {
            id: ponto.id,
            tipo: ponto.tipo,
            data: formatData(ponto.data),
            hora: hora
          });
          
          return true;
        });
      
      // Ordenar por data mais recente
      pontos.sort((a, b) => new Date(b.data) - new Date(a.data));
      
      console.log('📜 Histórico filtrado:', pontos.length, 'registros válidos');
      console.log('📜 Dados do histórico:', pontos);
      
      if (pontos.length === 0) {
        console.log('✨ Nenhum ponto válido encontrado. O histórico está vazio.');
      }
      
      setHistorico(pontos);
    });

    return () => unsubscribe();
  }, [usuario?.id, usuario?.uid]);

  // Função para gerar comprovante do dia
  const gerarComprovante = () => {
    if (!saldoDia) {
      showToast('Nenhum ponto registrado hoje', 'error');
      return;
    }

    const pontosHoje = {
      entrada: registros.find(r => r.tipo === 'entrada')?.horario,
      saida_almoco: registros.find(r => r.tipo === 'saida_almoco')?.horario,
      retorno_almoco: registros.find(r => r.tipo === 'retorno_almoco')?.horario,
      saida: registros.find(r => r.tipo === 'saida')?.horario
    };

    const dados = {
      funcionarioNome: usuario.nome || usuario.usuario || 'Funcionário',
      empresa: funcionarioData?.empresa || 'N/A',
      setor: funcionarioData?.setor || 'N/A',
      cargo: funcionarioData?.funcao || funcionarioData?.cargo || 'N/A',
      cpf: funcionarioData?.cpf || 'N/A',
      data: new Date(),
      pontos: pontosHoje,
      horasEsperadas,
      horasTrabalhadas: {
        formatado: saldoDia.horasTrabalhadasFormatado,
        esperadasFormatado: saldoDia.horasEsperadasFormatado
      },
      saldo: {
        saldoFormatado: saldoDia.saldoFormatado,
        saldoMinutos: saldoDia.saldoMinutos
      },
      advertencias: saldoDia.advertencias || [],
      codigoAssinatura: `WF-PONTO-${Date.now().toString(36).toUpperCase()}`
    };

    setComprovanteData(dados);
    setShowComprovanteModal(true);
  };

  // Função para bater ponto
  const baterPonto = async (tipo) => {
    if (!usuario?.id && !usuario?.uid) {
      showToast('Erro: Usuário não identificado', 'error');
      console.error('❌ Tentativa de bater ponto sem usuário');
      return;
    }

    // Verificar se já bateu esse tipo hoje
    const registroAtual = registros.find(r => r.tipo === tipo);
    if (registroAtual?.horario) {
      showToast('Você já registrou este ponto hoje!', 'error');
      console.warn('⚠️ Tentativa de bater ponto duplicado:', tipo, formatHora(registroAtual.horario));
      return;
    }

    const userId = usuario.id || usuario.uid;
    
    setBatendo(true);
    try {
      const agora = new Date();

      // Validar tolerância se tiver horários esperados
      if (horariosEsperados) {
        // Mapear tipos do componente para tipos do pontoUtils
        const tipoMap = {
          'entrada': 'entrada',
          'saida_almoco': 'almoco',
          'retorno_almoco': 'retorno',
          'saida': 'saida'
        };
        
        const tipoValidacao = tipoMap[tipo];
        const horarioEsperado = horariosEsperados[tipoValidacao];
        
        if (horarioEsperado) {
          const validacao = validarTolerancia(horarioEsperado, agora);
          
          // Se estiver fora da tolerância, avisar mas permitir
          if (!validacao.dentroTolerancia) {
            const msgTipo = validacao.tipo === 'adiantado' ? 'adiantado' : 'atrasado';
            showToast(
              `Atenção: Você está ${msgTipo} (${validacao.diferencaMinutos} min). ${validacao.mensagem}`,
              'warning'
            );
            // Aguardar 2 segundos para o usuário ver o aviso
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else if (validacao.tipo === 'adiantado') {
            showToast(`Hora positiva! Você chegou ${validacao.diferencaMinutos} min antes. ⏰`, 'success');
          }
        }
      }
      
      // VALIDAÇÃO: Prevenir pontos às 10:10 (problema conhecido)
      const horaAtual = formatHora(agora);
      if (horaAtual === '10:10') {
        console.warn('⚠️ BLOQUEADO: Tentativa de bater ponto às 10:10 (horário problemático)');
        showToast('Não é possível registrar ponto exatamente às 10:10. Aguarde 1 minuto e tente novamente.', 'error');
        setBatendo(false);
        return;
      }
      
      const pontoData = {
        funcionarioId: String(userId),
        funcionarioNome: usuario.nome || usuario.usuario || 'Sem nome',
        tipo,
        data: agora.toISOString(),
        timestamp: agora.getTime(),
      };
      
      console.log('⏰ Batendo ponto:', {
        tipo,
        horario: horaAtual,
        usuario: pontoData.funcionarioNome
      });
      
      const docRef = await addDoc(collection(db, 'pontos'), pontoData);
      console.log('✅ Ponto registrado com sucesso!', {
        id: docRef.id,
        tipo,
        horario: formatHora(agora)
      });
      
      // Toast sem emoji conforme solicitado
      showToast(`Ponto registrado: ${registroAtual?.label} às ${formatHora(agora)}`, 'success');
      
    } catch (error) {
      console.error('❌ Erro ao bater ponto:', error);
      showToast('Erro ao registrar ponto: ' + error.message, 'error');
    } finally {
      setBatendo(false);
    }
  };

  return (
    <div>
      {/* Cabeçalho com relógio em tempo real */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-green-700 dark:text-green-300">
          <Clock className="w-6 h-6" /> Registro de Ponto
        </h2>
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl px-6 py-3 shadow-lg">
            <div className="text-white text-sm font-semibold mb-1">Data Atual</div>
            <div className="text-white text-lg font-bold">{formatData(horaAtual)}</div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl px-6 py-3 shadow-lg">
            <div className="text-white text-sm font-semibold mb-1">Hora Atual</div>
            <div className="text-white text-2xl font-bold font-mono">
              {horaAtual.toLocaleTimeString('pt-BR')}
            </div>
          </div>
        </div>
      </div>

      {/* Card de Horários Esperados */}
      {horariosEsperados && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-xl p-6 mb-6 shadow-lg border border-indigo-200 dark:border-indigo-800">
          <h3 className="font-bold text-indigo-900 dark:text-indigo-100 mb-4 flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5" />
            Seu Horário Hoje {tipoEscala && <span className="text-sm bg-indigo-200 dark:bg-indigo-900 px-2 py-1 rounded">Escala {tipoEscala}</span>}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-indigo-900/30 rounded-lg p-4 text-center shadow-sm">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">Entrada</div>
              <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 font-mono">
                {horariosEsperados.entrada || '--:--'}
              </div>
            </div>
            <div className="bg-white dark:bg-purple-900/30 rounded-lg p-4 text-center shadow-sm">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">Almoço</div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100 font-mono">
                {horariosEsperados.almoco || '--:--'}
              </div>
            </div>
            <div className="bg-white dark:bg-purple-900/30 rounded-lg p-4 text-center shadow-sm">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">Retorno</div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100 font-mono">
                {horariosEsperados.retorno || '--:--'}
              </div>
            </div>
            <div className="bg-white dark:bg-indigo-900/30 rounded-lg p-4 text-center shadow-sm">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">Saída</div>
              <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 font-mono">
                {horariosEsperados.saida || '--:--'}
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg p-3">
            <strong>⏰ Tolerância:</strong> Você pode bater ponto até 10 minutos antes ou depois do horário. 
            Fora desse período, será registrado como hora positiva (crédito) ou hora negativa (débito).
          </div>
        </div>
      )}

      {/* Card de Saldo do Dia */}
      {saldoDia && (
        <div className={`rounded-xl p-6 mb-6 shadow-lg border ${
          saldoDia.saldoMinutos >= 0 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800'
            : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 border-red-200 dark:border-red-800'
        }`}>
          <h3 className={`font-bold mb-4 flex items-center gap-2 text-lg ${
            saldoDia.saldoMinutos >= 0 ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
          }`}>
            <TrendingUp className="w-5 h-5" />
            Saldo de Horas Hoje
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900/40 rounded-lg p-4 text-center shadow-sm">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">Horas Trabalhadas</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
                {saldoDia.horasTrabalhadasFormatado || '--:--'}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900/40 rounded-lg p-4 text-center shadow-sm">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">Horas Esperadas</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
                {saldoDia.horasEsperadasFormatado || '--:--'}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900/40 rounded-lg p-4 text-center shadow-sm">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">Saldo</div>
              <div className={`text-3xl font-bold font-mono ${
                saldoDia.saldoMinutos >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {saldoDia.saldoFormatado || '--:--'}
              </div>
            </div>
          </div>
          {saldoDia.advertencias && saldoDia.advertencias.length > 0 && (
            <div className="mt-4 bg-red-100 dark:bg-red-900/40 px-4 py-3 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-red-900 dark:text-red-100 mb-1">
                  {saldoDia.advertencias.length} Advertência{saldoDia.advertencias.length > 1 ? 's' : ''} Hoje
                </div>
                <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                  {saldoDia.advertencias.map((adv, idx) => (
                    <li key={idx}>• {adv}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {/* Botão para Gerar Comprovante */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={gerarComprovante}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all shadow-lg flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Gerar Comprovante do Dia
            </button>
          </div>
        </div>
      )}
      
      {/* Registros de Hoje */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {registros.map((r) => (
          <div key={r.tipo} className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 flex items-center gap-4 shadow-sm border border-green-100 dark:border-green-800">
            <div className="p-2 bg-white dark:bg-green-950 rounded-lg">
              {r.tipo === 'entrada' && <LogIn className="w-6 h-6 text-green-700" />}
              {r.tipo === 'saida_almoco' && <Coffee className="w-6 h-6 text-yellow-600" />}
              {r.tipo === 'retorno_almoco' && <ArrowRightLeft className="w-6 h-6 text-blue-600" />}
              {r.tipo === 'saida' && <LogOut className="w-6 h-6 text-red-600" />}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 dark:text-white text-lg mb-1">{r.label}</div>
              <div className="text-gray-600 dark:text-gray-300 text-sm">
                {r.horario ? (
                  <span className="font-mono text-base text-green-700 dark:text-green-300 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {formatHora(r.horario)}
                  </span>
                ) : (
                  <span className="italic text-gray-400">Não registrado</span>
                )}
              </div>
            </div>
            <button
              className={`px-4 py-2 rounded-lg font-bold text-white transition-all ${r.horario ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-lg'} ${batendo ? 'opacity-60' : ''}`}
              disabled={!!r.horario || batendo}
              onClick={() => baterPonto(r.tipo)}
            >
              {batendo ? '...' : 'Bater'}
            </button>
          </div>
        ))}
      </div>

      {/* Histórico */}
      {historico.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Histórico de Pontos
            </h3>
            <button
              onClick={() => {
                // Importar dinamicamente
                import('../utils/exportarPontos').then(module => {
                  const funcionarioData = {
                    nome: usuario.nome || usuario.usuario || 'Funcionário',
                    empresa: funcionarioData?.empresa || 'N/A',
                    setor: funcionarioData?.setor || 'N/A',
                    cargo: funcionarioData?.funcao || funcionarioData?.cargo || 'N/A'
                  };
                  module.exportarPontosParaExcel(historico, funcionarioData);
                  showToast('Arquivo Excel gerado com sucesso!', 'success');
                }).catch(error => {
                  console.error('Erro ao exportar:', error);
                  showToast('Erro ao exportar pontos', 'error');
                });
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-md flex items-center gap-2 text-sm"
            >
              <FileText className="w-4 h-4" />
              Exportar Excel
            </button>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {(() => {
              // Agrupar pontos por dia
              const pontosPorDia = {};
              historico.forEach((ponto) => {
                const dia = formatData(ponto.data);
                if (!pontosPorDia[dia]) {
                  pontosPorDia[dia] = [];
                }
                pontosPorDia[dia].push(ponto);
              });

              // Ordenar cada dia por horário
              Object.keys(pontosPorDia).forEach((dia) => {
                pontosPorDia[dia].sort((a, b) => new Date(a.data) - new Date(b.data));
              });

              return Object.entries(pontosPorDia).map(([dia, pontos]) => (
                <div key={dia} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Cabeçalho do dia */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {dia}
                      </h4>
                      <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">
                        {pontos.length} {pontos.length === 1 ? 'registro' : 'registros'}
                      </span>
                    </div>
                  </div>

                  {/* Lista de pontos do dia */}
                  <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {pontos.map((ponto) => (
                        <div 
                          key={ponto.id} 
                          className={`rounded-lg p-3 border-2 ${
                            ponto.tipo === 'entrada' 
                              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                              : ponto.tipo === 'saida_almoco'
                              ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                              : ponto.tipo === 'retorno_almoco'
                              ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                              : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              ponto.tipo === 'entrada' 
                                ? 'bg-green-100 dark:bg-green-900/40' 
                                : ponto.tipo === 'saida_almoco'
                                ? 'bg-yellow-100 dark:bg-yellow-900/40'
                                : ponto.tipo === 'retorno_almoco'
                                ? 'bg-blue-100 dark:bg-blue-900/40'
                                : 'bg-red-100 dark:bg-red-900/40'
                            }`}>
                              {ponto.tipo === 'entrada' && <LogIn className="w-5 h-5 text-green-700 dark:text-green-400" />}
                              {ponto.tipo === 'saida_almoco' && <Coffee className="w-5 h-5 text-yellow-700 dark:text-yellow-400" />}
                              {ponto.tipo === 'retorno_almoco' && <ArrowRightLeft className="w-5 h-5 text-blue-700 dark:text-blue-400" />}
                              {ponto.tipo === 'saida' && <LogOut className="w-5 h-5 text-red-700 dark:text-red-400" />}
                            </div>
                            <div className="flex-1">
                              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                {ponto.tipo === 'entrada' ? '🟢 Entrada' :
                                 ponto.tipo === 'saida_almoco' ? '🟡 Saída Almoço' :
                                 ponto.tipo === 'retorno_almoco' ? '🔵 Retorno' : '🔴 Saída'}
                              </div>
                              <div className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                                {formatHora(ponto.data)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
        <strong>ℹ️ Como funciona:</strong> Você pode bater até 4 pontos por dia: início do trabalho, saída para almoço, retorno do almoço e saída do trabalho. Cada ponto só pode ser registrado uma vez por dia.
      </div>

      {/* Modal de Comprovante */}
      {showComprovanteModal && comprovanteData && (
        <ComprovantesPontoModal
          isOpen={showComprovanteModal}
          onClose={() => setShowComprovanteModal(false)}
          dados={comprovanteData}
        />
      )}
    </div>
  );
};

export default WorkPontoTab;
