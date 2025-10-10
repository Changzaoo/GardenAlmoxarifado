import React, { useState, useEffect } from 'react';
import { Calendar, LogIn, LogOut, Coffee, ArrowRightLeft, Clock, CheckCircle, AlertTriangle, TrendingUp, Award, FileText, Edit2, Utensils, RefreshCw, AlertCircle } from 'lucide-react';
import { collection, addDoc, query, where, onSnapshot, doc, getDoc, getDocs, deleteDoc, doc as firestoreDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './ToastProvider';
import { validarTolerancia, podeBaterPonto, calcularSaldoDia } from '../utils/pontoUtils';
import { obterHorariosEsperados } from '../utils/escalaUtils';
import ComprovantesPontoModal from './Comprovantes/ComprovantesPontoModal';
import TimePickerCustom from './WorkPonto/TimePickerCustom';
import { getAjustesMes, registrarAjuste, podeAjustar, onAjustesMesChange } from '../services/ajustesPontoService';

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

// Combina um horário 'HH:mm' com a data de hoje (retorna Date)
function combinarParaDate(horario) {
  if (!horario) return null;
  try {
    const hoje = new Date();
    const [h, m] = horario.split(':').map(Number);
    const resultado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), h, m, 0, 0);
    return resultado;
  } catch (e) {
    return null;
  }
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
  
  // Carregar horários personalizados do localStorage
  const [horariosPersonalizados, setHorariosPersonalizados] = useState(() => {
    try {
      const saved = localStorage.getItem(`horariosPersonalizados_${usuario?.id}`);
      return saved ? JSON.parse(saved) : { almoco: null, retorno: null };
    } catch (error) {
      console.error('Erro ao carregar horários personalizados:', error);
      return { almoco: null, retorno: null };
    }
  });
  
  const [editandoHorarios, setEditandoHorarios] = useState(false);
  const [editandoAlmoco, setEditandoAlmoco] = useState(false);
  const [editandoRetorno, setEditandoRetorno] = useState(false);
  const [horasTrabalhadasHoje, setHorasTrabalhadasHoje] = useState({
    horas: 0,
    minutos: 0,
    segundos: 0
  });
  const [desdeEntrada, setDesdeEntrada] = useState({ horas: 0, minutos: 0, segundos: 0 });
  const [tolerancias, setTolerancias] = useState({
    entrada: null,
    saida_almoco: null,
    retorno_almoco: null,
    saida: null
  });
  const [mostrarModalEdicao, setMostrarModalEdicao] = useState(false);
  const [dataEdicao, setDataEdicao] = useState('');
  const [pontosEdicao, setPontosEdicao] = useState({
    entrada: '',
    saidaAlmoco: '',
    voltaAlmoco: '',
    saida: ''
  });
  
  // Estados para sistema de ajustes mensais
  const [ajustesMes, setAjustesMes] = useState({
    ajustesUsados: 0,
    ajustesRestantes: 4,
    historico: []
  });
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar se é admin
  useEffect(() => {
    if (usuario) {
      setIsAdmin(usuario.nivel === 0 || usuario.nivel === '0');
    }
  }, [usuario]);

  // Carregar ajustes do mês atual
  useEffect(() => {
    if (!usuario?.id) return;
    
    const unsubscribe = onAjustesMesChange(usuario.id, (ajustes) => {
      setAjustesMes(ajustes);
    });
    
    return () => unsubscribe();
  }, [usuario?.id]);

  // Aplicar horários personalizados aos horariosEsperados
  useEffect(() => {
    if (!horariosEsperados) return;
    
    // Se tem horários personalizados salvos, aplicar ao horariosEsperados
    if (horariosPersonalizados.almoco || horariosPersonalizados.retorno) {
      setHorariosEsperados(prev => ({
        ...prev,
        almoco: horariosPersonalizados.almoco || prev?.almoco,
        retorno: horariosPersonalizados.retorno || prev?.retorno
      }));
    }
  }, [horariosPersonalizados.almoco, horariosPersonalizados.retorno]);

  // Relógio em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setHoraAtual(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calcular horas trabalhadas em tempo real
  useEffect(() => {
    const calcularHoras = () => {
      const entrada = registros.find(r => r.tipo === 'entrada')?.horario;
      const saidaAlmoco = registros.find(r => r.tipo === 'saida_almoco')?.horario;
      const retornoAlmoco = registros.find(r => r.tipo === 'retorno_almoco')?.horario;
      const saida = registros.find(r => r.tipo === 'saida')?.horario;

      if (!entrada) {
        setHorasTrabalhadasHoje({ horas: 0, minutos: 0, segundos: 0 });
        return;
      }

      const agora = new Date();
      const entradaTime = new Date(entrada);
      let totalSegundos = 0;

      // Cenário 1: Já bateu saída final (dia completo)
      if (saida) {
        const saidaTime = new Date(saida);
        const saidaAlmocoTime = new Date(saidaAlmoco);
        const retornoAlmocoTime = new Date(retornoAlmoco);
        
        // Manhã: entrada até saída almoço
        const segundosManha = Math.floor((saidaAlmocoTime - entradaTime) / 1000);
        
        // Tarde: retorno almoço até saída
        const segundosTarde = Math.floor((saidaTime - retornoAlmocoTime) / 1000);
        
        totalSegundos = segundosManha + segundosTarde;
      }
      // Cenário 2: Voltou do almoço mas ainda não bateu saída (tempo real na tarde)
      else if (retornoAlmoco) {
        const saidaAlmocoTime = new Date(saidaAlmoco);
        const retornoAlmocoTime = new Date(retornoAlmoco);
        
        // Manhã: entrada até saída almoço
        const segundosManha = Math.floor((saidaAlmocoTime - entradaTime) / 1000);
        
        // Tarde: retorno almoço até agora (TEMPO REAL)
        const segundosTarde = Math.floor((agora - retornoAlmocoTime) / 1000);
        
        totalSegundos = segundosManha + segundosTarde;
      }
      // Cenário 3: Saiu para almoço mas não voltou
      else if (saidaAlmoco) {
        const saidaAlmocoTime = new Date(saidaAlmoco);
        
        // Apenas manhã: entrada até saída almoço
        totalSegundos = Math.floor((saidaAlmocoTime - entradaTime) / 1000);
      }
      // Cenário 4: Ainda não saiu para almoço (tempo real desde entrada)
      else {
        // Desde entrada até agora (TEMPO REAL)
        totalSegundos = Math.floor((agora - entradaTime) / 1000);
      }

      // Garantir não negativo
      if (totalSegundos < 0) totalSegundos = 0;

      // Converter para horas, minutos, segundos
      const horas = Math.floor(totalSegundos / 3600);
      const minutos = Math.floor((totalSegundos % 3600) / 60);
      const segundos = totalSegundos % 60;

      setHorasTrabalhadasHoje({ horas, minutos, segundos });

      // Calcular tempo desde a entrada (entrada -> agora ou entrada -> saida_almoco se bateu almoço?)
      try {
        const agora = new Date();
        if (!entrada) {
          setDesdeEntrada({ horas: 0, minutos: 0, segundos: 0 });
        } else {
          const entradaTime = new Date(entrada);
          // Se já bateu saída final, calcular até a saída
          const fimParaDesde = saida ? new Date(saida) : agora;
          const totalSegDesde = Math.max(0, Math.floor((fimParaDesde - entradaTime) / 1000));
          const h = Math.floor(totalSegDesde / 3600);
          const m = Math.floor((totalSegDesde % 3600) / 60);
          const s = totalSegDesde % 60;
          setDesdeEntrada({ horas: h, minutos: m, segundos: s });
        }
      } catch (e) {
        console.error('Erro ao calcular desdeEntrada', e);
      }

      // Calcular tolerância para cada ponto comparando com horáriosEsperados
      try {
        const novo = { entrada: null, saida_almoco: null, retorno_almoco: null, saida: null };
        const esperado = horariosEsperados || {};

        if (entrada && esperado.entrada) {
          const v = validarTolerancia(combinarParaDate(esperado.entrada), entrada);
          novo.entrada = v;
        }
        if (saidaAlmoco && (esperado.almoco || esperado.saida)) {
          const horarioEsperado = esperado.almoco || esperado.saida;
          const v = validarTolerancia(combinarParaDate(horarioEsperado), saidaAlmoco);
          novo.saida_almoco = v;
        }
        if (retornoAlmoco && esperado.retorno) {
          const v = validarTolerancia(combinarParaDate(esperado.retorno), retornoAlmoco);
          novo.retorno_almoco = v;
        }
        if (saida && esperado.saida) {
          const v = validarTolerancia(combinarParaDate(esperado.saida), saida);
          novo.saida = v;
        }

        setTolerancias(novo);
      } catch (e) {
        console.error('Erro ao calcular tolerancias', e);
      }
    };

    calcularHoras();
    const interval = setInterval(calcularHoras, 1000);

    return () => clearInterval(interval);
  }, [registros]);

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
          } else {
            // Se não tem tipoEscala, usar padrão M (07:20-16:20)
            setTipoEscala('M');
            const horarios = obterHorariosEsperados('M', new Date());
            setHorariosEsperados(horarios);
          }
        } else {
          // Se não encontrar na collection, usar escala padrão
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
    if (!usuario?.id && !usuario?.uid) {
      return;
    }

    const userId = usuario.id || usuario.uid;
    const inicioDia = getInicioDia();
    const q = query(
      collection(db, 'pontos'),
      where('funcionarioId', '==', String(userId))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
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
          return;
        }

        // Verificar se o horário é válido
        const hora = formatHora(data.data);
        if (hora === '--:--' || hora === '00:00' || hora === '10:10') {
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
        // Apenas pontos de hoje e apenas se ainda não foi registrado
        if (dataPonto === hoje && !pontosHoje[data.tipo]) {
          pontosHoje[data.tipo] = dataObj;
        } else if (dataPonto !== hoje) {
        }
      });
      setRegistros((prev) =>
        prev.map((r) => {
          const novoHorario = pontosHoje[r.tipo] || null;
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
      }
    });

    return () => unsubscribe();
  }, [usuario?.id, usuario?.uid, horariosEsperados]);

  // Carregar histórico dos últimos 30 dias
  useEffect(() => {
    if (!usuario?.id && !usuario?.uid) {
      return;
    }

    const userId = usuario.id || usuario.uid;
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
            return false;
          }
          
          // Verificar se a data é válida
          const dataValida = new Date(ponto.data);
          if (isNaN(dataValida.getTime())) {
            return false;
          }
          
          // Verificar se tem horário válido (não é 00:00:00, --:-- ou 10:10)
          const hora = formatHora(ponto.data);
          if (hora === '--:--' || hora === '00:00' || hora === '10:10') {
            return false;
          }

          // Verificar se não é muito antigo (mais de 30 dias)
          const hoje = new Date();
          const trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (dataValida < trintaDiasAtras) {
            console.warn('🗑️ Histórico: Removendo ponto muito antigo (>30 dias):', ponto.id, formatData(ponto.data));
            return false;
          }
          return true;
        });
      
      // Ordenar por data mais recente
      pontos.sort((a, b) => new Date(b.data) - new Date(a.data));
      if (pontos.length === 0) {
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
        const horarioEsperadoStr = horariosEsperados[tipoValidacao];
        
        if (horarioEsperadoStr) {
          // Converter string "HH:mm" para Date completo
          const horarioEsperadoDate = combinarParaDate(horarioEsperadoStr);
          
          if (horarioEsperadoDate) {
            const validacao = validarTolerancia(horarioEsperadoDate, agora);
            // Se estiver fora da tolerância, avisar mas permitir
            if (!validacao.dentroTolerancia) {
              const msgTipo = validacao.tipo === 'adiantado' ? 'adiantado' : 'atrasado';
              showToast(
                `Atenção: Você está ${msgTipo} (${Math.abs(validacao.diferencaMinutos)} min). ${validacao.mensagem}`,
                'warning'
              );
              // Aguardar 2 segundos para o usuário ver o aviso
              await new Promise(resolve => setTimeout(resolve, 2000));
            } else if (validacao.tipo === 'hora_positiva') {
              showToast(`Hora positiva! Você chegou ${Math.abs(validacao.diferencaMinutos)} min antes. ⏰`, 'success');
            }
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
      await addDoc(collection(db, 'pontos'), pontoData);
      
      // Toast sem emoji conforme solicitado
      showToast(`Ponto registrado: ${registroAtual?.label} às ${formatHora(agora)}`, 'success');
      
    } catch (error) {
      console.error('❌ Erro ao bater ponto:', error);
      showToast('Erro ao registrar ponto: ' + error.message, 'error');
    } finally {
      setBatendo(false);
    }
  };

  // Carregar pontos quando a data de edição é selecionada
  useEffect(() => {
    if (!dataEdicao || !usuario?.id || !mostrarModalEdicao) return;

    const carregarPontosDia = async () => {
      try {
        const userId = usuario.id || usuario.uid;
        const q = query(
          collection(db, 'pontos'),
          where('funcionarioId', '==', String(userId))
        );

        const snapshot = await getDocs(q);
        
        const pontosDoDia = snapshot.docs
          .map(doc => doc.data())
          .filter(ponto => {
            const dataPonto = new Date(ponto.timestamp).toISOString().split('T')[0];
            return dataPonto === dataEdicao;
          });

        if (pontosDoDia.length > 0) {
          const pontosOrganizados = {
            entrada: '',
            saidaAlmoco: '',
            voltaAlmoco: '',
            saida: ''
          };

          pontosDoDia.forEach(ponto => {
            const hora = new Date(ponto.timestamp).toLocaleTimeString('pt-BR', { 
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

          setPontosEdicao(pontosOrganizados);
        } else {
          setPontosEdicao({
            entrada: '',
            saidaAlmoco: '',
            voltaAlmoco: '',
            saida: ''
          });
        }
      } catch (error) {
        console.error('Erro ao carregar pontos:', error);
      }
    };

    carregarPontosDia();
  }, [dataEdicao, usuario?.id, mostrarModalEdicao]);

  // Função para abrir modal de edição
  const abrirModalEdicao = () => {
    const hoje = new Date().toISOString().split('T')[0];
    setDataEdicao(hoje);
    setMostrarModalEdicao(true);
  };

  // Função para salvar pontos editados
  const salvarPontosEditados = async () => {
    if (!dataEdicao) {
      showToast('Selecione uma data válida', 'error');
      return;
    }

    // Validar formato de horários (HH:MM)
    const regexHorario = /^([01]\d|2[0-3]):([0-5]\d)$/;
    const pontosValidos = Object.entries(pontosEdicao).filter(([_, valor]) => valor !== '');
    
    for (const [campo, valor] of pontosValidos) {
      if (!regexHorario.test(valor)) {
        showToast(`Horário inválido no campo ${campo}. Use o formato HH:MM`, 'error');
        return;
      }
    }

    try {
      showToast('Salvando pontos...', 'info');
      
      const userId = usuario.id || usuario.uid;
      const { getDocs } = await import('firebase/firestore');
      
      // Buscar pontos existentes do dia
      const q = query(
        collection(db, 'pontos'),
        where('funcionarioId', '==', String(userId))
      );
      
      const snapshot = await getDocs(q);
      const pontosDoDia = snapshot.docs.filter(doc => {
        const data = doc.data();
        const dataPonto = new Date(data.timestamp).toISOString().split('T')[0];
        return dataPonto === dataEdicao;
      });

      // Deletar pontos antigos e criar novos
      const { deleteDoc, doc: firestoreDoc } = await import('firebase/firestore');
      
      for (const pontoDoc of pontosDoDia) {
        await deleteDoc(firestoreDoc(db, 'pontos', pontoDoc.id));
      }

      // Criar novos pontos com horários corrigidos
      const dataBase = new Date(dataEdicao);
      
      if (pontosEdicao.entrada) {
        const [hora, minuto] = pontosEdicao.entrada.split(':');
        const timestamp = new Date(dataBase);
        timestamp.setHours(parseInt(hora), parseInt(minuto), 0, 0);
        
        await addDoc(collection(db, 'pontos'), {
          funcionarioId: String(userId),
          funcionarioNome: usuario.nome || usuario.usuario || 'Sem nome',
          tipo: 'entrada',
          data: timestamp.toISOString(),
          timestamp: timestamp.getTime()
        });
      }

      if (pontosEdicao.saidaAlmoco) {
        const [hora, minuto] = pontosEdicao.saidaAlmoco.split(':');
        const timestamp = new Date(dataBase);
        timestamp.setHours(parseInt(hora), parseInt(minuto), 0, 0);
        
        await addDoc(collection(db, 'pontos'), {
          funcionarioId: String(userId),
          funcionarioNome: usuario.nome || usuario.usuario || 'Sem nome',
          tipo: 'saida_almoco',
          data: timestamp.toISOString(),
          timestamp: timestamp.getTime()
        });
      }

      if (pontosEdicao.voltaAlmoco) {
        const [hora, minuto] = pontosEdicao.voltaAlmoco.split(':');
        const timestamp = new Date(dataBase);
        timestamp.setHours(parseInt(hora), parseInt(minuto), 0, 0);
        
        await addDoc(collection(db, 'pontos'), {
          funcionarioId: String(userId),
          funcionarioNome: usuario.nome || usuario.usuario || 'Sem nome',
          tipo: 'retorno_almoco',
          data: timestamp.toISOString(),
          timestamp: timestamp.getTime()
        });
      }

      if (pontosEdicao.saida) {
        const [hora, minuto] = pontosEdicao.saida.split(':');
        const timestamp = new Date(dataBase);
        timestamp.setHours(parseInt(hora), parseInt(minuto), 0, 0);
        
        await addDoc(collection(db, 'pontos'), {
          funcionarioId: String(userId),
          funcionarioNome: usuario.nome || usuario.usuario || 'Sem nome',
          tipo: 'saida',
          data: timestamp.toISOString(),
          timestamp: timestamp.getTime()
        });
      }

      showToast('✓ Pontos corrigidos com sucesso!', 'success');
      setMostrarModalEdicao(false);
      setPontosEdicao({
        entrada: '',
        saidaAlmoco: '',
        voltaAlmoco: '',
        saida: ''
      });

      // Forçar atualização imediata dos registros
      // Aguardar um pouco para o Firestore processar
      setTimeout(() => {
        // O onSnapshot do historico já vai recarregar automaticamente
        // Mas vamos forçar recalculo dos registros de hoje
        const hoje = new Date().toISOString().split('T')[0];
        const pontosHoje = historico.filter(ponto => {
          const dataPonto = new Date(ponto.timestamp).toISOString().split('T')[0];
          return dataPonto === hoje;
        });

        // Atualizar registros localmente para recalculo imediato
        const novosRegistros = {
          entrada: { tipo: 'entrada', horario: null },
          saida_almoco: { tipo: 'saida_almoco', horario: null },
          retorno_almoco: { tipo: 'retorno_almoco', horario: null },
          saida: { tipo: 'saida', horario: null }
        };

        pontosHoje.forEach(ponto => {
          if (novosRegistros[ponto.tipo]) {
            novosRegistros[ponto.tipo].horario = new Date(ponto.timestamp);
          }
        });

        setRegistros([
          novosRegistros.entrada,
          novosRegistros.saida_almoco,
          novosRegistros.retorno_almoco,
          novosRegistros.saida
        ]);
      }, 500);
    } catch (error) {
      console.error('Erro ao salvar pontos:', error);
      showToast('Erro ao salvar pontos. Tente novamente.', 'error');
    }
  };

  return (
    <div>
      {/* Cabeçalho com relógio em tempo real */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <Clock className="w-6 h-6" /> Registro de Ponto
        </h2>

        {/* Contador de Ajustes (apenas para não-admin) */}
        {!isAdmin && ajustesMes && (
          <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-800/50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <div className="font-semibold text-yellow-900 dark:text-yellow-100">
                    Ajustes de Horário
                  </div>
                  <div className="text-xs text-yellow-700 dark:text-yellow-300">
                    Você pode ajustar seus horários até 4 vezes por mês
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${
                  ajustesMes.ajustesRestantes === 0 
                    ? 'text-red-600 dark:text-red-400' 
                    : ajustesMes.ajustesRestantes === 1 
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-yellow-900 dark:text-yellow-100'
                }`}>
                  {ajustesMes.ajustesRestantes}/4
                </div>
                <div className="text-xs text-yellow-700 dark:text-yellow-300">
                  restantes
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Layout responsivo: coluna em mobile, linha em desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Data e Hora juntas em mobile */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl px-6 py-4 shadow-lg">
            <div className="flex md:flex-col items-center md:items-start justify-between md:justify-start gap-4 md:gap-0">
              <div className="flex-1 md:mb-3">
                <div className="text-white text-sm font-semibold mb-1">Data Atual</div>
                <div className="text-white text-lg md:text-xl font-bold">{formatData(horaAtual)}</div>
              </div>
              <div className="flex-1 md:border-t md:border-white/20 md:pt-3">
                <div className="text-white text-sm font-semibold mb-1">Hora Atual</div>
                <div className="text-white text-xl md:text-2xl font-bold font-mono">
                  {horaAtual.toLocaleTimeString('pt-BR')}
                </div>
              </div>
            </div>
          </div>
          
          {/* Horas contabilizadas - destaque maior em mobile */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl px-6 py-4 shadow-lg md:col-span-2">
            <div className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Horas Contabilizadas Hoje
            </div>
            <div className="text-white text-3xl md:text-2xl font-bold font-mono text-center md:text-left">
              {String(horasTrabalhadasHoje.horas).padStart(2, '0')}h{' '}
              {String(horasTrabalhadasHoje.minutos).padStart(2, '0')}m{' '}
              {String(horasTrabalhadasHoje.segundos).padStart(2, '0')}s
            </div>
          </div>
        </div>
      </div>

      {/* Card de Horários Esperados */}
      {horariosEsperados && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-950 dark:to-blue-950 rounded-xl p-6 mb-6 shadow-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5" />
              Seu Horário Hoje {tipoEscala && <span className="text-sm bg-blue-200 dark:bg-blue-900 px-2 py-1 rounded">Escala {tipoEscala}</span>}
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-blue-900/30 rounded-lg p-4 text-center shadow-sm">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">Entrada</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 font-mono">
                {horariosEsperados.entrada || '--:--'}
              </div>
            </div>
            
            {/* Campo de Almoço - Clicável para editar */}
            <div className="bg-white dark:bg-blue-900/30 rounded-lg p-4 text-center shadow-sm">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">
                Almoço
              </div>
              {editandoAlmoco ? (
                <TimePickerCustom
                  value={horariosPersonalizados.almoco || horariosEsperados.almoco || '12:00'}
                  onChange={(novoHorario) => {
                    setHorariosPersonalizados(prev => ({
                      ...prev,
                      almoco: novoHorario
                    }));
                  }}
                  onSave={async (novoHorario) => {
                    // Verificar se pode ajustar (exceto admin)
                    if (!isAdmin) {
                      const pode = await podeAjustar(usuario.id);
                      if (!pode) {
                        showToast('❌ Você já usou todos os 4 ajustes permitidos este mês', 'error');
                        setEditandoAlmoco(false);
                        return;
                      }
                    }

                    // Salvar horários originais para histórico
                    const pontosOriginais = {
                      almoco: horariosPersonalizados.almoco || horariosEsperados.almoco,
                      retorno: horariosPersonalizados.retorno || horariosEsperados.retorno
                    };

                    const novosHorarios = {
                      ...horariosPersonalizados,
                      almoco: novoHorario
                    };
                    setHorariosPersonalizados(novosHorarios);
                    setHorariosEsperados({
                      ...horariosEsperados,
                      almoco: novoHorario
                    });
                    localStorage.setItem(`horariosPersonalizados_${usuario?.id}`, JSON.stringify(novosHorarios));

                    // Registrar ajuste (exceto admin)
                    if (!isAdmin) {
                      try {
                        const resultado = await registrarAjuste(
                          usuario.id,
                          'edicao_horario_almoco',
                          {
                            horarioAnterior: pontosOriginais.almoco,
                            horarioNovo: novoHorario,
                            campo: 'almoco',
                            data: new Date().toISOString()
                          },
                          pontosOriginais
                        );
                        showToast(`✓ Horário de almoço atualizado! (${resultado.ajustesRestantes} ajustes restantes)`, 'success');
                      } catch (error) {
                        showToast('❌ Erro ao registrar ajuste: ' + error.message, 'error');
                        setEditandoAlmoco(false);
                        return;
                      }
                    } else {
                      showToast('✓ Horário de almoço atualizado! (Admin)', 'success');
                    }
                    
                    setEditandoAlmoco(false);
                  }}
                  onCancel={() => setEditandoAlmoco(false)}
                  label="Horário do Almoço"
                  color="orange"
                />
              ) : (
                <button
                  onClick={() => setEditandoAlmoco(true)}
                  className="w-full text-center group"
                >
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 font-mono group-hover:scale-105 transition-transform">
                    {horariosPersonalizados.almoco || horariosEsperados.almoco || '12:00'}
                  </div>
                </button>
              )}
            </div>
            
            {/* Campo de Retorno - Clicável para editar */}
            <div className="bg-white dark:bg-blue-900/30 rounded-lg p-4 text-center shadow-sm">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">
                Retorno
              </div>
              {editandoRetorno ? (
                <TimePickerCustom
                  value={horariosPersonalizados.retorno || horariosEsperados.retorno || '13:00'}
                  onChange={(novoHorario) => {
                    setHorariosPersonalizados(prev => ({
                      ...prev,
                      retorno: novoHorario
                    }));
                  }}
                  onSave={async (novoHorario) => {
                    // Verificar se pode ajustar (exceto admin)
                    if (!isAdmin) {
                      const pode = await podeAjustar(usuario.id);
                      if (!pode) {
                        showToast('❌ Você já usou todos os 4 ajustes permitidos este mês', 'error');
                        setEditandoRetorno(false);
                        return;
                      }
                    }

                    // Salvar horários originais para histórico
                    const pontosOriginais = {
                      almoco: horariosPersonalizados.almoco || horariosEsperados.almoco,
                      retorno: horariosPersonalizados.retorno || horariosEsperados.retorno
                    };

                    const novosHorarios = {
                      ...horariosPersonalizados,
                      retorno: novoHorario
                    };
                    setHorariosPersonalizados(novosHorarios);
                    setHorariosEsperados({
                      ...horariosEsperados,
                      retorno: novoHorario
                    });
                    localStorage.setItem(`horariosPersonalizados_${usuario?.id}`, JSON.stringify(novosHorarios));

                    // Registrar ajuste (exceto admin)
                    if (!isAdmin) {
                      try {
                        const resultado = await registrarAjuste(
                          usuario.id,
                          'edicao_horario_retorno',
                          {
                            horarioAnterior: pontosOriginais.retorno,
                            horarioNovo: novoHorario,
                            campo: 'retorno',
                            data: new Date().toISOString()
                          },
                          pontosOriginais
                        );
                        showToast(`✓ Horário de retorno atualizado! (${resultado.ajustesRestantes} ajustes restantes)`, 'success');
                      } catch (error) {
                        showToast('❌ Erro ao registrar ajuste: ' + error.message, 'error');
                        setEditandoRetorno(false);
                        return;
                      }
                    } else {
                      showToast('✓ Horário de retorno atualizado! (Admin)', 'success');
                    }
                    
                    setEditandoRetorno(false);
                  }}
                  onCancel={() => setEditandoRetorno(false)}
                  label="Horário do Retorno"
                  color="green"
                />
              ) : (
                <button
                  onClick={() => setEditandoRetorno(true)}
                  className="w-full text-center group"
                >
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 font-mono group-hover:scale-105 transition-transform">
                    {horariosPersonalizados.retorno || horariosEsperados.retorno || '13:00'}
                  </div>
                </button>
              )}
            </div>
            
            <div className="bg-white dark:bg-blue-900/30 rounded-lg p-4 text-center shadow-sm">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">Saída</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 font-mono">
                {horariosEsperados.saida || '--:--'}
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 rounded-lg p-3">
            <strong>💡 Dica:</strong> Clique nos horários de <strong>Almoço</strong> e <strong>Retorno</strong> para editá-los. As alterações são salvas automaticamente.
            <br />
            <strong>Tolerância:</strong> Você pode bater ponto até 10 minutos antes ou depois do horário. 
            Fora desse período, será registrado como hora positiva (crédito) ou hora negativa (débito).
          </div>
        </div>
      )}

      {/* Card de Saldo do Dia */}
      {saldoDia && (
        <div className={`rounded-xl p-6 mb-6 shadow-lg border ${
          saldoDia.saldoMinutos >= 0 
            ? 'bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-950 dark:to-blue-950 border-blue-200 dark:border-blue-800'
            : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 border-red-200 dark:border-red-800'
        }`}>
          <h3 className={`font-bold mb-4 flex items-center gap-2 text-lg ${
            saldoDia.saldoMinutos >= 0 ? 'text-blue-900 dark:text-blue-100' : 'text-red-900 dark:text-red-100'
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
                saldoDia.saldoMinutos >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
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
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-lg flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Gerar Comprovante do Dia
            </button>
          </div>
        </div>
      )}

      {/* Histórico de Ajustes (somente para Admin) */}
      {isAdmin && ajustesMes && ajustesMes.historico && ajustesMes.historico.length > 0 && (
        <div className="mb-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 shadow-lg border-2 border-purple-200 dark:border-purple-700">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-purple-900 dark:text-purple-100">
            <Clock className="w-5 h-5" />
            Histórico de Ajustes de Horário (Admin)
          </h3>
          <div className="space-y-3">
            {ajustesMes.historico.slice().reverse().map((ajuste, index) => (
              <div key={index} className="bg-white dark:bg-gray-900/40 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-800/50 rounded">
                      <Edit2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {ajuste.tipo === 'edicao_horario_almoco' ? 'Horário de Almoço' : 'Horário de Retorno'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(ajuste.data).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                    <div className="text-xs text-red-600 dark:text-red-400 font-semibold mb-1">Antes</div>
                    <div className="text-lg font-mono font-bold text-red-700 dark:text-red-300">
                      {ajuste.detalhes.horarioAnterior || '--:--'}
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <div className="text-xs text-green-600 dark:text-green-400 font-semibold mb-1">Depois</div>
                    <div className="text-lg font-mono font-bold text-green-700 dark:text-green-300">
                      {ajuste.detalhes.horarioNovo || '--:--'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40 rounded-lg p-3">
            <strong>ℹ️ Informação:</strong> Como admin, você pode ver todo o histórico de ajustes de horário do funcionário. 
            Os ajustes não são descontados da sua conta.
          </div>
        </div>
      )}
      
      {/* Registros de Hoje */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {registros.map((r) => (
          <div key={r.tipo} className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 flex items-center gap-4 shadow-sm border-2 border-blue-200 dark:border-blue-700">
            <div className="p-2 bg-white dark:bg-blue-950 rounded-lg shadow-sm">
              {r.tipo === 'entrada' && <LogIn className="w-6 h-6 text-blue-600" />}
              {r.tipo === 'saida_almoco' && <Utensils className="w-6 h-6 text-orange-600" />}
              {r.tipo === 'retorno_almoco' && <ArrowRightLeft className="w-6 h-6 text-teal-600" />}
              {r.tipo === 'saida' && <LogOut className="w-6 h-6 text-red-600" />}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 dark:text-white text-lg mb-1">{r.label}</div>
              <div className="text-gray-600 dark:text-gray-300 text-sm">
                {r.horario ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base text-blue-700 dark:text-blue-300">{formatHora(r.horario)}</span>
                    {/* Indicador de tolerância */}
                    {tolerancias[r.tipo] && (
                      <span className="text-xs ml-2 rounded px-2 py-0.5 font-semibold" style={{
                        background: tolerancias[r.tipo].dentroTolerancia ? 'rgba(16,185,129,0.15)' : (tolerancias[r.tipo].tipo === 'atrasado' || tolerancias[r.tipo].tipo === 'adiantado' ? 'rgba(239,68,68,0.12)' : 'rgba(250,204,21,0.12)'),
                        color: tolerancias[r.tipo].dentroTolerancia ? '#10B981' : (tolerancias[r.tipo].tipo === 'atrasado' || tolerancias[r.tipo].tipo === 'adiantado' ? '#DC2626' : '#F59E0B')
                      }}>
                        {tolerancias[r.tipo].dentroTolerancia ? 'Dentro ±10m' : tolerancias[r.tipo].tipo === 'atrasado' ? 'Atrasado' : tolerancias[r.tipo].tipo === 'adiantado' ? 'Adiantado' : (tolerancias[r.tipo].tipo === 'hora_positiva' ? 'Hora positiva' : 'Hora negativa')}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="italic text-gray-400">Não registrado</span>
                )}
              </div>
            </div>
            <button
              className={`px-4 py-2 rounded-lg font-bold text-white transition-all ${r.horario ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg'} ${batendo ? 'opacity-60' : ''}`}
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
                          className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 dark:border-blue-700 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white dark:bg-blue-950 shadow-sm">
                              {ponto.tipo === 'entrada' && <LogIn className="w-5 h-5 text-blue-600" />}
                              {ponto.tipo === 'saida_almoco' && <Utensils className="w-5 h-5 text-orange-600" />}
                              {ponto.tipo === 'retorno_almoco' && <ArrowRightLeft className="w-5 h-5 text-teal-600" />}
                              {ponto.tipo === 'saida' && <LogOut className="w-5 h-5 text-red-600" />}
                            </div>
                            <div className="flex-1">
                              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                {ponto.tipo === 'entrada' ? 'Entrada' :
                                 ponto.tipo === 'saida_almoco' ? 'Saída Almoço' :
                                 ponto.tipo === 'retorno_almoco' ? 'Retorno' : 'Saída'}
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
        <strong>Como funciona:</strong> Você pode bater até 4 pontos por dia: início do trabalho, saída para almoço, retorno do almoço e saída do trabalho. Cada ponto só pode ser registrado uma vez por dia.
      </div>

      {/* Modal de Comprovante */}
      {showComprovanteModal && comprovanteData && (
        <ComprovantesPontoModal
          isOpen={showComprovanteModal}
          onClose={() => setShowComprovanteModal(false)}
          dados={comprovanteData}
        />
      )}

      {/* Modal de Edição de Pontos */}
      {mostrarModalEdicao && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setMostrarModalEdicao(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Cabeçalho */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit2 className="w-6 h-6" />
                <h3 className="text-xl font-bold">Corrigir Pontos do Dia</h3>
              </div>
              <button
                onClick={() => setMostrarModalEdicao(false)}
                className="hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                ×
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6 space-y-6">
              {/* Seletor de Data */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selecione a Data
                </label>
                <input
                  type="date"
                  value={dataEdicao}
                  onChange={(e) => setDataEdicao(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Campos de Horário */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    1º Ponto (Entrada)
                  </label>
                  <input
                    type="time"
                    value={pontosEdicao.entrada}
                    onChange={(e) => setPontosEdicao({...pontosEdicao, entrada: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    2º Ponto (Saída Almoço)
                  </label>
                  <input
                    type="time"
                    value={pontosEdicao.saidaAlmoco}
                    onChange={(e) => setPontosEdicao({...pontosEdicao, saidaAlmoco: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    3º Ponto (Volta Almoço)
                  </label>
                  <input
                    type="time"
                    value={pontosEdicao.voltaAlmoco}
                    onChange={(e) => setPontosEdicao({...pontosEdicao, voltaAlmoco: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-600" />
                    4º Ponto (Saída)
                  </label>
                  <input
                    type="time"
                    value={pontosEdicao.saida}
                    onChange={(e) => setPontosEdicao({...pontosEdicao, saida: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Informação */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-semibold mb-1">Como funciona:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Preencha apenas os pontos que deseja corrigir</li>
                      <li>• Deixe em branco os que não precisam ser alterados</li>
                      <li>• Use o formato 24 horas (ex: 14:30)</li>
                      <li>• A correção substitui os pontos existentes</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={salvarPontosEditados}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Salvar Correções
                </button>
                <button
                  onClick={() => setMostrarModalEdicao(false)}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkPontoTab;
