import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

class NotificationService {
  // Criar uma notificação para uma mensagem
  static async createMessageNotification(to, from, content) {
    try {
      await addDoc(collection(db, 'messages'), {
        to,
        from,
        content,
        read: false,
        timestamp: serverTimestamp(),
        type: 'message'
      });
    } catch (error) {
      console.error('Erro ao criar notificação de mensagem:', error);
    }
  }

  // Criar uma notificação para uma tarefa
  static async createTaskNotification(assignedTo, title, description, priority) {
    try {
      await addDoc(collection(db, 'tasks'), {
        assignedTo,
        title,
        description,
        priority,
        read: false,
        createdAt: serverTimestamp(),
        type: 'task'
      });
    } catch (error) {
      console.error('Erro ao criar notificação de tarefa:', error);
    }
  }

  // Criar uma notificação de inventário
  static async createInventoryNotification(affectedUsers, message, itemId) {
    try {
      await addDoc(collection(db, 'inventory_notifications'), {
        affectedUsers,
        message,
        itemId,
        read: false,
        timestamp: serverTimestamp(),
        type: 'inventory'
      });
    } catch (error) {
      console.error('Erro ao criar notificação de inventário:', error);
    }
  }

  // Notificar sobre baixa quantidade no inventário
  static async notifyLowStock(item, currentQuantity, minQuantity) {
    const supervisores = await this.getSupervisores();
    const message = `Item "${item.nome}" está com quantidade baixa (${currentQuantity}/${minQuantity})`;
    
    await this.createInventoryNotification(
      supervisores,
      message,
      item.id
    );
  }

  // Notificar sobre uma nova atribuição de tarefa
  static async notifyTaskAssignment(assignedTo, taskTitle, assignedBy) {
    const message = `Nova tarefa "${taskTitle}" atribuída por ${assignedBy}`;
    
    await this.createTaskNotification(
      assignedTo,
      taskTitle,
      message,
      'normal'
    );
  }

  // Notificar sobre mudanças no status de uma ferramenta
  static async notifyToolStatusChange(tool, newStatus, affectedUsers) {
    const message = `Status da ferramenta "${tool.nome}" foi alterado para ${newStatus}`;
    
    await this.createInventoryNotification(
      affectedUsers,
      message,
      tool.id
    );
  }

  // Função auxiliar para obter emails dos supervisores
  static async getSupervisores() {
    // Implemente a lógica para buscar os emails dos supervisores
    return []; // Retorne um array com os emails dos supervisores
  }
}

export default NotificationService;
