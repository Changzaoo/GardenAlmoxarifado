import React from 'react';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const Conformidade = () => {
  const [documentosConformidade, setDocumentosConformidade] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'documentos_legais'),
      orderBy('dataCriacao', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conformidadeData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(doc => doc.tipo === 'conformidade');
      setDocumentosConformidade(conformidadeData);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      {documentosConformidade.map(doc => (
        <div key={doc.id} className="bg-[#192734] p-6 rounded-lg border border-[#38444D]">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium text-white">{doc.titulo}</h3>
              <p className="text-sm text-[#8899A6]">Versão {doc.versao}</p>
            </div>
            <span className="px-2 py-1 bg-orange-500/10 text-orange-500 rounded-full text-xs">
              {doc.status}
            </span>
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="text-[#8899A6] whitespace-pre-wrap">{doc.conteudo}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-[#38444D] text-sm text-[#8899A6]">
            Publicado por {doc.criadoPor} em {new Date(doc.dataCriacao).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Conformidade;
