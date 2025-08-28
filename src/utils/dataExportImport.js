import { collection, getDocs, addDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Função para exportar dados de uma coleção
export const exportarDados = async (colecao) => {
  try {
    const querySnapshot = await getDocs(collection(db, colecao));
    const dados = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Criar arquivo para download
    const dataStr = JSON.stringify(dados, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${colecao}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    link.remove();

    return { success: true, message: `Dados de ${colecao} exportados com sucesso!` };
  } catch (error) {
    console.error(`Erro ao exportar dados de ${colecao}:`, error);
    return { success: false, message: `Erro ao exportar dados: ${error.message}` };
  }
};

// Função para importar dados para uma coleção
export const importarDados = async (colecao, arquivo) => {
  try {
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          const dados = JSON.parse(e.target.result);
          const batch = writeBatch(db);
          const colecaoRef = collection(db, colecao);
          
          // Adiciona cada item em lote
          for (const item of dados) {
            const { id, ...dadosSemId } = item;
            const docRef = await addDoc(colecaoRef, dadosSemId);
          }
          
          await batch.commit();
          resolve({ success: true, message: `Dados importados com sucesso para ${colecao}!` });
        } catch (error) {
          reject({ success: false, message: `Erro ao importar dados: ${error.message}` });
        }
      };
      
      reader.onerror = () => {
        reject({ success: false, message: 'Erro ao ler o arquivo.' });
      };
      
      reader.readAsText(arquivo);
    });
  } catch (error) {
    console.error(`Erro ao importar dados para ${colecao}:`, error);
    return { success: false, message: `Erro ao importar dados: ${error.message}` };
  }
};

// Função para validar dados antes da importação
export const validarDados = (dados, colecao) => {
  const estruturas = {
    inventario: ['nome', 'quantidade', 'disponivel', 'categoria'],
    emprestimos: ['funcionarioId', 'ferramentas', 'dataRetirada', 'status'],
    tarefas: ['titulo', 'descricao', 'responsaveis', 'status', 'dataCriacao'],
    funcionarios: ['nome', 'nivel', 'setor'],
    ferramentas_danificadas: ['ferramentaId', 'descricao', 'dataRegistro'],
    ferramentas_perdidas: ['ferramentaId', 'descricao', 'dataRegistro'],
    compras: ['item', 'quantidade', 'status', 'dataSolicitacao']
  };

  const camposObrigatorios = estruturas[colecao];
  if (!camposObrigatorios) {
    return { valido: false, mensagem: 'Tipo de dados inválido' };
  }

  for (const item of dados) {
    for (const campo of camposObrigatorios) {
      if (!(campo in item)) {
        return {
          valido: false,
          mensagem: `Campo obrigatório '${campo}' ausente em um ou mais itens`
        };
      }
    }
  }

  return { valido: true };
};
