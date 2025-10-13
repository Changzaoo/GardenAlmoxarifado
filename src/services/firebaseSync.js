import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  getDoc,
  Timestamp
} from 'firebase/firestore';

/**
 * 🔄 Serviço de Sincronização Firebase
 * 
 * Copia e sincroniza coleções entre dois projetos Firebase
 */
export class FirebaseSyncService {
  constructor(sourceDb, targetDb) {
    this.sourceDb = sourceDb;
    this.targetDb = targetDb;
    this.syncLog = [];
  }

  /**
   * 📊 Log de operação
   */
  log(message, type = 'info', data = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data
    };
    
    this.syncLog.push(logEntry);
    
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type] || 'ℹ️';

  }

  /**
   * 📦 Copiar uma coleção completa
   */
  async copyCollection(collectionName, options = {}) {
    try {
      this.log(`Iniciando cópia da coleção: ${collectionName}`);

      const {
        batchSize = 500,
        onProgress = null,
        filters = [],
        overwrite = false
      } = options;

      // 🛡️ Importar validação de usuários
      let validacaoUsuarios = null;
      if (collectionName === 'usuarios') {
        try {
          validacaoUsuarios = await import('../utils/validacaoUsuarios.js');
        } catch (error) {
          console.warn('⚠️ Não foi possível carregar validação de usuários:', error);
        }
      }

      // Buscar documentos da coleção de origem
      const sourceRef = collection(this.sourceDb, collectionName);
      let q = sourceRef;

      // Aplicar filtros se fornecidos
      filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });

      const snapshot = await getDocs(q);
      const totalDocs = snapshot.size;

      this.log(`${totalDocs} documentos encontrados em ${collectionName}`);

      if (totalDocs === 0) {
        this.log(`Coleção ${collectionName} está vazia`, 'warning');
        return { success: true, copied: 0, errors: 0, blocked: 0 };
      }

      let copied = 0;
      let errors = 0;
      let blocked = 0;
      let batch = writeBatch(this.targetDb);
      let batchCount = 0;

      // Copiar documentos em lotes
      for (const docSnapshot of snapshot.docs) {
        try {
          const docData = docSnapshot.data();
          
          // 🛡️ Bloquear usuários admin na cópia
          if (collectionName === 'usuarios' && validacaoUsuarios) {
            if (validacaoUsuarios.deveBloquearNaSincronizacao(docData)) {
              validacaoUsuarios.logBloqueio('cópia de coleção', docData);
              this.log(`🚫 Bloqueado usuário proibido: ${docData.usuario || docData.nome}`, 'warning');
              blocked++;
              continue; // Pular este documento
            }
          }
          
          const targetRef = doc(this.targetDb, collectionName, docSnapshot.id);

          // Verificar se documento já existe
          if (!overwrite) {
            const existingDoc = await getDoc(targetRef);
            if (existingDoc.exists()) {
              this.log(`Documento ${docSnapshot.id} já existe, pulando`, 'warning');
              continue;
            }
          }

          // Adicionar ao batch
          batch.set(targetRef, docData);
          batchCount++;

          // Executar batch quando atingir o limite
          if (batchCount >= batchSize) {
            await batch.commit();
            copied += batchCount;
            this.log(`${copied}/${totalDocs} documentos copiados`, 'success');

            if (onProgress) {
              onProgress(copied, totalDocs);
            }

            // Reiniciar batch
            batch = writeBatch(this.targetDb);
            batchCount = 0;
          }
        } catch (error) {
          errors++;
          this.log(`Erro ao copiar documento ${docSnapshot.id}`, 'error', error);
        }
      }

      // Executar batch restante
      if (batchCount > 0) {
        await batch.commit();
        copied += batchCount;
      }

      this.log(`✅ Coleção ${collectionName} copiada: ${copied} documentos`, 'success');

      if (blocked > 0) {
        this.log(`🚫 ${blocked} usuário(s) bloqueado(s) por segurança`, 'warning');
      }

      return {
        success: true,
        collection: collectionName,
        total: totalDocs,
        copied,
        errors,
        blocked: blocked || 0,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.log(`❌ Erro ao copiar coleção ${collectionName}`, 'error', error);
      return {
        success: false,
        collection: collectionName,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 🔄 Sincronizar coleção (bidirecional)
   * Compara timestamps e copia apenas documentos mais recentes
   */
  async syncCollection(collectionName, timestampField = 'dataCriacao') {
    try {
      this.log(`Iniciando sincronização bidirecional: ${collectionName}`);

      const sourceRef = collection(this.sourceDb, collectionName);
      const targetRef = collection(this.targetDb, collectionName);

      const [sourceSnapshot, targetSnapshot] = await Promise.all([
        getDocs(sourceRef),
        getDocs(targetRef)
      ]);

      const sourceMap = new Map();
      const targetMap = new Map();

      // 🛡️ Importar validação de usuários
      let validacaoUsuarios = null;
      if (collectionName === 'usuarios') {
        try {
          validacaoUsuarios = await import('../utils/validacaoUsuarios.js');
        } catch (error) {
          console.warn('⚠️ Não foi possível carregar validação de usuários:', error);
        }
      }

      // Mapear documentos de origem
      sourceSnapshot.forEach(docSnapshot => {
        const data = docSnapshot.data();
        
        // 🛡️ Bloquear usuários admin na sincronização
        if (collectionName === 'usuarios' && validacaoUsuarios) {
          if (validacaoUsuarios.deveBloquearNaSincronizacao(data)) {
            validacaoUsuarios.logBloqueio('sincronização (origem)', data);
            this.log(`🚫 Bloqueado usuário proibido: ${data.usuario || data.nome}`, 'warning');
            return; // Não adicionar ao mapa
          }
        }
        
        sourceMap.set(docSnapshot.id, { id: docSnapshot.id, data });
      });

      // Mapear documentos de destino
      targetSnapshot.forEach(docSnapshot => {
        const data = docSnapshot.data();
        
        // 🛡️ Bloquear usuários admin na sincronização
        if (collectionName === 'usuarios' && validacaoUsuarios) {
          if (validacaoUsuarios.deveBloquearNaSincronizacao(data)) {
            validacaoUsuarios.logBloqueio('sincronização (destino)', data);
            this.log(`🚫 Bloqueado usuário proibido: ${data.usuario || data.nome}`, 'warning');
            return; // Não adicionar ao mapa
          }
        }
        
        targetMap.set(docSnapshot.id, { id: docSnapshot.id, data });
      });

      let copiedToTarget = 0;
      let copiedToSource = 0;
      let updated = 0;
      let blocked = 0;

      // Sincronizar de origem para destino
      for (const [docId, sourceDoc] of sourceMap.entries()) {
        const targetDoc = targetMap.get(docId);

        // 🛡️ Validação adicional antes de copiar
        if (collectionName === 'usuarios' && validacaoUsuarios) {
          if (validacaoUsuarios.deveBloquearNaSincronizacao(sourceDoc.data)) {
            blocked++;
            continue;
          }
        }

        if (!targetDoc) {
          // Documento não existe no destino - copiar
          await setDoc(doc(this.targetDb, collectionName, docId), sourceDoc.data);
          copiedToTarget++;
        } else {
          // Comparar timestamps
          const sourceTime = sourceDoc.data[timestampField];
          const targetTime = targetDoc.data[timestampField];

          if (this.isNewer(sourceTime, targetTime)) {
            // Origem é mais recente - atualizar destino
            await setDoc(doc(this.targetDb, collectionName, docId), sourceDoc.data);
            updated++;
          } else if (this.isNewer(targetTime, sourceTime)) {
            // Destino é mais recente - atualizar origem
            await setDoc(doc(this.sourceDb, collectionName, docId), targetDoc.data);
            copiedToSource++;
          }
        }
      }

      // Copiar documentos que existem apenas no destino
      for (const [docId, targetDoc] of targetMap.entries()) {
        if (!sourceMap.has(docId)) {
          // 🛡️ Validação adicional antes de copiar
          if (collectionName === 'usuarios' && validacaoUsuarios) {
            if (validacaoUsuarios.deveBloquearNaSincronizacao(targetDoc.data)) {
              blocked++;
              continue;
            }
          }
          
          await setDoc(doc(this.sourceDb, collectionName, docId), targetDoc.data);
          copiedToSource++;
        }
      }

      this.log(
        `✅ Sincronização concluída: ${collectionName}`,
        'success',
        { copiedToTarget, copiedToSource, updated, blocked }
      );

      if (blocked > 0) {
        this.log(
          `🚫 ${blocked} usuário(s) bloqueado(s) por segurança`,
          'warning'
        );
      }

      return {
        success: true,
        collection: collectionName,
        copiedToTarget,
        copiedToSource,
        updated,
        blocked: blocked || 0,
        total: sourceMap.size + targetMap.size,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.log(`❌ Erro ao sincronizar ${collectionName}`, 'error', error);
      return {
        success: false,
        collection: collectionName,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 📦 Copiar todas as coleções
   */
  async copyAllCollections(collections, onProgress = null) {
    this.log(`Iniciando cópia de ${collections.length} coleções`);

    const results = [];
    let currentCollection = 0;

    for (const collectionName of collections) {
      currentCollection++;
      
      if (onProgress) {
        onProgress(currentCollection, collections.length, collectionName);
      }

      const result = await this.copyCollection(collectionName, {
        onProgress: (copied, total) => {
          if (onProgress) {
            onProgress(currentCollection, collections.length, collectionName, copied, total);
          }
        }
      });

      results.push(result);

      // Aguardar um pouco entre coleções para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalCopied: results.reduce((sum, r) => sum + (r.copied || 0), 0),
      totalErrors: results.reduce((sum, r) => sum + (r.errors || 0), 0),
      results,
      timestamp: new Date().toISOString()
    };

    this.log(
      `✅ Backup completo concluído`,
      'success',
      summary
    );

    return summary;
  }

  /**
   * 🔄 Sincronizar todas as coleções
   */
  async syncAllCollections(collections, onProgress = null) {
    this.log(`Iniciando sincronização de ${collections.length} coleções`);

    const results = [];
    let currentCollection = 0;

    for (const collectionName of collections) {
      currentCollection++;
      
      if (onProgress) {
        onProgress(currentCollection, collections.length, collectionName);
      }

      const result = await this.syncCollection(collectionName);
      results.push(result);

      // Aguardar um pouco entre coleções
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalSynced: results.reduce((sum, r) => sum + (r.copiedToTarget || 0) + (r.copiedToSource || 0), 0),
      results,
      timestamp: new Date().toISOString()
    };

    this.log(
      `✅ Sincronização completa concluída`,
      'success',
      summary
    );

    return summary;
  }

  /**
   * 🕐 Comparar timestamps
   */
  isNewer(timeA, timeB) {
    if (!timeA) return false;
    if (!timeB) return true;

    const dateA = timeA instanceof Timestamp ? timeA.toDate() : new Date(timeA);
    const dateB = timeB instanceof Timestamp ? timeB.toDate() : new Date(timeB);

    return dateA > dateB;
  }

  /**
   * 📊 Obter log de operações
   */
  getLog() {
    return this.syncLog;
  }

  /**
   * 🗑️ Limpar log
   */
  clearLog() {
    this.syncLog = [];
  }
}

/**
 * 🎯 Helper para criar instância do serviço
 */
export const createSyncService = (sourceDb, targetDb) => {
  return new FirebaseSyncService(sourceDb, targetDb);
};

export default FirebaseSyncService;
