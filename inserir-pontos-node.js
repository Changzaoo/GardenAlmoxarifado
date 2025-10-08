/**
 * ========================================
 * SCRIPT NODE.JS: Inserir Pontos Perfeitos + Banco de Horas
 * ========================================
 * 
 * COMO EXECUTAR:
 * 1. Instale as dependências: npm install firebase-admin
 * 2. Configure suas credenciais do Firebase abaixo
 * 3. Execute: node inserir-pontos-node.js
 */

const admin = require('firebase-admin');

// ⚠️ IMPORTANTE: Configure suas credenciais aqui
const serviceAccount = {
  projectId: "SEU_PROJECT_ID",
  clientEmail: "SEU_CLIENT_EMAIL",
  privateKey: "SUA_PRIVATE_KEY"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

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
  return admin.firestore.Timestamp.fromDate(novaData);
};

async function inserirPontosPerfeitosEBancoHoras() {
  console.log('\n🚀 SCRIPT: Inserir Pontos Perfeitos + Banco de Horas\n');
  console.log('⏳ Iniciando processo...\n');

  try {
    // 1. Buscar todos os funcionários ativos
    console.log('📋 Buscando funcionários ativos...');
    const funcionariosSnapshot = await db.collection('funcionarios').get();
    const funcionarios = funcionariosSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(f => !f.demitido);

    console.log(`✅ ${funcionarios.length} funcionários encontrados\n`);

    let totalPontosInseridos = 0;
    let totalHorasAdicionadas = 0;

    // 2. Processar cada funcionário
    for (const func of funcionarios) {
      const escalaKey = func.escala || func.tipoEscala || 'M';
      const escala = ESCALAS[escalaKey];

      if (!escala) {
        console.log(`⚠️  ${func.nome}: Escala desconhecida (${escalaKey}) - Pulando`);
        continue;
      }

      console.log(`👤 Processando: ${func.nome} (Escala: ${escalaKey})`);

      let horasFuncionario = 0;
      let diasTrabalhados = 0;

      // 3. Criar pontos de 01/10 a 07/10
      for (let dia = 1; dia <= 7; dia++) {
        const data = new Date(2025, 9, dia); // Outubro = 9
        const diaSemana = data.getDay();
        const ehFimDeSemana = diaSemana === 0 || diaSemana === 6;

        // Verificar se trabalha neste dia
        if (ehFimDeSemana && !escala.trabalhaFimDeSemana) {
          console.log(`   ⏭️  ${String(dia).padStart(2, '0')}/10 - Folga`);
          continue;
        }

        const horarios = ehFimDeSemana ? escala.fimDeSemana : escala.semana;
        
        if (!horarios) {
          console.log(`   ⏭️  ${String(dia).padStart(2, '0')}/10 - Sem horário definido`);
          continue;
        }

        // Verificar se já existe ponto para este dia
        const inicio = new Date(2025, 9, dia, 0, 0, 0);
        const fim = new Date(2025, 9, dia, 23, 59, 59);
        
        const pontosExistentes = await db.collection('pontos')
          .where('funcionarioId', '==', String(func.id))
          .where('data', '>=', inicio)
          .where('data', '<=', fim)
          .get();

        if (!pontosExistentes.empty) {
          console.log(`   ⏭️  ${String(dia).padStart(2, '0')}/10 - Já possui pontos`);
          continue;
        }

        // Criar os 4 pontos do dia
        const pontos = [
          { tipo: 'entrada', horario: horarios.entrada },
          { tipo: 'saida_almoco', horario: horarios.saida_almoco },
          { tipo: 'retorno_almoco', horario: horarios.retorno_almoco },
          { tipo: 'saida', horario: horarios.saida }
        ];

        const batch = db.batch();

        for (const ponto of pontos) {
          const timestamp = criarTimestamp(data, ponto.horario);
          const pontoRef = db.collection('pontos').doc();
          
          batch.set(pontoRef, {
            funcionarioId: String(func.id),
            funcionarioNome: func.nome,
            tipo: ponto.tipo,
            timestamp: timestamp,
            data: timestamp,
            localizacao: {
              latitude: -22.9068,
              longitude: -43.1729,
              precisao: 10
            },
            origem: 'script_automatico',
            observacao: 'Ponto perfeito inserido automaticamente (01-07/10/2025)'
          });

          totalPontosInseridos++;
        }

        await batch.commit();

        // Calcular horas do dia
        const minutosDia = calcularHorasDia(horarios);
        horasFuncionario += minutosDia;
        diasTrabalhados++;

        const h = Math.floor(minutosDia / 60);
        const m = minutosDia % 60;
        console.log(`   ✅ ${String(dia).padStart(2, '0')}/10 - 4 pontos inseridos (${h}h ${m}m)`);
      }

      // 4. Atualizar banco de horas
      if (horasFuncionario > 0) {
        const bancoHorasAtual = func.bancoHoras || 0;
        const novoBancoHoras = bancoHorasAtual + horasFuncionario;

        await db.collection('funcionarios').doc(func.id).update({
          bancoHoras: novoBancoHoras,
          ultimaAtualizacaoBancoHoras: admin.firestore.FieldValue.serverTimestamp()
        });

        totalHorasAdicionadas += horasFuncionario;

        const horasTotal = Math.floor(horasFuncionario / 60);
        const minutosTotal = horasFuncionario % 60;

        console.log(`   💰 Banco de Horas: +${horasTotal}h ${minutosTotal}m`);
      }

      console.log('');
    }

    // 5. Resumo final
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 PROCESSO CONCLUÍDO COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📊 RESUMO GERAL:');
    console.log(`   • Funcionários processados: ${funcionarios.length}`);
    console.log(`   • Pontos inseridos: ${totalPontosInseridos}`);
    console.log(`   • Total de horas adicionadas: ${Math.floor(totalHorasAdicionadas / 60)}h ${totalHorasAdicionadas % 60}m\n`);
    console.log('✅ Todos os funcionários agora têm pontos perfeitos de 01/10 a 07/10!');
    console.log('✅ Banco de horas atualizado para todos!\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ ERRO:', error);
    process.exit(1);
  }
}

// Executar
inserirPontosPerfeitosEBancoHoras();
