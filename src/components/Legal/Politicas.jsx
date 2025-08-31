import React from 'react';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const Politicas = () => {
  const [politicas, setPoliticas] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'documentos_legais'),
      orderBy('dataCriacao', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const politicasData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(doc => doc.tipo === 'politica');
      setPoliticas(politicasData);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      {politicas.map(politica => (
        <div key={politica.id} className="bg-[#192734] p-6 rounded-lg border border-[#38444D]">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium text-white">{politica.titulo}</h3>
              <p className="text-sm text-[#8899A6]">Versão {politica.versao}</p>
            </div>
            <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs">
              {politica.status}
            </span>
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="text-[#8899A6] whitespace-pre-wrap">{politica.conteudo}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-[#38444D] text-sm text-[#8899A6]">
            Publicado por {politica.criadoPor} em {new Date(politica.dataCriacao).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Politicas;
