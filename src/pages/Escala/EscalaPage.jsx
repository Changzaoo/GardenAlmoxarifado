import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Info, Filter, Check, X, Eye, EyeOff, StickyNote, MessageSquare, Settings, Building2, Star, Phone, Clock, Trash2 } from 'lucide-react';
import { collection, doc, setDoc, onSnapshot, deleteDoc, getDocs, addDoc, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { toast } from 'react-toastify';

const EscalaPage = ({ usuarioAtual }) => {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [mesAtual, setMesAtual] = useState(new Date());
  const [funcionarios, setFuncionarios] = useState([]);
  const [escalas, setEscalas] = useState({});
  const [presencas, setPresencas] = useState({});
  const [anotacoesFuncionarios, setAnotacoesFuncionarios] = useState({});
  const [anotacoesDias, setAnotacoesDias] = useState({});
  const [funcionariosOcultos, setFuncionariosOcultos] = useState([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState('todas');
  const [setorSelecionado, setSetorSelecionado] = useState('todos');
  const [empresas, setEmpresas] = useState([]);
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarLegenda, setMostrarLegenda] = useState(false);
  const [modoVisualizacao, setModoVisualizacao] = useState('diario');
  const [modalAnotacao, setModalAnotacao] = useState({ aberto: false, tipo: null, funcionarioId: null, dia: null, anotacao: '' });
  const [modalAnotacaoDia, setModalAnotacaoDia] = useState({ aberto: false, dia: null, anotacao: '' });
  const [modalGerenciarFuncionarios, setModalGerenciarFuncionarios] = useState(false);
  const [modalConfiguracoes, setModalConfiguracoes] = useState(false);
  const [configuracoesEscala, setConfiguracoesEscala] = useState({});
  const [funcionarioAtualIndex, setFuncionarioAtualIndex] = useState(0);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [dataCalendarioSelecionada, setDataCalendarioSelecionada] = useState(new Date());
  const [modalResumo, setModalResumo] = useState({ aberto: false, tipo: null, dados: [] });
  const [animacaoAtiva, setAnimacaoAtiva] = useState(null); // { tipo: 'presente'|'ausente'|'folga', origem: {x, y}, destino: {x, y} }
  const [avaliacaoExpandida, setAvaliacaoExpandida] = useState(null);
  const [novaAvaliacao, setNovaAvaliacao] = useState({ estrelas: 0, comentario: '' });
  const [hoverEstrelas, setHoverEstrelas] = useState(0);
  const [modalFiltros, setModalFiltros] = useState(false);
  const [abaGerenciar, setAbaGerenciar] = useState('horarios'); // 'horarios' ou 'funcionarios'
  const [horariosPersonalizados, setHorariosPersonalizados] = useState({});
  const [novoHorario, setNovoHorario] = useState({ nome: '', descricao: '', setor: '' });
  const [particulas, setParticulas] = useState([]); // Array de partículas animadas

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

  // Feriados nacionais e municipais de Búzios
  const FERIADOS_BUZIOS = {
    2025: [
      '01-01', // Ano Novo
      '03-04', // Carnaval
      '04-18', // Sexta-feira Santa
      '04-21', // Tiradentes
      '05-01', // Dia do Trabalho
      '06-19', // Corpus Christi
      '09-07', // Independência do Brasil
      '10-12', // Nossa Senhora Aparecida
      '10-15', // Dia do Professor (municipal)
      '11-02', // Finados
      '11-15', // Proclamação da República
      '11-20', // Dia da Consciência Negra
      '12-25'  // Natal
    ],
    2026: [
      '01-01', // Ano Novo
      '02-17', // Carnaval
      '04-03', // Sexta-feira Santa
      '04-21', // Tiradentes
      '05-01', // Dia do Trabalho
      '06-04', // Corpus Christi
      '09-07', // Independência do Brasil
      '10-12', // Nossa Senhora Aparecida
      '10-15', // Dia do Professor (municipal)
      '11-02', // Finados
      '11-15', // Proclamação da República
      '11-20', // Dia da Consciência Negra
      '12-25'  // Natal
    ]
  };

  // Verificar se é feriado
  const ehFeriado = (ano, mes, dia) => {
    const feriadosAno = FERIADOS_BUZIOS[ano] || [];
    const dataFormatada = `${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    return feriadosAno.includes(dataFormatada);
  };

  // Funções para WhatsApp
  const formatarTelefone = (telefone) => {
    if (!telefone) return '';
    const cleaned = telefone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return telefone;
  };

  const getWhatsAppLink = (telefone) => {
    if (!telefone) return '#';
    const numero = telefone.replace(/\D/g, '');
    return `https://wa.me/55${numero}`;
  };

  // Contar feriados no mês atual
  const contarFeriadosNoMes = () => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth() + 1;
    let count = 0;
    
    diasDoMes.forEach(({ dia }) => {
      if (ehFeriado(ano, mes, dia)) {
        count++;
      }
    });
    
    return count;
  };

  // Calcular intervalo da semana
  const calcularIntervaloSemana = () => {
    const diaAtual = mesAtual.getDate();
    const numeroSemana = Math.ceil(diaAtual / 7);
    
    // Calcular primeiro e último dia da semana
    const primeiroDiaSemana = (numeroSemana - 1) * 7 + 1;
    const ultimoDiaSemana = Math.min(numeroSemana * 7, new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate());
    
    // Criar datas para formatação
    const dataInicio = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), primeiroDiaSemana);
    const dataFim = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), ultimoDiaSemana);
    
    return {
      numeroSemana,
      primeiroDia: primeiroDiaSemana,
      ultimoDia: ultimoDiaSemana,
      textoIntervalo: `${primeiroDiaSemana} a ${ultimoDiaSemana} de ${mesAtual.toLocaleDateString('pt-BR', { month: 'long' })}`
    };
  };

  // Obter detalhes dos feriados no mês
  const obterDetalhesFeriados = () => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth() + 1;
    const feriados = [];
    
    const nomesFeriados = {
      '01-01': 'Ano Novo',
      '03-04': 'Carnaval',
      '04-18': 'Sexta-feira Santa',
      '04-21': 'Tiradentes',
      '05-01': 'Dia do Trabalho',
      '06-19': 'Corpus Christi',
      '09-07': 'Independência do Brasil',
      '10-12': 'Nossa Senhora Aparecida',
      '10-15': 'Dia do Professor (Municipal Búzios)',
      '11-02': 'Finados',
      '11-15': 'Proclamação da República',
      '11-20': 'Dia da Consciência Negra',
      '12-25': 'Natal',
      '02-17': 'Carnaval (2026)',
      '04-03': 'Sexta-feira Santa (2026)',
      '06-04': 'Corpus Christi (2026)'
    };
    
    diasDoMes.forEach(({ dia }) => {
      if (ehFeriado(ano, mes, dia)) {
        const dataFormatada = `${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        const dataCompleta = new Date(ano, mes - 1, dia);
        const diaSemana = dataCompleta.toLocaleDateString('pt-BR', { weekday: 'long' });
        
        feriados.push({
          dia,
          nome: nomesFeriados[dataFormatada] || 'Feriado',
          diaSemana: diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1),
          data: `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`
        });
      }
    });
    
    return feriados;
  };

  // Obter dias úteis detalhados
  const obterDiasUteis = () => {
    return diasDoMes
      .filter(d => !d.ehFimDeSemana)
      .map(({ dia, diaSemana }) => ({
        dia,
        diaSemana,
        data: `${String(dia).padStart(2, '0')}/${String(mesAtual.getMonth() + 1).padStart(2, '0')}/${mesAtual.getFullYear()}`
      }));
  };

  // Obter fins de semana detalhados
  const obterFinsDeSemana = () => {
    return diasDoMes
      .filter(d => d.ehFimDeSemana)
      .map(({ dia, diaSemana }) => ({
        dia,
        diaSemana,
        data: `${String(dia).padStart(2, '0')}/${String(mesAtual.getMonth() + 1).padStart(2, '0')}/${mesAtual.getFullYear()}`
      }));
  };

  // Abrir modal de resumo
  const abrirModalResumo = (tipo) => {
    let dados = [];
    let titulo = '';
    
    switch(tipo) {
      case 'feriados':
        dados = obterDetalhesFeriados();
        titulo = 'Feriados do Mês';
        break;
      case 'uteis':
        dados = obterDiasUteis();
        titulo = 'Dias Úteis do Mês';
        break;
      case 'finsdesemana':
        dados = obterFinsDeSemana();
        titulo = 'Fins de Semana do Mês';
        break;
      default:
        return;
    }
    
    setModalResumo({ aberto: true, tipo, dados, titulo });
  };

  // Carregar empresas
  useEffect(() => {
    const carregarEmpresas = async () => {
      try {
        const empresasSnapshot = await getDocs(collection(db, 'empresas'));
        const empresasData = empresasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEmpresas(empresasData);
      } catch (error) {
        console.error('Erro ao carregar empresas:', error);
      }
    };
    carregarEmpresas();
  }, []);

  // Carregar horários personalizados do Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'horarios_personalizados'),
      (snapshot) => {
        const horariosData = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.ativo !== false) {
            horariosData[doc.id] = {
              id: doc.id,
              ...data
            };
          }
        });
        setHorariosPersonalizados(horariosData);
      },
      (error) => {
        console.error('Erro ao carregar horários personalizados:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Carregar funcionários (apenas ativos)
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'funcionarios'),
      (snapshot) => {
        const funcsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Filtrar apenas funcionários ativos (não demitidos)
        const funcionariosAtivos = funcsData.filter(func => !func.demitido);
        setFuncionarios(funcionariosAtivos);

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

  // Carregar configurações de escala
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'configuracoes_escala'),
      (snapshot) => {
        const configs = {};
        snapshot.docs.forEach(doc => {
          configs[doc.id] = doc.data();
        });
        setConfiguracoesEscala(configs);
      },
      (error) => {
        console.error('Erro ao carregar configurações:', error);
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

  // Carregar anotações de funcionários
  useEffect(() => {
    const mesAno = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}`;
    
    const unsubscribe = onSnapshot(
      collection(db, 'anotacoes_funcionarios', mesAno, 'registros'),
      (snapshot) => {
        const anotacoesData = {};
        snapshot.docs.forEach(doc => {
          anotacoesData[doc.id] = doc.data();
        });
        setAnotacoesFuncionarios(anotacoesData);
      },
      (error) => {
        console.error('Erro ao carregar anotações de funcionários:', error);
      }
    );

    return () => unsubscribe();
  }, [mesAtual]);

  // Carregar anotações de dias
  useEffect(() => {
    const mesAno = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}`;
    
    const unsubscribe = onSnapshot(
      collection(db, 'anotacoes_dias', mesAno, 'registros'),
      (snapshot) => {
        const anotacoesData = {};
        snapshot.docs.forEach(doc => {
          anotacoesData[doc.id] = doc.data();
        });
        setAnotacoesDias(anotacoesData);
      },
      (error) => {
        console.error('Erro ao carregar anotações de dias:', error);
      }
    );

    return () => unsubscribe();
  }, [mesAtual]);

  // Função para ocultar/mostrar funcionário
  const toggleOcultarFuncionario = (funcId) => {
    setFuncionariosOcultos(prev => {
      if (prev.includes(funcId)) {
        return prev.filter(id => id !== funcId);
      } else {
        return [...prev, funcId];
      }
    });
  };

  // Verificar permissão - ATUALIZADO para permitir nível 1 ver seus próprios dados
  const temPermissao = useMemo(() => {
    if (!usuarioAtual) return false;
    return usuarioAtual.nivel >= 1; // Todos os níveis podem acessar (nivel 1, 2, 3 ou 4)
  }, [usuarioAtual]);

  // Verificar se usuário pode EDITAR (apenas nível 2+)
  const podeEditar = useMemo(() => {
    if (!usuarioAtual) return false;
    return usuarioAtual.nivel >= 2; // Supervisor ou superior (nivel 2, 3 ou 4)
  }, [usuarioAtual]);

  // Filtrar funcionários por empresa, setor e ocultos
  const funcionariosFiltrados = useMemo(() => {
    let filtrados = funcionarios;
    
    // SE NÍVEL 1: mostrar APENAS o próprio funcionário
    if (usuarioAtual?.nivel === 1) {
      filtrados = filtrados.filter(f => 
        f.id === usuarioAtual.id || 
        f.email === usuarioAtual.email ||
        f.nome === usuarioAtual.nome
      );
      console.log('👤 Nível 1 - Mostrando apenas próprio registro:', filtrados);
      return filtrados;
    }
    
    // Filtrar por empresa
    if (empresaSelecionada !== 'todas') {
      filtrados = filtrados.filter(f => f.empresa === empresaSelecionada);
    }
    
    // Filtrar por setor
    if (setorSelecionado !== 'todos') {
      filtrados = filtrados.filter(f => f.setor === setorSelecionado);
    }
    
    // Remover funcionários ocultos
    filtrados = filtrados.filter(f => !funcionariosOcultos.includes(f.id));
    
    // Ordenar alfabeticamente por nome
    filtrados.sort((a, b) => {
      const nomeA = (a.nome || '').toLowerCase();
      const nomeB = (b.nome || '').toLowerCase();
      return nomeA.localeCompare(nomeB, 'pt-BR');
    });
    
    return filtrados;
  }, [funcionarios, empresaSelecionada, setorSelecionado, funcionariosOcultos, usuarioAtual]);

  // Obter setores filtrados por empresa
  const setoresFiltrados = useMemo(() => {
    if (empresaSelecionada === 'todas') {
      return setores;
    }
    const setoresDaEmpresa = funcionarios
      .filter(f => f.empresa === empresaSelecionada)
      .map(f => f.setor)
      .filter(Boolean);
    return [...new Set(setoresDaEmpresa)].sort();
  }, [funcionarios, empresaSelecionada, setores]);

  // Obter dias conforme o modo de visualização
  const diasDoMes = useMemo(() => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    const dias = [];

    if (modoVisualizacao === 'diario') {
      // Modo diário: mostra apenas o dia atual
      const diaAtual = mesAtual.getDate();
      const data = new Date(ano, mes, diaAtual);
      const diaSemana = data.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
      dias.push({
        dia: diaAtual,
        data,
        diaSemana: diaSemana.replace('.', ''),
        ehFimDeSemana: data.getDay() === 0 || data.getDay() === 6
      });
    } else if (modoVisualizacao === 'semanal') {
      // Modo semanal: mostra 7 dias a partir do dia atual
      const diaAtual = mesAtual.getDate();
      for (let i = 0; i < 7; i++) {
        const data = new Date(ano, mes, diaAtual + i);
        const diaSemana = data.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
        dias.push({
          dia: data.getDate(),
          data,
          diaSemana: diaSemana.replace('.', ''),
          ehFimDeSemana: data.getDay() === 0 || data.getDay() === 6
        });
      }
    } else {
      // Modo mensal: mostra todos os dias do mês
      const ultimoDia = new Date(ano, mes + 1, 0);
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
    }

    return dias;
  }, [mesAtual, modoVisualizacao]);

  // Navegar entre períodos
  const navegarMes = (direcao) => {
    setMesAtual(prev => {
      const novaData = new Date(prev);
      
      if (modoVisualizacao === 'diario') {
        // Navega dia a dia
        novaData.setDate(novaData.getDate() + direcao);
      } else if (modoVisualizacao === 'semanal') {
        // Navega semana a semana (7 dias)
        novaData.setDate(novaData.getDate() + (direcao * 7));
      } else {
        // Modo mensal: navega mês a mês
        novaData.setMonth(novaData.getMonth() + direcao);
      }
      
      return novaData;
    });
  };

  // Marcar escala
  const marcarEscala = async (funcionarioId, dia, tipo, eventoClick) => {
    if (!podeEditar) {
      toast.warning('Você não tem permissão para editar a escala.', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    // Animação de partículas para FOLGA
    if (tipo === 'FOLGA' && eventoClick) {
      const funcionario = funcionarios.find(f => f.id === funcionarioId);
      const buttonRect = eventoClick.currentTarget.getBoundingClientRect();
      
      // Encontrar posição do card de estatísticas de folgas
      const statElement = document.querySelector(`[data-stat-folga="${funcionarioId}"]`);
      
      if (statElement) {
        const statRect = statElement.getBoundingClientRect();
        
        // Criar múltiplas partículas amarelas para folga
        const novasParticulas = Array.from({ length: 8 }, (_, i) => ({
          id: `${Date.now()}-${i}`,
          startX: buttonRect.left + buttonRect.width / 2,
          startY: buttonRect.top + buttonRect.height / 2,
          endX: statRect.left + statRect.width / 2,
          endY: statRect.top + statRect.height / 2,
          color: '#eab308', // yellow-500
          delay: i * 50,
          tipo: 'folga'
        }));
        
        setParticulas(prev => [...prev, ...novasParticulas]);
        
        // Remover partículas após animação
        setTimeout(() => {
          setParticulas(prev => prev.filter(p => !novasParticulas.find(np => np.id === p.id)));
        }, 1000);
      }
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
      
      // Se marcou folga, avançar para próximo funcionário após animação
      if (tipo === 'FOLGA') {
        setTimeout(() => {
          if (funcionarioAtualIndex < funcionariosFiltrados.length - 1) {
            setFuncionarioAtualIndex(funcionarioAtualIndex + 1);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Erro ao marcar escala:', error);
      toast.error('Erro ao salvar escala. Tente novamente.', {
        position: 'top-right',
        autoClose: 4000
      });
    }
  };

  // Marcar presença
  const marcarPresenca = async (funcionarioId, dia, presente, eventoClick) => {
    if (!podeEditar) {
      toast.warning('Você não tem permissão para marcar presença.', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    // Animação fluida de partículas
    if (presente !== null && eventoClick) {
      const funcionario = funcionarios.find(f => f.id === funcionarioId);
      const buttonRect = eventoClick.currentTarget.getBoundingClientRect();
      
      // Encontrar posição do card de estatísticas
      const statElement = presente 
        ? document.querySelector(`[data-stat-trabalho="${funcionarioId}"]`)
        : document.querySelector('.text-red-600.dark\\:text-red-400');
      
      if (statElement) {
        const statRect = statElement.getBoundingClientRect();
        
        // Criar múltiplas partículas
        const novasParticulas = Array.from({ length: 8 }, (_, i) => ({
          id: `${Date.now()}-${i}`,
          startX: buttonRect.left + buttonRect.width / 2,
          startY: buttonRect.top + buttonRect.height / 2,
          endX: statRect.left + statRect.width / 2,
          endY: statRect.top + statRect.height / 2,
          color: presente ? '#10b981' : '#ef4444', // green-500 ou red-500
          delay: i * 50,
          tipo: presente ? 'presente' : 'ausente'
        }));
        
        setParticulas(prev => [...prev, ...novasParticulas]);
        
        // Remover partículas após animação
        setTimeout(() => {
          setParticulas(prev => prev.filter(p => !novasParticulas.find(np => np.id === p.id)));
        }, 1000);
      }
      
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
        
        // Avançar para próximo funcionário após animação (tanto presente quanto ausente)
        setTimeout(() => {
          if (funcionarioAtualIndex < funcionariosFiltrados.length - 1) {
            setFuncionarioAtualIndex(funcionarioAtualIndex + 1);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Erro ao marcar presença:', error);
      toast.error('Erro ao salvar presença. Tente novamente.', {
        position: 'top-right',
        autoClose: 4000
      });
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

  // Salvar avaliação do funcionário
  const salvarAvaliacao = async (funcionarioId, funcionarioNome) => {
    if (!podeEditar) {
      toast.warning('Você não tem permissão para avaliar funcionários.', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    if (novaAvaliacao.estrelas === 0) {
      toast.warning('Por favor, selecione uma avaliação em estrelas', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    try {
      const avaliacoesRef = collection(db, 'avaliacoes');
      const dataAtual = new Date();
      
      const avaliacaoData = {
        funcionarioId: String(funcionarioId),
        funcionarioNome: funcionarioNome,
        supervisorId: usuarioAtual?.uid || '',
        supervisorNome: usuarioAtual?.nome || usuarioAtual?.email || 'Sistema',
        data: dataAtual.toISOString().split('T')[0],
        hora: `${String(dataAtual.getHours()).padStart(2, '0')}:${String(dataAtual.getMinutes()).padStart(2, '0')}`,
        estrelas: Number(novaAvaliacao.estrelas),
        comentario: novaAvaliacao.comentario.trim(),
        status: 'ativa',
        tipo: 'avaliacao_supervisor',
        tipoAvaliacao: novaAvaliacao.estrelas >= 4 ? 'positiva' : novaAvaliacao.estrelas <= 2 ? 'negativa' : 'neutra',
        anonima: false,
        dataCriacao: serverTimestamp()
      };

      await addDoc(avaliacoesRef, avaliacaoData);

      // Atualizar pontos do funcionário (estrelas × 2)
      const funcionarioRef = doc(db, 'funcionarios', funcionarioId);
      const funcionarioSnap = await getDoc(funcionarioRef);
      
      if (funcionarioSnap.exists()) {
        const funcionarioData = funcionarioSnap.data();
        const pontosAtuais = funcionarioData.pontos || 0;
        const novosPontos = pontosAtuais + (novaAvaliacao.estrelas * 2);
        
        await updateDoc(funcionarioRef, {
          pontos: novosPontos
        });
      }

      toast.success('Avaliação salva com sucesso! +' + (novaAvaliacao.estrelas * 2) + ' pontos', {
        position: 'top-right',
        autoClose: 3000
      });

      // Resetar formulário
      setNovaAvaliacao({ estrelas: 0, comentario: '' });
      setAvaliacaoExpandida(null);
      setHoverEstrelas(0);
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      toast.error('Erro ao salvar avaliação. Tente novamente.', {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };

  // Salvar anotação de funcionário (apenas nível 2+)
  const salvarAnotacaoFuncionario = async (funcionarioId, dia, anotacao) => {
    if (!podeEditar) {
      toast.warning('Você não tem permissão para adicionar anotações.', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    try {
      const mesAno = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}`;
      const dataFormatada = `${mesAno}-${String(dia).padStart(2, '0')}`;
      const docId = `${funcionarioId}_${dataFormatada}`;

      if (!anotacao || anotacao.trim() === '') {
        await deleteDoc(doc(db, 'anotacoes_funcionarios', mesAno, 'registros', docId));
      } else {
        await setDoc(doc(db, 'anotacoes_funcionarios', mesAno, 'registros', docId), {
          funcionarioId,
          data: dataFormatada,
          anotacao: anotacao.trim(),
          criadoPor: usuarioAtual?.email || 'Sistema',
          criadoEm: new Date()
        });
      }
      setModalAnotacao({ aberto: false, tipo: null, funcionarioId: null, dia: null, anotacao: '' });
    } catch (error) {
      console.error('Erro ao salvar anotação:', error);
      toast.error('Erro ao salvar anotação. Tente novamente.', {
        position: 'top-right',
        autoClose: 4000
      });
    }
  };

  // Salvar anotação do dia (apenas nível 2+)
  const salvarAnotacaoDia = async (dia, anotacao) => {
    if (!podeEditar) {
      toast.warning('Você não tem permissão para adicionar anotações.', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    try {
      const mesAno = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}`;
      const dataFormatada = `${mesAno}-${String(dia).padStart(2, '0')}`;

      if (!anotacao || anotacao.trim() === '') {
        await deleteDoc(doc(db, 'anotacoes_dias', mesAno, 'registros', dataFormatada));
      } else {
        await setDoc(doc(db, 'anotacoes_dias', mesAno, 'registros', dataFormatada), {
          data: dataFormatada,
          anotacao: anotacao.trim(),
          criadoPor: usuarioAtual?.email || 'Sistema',
          criadoEm: new Date()
        });
      }
      setModalAnotacaoDia({ aberto: false, dia: null, anotacao: '' });
    } catch (error) {
      console.error('Erro ao salvar anotação do dia:', error);
      toast.error('Erro ao salvar anotação. Tente novamente.', {
        position: 'top-right',
        autoClose: 4000
      });
    }
  };

  // Obter anotação de funcionário
  const obterAnotacaoFuncionario = (funcionarioId, dia) => {
    const mesAno = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}`;
    const dataFormatada = `${mesAno}-${String(dia).padStart(2, '0')}`;
    const docId = `${funcionarioId}_${dataFormatada}`;
    return anotacoesFuncionarios[docId]?.anotacao || '';
  };

  // Obter anotação do dia
  const obterAnotacaoDia = (dia) => {
    const mesAno = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}`;
    const dataFormatada = `${mesAno}-${String(dia).padStart(2, '0')}`;
    return anotacoesDias[dataFormatada]?.anotacao || '';
  };

  // Alternar visibilidade do funcionário
  const toggleFuncionarioOculto = (funcionarioId) => {
    setFuncionariosOcultos(prev => {
      if (prev.includes(funcionarioId)) {
        return prev.filter(id => id !== funcionarioId);
      } else {
        return [...prev, funcionarioId];
      }
    });
  };

  // Abrir modal de anotação
  const abrirModalAnotacao = (funcionarioId, dia) => {
    const anotacaoExistente = obterAnotacaoFuncionario(funcionarioId, dia);
    setModalAnotacao({
      aberto: true,
      tipo: 'funcionario',
      funcionarioId,
      dia,
      anotacao: anotacaoExistente
    });
  };

  // Abrir modal de anotação do dia
  const abrirModalAnotacaoDia = (dia) => {
    const anotacaoExistente = obterAnotacaoDia(dia);
    setModalAnotacaoDia({
      aberto: true,
      dia,
      anotacao: anotacaoExistente
    });
  };

  // Salvar configuração de escala padrão
  const salvarConfiguracaoEscala = async (funcionarioId, tipoEscala) => {
    try {
      await setDoc(doc(db, 'configuracoes_escala', funcionarioId), {
        funcionarioId,
        tipoEscala,
        atualizadoPor: usuarioAtual?.email || 'Sistema',
        atualizadoEm: new Date()
      });
      toast.success('Configuração salva com sucesso!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração. Tente novamente.', {
        position: 'top-right',
        autoClose: 4000
      });
    }
  };

  // Obter tipo de escala (com fallback para configuração padrão)
  const obterTipoEscala = (funcionarioId, dia) => {
    const mesAno = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}`;
    const dataFormatada = `${mesAno}-${String(dia).padStart(2, '0')}`;
    const docId = `${funcionarioId}_${dataFormatada}`;
    
    // Se já existe marcação específica, usa ela
    if (escalas[docId]?.tipo) {
      return escalas[docId].tipo;
    }
    
    // Senão, usa a configuração padrão do funcionário
    return configuracoesEscala[funcionarioId]?.tipoEscala || 'VAZIO';
  };

  // Estatísticas por funcionário
  const calcularEstatisticas = (funcionarioId) => {
    let diasTrabalhados = 0;
    let folgas = 0;
    let ferias = 0;
    let atestados = 0;
    let presencas = 0;
    let faltas = 0;
    let feriados = 0;

    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth() + 1;

    diasDoMes.forEach(({ dia }) => {
      // Verificar se é feriado
      if (ehFeriado(ano, mes, dia)) {
        feriados++;
      }

      const tipo = obterTipoEscala(funcionarioId, dia);
      if (tipo === 'M' || tipo === 'M1' || tipo === 'M4') diasTrabalhados++;
      else if (tipo === 'FOLGA' || tipo === 'FOLGA_EXTRA') folgas++;
      else if (tipo === 'FERIAS') ferias++;
      else if (tipo === 'ATESTADO') atestados++;

      const presencaStatus = obterPresenca(funcionarioId, dia);
      if (presencaStatus === true) presencas++;
      else if (presencaStatus === false) faltas++;
    });

    return { diasTrabalhados, folgas, ferias, atestados, presencas, faltas, feriados };
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

  // Todos os níveis podem acessar a página (nível 1 apenas visualiza seus próprios dados)
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      {/* Cabeçalho */}
      {/* Banner informativo para nível 1 */}
      {usuarioAtual?.nivel === 1 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-6 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                Modo de Visualização
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                Você está visualizando <strong>apenas seus próprios registros</strong> de escala e presença. 
                Esta página é somente leitura para o seu nível de acesso.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <Calendar className="w-8 h-8 text-green-600" />
              Escala de Trabalho
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {podeEditar ? 'Gerencie a escala de trabalho e folgas dos funcionários' : 'Visualize sua escala de trabalho e registro de presença'}
            </p>
          </div>

          {/* Seletor de Data com Calendário */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => setMostrarCalendario(true)}
              className="px-6 py-3 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors shadow-lg"
            >
              <div className="text-center min-w-[200px]">
                <div className="text-2xl font-bold">
                  {modoVisualizacao === 'diario' 
                    ? mesAtual.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
                    : modoVisualizacao === 'semanal'
                    ? `Semana ${calcularIntervaloSemana().numeroSemana}`
                    : mesAtual.toLocaleDateString('pt-BR', { month: 'long' })
                  }
                </div>
                <div className="text-sm text-gray-300">
                  {modoVisualizacao === 'semanal' 
                    ? calcularIntervaloSemana().textoIntervalo
                    : mesAtual.getFullYear()
                  }
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Resumo do Mês */}
        <div className="mt-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 rounded-lg p-3 shadow-md">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setModalResumo({ aberto: true, tipo: 'diasmes', dados: diasDoMes, titulo: 'Dias no Mês' })}
              className="bg-white dark:bg-gray-700 rounded-lg p-2 text-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
            >
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Dias no Mês
              </div>
              <div className="text-lg font-bold text-gray-800 dark:text-white">
                {diasDoMes.length}
              </div>
            </button>
            <button
              onClick={() => abrirModalResumo('uteis')}
              className="bg-white dark:bg-gray-700 rounded-lg p-2 text-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
            >
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Dias Úteis
              </div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {diasDoMes.filter(d => !d.ehFimDeSemana).length}
              </div>
            </button>
            <button
              onClick={() => abrirModalResumo('finsdesemana')}
              className="bg-white dark:bg-gray-700 rounded-lg p-2 text-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
            >
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Fins de Semana
              </div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {diasDoMes.filter(d => d.ehFimDeSemana).length}
              </div>
            </button>
            <button
              onClick={() => abrirModalResumo('feriados')}
              className="bg-white dark:bg-gray-700 rounded-lg p-2 text-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
            >
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Feriados
              </div>
              <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {contarFeriadosNoMes()}
              </div>
            </button>
          </div>
        </div>

        {/* Filtros e Controles */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Filtro de Visualização - Dropdown Único */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Modo de Visualização
            </label>
            <select
              value={modoVisualizacao}
              onChange={(e) => setModoVisualizacao(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="diario">📅 Diário</option>
              <option value="semanal">📆 Semanal</option>
              <option value="mensal">🗓️ Mensal</option>
            </select>
          </div>

          {/* Botão de Filtros - Apenas para Administrador */}
          {usuarioAtual?.nivel === 4 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filtros Avançados
              </label>
              <button
                onClick={() => setModalFiltros(true)}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  empresaSelecionada !== 'todas' || setorSelecionado !== 'todos'
                    ? 'bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-300'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <Filter className="w-5 h-5" />
                <span>Filtrar Empresa/Setor</span>
                {(empresaSelecionada !== 'todas' || setorSelecionado !== 'todos') && (
                  <span className="bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
                    ✓
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Botão Unificado - Gerenciar (APENAS NÍVEL 2+) */}
          {podeEditar && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setModalConfiguracoes(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Gerenciar funcionários e configurar horários de escala"
              >
                <Settings className="w-5 h-5" />
                <span className="text-sm">Gerenciar Funcionários e Horários</span>
              </button>

              {funcionariosOcultos.length > 0 && (
                <button
                  onClick={() => setFuncionariosOcultos([])}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  title="Mostrar todos os funcionários"
                >
                  <Eye className="w-5 h-5" />
                  <span className="text-sm">Mostrar Todos ({funcionariosOcultos.length})</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Visualização em Carrossel (Modo Diário Mobile) */}
      {modoVisualizacao === 'diario' && window.innerWidth < 768 && funcionariosFiltrados.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          {/* Dica de navegação automática */}
          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
              💡 Ao marcar <strong className="text-green-600 dark:text-green-400">Presente</strong>, <strong className="text-red-600 dark:text-red-400">Ausente</strong> ou <strong className="text-yellow-600 dark:text-yellow-400">Folga</strong>, avança automaticamente para o próximo funcionário
            </p>
          </div>
          
          {/* Navegação do Carrossel */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setFuncionarioAtualIndex(prev => Math.max(0, prev - 1))}
              disabled={funcionarioAtualIndex === 0}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <div className="text-center flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {funcionarioAtualIndex + 1} de {funcionariosFiltrados.length}
              </p>
            </div>

            <button
              onClick={() => setFuncionarioAtualIndex(prev => Math.min(funcionariosFiltrados.length - 1, prev + 1))}
              disabled={funcionarioAtualIndex === funcionariosFiltrados.length - 1}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Card do Funcionário */}
          {(() => {
            const func = funcionariosFiltrados[funcionarioAtualIndex];
            if (!func) return null;
            
            const dia = mesAtual.getDate();
            const tipo = obterTipoEscala(func.id, dia);
            const config = TIPOS_ESCALA[tipo] || TIPOS_ESCALA.VAZIO;
            const presencaStatus = obterPresenca(func.id, dia);
            const stats = calcularEstatisticas(func.id);

            return (
              <div className="space-y-2">
                {/* Info do Funcionário com Foto - COMPACTO */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-2 border border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-2">
                    {/* Foto de Perfil - MENOR */}
                    <div className="flex-shrink-0">
                      {func.photoURL ? (
                        <img
                          src={func.photoURL}
                          alt={func.nome}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center border-2 border-white dark:border-gray-700 shadow">
                          <span className="text-lg font-bold text-white">
                            {func.nome?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Coluna Central - Nome e Badges - COMPACTO */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-800 dark:text-white truncate">
                        {func.nome}
                      </h3>
                      
                      {/* Badges de cargo e setor - MENORES */}
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        <span className="px-1.5 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-medium">
                          {func.cargo || 'N/A'}
                        </span>
                        {func.setor && (
                          <span className="px-1.5 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-medium">
                            {func.setor}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Coluna Direita - Escala e Horário - COMPACTO */}
                    <div className="flex-shrink-0 text-right">
                      <div 
                        data-funcionario-dia={`${func.id}-${dia}`}
                        className={`px-2 py-1 rounded text-[10px] font-bold mb-0.5 ${config.cor} ${config.corTexto}`}
                      >
                        {config.label}
                      </div>
                      <div className="text-[9px] text-gray-600 dark:text-gray-400 font-medium">
                        {tipo === 'M' && '07:20-16:20'}
                        {tipo === 'M1' && '07:00-15:20'}
                        {tipo === 'M4' && '06:00-15:40'}
                        {(tipo === 'FOLGA' || tipo === 'FOLGA_EXTRA') && 'Folga'}
                        {tipo === 'FERIAS' && 'Férias'}
                        {tipo === 'ATESTADO' && 'Atestado'}
                        {tipo === 'VAZIO' && '-'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Estatísticas compactas - MAIS COMPACTO */}
                  <div className="grid grid-cols-3 gap-1 text-[10px] mt-2 pt-2 border-t border-green-200 dark:border-green-700">
                    <div 
                      data-stat-trabalho={`${func.id}`}
                      className="flex items-center gap-0.5 text-green-600 dark:text-green-400"
                    >
                      <span className="font-semibold">{stats.diasTrabalhados}</span>
                      <span className="truncate">Trabalho</span>
                    </div>
                    <div 
                      data-stat-folga={`${func.id}`}
                      className="flex items-center gap-0.5 text-yellow-600 dark:text-yellow-400"
                    >
                      <span className="font-semibold">{stats.folgas}</span>
                      <span className="truncate">Folgas</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-orange-600 dark:text-orange-400">
                      <span className="font-semibold">{stats.feriados}</span>
                      <span className="truncate">Feriados</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
                      <span className="font-semibold">{stats.presencas}</span>
                      <span className="truncate">✓ Pres.</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-red-600 dark:text-red-400">
                      <span className="font-semibold">{stats.faltas}</span>
                      <span className="truncate">✗ Faltas</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
                      <span className="font-semibold">{stats.ferias}</span>
                      <span className="truncate">Férias</span>
                    </div>
                  </div>
                </div>

                {/* Anotação do Funcionário - COMPACTO */}
                <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Anotação
                  </label>
                  <button
                    onClick={() => abrirModalAnotacao(func.id, dia)}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                      obterAnotacaoFuncionario(func.id, dia)
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    {obterAnotacaoFuncionario(func.id, dia) ? 'Ver/Editar' : 'Adicionar'}
                  </button>
                </div>

                {/* WhatsApp - Contato Rápido - COMPACTO */}
                {func.telefone && (
                  <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Contato
                    </label>
                    <a
                      href={getWhatsAppLink(func.telefone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-2 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                        <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">WhatsApp</p>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                          {formatarTelefone(func.telefone)}
                        </p>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5 flex-shrink-0">
                        <path fill="#25D366" d="M256.064,0h-0.128C114.784,0,0,114.816,0,256c0,56,18.048,107.904,48.736,150.048l-31.904,95.104  l98.4-31.456C155.712,496.512,204,512,256.064,512C397.216,512,512,397.152,512,256S397.216,0,256.064,0z"/>
                        <path fill="#FFFFFF" d="M405.024,361.504c-6.176,17.44-30.688,31.904-50.24,36.128c-13.376,2.848-30.848,5.12-89.664-19.264  c-75.232-31.168-123.68-107.616-127.456-112.576c-3.616-4.96-30.4-40.48-30.4-77.216s18.656-54.624,26.176-62.304  c6.176-6.304,16.384-9.184,26.176-9.184c3.168,0,6.016,0.16,8.576,0.288c7.52,0.32,11.296,0.768,16.256,12.64  c6.176,14.88,21.216,51.616,23.008,55.392c1.824,3.776,3.648,8.896,1.088,13.856c-2.4,5.12-4.512,7.392-8.288,11.744  c-3.776,4.352-7.36,7.68-11.136,12.352c-3.456,4.064-7.36,8.416-3.008,15.936c4.352,7.36,19.392,31.904,41.536,51.616  c28.576,25.44,51.744,33.568,60.032,37.024c6.176,2.56,13.536,1.952,18.048-2.848c5.728-6.176,12.8-16.416,20-26.496  c5.12-7.232,11.584-8.128,18.368-5.568c6.912,2.4,43.488,20.48,51.008,24.224c7.52,3.776,12.48,5.568,14.304,8.736  C411.2,329.152,411.2,344.032,405.024,361.504z"/>
                      </svg>
                    </a>
                  </div>
                )}

                {/* Avaliação do Funcionário - COMPACTO */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-2 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                      <Star className="w-4 h-4 fill-blue-500" />
                      Avaliar
                    </label>
                    <button
                      onClick={() => setAvaliacaoExpandida(avaliacaoExpandida === func.id ? null : func.id)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors text-xs"
                    >
                      {avaliacaoExpandida === func.id ? '▲' : '▼'}
                    </button>
                  </div>

                  {avaliacaoExpandida === func.id && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top duration-300">
                      {/* Sistema de Estrelas - COMPACTO */}
                      <div>
                        <label className="block text-[10px] font-medium text-blue-700 dark:text-blue-300 mb-1">
                          Avaliação (1-5 estrelas)
                        </label>
                        <div className="flex gap-1 justify-center bg-white dark:bg-gray-800 rounded-lg p-2">
                          {[1, 2, 3, 4, 5].map((estrela) => (
                            <button
                              key={estrela}
                              type="button"
                              onClick={() => setNovaAvaliacao({ ...novaAvaliacao, estrelas: estrela })}
                              onMouseEnter={() => setHoverEstrelas(estrela)}
                              onMouseLeave={() => setHoverEstrelas(0)}
                              className="transition-all transform hover:scale-110 focus:outline-none focus:scale-110"
                            >
                              <Star
                                className={`w-6 h-6 transition-all ${
                                  estrela <= (hoverEstrelas || novaAvaliacao.estrelas)
                                    ? 'fill-yellow-400 text-yellow-400 drop-shadow-lg'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        {novaAvaliacao.estrelas > 0 && (
                          <p className="text-[10px] text-center mt-1 text-blue-600 dark:text-blue-400 font-medium">
                            +{novaAvaliacao.estrelas * 2} pts • {
                              novaAvaliacao.estrelas === 5 ? '⭐ Excelente!' :
                              novaAvaliacao.estrelas === 4 ? '😊 Muito Bom!' :
                              novaAvaliacao.estrelas === 3 ? '👍 Bom' :
                              novaAvaliacao.estrelas === 2 ? '😐 Regular' :
                              '😔 Melhorar'
                            }
                          </p>
                        )}
                      </div>

                      {/* Campo de Comentário - COMPACTO */}
                      <div>
                        <label className="block text-[10px] font-medium text-blue-700 dark:text-blue-300 mb-1">
                          Comentário (opcional)
                        </label>
                        <textarea
                          value={novaAvaliacao.comentario}
                          onChange={(e) => setNovaAvaliacao({ ...novaAvaliacao, comentario: e.target.value })}
                          placeholder="Observações..."
                          className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                          rows="2"
                        />
                      </div>

                      {/* Botão Salvar - COMPACTO */}
                      <button
                        onClick={() => salvarAvaliacao(func.id, func.nome)}
                        disabled={novaAvaliacao.estrelas === 0}
                        className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          novaAvaliacao.estrelas === 0
                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                        }`}
                      >
                        <Star className="w-4 h-4" />
                        Enviar
                      </button>
                    </div>
                  )}
                </div>

                {/* Presença e Folga - COMPACTO (Apenas visualização para nível 1) */}
                <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {podeEditar ? 'Presença e Folga' : 'Status (Visualização)'}
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={podeEditar ? (e) => marcarPresenca(func.id, dia, presencaStatus === true ? null : true, e) : undefined}
                      disabled={!podeEditar}
                      className={`py-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 relative overflow-hidden ${
                        presencaStatus === true
                          ? 'bg-green-600 text-white scale-105 ring-2 ring-green-300'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-800'
                      } ${!podeEditar ? 'cursor-not-allowed opacity-75' : ''}`}
                    >
                      <Check className="w-4 h-4" />
                      <span className="text-[10px]">Presente</span>
                    </button>
                    <button
                      onClick={podeEditar ? (e) => marcarPresenca(func.id, dia, presencaStatus === false ? null : false, e) : undefined}
                      disabled={!podeEditar}
                      className={`py-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 relative overflow-hidden ${
                        presencaStatus === false
                          ? 'bg-red-600 text-white scale-105 ring-2 ring-red-300'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-800'
                      } ${!podeEditar ? 'cursor-not-allowed opacity-75' : ''}`}
                    >
                      <X className="w-4 h-4" />
                      <span className="text-[10px]">Ausente</span>
                    </button>
                    <button
                      onClick={podeEditar ? (e) => marcarEscala(func.id, dia, tipo === 'FOLGA' ? 'VAZIO' : 'FOLGA', e) : undefined}
                      disabled={!podeEditar}
                      className={`py-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 relative overflow-hidden ${
                        tipo === 'FOLGA'
                          ? 'bg-yellow-500 text-white scale-105 ring-2 ring-yellow-300'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-yellow-100 dark:hover:bg-yellow-800'
                      } ${!podeEditar ? 'cursor-not-allowed opacity-75' : ''}`}
                    >
                      <span className="text-lg">📅</span>
                      <span className="text-[10px]">Folga</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Modal de Calendário */}
      {mostrarCalendario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                Selecionar Data
              </h3>
              <button
                onClick={() => setMostrarCalendario(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navegação de Mês e Ano */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  const novaData = new Date(dataCalendarioSelecionada);
                  novaData.setMonth(novaData.getMonth() - 1);
                  setDataCalendarioSelecionada(novaData);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-3">
                <select
                  value={dataCalendarioSelecionada.getMonth()}
                  onChange={(e) => {
                    const novaData = new Date(dataCalendarioSelecionada);
                    novaData.setMonth(parseInt(e.target.value));
                    setDataCalendarioSelecionada(novaData);
                  }}
                  className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((mes, idx) => (
                    <option key={idx} value={idx}>{mes}</option>
                  ))}
                </select>
                
                <select
                  value={dataCalendarioSelecionada.getFullYear()}
                  onChange={(e) => {
                    const novaData = new Date(dataCalendarioSelecionada);
                    novaData.setFullYear(parseInt(e.target.value));
                    setDataCalendarioSelecionada(novaData);
                  }}
                  className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(ano => (
                    <option key={ano} value={ano}>{ano}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  const novaData = new Date(dataCalendarioSelecionada);
                  novaData.setMonth(novaData.getMonth() + 1);
                  setDataCalendarioSelecionada(novaData);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Grade do Calendário */}
            <div className="mb-6">
              {/* Dias da Semana */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
                  <div key={dia} className="text-center text-sm font-bold text-gray-600 dark:text-gray-400 py-2">
                    {dia}
                  </div>
                ))}
              </div>

              {/* Dias do Mês */}
              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const primeiroDia = new Date(dataCalendarioSelecionada.getFullYear(), dataCalendarioSelecionada.getMonth(), 1);
                  const ultimoDia = new Date(dataCalendarioSelecionada.getFullYear(), dataCalendarioSelecionada.getMonth() + 1, 0);
                  const diasVaziosInicio = primeiroDia.getDay();
                  const diasNoMes = ultimoDia.getDate();
                  const hoje = new Date();
                  const dataAtualFormatada = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

                  const dias = [];

                  // Dias vazios no início
                  for (let i = 0; i < diasVaziosInicio; i++) {
                    dias.push(<div key={`vazio-${i}`} className="aspect-square" />);
                  }

                  // Dias do mês
                  for (let dia = 1; dia <= diasNoMes; dia++) {
                    const dataLoop = new Date(dataCalendarioSelecionada.getFullYear(), dataCalendarioSelecionada.getMonth(), dia);
                    const dataLoopFormatada = `${dataLoop.getFullYear()}-${String(dataLoop.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                    const ehHoje = dataLoopFormatada === dataAtualFormatada;
                    const ehSelecionado = dataLoop.getDate() === mesAtual.getDate() && 
                                         dataLoop.getMonth() === mesAtual.getMonth() && 
                                         dataLoop.getFullYear() === mesAtual.getFullYear();
                    const ehFimDeSemana = dataLoop.getDay() === 0 || dataLoop.getDay() === 6;

                    dias.push(
                      <button
                        key={dia}
                        onClick={() => {
                          const novaData = new Date(dataCalendarioSelecionada.getFullYear(), dataCalendarioSelecionada.getMonth(), dia);
                          setMesAtual(novaData);
                          setDataAtual(novaData);
                          setMostrarCalendario(false);
                        }}
                        className={`aspect-square flex items-center justify-center rounded-lg font-semibold transition-all ${
                          ehSelecionado
                            ? 'bg-blue-600 text-white ring-4 ring-blue-300 scale-110'
                            : ehHoje
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : ehFimDeSemana
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {dia}
                      </button>
                    );
                  }

                  return dias;
                })()}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const hoje = new Date();
                  setDataCalendarioSelecionada(hoje);
                  setMesAtual(hoje);
                  setDataAtual(hoje);
                  setMostrarCalendario(false);
                }}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Ir para Hoje
              </button>
              <button
                onClick={() => setMostrarCalendario(false)}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Escala */}
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden ${modoVisualizacao === 'diario' && window.innerWidth < 768 ? 'hidden' : ''}`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-green-600 dark:bg-green-700 text-white">
                <th className="sticky left-0 z-20 bg-green-600 dark:bg-green-700 px-2 py-3 text-left font-semibold border-r border-green-500 dark:border-green-600 w-[180px] max-w-[180px]">
                  Colaborador
                </th>
                {diasDoMes.map(({ dia, diaSemana, ehFimDeSemana }) => {
                  const temAnotacao = obterAnotacaoDia(dia);
                  return (
                    <th
                      key={dia}
                      className={`px-2 py-3 text-center font-semibold text-xs border-r border-green-500 dark:border-green-600 min-w-[60px] ${
                        ehFimDeSemana ? 'bg-green-700 dark:bg-green-800' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div className="md:text-xs text-sm">{diaSemana}</div>
                        <div className="md:text-lg text-2xl font-bold">{dia}</div>
                        <button
                          onClick={() => abrirModalAnotacaoDia(dia)}
                          className={`p-1 rounded transition-colors ${
                            temAnotacao
                              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                              : 'bg-green-500 bg-opacity-30 hover:bg-opacity-50'
                          }`}
                          title={temAnotacao ? 'Ver anotação do dia' : 'Adicionar anotação do dia'}
                        >
                          <StickyNote className="md:w-3 md:h-3 w-6 h-6" />
                        </button>
                      </div>
                    </th>
                  );
                })}
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
                      <td className="sticky left-0 z-10 px-2 py-2 border-r-2 border-gray-300 dark:border-gray-600 bg-inherit w-[180px] max-w-[180px]">
                        <div className="flex items-center gap-2">
                          {/* Foto de Perfil */}
                          <div className="flex-shrink-0">
                            {func.photoURL ? (
                              <img
                                src={func.photoURL}
                                alt={func.nome}
                                className="w-10 h-10 rounded-full object-cover border-2 border-green-400 dark:border-green-500 shadow-sm"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center border-2 border-green-400 dark:border-green-500 shadow-sm">
                                <span className="text-sm font-bold text-white">
                                  {func.nome?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Informações do Funcionário */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="font-bold text-gray-800 dark:text-white text-sm truncate block max-w-[120px]" title={func.nome}>
                                {func.nome}
                              </span>
                              <button
                                onClick={() => toggleOcultarFuncionario(func.id)}
                                className={`flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                  funcionariosOcultos.includes(func.id)
                                    ? 'bg-gray-400 border-gray-500'
                                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400'
                                }`}
                                title={funcionariosOcultos.includes(func.id) ? 'Mostrar funcionário' : 'Ocultar funcionário'}
                              >
                                {funcionariosOcultos.includes(func.id) ? (
                                  <EyeOff className="w-2.5 h-2.5 text-white" />
                                ) : (
                                  <Eye className="w-2.5 h-2.5 text-gray-400 dark:text-gray-500" />
                                )}
                              </button>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm inline-block max-w-fit truncate" title={func.cargo}>
                                {func.cargo || 'N/A'}
                              </span>
                              {func.setor && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 inline-block max-w-fit truncate" title={func.setor}>
                                  {func.setor}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      {diasDoMes.map(({ dia, ehFimDeSemana }) => {
                        const tipo = obterTipoEscala(func.id, dia);
                        const config = TIPOS_ESCALA[tipo] || TIPOS_ESCALA.VAZIO;
                        const presencaStatus = obterPresenca(func.id, dia);
                        const temAnotacao = obterAnotacaoFuncionario(func.id, dia);
                        return (
                          <td
                            key={dia}
                            className={`px-2 py-2 border-r border-gray-200 dark:border-gray-700 ${
                              ehFimDeSemana ? 'bg-gray-100 dark:bg-gray-750' : ''
                            }`}
                          >
                            <div className="flex flex-col gap-2">
                              <select
                                value={tipo}
                                onChange={podeEditar ? (e) => marcarEscala(func.id, dia, e.target.value) : undefined}
                                disabled={!podeEditar}
                                className={`w-full px-1 py-1 text-xs font-bold text-center rounded border-0 ${config.cor} ${config.corTexto} focus:ring-2 focus:ring-green-500 ${podeEditar ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
                              >
                                {Object.entries(TIPOS_ESCALA).map(([key, t]) => (
                                  <option key={key} value={key}>
                                    {t.label}
                                  </option>
                                ))}
                              </select>
                              
                              <div className="flex gap-1.5 justify-center">
                                <button
                                  onClick={podeEditar ? (e) => marcarPresenca(func.id, dia, presencaStatus === true ? null : true, e) : undefined}
                                  disabled={!podeEditar}
                                  className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                                    presencaStatus === true
                                      ? 'bg-gradient-to-br from-green-500 to-green-600 text-white scale-105 shadow-green-500/50'
                                      : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300 hover:from-green-50 hover:to-green-100 dark:hover:from-green-900 dark:hover:to-green-800'
                                  } ${!podeEditar ? 'cursor-not-allowed opacity-75' : ''}`}
                                  title="Presente"
                                  >
                                    <Check className="w-5 h-5 mx-auto" />
                                  </button>
                                  <button
                                    onClick={podeEditar ? (e) => marcarPresenca(func.id, dia, presencaStatus === false ? null : false, e) : undefined}
                                    disabled={!podeEditar}
                                    className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                                      presencaStatus === false
                                        ? 'bg-gradient-to-br from-red-500 to-red-600 text-white scale-105 shadow-red-500/50'
                                        : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300 hover:from-red-50 hover:to-red-100 dark:hover:from-red-900 dark:hover:to-red-800'
                                    } ${!podeEditar ? 'cursor-not-allowed opacity-75' : ''}`}
                                    title="Falta"
                                  >
                                    <X className="w-5 h-5 mx-auto" />
                                </button>
                              </div>
                              
                              {/* Anotações permitidas para todos (apenas visualização para nível 1) */}
                              <button
                                onClick={() => abrirModalAnotacao(func.id, dia)}
                                className={`w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                                  temAnotacao
                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/50 hover:from-blue-600 hover:to-blue-700'
                                    : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300 hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900 dark:hover:to-blue-800'
                                }`}
                                title={temAnotacao ? 'Ver anotação' : (podeEditar ? 'Adicionar anotação' : 'Ver anotações')}
                              >
                                <MessageSquare className="w-5 h-5 mx-auto" />
                              </button>
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
                          <div className="h-px bg-gray-300 dark:bg-gray-600 my-1"></div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">✓ Presenças:</span>
                            <span className="font-bold text-green-600 dark:text-green-400">{stats.presencas}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">✗ Faltas:</span>
                            <span className="font-bold text-red-600 dark:text-red-400">{stats.faltas}</span>
                          </div>
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

      {/* Modal de Gerenciar Funcionários */}
      {modalGerenciarFuncionarios && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Filter className="w-6 h-6" />
                Gerenciar Visibilidade dos Funcionários
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Selecione os funcionários que deseja ocultar da tabela de escala
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-2">
                {funcionarios
                  .filter(f => setorSelecionado === 'todos' || f.setor === setorSelecionado)
                  .map(func => (
                    <div
                      key={func.id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                        funcionariosOcultos.includes(func.id)
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-750'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 dark:text-white">
                            {func.nome}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {func.cargo} • {func.setor}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => toggleFuncionarioOculto(func.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          funcionariosOcultos.includes(func.id)
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
                      >
                        {funcionariosOcultos.includes(func.id) ? (
                          <>
                            <Eye className="w-4 h-4" />
                            Mostrar
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4" />
                            Ocultar
                          </>
                        )}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              {funcionariosOcultos.length > 0 && (
                <button
                  onClick={() => setFuncionariosOcultos([])}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Mostrar Todos ({funcionariosOcultos.length})
                </button>
              )}
              <button
                onClick={() => setModalGerenciarFuncionarios(false)}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configurações Unificado */}
      {modalConfiguracoes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Settings className="w-6 h-6 text-blue-500" />
                Gerenciar Funcionários e Horários
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Configure horários de trabalho e gerencie a visibilidade dos funcionários
              </p>

              {/* Abas */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setAbaGerenciar('horarios')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all shadow-md ${
                    abaGerenciar === 'horarios'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-500/50'
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700'
                  }`}
                >
                  ⏰ Configurar Horários
                </button>
                {(() => {
                  const cargoLower = (usuarioAtual?.cargo || '').toLowerCase();
                  const podeGerenciar = usuarioAtual?.nivel === 4 || 
                                       usuarioAtual?.nivel === 3 || 
                                       cargoLower.includes('supervisor') || 
                                       cargoLower.includes('encarregado') || 
                                       cargoLower.includes('gerente');
                  return podeGerenciar && (
                    <button
                      onClick={() => setAbaGerenciar('criar-horarios')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all shadow-md ${
                        abaGerenciar === 'criar-horarios'
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-blue-500/50'
                          : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700'
                      }`}
                    >
                      ➕ Criar Horários
                    </button>
                  );
                })()}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {/* Aba de Horários */}
              {abaGerenciar === 'horarios' && (
                <div className="space-y-6">
                  {/* Info Box */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-300 dark:border-blue-600 rounded-xl p-4 shadow-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
                      <strong className="flex items-center gap-2 mb-2">
                        <span className="text-blue-600 dark:text-blue-400">ℹ️</span> Atribuição de Horários
                      </strong>
                      Defina os horários de trabalho para cada funcionário. Use os horários padrão 
                      <span className="font-bold bg-blue-200 dark:bg-blue-800 px-2 py-0.5 rounded mx-1">M</span>,
                      <span className="font-bold bg-blue-200 dark:bg-blue-800 px-2 py-0.5 rounded mx-1">M1</span>,
                      <span className="font-bold bg-blue-200 dark:bg-blue-800 px-2 py-0.5 rounded mx-1">M4</span>
                      ou os horários personalizados criados para cada setor.
                      <br/>
                      <span className="text-xs italic mt-2 block text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-800/30 p-2 rounded">
                        💡 Para criar novos horários personalizados, clique na aba <strong>"➕ Criar Horários"</strong>
                      </span>
                    </p>
                  </div>

                  {/* Lista de Funcionários com Seleção de Horário */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg px-3 py-1 text-sm">
                        👥 Atribuir Horários aos Funcionários
                      </span>
                    </h4>
                    {funcionariosFiltrados.map(func => (
                      <div
                        key={func.id}
                        className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-750 shadow-md hover:shadow-lg transition-all"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 dark:text-white">
                            {func.nome}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                            {func.cargo} • {func.setor}
                          </span>
                        </div>
                        
                        <div className="flex gap-2 flex-wrap">
                          {/* Horários Padrão */}
                          {['M', 'M1', 'M4', 'VAZIO'].map(tipo => {
                            const config = TIPOS_ESCALA[tipo];
                            const isAtivo = configuracoesEscala[func.id]?.tipoEscala === tipo;
                            return (
                              <button
                                key={tipo}
                                onClick={() => salvarConfiguracaoEscala(func.id, tipo)}
                                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all transform hover:scale-105 active:scale-95 shadow-md ${
                                  isAtivo
                                    ? `${config.cor} ${config.corTexto} ring-4 ring-purple-400 dark:ring-purple-500 shadow-lg`
                                    : 'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 text-gray-700 dark:text-gray-300 hover:from-gray-300 hover:to-gray-400 dark:hover:from-gray-500 dark:hover:to-gray-600'
                                }`}
                              >
                                {config.label}
                              </button>
                            );
                          })}
                          
                          {/* Horários Personalizados do Setor */}
                          {Object.values(horariosPersonalizados)
                            .filter(horario => horario.setorId === func.setorId || horario.setorNome === func.setor)
                            .map(horario => {
                              const isAtivo = configuracoesEscala[func.id]?.tipoEscala === horario.nome;
                              return (
                                <button
                                  key={horario.id}
                                  onClick={() => salvarConfiguracaoEscala(func.id, horario.nome)}
                                  className={`px-4 py-2 rounded-lg font-bold text-xs transition-all transform hover:scale-105 active:scale-95 shadow-md ${
                                    isAtivo
                                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white ring-4 ring-purple-400 dark:ring-purple-500 shadow-lg'
                                      : 'bg-gradient-to-br from-purple-200 to-indigo-200 dark:from-purple-700 dark:to-indigo-700 text-purple-800 dark:text-purple-200 hover:from-purple-300 hover:to-indigo-300 dark:hover:from-purple-600 dark:hover:to-indigo-600'
                                  }`}
                                  title={`${horario.nome}: ${horario.descricao}`}
                                >
                                  {horario.nome}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Aba de Criar Horários */}
              {abaGerenciar === 'criar-horarios' && (
                <div className="space-y-6">
                  {/* Info Box */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-600 rounded-xl p-4 shadow-lg">
                    <p className="text-sm text-green-900 dark:text-green-200 leading-relaxed">
                      <strong className="flex items-center gap-2 mb-2">
                        <span className="text-green-600 dark:text-green-400">✨</span> Criar Horários Personalizados
                      </strong>
                      Crie horários específicos para os funcionários do seu setor. Os horários criados aqui ficarão disponíveis apenas para funcionários do setor selecionado.
                    </p>
                  </div>

                  {/* Formulário de Criação de Horário */}
                  <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-blue-900/30 dark:via-cyan-900/30 dark:to-blue-800/30 border-2 border-blue-300 dark:border-blue-600 rounded-xl p-6 shadow-xl">
                    <h4 className="text-xl font-bold text-blue-900 dark:text-blue-200 mb-6 flex items-center gap-3">
                      <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl shadow-lg">
                        ➕
                      </span>
                      Novo Horário Personalizado
                    </h4>
                    
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-sm font-bold text-blue-900 dark:text-blue-200 mb-3 uppercase tracking-wide flex items-center gap-2">
                            <span className="text-blue-600">📝</span> Nome do Horário *
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: A, B, T1"
                            value={novoHorario.nome}
                            onChange={(e) => setNovoHorario({ ...novoHorario, nome: e.target.value.toUpperCase() })}
                            className="w-full px-4 py-3 border-2 border-blue-300 dark:border-blue-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-md text-lg font-bold"
                            maxLength="3"
                            required
                          />
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                            Máximo 3 caracteres (ex: A, T1, N2)
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-bold text-blue-900 dark:text-blue-200 mb-3 uppercase tracking-wide flex items-center gap-2">
                            <span className="text-blue-600">⏰</span> Período *
                          </label>
                          <input
                            type="text"
                            placeholder="08:00-17:00"
                            value={novoHorario.descricao}
                            onChange={(e) => setNovoHorario({ ...novoHorario, descricao: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-blue-300 dark:border-blue-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-md text-lg"
                            required
                          />
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                            Formato: HH:MM-HH:MM
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-bold text-blue-900 dark:text-blue-200 mb-3 uppercase tracking-wide flex items-center gap-2">
                            <span className="text-blue-600">🏢</span> Setor *
                          </label>
                          <select
                            value={novoHorario.setor}
                            onChange={(e) => setNovoHorario({ ...novoHorario, setor: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-blue-300 dark:border-blue-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-md text-lg"
                            required
                          >
                            <option value="">Selecione o setor...</option>
                            {setores.map(setor => (
                              <option key={setor} value={setor}>{setor}</option>
                            ))}
                          </select>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                            Horário será exclusivo deste setor
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          if (!novoHorario.nome.trim() || !novoHorario.descricao.trim() || !novoHorario.setor) {
                            toast.warning('Preencha todos os campos obrigatórios!');
                            return;
                          }

                          try {
                            // Salvar no Firebase
                            const horariosRef = collection(db, 'horarios_personalizados');
                            await addDoc(horariosRef, {
                              nome: novoHorario.nome.trim().toUpperCase(),
                              descricao: novoHorario.descricao.trim(),
                              setorNome: novoHorario.setor,
                              setorId: '', // Pode ser preenchido se tiver ID do setor
                              empresaId: usuarioAtual?.empresaId || '',
                              empresaNome: empresas.find(e => e.id === usuarioAtual?.empresaId)?.nome || '',
                              criadoPor: usuarioAtual?.nome || usuarioAtual?.email || '',
                              criadoPorId: usuarioAtual?.id || '',
                              ativo: true,
                              dataCriacao: serverTimestamp(),
                              dataAtualizacao: serverTimestamp()
                            });

                            toast.success(`✅ Horário ${novoHorario.nome} criado com sucesso!`);
                            setNovoHorario({ nome: '', descricao: '', setor: '' });
                          } catch (error) {
                            console.error('Erro ao criar horário:', error);
                            toast.error('Erro ao criar horário. Tente novamente.');
                          }
                        }}
                        className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 text-white rounded-xl hover:from-blue-700 hover:via-cyan-700 hover:to-blue-700 transition-all font-bold text-lg shadow-2xl hover:shadow-blue-500/50 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                      >
                        <span className="text-2xl">➕</span>
                        Criar Horário Personalizado
                      </button>
                    </div>
                  </div>

                  {/* Lista de Horários Criados */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-gray-200 dark:border-gray-700">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                      <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg px-4 py-2">
                        📋 Horários Personalizados Criados
                      </span>
                    </h4>
                    
                    {Object.values(horariosPersonalizados).length > 0 ? (
                      <div className="space-y-3">
                        {Object.values(horariosPersonalizados)
                          .filter(horario => 
                            usuarioAtual?.nivel === 4 || 
                            horario.setorNome === usuarioAtual?.setor ||
                            horario.criadoPorId === usuarioAtual?.id
                          )
                          .map(horario => (
                            <div
                              key={horario.id}
                              className="flex items-center justify-between p-5 rounded-xl border-2 border-purple-200 dark:border-purple-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 shadow-md hover:shadow-lg transition-all"
                            >
                              <div className="flex items-center gap-4">
                                <span className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-xl text-2xl shadow-lg">
                                  {horario.nome}
                                </span>
                                <div className="flex flex-col">
                                  <span className="font-bold text-gray-900 dark:text-white text-lg">
                                    {horario.descricao}
                                  </span>
                                  <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    <span>🏢 {horario.setorNome}</span>
                                    {horario.criadoPor && <span>👤 {horario.criadoPor}</span>}
                                  </div>
                                </div>
                              </div>
                              
                              <button
                                onClick={async () => {
                                  if (window.confirm(`Deseja realmente excluir o horário ${horario.nome}?`)) {
                                    try {
                                      await deleteDoc(doc(db, 'horarios_personalizados', horario.id));
                                      toast.success('Horário excluído com sucesso!');
                                    } catch (error) {
                                      console.error('Erro ao excluir horário:', error);
                                      toast.error('Erro ao excluir horário');
                                    }
                                  }
                                }}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-md transform hover:scale-105 active:scale-95"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Nenhum horário personalizado criado ainda</p>
                        <p className="text-sm mt-2">Use o formulário acima para criar seu primeiro horário</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              <button
                onClick={() => {
                  setModalConfiguracoes(false);
                  setAbaGerenciar('horarios');
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 dark:from-gray-500 dark:to-gray-600 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 dark:hover:from-gray-400 dark:hover:to-gray-500 transition-all font-bold shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
              >
                ✓ Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Filtros - Empresa e Setor */}
      {modalFiltros && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Filter className="w-6 h-6 text-blue-500" />
                Filtros Avançados
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Filtre os funcionários por empresa e setor
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Filtro de Empresa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Empresa
                </label>
                <select
                  value={empresaSelecionada}
                  onChange={(e) => {
                    setEmpresaSelecionada(e.target.value);
                    setSetorSelecionado('todos');
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="todas">🏢 Todas as Empresas</option>
                  {empresas.map(empresa => (
                    <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>
                  ))}
                </select>
              </div>

              {/* Filtro de Setor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Setor
                </label>
                <select
                  value={setorSelecionado}
                  onChange={(e) => setSetorSelecionado(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  disabled={empresaSelecionada === 'todas' && setoresFiltrados.length === 0}
                >
                  <option value="todos">🏗️ Todos os Setores</option>
                  {setoresFiltrados.map(setor => (
                    <option key={setor} value={setor}>{setor}</option>
                  ))}
                </select>
              </div>

              {/* Resumo dos Filtros Ativos */}
              {(empresaSelecionada !== 'todas' || setorSelecionado !== 'todos') && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    ✓ Filtros Ativos:
                  </p>
                  <div className="space-y-1">
                    {empresaSelecionada !== 'todas' && (
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        • Empresa: <span className="font-semibold">{empresas.find(e => e.id === empresaSelecionada)?.nome}</span>
                      </p>
                    )}
                    {setorSelecionado !== 'todos' && (
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        • Setor: <span className="font-semibold">{setorSelecionado}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              {/* Botão Limpar Filtros */}
              {(empresaSelecionada !== 'todas' || setorSelecionado !== 'todos') && (
                <button
                  onClick={() => {
                    setEmpresaSelecionada('todas');
                    setSetorSelecionado('todos');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Limpar
                </button>
              )}
              
              {/* Botão Aplicar */}
              <button
                onClick={() => setModalFiltros(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Anotação do Funcionário */}
      {modalAnotacao.aberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              Anotação do Funcionário
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Funcionário: {funcionarios.find(f => f.id === modalAnotacao.funcionarioId)?.nome}
              <br />
              Dia: {modalAnotacao.dia}/{mesAtual.getMonth() + 1}/{mesAtual.getFullYear()}
            </p>
            <textarea
              value={modalAnotacao.anotacao}
              onChange={(e) => setModalAnotacao({ ...modalAnotacao, anotacao: e.target.value })}
              className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Digite sua anotação aqui..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => salvarAnotacaoFuncionario(modalAnotacao.funcionarioId, modalAnotacao.dia, modalAnotacao.anotacao)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Salvar
              </button>
              <button
                onClick={() => setModalAnotacao({ aberto: false, tipo: null, funcionarioId: null, dia: null, anotacao: '' })}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Anotação do Dia */}
      {modalAnotacaoDia.aberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <StickyNote className="w-6 h-6" />
              Anotação do Dia
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Data: {modalAnotacaoDia.dia}/{mesAtual.getMonth() + 1}/{mesAtual.getFullYear()}
            </p>
            <textarea
              value={modalAnotacaoDia.anotacao}
              onChange={(e) => setModalAnotacaoDia({ ...modalAnotacaoDia, anotacao: e.target.value })}
              className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-yellow-500 resize-none"
              placeholder="Digite uma anotação geral para este dia..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => salvarAnotacaoDia(modalAnotacaoDia.dia, modalAnotacaoDia.anotacao)}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
              >
                Salvar
              </button>
              <button
                onClick={() => setModalAnotacaoDia({ aberto: false, dia: null, anotacao: '' })}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Resumo de Dias */}
      {modalResumo.aberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-green-600" />
                  {modalResumo.titulo}
                </h3>
                <button
                  onClick={() => setModalResumo({ aberto: false, tipo: null, dados: [], titulo: '' })}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {modalResumo.tipo === 'feriados' && modalResumo.dados.length > 0 ? (
                <div className="space-y-3">
                  {modalResumo.dados.map((feriado, index) => (
                    <div key={index} className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-l-4 border-orange-500 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-gray-800 dark:text-white">
                            {feriado.nome}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {feriado.diaSemana}, {feriado.data}
                          </p>
                        </div>
                        <div className="bg-orange-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                          {feriado.dia}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : modalResumo.tipo === 'uteis' && modalResumo.dados.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {modalResumo.dados.map((dia, index) => (
                    <div key={index} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {dia.dia}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {dia.diaSemana}
                      </div>
                    </div>
                  ))}
                </div>
              ) : modalResumo.tipo === 'finsdesemana' && modalResumo.dados.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {modalResumo.dados.map((dia, index) => (
                    <div key={index} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {dia.dia}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {dia.diaSemana}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Nenhum registro encontrado
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                <span className="font-bold text-lg text-gray-800 dark:text-white">
                  {modalResumo.dados.length}
                </span>
                {' '}
                {modalResumo.tipo === 'feriados' ? 'feriado(s)' : modalResumo.tipo === 'uteis' ? 'dia(s) útil(eis)' : 'fim(ns) de semana'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animação de Partículas Sofisticada */}
      {animacaoAtiva && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {/* Partículas principais */}
          {Array.from({ length: 25 }).map((_, i) => {
            const angulo = (Math.PI * 2 * i) / 25;
            const distanciaBase = 80;
            const variacao = Math.random() * 40;
            const destinoX = animacaoAtiva.destino.x + Math.cos(angulo) * (distanciaBase + variacao);
            const destinoY = animacaoAtiva.destino.y + Math.sin(angulo) * (distanciaBase + variacao);
            const delay = Math.random() * 150;
            const duracao = 1 + Math.random() * 0.3;
            
            const configCores = {
              presente: { bg: 'bg-green-500', glow: '#22c55e', sombra: '0 0 20px rgba(34, 197, 94, 0.8)' },
              ausente: { bg: 'bg-red-500', glow: '#ef4444', sombra: '0 0 20px rgba(239, 68, 68, 0.8)' },
              folga: { bg: 'bg-yellow-400', glow: '#facc15', sombra: '0 0 20px rgba(250, 204, 21, 0.8)' }
            };
            
            const cor = configCores[animacaoAtiva.tipo];
            const tamanho = 2 + Math.random() * 2;

            return (
              <div
                key={`particle-${i}`}
                className={`absolute ${cor.bg} rounded-full`}
                style={{
                  width: `${tamanho}px`,
                  height: `${tamanho}px`,
                  left: `${animacaoAtiva.origem.x}px`,
                  top: `${animacaoAtiva.origem.y}px`,
                  animation: `particle-flow-${i} ${duracao}s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                  animationDelay: `${delay}ms`,
                  boxShadow: cor.sombra,
                  filter: 'blur(0.5px)'
                }}
              >
                <style>{`
                  @keyframes particle-flow-${i} {
                    0% {
                      transform: translate(0, 0) scale(1) rotate(0deg);
                      opacity: 1;
                    }
                    30% {
                      transform: translate(${(destinoX - animacaoAtiva.origem.x) * 0.3}px, ${(destinoY - animacaoAtiva.origem.y) * 0.3}px) scale(1.8) rotate(${120 * i}deg);
                      opacity: 0.9;
                    }
                    60% {
                      transform: translate(${(destinoX - animacaoAtiva.origem.x) * 0.7}px, ${(destinoY - animacaoAtiva.origem.y) * 0.7}px) scale(1.2) rotate(${240 * i}deg);
                      opacity: 0.7;
                    }
                    100% {
                      transform: translate(${destinoX - animacaoAtiva.origem.x}px, ${destinoY - animacaoAtiva.origem.y}px) scale(0) rotate(${360 * i}deg);
                      opacity: 0;
                    }
                  }
                `}</style>
              </div>
            );
          })}
          
          {/* Onda de energia do botão */}
          <div
            className={`absolute rounded-full ${
              animacaoAtiva.tipo === 'presente' ? 'bg-green-500/30' :
              animacaoAtiva.tipo === 'ausente' ? 'bg-red-500/30' : 'bg-yellow-400/30'
            }`}
            style={{
              left: `${animacaoAtiva.origem.x}px`,
              top: `${animacaoAtiva.origem.y}px`,
              width: '20px',
              height: '20px',
              transform: 'translate(-50%, -50%)',
              animation: 'ripple-effect 0.8s ease-out forwards'
            }}
          >
            <style>{`
              @keyframes ripple-effect {
                0% {
                  transform: translate(-50%, -50%) scale(1);
                  opacity: 0.8;
                }
                100% {
                  transform: translate(-50%, -50%) scale(8);
                  opacity: 0;
                }
              }
            `}</style>
          </div>
        </div>
      )}

      {/* Animação de verificação removida - usando apenas partículas */}
      {false && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <style>{`
            @keyframes scan-line {
              0%, 100% { transform: translateY(-100%); }
              50% { transform: translateY(100%); }
            }
            @keyframes scan-line-warning {
              0%, 100% { transform: translateY(-100%) scaleX(1.2); }
              50% { transform: translateY(100%) scaleX(1.2); }
            }
            @keyframes pulse-glow-presente {
              0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.5); }
              50% { box-shadow: 0 0 40px rgba(34, 197, 94, 0.8), 0 0 60px rgba(34, 197, 94, 0.4); }
            }
            @keyframes pulse-glow-ausente {
              0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); }
              50% { box-shadow: 0 0 40px rgba(239, 68, 68, 0.8), 0 0 60px rgba(239, 68, 68, 0.4); }
            }
            @keyframes pulse-glow-folga {
              0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.5); }
              50% { box-shadow: 0 0 40px rgba(251, 191, 36, 0.8), 0 0 60px rgba(251, 191, 36, 0.4); }
            }
            @keyframes sun-rays {
              0% { transform: rotate(0deg) scale(1); opacity: 0.8; }
              50% { transform: rotate(180deg) scale(1.1); opacity: 1; }
              100% { transform: rotate(360deg) scale(1); opacity: 0.8; }
            }
            @keyframes confetti-fall {
              0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { transform: translateY(400px) rotate(720deg); opacity: 0; }
            }
            @keyframes beach-scan {
              0% { top: 0%; }
              50% { top: 50%; }
              100% { top: 100%; }
            }
            @keyframes sun-draw {
              0% { stroke-dashoffset: 300; opacity: 0; }
              50% { opacity: 1; }
              100% { stroke-dashoffset: 0; opacity: 1; }
            }
            @keyframes rotate-border {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes rotate-border-reverse {
              0% { transform: rotate(360deg); }
              100% { transform: rotate(0deg); }
            }
            @keyframes data-flow {
              0% { transform: translateX(-100%); opacity: 0; }
              50% { opacity: 1; }
              100% { transform: translateX(100%); opacity: 0; }
            }
            @keyframes check-draw {
              0% { stroke-dashoffset: 100; }
              100% { stroke-dashoffset: 0; }
            }
            @keyframes x-draw {
              0% { stroke-dashoffset: 200; }
              100% { stroke-dashoffset: 0; }
            }
            @keyframes hologram-flicker {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.8; }
            }
            @keyframes glitch-effect {
              0%, 100% { transform: translate(0, 0); opacity: 1; }
              20% { transform: translate(-2px, 2px); opacity: 0.8; }
              40% { transform: translate(2px, -2px); opacity: 0.9; }
              60% { transform: translate(-2px, -2px); opacity: 0.7; }
              80% { transform: translate(2px, 2px); opacity: 0.85; }
            }
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-5px) rotate(-2deg); }
              75% { transform: translateX(5px) rotate(2deg); }
            }
            @keyframes warning-pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.6; transform: scale(1.1); }
            }
          `}</style>

          <div className="relative">
            {/* Container principal - cores dinâmicas baseadas no tipo */}
            <div className={`relative rounded-2xl p-8 border-2 shadow-2xl overflow-hidden ${
              animacaoVerificacao.tipo === 'presente'
                ? 'bg-gradient-to-br from-gray-900 via-emerald-900/50 to-gray-900 border-green-500/50'
                : animacaoVerificacao.tipo === 'ausente'
                ? 'bg-gradient-to-br from-gray-900 via-red-900/50 to-gray-900 border-red-500/50'
                : 'bg-gradient-to-br from-gray-900 via-amber-900/50 to-gray-900 border-yellow-500/50'
            }`}>
              {/* Borda animada rotativa - verde para presente, vermelho para ausente, dourada para folga */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <div 
                  className={`absolute inset-[-2px] opacity-50 ${
                    animacaoVerificacao.tipo === 'presente'
                      ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-500'
                      : animacaoVerificacao.tipo === 'ausente'
                      ? 'bg-gradient-to-r from-red-500 via-orange-500 to-red-500'
                      : 'bg-gradient-to-r from-yellow-400 via-amber-500 via-orange-400 via-pink-400 to-yellow-400'
                  }`}
                  style={{ 
                    animation: animacaoVerificacao.tipo === 'presente' 
                      ? 'rotate-border 3s linear infinite' 
                      : animacaoVerificacao.tipo === 'ausente'
                      ? 'rotate-border-reverse 2s linear infinite'
                      : 'rotate-border 4s linear infinite'
                  }}
                />
              </div>

              {/* Grade de fundo tech - cor baseada no tipo */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: animacaoVerificacao.tipo === 'presente'
                    ? 'linear-gradient(rgba(34, 197, 94, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.5) 1px, transparent 1px)'
                    : animacaoVerificacao.tipo === 'ausente'
                    ? 'linear-gradient(rgba(239, 68, 68, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(239, 68, 68, 0.5) 1px, transparent 1px)'
                    : 'linear-gradient(rgba(251, 191, 36, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(251, 191, 36, 0.5) 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }} />
              </div>

              {/* Efeito de alerta para ausente */}
              {animacaoVerificacao.tipo === 'ausente' && animacaoVerificacao.fase === 'scanning' && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-4 right-4 flex items-center gap-2 animate-pulse">
                    <div className="w-3 h-3 bg-red-500 rounded-full" style={{ animation: 'warning-pulse 1s ease-in-out infinite' }} />
                    <span className="text-red-400 text-xs font-bold">ALERTA</span>
                  </div>
                </div>
              )}

              {/* Efeito de celebração para folga - confetes caindo */}
              {animacaoVerificacao.tipo === 'folga' && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(15)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: '-20px',
                        backgroundColor: ['#fbbf24', '#fb923c', '#ec4899', '#06b6d4', '#a855f7'][i % 5],
                        animation: `confetti-fall ${2 + Math.random() * 2}s linear ${Math.random() * 0.5}s infinite`
                      }}
                    />
                  ))}
                </div>
              )}

              <div className="relative z-10 flex flex-col items-center gap-6 min-w-[400px]">
                {/* Foto do funcionário com scanner */}
                <div className="relative">
                  {/* Anel externo pulsante - cor baseada no tipo */}
                  <div className={`absolute inset-[-20px] rounded-full border-4 animate-ping ${
                    animacaoVerificacao.tipo === 'presente' 
                      ? 'border-green-500/30' 
                      : animacaoVerificacao.tipo === 'ausente'
                      ? 'border-red-500/30'
                      : 'border-yellow-500/30'
                  }`} />
                  <div 
                    className={`absolute inset-[-10px] rounded-full border-2 ${
                      animacaoVerificacao.tipo === 'presente' 
                        ? 'border-emerald-400/50' 
                        : animacaoVerificacao.tipo === 'ausente'
                        ? 'border-orange-400/50'
                        : 'border-amber-400/50'
                    }`} 
                    style={{ 
                      animation: animacaoVerificacao.tipo === 'presente' 
                        ? 'pulse-glow-presente 2s ease-in-out infinite' 
                        : animacaoVerificacao.tipo === 'ausente'
                        ? 'pulse-glow-ausente 2s ease-in-out infinite'
                        : 'pulse-glow-folga 2s ease-in-out infinite'
                    }} 
                  />

                  {/* Raios de sol para folga */}
                  {animacaoVerificacao.tipo === 'folga' && (
                    <div className="absolute inset-[-30px] pointer-events-none">
                      <svg className="w-full h-full" viewBox="0 0 200 200" style={{ animation: 'sun-rays 5s linear infinite' }}>
                        {[...Array(12)].map((_, i) => (
                          <line
                            key={i}
                            x1="100"
                            y1="100"
                            x2="100"
                            y2="20"
                            stroke="url(#sunGradient)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            opacity="0.6"
                            transform={`rotate(${i * 30} 100 100)`}
                          />
                        ))}
                        <defs>
                          <linearGradient id="sunGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  )}
                  
                  {/* Container da foto */}
                  <div 
                    className={`relative w-32 h-32 rounded-full overflow-hidden border-4 shadow-2xl ${
                      animacaoVerificacao.tipo === 'presente' 
                        ? 'border-green-500' 
                        : animacaoVerificacao.tipo === 'ausente'
                        ? 'border-red-500'
                        : 'border-yellow-400'
                    }`}
                    style={{ 
                      animation: animacaoVerificacao.tipo === 'ausente' && animacaoVerificacao.fase === 'scanning' 
                        ? 'shake 0.5s ease-in-out infinite' 
                        : 'none'
                    }}
                  >
                    {animacaoVerificacao.funcionario?.photoURL ? (
                      <img 
                        src={animacaoVerificacao.funcionario.photoURL} 
                        alt={animacaoVerificacao.funcionario.nome}
                        className="w-full h-full object-cover"
                        style={{ 
                          animation: animacaoVerificacao.tipo === 'ausente' && animacaoVerificacao.fase === 'analyzing'
                            ? 'glitch-effect 0.3s ease-in-out infinite'
                            : 'hologram-flicker 3s ease-in-out infinite'
                        }}
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br flex items-center justify-center text-white text-4xl font-bold ${
                        animacaoVerificacao.tipo === 'presente'
                          ? 'from-green-600 to-emerald-600'
                          : animacaoVerificacao.tipo === 'ausente'
                          ? 'from-red-600 to-orange-600'
                          : 'from-yellow-500 to-amber-600'
                      }`}>
                        {animacaoVerificacao.funcionario?.nome?.charAt(0) || '?'}
                      </div>
                    )}
                    
                    {/* Linha de scan - diferente para presente/ausente/folga */}
                    {animacaoVerificacao.fase === 'scanning' && (
                      <div className="absolute inset-0 overflow-hidden">
                        {animacaoVerificacao.tipo === 'presente' ? (
                          <div 
                            className="absolute w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                            style={{ animation: 'scan-line 2s ease-in-out infinite' }}
                          />
                        ) : animacaoVerificacao.tipo === 'ausente' ? (
                          <>
                            <div 
                              className="absolute w-full h-2 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-lg shadow-red-500/50"
                              style={{ animation: 'scan-line-warning 1.5s ease-in-out infinite' }}
                            />
                            <div 
                              className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent"
                              style={{ animation: 'scan-line-warning 1.5s ease-in-out infinite 0.3s' }}
                            />
                          </>
                        ) : (
                          <div 
                            className="absolute w-full h-1.5 bg-gradient-to-r from-transparent via-yellow-300 to-transparent shadow-lg shadow-yellow-300/50"
                            style={{ animation: 'beach-scan 2.5s ease-in-out infinite' }}
                          />
                        )}
                      </div>
                    )}

                    {/* Grid de análise - cor baseada no tipo */}
                    {animacaoVerificacao.fase === 'analyzing' && (
                      <div className="absolute inset-0 opacity-30">
                        <div className="absolute inset-0" style={{
                          backgroundImage: animacaoVerificacao.tipo === 'presente'
                            ? 'linear-gradient(rgba(34, 197, 94, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.8) 1px, transparent 1px)'
                            : animacaoVerificacao.tipo === 'ausente'
                            ? 'linear-gradient(rgba(239, 68, 68, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(239, 68, 68, 0.8) 1px, transparent 1px)'
                            : 'linear-gradient(rgba(251, 191, 36, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(251, 191, 36, 0.8) 1px, transparent 1px)',
                          backgroundSize: '10px 10px'
                        }} />
                      </div>
                    )}
                  </div>

                  {/* Partículas orbitando - cor e comportamento baseados no tipo */}
                  {['analyzing', 'verifying'].includes(animacaoVerificacao.fase) && (
                    <>
                      {animacaoVerificacao.tipo === 'presente' ? (
                        // Partículas suaves e ordenadas para presente
                        [0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="absolute w-2 h-2 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50"
                            style={{
                              top: '50%',
                              left: '50%',
                              animation: `orbit-${i} ${2 + i * 0.5}s linear infinite`,
                              transformOrigin: '0 0'
                            }}
                          >
                            <style>{`
                              @keyframes orbit-${i} {
                                from {
                                  transform: rotate(${i * 72}deg) translateX(80px) rotate(${-i * 72}deg);
                                }
                                to {
                                  transform: rotate(${360 + i * 72}deg) translateX(80px) rotate(${-360 - i * 72}deg);
                                }
                              }
                            `}</style>
                          </div>
                        ))
                      ) : animacaoVerificacao.tipo === 'ausente' ? (
                        // Partículas erráticas e caóticas para ausente
                        [0, 1, 2, 3, 4, 5, 6].map((i) => (
                          <div
                            key={i}
                            className={`absolute rounded-full shadow-lg ${
                              i % 2 === 0 ? 'w-3 h-3 bg-red-500 shadow-red-500/50' : 'w-2 h-2 bg-orange-400 shadow-orange-400/50'
                            }`}
                            style={{
                              top: '50%',
                              left: '50%',
                              animation: `orbit-warning-${i} ${1.5 + i * 0.3}s linear infinite`,
                              transformOrigin: '0 0'
                            }}
                          >
                            <style>{`
                              @keyframes orbit-warning-${i} {
                                from {
                                  transform: rotate(${i * 51.4}deg) translateX(${70 + Math.random() * 20}px) rotate(${-i * 51.4}deg) scale(${0.8 + Math.random() * 0.4});
                                }
                                to {
                                  transform: rotate(${360 + i * 51.4}deg) translateX(${70 + Math.random() * 20}px) rotate(${-360 - i * 51.4}deg) scale(${1 + Math.random() * 0.5});
                                }
                              }
                            `}</style>
                          </div>
                        ))
                      ) : (
                        // Partículas coloridas e celebratórias para folga
                        [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                          const colors = ['#fbbf24', '#fb923c', '#ec4899', '#06b6d4', '#a855f7'];
                          return (
                            <div
                              key={i}
                              className="absolute w-2 h-2 rounded-full shadow-lg"
                              style={{
                                backgroundColor: colors[i % colors.length],
                                boxShadow: `0 0 10px ${colors[i % colors.length]}`,
                                top: '50%',
                                left: '50%',
                                animation: `orbit-celebration-${i} ${2.5 + i * 0.3}s ease-in-out infinite`,
                                transformOrigin: '0 0'
                              }}
                            >
                              <style>{`
                                @keyframes orbit-celebration-${i} {
                                  from {
                                    transform: rotate(${i * 40}deg) translateX(${75 + (i % 3) * 10}px) rotate(${-i * 40}deg);
                                  }
                                  to {
                                    transform: rotate(${360 + i * 40}deg) translateX(${75 + (i % 3) * 10}px) rotate(${-360 - i * 40}deg);
                                  }
                                }
                              `}</style>
                            </div>
                          );
                        })
                      )}
                    </>
                  )}
                </div>

                {/* Informações do funcionário */}
                <div className="text-center space-y-2">
                  <h3 className={`text-2xl font-bold tracking-wider ${
                    animacaoVerificacao.tipo === 'presente' 
                      ? 'text-white' 
                      : animacaoVerificacao.tipo === 'ausente'
                      ? 'text-red-100'
                      : 'text-yellow-50'
                  }`}>
                    {animacaoVerificacao.funcionario?.nome || 'Funcionário'}
                  </h3>
                  <p className={`text-sm font-mono ${
                    animacaoVerificacao.tipo === 'presente' 
                      ? 'text-emerald-300' 
                      : animacaoVerificacao.tipo === 'ausente'
                      ? 'text-orange-300'
                      : 'text-amber-300'
                  }`}>
                    ID: {animacaoVerificacao.funcionarioId}
                  </p>
                  <p className={`text-sm ${
                    animacaoVerificacao.tipo === 'presente' 
                      ? 'text-emerald-300' 
                      : animacaoVerificacao.tipo === 'ausente'
                      ? 'text-red-300'
                      : 'text-yellow-300'
                  }`}>
                    {animacaoVerificacao.funcionario?.cargo || 'Cargo não definido'}
                  </p>
                </div>

                {/* Status da verificação */}
                <div className="w-full space-y-3">
                  {/* Texto do status - mensagens diferentes para presente/ausente/folga */}
                  <div className="text-center">
                    {animacaoVerificacao.fase === 'scanning' && (
                      <div className="space-y-1">
                        <p className={`text-lg font-mono animate-pulse ${
                          animacaoVerificacao.tipo === 'presente' 
                            ? 'text-emerald-400' 
                            : animacaoVerificacao.tipo === 'ausente'
                            ? 'text-red-400'
                            : 'text-yellow-400'
                        }`}>
                          [ SCANNING ]
                        </p>
                        <p className={`text-sm ${
                          animacaoVerificacao.tipo === 'presente' 
                            ? 'text-green-300' 
                            : animacaoVerificacao.tipo === 'ausente'
                            ? 'text-orange-300'
                            : 'text-amber-300'
                        }`}>
                          {animacaoVerificacao.tipo === 'presente' 
                            ? 'Digitalizando biometria facial...'
                            : animacaoVerificacao.tipo === 'ausente'
                            ? '⚠️ Verificando ausência do funcionário...'
                            : '🌴 Verificando folga programada...'
                          }
                        </p>
                      </div>
                    )}
                    {animacaoVerificacao.fase === 'analyzing' && (
                      <div className="space-y-1">
                        <p className={`text-lg font-mono animate-pulse ${
                          animacaoVerificacao.tipo === 'presente' 
                            ? 'text-emerald-400' 
                            : animacaoVerificacao.tipo === 'ausente'
                            ? 'text-red-400'
                            : 'text-yellow-400'
                        }`}>
                          [ ANALYZING ]
                        </p>
                        <p className={`text-sm ${
                          animacaoVerificacao.tipo === 'presente' 
                            ? 'text-green-300' 
                            : animacaoVerificacao.tipo === 'ausente'
                            ? 'text-orange-300'
                            : 'text-amber-300'
                        }`}>
                          {animacaoVerificacao.tipo === 'presente'
                            ? 'Processando dados do funcionário...'
                            : animacaoVerificacao.tipo === 'ausente'
                            ? '⚠️ Analisando motivo da ausência...'
                            : '☀️ Processando dia de descanso...'
                          }
                        </p>
                      </div>
                    )}
                    {animacaoVerificacao.fase === 'verifying' && (
                      <div className="space-y-1">
                        <p className={`text-lg font-mono animate-pulse ${
                          animacaoVerificacao.tipo === 'presente' 
                            ? 'text-emerald-400' 
                            : animacaoVerificacao.tipo === 'ausente'
                            ? 'text-red-400'
                            : 'text-yellow-400'
                        }`}>
                          [ VERIFYING ]
                        </p>
                        <p className={`text-sm ${
                          animacaoVerificacao.tipo === 'presente' 
                            ? 'text-green-300' 
                            : animacaoVerificacao.tipo === 'ausente'
                            ? 'text-orange-300'
                            : 'text-amber-300'
                        }`}>
                          {animacaoVerificacao.tipo === 'presente'
                            ? 'Verificando credenciais...'
                            : animacaoVerificacao.tipo === 'ausente'
                            ? '⚠️ Registrando falta no sistema...'
                            : '🏖️ Confirmando folga merecida...'
                          }
                        </p>
                      </div>
                    )}
                    {animacaoVerificacao.fase === 'confirmed' && (
                      <div className="space-y-3">
                        {/* Símbolo animado - Check para presente, X para ausente, Sol para folga */}
                        <div className="flex justify-center">
                          <div className="relative w-20 h-20">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                              {/* Círculo de fundo */}
                              <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke={
                                  animacaoVerificacao.tipo === 'presente' 
                                    ? '#10b981' 
                                    : animacaoVerificacao.tipo === 'ausente'
                                    ? '#ef4444'
                                    : '#fbbf24'
                                }
                                strokeWidth="4"
                                className="opacity-20"
                              />
                              {/* Círculo girando */}
                              <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke={
                                  animacaoVerificacao.tipo === 'presente' 
                                    ? '#10b981' 
                                    : animacaoVerificacao.tipo === 'ausente'
                                    ? '#ef4444'
                                    : '#fbbf24'
                                }
                                strokeWidth="4"
                                strokeDasharray="283"
                                strokeDashoffset="0"
                                className="animate-spin"
                                style={{ transformOrigin: 'center', animationDuration: '1s' }}
                              />
                              
                              {/* Checkmark para presente */}
                              {animacaoVerificacao.tipo === 'presente' && (
                                <path
                                  d="M30 50 L45 65 L70 35"
                                  fill="none"
                                  stroke="#10b981"
                                  strokeWidth="6"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeDasharray="100"
                                  strokeDashoffset="100"
                                  style={{ animation: 'check-draw 0.5s ease-out 0.3s forwards' }}
                                />
                              )}
                              
                              {/* X para ausente */}
                              {animacaoVerificacao.tipo === 'ausente' && (
                                <>
                                  <path
                                    d="M35 35 L65 65"
                                    fill="none"
                                    stroke="#ef4444"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    strokeDasharray="100"
                                    strokeDashoffset="100"
                                    style={{ animation: 'x-draw 0.5s ease-out 0.3s forwards' }}
                                  />
                                  <path
                                    d="M65 35 L35 65"
                                    fill="none"
                                    stroke="#ef4444"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    strokeDasharray="100"
                                    strokeDashoffset="100"
                                    style={{ animation: 'x-draw 0.5s ease-out 0.5s forwards' }}
                                  />
                                </>
                              )}

                              {/* Sol para folga */}
                              {animacaoVerificacao.tipo === 'folga' && (
                                <g>
                                  {/* Centro do sol */}
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="18"
                                    fill="#fbbf24"
                                    stroke="#f59e0b"
                                    strokeWidth="2"
                                    strokeDasharray="150"
                                    strokeDashoffset="150"
                                    style={{ animation: 'sun-draw 0.8s ease-out 0.2s forwards' }}
                                  />
                                  {/* Raios do sol */}
                                  {[...Array(8)].map((_, i) => (
                                    <line
                                      key={i}
                                      x1="50"
                                      y1="50"
                                      x2="50"
                                      y2="25"
                                      stroke="#fbbf24"
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                      strokeDasharray="25"
                                      strokeDashoffset="25"
                                      transform={`rotate(${i * 45} 50 50)`}
                                      style={{ 
                                        animation: `sun-draw 0.5s ease-out ${0.3 + i * 0.05}s forwards`,
                                        transformOrigin: '50px 50px'
                                      }}
                                    />
                                  ))}
                                </g>
                              )}
                            </svg>
                          </div>
                        </div>
                        
                        {/* Mensagem final diferente para cada tipo */}
                        <p className={`text-xl font-bold tracking-wide ${
                          animacaoVerificacao.tipo === 'presente' 
                            ? 'text-green-400' 
                            : animacaoVerificacao.tipo === 'ausente'
                            ? 'text-red-400'
                            : 'text-yellow-400'
                        }`}>
                          {animacaoVerificacao.tipo === 'presente' 
                            ? '✓ PRESENÇA CONFIRMADA' 
                            : animacaoVerificacao.tipo === 'ausente'
                            ? '✗ FALTA REGISTRADA'
                            : '🎉 FOLGA CONFIRMADA'
                          }
                        </p>
                        
                        {/* Submensagem contextual */}
                        <p className={`text-sm ${
                          animacaoVerificacao.tipo === 'presente' 
                            ? 'text-green-300' 
                            : animacaoVerificacao.tipo === 'ausente'
                            ? 'text-orange-300'
                            : 'text-amber-300'
                        }`}>
                          {animacaoVerificacao.tipo === 'presente' 
                            ? 'Funcionário marcado como presente'
                            : animacaoVerificacao.tipo === 'ausente'
                            ? '⚠️ Ausência registrada no sistema'
                            : '☀️ Aproveite seu dia de descanso!'
                          }
                        </p>
                        
                        <p className={`text-xs ${
                          animacaoVerificacao.tipo === 'presente' 
                            ? 'text-emerald-400' 
                            : animacaoVerificacao.tipo === 'ausente'
                            ? 'text-red-300'
                            : 'text-yellow-300'
                        }`}>
                          {new Date().toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Dados técnicos - cores baseadas no tipo */}
                  <div className={`grid grid-cols-3 gap-2 pt-4 border-t ${
                    animacaoVerificacao.tipo === 'presente' 
                      ? 'border-green-500/30' 
                      : animacaoVerificacao.tipo === 'ausente'
                      ? 'border-red-500/30'
                      : 'border-yellow-500/30'
                  }`}>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Dia</p>
                      <p className={`text-sm font-mono ${
                        animacaoVerificacao.tipo === 'presente' 
                          ? 'text-emerald-400' 
                          : animacaoVerificacao.tipo === 'ausente'
                          ? 'text-orange-400'
                          : 'text-amber-400'
                      }`}>
                        {animacaoVerificacao.dia}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Status</p>
                      <p className={`text-sm font-mono ${
                        animacaoVerificacao.tipo === 'presente' 
                          ? 'text-green-400' 
                          : animacaoVerificacao.tipo === 'ausente'
                          ? 'text-red-400'
                          : 'text-yellow-400'
                      }`}>
                        {animacaoVerificacao.tipo === 'presente' 
                          ? 'PRESENTE' 
                          : animacaoVerificacao.tipo === 'ausente'
                          ? 'AUSENTE'
                          : 'FOLGA'
                        }
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Hora</p>
                      <p className={`text-sm font-mono ${
                        animacaoVerificacao.tipo === 'presente' 
                          ? 'text-emerald-400' 
                          : animacaoVerificacao.tipo === 'ausente'
                          ? 'text-orange-400'
                          : 'text-amber-400'
                      }`}>
                        {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Raios de luz emanando - cores baseadas no tipo */}
            {animacaoVerificacao.fase === 'confirmed' && (
              <>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`absolute inset-0 ${
                      animacaoVerificacao.tipo === 'presente' ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}
                    style={{
                      animation: `pulse-glow 1s ease-out ${i * 0.2}s`,
                      borderRadius: '50%',
                      transform: `scale(${1 + i * 0.5})`
                    }}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Partículas animadas voando do botão para as estatísticas */}
      {particulas.map((particula) => (
        <div
          key={particula.id}
          className="fixed pointer-events-none z-[9999]"
          style={{
            left: `${particula.startX}px`,
            top: `${particula.startY}px`,
            animation: `fly-to-stat 800ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${particula.delay}ms forwards`,
            '--end-x': `${particula.endX - particula.startX}px`,
            '--end-y': `${particula.endY - particula.startY}px`
          }}
        >
          <div 
            className="w-3 h-3 rounded-full shadow-lg"
            style={{
              backgroundColor: particula.color,
              boxShadow: `0 0 10px ${particula.color}, 0 0 20px ${particula.color}`
            }}
          />
        </div>
      ))}

      <style jsx>{`
        @keyframes fly-to-stat {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          50% {
            transform: translate(calc(var(--end-x) * 0.5), calc(var(--end-y) * 0.5)) scale(1.5);
            opacity: 0.8;
          }
          100% {
            transform: translate(var(--end-x), var(--end-y)) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default EscalaPage;
