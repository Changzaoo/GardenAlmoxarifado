import React, { useState } from 'react';
import { Clock, Calendar, ChevronRight, ChevronLeft, X, User, Package, Trash2, AlertCircle } from 'lucide-react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

const diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const mesesDoAno = [
  { valor: 0, nome: 'Janeiro' },
  { valor: 1, nome: 'Fevereiro' },
  { valor: 2, nome: 'Março' },
  { valor: 3, nome: 'Abril' },
  { valor: 4, nome: 'Maio' },
  { valor: 5, nome: 'Junho' },
  { valor: 6, nome: 'Julho' },
  { valor: 7, nome: 'Agosto' },
  { valor: 8, nome: 'Setembro' },
  { valor: 9, nome: 'Outubro' },
  { valor: 10, nome: 'Novembro' },
  { valor: 11, nome: 'Dezembro' }
];

// Componente de confirmação
const ConfirmationDialog = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-xl shadow-lg w-full max-w-md mx-4 p-4">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-gray-900 dark:text-white font-medium mb-2">Confirmar Remoção</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded transition-colors"
          >
            Remover
          </button>
        </div>
      </div>
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-xl shadow-lg w-full max-w-2xl mx-4">
        <div className="p-4 border-b border-gray-200 dark:border-gray-600 dark:border-gray-600 flex items-center justify-between">
          <h3 className="text-gray-900 dark:text-white font-medium">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

const TimeAnalysisStats = ({ emprestimos, onEmprestimoRemovido }) => {
  const hoje = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(hoje.getMonth());
  const [selectedYear, setSelectedYear] = useState(hoje.getFullYear());
  const [confirmationDialog, setConfirmationDialog] = useState({ 
    isOpen: false, 
    emprestimoId: null,
    message: '' 
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Fecha o dropdown quando clicar fora dele
  React.useEffect(() => {
    if (!isDatePickerOpen) return;

    const handleClickOutside = (event) => {
      const picker = document.getElementById('date-picker-dropdown');
      if (picker && !picker.contains(event.target)) {
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDatePickerOpen]);

  // Função para obter o intervalo de datas da semana
  const getWeekRange = (date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay()); // Início da semana (Domingo)
    const end = new Date(start);
    end.setDate(end.getDate() + 6); // Fim da semana (Sábado)
    return { start, end };
  };

  // Função para formatar intervalo de datas
  const formatDateRange = (start, end) => {
    const formatOptions = { day: '2-digit', month: '2-digit' };
    return `${start.toLocaleDateString('pt-BR', formatOptions)} - ${end.toLocaleDateString('pt-BR', formatOptions)}`;
  };

  // Filtra empréstimos pelo mês e ano selecionados
  const emprestimosFiltrados = emprestimos.filter(emp => {
    if (!emp.dataEmprestimo) return false;
    const data = new Date(emp.dataEmprestimo);
    return data.getMonth() === selectedMonth && data.getFullYear() === selectedYear;
  });

  // Análise por dias da semana e armazena os empréstimos de cada dia
  const diasStats = emprestimosFiltrados.reduce((acc, emp) => {
    if (emp.dataEmprestimo) {
      const data = new Date(emp.dataEmprestimo);
      const dia = diasDaSemana[data.getDay()];
      
      // Encontra a data mais recente para este dia da semana
      const dataFormatada = new Date(data).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
      
      const timestamp = data.getTime();

      if (!acc[dia]) {
        acc[dia] = { 
          count: 0, 
          emprestimos: [],
          ultimaData: dataFormatada,
          timestamp: timestamp
        };
      }
      // Atualiza a última data se for mais recente
      if (timestamp > acc[dia].timestamp) {
        acc[dia].ultimaData = dataFormatada;
        acc[dia].timestamp = timestamp;
      }
      
      acc[dia].count += 1;
      acc[dia].emprestimos.push(emp);
    }
    return acc;
  }, {});

  // Obtém as semanas do mês selecionado (segunda a sábado)
  const getSemanasDoMes = () => {
    const semanas = {};
    const primeiroDiaDoMes = new Date(selectedYear, selectedMonth, 1);
    const ultimoDiaDoMes = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    
    // Encontra a primeira segunda-feira do período
    let dataAtual = new Date(primeiroDiaDoMes);
    // Se não for segunda (1), volta para a segunda anterior
    const diasParaSegunda = dataAtual.getDay() === 0 ? 1 : dataAtual.getDay() === 1 ? 0 : 8 - dataAtual.getDay();
    if (dataAtual.getDay() !== 1) {
      dataAtual.setDate(dataAtual.getDate() - dataAtual.getDay() + 1);
    }
    
    let numeroSemana = 1;
    
    while (dataAtual.getMonth() === selectedMonth || dataAtual.getDate() <= 7) {
      const inicioSemana = new Date(dataAtual);
      const fimSemana = new Date(dataAtual);
      fimSemana.setDate(fimSemana.getDate() + 5); // Segunda + 5 = Sábado
      
      const chaveSemanaSemana = `Semana ${numeroSemana}`;
      semanas[chaveSemanaSemana] = {
        count: 0,
        emprestimos: [],
        dateRange: formatDateRange(inicioSemana, fimSemana)
      };
      
      // Próxima segunda-feira
      dataAtual.setDate(dataAtual.getDate() + 7);
      numeroSemana++;
      
      // Para se passou muito do mês
      if (inicioSemana.getMonth() > selectedMonth) break;
    }
    
    return semanas;
  };

  // Função para determinar qual semana uma data pertence
  const getNumeroSemana = (data) => {
    const primeiroDiaDoMes = new Date(data.getFullYear(), data.getMonth(), 1);
    
    // Encontra a primeira segunda-feira do período
    let primeiraSegunda = new Date(primeiroDiaDoMes);
    if (primeiraSegunda.getDay() !== 1) {
      primeiraSegunda.setDate(primeiraSegunda.getDate() - primeiraSegunda.getDay() + 1);
    }
    
    // Calcula quantos dias se passaram desde a primeira segunda
    const diasDiferenca = Math.floor((data - primeiraSegunda) / (1000 * 60 * 60 * 24));
    
    // Determina o número da semana (1, 2, 3, etc.)
    return Math.floor(diasDiferenca / 7) + 1;
  };

  // Análise por semanas do mês selecionado
  const semanasIniciais = getSemanasDoMes();
  const semanaStats = emprestimosFiltrados.reduce((acc, emp) => {
    if (emp.dataEmprestimo) {
      const data = new Date(emp.dataEmprestimo);
      const numeroSemana = getNumeroSemana(data);
      const semanaKey = `Semana ${numeroSemana}`;
      
      if (!acc[semanaKey]) {
        // Se não existe, cria baseado na lógica das semanas
        const primeiroDiaDoMes = new Date(data.getFullYear(), data.getMonth(), 1);
        let primeiraSegunda = new Date(primeiroDiaDoMes);
        if (primeiraSegunda.getDay() !== 1) {
          primeiraSegunda.setDate(primeiraSegunda.getDate() - primeiraSegunda.getDay() + 1);
        }
        
        const inicioSemana = new Date(primeiraSegunda);
        inicioSemana.setDate(inicioSemana.getDate() + (numeroSemana - 1) * 7);
        
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(fimSemana.getDate() + 5); // Segunda + 5 = Sábado
        
        acc[semanaKey] = {
          count: 0,
          emprestimos: [],
          dateRange: formatDateRange(inicioSemana, fimSemana)
        };
      }
      
      acc[semanaKey].count += 1;
      acc[semanaKey].emprestimos.push(emp);
    }
    return acc;
  }, semanasIniciais);

  // Análise de horários e armazena os empréstimos de cada período
  const horarioStats = emprestimosFiltrados.reduce((acc, emp) => {
    if (emp.dataEmprestimo) {
      const hora = new Date(emp.dataEmprestimo).getHours();
      const periodo = hora < 12 ? 'Manhã' : hora < 18 ? 'Tarde' : 'Noite';
      if (!acc[periodo]) {
        acc[periodo] = { count: 0, emprestimos: [] };
      }
      acc[periodo].count += 1;
      acc[periodo].emprestimos.push(emp);
    }
    return acc;
  }, {});

  const maxEmprestimos = Math.max(
    ...Object.values(diasStats).map(stat => stat.count),
    ...Object.values(semanaStats).map(stat => stat.count),
    ...Object.values(horarioStats).map(stat => stat.count)
  );

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className="bg-gray-200 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600 dark:border-gray-600 hover:border-blue-500 dark:hover:border-[#1D9BF0] transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500 dark:text-[#1D9BF0]" />
            <h3 className="text-gray-900 dark:text-white font-medium">Análise de Tempo</h3>
            <div className="relative ml-2">
              <button
                onClick={() => setIsDatePickerOpen(prev => !prev)}
                className="p-1.5 hover:bg-[#38444D] rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] focus:ring-offset-1 focus:ring-offset-[#192734]"
                title="Selecionar período"
              >
                <Calendar className="w-5 h-5 text-blue-500 dark:text-[#1D9BF0]" />
              </button>
              
              {isDatePickerOpen && (
                <div id="date-picker-dropdown" className="absolute right-0 mt-2 w-[280px] bg-gray-200 dark:bg-gray-700 dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 dark:border-gray-600 z-50">
                  <div className="p-3">
                    {/* Header com ano e navegação */}
                    <div className="flex items-center justify-between mb-4">
                      <button 
                        onClick={() => setSelectedYear(selectedYear - 1)}
                        className="p-1.5 hover:bg-[#38444D] rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-white"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      <span className="text-gray-900 dark:text-white font-medium">{selectedYear}</span>
                      
                      <button 
                        onClick={() => setSelectedYear(selectedYear + 1)}
                        className="p-1.5 hover:bg-[#38444D] rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-white"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Grid de meses */}
                    <div className="grid grid-cols-3 gap-2">
                      {mesesDoAno.map((mes) => (
                        <button
                          key={mes.valor}
                          onClick={() => {
                            setSelectedMonth(mes.valor);
                            setIsDatePickerOpen(false);
                          }}
                          className={`
                            p-2 rounded text-sm font-medium transition-colors
                            ${selectedMonth === mes.valor 
                              ? 'bg-blue-500 dark:bg-[#1D9BF0] text-white' 
                              : 'text-gray-500 dark:text-gray-400 hover:bg-[#38444D] hover:text-white'}
                          `}
                        >
                          {mes.nome.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            {mesesDoAno[selectedMonth].nome} {selectedYear}
          </div>
        </div>

        <div className="space-y-6">
          {/* Dias da Semana */}
          <div>
            <h4 className="text-gray-500 dark:text-gray-400 text-sm mb-2">Dias da Semana</h4>
            <div className="space-y-1">
              {Object.entries(diasStats)
                .filter(([_, stats]) => stats.count > 0)
                .sort(([_, statsA], [__, statsB]) => statsB.timestamp - statsA.timestamp)
                .map(([dia, stats]) => {
                  const diaAtual = diasDaSemana[hoje.getDay()];
                  const isToday = dia === diaAtual &&
                                 selectedMonth === hoje.getMonth() &&
                                 selectedYear === hoje.getFullYear();
                  
                  return (
                    <div
                      key={dia}
                      className={`flex items-center gap-2 cursor-pointer p-1 rounded transition-colors ${
                        isToday 
                          ? 'bg-blue-500 dark:bg-[#1D9BF0]/10 hover:bg-blue-500 dark:bg-[#1D9BF0]/20' 
                          : 'hover:bg-[#38444D]/30'
                      }`}
                      onClick={() => {
                        setSelectedPeriod(dia);
                        setSelectedType('dia');
                      }}
                    >
                      <div className="w-48 text-sm flex items-center gap-2">
                        <span className="w-20 text-white">
                          {dia} {isToday && '(Hoje)'}
                        </span>
                        <span className="text-white">
                          ({stats.ultimaData})
                        </span>
                      </div>
                      <div className="flex-1 bg-[#38444D] rounded-full h-2">
                        <div
                          className="bg-blue-500 dark:bg-[#1D9BF0] h-2 rounded-full"
                          style={{ width: `${(stats.count || 0) / maxEmprestimos * 100}%` }}
                        />
                      </div>
                      <div className="w-8 text-right text-white text-sm">{stats.count}</div>
                      <ChevronRight className="w-4 h-4 text-white" />
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Semanas do Mês */}
          <div>
            <h4 className="text-gray-500 dark:text-gray-400 text-sm mb-2">Semanas do Mês</h4>
            <div className="space-y-1">
              {Object.entries(semanaStats)
                .filter(([_, stats]) => stats.count > 0)
                .map(([semana, stats]) => (
                <div
                  key={semana}
                  className="flex items-center gap-2 cursor-pointer hover:bg-[#38444D]/30 p-1 rounded transition-colors"
                  onClick={() => {
                    setSelectedPeriod(semana);
                    setSelectedType('semana');
                  }}
                >
                  <div className="w-48 text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2">
                    <span className="w-20">{semana}</span>
                    <span className="text-gray-500 dark:text-gray-400/70">
                      ({stats.dateRange})
                    </span>
                  </div>
                  <div className="flex-1 bg-[#38444D] rounded-full h-2">
                    <div
                      className="bg-blue-500 dark:bg-[#1D9BF0] h-2 rounded-full"
                      style={{ width: `${(stats.count || 0) / maxEmprestimos * 100}%` }}
                    />
                  </div>
                  <div className="w-8 text-right text-gray-500 dark:text-gray-400 text-sm">{stats.count}</div>
                  <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Períodos do Dia */}
          <div>
            <h4 className="text-gray-500 dark:text-gray-400 text-sm mb-2">Períodos do Dia</h4>
            <div className="space-y-1">
              {['Manhã', 'Tarde', 'Noite'].map((periodo) => (
                <div
                  key={periodo}
                  className="flex items-center gap-2 cursor-pointer hover:bg-[#38444D]/30 p-1 rounded transition-colors"
                  onClick={() => {
                    setSelectedPeriod(periodo);
                    setSelectedType('periodo');
                  }}
                >
                  <div className="w-20 text-gray-500 dark:text-gray-400 text-sm">{periodo}</div>
                  <div className="flex-1 bg-[#38444D] rounded-full h-2">
                    <div
                      className="bg-blue-500 dark:bg-[#1D9BF0] h-2 rounded-full"
                      style={{ width: `${(horarioStats[periodo]?.count || 0) / maxEmprestimos * 100}%` }}
                    />
                  </div>
                  <div className="w-8 text-right text-gray-500 dark:text-gray-400 text-sm">{horarioStats[periodo]?.count || 0}</div>
                  <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!selectedPeriod}
        onClose={() => {
          setSelectedPeriod(null);
          setSelectedType(null);
          setExpandedUser(null);
        }}
        title={`Empréstimos em ${selectedPeriod || ''}`}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {(() => {
            const emprestimos = selectedType === 'dia' ? diasStats[selectedPeriod]?.emprestimos :
              selectedType === 'semana' ? semanaStats[selectedPeriod]?.emprestimos :
              horarioStats[selectedPeriod]?.emprestimos || [];

            // Agrupando empréstimos por funcionário
            const emprestimosPorFuncionario = emprestimos.reduce((acc, emp) => {
              const nomeFuncionario = emp.nomeFuncionario || 
                                    emp.colaborador || 
                                    emp.funcionario?.nome || 
                                    emp.funcionario ||
                                    emp.nome_funcionario || 
                                    'Funcionário não especificado';
              if (!acc[nomeFuncionario]) {
                acc[nomeFuncionario] = [];
              }
              acc[nomeFuncionario].push(emp);
              return acc;
            }, {});

            // Calcula o total de ferramentas por funcionário
            const calcularStatusFerramentas = (emprestimos) => {
              return emprestimos.reduce((acc, emp) => {
                const totalFerramentas = emp.ferramentas?.length || 0;
                
                // Verifica se o empréstimo tem data de devolução
                if (emp.dataDevolucao) {
                  acc.devolvidas += totalFerramentas;
                } else {
                  acc.emprestadas += totalFerramentas;
                }
                acc.total += totalFerramentas;
                return acc;
              }, { total: 0, devolvidas: 0, emprestadas: 0 });
            };

            return Object.entries(emprestimosPorFuncionario)
              .sort(([nomeA], [nomeB]) => nomeA.localeCompare(nomeB))
              .map(([nomeFuncionario, emprestimos]) => (
                <div 
                  key={nomeFuncionario} 
                  className="bg-[#38444D] rounded-lg overflow-hidden transition-all duration-200 ease-in-out"
                >
                  <div 
                    className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-blue-500 dark:bg-[#1D9BF0]/10 transition-colors ${
                      expandedUser === nomeFuncionario ? 'bg-blue-500 dark:bg-[#1D9BF0]/10' : ''
                    }`}
                    onClick={() => setExpandedUser(
                      expandedUser === nomeFuncionario ? null : nomeFuncionario
                    )}
                  >
                    <User className="w-5 h-5 text-blue-500 dark:text-[#1D9BF0]" />
                    <div className="flex-1">
                      <h4 className="text-gray-900 dark:text-white font-medium">{nomeFuncionario}</h4>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>{emprestimos.length} empréstimo{emprestimos.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          {(() => {
                            const status = calcularStatusFerramentas(emprestimos);
                            return (
                              <>
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  <span className="text-green-500">{status.devolvidas} devolvida{status.devolvidas !== 1 ? 's' : ''}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                  <span className="text-yellow-500">{status.emprestadas} emprestada{status.emprestadas !== 1 ? 's' : ''}</span>
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    <ChevronRight 
                      className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                        expandedUser === nomeFuncionario ? 'rotate-90' : ''
                      }`}
                    />
                  </div>

                  {expandedUser === nomeFuncionario && (
                    <div className="p-4 border-t border-[#192734] space-y-3 bg-gray-200 dark:bg-gray-700 dark:bg-gray-800/50">
                      {emprestimos.map((emp, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-500 dark:text-[#1D9BF0]" />
                                <span className="text-gray-900 dark:text-white">{formatarData(emp.dataEmprestimo)}</span>
                              </div>
                              <div className="flex justify-end">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmationDialog({
                                      isOpen: true,
                                      emprestimoId: emp.id,
                                      message: `Tem certeza que deseja remover este empréstimo? Esta ação não pode ser desfeita.`
                                    });
                                  }}
                                  className="p-1.5 hover:bg-red-500/10 rounded transition-colors"
                                  title="Remover empréstimo"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <Package className="w-4 h-4 text-blue-500 dark:text-[#1D9BF0] mt-1" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                                  <span>Ferramentas:</span>
                                  <span className={`text-sm px-2 py-0.5 rounded ${
                                    emp.dataDevolucao ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                                  }`}>
                                    {emp.dataDevolucao ? 'Devolvido' : 'Em andamento'}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {emp.ferramentas?.map((ferramenta, idx) => (
                                    <span
                                      key={idx}
                                      className="bg-[#38444D] px-2 py-1 rounded text-sm text-white"
                                    >
                                      {typeof ferramenta === 'string' ? ferramenta : ferramenta.nome}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            {emp.dataDevolucao && (
                              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                <Calendar className="w-4 h-4 text-green-500" />
                                <span>Devolvido em: {formatarData(emp.dataDevolucao)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ));
          })()}
        </div>
      </Modal>

      {/* Diálogo de confirmação */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={() => setConfirmationDialog({ isOpen: false, emprestimoId: null, message: '' })}
        message={confirmationDialog.message}
        onConfirm={async () => {
          try {
            if (confirmationDialog.emprestimoId) {
              await deleteDoc(doc(db, 'emprestimos', confirmationDialog.emprestimoId));
              
              // Notifica o componente pai sobre a remoção
              if (onEmprestimoRemovido) {
                onEmprestimoRemovido(confirmationDialog.emprestimoId);
              }
              
              // Fecha o diálogo
              setConfirmationDialog({ isOpen: false, emprestimoId: null, message: '' });
            }
          } catch (error) {
            console.error('Erro ao remover empréstimo:', error);
            // Você pode adicionar uma notificação de erro aqui se desejar
          }
        }}
      />
    </>
  );
};

export default TimeAnalysisStats;



