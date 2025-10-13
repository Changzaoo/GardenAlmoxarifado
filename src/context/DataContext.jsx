import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData deve ser usado dentro de DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [setores, setSetores] = useState([]);
  const [ferramentas, setFerramentas] = useState([]);
  const [emprestimos, setEmprestimos] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        
        // Carregar todos os dados em paralelo
        const [
          usuariosSnap,
          empresasSnap,
          setoresSnap,
          ferramentasSnap,
          emprestimosSnap,
          tarefasSnap
        ] = await Promise.all([
          getDocs(collection(db, 'usuarios')),
          getDocs(collection(db, 'empresas')),
          getDocs(collection(db, 'setores')),
          getDocs(collection(db, 'ferramentas')),
          getDocs(collection(db, 'emprestimos')),
          getDocs(collection(db, 'tarefas'))
        ]);

        // Processar usuários
        const usuariosData = usuariosSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsuarios(usuariosData);

        // Processar empresas
        const empresasData = empresasSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEmpresas(empresasData);

        // Processar setores
        const setoresData = setoresSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSetores(setoresData);

        // Processar ferramentas
        const ferramentasData = ferramentasSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFerramentas(ferramentasData);

        // Processar empréstimos
        const emprestimosData = emprestimosSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEmprestimos(emprestimosData);

        // Processar tarefas
        const tarefasData = tarefasSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTarefas(tarefasData);

        setLoading(false);

        // Configurar listeners para atualizações em tempo real
        const unsubUsuarios = onSnapshot(collection(db, 'usuarios'), (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setUsuarios(data);
        });

        const unsubEmpresas = onSnapshot(collection(db, 'empresas'), (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setEmpresas(data);
        });

        const unsubSetores = onSnapshot(collection(db, 'setores'), (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setSetores(data);
        });

        const unsubFerramentas = onSnapshot(collection(db, 'ferramentas'), (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setFerramentas(data);
        });

        const unsubEmprestimos = onSnapshot(collection(db, 'emprestimos'), (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setEmprestimos(data);
        });

        const unsubTarefas = onSnapshot(collection(db, 'tarefas'), (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTarefas(data);
        });

        return () => {
          unsubUsuarios();
          unsubEmpresas();
          unsubSetores();
          unsubFerramentas();
          unsubEmprestimos();
          unsubTarefas();
        };
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  const value = {
    usuarios,
    empresas,
    setores,
    ferramentas,
    emprestimos,
    tarefas,
    loading,
    error,
    // Funções auxiliares
    getUsuarioById: (id) => usuarios.find(u => u.id === id),
    getEmpresaById: (id) => empresas.find(e => e.id === id),
    getSetorById: (id) => setores.find(s => s.id === id),
    getFerramentaById: (id) => ferramentas.find(f => f.id === id),
    getEmprestimoById: (id) => emprestimos.find(e => e.id === id),
    getTarefaById: (id) => tarefas.find(t => t.id === id)
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
