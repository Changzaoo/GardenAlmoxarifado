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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Adicionar Novo Funcionário</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Preencha os dados para cadastrar</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Preview da Foto */}
        {fotoPreview && (
          <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <img 
              src={fotoPreview} 
              alt="Preview" 
              className="w-16 h-16 rounded-lg object-cover ring-2 ring-blue-300 dark:ring-blue-700"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Foto selecionada</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{fotoFile?.name}</p>
            </div>
            <button
              type="button"
              onClick={removerFoto}
              className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Nome */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Nome Completo *
            </label>
            <input
              type="text"
              placeholder="Ex: João Silva"
              value={dados.nome}
              onChange={e => setDados({ ...dados, nome: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>
        
          {/* Cargo */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Cargo *
            </label>
            <select
              value={dados.cargo || ''}
              onChange={e => {
                const value = e.target.value;
                if (value === 'outro') {
                  setDados({ ...dados, cargo: '', cargoPersonalizado: true });
                } else {
                  setDados({ ...dados, cargo: value, cargoPersonalizado: false });
                }
              }}
              className="w-full px-4 py-2.5 rounded-lg text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            >
              <option value="">Selecione um cargo...</option>
              <optgroup label="Operacionais">
                <option value="Jardineiro">Jardineiro</option>
                <option value="Auxiliar de Jardinagem">Auxiliar de Jardinagem</option>
                <option value="Podador">Podador</option>
                <option value="Operador de Máquinas">Operador de Máquinas</option>
                <option value="Técnico em Paisagismo">Técnico em Paisagismo</option>
              </optgroup>
              <optgroup label="Administrativos">
                <option value="Gerente">Gerente</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Coordenador">Coordenador</option>
                <option value="Assistente Administrativo">Assistente Administrativo</option>
                <option value="Almoxarife">Almoxarife</option>
              </optgroup>
              <optgroup label="Especializados">
                <option value="Engenheiro Agrônomo">Engenheiro Agrônomo</option>
                <option value="Arquiteto Paisagista">Arquiteto Paisagista</option>
                <option value="Designer de Jardins">Designer de Jardins</option>
                <option value="Técnico em Irrigação">Técnico em Irrigação</option>
              </optgroup>
              <option value="outro">✏️ Outro (personalizar)</option>
            </select>
            {dados.cargoPersonalizado && (
              <input
                type="text"
                placeholder="Digite o cargo personalizado..."
                value={dados.cargo}
                onChange={e => setDados({ ...dados, cargo: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mt-2"
                required
                autoFocus
              />
            )}
          </div>
        
          {/* Telefone */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Telefone *
            </label>
            <input
              type="text"
              placeholder="(00) 00000-0000"
              value={dados.telefone ? formatarTelefone(dados.telefone) : ''}
              onChange={e => {
                const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                setDados({ ...dados, telefone: onlyNums });
              }}
              className="w-full px-4 py-2.5 rounded-lg text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
              maxLength={15}
            />
          </div>
        
          {/* Empresa */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Empresa *
            </label>
            <select
              value={dados.empresaId}
              onChange={handleEmpresaChange}
              className="w-full px-4 py-2.5 rounded-lg text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            >
              <option value="">Selecione a Empresa</option>
              {empresas.map(empresa => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nome}
                </option>
              ))}
            </select>
          </div>
        
          {/* Setor */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Setor *
            </label>
            <select
              value={dados.setorId}
              onChange={handleSetorChange}
              className="w-full px-4 py-2.5 rounded-lg text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        
          {/* Upload de Foto */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Foto (Opcional)
            </label>
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
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm cursor-pointer border border-gray-300 dark:border-gray-600"
            >
              <Upload className="w-4 h-4" /> Escolher Foto
            </label>
          </div>
        </div>

        {/* Botão Submit */}
        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Adicionando...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Adicionar Funcionário</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioAdicao;


