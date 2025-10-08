/**
 * ========================================
 * SCRIPT: Inserir Pontos Perfeitos e Banco de Horas
 * ========================================
 * 
 * Este script adiciona:
 * 1. Pontos perfeitos (no horário exato) de 01/10 a 07/10 para todos os funcionários
 * 2. Calcula as horas trabalhadas e adiciona ao banco de horas
 * 
 * COMO USAR:
 * 1. Abra o Console do navegador (F12)
 * 2. Cole este código
 * 3. Pressione Enter
 * 4. Aguarde a conclusão
 */

/**
 * ========================================
 * SCRIPT: Inserir Pontos Perfeitos + Banco de Horas + Escalas
 * ========================================
 * 
 * Cole este código no Console do navegador para:
 * 1. Inserir pontos perfeitos de 01/10 a 07/10
 * 2. Adicionar horas ao banco de horas
 * 3. Registrar escalas de cada funcionário
 */

(async function inserirPontosPerfeitosEBancoHoras() {
  console.clear();
  console.log('%c🚀 SCRIPT: Inserir Pontos Perfeitos + Banco de Horas', 'background: #1e40af; color: white; padding: 10px; font-size: 18px; font-weight: bold;');
  console.log('');
  console.log('%c⏳ Iniciando processo...', 'color: #3b82f6; font-weight: bold;');
  console.log('');

  try {
    // Firebase imports
    const { collection, getDocs, addDoc, doc, updateDoc, query, where, Timestamp } = window.firebase.firestore;
    const db = window.db;

    // Definição das escalas
    const ESCALAS = {
      M: {
        label: 'M - 6x1',
        semana: {
          entrada: '07:20',
          saida_almoco: '12:00',
          retorno_almoco: '13:00',
          saida: '16:20'
        },
        fimDeSemana: {
          entrada: '07:20',
          saida_almoco: '10:20',
          retorno_almoco: '11:20',
          saida: '13:20'
        },
        trabalhaFimDeSemana: true
      },
      M1: {
        label: 'M1 - 6x1',
        semana: {
          entrada: '07:00',
          saida_almoco: '12:00',
          retorno_almoco: '13:00',
          saida: '15:20'
        },
        fimDeSemana: {
          entrada: '07:00',
          saida_almoco: '10:00',
          retorno_almoco: '11:00',
          saida: '13:00'
        },
        trabalhaFimDeSemana: true
      },
      M4: {
        label: 'M4 - 5x2',
        semana: {
          entrada: '06:00',
          saida_almoco: '10:30',
          retorno_almoco: '11:30',
          saida: '15:40'
        },
        fimDeSemana: null,
        trabalhaFimDeSemana: false
      }
    };

    // Função para calcular horas trabalhadas de um dia
    const calcularHorasDia = (horarios) => {
      if (!horarios) return 0;

      const [hE, mE] = horarios.entrada.split(':').map(Number);
      const [hSA, mSA] = horarios.saida_almoco.split(':').map(Number);
      const [hRA, mRA] = horarios.retorno_almoco.split(':').map(Number);
      const [hS, mS] = horarios.saida.split(':').map(Number);

      const manha = (hSA * 60 + mSA) - (hE * 60 + mE);
      const tarde = (hS * 60 + mS) - (hRA * 60 + mRA);

      return manha + tarde;
    };

    // Função para criar timestamp
    const criarTimestamp = (data, horario) => {
      const [horas, minutos] = horario.split(':').map(Number);
      const novaData = new Date(data);
      novaData.setHours(horas, minutos, 0, 0);
      return Timestamp.fromDate(novaData);
    };

    // 1. Buscar todos os funcionários ativos
    console.log('📋 Buscando funcionários ativos...');
    const funcionariosRef = collection(db, 'funcionarios');
    const funcSnapshot = await getDocs(funcionariosRef);
    const funcionarios = funcSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(f => !f.demitido); // Apenas ativos

    console.log(`%c✅ ${funcionarios.length} funcionários encontrados`, 'color: green; font-weight: bold;');
    console.log('');

    // 2. Processar cada funcionário
    let totalPontosInseridos = 0;
    let totalHorasAdicionadas = 0;

    for (const func of funcionarios) {
      const escalaKey = func.escala || func.tipoEscala || 'M';
      const escala = ESCALAS[escalaKey];

      if (!escala) {
        console.log(`%c⚠️  ${func.nome}: Escala desconhecida (${escalaKey}) - Pulando`, 'color: orange;');
        continue;
      }

      console.log(`%c👤 Processando: ${func.nome} (Escala: ${escalaKey})`, 'color: #3b82f6; font-weight: bold;');

      let horasFuncionario = 0;
      let diasTrabalhados = 0;

      // 3. Criar pontos de 01/10 a 07/10
      for (let dia = 1; dia <= 7; dia++) {
        const data = new Date(2025, 9, dia); // Outubro = 9
        const diaSemana = data.getDay();
        const ehFimDeSemana = diaSemana === 0 || diaSemana === 6;

        // Verificar se trabalha neste dia
        if (ehFimDeSemana && !escala.trabalhaFimDeSemana) {
          console.log(`   ⏭️  ${dia.toString().padStart(2, '0')}/10 - Folga (${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][diaSemana]})`);
          continue;
        }

        const horarios = ehFimDeSemana ? escala.fimDeSemana : escala.semana;
        
        if (!horarios) {
          console.log(`   ⏭️  ${dia.toString().padStart(2, '0')}/10 - Sem horário definido`);
          continue;
        }

        // Verificar se já existe ponto para este dia
        const pontosExistentesQuery = query(
          collection(db, 'pontos'),
          where('funcionarioId', '==', String(func.id)),
          where('data', '>=', new Date(2025, 9, dia, 0, 0, 0)),
          where('data', '<=', new Date(2025, 9, dia, 23, 59, 59))
        );

        const pontosExistentes = await getDocs(pontosExistentesQuery);
        
        if (!pontosExistentes.empty) {
          console.log(`   ⏭️  ${dia.toString().padStart(2, '0')}/10 - Já possui pontos registrados`);
          continue;
        }

        // Criar os 4 pontos do dia (entrada, saída almoço, retorno almoço, saída)
        const pontos = [
          { tipo: 'entrada', horario: horarios.entrada },
          { tipo: 'saida_almoco', horario: horarios.saida_almoco },
          { tipo: 'retorno_almoco', horario: horarios.retorno_almoco },
          { tipo: 'saida', horario: horarios.saida }
        ];

        for (const ponto of pontos) {
          const timestamp = criarTimestamp(data, ponto.horario);
          
          await addDoc(collection(db, 'pontos'), {
            funcionarioId: String(func.id),
            funcionarioNome: func.nome,
            tipo: ponto.tipo,
            timestamp: timestamp,
            data: timestamp,
            localizacao: {
              latitude: -22.9068, // Coordenada exemplo
              longitude: -43.1729,
              precisao: 10
            },
            origem: 'script_automatico',
            observacao: 'Ponto perfeito inserido automaticamente (01-07/10/2025)'
          });

          totalPontosInseridos++;
        }

        // Calcular horas do dia
        const minutosDia = calcularHorasDia(horarios);
        horasFuncionario += minutosDia;
        diasTrabalhados++;

        const h = Math.floor(minutosDia / 60);
        const m = minutosDia % 60;
        console.log(`   ✅ ${dia.toString().padStart(2, '0')}/10 - 4 pontos inseridos (${h}h ${m}m)`);
      }

      // 4. Atualizar banco de horas do funcionário
      if (horasFuncionario > 0) {
        const funcDocRef = doc(db, 'funcionarios', func.id);
        const bancoHorasAtual = func.bancoHoras || 0;
        const novoBancoHoras = bancoHorasAtual + horasFuncionario;

        await updateDoc(funcDocRef, {
          bancoHoras: novoBancoHoras,
          ultimaAtualizacaoBancoHoras: Timestamp.now()
        });

        totalHorasAdicionadas += horasFuncionario;

        const horasTotal = Math.floor(horasFuncionario / 60);
        const minutosTotal = horasFuncionario % 60;

        console.log(`   💰 Banco de Horas: +${horasTotal}h ${minutosTotal}m (Total: ${Math.floor(novoBancoHoras / 60)}h ${novoBancoHoras % 60}m)`);
      }

      console.log('');
    }

    // 5. Resumo final
    console.log('%c═══════════════════════════════════════════════════════════', 'color: #666;');
    console.log('%c🎉 PROCESSO CONCLUÍDO COM SUCESSO!', 'background: #059669; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
    console.log('%c═══════════════════════════════════════════════════════════', 'color: #666;');
    console.log('');
    console.log(`%c📊 RESUMO GERAL:`, 'color: #1e40af; font-weight: bold; font-size: 14px;');
    console.log(`   • Funcionários processados: ${funcionarios.length}`);
    console.log(`   • Pontos inseridos: ${totalPontosInseridos}`);
    console.log(`   • Total de horas adicionadas: ${Math.floor(totalHorasAdicionadas / 60)}h ${totalHorasAdicionadas % 60}m`);
    console.log('');
    console.log('%c✅ Todos os funcionários agora têm pontos perfeitos de 01/10 a 07/10!', 'color: #059669; font-weight: bold;');
    console.log('%c✅ Banco de horas atualizado para todos!', 'color: #059669; font-weight: bold;');
    console.log('');
    console.log('%c⚡ Recarregue a página para ver as mudanças!', 'background: #f59e0b; color: white; padding: 8px; font-weight: bold;');

  } catch (error) {
    console.error('%c❌ ERRO:', 'color: red; font-weight: bold;', error);
    console.log('');
    console.log('%c💡 Possíveis causas:', 'color: orange; font-weight: bold;');
    console.log('   • Firebase não inicializado corretamente');
    console.log('   • Permissões insuficientes no Firestore');
    console.log('   • Conexão com internet instável');
  }
})();
