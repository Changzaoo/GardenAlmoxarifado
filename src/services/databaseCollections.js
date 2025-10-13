import { collection, getDocs } from 'firebase/firestore';
import { primaryDb, backupDb } from '../config/firebaseDual';

/**
 * 🗂️ Serviço para Gerenciar Coleções de Database
 * 
 * Lista e analisa coleções de todos os bancos conectados
 */

// Lista de coleções conhecidas do sistema
const KNOWN_COLLECTIONS = [
  'usuarios',
  'mensagens',
  'notificacoes',
  'tarefas',
  'emprestimos',
  'inventario',
  'empresas',
  'setores',
  'cargos',
  'presenca',
  'horarios',
  'folgas',
  'configuracoes',
  'escalas',
  'backups',
  'logs',
  'auditoria',
  'permissoes',
  'relatorios'
];

/**
 * 📊 Obter informações de uma coleção
 */
const getCollectionInfo = async (db, collectionName, dbName) => {
  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    const docs = snapshot.docs;
    const docCount = docs.length;
    
    // Analisar documentos para obter metadados
    let lastUpdated = null;
    let sampleFields = new Set();
    
    docs.slice(0, 10).forEach(doc => {
      const data = doc.data();
      
      // Verificar timestamps comuns
      const timestamps = ['createdAt', 'updatedAt', 'timestamp', 'dataCreated', 'dataModificacao'];
      timestamps.forEach(field => {
        if (data[field]) {
          const date = data[field]?.toDate ? data[field].toDate() : new Date(data[field]);
          if (!lastUpdated || date > lastUpdated) {
            lastUpdated = date;
          }
        }
      });
      
      // Coletar campos únicos
      Object.keys(data).forEach(field => sampleFields.add(field));
    });
    
    return {
      name: collectionName,
      database: dbName,
      documentCount: docCount,
      lastUpdated,
      sampleFields: Array.from(sampleFields).slice(0, 10), // Primeiros 10 campos
      isEmpty: docCount === 0,
      hasData: docCount > 0
    };
    
  } catch (error) {
    console.error(`❌ Erro ao acessar coleção ${collectionName} em ${dbName}:`, error);
    return {
      name: collectionName,
      database: dbName,
      documentCount: 0,
      error: error.message,
      isEmpty: true,
      hasData: false
    };
  }
};

/**
 * 🗂️ Listar todas as coleções de um banco de dados
 */
export const getCollectionsFromDatabase = async (db, dbName) => {
  const collections = [];
  
  // Verificar cada coleção conhecida
  for (const collectionName of KNOWN_COLLECTIONS) {
    const info = await getCollectionInfo(db, collectionName, dbName);
    collections.push(info);
  }
  
  // Ordenar por número de documentos (maior primeiro)
  collections.sort((a, b) => (b.documentCount || 0) - (a.documentCount || 0));
  
  return collections;
};

/**
 * 🌐 Listar todas as coleções de todos os bancos
 */
export const getAllCollections = async () => {
  try {
    const [primaryCollections, backupCollections] = await Promise.all([
      getCollectionsFromDatabase(primaryDb, 'Firebase Principal (garden-c0b50)'),
      getCollectionsFromDatabase(backupDb, 'Firebase Backup (garden-backup)')
    ]);
    
    const summary = {
      primary: {
        name: 'Firebase Principal',
        projectId: 'garden-c0b50',
        collections: primaryCollections,
        totalCollections: primaryCollections.filter(c => c.hasData).length,
        totalDocuments: primaryCollections.reduce((sum, c) => sum + (c.documentCount || 0), 0)
      },
      backup: {
        name: 'Firebase Backup',
        projectId: 'garden-backup',
        collections: backupCollections,
        totalCollections: backupCollections.filter(c => c.hasData).length,
        totalDocuments: backupCollections.reduce((sum, c) => sum + (c.documentCount || 0), 0)
      }
    };
    
    // Estatísticas gerais
    const totalDatabases = 2;
    const totalCollections = summary.primary.totalCollections + summary.backup.totalCollections;
    const totalDocuments = summary.primary.totalDocuments + summary.backup.totalDocuments;
    return {
      ...summary,
      totals: {
        databases: totalDatabases,
        collections: totalCollections,
        documents: totalDocuments
      },
      scanTime: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Erro ao listar coleções:', error);
    throw error;
  }
};

/**
 * 🔄 Comparar coleções entre bancos
 */
export const compareCollections = async () => {
  const allData = await getAllCollections();
  const { primary, backup } = allData;
  
  const comparison = KNOWN_COLLECTIONS.map(collectionName => {
    const primaryCollection = primary.collections.find(c => c.name === collectionName);
    const backupCollection = backup.collections.find(c => c.name === collectionName);
    
    const primaryCount = primaryCollection?.documentCount || 0;
    const backupCount = backupCollection?.documentCount || 0;
    const difference = Math.abs(primaryCount - backupCount);
    
    return {
      name: collectionName,
      primary: {
        count: primaryCount,
        hasData: primaryCount > 0,
        lastUpdated: primaryCollection?.lastUpdated
      },
      backup: {
        count: backupCount,
        hasData: backupCount > 0,
        lastUpdated: backupCollection?.lastUpdated
      },
      difference,
      inSync: difference === 0,
      needsSync: difference > 0,
      status: difference === 0 ? 'synced' : difference < 10 ? 'minor-diff' : 'major-diff'
    };
  });
  
  // Estatísticas da comparação
  const syncedCollections = comparison.filter(c => c.inSync).length;
  const outOfSyncCollections = comparison.filter(c => c.needsSync).length;
  return {
    collections: comparison,
    summary: {
      total: comparison.length,
      synced: syncedCollections,
      outOfSync: outOfSyncCollections,
      syncPercentage: ((syncedCollections / comparison.length) * 100).toFixed(1)
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * 🔍 Buscar coleção específica
 */
export const searchCollection = async (collectionName) => {
  const [primaryInfo, backupInfo] = await Promise.all([
    getCollectionInfo(primaryDb, collectionName, 'primary'),
    getCollectionInfo(backupDb, collectionName, 'backup')
  ]);
  
  return {
    collection: collectionName,
    primary: primaryInfo,
    backup: backupInfo,
    found: primaryInfo.hasData || backupInfo.hasData,
    timestamp: new Date().toISOString()
  };
};

export default {
  getAllCollections,
  getCollectionsFromDatabase,
  compareCollections,
  searchCollection
};