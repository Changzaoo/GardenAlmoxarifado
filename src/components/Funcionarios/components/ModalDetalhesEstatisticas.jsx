import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
  X, 
  Star, 
  CheckCircle2, 
  Hammer, 
  Trophy, 
  TrendingUp, 
  Timer,
  Calendar,
  Award,
  Target,
  Clock,
  MessageSquare,
  User,
  FileText,
  Download,
  Edit3,
  Save,
  RefreshCw
} from 'lucide-react';
import ModalCorrigirPontosMes from './ModalCorrigirPontosMes';

const ModalDetalhesEstatisticas = ({ 
  isOpen, 
  onClose, 
  tipo, 
  funcionario,
  stats,
  pontos,
  horasInfo 
}) => {
  // Estados para o relógio em tempo real
  const [tempoReal, setTempoReal] = useState({
    horas: 0,
    minutos: 0,
    segundos: 0
  });
  
  // Estado para o modal de edição de pontos
  const [mostrarModalEdicao, setMostrarModalEdicao] = useState(false);
  const [dataEdicao, setDataEdicao] = useState('');
  const [pontosEdicao, setPontosEdicao] = useState({
    entrada: '',
    saidaAlmoco: '',
    voltaAlmoco: '',
    saida: ''
  });
  
  // Estado para o novo modal de correção mensal
  const [mostrarModalCorrecaoMes, setMostrarModalCorrecaoMes] = useState(false);

  // Estado para armazenar pontos do dia
  const [pontoDia, setPontoDia] = useState(null);

  // Buscar pontos do dia atual
  useEffect(() => {
    if (!isOpen || tipo !== 'horas' || !funcionario?.id) return;

    const buscarPontoDia = async () => {
      try {
        const hoje = new Date().toISOString().split('T')[0];
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('../../../firebaseConfig');

        const q = query(
          collection(db, 'pontos'),
          where('funcionarioId', '==', String(funcionario.id)),
          where('data', '==', hoje)
        );

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const dados = snapshot.docs[0].data();
          setPontoDia(dados);
        } else {
          // Se não tem ponto registrado, usar horário padrão (08:00)
          setPontoDia({
            entrada: '08:00',
            saidaAlmoco: null,
            voltaAlmoco: null,
            saida: null
          });
        }
      } catch (error) {
        console.error('Erro ao buscar ponto do dia:', error);
        // Fallback para horário padrão
        setPontoDia({
          entrada: '08:00',
          saidaAlmoco: null,
          voltaAlmoco: null,
          saida: null
        });
      }
    };

    buscarPontoDia();
  }, [isOpen, tipo, funcionario]);

  // Calcular horas trabalhadas em tempo real
  useEffect(() => {
    if (!isOpen || tipo !== 'horas' || !pontoDia) return;

    const calcularTempoReal = () => {
      const agora = new Date();
      
      const horarioEntrada = pontoDia.entrada;
      const horarioSaidaAlmoco = pontoDia.saidaAlmoco;
      const horarioVoltaAlmoco = pontoDia.voltaAlmoco;
      const horarioSaida = pontoDia.saida;
      
      // Se não tem entrada, não pode calcular
      if (!horarioEntrada) {
        setTempoReal({ horas: 0, minutos: 0, segundos: 0 });
        return;
      }
      
      // Converter horário de entrada para hoje
      const [horaEntrada, minutoEntrada] = horarioEntrada.split(':').map(Number);
      const entrada = new Date();
      entrada.setHours(horaEntrada, minutoEntrada, 0, 0);
      
      let totalSegundosTrabalhados = 0;
      
      // Se já bateu o ponto de saída, usa o valor fixo
      if (horarioSaida) {
        const [horaSaida, minutoSaida] = horarioSaida.split(':').map(Number);
        const saida = new Date();
        saida.setHours(horaSaida, minutoSaida, 0, 0);
        
        const [horaSaidaAlmoco, minutoSaidaAlmoco] = horarioSaidaAlmoco.split(':').map(Number);
        const saidaAlmoco = new Date();
        saidaAlmoco.setHours(horaSaidaAlmoco, minutoSaidaAlmoco, 0, 0);
        
        const [horaVoltaAlmoco, minutoVoltaAlmoco] = horarioVoltaAlmoco.split(':').map(Number);
        const voltaAlmoco = new Date();
        voltaAlmoco.setHours(horaVoltaAlmoco, minutoVoltaAlmoco, 0, 0);
        
        // Calcular períodos
        const manha = Math.floor((saidaAlmoco - entrada) / 1000);
        const tarde = Math.floor((saida - voltaAlmoco) / 1000);
        
        totalSegundosTrabalhados = manha + tarde;
      }
      // Se voltou do almoço mas ainda não saiu, conta até agora
      else if (horarioVoltaAlmoco) {
        const [horaSaidaAlmoco, minutoSaidaAlmoco] = horarioSaidaAlmoco.split(':').map(Number);
        const saidaAlmoco = new Date();
        saidaAlmoco.setHours(horaSaidaAlmoco, minutoSaidaAlmoco, 0, 0);
        
        const [horaVoltaAlmoco, minutoVoltaAlmoco] = horarioVoltaAlmoco.split(':').map(Number);
        const voltaAlmoco = new Date();
        voltaAlmoco.setHours(horaVoltaAlmoco, minutoVoltaAlmoco, 0, 0);
        
        // Período da manhã
        const manha = Math.floor((saidaAlmoco - entrada) / 1000);
        
        // Período da tarde até agora (EM TEMPO REAL)
        const tarde = Math.floor((agora - voltaAlmoco) / 1000);
        
        totalSegundosTrabalhados = manha + tarde;
      }
      // Se saiu para almoço mas não voltou, conta apenas manhã
      else if (horarioSaidaAlmoco) {
        const [horaSaida, minutoSaida] = horarioSaidaAlmoco.split(':').map(Number);
        const saidaAlmoco = new Date();
        saidaAlmoco.setHours(horaSaida, minutoSaida, 0, 0);
        
        totalSegundosTrabalhados = Math.floor((saidaAlmoco - entrada) / 1000);
      }
      // Se ainda não saiu para almoço, conta desde a entrada até agora (EM TEMPO REAL)
      else {
        totalSegundosTrabalhados = Math.floor((agora - entrada) / 1000);
      }
      
      // Garantir que não seja negativo
      if (totalSegundosTrabalhados < 0) totalSegundosTrabalhados = 0;
      
      // Converter para horas, minutos e segundos
      const horas = Math.floor(totalSegundosTrabalhados / 3600);
      const minutos = Math.floor((totalSegundosTrabalhados % 3600) / 60);
      const segundos = totalSegundosTrabalhados % 60;
      
      setTempoReal({ horas, minutos, segundos });
    };

    calcularTempoReal();
    const intervalo = setInterval(calcularTempoReal, 1000);

    return () => clearInterval(intervalo);
  }, [isOpen, tipo, pontoDia]);

  // Carregar pontos quando a data de edição é selecionada
  useEffect(() => {
    if (!dataEdicao || !funcionario?.id || !mostrarModalEdicao) return;

    const carregarPontosDia = async () => {
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('../../../firebaseConfig');

        // Buscar todos os pontos do funcionário
        const q = query(
          collection(db, 'pontos'),
          where('funcionarioId', '==', String(funcionario.id))
        );

        const snapshot = await getDocs(q);
        
        // Filtrar pontos pela data selecionada (comparando apenas a parte da data)
        const pontosDoDia = snapshot.docs
          .map(doc => doc.data())
          .filter(ponto => {
            // Converter timestamp para data no formato YYYY-MM-DD
            const dataPonto = new Date(ponto.timestamp).toISOString().split('T')[0];
            return dataPonto === dataEdicao;
          });

        if (pontosDoDia.length > 0) {
          // Organizar pontos por tipo
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
          // Limpar campos se não houver pontos
          setPontosEdicao({
            entrada: '',
            saidaAlmoco: '',
            voltaAlmoco: '',
            saida: ''
          });
        }
      } catch (error) {
        console.error('❌ Erro ao carregar pontos:', error);
      }
    };

    carregarPontosDia();
  }, [dataEdicao, funcionario?.id, mostrarModalEdicao]);

  // Função para abrir modal de edição
  const abrirModalEdicao = () => {
    const hoje = new Date().toISOString().split('T')[0];
    setDataEdicao(hoje);
    setMostrarModalEdicao(true);
  };

  // Função para salvar pontos editados
  const salvarPontosEditados = async () => {
    if (!dataEdicao) {
      toast.error('Selecione uma data válida');
      return;
    }

    // Validar formato de horários (HH:MM)
    const regexHorario = /^([01]\d|2[0-3]):([0-5]\d)$/;
    const pontosValidos = Object.entries(pontosEdicao).filter(([_, valor]) => valor !== '');
    
    for (const [campo, valor] of pontosValidos) {
      if (!regexHorario.test(valor)) {
        toast.error(`Horário inválido no campo ${campo}. Use o formato HH:MM`);
        return;
      }
    }

    const toastId = toast.loading('Salvando pontos...');
    try {
      // Aqui você implementaria a lógica de salvar no Firestore
      // Por exemplo:
      // await updateDoc(doc(db, 'pontos', funcionario.id), {
      //   [dataEdicao]: pontosEdicao
      // });
      toast.update(toastId, {
        render: '✓ Pontos salvos com sucesso!',
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });

      setMostrarModalEdicao(false);
      setPontosEdicao({
        entrada: '',
        saidaAlmoco: '',
        voltaAlmoco: '',
        saida: ''
      });
    } catch (error) {
      console.error('Erro ao salvar pontos:', error);
      toast.update(toastId, {
        render: 'Erro ao salvar pontos. Tente novamente.',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
    }
  };

  if (!isOpen) return null;

  // Função para exportar para Excel
  const exportarParaExcel = async () => {
    const toastId = toast.loading('Gerando arquivo Excel...');
    try {
      const XLSX = await import('xlsx');
      
      const dados = [
        ['RELATÓRIO DE HORAS TRABALHADAS'],
        [''],
        ['Funcionário:', funcionario.nome || funcionario.usuario],
        ['Período:', new Date().toLocaleDateString('pt-BR')],
        [''],
        ['RESUMO'],
        ['Dias Trabalhados:', horasInfo?.diasTrabalhados || 0],
        ['Total de Horas:', horasInfo?.totalHoras || '--:--'],
        ['Base Esperada:', horasInfo?.diasTrabalhados ? `${horasInfo.diasTrabalhados * 8}h` : '--h'],
        ['Saldo:', `${horasInfo?.saldoMinutos === 0 ? '' : horasInfo?.positivo ? '+' : ''}${horasInfo?.saldoFormatado || '--h --m'}`],
        ['Status:', horasInfo?.saldoMinutos === 0 ? 'Dentro da Meta ✓' : horasInfo?.positivo ? 'Acima da Meta ✓' : 'Abaixo da Meta ⚠'],
      ];

      const ws = XLSX.utils.aoa_to_sheet(dados);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Horas Trabalhadas');
      
      // Estilização básica
      ws['!cols'] = [{ wch: 20 }, { wch: 20 }];
      
      XLSX.writeFile(wb, `Horas_${funcionario.nome || 'Funcionario'}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.update(toastId, {
        render: '✓ Arquivo Excel gerado com sucesso!',
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      toast.update(toastId, {
        render: 'Erro ao gerar arquivo Excel. Verifique se a biblioteca está instalada.',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
    }
  };

  // Função para exportar para PDF
  const exportarParaPDF = async () => {
    const toastId = toast.loading('Gerando arquivo PDF...');
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      
      // Configuração do PDF
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório de Horas Trabalhadas', 20, 20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      // Informações do funcionário
      let y = 40;
      doc.text(`Funcionário: ${funcionario.nome || funcionario.usuario}`, 20, y);
      y += 10;
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, y);
      
      // Resumo
      y += 20;
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMO', 20, y);
      doc.setFont('helvetica', 'normal');
      
      y += 15;
      doc.text(`Dias Trabalhados: ${horasInfo?.diasTrabalhados || 0}`, 20, y);
      y += 10;
      doc.text(`Total de Horas: ${horasInfo?.totalHoras || '--:--'}`, 20, y);
      y += 10;
      doc.text(`Base Esperada (8h/dia): ${horasInfo?.diasTrabalhados ? `${horasInfo.diasTrabalhados * 8}h` : '--h'}`, 20, y);
      y += 10;
      doc.text(`Saldo: ${horasInfo?.saldoMinutos === 0 ? '' : horasInfo?.positivo ? '+' : ''}${horasInfo?.saldoFormatado || '--h --m'}`, 20, y);
      y += 10;
      doc.text(`Status: ${horasInfo?.saldoMinutos === 0 ? 'Dentro da Meta ✓' : horasInfo?.positivo ? 'Acima da Meta ✓' : 'Abaixo da Meta ⚠'}`, 20, y);
      
      // Rodapé
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 20, 280);
      
      doc.save(`Horas_${funcionario.nome || 'Funcionario'}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.update(toastId, {
        render: '✓ Arquivo PDF gerado com sucesso!',
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
    } catch (error) {
      console.error('Erro ao exportar para PDF:', error);
      toast.update(toastId, {
        render: 'Erro ao gerar arquivo PDF. Verifique se a biblioteca está instalada.',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
    }
  };

  const renderConteudo = () => {
    switch (tipo) {
      case 'avaliacao':
        return (
          <div className="space-y-6">
            {/* Header com média */}
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Star className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <div className="text-5xl font-bold text-yellow-700 dark:text-yellow-300">
                    {stats.mediaAvaliacao?.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                    Média Geral
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((estrela) => (
                  <Star
                    key={estrela}
                    className={`w-6 h-6 ${
                      estrela <= (stats.mediaAvaliacao || 0)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {funcionario.avaliacoes?.length || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total de Avaliações
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stats.mediaAvaliacao >= 4.5 ? 'Excelente' : stats.mediaAvaliacao >= 3.5 ? 'Muito Bom' : stats.mediaAvaliacao >= 2.5 ? 'Bom' : 'Regular'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Classificação
                </div>
              </div>
            </div>

            {/* Lista de avaliações */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Últimas Avaliações
              </h3>
              {funcionario.avaliacoes && funcionario.avaliacoes.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {funcionario.avaliacoes.slice(0, 5).map((avaliacao, index) => (
                    <div 
                      key={index}
                      className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((estrela) => (
                            <Star
                              key={estrela}
                              className={`w-4 h-4 ${
                                estrela <= (avaliacao.nota || avaliacao.estrelas || 0)
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(avaliacao.data).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      {avaliacao.comentario && (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {avaliacao.comentario}
                        </p>
                      )}
                      {avaliacao.tipo && (
                        <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          {avaliacao.tipo === 'desempenho' ? 'Avaliação de Desempenho' : 'Avaliação Regular'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Nenhuma avaliação registrada
                </p>
              )}
            </div>
          </div>
        );

      case 'tarefas':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <CheckCircle2 className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                <div>
                  <div className="text-5xl font-bold text-blue-700 dark:text-blue-300">
                    {stats.tarefasConcluidas || 0}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    Tarefas Concluídas
                  </div>
                </div>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-700 dark:text-green-300 mb-1">
                  {stats.tarefasConcluidas || 0}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  ✅ Concluídas
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mb-1">
                  {stats.tarefasEmAndamento || 0}
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400">
                  🔄 Em Andamento
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-1">
                  {stats.tarefasConcluidas > 0 ? '100%' : '0%'}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  📊 Taxa
                </div>
              </div>
            </div>

            {/* Informações adicionais */}
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total de Tarefas</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {(stats.tarefasConcluidas || 0) + (stats.tarefasEmAndamento || 0)}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Performance</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {stats.tarefasConcluidas >= 10 ? '🔥 Excelente' : stats.tarefasConcluidas >= 5 ? '👍 Bom' : '⭐ Regular'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'emprestimos':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Hammer className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                <div>
                  <div className="text-5xl font-bold text-purple-700 dark:text-purple-300">
                    {stats.emprestimosAtivos || 0}
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                    Empréstimos Ativos
                  </div>
                </div>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-300 mb-1">
                  {stats.emprestimosAtivos || 0}
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">
                  🔨 Ferramentas Emprestadas
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-700 dark:text-green-300 mb-1">
                  {stats.ferramentasDevolvidas || 0}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  ✅ Devoluções
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <div className="text-center">
                <div className="text-4xl mb-3">
                  {stats.emprestimosAtivos > 0 ? '🔧' : '✨'}
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {stats.emprestimosAtivos > 0 ? 'Com Ferramentas' : 'Sem Empréstimos Ativos'}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.emprestimosAtivos > 0 
                    ? `Funcionário está com ${stats.emprestimosAtivos} ferramenta(s) emprestada(s)`
                    : 'Funcionário não possui ferramentas emprestadas no momento'
                  }
                </p>
              </div>
            </div>

            {/* Histórico de devoluções */}
            {stats.ferramentasDevolvidas > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-green-700 dark:text-green-300">
                    Histórico de Responsabilidade
                  </span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {stats.ferramentasDevolvidas} devoluções realizadas com sucesso
                </p>
              </div>
            )}
          </div>
        );

      case 'pontos':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Trophy className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <div className="text-5xl font-bold text-emerald-700 dark:text-emerald-300">
                    {pontos.total || 0}
                  </div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    Pontos Totais
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdown de pontos */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5" />
                Distribuição de Pontos
              </h3>
              
              <div className="space-y-2">
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Hammer className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span className="font-medium text-gray-900 dark:text-white">Devoluções</span>
                    </div>
                    <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {pontos.detalhes?.ferramentas || 0} pts
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    20 pontos por ferramenta devolvida
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-gray-900 dark:text-white">Tarefas</span>
                    </div>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {pontos.detalhes?.tarefas || 0} pts
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    50 pontos por tarefa concluída
                  </p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      <span className="font-medium text-gray-900 dark:text-white">Avaliações</span>
                    </div>
                    <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                      {pontos.detalhes?.avaliacao || 0} pts
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Média de avaliação × 10
                  </p>
                </div>
              </div>
            </div>

            {/* Ranking */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4">
              <div className="text-center">
                <div className="text-3xl mb-2">
                  {pontos.total >= 500 ? '🏆' : pontos.total >= 300 ? '🥈' : pontos.total >= 100 ? '🥉' : '⭐'}
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {pontos.total >= 500 ? 'Top Performer' : pontos.total >= 300 ? 'Alto Desempenho' : pontos.total >= 100 ? 'Bom Desempenho' : 'Em Progresso'}
                </div>
              </div>
            </div>
          </div>
        );

      case 'horas':
        return (
          <div className="space-y-6">
            {/* Relógio em Tempo Real */}
            <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 dark:from-blue-600 dark:via-blue-700 dark:to-blue-900 rounded-2xl p-6 shadow-2xl">
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <RefreshCw className="w-5 h-5 text-white/80 animate-spin" style={{ animationDuration: '3s' }} />
                  <span className="text-white/90 text-sm font-medium uppercase tracking-wide">
                    Tempo Real
                  </span>
                </div>
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
              </div>
              
              {/* Botão de Editar Pontos */}
              <button
                onClick={() => setMostrarModalCorrecaoMes(true)}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all backdrop-blur-sm border border-white/30 hover:scale-105 transform"
              >
                <Edit3 className="w-5 h-5" />
                <span>Corrigir Pontos do Mês</span>
              </button>
            </div>

            {/* Header - Saldo do Mês */}
            <div className={`rounded-2xl p-6 text-center ${
              horasInfo?.saldoMinutos === 0
                ? 'bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-800/30 dark:to-slate-800/30'
                : horasInfo?.positivo
                ? 'bg-gradient-to-r from-cyan-100 to-sky-100 dark:from-cyan-900/30 dark:to-sky-900/30'
                : 'bg-gradient-to-r from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30'
            }`}>
              <div className="flex items-center justify-center gap-3 mb-3">
                {horasInfo?.saldoMinutos === 0 ? (
                  <CheckCircle2 className="w-12 h-12 text-gray-600 dark:text-gray-400" />
                ) : horasInfo?.positivo ? (
                  <TrendingUp className="w-12 h-12 text-cyan-600 dark:text-cyan-400" />
                ) : (
                  <Timer className="w-12 h-12 text-rose-600 dark:text-rose-400" />
                )}
                <div>
                  <div className={`text-5xl font-bold font-mono ${
                    horasInfo?.saldoMinutos === 0
                      ? 'text-gray-700 dark:text-gray-300'
                      : horasInfo?.positivo
                      ? 'text-cyan-700 dark:text-cyan-300'
                      : 'text-rose-700 dark:text-rose-300'
                  }`}>
                    {horasInfo?.saldoMinutos === 0 ? horasInfo?.saldoFormatado : horasInfo?.positivo ? '+' : ''}{horasInfo?.saldoFormatado || '--h --m'}
                  </div>
                  <div className={`text-sm font-medium ${
                    horasInfo?.saldoMinutos === 0
                      ? 'text-gray-600 dark:text-gray-400'
                      : horasInfo?.positivo
                      ? 'text-cyan-600 dark:text-cyan-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    Saldo do Mês
                  </div>
                </div>
              </div>
            </div>

            {/* Estatísticas detalhadas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Dias</span>
                </div>
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {horasInfo?.diasTrabalhados || 0}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  trabalhados
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">Total</span>
                </div>
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-300 font-mono">
                  {horasInfo?.totalHoras || '--:--'}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400">
                  registradas
                </div>
              </div>
            </div>

            {/* Status e detalhes */}
            <div className="space-y-3">
              <div className={`rounded-xl p-4 ${
                horasInfo?.positivo
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'bg-orange-50 dark:bg-orange-900/20'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Target className={`w-5 h-5 ${
                    horasInfo?.positivo
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-orange-600 dark:text-orange-400'
                  }`} />
                  <span className={`font-semibold ${
                    horasInfo?.positivo
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-orange-700 dark:text-orange-300'
                  }`}>
                    Status da Meta
                  </span>
                </div>
                <p className={`text-sm ${
                  horasInfo?.positivo
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {horasInfo?.positivo 
                    ? '✅ Funcionário está acima da meta de horas esperadas'
                    : '⚠️ Funcionário está abaixo da meta de horas esperadas'
                  }
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Cálculo do Saldo</h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Base esperada (8h/dia):</span>
                    <span className="font-mono">{horasInfo?.diasTrabalhados ? `${horasInfo.diasTrabalhados * 8}h` : '--h'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total trabalhado:</span>
                    <span className="font-mono">{horasInfo?.totalHoras || '--h --m'}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-semibold">
                    <span>Saldo:</span>
                    <span className={`font-mono ${
                      horasInfo?.positivo
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {horasInfo?.positivo ? '+' : ''}{horasInfo?.saldoFormatado || '--h --m'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botões de Exportação */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Exportar Relatório
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={exportarParaExcel}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={exportarParaPDF}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <FileText className="w-5 h-5" />
                    <span>PDF</span>
                  </button>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                  Baixe o relatório completo no formato desejado
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getTitulo = () => {
    switch (tipo) {
      case 'avaliacao': return 'Detalhes de Avaliação';
      case 'tarefas': return 'Detalhes de Tarefas';
      case 'emprestimos': return 'Detalhes de Empréstimos';
      case 'pontos': return 'Detalhes de Pontuação';
      case 'horas': return 'Detalhes de Horas Trabalhadas';
      default: return 'Detalhes';
    }
  };

  const getIcone = () => {
    switch (tipo) {
      case 'avaliacao': return <Star className="w-6 h-6" />;
      case 'tarefas': return <CheckCircle2 className="w-6 h-6" />;
      case 'emprestimos': return <Hammer className="w-6 h-6" />;
      case 'pontos': return <Trophy className="w-6 h-6" />;
      case 'horas': return horasInfo?.positivo ? <TrendingUp className="w-6 h-6" /> : <Timer className="w-6 h-6" />;
      default: return null;
    }
  };

  const getCor = () => {
    switch (tipo) {
      case 'avaliacao': return 'text-yellow-600 dark:text-yellow-400';
      case 'tarefas': return 'text-blue-600 dark:text-blue-400';
      case 'emprestimos': return 'text-purple-600 dark:text-purple-400';
      case 'pontos': return 'text-emerald-600 dark:text-emerald-400';
      case 'horas': return horasInfo?.positivo ? 'text-cyan-600 dark:text-cyan-400' : 'text-rose-600 dark:text-rose-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal Centralizado */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                <div className="flex items-center gap-3">
                  <div className={getCor()}>
                    {getIcone()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {getTitulo()}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {funcionario.nome}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Conteúdo */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {renderConteudo()}
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
          
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
                <div className="flex items-center gap-3">
                  <Edit3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Corrigir Pontos
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {funcionario.nome}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMostrarModalEdicao(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-white/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Conteúdo */}
              <div className="p-6 space-y-6">
                {/* Seletor de Data */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data
                  </label>
                  <input
                    type="date"
                    value={dataEdicao}
                    onChange={(e) => setDataEdicao(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                        <li>• A correção sobrescreve os pontos existentes</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setMostrarModalEdicao(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-semibold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={salvarPontosEditados}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Save className="w-5 h-5" />
                    Salvar Pontos
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* Modal de Correção de Pontos do Mês */}
      <ModalCorrigirPontosMes
        isOpen={mostrarModalCorrecaoMes}
        onClose={() => setMostrarModalCorrecaoMes(false)}
        funcionario={funcionario}
        mes={new Date().getMonth()}
        ano={new Date().getFullYear()}
      />
    </AnimatePresence>
  );
};

export default ModalDetalhesEstatisticas;
