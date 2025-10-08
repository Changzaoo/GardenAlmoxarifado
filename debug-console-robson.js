/**
 * ========================================
 * DEBUG: Análise de Horas Negativas
 * ========================================
 * 
 * Cole este código no Console do navegador
 * para analisar as horas do Robson
 */

(async function debugHorasRobson() {
  console.clear();
  console.log('%c🔍 DIAGNÓSTICO DE HORAS - ROBSON', 'background: #1e40af; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
  console.log('');

  try {
    // Importar Firebase do contexto global
    const { collection, query, where, getDocs } = window.firebase.firestore;
    const db = window.db; // Assumindo que db já está inicializado

    // 1. Buscar Robson
    console.log('📋 Buscando funcionário "Robson"...');
    const funcionariosRef = collection(db, 'funcionarios');
    const qFunc = query(funcionariosRef, where('nome', '==', 'Robson'));
    const funcSnapshot = await getDocs(qFunc);

    if (funcSnapshot.empty) {
      console.log('%c❌ Funcionário não encontrado!', 'color: red; font-weight: bold;');
      return;
    }

    const robsonData = funcSnapshot.docs[0].data();
    const robsonId = funcSnapshot.docs[0].id;
    const escala = robsonData.escala || robsonData.tipoEscala || 'M';

    console.log('%c✅ Funcionário encontrado:', 'color: green; font-weight: bold;');
    console.table({
      'ID': robsonId,
      'Nome': robsonData.nome,
      'Função': robsonData.funcao || 'N/A',
      'Escala': escala
    });

    // 2. Buscar pontos do mês
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

    console.log(`%c✅ ${pontosMes.length} registros encontrados`, 'color: green;');
    console.log('');

    // 3. Agrupar por dia
    const pontosPorDia = {};
    pontosMes.forEach(ponto => {
      const data = new Date(ponto.timestamp || ponto.data);
      const dataKey = data.toISOString().split('T')[0];

      if (!pontosPorDia[dataKey]) {
        pontosPorDia[dataKey] = { entrada: null, saida_almoco: null, retorno_almoco: null, saida: null };
      }

      pontosPorDia[dataKey][ponto.tipo] = data;
    });

    // 4. Calcular horas
    const ESCALAS = {
      M: { semana: { entrada: '07:20', saida: '16:20', almoco: 60 }, // 8h
            fimDeSemana: { entrada: '07:20', saida: '13:20', almoco: 60 } }, // 6h
      M1: { semana: { entrada: '07:00', saida: '15:20', almoco: 60 }, // 7h20
            fimDeSemana: { entrada: '07:00', saida: '13:00', almoco: 60 } }, // 6h
      M4: { semana: { entrada: '06:00', saida: '15:40', almoco: 60 }, // 8h40
            fimDeSemana: null }
    };

    const calcularMinutosEsperados = (escalaInfo, data) => {
      if (!escalaInfo) return 0;
      const diaSemana = data.getDay();
      const ehFimDeSemana = diaSemana === 0 || diaSemana === 6;
      const horarios = ehFimDeSemana ? escalaInfo.fimDeSemana : escalaInfo.semana;
      
      if (!horarios) return 0;

      const [hE, mE] = horarios.entrada.split(':').map(Number);
      const [hS, mS] = horarios.saida.split(':').map(Number);
      const totalMinutos = (hS * 60 + mS) - (hE * 60 + mE) - horarios.almoco;
      return totalMinutos;
    };

    let totalTrabalhado = 0;
    let totalEsperado = 0;
    let diasCompletos = 0;
    let diasIncompletos = 0;

    const analise = [];

    Object.entries(pontosPorDia).sort(([a], [b]) => a.localeCompare(b)).forEach(([dataKey, dia]) => {
      const dataPonto = new Date(dataKey);
      const diaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dataPonto.getDay()];

      if (!dia.entrada) {
        analise.push({ Data: dataKey, Dia: diaSemana, Status: '⚠️ Sem entrada', Trabalhado: '0h 00m', Esperado: '0h 00m', Saldo: '0h 00m' });
        return;
      }

      let minutosDia = 0;
      let completo = false;

      if (dia.saida && dia.saida_almoco && dia.retorno_almoco) {
        const manha = (dia.saida_almoco - dia.entrada) / (1000 * 60);
        const tarde = (dia.saida - dia.retorno_almoco) / (1000 * 60);
        minutosDia = manha + tarde;
        completo = true;
        diasCompletos++;
      } else if (dia.saida_almoco) {
        const manha = (dia.saida_almoco - dia.entrada) / (1000 * 60);
        minutosDia = manha;
        diasIncompletos++;
      }

      const minutosEsperadosDia = calcularMinutosEsperados(ESCALAS[escala], dataPonto);
      const saldoDia = minutosDia - minutosEsperadosDia;

      totalTrabalhado += minutosDia;
      totalEsperado += minutosEsperadosDia;

      const formatarMinutos = (min) => {
        const h = Math.floor(Math.abs(min) / 60);
        const m = Math.floor(Math.abs(min) % 60);
        return `${min < 0 ? '-' : ''}${h}h ${m.toString().padStart(2, '0')}m`;
      };

      analise.push({
        Data: dataKey,
        Dia: diaSemana,
        Status: completo ? '✅ Completo' : '⚠️ Incompleto',
        Entrada: dia.entrada?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || '---',
        Saída: dia.saida?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || '---',
        Trabalhado: formatarMinutos(minutosDia),
        Esperado: formatarMinutos(minutosEsperadosDia),
        Saldo: formatarMinutos(saldoDia)
      });
    });

    // 5. Exibir resultados
    console.log('%c📊 ANÁLISE DETALHADA POR DIA:', 'background: #059669; color: white; padding: 5px; font-weight: bold;');
    console.table(analise);

    const saldoTotal = totalTrabalhado - totalEsperado;
    const formatarMinutos = (min) => {
      const h = Math.floor(Math.abs(min) / 60);
      const m = Math.floor(Math.abs(min) % 60);
      return `${h}h ${m.toString().padStart(2, '0')}m`;
    };

    console.log('');
    console.log('%c═══════════════════════════════════════════════════════════', 'color: #666;');
    console.log('%c📊 RESUMO FINAL', 'background: #1e40af; color: white; padding: 8px; font-size: 14px; font-weight: bold;');
    console.log('%c═══════════════════════════════════════════════════════════', 'color: #666;');
    console.log('');

    console.log(`%c📅 Total de dias: ${Object.keys(pontosPorDia).length}`, 'font-weight: bold;');
    console.log(`%c✅ Dias completos: ${diasCompletos}`, 'color: green; font-weight: bold;');
    console.log(`%c⚠️  Dias incompletos: ${diasIncompletos}`, 'color: orange; font-weight: bold;');
    console.log(`%c⏱️  Total trabalhado: ${formatarMinutos(totalTrabalhado)}`, 'font-weight: bold;');
    console.log(`%c📊 Total esperado: ${formatarMinutos(totalEsperado)} (escala ${escala})`, 'font-weight: bold;');
    console.log('');

    if (saldoTotal >= 0) {
      console.log(`%c✅ SALDO: +${formatarMinutos(saldoTotal)}`, 'background: #059669; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
    } else {
      console.log(`%c❌ SALDO: -${formatarMinutos(saldoTotal)}`, 'background: #dc2626; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
      console.log('');
      console.log('%c🔍 POSSÍVEIS CAUSAS:', 'color: #dc2626; font-weight: bold; font-size: 14px;');
      if (diasIncompletos > 0) {
        console.log(`   • ${diasIncompletos} dia(s) com registro incompleto (sem saída final)`);
      }
      console.log(`   • Escala configurada: ${escala} (verificar se está correto)`);
      console.log(`   • Saídas antecipadas em alguns dias`);
      console.log(`   • Ausências não justificadas`);
    }

    console.log('');
    console.log('%c═══════════════════════════════════════════════════════════', 'color: #666;');

  } catch (error) {
    console.error('%c❌ ERRO:', 'color: red; font-weight: bold;', error);
  }
})();
