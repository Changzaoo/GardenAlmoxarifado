import React, { useState, useEffect } from 'react';
import { Calendar, LogIn, LogOut, Coffee, ArrowRightLeft, Clock, CheckCircle } from 'lucide-react';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './ToastProvider';

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

  // Relógio em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setHoraAtual(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
    });

    return () => unsubscribe();
  }, [usuario?.id, usuario?.uid]);

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
          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Histórico de Pontos
          </h3>
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
    </div>
  );
};

export default WorkPontoTab;
