import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Clock, 
  Calendar,
  Users,
  UserCheck,
  CheckSquare,
  Plus,
  Minus,
  Save,
  AlertCircle,
  ChevronDown,
  Settings,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useToast } from '../../ToastProvider';
import { obterHorariosEsperados } from '../../../utils/escalaUtils';
import { backgroundCorrectionService } from '../../../services/backgroundCorrectionService';
import { useAuth } from '../../../hooks/useAuth';

const ModalCorrecaoPontos = ({ isOpen, onClose, funcionarios }) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [etapa, setEtapa] = useState(1); // 1: Seleção, 2: Configuração, 3: Confirmação
  const [modoSelecao, setModoSelecao] = useState('todos'); // todos, parcial, individual
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState([]);
  const [tipoCorrecao, setTipoCorrecao] = useState('pontos'); // pontos, adicionar, descontar
  
  // Configuração de pontos
  const [horariosPontos, setHorariosPontos] = useState({
    entrada: '07:00',
    saidaAlmoco: '12:00',
    voltaAlmoco: '13:00',
    saida: '17:00'
  });
  
  // Período de aplicação
  const [tipoPeriodo, setTipoPeriodo] = useState('dia'); // dia, periodo
  const [dataUnica, setDataUnica] = useState(new Date().toISOString().split('T')[0]);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  
  // Adição/Desconto de horas
  const [horasParaAjustar, setHorasParaAjustar] = useState({ horas: 0, minutos: 0 });
  const [motivoAjuste, setMotivoAjuste] = useState('');
  
  const [carregando, setCarregando] = useState(false);
  const [progresso, setProgresso] = useState({ atual: 0, total: 0, porcentagem: 0 });

  // Atualizar seleção quando mudar modo
  useEffect(() => {
    if (modoSelecao === 'todos') {
      setFuncionariosSelecionados(funcionarios.filter(f => !f.demitido).map(f => f.id));
    } else if (modoSelecao === 'individual' || modoSelecao === 'parcial') {
      setFuncionariosSelecionados([]);
    }
  }, [modoSelecao, funcionarios]);

  // Resetar estados quando fechar
  useEffect(() => {
    if (!isOpen) {
      setEtapa(1);
      setProgresso({ atual: 0, total: 0, porcentagem: 0 });
      setCarregando(false);
    }
  }, [isOpen]);

  const toggleFuncionario = (id) => {
    setFuncionariosSelecionados(prev => 
      prev.includes(id) 
        ? prev.filter(fid => fid !== id)
        : [...prev, id]
    );
  };

  const aplicarCorrecao = async () => {
    if (funcionariosSelecionados.length === 0) {
      showToast('Selecione ao menos um funcionário', 'error');
      return;
    }

    try {
      let datasTrabalhadas = [];
      
      // Definir datas a serem processadas
      if (tipoPeriodo === 'dia') {
        datasTrabalhadas = [dataUnica];
      } else {
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);
        
        if (inicio > fim) {
          showToast('Data inicial deve ser anterior à data final', 'error');
          return;
        }
        
        // Gerar array de datas
        let current = new Date(inicio);
        while (current <= fim) {
          datasTrabalhadas.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
        }
      }

      // Calcular total de registros
      const registrosPorData = tipoCorrecao === 'pontos' ? 4 : 1;
      const totalRegistrosEsperados = funcionariosSelecionados.length * datasTrabalhadas.length * registrosPorData;

      // Configuração para processamento em background
      const config = {
        funcionariosSelecionados,
        datasTrabalhadas,
        tipoCorrecao,
        horariosPontos,
        horasParaAjustar,
        motivoAjuste,
        funcionarios
      };

      // Iniciar processamento em background
      const jobId = await backgroundCorrectionService.startCorrection(
        config,
        user?.id || 'admin'
      );

      // Notificar usuário
      showToast(
        `🔄 Correção iniciada em segundo plano! ${totalRegistrosEsperados} registros serão processados. Você será notificado quando concluir.`,
        'info',
        5000
      );
      
      // Fechar modal imediatamente
      onClose();
      
    } catch (error) {
      showToast('Erro ao iniciar correção: ' + error.message, 'error');
    }
  };

  if (!isOpen) return null;

  const funcionariosAtivos = funcionarios.filter(f => !f.demitido);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Correção de Pontos</h2>
                <p className="text-blue-100 text-sm">
                  Etapa {etapa} de 3: {
                    etapa === 1 ? 'Seleção de Funcionários' :
                    etapa === 2 ? 'Configuração' :
                    'Confirmação'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* ETAPA 1: Seleção */}
            {etapa === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Modo de Seleção
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'todos', label: 'Todos', icon: Users, desc: 'Todos os funcionários' },
                      { value: 'parcial', label: 'Parcial', icon: CheckSquare, desc: 'Múltiplos funcionários' },
                      { value: 'individual', label: 'Individual', icon: UserCheck, desc: 'Um funcionário' }
                    ].map(modo => (
                      <button
                        key={modo.value}
                        onClick={() => setModoSelecao(modo.value)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          modoSelecao === modo.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                        }`}
                      >
                        <modo.icon className={`w-8 h-8 mx-auto mb-2 ${
                          modoSelecao === modo.value ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <div className="font-semibold text-gray-900 dark:text-white">{modo.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{modo.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {(modoSelecao === 'parcial' || modoSelecao === 'individual') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Selecionar Funcionários ({funcionariosSelecionados.length} selecionados)
                    </label>
                    <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl max-h-64 overflow-y-auto">
                      {funcionariosAtivos.map(func => (
                        <label
                          key={func.id}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-0"
                        >
                          <input
                            type={modoSelecao === 'individual' ? 'radio' : 'checkbox'}
                            checked={funcionariosSelecionados.includes(func.id)}
                            onChange={() => {
                              if (modoSelecao === 'individual') {
                                setFuncionariosSelecionados([func.id]);
                              } else {
                                toggleFuncionario(func.id);
                              }
                            }}
                            className="w-4 h-4 text-blue-600"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">{func.nome}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{func.cargo}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>Atenção:</strong> A correção será aplicada apenas aos funcionários selecionados.
                      {modoSelecao === 'todos' && ` Total: ${funcionariosAtivos.length} funcionário(s).`}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 2: Configuração */}
            {etapa === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Tipo de Correção
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setTipoCorrecao('pontos')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        tipoCorrecao === 'pontos'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                      }`}
                    >
                      <Clock className={`w-8 h-8 mx-auto mb-2 ${
                        tipoCorrecao === 'pontos' ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <div className="font-semibold text-gray-900 dark:text-white">Registrar Pontos</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">4 pontos diários</div>
                    </button>
                    <button
                      onClick={() => setTipoCorrecao('adicionar')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        tipoCorrecao === 'adicionar'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-green-300'
                      }`}
                    >
                      <Plus className={`w-8 h-8 mx-auto mb-2 ${
                        tipoCorrecao === 'adicionar' ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <div className="font-semibold text-gray-900 dark:text-white">Adicionar Horas</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Reajuste manual</div>
                    </button>
                    <button
                      onClick={() => setTipoCorrecao('descontar')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        tipoCorrecao === 'descontar'
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-red-300'
                      }`}
                    >
                      <Minus className={`w-8 h-8 mx-auto mb-2 ${
                        tipoCorrecao === 'descontar' ? 'text-red-600' : 'text-gray-400'
                      }`} />
                      <div className="font-semibold text-gray-900 dark:text-white">Descontar Horas</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Reajuste manual</div>
                    </button>
                  </div>
                </div>

                {tipoCorrecao === 'pontos' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Horários dos Pontos
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">1º Ponto - Entrada</label>
                        <input
                          type="time"
                          value={horariosPontos.entrada}
                          onChange={(e) => setHorariosPontos({...horariosPontos, entrada: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">2º Ponto - Saída Almoço</label>
                        <input
                          type="time"
                          value={horariosPontos.saidaAlmoco}
                          onChange={(e) => setHorariosPontos({...horariosPontos, saidaAlmoco: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">3º Ponto - Volta Almoço</label>
                        <input
                          type="time"
                          value={horariosPontos.voltaAlmoco}
                          onChange={(e) => setHorariosPontos({...horariosPontos, voltaAlmoco: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">4º Ponto - Saída</label>
                        <input
                          type="time"
                          value={horariosPontos.saida}
                          onChange={(e) => setHorariosPontos({...horariosPontos, saida: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(tipoCorrecao === 'adicionar' || tipoCorrecao === 'descontar') && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        {tipoCorrecao === 'adicionar' ? 'Quantidade de Horas para Adicionar' : 'Quantidade de Horas para Descontar'}
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Horas</label>
                          <input
                            type="number"
                            min="0"
                            max="999"
                            value={horasParaAjustar.horas}
                            onChange={(e) => setHorasParaAjustar({...horasParaAjustar, horas: parseInt(e.target.value) || 0})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Minutos</label>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={horasParaAjustar.minutos}
                            onChange={(e) => setHorasParaAjustar({...horasParaAjustar, minutos: parseInt(e.target.value) || 0})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Motivo do Ajuste <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={motivoAjuste}
                        onChange={(e) => setMotivoAjuste(e.target.value)}
                        placeholder="Ex: Banco de horas, Horas extras não registradas, Compensação de falta, etc."
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Período de Aplicação
                  </label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => setTipoPeriodo('dia')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        tipoPeriodo === 'dia'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">Dia Específico</div>
                    </button>
                    <button
                      onClick={() => setTipoPeriodo('periodo')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        tipoPeriodo === 'periodo'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">Período</div>
                    </button>
                  </div>

                  {tipoPeriodo === 'dia' ? (
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Data</label>
                      <input
                        type="date"
                        value={dataUnica}
                        onChange={(e) => setDataUnica(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Data Inicial</label>
                        <input
                          type="date"
                          value={dataInicio}
                          onChange={(e) => setDataInicio(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Data Final</label>
                        <input
                          type="date"
                          value={dataFim}
                          onChange={(e) => setDataFim(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ETAPA 3: Confirmação */}
            {etapa === 3 && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Resumo da Correção</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Funcionários:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {funcionariosSelecionados.length} selecionado(s)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {tipoCorrecao === 'pontos' ? 'Registrar Pontos' : 
                         tipoCorrecao === 'adicionar' ? 'Adicionar Horas' : 'Descontar Horas'}
                      </span>
                    </div>
                    {(tipoCorrecao === 'adicionar' || tipoCorrecao === 'descontar') && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Quantidade:</span>
                          <span className={`font-semibold ${tipoCorrecao === 'adicionar' ? 'text-green-600' : 'text-red-600'}`}>
                            {tipoCorrecao === 'descontar' && '-'}
                            {horasParaAjustar.horas}h {horasParaAjustar.minutos}m
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-gray-600 dark:text-gray-400">Motivo:</span>
                          <span className="font-semibold text-gray-900 dark:text-white text-right max-w-xs">
                            {motivoAjuste || 'Não informado'}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Período:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {tipoPeriodo === 'dia' 
                          ? new Date(dataUnica).toLocaleDateString('pt-BR')
                          : `${new Date(dataInicio).toLocaleDateString('pt-BR')} até ${new Date(dataFim).toLocaleDateString('pt-BR')}`
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800 dark:text-yellow-300">
                      <strong>Atenção:</strong> Esta ação não pode ser desfeita. Os registros serão marcados como "corrigidos" no sistema.
                    </div>
                  </div>
                </div>

                <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Funcionários Selecionados:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {funcionariosSelecionados.map(id => {
                      const func = funcionarios.find(f => f.id === id);
                      return func && (
                        <div key={id} className="flex items-center gap-2 text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <CheckSquare className="w-4 h-4 text-green-600" />
                          <span className="text-gray-900 dark:text-white">{func.nome}</span>
                          <span className="text-gray-500 dark:text-gray-400">({func.cargo})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
            {/* Barra de Progresso */}
            {carregando && progresso.total > 0 && (
              <div className="mb-4 space-y-2 relative">
                {/* Efeito de celebração ao completar */}
                {progresso.porcentagem === 100 && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ 
                          x: '50%', 
                          y: '50%', 
                          scale: 0,
                          opacity: 1
                        }}
                        animate={{ 
                          x: `${50 + (Math.cos((i / 12) * Math.PI * 2) * 100)}%`,
                          y: `${50 + (Math.sin((i / 12) * Math.PI * 2) * 100)}%`,
                          scale: [0, 1.5, 0],
                          opacity: [1, 1, 0]
                        }}
                        transition={{ 
                          duration: 1, 
                          ease: "easeOut",
                          delay: i * 0.05
                        }}
                        className="absolute w-2 h-2 bg-green-500 rounded-full"
                      />
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    {progresso.porcentagem === 100 ? (
                      <>
                        <motion.div
                          animate={{ rotate: [0, 15, -15, 0] }}
                          transition={{ duration: 0.5, repeat: 2 }}
                        >
                          <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </motion.div>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          Processo concluído!
                        </span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Processando registros...
                      </>
                    )}
                  </span>
                  <span className={`font-semibold ${
                    progresso.porcentagem === 100 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {progresso.atual} / {progresso.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${progresso.porcentagem}%`,
                      backgroundColor: progresso.porcentagem === 100 ? '#10b981' : undefined
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`h-full flex items-center justify-end pr-2 shadow-lg ${
                      progresso.porcentagem === 100
                        ? 'bg-gradient-to-r from-green-500 via-green-600 to-green-700'
                        : 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700'
                    }`}
                  >
                    {progresso.porcentagem > 15 && (
                      <motion.span 
                        initial={{ scale: 1 }}
                        animate={{ scale: progresso.porcentagem === 100 ? [1, 1.2, 1] : 1 }}
                        transition={{ duration: 0.3 }}
                        className="text-xs font-bold text-white drop-shadow-md"
                      >
                        {progresso.porcentagem}%
                      </motion.span>
                    )}
                  </motion.div>
                </div>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  {progresso.porcentagem === 100 
                    ? '✅ Todos os registros foram criados com sucesso!'
                    : 'Não feche esta janela até que o processo seja concluído'
                  }
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  if (etapa > 1) {
                    setEtapa(etapa - 1);
                  } else {
                    onClose();
                  }
                }}
                disabled={carregando}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {etapa === 1 ? 'Cancelar' : 'Voltar'}
              </button>

              <button
                onClick={() => {
                  if (etapa < 3) {
                    if (etapa === 1 && funcionariosSelecionados.length === 0) {
                      showToast('Selecione ao menos um funcionário', 'error');
                      return;
                    }
                    if (etapa === 2) {
                      // Validar campos da etapa 2
                      if ((tipoCorrecao === 'adicionar' || tipoCorrecao === 'descontar')) {
                        if (horasParaAjustar.horas === 0 && horasParaAjustar.minutos === 0) {
                          showToast('Informe a quantidade de horas para ajustar', 'error');
                          return;
                        }
                        if (!motivoAjuste.trim()) {
                          showToast('Informe o motivo do ajuste', 'error');
                          return;
                        }
                      }
                      if (tipoPeriodo === 'periodo' && (!dataInicio || !dataFim)) {
                        showToast('Informe as datas de início e fim', 'error');
                        return;
                      }
                    }
                    setEtapa(etapa + 1);
                  } else {
                    aplicarCorrecao();
                  }
                }}
                disabled={carregando}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {carregando ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : etapa === 3 ? (
                  <>
                    <Save className="w-4 h-4" />
                    Aplicar Correção
                  </>
                ) : (
                  'Próximo'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ModalCorrecaoPontos;
