import { collection, addDoc, deleteDoc, doc, query, orderBy, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Carregar templates personalizados do Firestore
export const carregarTemplatesPersonalizados = (callback) => {
  const q = query(collection(db, 'templates'), orderBy('dataCriacao', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const templates = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(templates);
  });
};

// Salvar novo template personalizado
export const salvarTemplatePersonalizado = async (template) => {
  try {
    await addDoc(collection(db, 'templates'), {
      ...template,
      dataCriacao: new Date().toISOString(),
      personalizado: true
    });
    return true;
  } catch (error) {
    console.error('Erro ao salvar template:', error);
    return false;
  }
};

// Excluir template personalizado
export const excluirTemplatePersonalizado = async (templateId) => {
  try {
    await deleteDoc(doc(db, 'templates', templateId));
    return true;
  } catch (error) {
    console.error('Erro ao excluir template:', error);
    return false;
  }
};

// Atualizar template personalizado
export const atualizarTemplatePersonalizado = async (templateId, novosDados) => {
  try {
    const templateRef = doc(db, 'templates', templateId);
    await updateDoc(templateRef, {
      ...novosDados,
      dataAtualizacao: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Erro ao atualizar template:', error);
    return false;
  }
};

// Templates padrão do sistema
export const TAREFAS_PREDEFINIDAS = [
  {
    id: 'limpeza-almoxarifado',
    titulo: 'Limpeza do Almoxarifado',
    descricao: 'Realizar limpeza geral do almoxarifado incluindo:\n- Varrer o chão\n- Limpar prateleiras\n- Organizar ferramentas\n- Verificar itens fora do lugar',
    prioridade: 'media',
    tipo: 'Manutenção',
    tempoEstimado: '2h'
  },
  {
    id: 'inventario-mensal',
    titulo: 'Inventário Mensal',
    descricao: 'Realizar contagem do inventário:\n- Conferir todas as ferramentas\n- Atualizar quantidades no sistema\n- Reportar discrepâncias\n- Identificar itens com baixo estoque',
    prioridade: 'alta',
    tipo: 'Inventário',
    tempoEstimado: '4h'
  },
  {
    id: 'manutencao-ferramentas',
    titulo: 'Manutenção de Ferramentas',
    descricao: 'Realizar manutenção preventiva nas ferramentas:\n- Limpar equipamentos\n- Lubrificar partes móveis\n- Verificar condições gerais\n- Separar itens que precisam de reparo',
    prioridade: 'media',
    tipo: 'Manutenção',
    tempoEstimado: '3h'
  },
  {
    id: 'organizacao-prateleiras',
    titulo: 'Organização das Prateleiras',
    descricao: 'Reorganizar prateleiras do almoxarifado:\n- Agrupar itens por categoria\n- Atualizar etiquetas\n- Verificar disposição das ferramentas\n- Otimizar espaço disponível',
    prioridade: 'baixa',
    tipo: 'Organização',
    tempoEstimado: '2h'
  },
  {
    id: 'recebimento-material',
    titulo: 'Recebimento de Material',
    descricao: 'Processo de recebimento de novos materiais:\n- Conferir nota fiscal\n- Verificar quantidade e qualidade\n- Registrar no sistema\n- Armazenar adequadamente',
    prioridade: 'alta',
    tipo: 'Logística',
    tempoEstimado: '1h'
  },
  {
    id: 'auditoria-seguranca',
    titulo: 'Auditoria de Segurança',
    descricao: 'Realizar auditoria de segurança:\n- Verificar EPIs\n- Conferir sinalizações\n- Checar extintores\n- Avaliar condições de risco',
    prioridade: 'alta',
    tipo: 'Segurança',
    tempoEstimado: '2h'
  }
];
