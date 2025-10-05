import { collection, getDocs, doc, getDoc, query, limit, orderBy, where, startAfter } from 'firebase/firestore';
import { primaryDb, backupDb } from '../config/firebaseDual';

/**
 * 🔍 Serviço de Análise Detalhada de Documentos
 * 
 * Permite explorar e analisar documentos individuais de cada coleção
 */

/**
 * 📋 Analisar estrutura de um documento
 */
const analyzeDocumentStructure = (data, docId) => {
  const analysis = {
    id: docId,
    totalFields: 0,
    fieldTypes: {},
    nestedObjects: 0,
    arrays: 0,
    timestamps: 0,
    references: 0,
    estimatedSize: JSON.stringify(data).length,
    structure: {}
  };

  const analyzeObject = (obj, path = '') => {
    Object.entries(obj).forEach(([key, value]) => {
      const fullPath = path ? `${path}.${key}` : key;
      analysis.totalFields++;

      let type = typeof value;
      let details = { type, path: fullPath };

      // Análise específica por tipo
      if (value === null) {
        type = 'null';
      } else if (Array.isArray(value)) {
        type = 'array';
        analysis.arrays++;
        details.length = value.length;
        details.itemTypes = [...new Set(value.map(item => typeof item))];
      } else if (value && typeof value === 'object') {
        // Verificar se é Timestamp do Firebase
        if (value.toDate && typeof value.toDate === 'function') {
          type = 'timestamp';
          analysis.timestamps++;
          details.value = value.toDate().toISOString();
        } 
        // Verificar se é DocumentReference
        else if (value.path && value.firestore) {
          type = 'reference';
          analysis.references++;
          details.path = value.path;
        }
        // Objeto aninhado
        else {
          type = 'object';
          analysis.nestedObjects++;
          analyzeObject(value, fullPath);
        }
      } else if (typeof value === 'string') {
        details.length = value.length;
        // Detectar padrões comuns
        if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          details.pattern = 'iso-date';
        } else if (value.match(/^[a-f0-9]{32}$/i)) {
          details.pattern = 'md5-hash';
        } else if (value.match(/^[a-f0-9]{64}$/i)) {
          details.pattern = 'sha256-hash';
        } else if (value.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
          details.pattern = 'email';
        } else if (value.match(/^https?:\/\//)) {
          details.pattern = 'url';
        }
      } else if (typeof value === 'number') {
        details.isInteger = Number.isInteger(value);
        details.value = value;
      }

      // Armazenar tipo
      if (!analysis.fieldTypes[type]) {
        analysis.fieldTypes[type] = 0;
      }
      analysis.fieldTypes[type]++;

      analysis.structure[fullPath] = details;
    });
  };

  analyzeObject(data);
  return analysis;
};

/**
 * 📊 Buscar documentos com paginação
 */
export const getDocumentsWithPagination = async (db, collectionName, options = {}) => {
  try {
    const {
      pageSize = 20,
      startAfterDoc = null,
      orderField = null,
      orderDirection = 'asc',
      searchField = null,
      searchValue = null,
      includeAnalysis = true
    } = options;

    console.log(`📊 Buscando documentos da coleção: ${collectionName}`);

    const collectionRef = collection(db, collectionName);
    let q = collectionRef;

    // Aplicar ordenação
    if (orderField) {
      q = query(q, orderBy(orderField, orderDirection));
    }

    // Aplicar filtro de busca
    if (searchField && searchValue) {
      q = query(q, where(searchField, '>=', searchValue), where(searchField, '<=', searchValue + '\uf8ff'));
    }

    // Aplicar paginação
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    q = query(q, limit(pageSize));

    const snapshot = await getDocs(q);
    const documents = [];
    let totalAnalysis = {
      commonFields: {},
      fieldFrequency: {},
      dataTypes: {},
      totalDocuments: snapshot.size,
      estimatedCollectionSize: 0
    };

    snapshot.docs.forEach(docSnapshot => {
      const data = docSnapshot.data();
      const document = {
        id: docSnapshot.id,
        data,
        metadata: {
          exists: true,
          hasPendingWrites: docSnapshot.metadata.hasPendingWrites,
          isEqual: false
        }
      };

      if (includeAnalysis) {
        document.analysis = analyzeDocumentStructure(data, docSnapshot.id);
        totalAnalysis.estimatedCollectionSize += document.analysis.estimatedSize;

        // Agregar análise geral
        Object.keys(document.analysis.structure).forEach(field => {
          if (!totalAnalysis.commonFields[field]) {
            totalAnalysis.commonFields[field] = 0;
          }
          totalAnalysis.commonFields[field]++;

          const fieldType = document.analysis.structure[field].type;
          if (!totalAnalysis.dataTypes[fieldType]) {
            totalAnalysis.dataTypes[fieldType] = 0;
          }
          totalAnalysis.dataTypes[fieldType]++;
        });
      }

      documents.push(document);
    });

    // Calcular campos mais comuns
    totalAnalysis.fieldFrequency = Object.entries(totalAnalysis.commonFields)
      .sort(([,a], [,b]) => b - a)
      .reduce((acc, [field, count]) => {
        acc[field] = {
          count,
          percentage: ((count / totalAnalysis.totalDocuments) * 100).toFixed(1)
        };
        return acc;
      }, {});

    return {
      documents,
      analysis: totalAnalysis,
      hasMore: snapshot.size === pageSize,
      lastDocument: snapshot.docs[snapshot.docs.length - 1] || null,
      pageInfo: {
        currentPage: startAfterDoc ? 'N/A' : 1,
        pageSize,
        totalInPage: snapshot.size
      }
    };

  } catch (error) {
    console.error(`❌ Erro ao buscar documentos da coleção ${collectionName}:`, error);
    throw error;
  }
};

/**
 * 📄 Buscar documento específico
 */
export const getSpecificDocument = async (db, collectionName, documentId) => {
  try {
    console.log(`📄 Buscando documento: ${collectionName}/${documentId}`);

    const docRef = doc(db, collectionName, documentId);
    const docSnapshot = await getDoc(docRef);

    if (!docSnapshot.exists()) {
      return {
        exists: false,
        id: documentId,
        collection: collectionName
      };
    }

    const data = docSnapshot.data();
    const analysis = analyzeDocumentStructure(data, documentId);

    return {
      exists: true,
      id: documentId,
      collection: collectionName,
      data,
      analysis,
      metadata: {
        hasPendingWrites: docSnapshot.metadata.hasPendingWrites,
        fromCache: docSnapshot.metadata.fromCache,
        path: docSnapshot.ref.path
      }
    };

  } catch (error) {
    console.error(`❌ Erro ao buscar documento ${documentId}:`, error);
    throw error;
  }
};

/**
 * 🔍 Buscar documentos por termo
 */
export const searchDocuments = async (db, collectionName, searchTerm, options = {}) => {
  try {
    const {
      searchFields = ['nome', 'title', 'name', 'email', 'id'],
      maxResults = 50
    } = options;

    console.log(`🔍 Buscando "${searchTerm}" na coleção ${collectionName}`);

    const collectionRef = collection(db, collectionName);
    const allDocuments = [];

    // Buscar em cada campo possível
    for (const field of searchFields) {
      try {
        const q = query(
          collectionRef,
          where(field, '>=', searchTerm),
          where(field, '<=', searchTerm + '\uf8ff'),
          limit(maxResults)
        );

        const snapshot = await getDocs(q);
        
        snapshot.docs.forEach(docSnapshot => {
          const existingDoc = allDocuments.find(d => d.id === docSnapshot.id);
          if (!existingDoc) {
            const data = docSnapshot.data();
            allDocuments.push({
              id: docSnapshot.id,
              data,
              matchedField: field,
              matchedValue: data[field],
              analysis: analyzeDocumentStructure(data, docSnapshot.id)
            });
          }
        });
      } catch (fieldError) {
        // Ignorar erros de campo (campo pode não existir ou não ser indexado)
        console.warn(`⚠️ Erro ao buscar no campo ${field}:`, fieldError.message);
      }
    }

    return {
      searchTerm,
      results: allDocuments.slice(0, maxResults),
      totalFound: allDocuments.length,
      searchedFields: searchFields
    };

  } catch (error) {
    console.error(`❌ Erro na busca:`, error);
    throw error;
  }
};

/**
 * 📈 Análise estatística da coleção
 */
export const getCollectionStatistics = async (db, collectionName, sampleSize = 100) => {
  try {
    console.log(`📈 Analisando estatísticas da coleção: ${collectionName}`);

    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, limit(sampleSize));
    const snapshot = await getDocs(q);

    const statistics = {
      collectionName,
      sampleSize: snapshot.size,
      totalAnalyzed: snapshot.size,
      fieldAnalysis: {},
      dataPatterns: {},
      sizeAnalysis: {
        totalSize: 0,
        averageSize: 0,
        minSize: Infinity,
        maxSize: 0
      },
      timestamps: {
        earliest: null,
        latest: null,
        fields: []
      }
    };

    snapshot.docs.forEach(docSnapshot => {
      const data = docSnapshot.data();
      const analysis = analyzeDocumentStructure(data, docSnapshot.id);

      statistics.sizeAnalysis.totalSize += analysis.estimatedSize;
      statistics.sizeAnalysis.minSize = Math.min(statistics.sizeAnalysis.minSize, analysis.estimatedSize);
      statistics.sizeAnalysis.maxSize = Math.max(statistics.sizeAnalysis.maxSize, analysis.estimatedSize);

      // Analisar campos
      Object.entries(analysis.structure).forEach(([field, details]) => {
        if (!statistics.fieldAnalysis[field]) {
          statistics.fieldAnalysis[field] = {
            frequency: 0,
            type: details.type,
            patterns: [],
            samples: []
          };
        }

        statistics.fieldAnalysis[field].frequency++;
        
        // Coletar amostras de valores
        if (statistics.fieldAnalysis[field].samples.length < 5) {
          if (details.type === 'timestamp' && details.value) {
            statistics.fieldAnalysis[field].samples.push(details.value);
            
            const timestamp = new Date(details.value);
            if (!statistics.timestamps.earliest || timestamp < new Date(statistics.timestamps.earliest)) {
              statistics.timestamps.earliest = details.value;
            }
            if (!statistics.timestamps.latest || timestamp > new Date(statistics.timestamps.latest)) {
              statistics.timestamps.latest = details.value;
            }
            
            if (!statistics.timestamps.fields.includes(field)) {
              statistics.timestamps.fields.push(field);
            }
          } else if (details.type === 'string' || details.type === 'number') {
            const value = data[field.split('.')[0]]; // Pegar valor do campo raiz
            if (value !== undefined && statistics.fieldAnalysis[field].samples.length < 3) {
              statistics.fieldAnalysis[field].samples.push(value);
            }
          }
        }

        // Analisar padrões
        if (details.pattern && !statistics.fieldAnalysis[field].patterns.includes(details.pattern)) {
          statistics.fieldAnalysis[field].patterns.push(details.pattern);
        }
      });
    });

    // Calcular médias
    if (statistics.sampleSize > 0) {
      statistics.sizeAnalysis.averageSize = statistics.sizeAnalysis.totalSize / statistics.sampleSize;
      statistics.sizeAnalysis.minSize = statistics.sizeAnalysis.minSize === Infinity ? 0 : statistics.sizeAnalysis.minSize;
    }

    // Ordenar campos por frequência
    statistics.fieldAnalysis = Object.entries(statistics.fieldAnalysis)
      .sort(([,a], [,b]) => b.frequency - a.frequency)
      .reduce((acc, [field, data]) => {
        acc[field] = {
          ...data,
          percentage: ((data.frequency / statistics.sampleSize) * 100).toFixed(1)
        };
        return acc;
      }, {});

    return statistics;

  } catch (error) {
    console.error(`❌ Erro ao analisar estatísticas:`, error);
    throw error;
  }
};

/**
 * 🔄 Comparar documento entre databases
 */
export const compareDocumentBetweenDatabases = async (collectionName, documentId) => {
  try {
    console.log(`🔄 Comparando documento ${documentId} entre databases`);

    const [primaryDoc, backupDoc] = await Promise.all([
      getSpecificDocument(primaryDb, collectionName, documentId),
      getSpecificDocument(backupDb, collectionName, documentId)
    ]);

    const comparison = {
      documentId,
      collectionName,
      primary: primaryDoc,
      backup: backupDoc,
      differences: [],
      status: 'unknown'
    };

    if (!primaryDoc.exists && !backupDoc.exists) {
      comparison.status = 'not-found';
    } else if (!primaryDoc.exists) {
      comparison.status = 'only-in-backup';
      comparison.differences.push('Documento existe apenas no backup');
    } else if (!backupDoc.exists) {
      comparison.status = 'only-in-primary';
      comparison.differences.push('Documento existe apenas no principal');
    } else {
      // Comparar conteúdo
      const primaryJson = JSON.stringify(primaryDoc.data);
      const backupJson = JSON.stringify(backupDoc.data);
      
      if (primaryJson === backupJson) {
        comparison.status = 'identical';
      } else {
        comparison.status = 'different';
        
        // Analisar diferenças de campos
        const primaryFields = new Set(Object.keys(primaryDoc.analysis.structure));
        const backupFields = new Set(Object.keys(backupDoc.analysis.structure));
        
        // Campos apenas no principal
        const onlyInPrimary = [...primaryFields].filter(f => !backupFields.has(f));
        if (onlyInPrimary.length > 0) {
          comparison.differences.push(`Campos apenas no principal: ${onlyInPrimary.join(', ')}`);
        }
        
        // Campos apenas no backup
        const onlyInBackup = [...backupFields].filter(f => !primaryFields.has(f));
        if (onlyInBackup.length > 0) {
          comparison.differences.push(`Campos apenas no backup: ${onlyInBackup.join(', ')}`);
        }
        
        // Campos com valores diferentes
        const commonFields = [...primaryFields].filter(f => backupFields.has(f));
        commonFields.forEach(field => {
          const primaryValue = JSON.stringify(primaryDoc.data[field]);
          const backupValue = JSON.stringify(backupDoc.data[field]);
          if (primaryValue !== backupValue) {
            comparison.differences.push(`Campo "${field}" tem valores diferentes`);
          }
        });
      }
    }

    return comparison;

  } catch (error) {
    console.error(`❌ Erro ao comparar documento:`, error);
    throw error;
  }
};

export default {
  getDocumentsWithPagination,
  getSpecificDocument,
  searchDocuments,
  getCollectionStatistics,
  compareDocumentBetweenDatabases,
  analyzeDocumentStructure
};