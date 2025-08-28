import React, { useState, useEffect, createContext, useContext } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, getDocs } from 'firebase/firestore';
import { ToastProvider } from './ToastProvider';
import VerificacaoMensalTab from './Inventario/VerificacaoMensalTab';
import { db } from '../firebaseConfig';
import { FuncionariosProvider } from './Funcionarios/FuncionariosProvider';
import { useTheme } from './ThemeProvider';
import SupportTab from './Support/SupportTab';
import UserProfileModal from './Auth/UserProfileModal';
import { TarefasProvider } from './Tarefas/TarefasProvider';
import PWAUpdateAvailable from './PWAUpdateAvailable';
import { useNotifications } from '../hooks/useNotifications';
import { useIsMobile } from '../hooks/useIsMobile';
import { Menu as MenuIcon, X } from 'lucide-react';
import InventarioTab from './Inventario/InventarioTab';
import MeuInventarioTab from './Inventario/MeuInventarioTab';
import { inventarioInicial } from '../data/inventarioInicial';
import EmprestimosTab from './Emprestimos/EmprestimosTab';
import FuncionariosTab from './Funcionarios/FuncionariosTab';
import UsuariosTab from './usuarios/UsuariosTab';
import FerramentasDanificadasTab from './Danificadas/FerramentasDanificadasTab';
import TarefasTab from './Tarefas/TarefasTab';
import FerramentasPerdidasTab from './Perdidas/FerramentasPerdidasTab';
import HistoricoEmprestimosTab from './Emprestimos/HistoricoEmprestimosTab';
import { MessageCircle } from 'lucide-react';
import ComprasTab from './Compras/ComprasTab';
import HistoricoTransferenciasTab from './Transferencias/HistoricoTransferenciasTab';
import { AuthContext, useAuth } from '../hooks/useAuth';
// Icons
import { 
  Sprout, 
  Users, 
  ClipboardList,
  ClipboardCheck,
  AlertTriangle,
  Calendar,
  Search,
  BarChart3,
  Settings,
  Lock,
  Shield,
  User,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  UserCog,
  History,
  ArrowRight,
  ShoppingCart,
  ToolCase,
  Sun,
  Moon,
  Camera,
  Upload
} from 'lucide-react';

// ===== SISTEMA DE COOKIES =====
const CookieManager = {
  // Função para definir cookie
  setCookie: (name, value, days = 30) => {
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      const expiresString = expires.toUTCString();
      
      // Converter objeto para string se necessário
      const cookieValue = typeof value === 'object' ? JSON.stringify(value) : value;
      
      // Criar cookie com configurações de segurança
      document.cookie = `${name}=${encodeURIComponent(cookieValue)};expires=${expiresString};path=/;SameSite=Strict`;
      
      console.log(`Cookie ${name} definido com sucesso`);
      return true;
    } catch (error) {
      console.error('Erro ao definir cookie:', error);
      return false;
    }
  },

  // Função para obter cookie
  getCookie: (name) => {
    try {
      const nameEQ = name + "=";
      const cookies = document.cookie.split(';');
      
      for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
          cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf(nameEQ) === 0) {
          const value = decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
          
          // Tentar parsear como JSON, senão retornar como string
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter cookie:', error);
      return null;
    }
  },

  // Função para remover cookie
  removeCookie: (name) => {
    try {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;SameSite=Strict`;
      console.log(`Cookie ${name} removido com sucesso`);
      return true;
    } catch (error) {
      console.error('Erro ao remover cookie:', error);
      return false;
    }
  },

  // Função para verificar se cookies estão disponíveis
  areCookiesEnabled: () => {
    try {
      const testCookie = 'almoxarifado_test';
      CookieManager.setCookie(testCookie, 'test', 1);
      const isEnabled = CookieManager.getCookie(testCookie) === 'test';
      CookieManager.removeCookie(testCookie);
      return isEnabled;
    } catch {
      return false;
    }
  }
};

// Níveis de permissão
export const NIVEIS_PERMISSAO = {
  FUNCIONARIO: 1,      // Apenas visualizar
  SUPERVISOR: 2,       // Criar funcionários + todas as funções operacionais
  GERENTE: 3,          // Criar funcionários + usuários supervisor/funcionário
  ADMIN: 4             // Todas as permissões
};

export const NIVEIS_LABELS = {
  1: 'Funcionário',
  2: 'Supervisor/Encarregado', 
  3: 'Gerente',
  4: 'Administrador'
};

// Sistema de permissões
export const PermissionChecker = {
  // Verificar se pode visualizar
  canView: (userLevel, section) => {
    return userLevel >= NIVEIS_PERMISSAO.FUNCIONARIO;
  },

  // Verificar se pode criar/editar/deletar dados operacionais (inventário, empréstimos, etc.)
  canManageOperational: (userLevel) => {
    // Funcionário (nivel 1) não pode editar nada
    return userLevel > NIVEIS_PERMISSAO.FUNCIONARIO;
  },

  // Verificar se pode gerenciar funcionários (para empréstimos)
  canManageEmployees: (userLevel) => {
    // Funcionário (nivel 1) não pode editar nada
    return userLevel > NIVEIS_PERMISSAO.FUNCIONARIO;
  },

  // Verificar se pode gerenciar usuários do sistema
  canManageUsers: (userLevel) => {
    // Funcionário (nivel 1) não pode editar nada
    return userLevel > NIVEIS_PERMISSAO.FUNCIONARIO && userLevel >= NIVEIS_PERMISSAO.GERENTE;
  },

  // Verificar se pode criar usuários de nível específico
  canCreateUserLevel: (userLevel, targetLevel) => {
    if (userLevel === NIVEIS_PERMISSAO.FUNCIONARIO) return false;
    if (userLevel === NIVEIS_PERMISSAO.ADMIN) return true;
    if (userLevel === NIVEIS_PERMISSAO.GERENTE) {
      return targetLevel <= NIVEIS_PERMISSAO.SUPERVISOR;
    }
    return false;
  },

  // Verificar se pode editar usuário específico
  canEditUser: (userLevel, userId, targetUserId, targetUserLevel) => {
    if (userLevel === NIVEIS_PERMISSAO.FUNCIONARIO) return false;
    if (userId === targetUserId) return true; // Próprio perfil
    if (userLevel === NIVEIS_PERMISSAO.ADMIN) return true;
    if (userLevel === NIVEIS_PERMISSAO.GERENTE) {
      return targetUserLevel < NIVEIS_PERMISSAO.GERENTE;
    }
    return false;
  },

  // Verificar se pode gerenciar compras
  canManagePurchases: (userLevel) => {
    // Funcionário (nivel 1) não pode editar nada
    return userLevel > NIVEIS_PERMISSAO.FUNCIONARIO;
  }
};

// Provider de autenticação melhorado
const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseStatus, setFirebaseStatus] = useState('connecting');
  const [cookiesEnabled, setCookiesEnabled] = useState(true);

  // Nomes dos cookies
  const COOKIE_NAMES = {
    USUARIO: 'almoxarifado_usuario',
    LEMBRAR: 'almoxarifado_lembrar',
    EXPIRACAO: 'almoxarifado_expira'
  };

  // Inicialização do sistema com Firebase
  useEffect(() => {
    const initFirebaseSystem = async () => {
      try {
        setFirebaseStatus('connecting');
        
        // Verificar se cookies estão habilitados
        const cookiesOK = CookieManager.areCookiesEnabled();
        setCookiesEnabled(cookiesOK);
        console.log('Cookies habilitados:', cookiesOK);
        
        // Verificar se existe usuário salvo nos cookies
        await verificarUsuarioSalvo();
        
        // Carregar usuários do Firebase
        await carregarUsuarios();
        
        setFirebaseStatus('connected');
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao conectar com Firebase:', error);
        setFirebaseStatus('error');
        
        // Ainda assim tentar verificar usuário salvo
        await verificarUsuarioSalvo();
        
        // Fallback para usuários em memória se Firebase falhar
        await initUsuariosLocais();
        setIsLoading(false);
      }
    };

    initFirebaseSystem();
  }, []);

  // Listener em tempo real para usuários no Firebase
  useEffect(() => {
    let unsubscribe = null;
    
    const setupFirebaseListener = () => {
      try {
        unsubscribe = onSnapshot(collection(db, 'usuarios'), async (snapshot) => {
          const usuariosCarregados = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          }));
          
          setUsuarios(usuariosCarregados);
          
          // Se não houver usuários, criar usuário admin padrão
          if (usuariosCarregados.length === 0) {
            await criarUsuarioAdmin();
          }
        }, (error) => {
          console.error('Erro no listener de usuários:', error);
          setFirebaseStatus('error');
        });
      } catch (error) {
        console.error('Erro ao configurar listener:', error);
        setFirebaseStatus('error');
      }
    };

    if (firebaseStatus === 'connected') {
      setupFirebaseListener();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [firebaseStatus]);

  // Função para verificar usuário salvo nos cookies
  const verificarUsuarioSalvo = async () => {
    try {
      if (!cookiesEnabled && !CookieManager.areCookiesEnabled()) {
        console.log('Cookies não habilitados, não é possível verificar usuário salvo');
        return;
      }

      const usuarioSalvo = CookieManager.getCookie(COOKIE_NAMES.USUARIO);
      const lembrarLogin = CookieManager.getCookie(COOKIE_NAMES.LEMBRAR);
      const dataExpiracao = CookieManager.getCookie(COOKIE_NAMES.EXPIRACAO);
      
      console.log('Verificando cookies:', { 
        usuario: !!usuarioSalvo, 
        lembrar: lembrarLogin, 
        expira: dataExpiracao 
      });
      
      if (usuarioSalvo) {
        // Verificar se não expirou
        if (dataExpiracao && new Date() > new Date(dataExpiracao)) {
          console.log('Login expirado, limpando cookies');
          limparDadosLogin();
          return;
        }
        // Validar estrutura dos dados do usuário
        if (usuarioSalvo && typeof usuarioSalvo === 'object' && usuarioSalvo.id && usuarioSalvo.email) {
          setUsuario(usuarioSalvo);
          console.log('✅ Usuário restaurado dos cookies:', usuarioSalvo.nome);
        } else {
          console.log('❌ Dados do usuário nos cookies inválidos, limpando');
          limparDadosLogin();
        }
      } else {
        console.log('Nenhum usuário salvo encontrado nos cookies');
      }
    } catch (error) {
      console.error('Erro ao verificar usuário salvo nos cookies:', error);
      limparDadosLogin();
    }
  };

  // Função para limpar dados de login salvos
  const limparDadosLogin = () => {
    try {
      CookieManager.removeCookie(COOKIE_NAMES.USUARIO);
      CookieManager.removeCookie(COOKIE_NAMES.LEMBRAR);
      CookieManager.removeCookie(COOKIE_NAMES.EXPIRACAO);
      console.log('✅ Dados de login removidos dos cookies');
    } catch (error) {
      console.error('Erro ao limpar dados de login:', error);
    }
  };

  // Função para salvar dados de login
  const salvarDadosLogin = (usuarioData, lembrarLogin) => {
    try {
      if (!cookiesEnabled) {
        console.warn('Cookies não habilitados, não é possível salvar login');
        return false;
      }

      if (lembrarLogin) {
        // Salvar dados do usuário (sem senha por segurança)
        const dadosParaSalvar = {
          id: usuarioData.id,
          nome: usuarioData.nome,
          email: usuarioData.email,
          nivel: usuarioData.nivel,
          ativo: usuarioData.ativo,
          ultimoLogin: usuarioData.ultimoLogin,
          dataCriacao: usuarioData.dataCriacao
        };

        const sucessoUsuario = CookieManager.setCookie(COOKIE_NAMES.USUARIO, dadosParaSalvar, 30);
        const sucessoLembrar = CookieManager.setCookie(COOKIE_NAMES.LEMBRAR, 'true', 30);
        
        // Definir expiração para 30 dias
        const dataExpiracao = new Date();
        dataExpiracao.setDate(dataExpiracao.getDate() + 30);
        const sucessoExpiracao = CookieManager.setCookie(COOKIE_NAMES.EXPIRACAO, dataExpiracao.toISOString(), 30);
        
        if (sucessoUsuario && sucessoLembrar && sucessoExpiracao) {
          console.log('✅ Dados de login salvos nos cookies com sucesso');
          return true;
        } else {
          console.error('❌ Falha ao salvar alguns dados nos cookies');
          limparDadosLogin();
          return false;
        }
      } else {
        limparDadosLogin();
        return true;
      }
    } catch (error) {
      console.error('Erro ao salvar dados de login:', error);
      return false;
    }
  };

  const carregarUsuarios = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'usuarios'));
      const usuariosCarregados = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      setUsuarios(usuariosCarregados);
      
      // Se não houver usuários, criar usuário admin padrão
      if (usuariosCarregados.length === 0) {
        await criarUsuarioAdmin();
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      throw error;
    }
  };

  const criarUsuarioAdmin = async () => {
    const adminPadrao = {
      nome: 'Administrador',
      email: 'admin',
      senha: 'admin@362*',
      nivel: NIVEIS_PERMISSAO.ADMIN,
      ativo: true,
      dataCriacao: new Date().toISOString(),
      ultimoLogin: null
    };

    try {
      await addDoc(collection(db, 'usuarios'), adminPadrao);
      console.log('Usuário admin criado no Firebase');
    } catch (error) {
      console.error('Erro ao criar usuário admin:', error);
    }
  };

  const initUsuariosLocais = async () => {
    const usuariosLocais = [
      {
        id: '1',
        nome: 'Administrador',
        email: 'admin',
        senha: 'admin@362*',
        nivel: NIVEIS_PERMISSAO.ADMIN,
        ativo: true,
        dataCriacao: new Date().toISOString(),
        ultimoLogin: null
      },
      {
        id: '2',
        nome: 'João Silva',
        email: 'joao',
        senha: '123456',
        nivel: NIVEIS_PERMISSAO.GERENTE,
        ativo: true,
        dataCriacao: new Date().toISOString(),
        ultimoLogin: null
      },
      {
        id: '3',
        nome: 'Maria Santos',
        email: 'maria',
        senha: '123456',
        nivel: NIVEIS_PERMISSAO.SUPERVISOR,
        ativo: true,
        dataCriacao: new Date().toISOString(),
        ultimoLogin: null
      },
      {
        id: '4',
        nome: 'Pedro Lima',
        email: 'pedro',
        senha: '123456',
        nivel: NIVEIS_PERMISSAO.FUNCIONARIO,
        ativo: true,
        dataCriacao: new Date().toISOString(),
        ultimoLogin: null
      }
    ];
    
    setUsuarios(usuariosLocais);
    console.log('Usuários locais carregados como fallback');
  };

  const login = async (email, senha, lembrarLogin = false) => {
    try {
      const usuarioEncontrado = usuarios.find(u => 
        u.email === email && u.senha === senha && u.ativo
      );

      if (usuarioEncontrado) {
        const usuarioAtualizado = {
          ...usuarioEncontrado,
          ultimoLogin: new Date().toISOString()
        };
        // Atualizar no Firebase
        try {
          await updateDoc(doc(db, 'usuarios', usuarioEncontrado.id), {
            ultimoLogin: usuarioAtualizado.ultimoLogin
          });
        } catch (firebaseError) {
          console.warn('Erro ao atualizar último login no Firebase:', firebaseError);
        }
  // Sempre salvar dados de login para persistência em localhost
  salvarDadosLogin(usuarioAtualizado, true);
        setUsuario(usuarioAtualizado);
        return { success: true };
      }

      return { success: false, message: 'Email ou senha incorretos' };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, message: 'Erro interno do sistema' };
    }
  };

  const logout = () => {
    limparDadosLogin();
    setUsuario(null);
  };

  const criarUsuario = async (dadosUsuario) => {
    try {
      // Verificar permissão para criar usuário
      if (!PermissionChecker.canCreateUserLevel(usuario.nivel, dadosUsuario.nivel)) {
        return { success: false, message: 'Sem permissão para criar usuário deste nível' };
      }

      const novoUsuario = {
        ...dadosUsuario,
        ativo: true,
        dataCriacao: new Date().toISOString(),
        ultimoLogin: null
      };

      // Tentar salvar no Firebase
      const docRef = await addDoc(collection(db, 'usuarios'), novoUsuario);
      const usuarioComId = { id: docRef.id, ...novoUsuario };
      
      return { success: true, usuario: usuarioComId };
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return { success: false, message: 'Erro ao criar usuário' };
    }
  };

  const atualizarUsuario = async (id, dadosAtualizados) => {
    try {
      // Verificar permissão para editar usuário
      const usuarioAlvo = usuarios.find(u => u.id === id);
      if (!PermissionChecker.canEditUser(usuario.nivel, usuario.id, id, usuarioAlvo?.nivel)) {
        return { success: false, message: 'Sem permissão para editar este usuário' };
      }

      await updateDoc(doc(db, 'usuarios', id), dadosAtualizados);
      
      if (usuario && usuario.id === id) {
        const usuarioAtualizado = { ...usuario, ...dadosAtualizados };
        setUsuario(usuarioAtualizado);
        
        // Atualizar cookies se necessário
        if (CookieManager.getCookie(COOKIE_NAMES.LEMBRAR) === 'true') {
          salvarDadosLogin(usuarioAtualizado, true);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return { success: false, message: 'Erro ao atualizar usuário' };
    }
  };

  const removerUsuario = async (id) => {
    // Não permitir remoção do admin principal
    const usuarioAlvo = usuarios.find(u => u.id === id);
    if (usuarioAlvo?.email === 'admin') {
      return { success: false, message: 'Não é possível remover o administrador principal' };
    }

    // Verificar permissão
    if (!PermissionChecker.canEditUser(usuario.nivel, usuario.id, id, usuarioAlvo?.nivel)) {
      return { success: false, message: 'Sem permissão para remover este usuário' };
    }

    try {
      await deleteDoc(doc(db, 'usuarios', id));
      return { success: true };
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      return { success: false, message: 'Erro ao remover usuário' };
    }
  };

  const temPermissao = (nivelNecessario) => {
    return usuario && usuario.nivel >= nivelNecessario;
  };

  const value = {
    usuario,
    usuarios,
    isLoading,
    firebaseStatus,
    cookiesEnabled,
    login,
    logout,
    criarUsuario,
    atualizarUsuario,
    removerUsuario,
    temPermissao,
    NIVEIS_PERMISSAO
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Componente de Status do Firebase


// Componente de Login
const LoginForm = () => {
  const [formData, setFormData] = useState({ email: '', senha: '', lembrar: false });
  const [erro, setErro] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  // Removido: agora o campo está em formData
  const { login, cookiesEnabled } = useAuth();

  // Verificar suporte a cookies ao carregar componente
  useEffect(() => {
    if (!cookiesEnabled) {
      console.warn('Cookies não habilitados - função "Lembrar de mim" não funcionará');
    }
  }, [cookiesEnabled]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setErro('');
    setCarregando(true);

    if (!formData.email || !formData.senha) {
      setErro('Por favor, preencha todos os campos');
      setCarregando(false);
      return;
    }

    try {
      const resultado = await login(formData.email, formData.senha, formData.lembrar);
      if (!resultado.success) {
        setErro(resultado.message);
      } else {
        console.log('✅ Login realizado com sucesso');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setErro('Erro ao fazer login. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-700/20 p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-24 h-24 flex items-center justify-center mb-4">
            <img src="/logo.png" alt="Logo WorkFlow" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">WorkFlow</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Gerenciamento de Ferramentas</p>

        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Email/Usuário
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent"
                placeholder="Digite seu usuário"
                required
                disabled={carregando}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent"
                placeholder="Digite sua senha"
                required
                disabled={carregando}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                disabled={carregando}
              >
                {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>



          {!cookiesEnabled && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Cookies desabilitados. A função "Lembrar de mim" não funcionará.</span>
              </div>
            </div>
          )}

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className={`w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 ${
              carregando 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {carregando ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Entrando...
              </div>
            ) : (
              'Entrar no Sistema'
            )}
          </button>
        </form>
        {/* Footer or legal info only, no test users, cookies, or login tips */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Sistema protegido por autenticação</p>
        </div>
      </div>
    </div>
  );
};

// Dashboard simplificado
const Dashboard = ({ stats, firebaseStatus }) => {
  // ...existing code...
  // Recebe os dados via props do AlmoxarifadoSistema
  const { inventario, emprestimos, funcionarios, ferramentasDanificadas, ferramentasPerdidas, compras } = stats;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Sprout className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Inventário</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{inventario?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700/20">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded">
              <ClipboardList className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Empréstimos Ativos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{emprestimos?.filter(e => e.status !== 'devolvido').length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700/20">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded">
              <Users className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Funcionários</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{funcionarios?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700/20">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Danificadas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{ferramentasDanificadas?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700/20">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Perdidas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{ferramentasPerdidas?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700/20">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded">
              <ShoppingCart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Compras</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{compras?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Loading
const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ebf8ff] to-[#e6f7ff] dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto w-24 h-24 flex items-center justify-center mb-4">
          <img src="/logo.png" alt="Logo Garden Tools" className="w-full h-full object-contain animate-pulse" />
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="text-gray-600 dark:text-gray-300">Iniciando Garden Tools...</p>
        </div>
        <div className="w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Carregando sistema...</p>
      </div>
    </div>
  );
};

// Componente de Aviso de Permissão
const PermissionDenied = ({ message = "Você não tem permissão para realizar esta ação." }) => {
  return (
    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
      <div className="flex items-center justify-center mb-2">
        <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-1">Acesso Negado</h3>
      <p className="text-red-600 dark:text-red-400">{message}</p>
    </div>
  );
};

// Componente principal do sistema
const AlmoxarifadoSistema = () => {
  const { usuario, logout, firebaseStatus } = useAuth();
  const isMobile = useIsMobile();
  
  // Estados locais
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

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
  
  useEffect(() => {
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

  const adicionarItem = async (item) => {
    if (!PermissionChecker.canManageOperational(usuario?.nivel)) {
      throw new Error('Sem permissão para adicionar itens');
    }
    try {
      // Inicializa o campo 'disponivel' igual à quantidade
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

  // Função para reimportar inventário inicial
  const reimportarInventario = async () => {
    // Remove todos os itens atuais do Firestore
    const snapshot = await onSnapshot(collection(db, 'inventario'), async (snap) => {
      for (const docItem of snap.docs) {
        await deleteDoc(doc(db, 'inventario', docItem.id));
      }
      // Adiciona todos os itens do inventarioInicial
      for (const item of inventarioInicial) {
        const { id, ...rest } = item;
        await addDoc(collection(db, 'inventario'), rest);
      }
    });
    // Unsubscribe imediatamente após execução
    snapshot();
  };

  // Função para corrigir campo 'disponivel' no inventário do Firestore
  const corrigirInventario = async () => {
    const snapshot = await getDocs(collection(db, 'inventario'));
    for (const docItem of snapshot.docs) {
      const data = docItem.data();
      if (data.quantidade !== undefined) {
        await updateDoc(doc(db, 'inventario', docItem.id), {
          disponivel: data.quantidade
        });
      }
    }
    alert('Inventário corrigido: campo "disponivel" atualizado!');
  };

  // ===== EMPRÉSTIMOS =====
  const [emprestimos, setEmprestimos] = useState([]);
  const [emprestimosCarregados, setEmprestimosCarregados] = useState(false);
  
  useEffect(() => {
    setEmprestimosCarregados(false);
    let unsubscribe = () => {};

    const carregarEmprestimos = () => {
      try {
        unsubscribe = onSnapshot(collection(db, 'emprestimos'), (snapshot) => {
          try {
            const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log('Empréstimos carregados:', {
              quantidade: lista.length,
              primeiro: lista[0],
              ultimo: lista[lista.length - 1]
            });
            setEmprestimos(lista);
            setEmprestimosCarregados(true);
          } catch (error) {
            console.error('Erro ao processar dados dos empréstimos:', error);
            setEmprestimos([]);
            setEmprestimosCarregados(true);
          }
        }, (error) => {
          console.error('Erro no listener dos empréstimos:', error);
          setEmprestimos([]);
          setEmprestimosCarregados(true);
        });
      } catch (error) {
        console.error('Erro ao configurar listener dos empréstimos:', error);
        setEmprestimos([]);
        setEmprestimosCarregados(true);
      }
    };

    carregarEmprestimos();
    return () => unsubscribe();
  }, []);

  const adicionarEmprestimo = async (emprestimo) => {
    if (!PermissionChecker.canManageOperational(usuario?.nivel)) {
      throw new Error('Sem permissão para adicionar empréstimos');
    }
    try {
      // Adiciona o empréstimo com data formatada
      const emprestimoData = {
        ...emprestimo,
        dataEmprestimo: new Date().toISOString(),
        colaborador: emprestimo.nomeFuncionario,
        nomeFerramentas: emprestimo.ferramentas.map(f => f.nome)
      };
      const docRef = await addDoc(collection(db, 'emprestimos'), emprestimoData);

      // Atualiza o campo 'disponivel' do inventário para cada ferramenta emprestada
      if (emprestimo.ferramentas && Array.isArray(emprestimo.ferramentas)) {
        for (const nomeFerramenta of emprestimo.ferramentas) {
          const item = inventario.find(i => i.nome === nomeFerramenta);
          if (item && item.disponivel > 0) {
            await updateDoc(doc(db, 'inventario', item.id), {
              disponivel: item.disponivel - 1
            });
          }
        }
      }
      return docRef;
    } catch (error) {
      console.error('Erro ao adicionar empréstimo:', error);
      throw error;
    }
  };

  const removerEmprestimo = async (id) => {
    if (!PermissionChecker.canManageOperational(usuario?.nivel)) {
      throw new Error('Sem permissão para remover empréstimos');
    }
    try {
      return await deleteDoc(doc(db, 'emprestimos', id));
    } catch (error) {
      console.error('Erro ao remover empréstimo:', error);
      throw error;
    }
  };

  const atualizarEmprestimo = async (id, dados) => {
    if (!PermissionChecker.canManageOperational(usuario?.nivel)) {
      throw new Error('Sem permissão para atualizar empréstimos');
    }
    try {
      return await updateDoc(doc(db, 'emprestimos', id), dados);
    } catch (error) {
      console.error('Erro ao atualizar empréstimo:', error);
      throw error;
    }
  };

  // Função para marcar empréstimo como devolvido
  const devolverFerramentas = async (id, atualizarDisponibilidade, devolvidoPorTerceiros = false) => {
    try {
      // Atualiza status e data/hora de devolução
      await atualizarEmprestimo(id, {
        status: 'devolvido',
        dataDevolucao: new Date().toISOString(),
        devolvidoPorTerceiros
      });
      // Atualiza disponibilidade das ferramentas se necessário
      if (typeof atualizarDisponibilidade === 'function') {
        await atualizarDisponibilidade(id);
      }
    } catch (error) {
      console.error('Erro ao devolver ferramentas:', error);
      alert('Erro ao marcar como devolvido. Tente novamente.');
    }
  };

  // ===== FUNCIONÁRIOS =====
  const [funcionarios, setFuncionarios] = useState([]);
  
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'funcionarios'), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFuncionarios(lista);
    }, (error) => {
      console.error('Erro no listener dos funcionários:', error);
    });
    
    return () => unsubscribe();
  }, []);

  const adicionarFuncionario = async (funcionario) => {
    if (!PermissionChecker.canManageEmployees(usuario?.nivel)) {
      throw new Error('Sem permissão para adicionar funcionários');
    }
    try {
      // Adicionar o funcionário
      const funcionarioRef = await addDoc(collection(db, 'funcionarios'), funcionario);

      // Criar um usuário básico para o funcionário
      const novoUsuario = {
        nome: funcionario.nome,
        email: funcionario.nome.toLowerCase().replace(/\s+/g, '.'),
        senha: '1234',
        nivel: NIVEIS_PERMISSAO.FUNCIONARIO,
        ativo: true,
        dataCriacao: new Date().toISOString(),
        ultimoLogin: null,
        funcionarioId: funcionarioRef.id // Referência ao funcionário
      };

      await addDoc(collection(db, 'usuarios'), novoUsuario);
      return funcionarioRef;
    } catch (error) {
      console.error('Erro ao adicionar funcionário:', error);
      throw error;
    }
  };

  const removerFuncionario = async (id) => {
    if (!PermissionChecker.canManageEmployees(usuario?.nivel)) {
      throw new Error('Sem permissão para remover funcionários');
    }
    try {
      return await deleteDoc(doc(db, 'funcionarios', id));
    } catch (error) {
      console.error('Erro ao remover funcionário:', error);
      throw error;
    }
  };

  const atualizarFuncionario = async (id, dados) => {
    if (!PermissionChecker.canManageEmployees(usuario?.nivel)) {
      throw new Error('Sem permissão para atualizar funcionários');
    }
    try {
      return await updateDoc(doc(db, 'funcionarios', id), dados);
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      throw error;
    }
  };

  // ===== FERRAMENTAS DANIFICADAS =====
  const [ferramentasDanificadas, setFerramentasDanificadas] = useState([]);
  
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'ferramentas_danificadas'), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFerramentasDanificadas(lista);
    }, (error) => {
      console.error('Erro no listener das ferramentas danificadas:', error);
    });
    
    return () => unsubscribe();
  }, []);

  const adicionarFerramentaDanificada = async (item) => {
    if (!PermissionChecker.canManageOperational(usuario?.nivel)) {
      throw new Error('Sem permissão para adicionar ferramentas danificadas');
    }
    try {
      return await addDoc(collection(db, 'ferramentas_danificadas'), item);
    } catch (error) {
      console.error('Erro ao adicionar ferramenta danificada:', error);
      throw error;
    }
  };

  const removerFerramentaDanificada = async (id) => {
    if (!PermissionChecker.canManageOperational(usuario?.nivel)) {
      throw new Error('Sem permissão para remover ferramentas danificadas');
    }
    try {
      return await deleteDoc(doc(db, 'ferramentas_danificadas', id));
    } catch (error) {
      console.error('Erro ao remover ferramenta danificada:', error);
      throw error;
    }
  };

  const atualizarFerramentaDanificada = async (id, dados) => {
    if (!PermissionChecker.canManageOperational(usuario?.nivel)) {
      throw new Error('Sem permissão para atualizar ferramentas danificadas');
    }
    try {
      return await updateDoc(doc(db, 'ferramentas_danificadas', id), dados);
    } catch (error) {
      console.error('Erro ao atualizar ferramenta danificada:', error);
      throw error;
    }
  };

  // ===== FERRAMENTAS PERDIDAS =====
  const [ferramentasPerdidas, setFerramentasPerdidas] = useState([]);
  
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'ferramentas_perdidas'), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFerramentasPerdidas(lista);
    }, (error) => {
      console.error('Erro no listener das ferramentas perdidas:', error);
    });
    
    return () => unsubscribe();
  }, []);

  const adicionarFerramentaPerdida = async (item) => {
    if (!PermissionChecker.canManageOperational(usuario?.nivel)) {
      throw new Error('Sem permissão para adicionar ferramentas perdidas');
    }
    try {
      return await addDoc(collection(db, 'ferramentas_perdidas'), item);
    } catch (error) {
      console.error('Erro ao adicionar ferramenta perdida:', error);
      throw error;
    }
  };

  const removerFerramentaPerdida = async (id) => {
    if (!PermissionChecker.canManageOperational(usuario?.nivel)) {
      throw new Error('Sem permissão para remover ferramentas perdidas');
    }
    try {
      return await deleteDoc(doc(db, 'ferramentas_perdidas', id));
    } catch (error) {
      console.error('Erro ao remover ferramenta perdida:', error);
      throw error;
    }
  };

  const atualizarFerramentaPerdida = async (id, dados) => {
    if (!PermissionChecker.canManageOperational(usuario?.nivel)) {
      throw new Error('Sem permissão para atualizar ferramentas perdidas');
    }
    try {
      return await updateDoc(doc(db, 'ferramentas_perdidas', id), dados);
    } catch (error) {
      console.error('Erro ao atualizar ferramenta perdida:', error);
      throw error;
    }
  };

  // ===== COMPRAS =====
  const [compras, setCompras] = useState([]);
  
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'compras'), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCompras(lista);
    }, (error) => {
      console.error('Erro no listener das compras:', error);
    });
    
    return () => unsubscribe();
  }, []);

  const adicionarCompra = async (compra) => {
    if (!PermissionChecker.canManagePurchases(usuario?.nivel)) {
      throw new Error('Sem permissão para adicionar compras');
    }
    try {
      return await addDoc(collection(db, 'compras'), compra);
    } catch (error) {
      console.error('Erro ao adicionar compra:', error);
      throw error;
    }
  };

  const removerCompra = async (id) => {
    if (!PermissionChecker.canManagePurchases(usuario?.nivel)) {
      throw new Error('Sem permissão para remover compras');
    }
    try {
      return await deleteDoc(doc(db, 'compras', id));
    } catch (error) {
      console.error('Erro ao remover compra:', error);
      throw error;
    }
  };

  const atualizarCompra = async (id, dados) => {
    if (!PermissionChecker.canManagePurchases(usuario?.nivel)) {
      throw new Error('Sem permissão para atualizar compras');
    }
    try {
      return await updateDoc(doc(db, 'compras', id), dados);
    } catch (error) {
      console.error('Erro ao atualizar compra:', error);
      throw error;
    }
  };

  // Verificar se usuario existe antes de continuar
  if (!usuario) {
    return <LoadingScreen />;
  }

  // Estatísticas do sistema
  const stats = {
    inventario,
    emprestimos,
    funcionarios,
    ferramentasDanificadas,
    ferramentasPerdidas,
    compras
  };

  // Configuração das abas baseada em permissões
  const abas = [
    { 
      id: 'dashboard', 
      nome: 'Dashboard', 
      icone: BarChart3,
      permissao: () => usuario?.nivel > NIVEIS_PERMISSAO.FUNCIONARIO
    },
    {
      id: 'suporte',
      nome: 'Suporte',
      icone: HelpCircle,
      permissao: () => true // Visível para todos os níveis
    },
    { 
      id: 'meu-inventario', 
      nome: 'Meu Inventário', 
      icone: ToolCase,
      permissao: () => true // Visível para todos os níveis
    },
    { 
      id: 'tarefas', 
      nome: 'Tarefas', 
      icone: ClipboardCheck,
      permissao: () => true // Visível para todos os níveis
    },
    { 
      id: 'inventario', 
      nome: 'Inventário', 
      icone: Sprout,
      permissao: () => usuario?.nivel > NIVEIS_PERMISSAO.FUNCIONARIO
    },
    { 
      id: 'emprestimos', 
      nome: 'Empréstimos', 
      icone: ClipboardList,
      permissao: () => usuario?.nivel > NIVEIS_PERMISSAO.FUNCIONARIO
    },
    { 
      id: 'funcionarios', 
      nome: 'Funcionários', 
      icone: Users,
      permissao: () => usuario?.nivel > NIVEIS_PERMISSAO.FUNCIONARIO
    },
    { 
      id: 'compras', 
      nome: 'Compras', 
      icone: ShoppingCart,
      permissao: () => usuario?.nivel > NIVEIS_PERMISSAO.FUNCIONARIO
    },
    { 
      id: 'verificacao-mensal', 
      nome: 'Verificação Mensal', 
      icone: Calendar,
      permissao: () => usuario?.nivel > NIVEIS_PERMISSAO.FUNCIONARIO
    },
    { 
      id: 'danificadas', 
      nome: 'Ferramentas Danificadas', 
      icone: AlertTriangle,
      permissao: () => usuario?.nivel > NIVEIS_PERMISSAO.FUNCIONARIO
    },
    { 
      id: 'perdidas', 
      nome: 'Ferramentas Perdidas', 
      icone: AlertCircle,
      permissao: () => usuario?.nivel > NIVEIS_PERMISSAO.FUNCIONARIO
    },
    {
      id: 'historico-emprestimos',
      nome: 'Histórico de Empréstimos',
      icone: History,
      permissao: () => usuario?.nivel > NIVEIS_PERMISSAO.FUNCIONARIO
    },
    { 
      id: 'historico-transferencias', 
      nome: 'Histórico de Transferências', 
      icone: ArrowRight,
      permissao: () => usuario?.nivel >= NIVEIS_PERMISSAO.SUPERVISOR
    }
  ].filter(aba => aba.permissao());

  // Permissão para aba de usuários (ADMIN, SUPERVISOR, GERENTE)
  const podeVerUsuarios = [NIVEIS_PERMISSAO.ADMIN, NIVEIS_PERMISSAO.SUPERVISOR, NIVEIS_PERMISSAO.GERENTE].includes(usuario?.nivel);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header móvel */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-black border-b dark:border-[#2F3336] shadow-sm">
          <div className="flex items-center justify-between px-4 h-16">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {menuOpen ? (
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              ) : (
                <MenuIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            {/* Logo e título no header mobile quando menu fechado */}
            {!menuOpen && (
              <div className="flex items-center">
                <img src="/logo.png" alt="Logo WorkFlow" className="w-8 h-8 mr-2" />
                <h1 className="text-base font-bold text-gray-900 dark:text-white">WorkFlow</h1>
              </div>
            )}
            
            <div className="w-10"></div>
          </div>
        </header>
      )}

      {/* Menu lateral */}
      <nav className={`${
        isMobile 
          ? `fixed inset-0 z-40 transform transition-transform duration-300 ease-in-out ${
              menuOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : 'w-72 fixed'
      } bg-white dark:bg-black border-r dark:border-[#2F3336] min-h-screen`}>
        {!isMobile && (
          <div className="p-4 border-b dark:border-[#2F3336]">
            <div className="flex items-center">
              <img src="/logo.png" alt="Logo WorkFlow" className="w-12 h-12 mr-3" />
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">WorkFlow</h1>
                <p className="text-xs text-gray-500 dark:text-[#71767B]">Gerenciamento de Ferramentas</p>
              </div>
            </div>
          </div>
        )}

        {/* Versão Mobile do Header */}
        {isMobile && menuOpen && (
          <div className="pt-20 pb-4 px-4 border-b dark:border-[#2F3336]">
            <div className="flex items-center">
              <img src="/logo.png" alt="Logo WorkFlow" className="w-10 h-10 mr-2" />
              <div>
                <h1 className="text-base font-bold text-gray-900 dark:text-white">WorkFlow</h1>
                <p className="text-xs text-gray-500 dark:text-[#71767B]">Gerenciamento de Ferramentas</p>
              </div>
            </div>
          </div>
        )}

        <div className={`py-4 px-2 ${isMobile ? 'mt-2' : ''}`}>
          <div className="space-y-1">
            {abas.filter(aba => aba.permissao()).map((aba) => {
              const Icone = aba.icone;
              return (
                <button
                  key={aba.id}
                  onClick={() => {
                    setAbaAtiva(aba.id);
                    if (isMobile) {
                      setMenuOpen(false);
                    }
                  }}
                  className={`w-full flex items-center space-x-3 px-4 ${isMobile ? 'py-4' : 'py-3'} rounded-full font-medium text-base transition-all duration-200 ${
                    abaAtiva === aba.id
                      ? 'bg-[#1D9BF0] text-white'
                      : 'text-[#E7E9EA] hover:bg-[#1D9BF0]/10'
                  }`}
                >
                  <Icone className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0 ${
                    abaAtiva === aba.id 
                      ? 'text-white' 
                      : 'text-[#E7E9EA] group-hover:text-[#1D9BF0]'
                  }`} />
                  <span>{aba.nome}</span>
                </button>
              );
            })}

            {podeVerUsuarios && (
              <button
                onClick={() => {
                  setAbaAtiva('usuarios');
                  if (isMobile) {
                    setMenuOpen(false);
                  }
                }}
                className={`w-full flex items-center space-x-3 px-4 ${isMobile ? 'py-4' : 'py-3'} rounded-full font-medium text-base transition-all duration-200 ${
                  abaAtiva === 'usuarios'
                    ? 'bg-[#1D9BF0] text-white'
                    : 'text-[#E7E9EA] hover:bg-[#1D9BF0]/10'
                }`}
              >
                <UserCog className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0 ${
                  abaAtiva === 'usuarios' 
                    ? 'text-white' 
                    : 'text-gray-900 dark:text-[#E7E9EA] group-hover:text-[#1D9BF0]'
                }`} />
                <span>Usuários do Sistema</span>
              </button>
            )}
          </div>
        </div>

        <div className={`${isMobile ? 'fixed' : 'absolute'} bottom-0 left-0 right-0 p-4 border-t dark:border-[#2F3336] bg-white dark:bg-black`}>
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-[#16181C]">
              {usuario.photoURL ? (
                <img src={usuario.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-full h-full p-2 text-gray-600 dark:text-[#71767B]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`${isMobile ? 'text-base' : 'text-sm'} font-bold text-gray-900 dark:text-[#E7E9EA] truncate`}>{usuario.nome}</p>
              <p className="text-sm text-gray-500 dark:text-[#71767B] truncate">{NIVEIS_LABELS[usuario.nivel]}</p>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setShowProfileModal(true)}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-[#1D9BF0]/10 transition-colors"
                title="Editar perfil"
              >
                <Edit className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-gray-900 dark:text-[#E7E9EA]`} />
              </button>

            </div>
          </div>
          <button
            onClick={logout}
            className={`w-full flex items-center justify-center gap-2 px-4 ${
              isMobile ? 'py-3 text-base' : 'py-2.5 text-sm'
            } rounded-full font-medium transition-colors text-[#E7E9EA] hover:bg-red-500/10 hover:text-red-500`}
          >
            <Lock className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
            <span>Sair</span>
          </button>
        </div>
      </nav>

      {/* Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userId={usuario.id}
      />

      <main className={`${isMobile ? 'pt-16' : 'pl-64'} w-full min-h-screen bg-white dark:bg-black`}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="py-3">
            <div className="flex items-center justify-between sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md py-3 mb-4 border-b border-gray-100 dark:border-[#2F3336]">

            </div>
            
            {abaAtiva === 'dashboard' && <Dashboard stats={stats} />}
            
            {abaAtiva === 'verificacao-mensal' && <VerificacaoMensalTab />}

            {abaAtiva === 'suporte' && <SupportTab />}

            {abaAtiva === 'meu-inventario' && (
              <MeuInventarioTab
                emprestimos={emprestimosCarregados ? emprestimos : null}
              />
            )}

            {abaAtiva === 'tarefas' && (
              <FuncionariosProvider>
                <TarefasProvider>
                  <TarefasTab />
                </TarefasProvider>
              </FuncionariosProvider>
            )}

            {abaAtiva === 'inventario' && (
              <InventarioTab
                inventario={inventario}
                emprestimos={emprestimos}
                adicionarItem={adicionarItem}
                removerItem={removerItem}
                atualizarItem={atualizarItem}
                reimportarInventario={reimportarInventario}
                corrigirInventario={corrigirInventario}
              />
            )}
            
            {abaAtiva === 'emprestimos' && (
              PermissionChecker.canView(usuario?.nivel) ? (
                <EmprestimosTab
                  emprestimos={emprestimos}
                  inventario={inventario}
                  funcionarios={funcionarios}
                  adicionarEmprestimo={adicionarEmprestimo}
                  removerEmprestimo={removerEmprestimo}
                  atualizarEmprestimo={atualizarEmprestimo}
                  devolverFerramentas={devolverFerramentas}
                  readonly={!PermissionChecker.canManageOperational(usuario?.nivel)}
                />
              ) : (
                <PermissionDenied message="Você não tem permissão para visualizar os empréstimos." />
              )
            )}
            
            {abaAtiva === 'funcionarios' && (
              PermissionChecker.canView(usuario?.nivel) ? (
                <FuncionariosTab
                  funcionarios={funcionarios}
                  adicionarFuncionario={adicionarFuncionario}
                  removerFuncionario={removerFuncionario}
                  atualizarFuncionario={atualizarFuncionario}
                  readonly={!PermissionChecker.canManageEmployees(usuario?.nivel)}
                />
              ) : (
                <PermissionDenied message="Você não tem permissão para visualizar os funcionários." />
              )
            )}

            {abaAtiva === 'compras' && (
              PermissionChecker.canView(usuario?.nivel) ? (
                <ComprasTab
                  compras={compras}
                  inventario={inventario}
                  funcionarios={funcionarios}
                  adicionarCompra={adicionarCompra}
                  removerCompra={removerCompra}
                  atualizarCompra={atualizarCompra}
                  readonly={!PermissionChecker.canManagePurchases(usuario?.nivel)}
                />
              ) : (
                <PermissionDenied message="Você não tem permissão para visualizar as compras." />
              )
            )}
            
            {abaAtiva === 'danificadas' && (
              PermissionChecker.canView(usuario?.nivel) ? (
                <FerramentasDanificadasTab
                  ferramentasDanificadas={ferramentasDanificadas}
                  inventario={inventario}
                  adicionarFerramentaDanificada={adicionarFerramentaDanificada}
                  removerFerramentaDanificada={removerFerramentaDanificada}
                  atualizarFerramentaDanificada={atualizarFerramentaDanificada}
                />
              ) : (
                <PermissionDenied message="Você não tem permissão para visualizar as ferramentas danificadas." />
              )
            )}
            
            {abaAtiva === 'perdidas' && (
              PermissionChecker.canView(usuario?.nivel) ? (
                <FerramentasPerdidasTab
                  ferramentasPerdidas={ferramentasPerdidas}
                  inventario={inventario}
                  adicionarFerramentaPerdida={adicionarFerramentaPerdida}
                  removerFerramentaPerdida={removerFerramentaPerdida}
                  atualizarFerramentaPerdida={atualizarFerramentaPerdida}
                />
              ) : (
                <PermissionDenied message="Você não tem permissão para visualizar as ferramentas perdidas." />
              )
            )}

            {abaAtiva === 'historico-emprestimos' && (
              PermissionChecker.canView(usuario?.nivel) ? (
                <HistoricoEmprestimosTab
                  emprestimos={emprestimos}
                  funcionarios={funcionarios}
                  inventario={inventario}
                />
              ) : (
                <PermissionDenied message="Você não tem permissão para visualizar o histórico de empréstimos." />
              )
            )}

            {abaAtiva === 'usuarios' && (
              PermissionChecker.canManageUsers(usuario?.nivel) ? (
                <UsuariosTab />
              ) : (
                <PermissionDenied message="Você não tem permissão para gerenciar usuários do sistema." />
              )
            )}

            {abaAtiva === 'historico-transferencias' && (
              usuario?.nivel >= NIVEIS_PERMISSAO.SUPERVISOR ? (
                <HistoricoTransferenciasTab />
              ) : (
                <PermissionDenied message="Você não tem permissão para visualizar o histórico de transferências." />
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// Componente principal da aplicação
const App = () => {
  const { usuario, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return usuario ? <AlmoxarifadoSistema /> : <LoginForm />;
};

// Componente principal com Provider
const Seed = () => {
  // Inicializar hook de notificações
  useNotifications();
  
  return (
    <AuthProvider>
      <ToastProvider>
        <App />
        <PWAUpdateAvailable />
      </ToastProvider>
    </AuthProvider>
  );
};

// Export do hook useAuth e componente principal
export { useAuth };
export default Seed;