import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface InventarioContextType {
  inventario: any[];
  loading: boolean;
  error: string | null;
  refreshInventario: () => void;
}

export const InventarioContext = createContext<InventarioContextType | undefined>(undefined);

interface InventarioProviderProps {
  children: ReactNode;
}

export const InventarioProvider: React.FC<InventarioProviderProps> = ({ children }) => {
  const [inventario, setInventario] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = onSnapshot(
      collection(db, 'inventario'),
      (snapshot: QuerySnapshot<DocumentData>) => {
        try {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setInventario(items);
          setError(null);
        } catch (err) {
          console.error('Erro ao processar inventário:', err);
          setError('Erro ao carregar inventário');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Erro ao escutar inventário:', err);
        setError('Erro ao conectar com o banco de dados');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const refreshInventario = () => {
    setLoading(true);
    // O onSnapshot já mantém os dados atualizados em tempo real
    // Esta função pode ser usada para forçar uma atualização se necessário
  };

  const value: InventarioContextType = {
    inventario,
    loading,
    error,
    refreshInventario
  };

  return (
    <InventarioContext.Provider value={value}>
      {children}
    </InventarioContext.Provider>
  );
};

export const useInventario = (): InventarioContextType => {
  const context = useContext(InventarioContext);
  if (context === undefined) {
    throw new Error('useInventario must be used within an InventarioProvider');
  }
  return context;
};

export default InventarioProvider;
