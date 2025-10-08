import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, FileText, TrendingUp, Download, Printer } from 'lucide-react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { 
  ComprovanteDiario, 
  ComprovanteSemanal, 
  ComprovanteMensal, 
  ComprovanteAnual 
} from './ComprovantesPonto';

/**
 * Modal Gerenciador de Comprovantes
 * Permite escolher o tipo de comprovante e visualizá-lo
 */
const ModalComprovantes = ({ isOpen, onClose, funcionarioNome, funcionarioId }) => {
  const [tipoComprovante, setTipoComprovante] = useState(''); // 'diario', 'semanal', 'mensal', 'anual'
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
  const [mesAno, setMesAno] = useState({ 
    mes: new Date().getMonth(), 
    ano: new Date().getFullYear() 
  });
  const [ano, setAno] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [dadosComprovante, setDadosComprovante] = useState(null);

  // Resetar ao abrir
  useEffect(() => {
    if (isOpen) {
      console.log('🎯 Modal Comprovantes aberto!', { funcionarioNome, funcionarioId });
      setTipoComprovante('');
      setDadosComprovante(null);
    }
  }, [isOpen]);

  // Buscar dados para comprovante diário
  const buscarDadosDiario = async () => {
    console.log('🔄 Iniciando buscarDadosDiario...');
    setLoading(true);
    try {
      const data = new Date(dataSelecionada);
      const inicioDia = Timestamp.fromDate(new Date(data.setHours(0, 0, 0, 0)));
      const fimDia = Timestamp.fromDate(new Date(data.setHours(23, 59, 59, 999)));

      console.log('📅 Buscando pontos para:', {
        funcionarioNome,
        data: data.toLocaleDateString('pt-BR'),
        inicioDia: inicioDia.toDate(),
        fimDia: fimDia.toDate()
      });

      // Buscar por nome (mais confiável que ID)
      const q = query(
        collection(db, 'pontos'),
        where('funcionarioNome', '==', funcionarioNome),
        where('data', '>=', inicioDia),
        where('data', '<=', fimDia)
      );

      const snapshot = await getDocs(q);
      const pontos = { entrada: null, saidaAlmoco: null, voltaAlmoco: null, saida: null };

      console.log('📄 [Comprovante Diário] Pontos encontrados:', snapshot.size);
      
      snapshot.docs.forEach(doc => {
        const ponto = doc.data();
        const timestamp = ponto.data?.toDate ? ponto.data.toDate() : new Date(ponto.timestamp || ponto.data);
        
        console.log('⏰ Ponto:', ponto.tipo, timestamp);
        
        if (ponto.tipo === 'entrada') pontos.entrada = timestamp;
        else if (ponto.tipo === 'saida_almoco') pontos.saidaAlmoco = timestamp;
        else if (ponto.tipo === 'retorno_almoco') pontos.voltaAlmoco = timestamp;
        else if (ponto.tipo === 'saida') pontos.saida = timestamp;
      });

      console.log('✅ Dados processados:', { data, pontos });
      setDadosComprovante({ data, pontos });
    } catch (error) {
      console.error('❌ Erro ao buscar dados diários:', error);
      alert('Erro ao gerar comprovante: ' + error.message);
    } finally {
      setLoading(false);
      console.log('🏁 buscarDadosDiario finalizado');
    }
  };

  // Buscar dados para comprovante semanal
  const buscarDadosSemanal = async () => {
    console.log('🔄 Iniciando buscarDadosSemanal...');
    setLoading(true);
    try {
      const data = new Date(dataSelecionada);
      const diaSemana = data.getDay(); // 0 = domingo
      const inicioSemana = new Date(data);
      inicioSemana.setDate(data.getDate() - diaSemana);
      inicioSemana.setHours(0, 0, 0, 0);
      
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);
      fimSemana.setHours(23, 59, 59, 999);

      // Buscar por nome (mais confiável que ID)
      const q = query(
        collection(db, 'pontos'),
        where('funcionarioNome', '==', funcionarioNome),
        where('data', '>=', Timestamp.fromDate(inicioSemana)),
        where('data', '<=', Timestamp.fromDate(fimSemana))
      );

      const snapshot = await getDocs(q);
      
      console.log('📅 [Comprovante Semanal] Pontos encontrados:', snapshot.size);
      
      // Agrupar pontos por dia
      const pontosPorDia = {};
      snapshot.docs.forEach(doc => {
        const ponto = doc.data();
        const timestamp = ponto.data?.toDate ? ponto.data.toDate() : new Date(ponto.timestamp || ponto.data);
        const diaKey = timestamp.toISOString().split('T')[0];
        
        if (!pontosPorDia[diaKey]) {
          pontosPorDia[diaKey] = {
            data: new Date(diaKey),
            pontos: { entrada: null, saidaAlmoco: null, voltaAlmoco: null, saida: null }
          };
        }
        
        if (ponto.tipo === 'entrada') pontosPorDia[diaKey].pontos.entrada = timestamp;
        else if (ponto.tipo === 'saida_almoco') pontosPorDia[diaKey].pontos.saidaAlmoco = timestamp;
        else if (ponto.tipo === 'retorno_almoco') pontosPorDia[diaKey].pontos.voltaAlmoco = timestamp;
        else if (ponto.tipo === 'saida') pontosPorDia[diaKey].pontos.saida = timestamp;
      });

      // Garantir que temos todos os 7 dias
      const diasDaSemana = [];
      for (let i = 0; i < 7; i++) {
        const dia = new Date(inicioSemana);
        dia.setDate(inicioSemana.getDate() + i);
        const diaKey = dia.toISOString().split('T')[0];
        
        diasDaSemana.push(pontosPorDia[diaKey] || {
          data: dia,
          pontos: { entrada: null, saidaAlmoco: null, voltaAlmoco: null, saida: null }
        });
      }

      console.log('✅ Dados semanais processados:', diasDaSemana.length, 'dias');
      setDadosComprovante(diasDaSemana);
    } catch (error) {
      console.error('❌ Erro ao buscar dados semanais:', error);
      alert('Erro ao gerar comprovante semanal: ' + error.message);
    } finally {
      setLoading(false);
      console.log('🏁 buscarDadosSemanal finalizado');
    }
  };

  // Buscar dados para comprovante mensal
  const buscarDadosMensal = async () => {
    console.log('🔄 Iniciando buscarDadosMensal...');
    setLoading(true);
    try {
      const inicioMes = new Date(mesAno.ano, mesAno.mes, 1);
      const fimMes = new Date(mesAno.ano, mesAno.mes + 1, 0, 23, 59, 59, 999);

      // Buscar por nome (mais confiável que ID)
      const q = query(
        collection(db, 'pontos'),
        where('funcionarioNome', '==', funcionarioNome),
        where('data', '>=', Timestamp.fromDate(inicioMes)),
        where('data', '<=', Timestamp.fromDate(fimMes))
      );

      const snapshot = await getDocs(q);
      
      console.log('📆 [Comprovante Mensal] Pontos encontrados:', snapshot.size);
      
      // Agrupar pontos por dia
      const pontosPorDia = {};
      snapshot.docs.forEach(doc => {
        const ponto = doc.data();
        const timestamp = ponto.data?.toDate ? ponto.data.toDate() : new Date(ponto.timestamp || ponto.data);
        const diaKey = timestamp.toISOString().split('T')[0];
        
        if (!pontosPorDia[diaKey]) {
          pontosPorDia[diaKey] = {
            data: new Date(diaKey),
            pontos: { entrada: null, saidaAlmoco: null, voltaAlmoco: null, saida: null }
          };
        }
        
        if (ponto.tipo === 'entrada') pontosPorDia[diaKey].pontos.entrada = timestamp;
        else if (ponto.tipo === 'saida_almoco') pontosPorDia[diaKey].pontos.saidaAlmoco = timestamp;
        else if (ponto.tipo === 'retorno_almoco') pontosPorDia[diaKey].pontos.voltaAlmoco = timestamp;
        else if (ponto.tipo === 'saida') pontosPorDia[diaKey].pontos.saida = timestamp;
      });

      const diasDoMes = Object.values(pontosPorDia);
      console.log('✅ Dados mensais processados:', diasDoMes.length, 'dias');
      setDadosComprovante(diasDoMes);
    } catch (error) {
      console.error('❌ Erro ao buscar dados mensais:', error);
      alert('Erro ao gerar comprovante mensal: ' + error.message);
    } finally {
      setLoading(false);
      console.log('🏁 buscarDadosMensal finalizado');
    }
  };

  // Buscar dados para comprovante anual
  const buscarDadosAnual = async () => {
    console.log('🔄 Iniciando buscarDadosAnual...');
    setLoading(true);
    try {
      const inicioAno = new Date(ano, 0, 1);
      const fimAno = new Date(ano, 11, 31, 23, 59, 59, 999);

      // Buscar por nome (mais confiável que ID)
      const q = query(
        collection(db, 'pontos'),
        where('funcionarioNome', '==', funcionarioNome),
        where('data', '>=', Timestamp.fromDate(inicioAno)),
        where('data', '<=', Timestamp.fromDate(fimAno))
      );

      const snapshot = await getDocs(q);
      
      console.log('📊 [Comprovante Anual] Pontos encontrados:', snapshot.size);
      
      // Agrupar pontos por dia
      const pontosPorDia = {};
      snapshot.docs.forEach(doc => {
        const ponto = doc.data();
        const timestamp = ponto.data?.toDate ? ponto.data.toDate() : new Date(ponto.timestamp || ponto.data);
        const diaKey = timestamp.toISOString().split('T')[0];
        
        if (!pontosPorDia[diaKey]) {
          pontosPorDia[diaKey] = {
            data: new Date(diaKey),
            pontos: { entrada: null, saidaAlmoco: null, voltaAlmoco: null, saida: null }
          };
        }
        
        if (ponto.tipo === 'entrada') pontosPorDia[diaKey].pontos.entrada = timestamp;
        else if (ponto.tipo === 'saida_almoco') pontosPorDia[diaKey].pontos.saidaAlmoco = timestamp;
        else if (ponto.tipo === 'retorno_almoco') pontosPorDia[diaKey].pontos.voltaAlmoco = timestamp;
        else if (ponto.tipo === 'saida') pontosPorDia[diaKey].pontos.saida = timestamp;
      });

      // Calcular totais por mês
      const mesesDoAno = [];
      for (let mes = 0; mes < 12; mes++) {
        const diasDoMes = Object.values(pontosPorDia).filter(dia => {
          return dia.data.getMonth() === mes && dia.data.getFullYear() === ano;
        });

        let totalMinutos = 0;
        diasDoMes.forEach(dia => {
          if (dia.pontos.entrada && dia.pontos.saidaAlmoco) {
            totalMinutos += (dia.pontos.saidaAlmoco - dia.pontos.entrada) / (1000 * 60);
          }
          if (dia.pontos.voltaAlmoco && dia.pontos.saida) {
            totalMinutos += (dia.pontos.saida - dia.pontos.voltaAlmoco) / (1000 * 60);
          }
        });

        mesesDoAno.push({
          mes,
          diasTrabalhados: diasDoMes.length,
          totalMinutos: Math.round(totalMinutos)
        });
      }

      console.log('✅ Dados anuais processados:', mesesDoAno.length, 'meses');
      setDadosComprovante(mesesDoAno);
    } catch (error) {
      console.error('❌ Erro ao buscar dados anuais:', error);
      alert('Erro ao gerar comprovante anual: ' + error.message);
    } finally {
      setLoading(false);
      console.log('🏁 buscarDadosAnual finalizado');
    }
  };

  // Gerar comprovante
  const gerarComprovante = () => {
    if (!tipoComprovante) {
      console.error('❌ Tipo de comprovante não selecionado');
      return;
    }
    
    console.log('🔄 Gerando comprovante:', tipoComprovante);
    
    switch (tipoComprovante) {
      case 'diario':
        buscarDadosDiario();
        break;
      case 'semanal':
        buscarDadosSemanal();
        break;
      case 'mensal':
        buscarDadosMensal();
        break;
      case 'anual':
        buscarDadosAnual();
        break;
      default:
        console.error('❌ Tipo de comprovante inválido:', tipoComprovante);
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        {!dadosComprovante ? (
          // Tela de Seleção
          <motion.div
            key="selecao"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold text-white">Gerar Comprovante de Ponto</h2>
              <p className="text-blue-100 text-sm mt-1">{funcionarioNome}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Tipo de Comprovante */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Tipo de Comprovante
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { valor: 'diario', titulo: 'Diário', descricao: 'Pontos de um dia', icone: FileText, cor: 'blue' },
                    { valor: 'semanal', titulo: 'Semanal', descricao: '7 dias consecutivos', icone: Calendar, cor: 'purple' },
                    { valor: 'mensal', titulo: 'Mensal', descricao: 'Mês completo', icone: TrendingUp, cor: 'indigo' },
                    { valor: 'anual', titulo: 'Anual', descricao: 'Ano inteiro', icone: FileText, cor: 'amber' }
                  ].map((tipo) => {
                    const IconeComp = tipo.icone;
                    return (
                      <button
                        key={tipo.valor}
                        onClick={() => {
                          console.log('📝 Tipo selecionado:', tipo.valor);
                          setTipoComprovante(tipo.valor);
                        }}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          tipoComprovante === tipo.valor
                            ? `border-${tipo.cor}-500 bg-${tipo.cor}-50 dark:bg-${tipo.cor}-900/20`
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <IconeComp className={`w-6 h-6 mx-auto mb-2 ${
                          tipoComprovante === tipo.valor ? `text-${tipo.cor}-600` : 'text-gray-400'
                        }`} />
                        <div className="font-semibold text-gray-900 dark:text-white">{tipo.titulo}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{tipo.descricao}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seleção de Data/Período */}
              {tipoComprovante && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {(tipoComprovante === 'diario' || tipoComprovante === 'semanal') && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {tipoComprovante === 'diario' ? 'Data' : 'Semana contendo a data'}
                      </label>
                      <input
                        type="date"
                        value={dataSelecionada}
                        onChange={(e) => setDataSelecionada(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  {tipoComprovante === 'mensal' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Mês
                        </label>
                        <select
                          value={mesAno.mes}
                          onChange={(e) => setMesAno(prev => ({ ...prev, mes: parseInt(e.target.value) }))}
                          className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i}>
                              {new Date(2024, i).toLocaleDateString('pt-BR', { month: 'long' })}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Ano
                        </label>
                        <input
                          type="number"
                          value={mesAno.ano}
                          onChange={(e) => setMesAno(prev => ({ ...prev, ano: parseInt(e.target.value) }))}
                          min={2020}
                          max={2100}
                          className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}

                  {tipoComprovante === 'anual' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Ano
                      </label>
                      <input
                        type="number"
                        value={ano}
                        onChange={(e) => setAno(parseInt(e.target.value))}
                        min={2020}
                        max={2100}
                        className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🔘 Botão clicado! Tipo:', tipoComprovante, 'Loading:', loading);
                      if (!loading && tipoComprovante) {
                        gerarComprovante();
                      }
                    }}
                    disabled={loading || !tipoComprovante}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Gerar Comprovante
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          // Exibir Comprovante
          <div key="comprovante" className="max-w-full">
            {tipoComprovante === 'diario' && (
              <ComprovanteDiario
                funcionarioNome={funcionarioNome}
                data={dadosComprovante.data}
                pontos={dadosComprovante.pontos}
                onClose={() => setDadosComprovante(null)}
              />
            )}
            {tipoComprovante === 'semanal' && (
              <ComprovanteSemanal
                funcionarioNome={funcionarioNome}
                diasDaSemana={dadosComprovante}
                onClose={() => setDadosComprovante(null)}
              />
            )}
            {tipoComprovante === 'mensal' && (
              <ComprovanteMensal
                funcionarioNome={funcionarioNome}
                mes={mesAno.mes}
                ano={mesAno.ano}
                diasDoMes={dadosComprovante}
                onClose={() => setDadosComprovante(null)}
              />
            )}
            {tipoComprovante === 'anual' && (
              <ComprovanteAnual
                funcionarioNome={funcionarioNome}
                ano={ano}
                mesesDoAno={dadosComprovante}
                onClose={() => setDadosComprovante(null)}
              />
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModalComprovantes;
