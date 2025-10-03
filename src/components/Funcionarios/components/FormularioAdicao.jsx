import React, { useState, useEffect, useRef } from 'react';
import { Plus, Upload, X } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, storage } from '../../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
  const fileInputRef = useRef();
  const [dados, setDados] = useState({ 
    nome: '', 
    cargo: '', 
    telefone: '',
    empresaId: '',
    empresaNome: '',
    setorId: '',
    setorNome: '',
    photoURL: ''
  });
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
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

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        showToast('Selecione apenas imagens', 'error');
        return;
      }
      
      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Imagem deve ter no máximo 5MB', 'error');
        return;
      }
      
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removerFoto = () => {
    setFotoFile(null);
    setFotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFoto = async () => {
    if (!fotoFile) return null;
    
    try {
      const timestamp = Date.now();
      const nomeArquivo = `funcionarios/${timestamp}_${fotoFile.name}`;
      const storageRef = ref(storage, nomeArquivo);
      
      await uploadBytes(storageRef, fotoFile);
      const url = await getDownloadURL(storageRef);
      
      return url;
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      showToast('Erro ao fazer upload da foto', 'error');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!dados.empresaId) {
      showToast('Selecione uma empresa', 'warning');
      return;
    }
    
    if (!dados.setorId) {
      showToast('Selecione um setor', 'warning');
      return;
    }
    
    // Fazer upload da foto se houver
    let photoURL = '';
    if (fotoFile) {
      photoURL = await uploadFoto();
      if (!photoURL) return; // Se falhou o upload, não continua
    }
    
    onSubmit({ ...dados, photoURL });
    
    // Resetar form
    setDados({ 
      nome: '', 
      cargo: '', 
      telefone: '',
      empresaId: '',
      empresaNome: '',
      setorId: '',
      setorNome: '',
      photoURL: ''
    });
    removerFoto();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Preview da Foto */}
      {fotoPreview && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <img 
            src={fotoPreview} 
            alt="Preview" 
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Foto selecionada</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{fotoFile?.name}</p>
          </div>
          <button
            type="button"
            onClick={removerFoto}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2">
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
      
      {/* Botão Upload de Foto */}
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFotoChange}
          className="hidden"
          id="foto-funcionario"
        />
        <label
          htmlFor="foto-funcionario"
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm cursor-pointer border border-gray-200 dark:border-gray-600"
        >
          <Upload className="w-3 h-3" /> Foto
        </label>
      </div>

      <button 
        type="submit" 
        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white rounded-lg hover:bg-blue-600 dark:hover:bg-[#1a8cd8] transition-colors text-sm lg:col-span-2" 
        disabled={loading}
      >
        <Plus className="w-3 h-3" /> Adicionar Funcionário
      </button>
      </div>
    </form>
  );
};

export default FormularioAdicao;


