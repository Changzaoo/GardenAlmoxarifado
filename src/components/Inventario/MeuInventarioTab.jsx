import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import ListaMeuInventario from './ListaMeuInventario';
import TransferenciasRecebidas from '../Transferencias/TransferenciasRecebidas';
import { FuncionariosProvider } from '../Funcionarios/FuncionariosProvider';

const MeuInventarioTab = ({ emprestimos }) => {
  const { usuario } = useAuth();
  const [transferencias, setTransferencias] = useState([]);
  const [isLoadingTransferencias, setIsLoadingTransferencias] = useState(true);

  // Aplicar o tema do Twitter à página
  useEffect(() => {
    document.body.style.backgroundColor = '#15202B';
    document.body.style.color = '#ffffff';
    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, []);

  // Carregar transferências pendentes
  useEffect(() => {
    let unsubscribe = () => {};

    const carregarTransferencias = async () => {
      if (!usuario?.id) return;

      const q = query(
        collection(db, 'transferencias'),
        where('funcionarioDestinoId', '==', String(usuario.id)),
        where('status', '==', 'pendente')
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const transferenciasData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Transferências pendentes carregadas:', transferenciasData);
        setTransferencias(transferenciasData);
        setIsLoadingTransferencias(false);
      });
    };

    carregarTransferencias();
    return () => unsubscribe();
  }, [usuario]);

  console.log('MeuInventarioTab - Estado:', {
    usuario,
    emprestimos,
    transferencias,
    temEmprestimos: Array.isArray(emprestimos),
    quantidadeEmprestimos: Array.isArray(emprestimos) ? emprestimos.length : 'N/A'
  });

  const renderConteudo = () => {
    if (!usuario) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-600">Você precisa estar logado para ver seus empréstimos.</p>
        </div>
      );
    }

    if (!Array.isArray(emprestimos)) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando empréstimos...</p>
        </div>
      );
    }

    return (
      <>
        {transferencias.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-semibold text-yellow-800">
                Transferências Pendentes ({transferencias.length})
              </h3>
            </div>
            <p className="text-sm text-yellow-700 mb-4">
              Você tem ferramentas aguardando sua confirmação de recebimento.
            </p>
          </div>
        )}
        
        <ListaMeuInventario 
          emprestimos={emprestimos} 
          transferencias={transferencias}
          usuario={usuario} 
          isLoadingTransferencias={isLoadingTransferencias}
        />
      </>
    );
  };

  return (
    <FuncionariosProvider>
      <div className="space-y-6">
        {renderConteudo()}
      </div>
    </FuncionariosProvider>
  );
};

export default MeuInventarioTab;