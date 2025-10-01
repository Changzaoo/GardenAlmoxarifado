import React from 'react';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const LGPD = () => {
  const [documentosLGPD, setDocumentosLGPD] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'documentos_legais'),
      orderBy('dataCriacao', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lgpdData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(doc => doc.tipo === 'lgpd');
      setDocumentosLGPD(lgpdData);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      {documentosLGPD.map(doc => (
        <div key={doc.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600 dark:border-gray-600">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium text-white">{doc.titulo}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Versão {doc.versao}</p>
            </div>
            <span className="px-2 py-1 bg-purple-500/10 text-purple-500 rounded-full text-xs">
              {doc.status}
            </span>
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-500 dark:text-gray-400 whitespace-pre-wrap">{doc.conteudo}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400">
            Publicado por {doc.criadoPor} em {new Date(doc.dataCriacao).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LGPD;

