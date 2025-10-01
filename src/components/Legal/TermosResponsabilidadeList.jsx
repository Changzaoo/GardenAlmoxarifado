import React, { useState, useEffect } from 'react';
import { legalDocumentService } from '../../services/legalDocumentService';
import { FileText, Download, Eye } from 'lucide-react';

const TermosResponsabilidadeList = ({ usuario }) => {
  const [termos, setTermos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTermos = async () => {
      try {
        const docs = await legalDocumentService.getDocumentsByUser(usuario.id);
        setTermos(docs);
      } catch (error) {
        console.error('Erro ao carregar termos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTermos();
  }, [usuario.id]);

  if (loading) {
    return <div className="text-gray-500 dark:text-gray-400">Carregando termos...</div>;
  }

  return (
    <div className="space-y-4">
      {termos.map(termo => (
        <div key={termo.id} className="bg-[#22303C] p-4 rounded-lg border border-gray-200 dark:border-gray-600 dark:border-gray-600">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-white font-medium">{termo.type}</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Assinado em: {new Date(termo.createdAt).toLocaleDateString()}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Status: {termo.status === 'signed' ? 'Assinado' : 'Pendente'}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => window.open(`/termo/${termo.id}`)}
                className="p-2 text-blue-500 dark:text-[#1D9BF0] hover:bg-white dark:bg-gray-800 rounded"
                title="Visualizar"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => window.open(`/termo/${termo.id}/download`)}
                className="p-2 text-blue-500 dark:text-[#1D9BF0] hover:bg-white dark:bg-gray-800 rounded"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
      
      {termos.length === 0 && (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 mx-auto text-gray-500 dark:text-gray-400 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum termo de responsabilidade encontrado.</p>
        </div>
      )}
    </div>
  );
};

export default TermosResponsabilidadeList;

