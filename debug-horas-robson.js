/**
 * Script de Diagnóstico - Horas Negativas do Robson
 * 
 * Este script analisa os pontos registrados do Robson para identificar
 * por que ele está com 11h 56m de horas negativas
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

// Configuração do Firebase (use as mesmas credenciais do seu projeto)
const firebaseConfig = {
  // Adicione suas credenciais aqui
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Função para obter horários esperados da escala
const obterHorariosEsperados = (tipoEscala, data) => {
  const HORARIOS_POR_ESCALA = {
    M: {
      semana: { entrada: '07:20', almoco: '12:00', retorno: '13:00', saida: '16:20' },
      fimDeSemana: { entrada: '07:20', almoco: '10:20', retorno: '11:20', saida: '13:20' }
    },
    M1: {
      semana: { entrada: '07:00', almoco: '12:00', retorno: '13:00', saida: '15:20' },
      fimDeSemana: { entrada: '07:00', almoco: '10:00', retorno: '11:00', saida: '13:00' }
    },
    M4: {
      semana: { entrada: '06:00', almoco: '10:30', retorno: '11:30', saida: '15:40' },
      fimDeSemana: null
    }
  };

  const escala = HORARIOS_POR_ESCALA[tipoEscala];
  if (!escala) return null;

  const diaSemana = data.getDay();
  const ehFimDeSemana = diaSemana === 0 || diaSemana === 6;

  return ehFimDeSemana ? escala.fimDeSemana : escala.semana;
};

// Função para calcular minutos esperados de um dia
const calcularMinutosEsperados = (horarios) => {
  if (!horarios) return 0;

  const [hEntrada, mEntrada] = horarios.entrada.split(':').map(Number);
  const [hAlmoco, mAlmoco] = horarios.almoco.split(':').map(Number);
  const [hRetorno, mRetorno] = horarios.retorno.split(':').map(Number);
  const [hSaida, mSaida] = horarios.saida.split(':').map(Number);

  const minutosEntradaAlmoco = (hAlmoco * 60 + mAlmoco) - (hEntrada * 60 + mEntrada);
  const minutosRetornoSaida = (hSaida * 60 + mSaida) - (hRetorno * 60 + mRetorno);
  
  return minutosEntradaAlmoco + minutosRetornoSaida;
};

async function analisarHorasRobson() {
  try {
    console.log('🔍 Iniciando análise das horas do Robson...\n');

    // 1. Buscar dados do funcionário Robson
    console.log('📋 Buscando dados do funcionário...');
    const funcionariosRef = collection(db, 'funcionarios');
    const qFunc = query(funcionariosRef, where('nome', '==', 'Robson'));
    const funcSnapshot = await getDocs(qFunc);

    if (funcSnapshot.empty) {
      console.log('❌ Funcionário "Robson" não encontrado no banco de dados!');
      return;
    }

    const robsonData = funcSnapshot.docs[0].data();
    const robsonId = funcSnapshot.docs[0].id;
    const escala = robsonData.escala || robsonData.tipoEscala || 'M';

    console.log(`✅ Funcionário encontrado:`);
    console.log(`   - ID: ${robsonId}`);
    console.log(`   - Nome: ${robsonData.nome}`);
    console.log(`   - Função: ${robsonData.funcao || 'N/A'}`);
    console.log(`   - Escala: ${escala}`);
    console.log('');

    // 2. Buscar pontos do mês atual
    console.log('📅 Buscando pontos do mês atual...');
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    const pontosRef = collection(db, 'pontos');
    const qPontos = query(pontosRef, where('funcionarioId', '==', String(robsonId)));
    const pontosSnapshot = await getDocs(qPontos);

    const pontosMes = pontosSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(ponto => {
        const dataPonto = new Date(ponto.timestamp || ponto.data);
        return dataPonto >= primeiroDiaMes;
      });

    console.log(`✅ ${pontosMes.length} registros de ponto encontrados no mês atual\n`);

    // 3. Agrupar pontos por dia
    console.log('📊 Agrupando pontos por dia...\n');
    const pontosPorDia = {};
    pontosMes.forEach(ponto => {
      const data = new Date(ponto.timestamp || ponto.data);
      const dataKey = data.toISOString().split('T')[0];

      if (!pontosPorDia[dataKey]) {
        pontosPorDia[dataKey] = {
          entrada: null,
          saida_almoco: null,
          retorno_almoco: null,
          saida: null
        };
      }

      pontosPorDia[dataKey][ponto.tipo] = data;
    });

    // 4. Analisar cada dia
    let totalMinutosTrabalhados = 0;
    let totalMinutosEsperados = 0;
    let diasCompletos = 0;
    let diasIncompletos = 0;

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📅 ANÁLISE DETALHADA POR DIA');
    console.log('═══════════════════════════════════════════════════════════════\n');

    Object.entries(pontosPorDia)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([dataKey, dia]) => {
        const dataPonto = new Date(dataKey);
        const diaSemanaNum = dataPonto.getDay();
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const diaSemanaTexto = diasSemana[diaSemanaNum];

        console.log(`📅 ${dataKey} (${diaSemanaTexto})`);

        if (!dia.entrada) {
          console.log('   ⚠️  Sem registro de entrada');
          console.log('');
          return;
        }

        // Calcular minutos trabalhados
        let minutosDia = 0;
        let completo = false;

        if (dia.saida && dia.saida_almoco && dia.retorno_almoco) {
          const manha = (dia.saida_almoco - dia.entrada) / (1000 * 60);
          const tarde = (dia.saida - dia.retorno_almoco) / (1000 * 60);
          minutosDia = manha + tarde;
          completo = true;
          diasCompletos++;
        } else if (dia.retorno_almoco && dia.saida_almoco) {
          const manha = (dia.saida_almoco - dia.entrada) / (1000 * 60);
          minutosDia = manha;
          diasIncompletos++;
        } else if (dia.saida_almoco) {
          const manha = (dia.saida_almoco - dia.entrada) / (1000 * 60);
          minutosDia = manha;
          diasIncompletos++;
        }

        const horasTrabalhadas = Math.floor(minutosDia / 60);
        const minutosTrabalhados = Math.floor(minutosDia % 60);

        // Calcular minutos esperados
        const horariosEsperados = obterHorariosEsperados(escala, dataPonto);
        const minutosEsperadosDia = horariosEsperados ? calcularMinutosEsperados(horariosEsperados) : 0;
        const horasEsperadas = Math.floor(minutosEsperadosDia / 60);
        const minutosEsperados = Math.floor(minutosEsperadosDia % 60);

        console.log(`   🕐 Entrada: ${dia.entrada ? dia.entrada.toLocaleTimeString('pt-BR') : '---'}`);
        console.log(`   🍽️  Almoço: ${dia.saida_almoco ? dia.saida_almoco.toLocaleTimeString('pt-BR') : '---'} → ${dia.retorno_almoco ? dia.retorno_almoco.toLocaleTimeString('pt-BR') : '---'}`);
        console.log(`   🏁 Saída: ${dia.saida ? dia.saida.toLocaleTimeString('pt-BR') : '---'}`);
        console.log(`   ⏱️  Trabalhado: ${horasTrabalhadas}h ${minutosTrabalhados}m`);
        console.log(`   📊 Esperado: ${horasEsperadas}h ${minutosEsperados}m (escala ${escala})`);
        console.log(`   ${completo ? '✅ Dia completo' : '⚠️  Dia incompleto'}`);
        
        const saldoDia = minutosDia - minutosEsperadosDia;
        const saldoHoras = Math.floor(Math.abs(saldoDia) / 60);
        const saldoMin = Math.floor(Math.abs(saldoDia) % 60);
        console.log(`   ${saldoDia >= 0 ? '✅' : '❌'} Saldo do dia: ${saldoDia >= 0 ? '+' : '-'}${saldoHoras}h ${saldoMin}m`);
        console.log('');

        totalMinutosTrabalhados += minutosDia;
        totalMinutosEsperados += minutosEsperadosDia;
      });

    // 5. Resumo final
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 RESUMO FINAL');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const horasTrabalhadasTotal = Math.floor(totalMinutosTrabalhados / 60);
    const minutosTrabalhadosTotal = Math.floor(totalMinutosTrabalhados % 60);

    const horasEsperadasTotal = Math.floor(totalMinutosEsperados / 60);
    const minutosEsperadosTotal = Math.floor(totalMinutosEsperados % 60);

    const saldoTotal = totalMinutosTrabalhados - totalMinutosEsperados;
    const saldoHorasTotal = Math.floor(Math.abs(saldoTotal) / 60);
    const saldoMinutosTotal = Math.floor(Math.abs(saldoTotal) % 60);

    console.log(`📅 Dias com registro: ${Object.keys(pontosPorDia).length}`);
    console.log(`✅ Dias completos: ${diasCompletos}`);
    console.log(`⚠️  Dias incompletos: ${diasIncompletos}`);
    console.log(`⏱️  Total trabalhado: ${horasTrabalhadasTotal}h ${minutosTrabalhadosTotal}m`);
    console.log(`📊 Total esperado: ${horasEsperadasTotal}h ${minutosEsperadosTotal}m (escala ${escala})`);
    console.log('');
    console.log(`${saldoTotal >= 0 ? '✅ SALDO POSITIVO' : '❌ SALDO NEGATIVO'}: ${saldoTotal >= 0 ? '+' : ''}${saldoHorasTotal}h ${saldoMinutosTotal}m`);
    console.log('');

    // 6. Diagnóstico
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 DIAGNÓSTICO');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (diasIncompletos > 0) {
      console.log(`⚠️  ATENÇÃO: ${diasIncompletos} dia(s) com registro incompleto (falta saída final)`);
      console.log('   Isso reduz as horas trabalhadas contabilizadas.\n');
    }

    if (saldoTotal < 0) {
      const diasFaltantes = Math.abs(Math.floor(saldoTotal / totalMinutosEsperados * Object.keys(pontosPorDia).length));
      console.log(`❌ Horas negativas detectadas: ${saldoHorasTotal}h ${saldoMinutosTotal}m`);
      console.log(`   Possíveis causas:`);
      console.log(`   1. Dias incompletos (${diasIncompletos} encontrados)`);
      console.log(`   2. Saídas antecipadas`);
      console.log(`   3. Ausências não registradas`);
      console.log(`   4. Escala incorreta no cadastro (atual: ${escala})`);
    } else {
      console.log(`✅ Funcionário está com ${saldoHorasTotal}h ${saldoMinutosTotal}m positivas!`);
    }

  } catch (error) {
    console.error('❌ Erro ao analisar horas:', error);
  }
}

// Executar análise
analisarHorasRobson();
