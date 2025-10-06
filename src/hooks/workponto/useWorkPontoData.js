import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, startOfDay, endOfDay } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export const useWorkPontoData = (usuario) => {
  const [loading, setLoading] = useState(false);
  const [pontos, setPontos] = useState([]);
  const [pontoHoje, setPontoHoje] = useState(null);
  const [hasReferencePhoto, setHasReferencePhoto] = useState(false);

  // Carregar pontos e verificar foto de referência
  useEffect(() => {
    if (!usuario?.id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Buscar pontos
        const pontosQuery = query(
          collection(db, 'pontos'),
          where('funcionarioId', '==', usuario.id),
          orderBy('timestamp', 'desc')
        );
        const pontosSnapshot = await getDocs(pontosQuery);
        const pontosData = pontosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPontos(pontosData);

        // Verificar ponto de hoje
        const hoje = new Date();
        const pontoHojeData = pontosData.find(p => {
          const pontoDate = p.timestamp.toDate();
          return pontoDate.toDateString() === hoje.toDateString();
        });
        setPontoHoje(pontoHojeData || null);

        // Verificar foto de referência
        const funcionariosQuery = query(
          collection(db, 'funcionarios'),
          where('id', '==', usuario.id)
        );
        const funcionariosSnapshot = await getDocs(funcionariosQuery);
        if (!funcionariosSnapshot.empty) {
          const funcData = funcionariosSnapshot.docs[0].data();
          setHasReferencePhoto(!!funcData.faceReferenceURL);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [usuario?.id]);

  return {
    loading,
    pontos,
    pontoHoje,
    hasReferencePhoto,
    setHasReferencePhoto,
    setPontoHoje
  };
};
