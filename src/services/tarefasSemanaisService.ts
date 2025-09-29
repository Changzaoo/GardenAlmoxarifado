import { db } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { 
  TarefaSemanal, 
  ExecucaoTarefa, 
  FuncionarioDisponibilidade 
} from '../types/tarefasSemanal';

const COLECAO_TAREFAS = 'tarefasSemanais';
const COLECAO_EXECUCOES = 'execucoesTarefas';
const COLECAO_DISPONIBILIDADES = 'disponibilidadesFuncionarios';

export const TarefasSemanaisService = {
  // Criar nova tarefa semanal
  async criarTarefa(tarefa: Omit<TarefaSemanal, 'id' | 'criadaEm' | 'ultimaAtualizacao'>) {
    try {
      const novaTarefa = {
        ...tarefa,
        criadaEm: Timestamp.now().toDate().toISOString(),
        ultimaAtualizacao: Timestamp.now().toDate().toISOString(),
      };
      
      const docRef = await addDoc(collection(db, COLECAO_TAREFAS), novaTarefa);
      return { id: docRef.id, ...novaTarefa };
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      throw error;
    }
  },

  // Atualizar tarefa existente
  async atualizarTarefa(id: string, dados: Partial<TarefaSemanal>) {
    try {
      const tarefaRef = doc(db, COLECAO_TAREFAS, id);
      await updateDoc(tarefaRef, {
        ...dados,
        ultimaAtualizacao: Timestamp.now().toDate().toISOString(),
      });
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      throw error;
    }
  },

  // Buscar tarefas por dia da semana
  async buscarTarefasPorDia(diaDaSemana: number) {
    try {
      const q = query(
        collection(db, COLECAO_TAREFAS),
        where('diasDaSemana', 'array-contains', diaDaSemana)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TarefaSemanal));
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
      throw error;
    }
  },

  // Registrar execução de tarefa
  async registrarExecucao(execucao: Omit<ExecucaoTarefa, 'id'>) {
    try {
      const novaExecucao = {
        ...execucao,
        dataExecucao: Timestamp.now().toDate().toISOString(),
      };
      
      const docRef = await addDoc(collection(db, COLECAO_EXECUCOES), novaExecucao);
      return { id: docRef.id, ...novaExecucao };
    } catch (error) {
      console.error('Erro ao registrar execução:', error);
      throw error;
    }
  },

  // Atualizar disponibilidade de funcionário
  async atualizarDisponibilidade(disponibilidade: FuncionarioDisponibilidade) {
    try {
      // Extrai apenas os campos definidos na interface
      const dadosDisponibilidade = {
        funcionarioId: disponibilidade.funcionarioId,
        diasDisponiveis: disponibilidade.diasDisponiveis,
        horarioInicio: disponibilidade.horarioInicio,
        horarioFim: disponibilidade.horarioFim
      };

      const q = query(
        collection(db, COLECAO_DISPONIBILIDADES),
        where('funcionarioId', '==', disponibilidade.funcionarioId)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        // Atualiza disponibilidade existente
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, dadosDisponibilidade);
      } else {
        // Cria nova disponibilidade
        await addDoc(collection(db, COLECAO_DISPONIBILIDADES), dadosDisponibilidade);
      }
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error);
      throw error;
    }
  },

  // Buscar histórico de execuções por tarefa
  async buscarHistoricoTarefa(tarefaId: string) {
    try {
      const q = query(
        collection(db, COLECAO_EXECUCOES),
        where('tarefaId', '==', tarefaId)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ExecucaoTarefa));
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      throw error;
    }
  },

  // Buscar disponibilidade dos funcionários
  async buscarDisponibilidades() {
    try {
      const snapshot = await getDocs(collection(db, COLECAO_DISPONIBILIDADES));
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          funcionarioId: data.funcionarioId,
          diasDisponiveis: data.diasDisponiveis,
          horarioInicio: data.horarioInicio,
          horarioFim: data.horarioFim
        } as FuncionarioDisponibilidade;
      });
    } catch (error) {
      console.error('Erro ao buscar disponibilidades:', error);
      throw error;
    }
  }
};