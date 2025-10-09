import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Clock,
  Edit3,
  Edit2,
  RefreshCw,
  Calendar,
  CheckCircle,
  Save,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ToastProvider';
import ModalComprovantes from '../Comprovantes/ModalComprovantes';
import TimePickerCustom from './TimePickerCustom';

const DetalhesHorasModal = ({ isOpen, onClose, funcionarioId, funcionarioNome }) => {
  const { usuario } = useAuth();
  const { showToast } = useToast();
  
  // Usar funcionarioId passado como prop ou o usuário logado
  const targetUserId = funcionarioId || usuario?.id;
  const targetUserName = funcionarioNome || usuario?.nome;
  
  // Estado para data selecionada (começa com hoje)
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [pontosDoMes, setPontosDoMes] = useState([]);
  
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
  const [campoParaEditar, setCampoParaEditar] = useState(null); // Qual campo está sendo editado inline
  const [mostrarComprovantes, setMostrarComprovantes] = useState(false);
  const [valorEdicao, setValorEdicao] = useState(''); // Valor temporário durante edição
  const [carregandoPontos, setCarregandoPontos] = useState(true); // Loading state

  // Buscar pontos do dia em tempo real - BUSCAR POR NOME
  useEffect(() => {
    if (!isOpen || !targetUserName) {
      setPontoDia(null);
      setCarregandoPontos(false);
      return;
    }

    setCarregandoPontos(true);
    
    // Buscar por NOME do funcionário
    const q = query(
      collection(db, 'pontos'),
      where('funcionarioNome', '==', targetUserName)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCarregandoPontos(false);
      
      // Data selecionada no formato ISO
      const dataStr = dataSelecionada.toISOString().split('T')[0];
      
      const pontosDia = {
        entrada: null,
        saidaAlmoco: null,
        voltaAlmoco: null,
        saida: null
      };

      // Processar apenas os documentos relevantes
      snapshot.docs.forEach((doc) => {
        const pontoData = doc.data();
        
        if (!pontoData?.tipo) return;
        
        // Converter a data do ponto
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
        
        // Comparar datas no formato YYYY-MM-DD
        const dataPontoStr = dataPonto.toISOString().split('T')[0];
        
        // Apenas pontos da data selecionada
        if (dataPontoStr === dataStr) {
          const hora = dataPonto.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          });

          if (hora === '--:--' || hora === '00:00') return;

          switch(pontoData.tipo) {
            case 'entrada':
              if (!pontosDia.entrada) pontosDia.entrada = hora;
              break;
            case 'saida_almoco':
              if (!pontosDia.saidaAlmoco) pontosDia.saidaAlmoco = hora;
              break;
            case 'retorno_almoco':
              if (!pontosDia.voltaAlmoco) pontosDia.voltaAlmoco = hora;
              break;
            case 'saida':
              if (!pontosDia.saida) pontosDia.saida = hora;
              break;
          }
        }
      });

      setPontoDia(pontosDia);
    }, (error) => {
      console.error('❌ Erro ao buscar pontos do dia:', error);
      showToast('Erro ao carregar pontos do dia', 'error');
    });

    return () => unsubscribe();
  }, [isOpen, targetUserName, dataSelecionada, showToast]);

  // Calcular horas trabalhadas em tempo real (ou total do dia se não for hoje)
  useEffect(() => {
    if (!isOpen || !pontoDia) {
      return;
    }

    const calcularTempoReal = () => {
      // Se não for hoje E já tiver saída final, usar horário de saída ao invés de agora
      const hoje = ehHoje();
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
    
    // Só atualizar em tempo real se for hoje
    if (ehHoje()) {
      const interval = setInterval(calcularTempoReal, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, pontoDia, dataSelecionada]);

  // Carregar pontos quando abre modal de edição - Usar dados já carregados do pontoDia
  useEffect(() => {
    if (!mostrarModalEdicao || !pontoDia) return;
    // Usar os dados já carregados em tempo real do pontoDia
    const pontosOrganizados = {
      entrada: pontoDia.entrada || '',
      saidaAlmoco: pontoDia.saidaAlmoco || '',
      voltaAlmoco: pontoDia.voltaAlmoco || '',
      saida: pontoDia.saida || ''
    };
    setPontosEdicao(pontosOrganizados);
  }, [mostrarModalEdicao, pontoDia]);

  // Funções de navegação entre dias
  const irParaDiaAnterior = () => {
    const novaData = new Date(dataSelecionada);
    novaData.setDate(novaData.getDate() - 1);
    setDataSelecionada(novaData);
  };

  const irParaProximoDia = () => {
    const novaData = new Date(dataSelecionada);
    novaData.setDate(novaData.getDate() + 1);
    setDataSelecionada(novaData);
  };

  const irParaHoje = () => {
    setDataSelecionada(new Date());
  };

  const ehHoje = () => {
    const hoje = new Date();
    return dataSelecionada.toDateString() === hoje.toDateString();
  };

  // Buscar todos os pontos do mês para o calendário - APENAS quando calendário for aberto
  const buscarPontosDoMes = async () => {
    if (!targetUserName || !isOpen || !mostrarCalendario) return;

    try {
      const primeiroDia = new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth(), 1);
      const ultimoDia = new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth() + 1, 0);

      const q = query(
        collection(db, 'pontos'),
        where('funcionarioNome', '==', targetUserName)
      );

      const snapshot = await getDocs(q);
      
      // Agrupar por dia e calcular saldo
      const pontosPorDia = {};
      snapshot.docs.forEach(doc => {
        const ponto = doc.data();
        const data = ponto.data?.toDate ? ponto.data.toDate() : new Date(ponto.timestamp || ponto.data);
        
        // Filtrar apenas pontos do mês atual
        if (data >= primeiroDia && data <= ultimoDia) {
          const dataKey = data.toISOString().split('T')[0];
          
          if (!pontosPorDia[dataKey]) {
            pontosPorDia[dataKey] = {
              data: dataKey,
              entrada: null,
              saidaAlmoco: null,
              voltaAlmoco: null,
              saida: null,
              totalMinutos: 0,
              saldoMinutos: 0
            };
          }
          
          pontosPorDia[dataKey][ponto.tipo] = data;
        }
      });

      // Calcular minutos trabalhados e saldo para cada dia
      Object.keys(pontosPorDia).forEach(dataKey => {
        const dia = pontosPorDia[dataKey];
        let minutos = 0;

        if (dia.saidaAlmoco && dia.entrada) {
          minutos += (dia.saidaAlmoco - dia.entrada) / (1000 * 60);
        }
        if (dia.saida && dia.voltaAlmoco) {
          minutos += (dia.saida - dia.voltaAlmoco) / (1000 * 60);
        }

        dia.totalMinutos = Math.round(minutos);
        // Assumindo 8 horas esperadas por dia (480 minutos)
        dia.saldoMinutos = dia.totalMinutos - 480;
      });

      setPontosDoMes(Object.values(pontosPorDia));
    } catch (error) {
      console.error('❌ Erro ao buscar pontos do mês:', error);
    }
  };

  // Atualizar pontos do mês APENAS quando calendário estiver aberto
  useEffect(() => {
    if (mostrarCalendario && isOpen) {
      buscarPontosDoMes();
    }
  }, [mostrarCalendario, dataSelecionada.getMonth(), dataSelecionada.getFullYear(), isOpen]);

  const formatarDataExibicao = () => {
    if (ehHoje()) {
      return 'Hoje';
    }
    
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    if (dataSelecionada.toDateString() === ontem.toDateString()) {
      return 'Ontem';
    }
    
    return dataSelecionada.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Função para iniciar edição inline de um campo específico
  const iniciarEdicaoInline = (campo, valorAtual) => {
    setCampoParaEditar(campo);
    setValorEdicao(valorAtual || '');
  };

  // Função para cancelar edição inline
  const cancelarEdicaoInline = () => {
    setCampoParaEditar(null);
    setValorEdicao('');
  };

  // Função para salvar edição inline de um campo específico
  const salvarEdicaoInline = async (campo, novoValor) => {
    if (!campo || !dataSelecionada || !targetUserId || !targetUserName) {
      console.error('❌ Dados inválidos:', { campo, dataSelecionada, targetUserId, targetUserName });
      showToast('Erro: dados inválidos', 'error');
      setCampoParaEditar(null);
      return;
    }

    // Garantir que o valor está no formato correto
    const valorParaSalvar = novoValor !== undefined ? novoValor : valorEdicao;
    const dataEdicaoStr = dataSelecionada.toISOString().split('T')[0];

    try {
      // Remover ponto antigo deste tipo
      const tipoMap = {
        entrada: 'entrada',
        saidaAlmoco: 'saida_almoco',
        voltaAlmoco: 'retorno_almoco',
        saida: 'saida'
      };
      
      const tipoPonto = tipoMap[campo];
      
      const q = query(
        collection(db, 'pontos'),
        where('funcionarioNome', '==', targetUserName),
        where('tipo', '==', tipoPonto)
      );
      
      const snapshot = await getDocs(q);
      
      // Filtrar pontos do dia selecionado
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
        return dataPontoStr === dataEdicaoStr;
      });

      // Remover pontos antigos
      for (const doc of pontosParaRemover) {
        await deleteDoc(doc.ref);
      }

      // Se o valor não está vazio, adicionar novo ponto
      if (valorParaSalvar && valorParaSalvar.trim() !== '' && valorParaSalvar !== '--:--') {
        // Validar formato - aceita tanto "7:20" quanto "07:20"
        const valorTrimmed = valorParaSalvar.trim();
        const horaMatch = valorTrimmed.match(/^(\d{1,2}):(\d{1,2})$/);
        
        if (!horaMatch) {
          console.error('❌ Formato inválido:', valorTrimmed, '- Esperado: HH:MM ou H:M');
          showToast('Formato inválido. Use HH:MM', 'error');
          setCampoParaEditar(null);
          setValorEdicao('');
          return;
        }

        // Converter para números e garantir 2 dígitos
        let [hora, minuto] = valorTrimmed.split(':').map(Number);
        // Validar se são números válidos
        if (isNaN(hora) || isNaN(minuto)) {
          console.error('❌ NaN detectado:', { hora, minuto, valorOriginal: valorTrimmed });
          showToast('Horário inválido: valores não numéricos', 'error');
          setCampoParaEditar(null);
          setValorEdicao('');
          return;
        }

        // Validar ranges
        if (hora < 0 || hora > 23 || minuto < 0 || minuto > 59) {
          console.error('❌ Valores fora do range:', { hora, minuto });
          showToast(`Horário inválido: hora deve ser 0-23, minuto 0-59`, 'error');
          setCampoParaEditar(null);
          setValorEdicao('');
          return;
        }

        // Garantir 2 dígitos
        const horaFormatada = String(hora).padStart(2, '0');
        const minutoFormatado = String(minuto).padStart(2, '0');
        const [ano, mes, dia] = dataEdicaoStr.split('-').map(Number);
        
        if (isNaN(ano) || isNaN(mes) || isNaN(dia)) {
          console.error('❌ Data inválida:', { dataEdicaoStr, ano, mes, dia });
          showToast('Data inválida', 'error');
          setCampoParaEditar(null);
          setValorEdicao('');
          return;
        }
        const data = new Date(ano, mes - 1, dia, hora, minuto, 0, 0);

        if (isNaN(data.getTime())) {
          console.error('❌ Data criada é NaN:', { 
            input: { ano, mes, dia, hora, minuto },
            data: data.toString(),
            timestamp: data.getTime()
          });
          showToast('Erro ao criar data', 'error');
          setCampoParaEditar(null);
          setValorEdicao('');
          return;
        }

        const novoPonto = {
          funcionarioId: String(targetUserId),
          funcionarioNome: String(targetUserName),
          tipo: tipoPonto,
          data: data.toISOString(),
          timestamp: data.getTime()
        };
        await addDoc(collection(db, 'pontos'), novoPonto);
        showToast('✅ Ponto atualizado!', 'success');
      } else {
        showToast('Ponto removido', 'success');
      }

      // Limpar edição
      setCampoParaEditar(null);
      setValorEdicao('');
    } catch (error) {
      console.error('❌ ERRO CAPTURADO ao salvar:');
      console.error('  Mensagem:', error.message);
      console.error('  Stack:', error.stack);
      console.error('  Error completo:', error);
      
      showToast('Erro ao salvar: ' + error.message, 'error');
      
      // Limpar estado mesmo com erro
      setCampoParaEditar(null);
      setValorEdicao('');
    }
  };

  const abrirModalEdicao = () => {
    try {
      if (!dataSelecionada) {
        console.error('❌ Data selecionada não definida');
        showToast('Erro: data não definida', 'error');
        return;
      }
      
      const dataFormatada = dataSelecionada.toISOString().split('T')[0];
      setDataEdicao(dataFormatada);
      setMostrarModalEdicao(true);
    } catch (error) {
      console.error('❌ Erro ao abrir modal de edição:', error);
      showToast('Erro ao abrir editor de pontos: ' + error.message, 'error');
    }
  };

  const salvarPontosEditados = async () => {
    if (!dataEdicao) {
      showToast('Selecione uma data', 'error');
      return;
    }

    // Validações iniciais
    if (!targetUserId || !targetUserName) {
      console.error('❌ Dados do funcionário inválidos:', { targetUserId, targetUserName });
      showToast('Erro: dados do funcionário não encontrados', 'error');
      return;
    }

    // Limpar valores inválidos - campos vazios serão ignorados (ponto não batido)
    const pontosLimpos = {
      entrada: pontosEdicao.entrada && pontosEdicao.entrada.trim() !== '' && pontosEdicao.entrada !== '--:--' ? pontosEdicao.entrada.trim() : '',
      saidaAlmoco: pontosEdicao.saidaAlmoco && pontosEdicao.saidaAlmoco.trim() !== '' && pontosEdicao.saidaAlmoco !== '--:--' ? pontosEdicao.saidaAlmoco.trim() : '',
      voltaAlmoco: pontosEdicao.voltaAlmoco && pontosEdicao.voltaAlmoco.trim() !== '' && pontosEdicao.voltaAlmoco !== '--:--' ? pontosEdicao.voltaAlmoco.trim() : '',
      saida: pontosEdicao.saida && pontosEdicao.saida.trim() !== '' && pontosEdicao.saida !== '--:--' ? pontosEdicao.saida.trim() : ''
    };
    // Verificar se pelo menos um ponto foi preenchido
    const temPontoPreenchido = Object.values(pontosLimpos).some(
      hora => hora && hora.trim() !== ''
    );
    
    if (!temPontoPreenchido) {
      showToast('Preencha pelo menos um horário válido', 'error');
      return;
    }

    try {
      // Remover pontos antigos do dia selecionado
      const q = query(
        collection(db, 'pontos'),
        where('funcionarioNome', '==', targetUserName)
      );
      
      const snapshot = await getDocs(q);
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
        }
        return match;
      });
      // Remover pontos antigos
      for (const doc of pontosParaRemover) {
        try {
          await deleteDoc(doc.ref);
        } catch (deleteError) {
          console.error('❌ Erro ao deletar ponto:', doc.id, deleteError);
          throw new Error(`Erro ao remover ponto antigo: ${deleteError.message}`);
        }
      }

      // Adicionar novos pontos (usando pontos limpos)
      const pontosParaAdicionar = [
        { tipo: 'entrada', hora: pontosLimpos.entrada },
        { tipo: 'saida_almoco', hora: pontosLimpos.saidaAlmoco },
        { tipo: 'retorno_almoco', hora: pontosLimpos.voltaAlmoco },
        { tipo: 'saida', hora: pontosLimpos.saida },
      ];

      let pontosAdicionados = 0;
      let pontosIgnorados = 0;
      
      for (const ponto of pontosParaAdicionar) {
        // Pular se hora estiver vazia, for "--:--" ou inválida (ponto não batido)
        if (!ponto.hora || ponto.hora.trim() === '' || ponto.hora === '--:--') {
          pontosIgnorados++;
          continue;
        }
        
        try {
          // Validar formato da hora
          const horaMatch = ponto.hora.match(/^(\d{2}):(\d{2})$/);
          if (!horaMatch) {
            console.error('❌ Formato de hora inválido:', ponto.hora);
            throw new Error(`Formato de hora inválido: ${ponto.hora}. Use HH:MM`);
          }

          const [hora, minuto] = ponto.hora.split(':').map(Number);
          
          // Validar valores de hora e minuto
          if (isNaN(hora) || isNaN(minuto)) {
            throw new Error(`Valores inválidos na hora: ${ponto.hora}`);
          }
          
          if (hora < 0 || hora > 23) {
            throw new Error(`Hora inválida: ${hora}. Deve estar entre 0 e 23`);
          }
          if (minuto < 0 || minuto > 59) {
            throw new Error(`Minuto inválido: ${minuto}. Deve estar entre 0 e 59`);
          }
          
          // Criar data usando o formato correto para evitar problemas de fuso horário
          const [ano, mes, dia] = dataEdicao.split('-').map(Number);
          
          if (isNaN(ano) || isNaN(mes) || isNaN(dia)) {
            throw new Error(`Data inválida: ${dataEdicao}`);
          }
          
          const data = new Date(ano, mes - 1, dia, hora, minuto, 0, 0);

          // Validar se a data foi criada corretamente
          if (isNaN(data.getTime())) {
            throw new Error(`Data inválida criada: ${dataEdicao} ${ponto.hora}`);
          }

          const novoPonto = {
            funcionarioId: String(targetUserId),
            funcionarioNome: String(targetUserName),
            tipo: ponto.tipo,
            data: data.toISOString(),
            timestamp: data.getTime()
          };
          const docRef = await addDoc(collection(db, 'pontos'), novoPonto);
          pontosAdicionados++;
        } catch (addError) {
          console.error(`❌ Erro ao adicionar ponto ${ponto.tipo}:`, addError);
          throw new Error(`Erro ao adicionar ${ponto.tipo}: ${addError.message}`);
        }
      }

      if (pontosAdicionados === 0) {
        showToast('Nenhum ponto foi salvo. Todos os campos estão vazios (pontos não batidos).', 'warning');
        return;
      }
      const mensagem = pontosIgnorados > 0 
        ? `✅ ${pontosAdicionados} ponto(s) salvo(s). ${pontosIgnorados} não batido(s) (ignorados).`
        : `✅ Pontos atualizados com sucesso! ${pontosAdicionados} registro(s) salvo(s).`;
      
      showToast(mensagem, 'success');
      setMostrarModalEdicao(false);
      
      // Recarregar dados após salvar
      if (typeof carregarPontosDia === 'function') {
        carregarPontosDia();
      }
    } catch (error) {
      console.error('❌ Erro ao salvar pontos:', error);
      console.error('Stack trace:', error.stack);
      
      // Mensagem de erro mais específica
      let mensagemErro = 'Erro ao salvar pontos. ';
      if (error.code === 'permission-denied') {
        mensagemErro += 'Você não tem permissão para editar pontos.';
      } else if (error.message) {
        mensagemErro += error.message;
      } else {
        mensagemErro += 'Tente novamente.';
      }
      
      showToast(mensagemErro, 'error');
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
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-t-2xl sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
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

                {/* Navegação de Data */}
                <div className="flex items-center justify-between gap-3 bg-white/50 dark:bg-gray-800/50 rounded-xl p-3">
                  <button
                    onClick={irParaDiaAnterior}
                    className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                    title="Dia anterior"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </button>
                  
                  <button
                    onClick={() => setMostrarCalendario(!mostrarCalendario)}
                    className="flex-1 text-center hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg px-3 py-2 transition-colors cursor-pointer group"
                    title="Abrir calendário"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <div className="text-lg font-bold text-gray-900 dark:text-white capitalize group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {formatarDataExibicao()}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {dataSelecionada.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </div>
                  </button>
                  
                  <div className="flex items-center gap-2">
                    {!ehHoje() && (
                      <button
                        onClick={irParaHoje}
                        className="px-3 py-1.5 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      >
                        Hoje
                      </button>
                    )}
                    <button
                      onClick={irParaProximoDia}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                      title="Próximo dia"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                  </div>
                </div>

                {/* Calendário do Mês */}
                <AnimatePresence>
                  {mostrarCalendario && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-inner">
                        <div className="grid grid-cols-7 gap-2">
                          {/* Cabeçalho dos dias da semana */}
                          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
                            <div key={dia} className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2">
                              {dia}
                            </div>
                          ))}
                          
                          {/* Dias do mês */}
                          {(() => {
                            const primeiroDia = new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth(), 1);
                            const ultimoDia = new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth() + 1, 0);
                            const diasVaziosInicio = primeiroDia.getDay();
                            const diasDoMes = ultimoDia.getDate();
                            const hoje = new Date();
                            
                            const dias = [];
                            
                            // Dias vazios do início
                            for (let i = 0; i < diasVaziosInicio; i++) {
                              dias.push(<div key={`empty-${i}`} className="aspect-square" />);
                            }
                            
                            // Dias do mês
                            for (let dia = 1; dia <= diasDoMes; dia++) {
                              const dataCompleta = new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth(), dia);
                              const dataKey = dataCompleta.toISOString().split('T')[0];
                              const pontoDoDia = pontosDoMes.find(p => p.data === dataKey);
                              const ehDataSelecionada = dataCompleta.toDateString() === dataSelecionada.toDateString();
                              const ehHojeDia = dataCompleta.toDateString() === hoje.toDateString();
                              const temPontos = pontoDoDia && pontoDoDia.totalMinutos > 0;
                              const saldoPositivo = pontoDoDia && pontoDoDia.saldoMinutos >= 0;
                              
                              dias.push(
                                <button
                                  key={dia}
                                  onClick={() => {
                                    setDataSelecionada(dataCompleta);
                                    setMostrarCalendario(false);
                                  }}
                                  className={`
                                    aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all
                                    ${ehDataSelecionada 
                                      ? 'bg-blue-600 text-white font-bold shadow-lg scale-110' 
                                      : ehHojeDia
                                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                                      : temPontos
                                      ? saldoPositivo
                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30'
                                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30'
                                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }
                                  `}
                                  title={
                                    temPontos
                                      ? `${Math.floor(pontoDoDia.totalMinutos / 60)}h ${pontoDoDia.totalMinutos % 60}m trabalhadas\n${saldoPositivo ? '+' : ''}${Math.floor(Math.abs(pontoDoDia.saldoMinutos) / 60)}h ${Math.abs(pontoDoDia.saldoMinutos) % 60}m de saldo`
                                      : 'Sem registro'
                                  }
                                >
                                  <span>{dia}</span>
                                  {temPontos && (
                                    <span className={`text-[10px] font-bold mt-0.5 ${
                                      ehDataSelecionada ? 'text-white' : ''
                                    }`}>
                                      {Math.floor(pontoDoDia.totalMinutos / 60)}h
                                    </span>
                                  )}
                                </button>
                              );
                            }
                            
                            return dias;
                          })()}
                        </div>
                        
                        {/* Legenda */}
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-center gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700"></div>
                            <span className="text-gray-600 dark:text-gray-400">Horas positivas</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700"></div>
                            <span className="text-gray-600 dark:text-gray-400">Horas negativas</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-blue-600"></div>
                            <span className="text-gray-600 dark:text-gray-400">Dia atual</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Conteúdo */}
              <div className="p-6 space-y-6">
                {carregandoPontos ? (
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
                ) : !pontoDia ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nenhum ponto registrado
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nesta data ainda não há registros
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Relógio em Tempo Real / Total do Dia */}
                    <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 dark:from-blue-600 dark:via-blue-700 dark:to-blue-900 rounded-2xl p-6 shadow-2xl">
                      <div className="text-center mb-4">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          {ehHoje() ? (
                            <RefreshCw className="w-5 h-5 text-white/80 animate-spin" style={{ animationDuration: '3s' }} />
                          ) : (
                            <Clock className="w-5 h-5 text-white/80" />
                          )}
                          <span className="text-white/90 text-sm font-medium uppercase tracking-wide">
                            {ehHoje() ? 'Tempo Real' : 'Total do Dia'}
                          </span>
                        </div>
                        {!pontoDia.entrada ? (
                          <div className="py-4">
                            <div className="text-3xl md:text-4xl font-bold text-white/90 mb-2">
                              Nenhum ponto registrado
                            </div>
                            <div className="text-white/70 text-sm">
                              {targetUserName} não bateu ponto de entrada {ehHoje() ? 'hoje' : 'neste dia'}
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-6xl md:text-7xl font-bold text-white font-mono tracking-tight">
                              {String(tempoReal.horas).padStart(2, '0')}h{' '}
                              {String(tempoReal.minutos).padStart(2, '0')}m{' '}
                              {ehHoje() && (
                                <span className="text-5xl md:text-6xl text-white/90">
                                  {String(tempoReal.segundos).padStart(2, '0')}s
                                </span>
                              )}
                            </div>
                            <div className="text-white/80 text-sm mt-2">
                              {ehHoje() ? 'Horas contabilizadas hoje' : 'Total de horas trabalhadas'}
                            </div>
                          </>
                        )}
                      </div>
                  
                      {/* Botão de Ações */}
                      <div className="mt-4">
                        <button
                          onClick={() => setMostrarComprovantes(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all backdrop-blur-sm border border-white/30 hover:scale-105 transform"
                        >
                          <FileText className="w-5 h-5" />
                          <span>Gerar Comprovante</span>
                        </button>
                      </div>
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
                          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border-2 border-green-500 shadow-lg shadow-green-500/20">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center justify-between">
                              <span>1º Ponto - Entrada</span>
                              {pontoDia.entrada && <CheckCircle className="w-4 h-4 text-green-500" />}
                            </div>
                            
                            {campoParaEditar === 'entrada' ? (
                              <TimePickerCustom
                                value={valorEdicao}
                                onChange={(value) => setValorEdicao(value)}
                                onSave={(value) => salvarEdicaoInline('entrada', value)}
                                onCancel={cancelarEdicaoInline}
                                label="1º Ponto - Entrada"
                                color="green"
                              />
                            ) : (
                              <button
                                onClick={() => iniciarEdicaoInline('entrada', pontoDia.entrada)}
                                className="w-full text-left group"
                              >
                                <div className={`text-2xl font-bold font-mono group-hover:scale-105 transition-transform ${
                                  pontoDia.entrada 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                  {pontoDia.entrada || '--:--'}
                                </div>
                              </button>
                            )}
                          </div>

                          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border-2 border-orange-500 shadow-lg shadow-orange-500/20">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center justify-between">
                              <span>2º Ponto - Saída Almoço</span>
                              {pontoDia.saidaAlmoco && <CheckCircle className="w-4 h-4 text-orange-500" />}
                            </div>
                            
                            {campoParaEditar === 'saidaAlmoco' ? (
                              <TimePickerCustom
                                value={valorEdicao}
                                onChange={(value) => setValorEdicao(value)}
                                onSave={(value) => salvarEdicaoInline('saidaAlmoco', value)}
                                onCancel={cancelarEdicaoInline}
                                label="2º Ponto - Saída Almoço"
                                color="orange"
                              />
                            ) : (
                              <button
                                onClick={() => iniciarEdicaoInline('saidaAlmoco', pontoDia.saidaAlmoco)}
                                className="w-full text-left group"
                              >
                                <div className={`text-2xl font-bold font-mono group-hover:scale-105 transition-transform ${
                                  pontoDia.saidaAlmoco 
                                    ? 'text-orange-600 dark:text-orange-400' 
                                    : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                  {pontoDia.saidaAlmoco || '--:--'}
                                </div>
                              </button>
                            )}
                          </div>

                          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border-2 border-blue-500 shadow-lg shadow-blue-500/20">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center justify-between">
                              <span>3º Ponto - Volta Almoço</span>
                              {pontoDia.voltaAlmoco && <CheckCircle className="w-4 h-4 text-blue-500" />}
                            </div>
                            
                            {campoParaEditar === 'voltaAlmoco' ? (
                              <TimePickerCustom
                                value={valorEdicao}
                                onChange={(value) => setValorEdicao(value)}
                                onSave={(value) => salvarEdicaoInline('voltaAlmoco', value)}
                                onCancel={cancelarEdicaoInline}
                                label="3º Ponto - Volta Almoço"
                                color="blue"
                              />
                            ) : (
                              <button
                                onClick={() => iniciarEdicaoInline('voltaAlmoco', pontoDia.voltaAlmoco)}
                                className="w-full text-left group"
                              >
                                <div className={`text-2xl font-bold font-mono group-hover:scale-105 transition-transform ${
                                  pontoDia.voltaAlmoco 
                                    ? 'text-blue-600 dark:text-blue-400' 
                                    : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                  {pontoDia.voltaAlmoco || '--:--'}
                                </div>
                              </button>
                            )}
                          </div>

                          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border-2 border-red-500 shadow-lg shadow-red-500/20">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center justify-between">
                              <span>4º Ponto - Saída</span>
                              {pontoDia.saida && <CheckCircle className="w-4 h-4 text-red-500" />}
                            </div>
                            
                            {campoParaEditar === 'saida' ? (
                              <TimePickerCustom
                                value={valorEdicao}
                                onChange={(value) => setValorEdicao(value)}
                                onSave={(value) => salvarEdicaoInline('saida', value)}
                                onCancel={cancelarEdicaoInline}
                                label="4º Ponto - Saída"
                                color="red"
                              />
                            ) : (
                              <button
                                onClick={() => iniciarEdicaoInline('saida', pontoDia.saida)}
                                className="w-full text-left group"
                              >
                                <div className={`text-2xl font-bold font-mono group-hover:scale-105 transition-transform ${
                                  pontoDia.saida 
                                    ? 'text-red-600 dark:text-red-400' 
                                    : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                  {pontoDia.saida || '--:--'}
                                </div>
                              </button>
                            )}
                          </div>
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

                {campoParaEditar ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      ✏️ <strong>Editando apenas:</strong> {
                        campoParaEditar === 'entrada' ? '1º Ponto - Entrada' :
                        campoParaEditar === 'saidaAlmoco' ? '2º Ponto - Saída Almoço' :
                        campoParaEditar === 'voltaAlmoco' ? '3º Ponto - Volta Almoço' :
                        '4º Ponto - Saída'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      💡 <strong>Dica:</strong> Deixe o campo vazio para remover um registro de ponto.
                    </p>
                  </div>
                )}

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
                    <div className={`transition-all ${
                      campoFocado === 'entrada' ? 'scale-105' : ''
                    } ${
                      campoParaEditar && campoParaEditar !== 'entrada' ? 'opacity-40' : ''
                    }`}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        1º - Entrada
                        {campoParaEditar === 'entrada' && (
                          <span className="ml-auto text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full">Editando</span>
                        )}
                      </label>
                      <input
                        type="time"
                        value={pontosEdicao.entrada || ''}
                        onChange={(e) => {
                          const valor = e.target.value || '';
                          setPontosEdicao({ ...pontosEdicao, entrada: valor });
                        }}
                        onFocus={() => setCampoFocado('entrada')}
                        onBlur={() => setCampoFocado(null)}
                        disabled={campoParaEditar && campoParaEditar !== 'entrada'}
                        className={`w-full px-4 py-3 border-2 rounded-lg font-mono text-lg transition-all ${
                          campoParaEditar === 'entrada'
                            ? 'border-yellow-500 ring-4 ring-yellow-500/30 bg-yellow-50 dark:bg-yellow-900/20'
                            : 'border-green-300 dark:border-green-600 bg-white dark:bg-gray-800'
                        } ${
                          campoParaEditar && campoParaEditar !== 'entrada'
                            ? 'cursor-not-allowed opacity-50'
                            : ''
                        } text-gray-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20`}
                        autoFocus={campoParaEditar === 'entrada' || (!campoParaEditar && !pontoDia?.entrada)}
                      />
                    </div>

                    <div className={`transition-all ${
                      campoFocado === 'saidaAlmoco' ? 'scale-105' : ''
                    } ${
                      campoParaEditar && campoParaEditar !== 'saidaAlmoco' ? 'opacity-40' : ''
                    }`}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        2º - Saída Almoço
                        {campoParaEditar === 'saidaAlmoco' && (
                          <span className="ml-auto text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full">Editando</span>
                        )}
                      </label>
                      <input
                        type="time"
                        value={pontosEdicao.saidaAlmoco || ''}
                        onChange={(e) => {
                          const valor = e.target.value || '';
                          setPontosEdicao({ ...pontosEdicao, saidaAlmoco: valor });
                        }}
                        onFocus={() => setCampoFocado('saidaAlmoco')}
                        onBlur={() => setCampoFocado(null)}
                        disabled={campoParaEditar && campoParaEditar !== 'saidaAlmoco'}
                        className={`w-full px-4 py-3 border-2 rounded-lg font-mono text-lg transition-all ${
                          campoParaEditar === 'saidaAlmoco'
                            ? 'border-yellow-500 ring-4 ring-yellow-500/30 bg-yellow-50 dark:bg-yellow-900/20'
                            : 'border-orange-300 dark:border-orange-600 bg-white dark:bg-gray-800'
                        } ${
                          campoParaEditar && campoParaEditar !== 'saidaAlmoco'
                            ? 'cursor-not-allowed opacity-50'
                            : ''
                        } text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20`}
                        autoFocus={campoParaEditar === 'saidaAlmoco'}
                      />
                    </div>

                    <div className={`transition-all ${campoFocado === 'voltaAlmoco' ? 'scale-105' : ''}`}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        3º - Volta Almoço
                      </label>
                      <input
                        type="time"
                        value={pontosEdicao.voltaAlmoco || ''}
                        onChange={(e) => {
                          const valor = e.target.value || '';
                          setPontosEdicao({ ...pontosEdicao, voltaAlmoco: valor });
                        }}
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
                        value={pontosEdicao.saida || ''}
                        onChange={(e) => {
                          const valor = e.target.value || '';
                          setPontosEdicao({ ...pontosEdicao, saida: valor });
                        }}
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
      
      {/* Modal de Comprovantes */}
      {mostrarComprovantes && (
        <ModalComprovantes
          isOpen={mostrarComprovantes}
          onClose={() => setMostrarComprovantes(false)}
          funcionarioNome={targetUserName}
          funcionarioId={targetUserId}
        />
      )}
    </AnimatePresence>
  );
};

export default DetalhesHorasModal;
