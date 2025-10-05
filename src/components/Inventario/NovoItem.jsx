import React, { useState, useEffect } from 'react';
import { Plus, Building2, Briefcase } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import AdicionarItemAnimation from './AdicionarItemAnimation';
import { isAdmin as checkIsAdmin, hasManagementPermission } from '../../constants/permissoes';

const NovoItem = ({ adicionarItem }) => {
  const { usuario } = useAuth();
  const isAdmin = checkIsAdmin(usuario?.nivel) || hasManagementPermission(usuario?.nivel);
  
  const [novoItem, setNovoItem] = useState({
    nome: '',
    quantidade: '',
    categoria: ''
  });
  
  const [empresas, setEmpresas] = useState([]);
  const [setores, setSetores] = useState([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState('');
  const [setorSelecionado, setSetorSelecionado] = useState('');
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [loadingSetores, setLoadingSetores] = useState(false);
  
  // Estados para controlar a animação
  const [showAdicionarAnimation, setShowAdicionarAnimation] = useState(false);
  const [dadosAnimacao, setDadosAnimacao] = useState(null);

  // Carregar empresas quando o componente monta (apenas para admin)
  useEffect(() => {
    if (isAdmin) {
      carregarEmpresas();
    } else {
      // Para não-admins, usar empresa e setor do usuário
      setEmpresaSelecionada(usuario?.empresaId || '');
      setSetorSelecionado(usuario?.setorId || '');
    }
  }, [isAdmin, usuario]);

  // Carregar setores quando empresa é selecionada
  useEffect(() => {
    if (empresaSelecionada && isAdmin) {
      carregarSetores(empresaSelecionada);
    }
  }, [empresaSelecionada, isAdmin]);

  const carregarEmpresas = async () => {
    try {
      setLoadingEmpresas(true);
      const empresasRef = collection(db, 'empresas');
      const snapshot = await getDocs(empresasRef);
      const empresasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmpresas(empresasData.filter(e => e.ativo !== false));
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setLoadingEmpresas(false);
    }
  };

  const carregarSetores = async (empresaId) => {
    try {
      setLoadingSetores(true);
      const setoresRef = collection(db, 'setores');
      const q = query(setoresRef, where('empresaId', '==', empresaId));
      const snapshot = await getDocs(q);
      const setoresData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSetores(setoresData.filter(s => s.ativo !== false));
      // Resetar setor selecionado quando trocar de empresa
      setSetorSelecionado('');
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    } finally {
      setLoadingSetores(false);
    }
  };

  const handleSubmit = () => {
    if (!novoItem.nome || !novoItem.quantidade || !novoItem.categoria) return;

    // Validação para admin: deve selecionar empresa e setor
    if (isAdmin && (!empresaSelecionada || !setorSelecionado)) {
      alert('Por favor, selecione a empresa e o setor para registrar a ferramenta.');
      return;
    }

    // Buscar nomes da empresa e setor
    let empresaNome, setorNome;
    
    if (isAdmin) {
      const empresa = empresas.find(e => e.id === empresaSelecionada);
      const setor = setores.find(s => s.id === setorSelecionado);
      empresaNome = empresa?.nome || '';
      setorNome = setor?.nome || '';
    } else {
      empresaNome = usuario?.empresaNome || 'Zendaya';
      setorNome = usuario?.setorNome || 'Jardinagem';
    }

    const itemComEmpresaSetor = {
      ...novoItem,
      empresa: empresaNome,
      setor: setorNome,
      empresaId: isAdmin ? empresaSelecionada : (usuario?.empresaId || ''),
      setorId: isAdmin ? setorSelecionado : (usuario?.setorId || ''),
      criadoPor: usuario?.username || 'Sistema',
      criadoEm: new Date().toISOString()
    };

    console.log('🌱 Criando novo item com informações da empresa e setor:', {
      nome: itemComEmpresaSetor.nome,
      empresa: itemComEmpresaSetor.empresa,
      setor: itemComEmpresaSetor.setor,
      empresaId: itemComEmpresaSetor.empresaId,
      setorId: itemComEmpresaSetor.setorId,
      criadoPor: itemComEmpresaSetor.criadoPor
    });

    // Preparar dados para a animação
    setDadosAnimacao({
      item: {
        nome: itemComEmpresaSetor.nome,
        quantidade: parseInt(itemComEmpresaSetor.quantidade),
        categoria: itemComEmpresaSetor.categoria
      },
      empresa: itemComEmpresaSetor.empresa,
      setor: itemComEmpresaSetor.setor,
      destino: 'almoxarifado', // Sempre vai para o almoxarifado do setor
      itemCompleto: itemComEmpresaSetor
    });

    // Mostrar animação
    setShowAdicionarAnimation(true);
  };

  // Função chamada quando a animação termina
  const finalizarAdicaoItem = () => {
    if (dadosAnimacao) {
      // Adicionar item ao Firebase
      const sucesso = adicionarItem(dadosAnimacao.itemCompleto);
      
      if (sucesso) {
        // Limpar formulário
        setNovoItem({ nome: '', quantidade: '', categoria: '' });
      }
    }

    // Limpar estados da animação
    setShowAdicionarAnimation(false);
    setDadosAnimacao(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-600">
      {/* Seleção de Empresa e Setor para Admin */}
      {isAdmin && (
        <div className="mb-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
            <Building2 className="w-4 h-4" />
            <span>Modo Administrador: Escolha a empresa e setor para registrar a ferramenta</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Seletor de Empresa */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Building2 className="w-4 h-4" />
                Empresa *
              </label>
              <select
                value={empresaSelecionada}
                onChange={(e) => setEmpresaSelecionada(e.target.value)}
                disabled={loadingEmpresas}
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors appearance-none"
              >
                <option value="" className="bg-white dark:bg-gray-800">
                  {loadingEmpresas ? 'Carregando...' : 'Selecione a empresa'}
                </option>
                {empresas.map(empresa => (
                  <option key={empresa.id} value={empresa.id} className="bg-white dark:bg-gray-800">
                    {empresa.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Seletor de Setor */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Briefcase className="w-4 h-4" />
                Setor *
              </label>
              <select
                value={setorSelecionado}
                onChange={(e) => setSetorSelecionado(e.target.value)}
                disabled={!empresaSelecionada || loadingSetores}
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" className="bg-white dark:bg-gray-800">
                  {!empresaSelecionada 
                    ? 'Selecione uma empresa primeiro' 
                    : loadingSetores 
                    ? 'Carregando...' 
                    : 'Selecione o setor'}
                </option>
                {setores.map(setor => (
                  <option key={setor.id} value={setor.id} className="bg-white dark:bg-gray-800">
                    {setor.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de Empresa e Setor para não-admin */}
      {!isAdmin && usuario && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-full">
            <span className="text-green-600 dark:text-green-400 font-medium">🏢</span>
            <span className="text-green-700 dark:text-green-300">{usuario.empresaNome || 'Zendaya'}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-full">
            <span className="text-blue-600 dark:text-blue-400 font-medium">🌱</span>
            <span className="text-blue-700 dark:text-blue-300">{usuario.setorNome || 'Jardinagem'}</span>
          </div>
          <span className="text-gray-500 dark:text-gray-400 text-xs italic">
            (será registrado automaticamente)
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Nome do item"
          value={novoItem.nome}
          onChange={(e) => setNovoItem({...novoItem, nome: e.target.value})}
          className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors"
        />
        <input
          type="number"
          min="1"
          placeholder="Quantidade"
          value={novoItem.quantidade}
          onChange={(e) => setNovoItem({...novoItem, quantidade: e.target.value})}
          className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors"
        />
        <select
          value={novoItem.categoria}
          onChange={(e) => setNovoItem({...novoItem, categoria: e.target.value})}
          className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors appearance-none"
        >
          <option value="" className="bg-white dark:bg-gray-800">Selecione a categoria</option>
          <option value="Plantas & Mudas" className="bg-white dark:bg-gray-800">🌱 Plantas & Mudas</option>
          <option value="Sementes" className="bg-white dark:bg-gray-800">🌾 Sementes</option>
          <option value="Fertilizantes & Adubos" className="bg-white dark:bg-gray-800">🧪 Fertilizantes & Adubos</option>
          <option value="Terra & Substratos" className="bg-white dark:bg-gray-800">🪴 Terra & Substratos</option>
          <option value="Vasos & Recipientes" className="bg-white dark:bg-gray-800">🏺 Vasos & Recipientes</option>
          <option value="Ferramentas" className="bg-white dark:bg-gray-800">🔧 Ferramentas</option>
          <option value="Equipamentos" className="bg-white dark:bg-gray-800">⚙️ Equipamentos</option>
          <option value="Insumos" className="bg-white dark:bg-gray-800">📦 Insumos</option>
          <option value="EPI" className="bg-white dark:bg-gray-800">🦺 EPI</option>
        </select>
        <button
          onClick={handleSubmit}
          disabled={
            !novoItem.nome || 
            !novoItem.quantidade || 
            !novoItem.categoria ||
            (isAdmin && (!empresaSelecionada || !setorSelecionado))
          }
          className="bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white rounded-full px-4 py-2 flex items-center justify-center gap-2 hover:bg-blue-600 dark:hover:bg-[#1a8cd8] transition-colors disabled:bg-[#38444D] disabled:text-gray-500 dark:text-gray-400 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Adicionar Item
        </button>
      </div>

      {/* Animação de Adicionar Item */}
      {showAdicionarAnimation && dadosAnimacao && (
        <AdicionarItemAnimation
          item={dadosAnimacao.item}
          empresa={dadosAnimacao.empresa}
          setor={dadosAnimacao.setor}
          destino={dadosAnimacao.destino}
          onComplete={finalizarAdicaoItem}
        />
      )}
    </div>
  );
};

export default NovoItem;


