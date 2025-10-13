import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

class BackgroundCorrectionService {
  constructor() {
    this.activeJobs = new Map();
    this.requestNotificationPermission();
  }

  async requestNotificationPermission() {
    if (Capacitor.isNativePlatform()) {
      try {
        const permission = await LocalNotifications.requestPermissions();
        return permission.display === 'granted';
      } catch (error) {
        return false;
      }
    }
    return true;
  }

  async showNotification(title, body, isComplete = false) {
    // Notificação do navegador
    if (!Capacitor.isNativePlatform() && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body: body,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: isComplete ? 'correction-complete' : 'correction-start'
        });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, {
            body: body,
            icon: '/logo.png',
            badge: '/logo.png'
          });
        }
      }
    }

    // Notificação nativa (Capacitor)
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: title,
              body: body,
              id: isComplete ? 2 : 1,
              schedule: { at: new Date(Date.now() + 1000) },
              sound: null,
              attachments: null,
              actionTypeId: '',
              extra: null
            }
          ]
        });
      } catch (error) {
        // Silently fail
      }
    }
  }

  async saveNotificationToFirestore(userId, title, body, type = 'correction') {
    try {
      await addDoc(collection(db, 'notificacoes'), {
        usuarioId: userId,
        titulo: title,
        mensagem: body,
        tipo: type,
        lida: false,
        data: Timestamp.now(),
        timestamp: Date.now()
      });
    } catch (error) {
      // Silently fail
    }
  }

  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async startCorrection(config, userId = 'admin') {
    const jobId = this.generateJobId();
    
    const job = {
      id: jobId,
      status: 'running',
      progress: { atual: 0, total: 0, porcentagem: 0 },
      config: config,
      startTime: Date.now(),
      userId: userId
    };

    this.activeJobs.set(jobId, job);

    // Notificação inicial
    const totalFuncionarios = config.funcionariosSelecionados.length;
    const totalDias = config.datasTrabalhadas.length;
    const totalRegistros = totalFuncionarios * totalDias * (config.tipoCorrecao === 'pontos' ? 4 : 1);

    const titleStart = '🔄 Correção de Pontos Iniciada';
    const bodyStart = `Processando ${totalRegistros} registros para ${totalFuncionarios} funcionário(s). Você será notificado quando concluir.`;

    await this.showNotification(titleStart, bodyStart, false);
    await this.saveNotificationToFirestore(userId, titleStart, bodyStart, 'correction_start');

    // Processar em background
    this.processCorrection(jobId, config, userId);

    return jobId;
  }

  async processCorrection(jobId, config, userId) {
    const job = this.activeJobs.get(jobId);
    if (!job) return;

    try {
      const { funcionariosSelecionados, datasTrabalhadas, tipoCorrecao, horariosPontos, horasParaAjustar, motivoAjuste, funcionarios } = config;

      const registrosPorData = tipoCorrecao === 'pontos' ? 4 : 1;
      const totalRegistrosEsperados = funcionariosSelecionados.length * datasTrabalhadas.length * registrosPorData;
      
      job.progress.total = totalRegistrosEsperados;
      let totalRegistros = 0;

      for (const funcionarioId of funcionariosSelecionados) {
        const funcionario = funcionarios.find(f => f.id === funcionarioId);
        if (!funcionario) continue;

        for (const dataStr of datasTrabalhadas) {
          const [ano, mes, dia] = dataStr.split('-').map(Number);
          const data = new Date(ano, mes - 1, dia);
          
          if (tipoCorrecao === 'pontos') {
            const tipos = ['entrada', 'saida_almoco', 'retorno_almoco', 'saida'];
            
            for (const tipo of tipos) {
              const [hora, minuto] = horariosPontos[
                tipo === 'saida_almoco' ? 'saidaAlmoco' : 
                tipo === 'retorno_almoco' ? 'voltaAlmoco' : tipo
              ].split(':');
              
              const dataPonto = new Date(ano, mes - 1, dia, parseInt(hora), parseInt(minuto), 0, 0);
              
              await addDoc(collection(db, 'pontos'), {
                funcionarioId: String(funcionarioId),
                funcionarioNome: funcionario.nome,
                tipo: tipo,
                data: Timestamp.fromDate(dataPonto),
                timestamp: dataPonto.getTime(),
                corrigido: true,
                dataCorrecao: Timestamp.now()
              });
              
              totalRegistros++;
              job.progress.atual = totalRegistros;
              job.progress.porcentagem = Math.round((totalRegistros / totalRegistrosEsperados) * 100);
            }
          } else if (tipoCorrecao === 'adicionar' || tipoCorrecao === 'descontar') {
            const totalMinutos = (horasParaAjustar.horas * 60) + horasParaAjustar.minutos;
            const minutosAjustados = tipoCorrecao === 'descontar' ? -totalMinutos : totalMinutos;
            
            await addDoc(collection(db, 'ajustes_manuais_horas'), {
              funcionarioId: String(funcionarioId),
              funcionarioNome: funcionario.nome,
              tipo: tipoCorrecao,
              minutos: minutosAjustados,
              horas: horasParaAjustar.horas,
              minutosRestantes: horasParaAjustar.minutos,
              motivo: motivoAjuste || 'Reajuste manual',
              data: Timestamp.fromDate(data),
              dataCriacao: Timestamp.now(),
              criadoPor: userId,
              mesReferencia: `${ano}-${String(mes).padStart(2, '0')}`,
              ativo: true
            });
            
            totalRegistros++;
            job.progress.atual = totalRegistros;
            job.progress.porcentagem = Math.round((totalRegistros / totalRegistrosEsperados) * 100);
          }

          // Pequeno delay para não sobrecarregar
          if (totalRegistros % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      }

      // Atualizar status
      job.status = 'completed';
      job.endTime = Date.now();
      job.duration = job.endTime - job.startTime;

      // Notificação de conclusão
      const titleComplete = '✅ Correção de Pontos Concluída';
      const bodyComplete = `${totalRegistros} registros foram criados com sucesso para ${funcionariosSelecionados.length} funcionário(s)!`;

      await this.showNotification(titleComplete, bodyComplete, true);
      await this.saveNotificationToFirestore(userId, titleComplete, bodyComplete, 'correction_complete');

      // Remover job após 5 minutos
      setTimeout(() => {
        this.activeJobs.delete(jobId);
      }, 5 * 60 * 1000);

    } catch (error) {
      job.status = 'error';
      job.error = error.message;
      job.endTime = Date.now();

      // Notificação de erro
      const titleError = '❌ Erro na Correção de Pontos';
      const bodyError = `Ocorreu um erro durante o processamento: ${error.message}`;

      await this.showNotification(titleError, bodyError, true);
      await this.saveNotificationToFirestore(userId, titleError, bodyError, 'correction_error');
    }
  }

  getJobStatus(jobId) {
    return this.activeJobs.get(jobId);
  }

  getAllActiveJobs() {
    return Array.from(this.activeJobs.values());
  }

  cancelJob(jobId) {
    const job = this.activeJobs.get(jobId);
    if (job && job.status === 'running') {
      job.status = 'cancelled';
      job.endTime = Date.now();
      return true;
    }
    return false;
  }
}

export const backgroundCorrectionService = new BackgroundCorrectionService();
