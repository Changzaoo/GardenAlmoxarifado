import React, { useState, useEffect } from 'react';
import { Shield, FileText, Book, UserCheck, PlusIcon } from 'lucide-react';
import { db } from '../../firebaseConfig';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ToastProvider';
import { NIVEIS_PERMISSAO } from '../../constants/permissoes';

const LegalTab = () => {
  const { usuario } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('termos');
  const [documentos, setDocumentos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [formData, setFormData] = useState({
    titulo: '',
    conteudo: '',
    tipo: 'termo',
    dataPublicacao: new Date().toISOString(),
    versao: '1.0',
    status: 'ativo',
    versoes: []
  });

  // Apenas usuários de nível LEGAL podem editar
  const canEdit = usuario?.nivel === NIVEIS_PERMISSAO.LEGAL;

  const tabs = [
    { id: 'termos', label: 'Termos de Uso', icon: FileText },
    { id: 'politicas', label: 'Políticas', icon: Book },
    { id: 'lgpd', label: 'LGPD', icon: Shield },
    { id: 'conformidade', label: 'Conformidade', icon: UserCheck }
  ];
  
  // Verifica se o usuário é nível 1 (apenas visualização)
  const isViewOnly = usuario?.nivel === 1;

  useEffect(() => {
    const fetchDocumentos = async () => {
      try {
        const q = query(
          collection(db, 'legal'),
          where('status', '==', 'ativo')
        );
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDocumentos(docs);
      } catch (error) {
        console.error('Erro ao buscar documentos:', error);
        showToast('Erro ao carregar documentos legais', 'error');
      }
    };

    fetchDocumentos();
  }, [showToast, refresh]);

  const handleNewVersion = (doc) => {
    setFormData({
      ...doc,
      versao: `${parseFloat(doc.versao) + 0.1}.0`,
      versoes: [...(doc.versoes || []), {
        versao: doc.versao,
        conteudo: doc.conteudo,
        dataCriacao: doc.dataCriacao,
        criadoPor: doc.criadoPor
      }]
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <form className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600 dark:border-gray-600">
        {/* Botões de ação */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-4">
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white rounded-md hover:bg-blue-600 dark:hover:bg-[#1a8cd8] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] flex items-center space-x-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Novo texto legal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {}}
                  className="px-4 py-2 bg-[#2C3C4C] text-gray-900 dark:text-white rounded-md hover:bg-[#38444D] focus:outline-none focus:ring-2 focus:ring-[#38444D] flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Adicionar documentos padrão</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs - com suporte a modo retrato */}
        <div className="w-full overflow-x-auto mt-6">
          <div className="flex flex-nowrap min-w-max border-b border-gray-200 dark:border-gray-600 dark:border-gray-600">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center px-4 py-2 ${
                  activeTab === tab.id
                    ? "text-blue-500 dark:text-[#1D9BF0] border-b-2 border-blue-500 dark:border-[#1D9BF0]"
                    : "text-gray-500 dark:text-gray-400 hover:text-white"
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2 shrink-0" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Lista de documentos */}
        <div className="mt-6">
          <div className="space-y-4">
            {documentos
              .filter(doc => {
                switch (activeTab) {
                  case 'termos': return doc.tipo === 'termo';
                  case 'politicas': return doc.tipo === 'politica';
                  case 'lgpd': return doc.tipo === 'lgpd';
                  case 'conformidade': return doc.tipo === 'conformidade';
                  default: return false;
                }
              })
              .map(doc => (
                <div key={doc.id} className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 dark:border-gray-600">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-medium">{doc.titulo}</h4>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Versão atual: {doc.versao}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-gray-500 dark:text-gray-400 text-sm">
                        {new Date(doc.dataCriacao).toLocaleDateString()}
                      </div>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleNewVersion(doc)}
                          className="px-2 py-1 bg-[#2C3C4C] text-gray-900 dark:text-white text-sm rounded hover:bg-[#38444D] focus:outline-none focus:ring-2 focus:ring-[#38444D]"
                        >
                          Nova versão
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 text-gray-900 dark:text-white whitespace-pre-wrap">
                    {doc.conteudo}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </form>
    </div>
  );
};

export default LegalTab;


