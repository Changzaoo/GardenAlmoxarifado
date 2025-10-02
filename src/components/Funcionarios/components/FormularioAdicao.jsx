import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useToast } from '../../ToastProvider';

const formatarTelefone = (telefone) => {
  const cleaned = telefone.replace(/\D/g, '');
  let match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return telefone;
};

const FormularioAdicao = ({ onSubmit, loading, formatarTelefone }) => {
  const { showToast } = useToast();
  const [dados, setDados] = useState({ 
    nome: '', 
    cargo: '', 
    telefone: '',
    empresaId: '',
    empresaNome: '',
    setorId: '',
    setorNome: ''
  });
  const [empresas, setEmpresas] = useState([]);
  const [setores, setSetores] = useState([]);
  const [setoresDisponiveis, setSetoresDisponiveis] = useState([]);

  useEffect(() => {
    carregarEmpresas();
    carregarSetores();
  }, []);

  useEffect(() => {
    // Filtrar setores quando empresa for selecionada
    if (dados.empresaId) {
      const setoresDaEmpresa = setores.filter(s => s.empresaId === dados.empresaId && s.ativo !== false);
      setSetoresDisponiveis(setoresDaEmpresa);
    } else {
      setSetoresDisponiveis([]);
    }
  }, [dados.empresaId, setores]);

  const carregarEmpresas = async () => {
    try {
      const empresasRef = collection(db, 'empresas');
      const snapshot = await getDocs(empresasRef);
      const empresasData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(e => e.ativo !== false);
      setEmpresas(empresasData);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const carregarSetores = async () => {
    try {
      const setoresRef = collection(db, 'setores');
      const snapshot = await getDocs(setoresRef);
      const setoresData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSetores(setoresData);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    }
  };

  const handleEmpresaChange = (e) => {
    const empresaId = e.target.value;
    const empresa = empresas.find(emp => emp.id === empresaId);
    setDados({ 
      ...dados, 
      empresaId, 
      empresaNome: empresa?.nome || '',
      setorId: '', // Reset setor quando trocar empresa
      setorNome: ''
    });
  };

  const handleSetorChange = (e) => {
    const setorId = e.target.value;
    const setor = setores.find(s => s.id === setorId);
    setDados({ 
      ...dados, 
      setorId, 
      setorNome: setor?.nome || ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!dados.empresaId) {
      showToast('Selecione uma empresa', 'warning');
      return;
    }
    
    if (!dados.setorId) {
      showToast('Selecione um setor', 'warning');
      return;
    }
    
    onSubmit(dados);
    setDados({ 
      nome: '', 
      cargo: '', 
      telefone: '',
      empresaId: '',
      empresaNome: '',
      setorId: '',
      setorNome: ''
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2">
      <input
        type="text"
        placeholder="Nome"
        value={dados.nome}
        onChange={e => setDados({ ...dados, nome: e.target.value })}
        className="px-4 py-2 rounded-lg text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0]"
        required
      />
      
      <input
        type="text"
        placeholder="Cargo"
        value={dados.cargo}
        onChange={e => setDados({ ...dados, cargo: e.target.value })}
        className="px-4 py-2 rounded-lg text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0]"
        required
      />
      
      <input
        type="text"
        placeholder="(00) 00000-0000"
        value={dados.telefone ? formatarTelefone(dados.telefone) : ''}
        onChange={e => {
          const onlyNums = e.target.value.replace(/[^0-9]/g, '');
          setDados({ ...dados, telefone: onlyNums });
        }}
        className="px-4 py-2 rounded-lg text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0]"
        required
        maxLength={15}
      />
      
      <select
        value={dados.empresaId}
        onChange={handleEmpresaChange}
        className="px-4 py-2 rounded-lg text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0]"
        required
      >
        <option value="">Selecione a Empresa</option>
        {empresas.map(empresa => (
          <option key={empresa.id} value={empresa.id}>
            {empresa.nome}
          </option>
        ))}
      </select>
      
      <select
        value={dados.setorId}
        onChange={handleSetorChange}
        className="px-4 py-2 rounded-lg text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0]"
        required
        disabled={!dados.empresaId}
      >
        <option value="">Selecione o Setor</option>
        {setoresDisponiveis.map(setor => (
          <option key={setor.id} value={setor.id}>
            {setor.nome}
          </option>
        ))}
      </select>
      
      <button 
        type="submit" 
        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white rounded-lg hover:bg-blue-600 dark:hover:bg-[#1a8cd8] transition-colors text-sm lg:col-span-2" 
        disabled={loading}
      >
        <Plus className="w-3 h-3" /> Adicionar Funcionário
      </button>
    </form>
  );
};

export default FormularioAdicao;


