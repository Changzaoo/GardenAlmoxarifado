import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from './ThemeProvider';
import { useIsMobile } from '../hooks/useIsMobile';
import useVersionCheck from '../hooks/useVersionCheck';
import { darkModeClasses } from '../styles/darkMode';
import NewVersionModal from './NewVersionModal';
import { NIVEIS_PERMISSAO, PermissionChecker } from '../constants/permissoes';
import { inventarioInicial } from '../data/inventarioInicial';
import PermissionDenied from './common/PermissionDenied';
import {
  Menu as MenuIcon,
  Package,
  Users,
  ClipboardList,
  AlertTriangle,
  Search,
  BarChart3,
  Settings,
  Shield,
  AlertCircle,
  X,
  ShoppingCart,
  Sun,
  Moon
} from 'lucide-react';

// Componentes de abas
import Dashboard from './Dashboard/Dashboard';
import InventarioTab from './Inventario/InventarioTab';
import MeuInventarioTab from './Inventario/MeuInventarioTab';
import EmprestimosTab from './Emprestimos/EmprestimosTab';
import FuncionariosTab from './Funcionarios/FuncionariosTab';
import UsuariosTab from './usuarios/UsuariosTab';
import FerramentasDanificadasTab from './Danificadas/FerramentasDanificadasTab';
import TarefasTab from './Tarefas/TarefasTab';
import SuporteTab from './Suporte/SuporteTab';
import FerramentasPerdidasTab from './Perdidas/FerramentasPerdidasTab';
import HistoricoEmprestimosTab from './Emprestimos/HistoricoEmprestimosTab';
import ComprasTab from './Compras/ComprasTab';
import HistoricoTransferenciasTab from './Transferencias/HistoricoTransferenciasTab';

const AlmoxarifadoSistema = () => {
  const { usuario = null, logout = () => {}, firebaseStatus = {} } = useAuth() || {};
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const { newVersion, showModal, handleUpdate, handleClose } = useVersionCheck();
  
  // Estados locais
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFullscreenMessage, setShowFullscreenMessage] = useState(true);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Efeito para tela cheia em dispositivos móveis
  useEffect(() => {
    if (isMobile) {
      const requestFullscreen = async () => {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          } else if (document.documentElement.webkitRequestFullscreen) {
            await document.documentElement.webkitRequestFullscreen();
          }
        } catch (err) {
          console.error('Erro ao entrar em tela cheia:', err);
        }
      };
      requestFullscreen();
      
      // Esconder a mensagem após 5 segundos
      const timer = setTimeout(() => {
        setShowFullscreenMessage(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  // Define a aba inicial baseada no nível do usuário
  useEffect(() => {
    if (usuario?.nivel === NIVEIS_PERMISSAO.FUNCIONARIO) {
      setAbaAtiva('meu-inventario');
    } else {
      setAbaAtiva('dashboard');
    }
  }, [usuario?.nivel]);

  // ===== INVENTÁRIO =====
  const [inventario, setInventario] = useState([]);
  const [emprestimos, setEmprestimos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [ferramentasDanificadas, setFerramentasDanificadas] = useState([]);
  const [ferramentasPerdidas, setFerramentasPerdidas] = useState([]);
  const [compras, setCompras] = useState([]);
  
  useEffect(() => {
    if (!usuario) return;
    
    const unsubscribe = onSnapshot(collection(db, 'inventario'), async (snapshot) => {
      const itens = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInventario(itens);
      
      // Se inventário está vazio, popula com inventarioInicial
      if (itens.length === 0 && PermissionChecker.canManageOperational(usuario?.nivel)) {
        console.log('Populando inventário inicial...');
        for (const item of inventarioInicial) {
          const { id, ...rest } = item;
          await addDoc(collection(db, 'inventario'), rest);
        }
      }
    }, (error) => {
      console.error('Erro no listener do inventário:', error);
    });
    
    return () => unsubscribe();
  }, [usuario]);

  // Função para lidar com operações do inventário
  const adicionarItem = async (item) => {
    if (!PermissionChecker.canManageOperational(usuario?.nivel)) {
      throw new Error('Sem permissão para adicionar itens');
    }
    try {
      const itemCorrigido = {
        ...item,
        quantidade: Number(item.quantidade),
        disponivel: Number(item.quantidade)
      };
      return await addDoc(collection(db, 'inventario'), itemCorrigido);
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      throw error;
    }
  };

  const removerItem = async (id) => {
    if (!PermissionChecker.canManageOperational(usuario?.nivel)) {
      throw new Error('Sem permissão para remover itens');
    }
    try {
      return await deleteDoc(doc(db, 'inventario', id));
    } catch (error) {
      console.error('Erro ao remover item:', error);
      throw error;
    }
  };

  const atualizarItem = async (id, dados) => {
    if (!PermissionChecker.canManageOperational(usuario?.nivel)) {
      throw new Error('Sem permissão para atualizar itens');
    }
    try {
      return await updateDoc(doc(db, 'inventario', id), dados);
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {isMobile && showFullscreenMessage && (
        <div className={`fixed inset-x-0 top-0 z-50 p-4 transform translate-y-0 transition-transform duration-500 ${
          theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-green-50 text-green-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <p className="text-sm font-medium">
                O app funciona melhor em tela cheia no celular
              </p>
            </div>
            <button
              onClick={() => setShowFullscreenMessage(false)}
              className="p-1 hover:opacity-75"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {/* Menu lateral */}
      <nav className={`
        fixed inset-y-0 left-0 transform ${darkModeClasses.card} w-64 transition duration-200 ease-in-out z-30
        ${menuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${!isMobile ? 'translate-x-0 shadow-none' : 'shadow-lg'}
      `}>
        <div className="h-full overflow-y-auto">
          <div className="px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="w-8 h-8 text-green-600" />
                <span className="ml-3 text-lg font-medium">Almoxarifado</span>
              </div>
              {isMobile && (
                <button onClick={toggleMenu} className="text-gray-500 hover:text-gray-700 focus:outline-none">
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>

          <nav className="mt-5 px-2">
            {/* Menu items aqui */}
          </nav>
        </div>
      </nav>

      {/* Conteúdo principal */}
      <main className={`flex-1 transition-all duration-200 ${!isMobile ? 'ml-64' : ''}`}>
        {/* Header */}
        <header className={`${darkModeClasses.card} shadow-sm`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {isMobile && (
                <button onClick={toggleMenu} className="text-gray-500 hover:text-gray-700">
                  <MenuIcon className="w-6 h-6" />
                </button>
              )}
              <div className="flex items-center">
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-lg ${darkModeClasses.buttonSecondary}`}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo da aba */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className={`${darkModeClasses.card} ${darkModeClasses.cardContent}`}>
            {abaAtiva === 'dashboard' && usuario?.nivel > NIVEIS_PERMISSAO.FUNCIONARIO && (
              <Dashboard stats={{
                emprestimosAtivos: emprestimos?.length || 0,
                itensDisponiveis: inventario?.filter(i => i.disponivel > 0)?.length || 0,
                itensEmUso: inventario?.filter(i => i.quantidade > i.disponivel)?.length || 0,
                totalItens: inventario?.length || 0
              }} />
            )}

            {abaAtiva === 'inventario' && (
              <InventarioTab
                inventario={inventario}
                emprestimos={emprestimos}
                adicionarItem={adicionarItem}
                removerItem={removerItem}
              />
            )}

            {abaAtiva === 'emprestimos' && (
              <EmprestimosTab />
            )}

            {abaAtiva === 'funcionarios' && (
              PermissionChecker.canManageEmployees(usuario?.nivel) ? (
                <FuncionariosTab />
              ) : (
                <PermissionDenied message="Você não tem permissão para gerenciar funcionários." />
              )
            )}

            {abaAtiva === 'usuarios' && (
              PermissionChecker.canManageUsers(usuario?.nivel) ? (
                <UsuariosTab />
              ) : (
                <PermissionDenied message="Você não tem permissão para gerenciar usuários do sistema." />
              )
            )}

            {abaAtiva === 'historico-emprestimos' && (
              <HistoricoEmprestimosTab />
            )}

            {/* Demais abas aqui */}
          </div>
        </div>
      </main>

      {/* Modal de Nova Versão */}
      {showModal && (
        <NewVersionModal
          version={newVersion}
          onUpdate={handleUpdate}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

export default AlmoxarifadoSistema;
