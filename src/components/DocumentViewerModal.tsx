import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getDocumentsWithPagination, 
  getSpecificDocument, 
  searchDocuments, 
  getCollectionStatistics,
  compareDocumentBetweenDatabases 
} from '../services/documentAnalysis';
import { primaryDb, backupDb } from '../config/firebaseDual';
import {
  X,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Database,
  Eye,
  Code,
  Filter,
  RefreshCw,
  Download,
  Copy,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  Hash,
  Type,
  Calendar,
  Link,
  List,
  Layers,
  Zap,
  TrendingUp,
  Info,
  Grid,
  Loader2
} from 'lucide-react';

/**
 * 🔍 Modal de Visualização Detalhada de Documentos
 */
export const DocumentViewerModal = ({ isOpen, onClose, collection, database }) => {
  const [currentView, setCurrentView] = useState('documents'); // 'documents' | 'statistics' | 'search'
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [hasMore, setHasMore] = useState(false);
  const [lastDocument, setLastDocument] = useState(null);

  // Filtros e ordenação
  const [orderField, setOrderField] = useState('');
  const [orderDirection, setOrderDirection] = useState('asc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list' | 'json'

  const db = database === 'primary' ? primaryDb : backupDb;
  const dbName = database === 'primary' ? 'Firebase Principal' : 'Firebase Backup';

  /**
   * 📄 Carregar documentos
   */
  const loadDocuments = async (isNextPage = false) => {
    if (!collection) return;
    
    setLoading(true);
    setError(null);

    try {
      const options = {
        pageSize,
        startAfterDoc: isNextPage ? lastDocument : null,
        orderField: orderField || null,
        orderDirection,
        includeAnalysis: true
      };

      const result = await getDocumentsWithPagination(db, collection.name, options);
      
      if (isNextPage) {
        setDocuments(prev => [...prev, ...result.documents]);
      } else {
        setDocuments(result.documents);
        setCurrentPage(1);
      }

      setHasMore(result.hasMore);
      setLastDocument(result.lastDocument);

    } catch (err) {
      console.error('❌ Erro ao carregar documentos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 📊 Carregar estatísticas
   */
  const loadStatistics = async () => {
    if (!collection) return;

    setLoading(true);
    try {
      const stats = await getCollectionStatistics(db, collection.name, 100);
      setStatistics(stats);
    } catch (err) {
      console.error('❌ Erro ao carregar estatísticas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔍 Realizar busca
   */
  const performSearch = async () => {
    if (!collection || !searchTerm.trim()) return;

    setLoading(true);
    try {
      const results = await searchDocuments(db, collection.name, searchTerm, {
        maxResults: 50
      });
      setSearchResults(results);
    } catch (err) {
      console.error('❌ Erro na busca:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 📄 Visualizar documento específico
   */
  const viewDocument = async (documentId) => {
    setLoading(true);
    try {
      const doc = await getSpecificDocument(db, collection.name, documentId);
      setSelectedDocument(doc);
    } catch (err) {
      console.error('❌ Erro ao carregar documento:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 📋 Copiar dados
   */
  const copyToClipboard = (data) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    // Pode adicionar um toast de sucesso aqui
  };

  /**
   * 💾 Download dados
   */
  const downloadData = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * 🎨 Renderizar valor com tipo
   */
  const renderValue = (value, type) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>;
    }

    switch (type) {
      case 'timestamp':
        return (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-blue-600 dark:text-blue-400">
              {new Date(value).toLocaleString('pt-BR')}
            </span>
          </div>
        );
      case 'array':
        return (
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-green-500" />
            <span className="text-green-600 dark:text-green-400">
              Array ({Array.isArray(value) ? value.length : 0} itens)
            </span>
          </div>
        );
      case 'object':
        return (
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-500" />
            <span className="text-purple-600 dark:text-purple-400">
              Object ({typeof value === 'object' ? Object.keys(value).length : 0} campos)
            </span>
          </div>
        );
      case 'reference':
        return (
          <div className="flex items-center gap-2">
            <Link className="w-4 h-4 text-orange-500" />
            <span className="text-orange-600 dark:text-orange-400">
              Referência: {value}
            </span>
          </div>
        );
      case 'string':
        return (
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700 dark:text-gray-300">
              {typeof value === 'string' ? value.substring(0, 100) : String(value)}
              {typeof value === 'string' && value.length > 100 && '...'}
            </span>
          </div>
        );
      case 'number':
        return (
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-indigo-500" />
            <span className="text-indigo-600 dark:text-indigo-400">{value}</span>
          </div>
        );
      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            {value ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <X className="w-4 h-4 text-red-500" />
            )}
            <span className={value ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {value ? 'true' : 'false'}
            </span>
          </div>
        );
      default:
        return <span className="text-gray-700 dark:text-gray-300">{String(value)}</span>;
    }
  };

  /**
   * 🔄 Reset modal
   */
  const resetModal = () => {
    setDocuments([]);
    setSelectedDocument(null);
    setStatistics(null);
    setSearchResults(null);
    setSearchTerm('');
    setError(null);
    setCurrentPage(1);
    setLastDocument(null);
    setCurrentView('documents');
  };

  // Carregar dados quando modal abre
  useEffect(() => {
    if (isOpen && collection) {
      resetModal();
      loadDocuments();
    }
  }, [isOpen, collection]);

  // Carregar dados quando view muda
  useEffect(() => {
    if (isOpen && collection) {
      if (currentView === 'statistics' && !statistics) {
        loadStatistics();
      }
    }
  }, [currentView, isOpen, collection]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                Visualizador de Documentos
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {collection?.name} • {dbName} • {documents.length} documentos carregados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Selector */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <button
                onClick={() => setCurrentView('documents')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'documents'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentView('statistics')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'statistics'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentView('search')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'search'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                resetModal();
                onClose();
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Erro</span>
                </div>
                <p className="text-red-600 dark:text-red-400 mt-1">{error}</p>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando...</span>
              </div>
            )}

            {/* Documents View */}
            {currentView === 'documents' && !loading && documents.length > 0 && (
              <div className="space-y-4">
                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                    >
                      <option value={10}>10 por página</option>
                      <option value={20}>20 por página</option>
                      <option value={50}>50 por página</option>
                    </select>

                    <select
                      value={viewMode}
                      onChange={(e) => setViewMode(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                    >
                      <option value="grid">Grid</option>
                      <option value="list">Lista</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadDocuments()}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Atualizar
                    </button>

                    <button
                      onClick={() => downloadData(documents, `${collection.name}_documents.json`)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>

                {/* Documents Grid */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => viewDocument(doc.id)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-800 dark:text-white truncate">
                            {doc.id}
                          </h3>
                          <Eye className="w-4 h-4 text-gray-500" />
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Campos:</span>
                            <span className="font-medium text-gray-800 dark:text-white">
                              {doc.analysis?.totalFields || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Tamanho:</span>
                            <span className="font-medium text-gray-800 dark:text-white">
                              {doc.analysis?.estimatedSize || 0} bytes
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Objetos:</span>
                            <span className="font-medium text-gray-800 dark:text-white">
                              {doc.analysis?.nestedObjects || 0}
                            </span>
                          </div>
                        </div>

                        {/* Field Types */}
                        <div className="mt-3 flex flex-wrap gap-1">
                          {Object.entries(doc.analysis?.fieldTypes || {}).map(([type, count]) => (
                            <span
                              key={type}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs"
                            >
                              {type}: {count}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Load More */}
                {hasMore && (
                  <div className="text-center mt-6">
                    <button
                      onClick={() => loadDocuments(true)}
                      disabled={loading}
                      className="flex items-center gap-2 mx-auto px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                      Carregar Mais
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Statistics View */}
            {currentView === 'statistics' && !loading && statistics && (
              <div className="space-y-6">
                {/* Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Documentos Analisados</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {statistics.totalAnalyzed}
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tamanho Total</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {(statistics.sizeAnalysis.totalSize / 1024).toFixed(1)}KB
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tamanho Médio</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {statistics.sizeAnalysis.averageSize.toFixed(0)}B
                    </div>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Campos Únicos</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {Object.keys(statistics.fieldAnalysis).length}
                    </div>
                  </div>
                </div>

                {/* Field Analysis */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                    Análise de Campos
                  </h3>
                  
                  <div className="space-y-3">
                    {Object.entries(statistics.fieldAnalysis).slice(0, 10).map(([field, data]) => (
                      <div key={field} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <Type className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-800 dark:text-white">{field}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {data.type} • {data.frequency} docs ({data.percentage}%)
                            </div>
                          </div>
                        </div>
                        
                        {data.samples.length > 0 && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                            Exemplo: {JSON.stringify(data.samples[0]).substring(0, 50)}...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Search View */}
            {currentView === 'search' && (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Digite o termo para buscar..."
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    onKeyPress={(e) => e.key === 'Enter' && performSearch()}
                  />
                  <button
                    onClick={performSearch}
                    disabled={loading || !searchTerm.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    <Search className="w-5 h-5" />
                    Buscar
                  </button>
                </div>

                {searchResults && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                      Resultados da Busca: "{searchResults.searchTerm}"
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {searchResults.totalFound} resultados encontrados
                    </p>

                    <div className="space-y-3">
                      {searchResults.results.map((result) => (
                        <div
                          key={result.id}
                          className="p-4 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500 cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => viewDocument(result.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-800 dark:text-white">{result.id}</span>
                            <span className="text-sm text-blue-600 dark:text-blue-400">
                              Campo: {result.matchedField}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Valor encontrado: {JSON.stringify(result.matchedValue).substring(0, 100)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Document Details Sidebar */}
          {selectedDocument && (
            <div className="w-1/3 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                    Detalhes do Documento
                  </h3>
                  <button
                    onClick={() => setSelectedDocument(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Document Info */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Informações</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">ID:</span>
                        <span className="font-mono text-gray-800 dark:text-white">{selectedDocument.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Coleção:</span>
                        <span className="font-medium text-gray-800 dark:text-white">{selectedDocument.collection}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Campos:</span>
                        <span className="font-medium text-gray-800 dark:text-white">
                          {selectedDocument.analysis?.totalFields || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Tamanho:</span>
                        <span className="font-medium text-gray-800 dark:text-white">
                          {selectedDocument.analysis?.estimatedSize || 0} bytes
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(selectedDocument.data)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors text-sm"
                    >
                      <Copy className="w-4 h-4" />
                      Copiar
                    </button>
                    <button
                      onClick={() => downloadData(selectedDocument, `${selectedDocument.id}.json`)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>

                  {/* Document Data */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Dados</h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {Object.entries(selectedDocument.analysis?.structure || {}).map(([field, details]) => (
                        <div key={field} className="border-b border-gray-200 dark:border-gray-600 pb-2">
                          <div className="font-medium text-gray-800 dark:text-white text-sm mb-1">
                            {field}
                          </div>
                          <div className="text-xs">
                            {renderValue(selectedDocument.data[field.split('.')[0]], details.type)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default DocumentViewerModal;