import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, getDocs, getDoc, query, where } from 'firebase/firestore';
import { useDevToolsProtection } from '../hooks/useDevToolsProtection';
import { ToastProvider } from './ToastProvider';
import LegalTab from './Legal/LegalTab';
import SupportTab from './Support/SupportTab';
import { Shield } from 'lucide-react';
import { db } from '../firebaseConfig';
import { backupDb } from '../config/firebaseDual'; // Import do Firebase Backup
import { dbWorkflowBR1 } from '../config/firebaseWorkflowBR1'; // Import do Firebase WorkflowBR1
import { FuncionariosProvider, useFuncionarios } from './Funcionarios/FuncionariosProvider';
import { useTheme } from './Theme/ThemeSystem';
import ThemeToggle from './Theme/ThemeToggle';
// ✅ Importar sistema de permissões CORRIGIDO
import { 
  NIVEIS_PERMISSAO, 
  NIVEIS_LABELS, 
  NIVEIS_ICONE,
  PermissionChecker,
  isAdmin,
  hasHighLevelPermission,
  hasManagementPermission,
  hasSupervisionPermission,
  isAdminTotal,
  temPermissaoUniversal
} from '../constants/permissoes';

import UserProfileModal from './Auth/UserProfileModal';
import PWAUpdateAvailable from './PWAUpdateAvailable';
import AppUpdateModal from './AppUpdateModal';
import { useIsMobile } from '../hooks/useIsMobile';
import { Menu as MenuIcon, X, Scale, BarChart3 } from 'lucide-react';
import RankingPontos from './Rankings/RankingPontos';
import GerenciamentoInventario from './Inventario/GerenciamentoInventario';
import { inventarioInicial } from '../data/inventarioInicial';
import GerenciamentoFuncionarios from './Funcionarios/GerenciamentoFuncionarios';
import UsuariosTab from './usuarios/UsuariosTab';
import DatabaseSyncManager from './Admin/DatabaseSyncManager';
import HistoricoEmprestimosTab from './Emprestimos/HistoricoEmprestimosTab';
import ComprovantesTab from './Comprovantes/ComprovantesTab';
import { MessageNotificationProvider } from './Chat/MessageNotificationContext';
import { NotificationProvider, useNotification } from './NotificationProvider';
import MensagensMain from './Mensagens/MensagensMain';
import { useMensagens } from '../hooks/useMensagens';
import HistoricoTransferenciasTab from './Transferencias/HistoricoTransferenciasTab';
import { AuthContext, useAuth } from '../hooks/useAuth';
import AnalyticsTab from './Analytics/AnalyticsTab';
import AnalyticsProvider from './Analytics/AnalyticsProvider';
import DashboardTab from './Dashboard/DashboardTab';
import ProfileTab from './Profile/ProfileTab';
import NotificationsPage from '../pages/NotificationsPage';
// ✅ Novos serviços de autenticação e senha
import { 
  authenticateUser, 
  saveUserSession, 
  clearUserSession, 
  getStoredSession 
} from '../services/authService';
import { 
  updateUserPassword, 
  createUserWithPassword 
} from '../services/passwordService';
import SystemAdminPage from '../pages/SystemAdminPage';
import { notifyNewLoan } from '../utils/notificationHelpers';
import CadastroEmpresas from './Empresas/CadastroEmpresas';
import CadastroSetores from './Setores/CadastroSetores';
import GerenciamentoIntegrado from './EmpresasSetores/GerenciamentoIntegrado';
import { encryptPassword, verifyPassword } from '../utils/crypto';
import LoadingScreen from './common/LoadingScreen';
import MessagesBadge from './MessagesBadge';
import { DatabaseRotationProvider } from '../contexts/DatabaseRotationContext';
import PasswordResetForm from './PasswordReset/PasswordResetForm';
import UserCreationForm from './PasswordReset/UserCreationForm';
import '../utils/passwordDebug'; // Carrega utilitário de debug de senhas
// Icons
import { 
  Package,
  Users, 
  ClipboardList,
  ClipboardCheck,
  AlertTriangle,
  Calendar,
  Search,
  Settings,
  Lock,
  User,
  UserCircle,
  Plus,
  Trophy,
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
  Upload,
  LogOut,
  MessageCircle,
  Bell,
  Building2,
  Briefcase,
  GripVertical,
  Check,
  CheckCircle,
  RefreshCw,
  Save,
  Database,
  Key,
  MousePointer,
  FileText
} from 'lucide-react';

// Função para bloquear teclas de atalho e menu de contexto
const useSecurityBlock = () => {
  const { usuario } = useAuth();
  const isAdmin = usuario?.nivel === 0; // Admin sempre tem nível 0

  const handleKeyDown = useCallback((e) => {
    // Se for admin, permite todas as teclas
    if (isAdmin) {
      console.log('Admin detected, allowing all keys');
      return true;
    }

    // Lista de teclas a serem bloqueadas
    const blockedKeys = [
      'F12', // DevTools
      'I',   // Ctrl+Shift+I (DevTools)
      'J',   // Ctrl+Shift+J (Console)
      'U',   // Ctrl+U (View Source)
      'S',   // Ctrl+S (Save)
      'P',   // Ctrl+P (Print)
    ];

    // Bloquear F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      return false;
    }

    // Bloquear combinações com Ctrl+Shift
    if (e.ctrlKey && e.shiftKey && blockedKeys.includes(e.key)) {
      e.preventDefault();
      return false;
    }

    // Bloquear Ctrl+U
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      return false;
    }
  }, [isAdmin]);

  const handleContextMenu = useCallback((e) => {
    // Se for admin, permite copiar o HTML do elemento
    if (isAdmin) {
      e.preventDefault(); // Previne o menu padrão mesmo para admin
      
      // Obtém o elemento clicado
      const elementoClicado = e.target;
      
      // Obtém o HTML do elemento
      const htmlDoElemento = elementoClicado.outerHTML;
      
      // Copia para a área de transferência
      navigator.clipboard.writeText(htmlDoElemento)
        .then(() => {
          // Feedback visual para o admin
          alert('HTML copiado para a área de transferência!');
          console.log('HTML copiado:', htmlDoElemento);
        })
        .catch(err => {
          console.error('Erro ao copiar HTML:', err);
          alert('Erro ao copiar HTML. Verifique o console.');
        });
      
      return false;
    }
    
    e.preventDefault();
    return false;
  }, [isAdmin]);

  useEffect(() => {
    console.log('Security block effect running, isAdmin:', isAdmin);
    
    if (!isAdmin) {
      // Adicionar listeners apenas se não for admin
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('contextmenu', handleContextMenu);

      // Detectar DevTools via debugger apenas para não-admins
      function detectDevTools() {
        const widthThreshold = window.outerWidth - window.innerWidth > 160;
        const heightThreshold = window.outerHeight - window.innerHeight > 160;
        
        if (widthThreshold || heightThreshold) {
          // DevTools está provavelmente aberto
          window.location.reload();
        }
      }

      const interval = setInterval(detectDevTools, 1000);

      // Cleanup
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('contextmenu', handleContextMenu);
        clearInterval(interval);
      };
    }
  }, [handleKeyDown, handleContextMenu, isAdmin]);
};

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

// ✅ NIVEIS_PERMISSAO, NIVEIS_LABELS, NIVEIS_ICONE e PermissionChecker 
// agora são importados de '../constants/permissoes' (SISTEMA CORRIGIDO)

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
        console.log('🔄 Configurando listener em tempo real para usuários no Firebase Backup...');
        unsubscribe = onSnapshot(
          collection(backupDb, 'usuarios'), 
          async (snapshot) => {
            console.log('📡 Atualização em tempo real de usuários recebida do Firebase Backup');
            
            const usuariosCarregados = snapshot.docs.map(doc => {
              const data = doc.data();
              return { 
                id: doc.id,
                nome: data.nome || '',
                email: data.email || '',
                senha: data.senha || null,
                senhaHash: data.senhaHash || null,
                senhaSalt: data.senhaSalt || null,
                senhaVersion: data.senhaVersion || null,
                senhaAlgorithm: data.senhaAlgorithm || null,
                nivel: data.nivel || NIVEIS_PERMISSAO.FUNCIONARIO,
                ativo: data.ativo !== false,
                empresaId: data.empresaId || null,
                setorId: data.setorId || null,
                cargoId: data.cargoId || null,
                dataCriacao: data.dataCriacao || new Date().toISOString(),
                ultimoLogin: data.ultimoLogin || null,
                preferencias: data.preferencias || {
                  tema: 'auto',
                  notificacoes: true,
                  idioma: 'pt-BR'
                },
                menuConfig: data.menuConfig || null,
                menuPersonalizado: data.menuPersonalizado || null,
                telefone: data.telefone || null,
                avatar: data.avatar || null,
                bio: data.bio || null
              };
            });
            
            console.log(`✅ ${usuariosCarregados.length} usuários sincronizados`);
            setUsuarios(usuariosCarregados);
            
            // Se o usuário logado foi atualizado, atualizar estado
            if (usuario) {
              const usuarioAtualizado = usuariosCarregados.find(u => u.id === usuario.id);
              if (usuarioAtualizado) {
                console.log('👤 Dados do usuário logado atualizados');
                
                // 🔐 PROTEÇÃO ESPECIAL: Se usuário atual é admin (nível 0), manter nível 0
                if (usuario.nivel === 0 && usuarioAtualizado.nivel !== 0) {
                  console.log('⚠️ BLOQUEANDO alteração de nível admin:', {
                    nivelAtual: usuario.nivel,
                    nivelNovo: usuarioAtualizado.nivel
                  });
                  usuarioAtualizado.nivel = 0; // Forçar manter nível admin
                }
                
                setUsuario(usuarioAtualizado);
              }
            }
            
            // Se não houver usuários, criar usuário admin padrão
            if (usuariosCarregados.length === 0) {
              console.log('⚠️ Nenhum usuário encontrado, criando admin...');
              await criarUsuarioAdmin();
            }
          }, 
          (error) => {
            console.error('❌ Erro no listener de usuários:', error);
            setFirebaseStatus('error');
          }
        );
        
        console.log('✅ Listener configurado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao configurar listener:', error);
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
          console.log('🔄 Usuário encontrado nos cookies, revalidando dados no Firebase...');
          
          // Revalidar dados no Firebase para garantir que estão atualizados
          try {
            const usuariosRef = collection(dbWorkflowBR1, 'usuarios');
            const q = query(usuariosRef, where('email', '==', usuarioSalvo.email), where('ativo', '==', true));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              const doc = querySnapshot.docs[0];
              const usuarioAtualizado = { id: doc.id, ...doc.data() };
              
              console.log('✅ Dados atualizados do Firebase:', {
                nome: usuarioAtualizado.nome,
                nivel: usuarioAtualizado.nivel,
                nivelTipo: typeof usuarioAtualizado.nivel,
                cookieNivel: usuarioSalvo.nivel,
                cookieNivelTipo: typeof usuarioSalvo.nivel,
                isAdmin: usuarioAtualizado.nivel === NIVEIS_PERMISSAO.ADMIN,
                NIVEIS_PERMISSAO_ADMIN: NIVEIS_PERMISSAO.ADMIN
              });
              
              // CORREÇÃO TEMPORÁRIA: Se é o usuário admin e tem nível incorreto, corrigir
              if (usuarioAtualizado.email === 'admin' && usuarioAtualizado.nivel !== NIVEIS_PERMISSAO.ADMIN) {
                console.log('🔧 CORRIGINDO: Admin tem nível incorreto, ajustando para 0...');
                usuarioAtualizado.nivel = NIVEIS_PERMISSAO.ADMIN;
                
                // Atualizar também no Firebase
                try {
                  await updateDoc(doc.ref, { nivel: NIVEIS_PERMISSAO.ADMIN });
                  console.log('✅ Nível do admin corrigido no Firebase');
                } catch (error) {
                  console.error('❌ Erro ao corrigir nível do admin no Firebase:', error);
                }
              }
              
              // 🔐 PROTEÇÃO ESPECIAL: Se usuário salvo é admin (nível 0), garantir que permanece admin
              if (usuarioSalvo?.nivel === 0 && usuarioAtualizado.nivel !== 0) {
                console.log('⚠️ PROTEÇÃO ADMIN: Impedindo alteração de nível admin:', {
                  nivelSalvo: usuarioSalvo.nivel,
                  nivelAtualizado: usuarioAtualizado.nivel
                });
                usuarioAtualizado.nivel = 0; // Forçar manter nível admin
              }
              
              // Usar dados atualizados do Firebase
              setUsuario(usuarioAtualizado);
              
              // Atualizar cookies com dados mais recentes
              if (lembrarLogin === 'true') {
                salvarDadosLogin(usuarioAtualizado, true);
              }
            } else {
              console.log('❌ Usuário não encontrado no Firebase, usando dados dos cookies');
              setUsuario(usuarioSalvo);
            }
          } catch (error) {
            console.error('Erro ao revalidar usuário no Firebase:', error);
            // Em caso de erro, usar dados dos cookies como fallback
            setUsuario(usuarioSalvo);
          }
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
      console.log('📥 Carregando usuários do Firebase Backup...');
      const snapshot = await getDocs(collection(backupDb, 'usuarios'));
      const usuariosCarregados = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id,
          nome: data.nome || '',
          email: data.email || '',
          senha: data.senha || null,
          senhaHash: data.senhaHash || null,
          senhaSalt: data.senhaSalt || null,
          senhaVersion: data.senhaVersion || null,
          senhaAlgorithm: data.senhaAlgorithm || null,
          nivel: data.nivel || NIVEIS_PERMISSAO.FUNCIONARIO,
          ativo: data.ativo !== false, // true por padrão
          empresaId: data.empresaId || null,
          setorId: data.setorId || null,
          cargoId: data.cargoId || null,
          dataCriacao: data.dataCriacao || new Date().toISOString(),
          ultimoLogin: data.ultimoLogin || null,
          // Preferências do usuário
          preferencias: data.preferencias || {
            tema: 'auto',
            notificacoes: true,
            idioma: 'pt-BR'
          },
          // Menu personalizado
          menuConfig: data.menuConfig || null,
          menuPersonalizado: data.menuPersonalizado || null,
          // Dados adicionais
          telefone: data.telefone || null,
          avatar: data.avatar || null,
          bio: data.bio || null
        };
      });
      
      console.log(`✅ ${usuariosCarregados.length} usuários carregados do Firebase`);
      console.log('Usuários:', usuariosCarregados.map(u => ({ 
        email: u.email, 
        nome: u.nome, 
        nivel: u.nivel,
        ativo: u.ativo,
        temSenha: !!u.senha,
        temSenhaHash: !!u.senhaHash
      })));
      
      setUsuarios(usuariosCarregados);
      
      // Se não houver usuários, criar usuário admin padrão
      if (usuariosCarregados.length === 0) {
        console.log('⚠️ Nenhum usuário encontrado, criando admin padrão...');
        await criarUsuarioAdmin();
      }
      
      return usuariosCarregados;
    } catch (error) {
      console.error('❌ Erro ao carregar usuários do Firebase:', error);
      throw error;
    }
  };

  const criarUsuarioAdmin = async () => {
    // Criptografar a senha antes de salvar
    const { hash, salt, version, algorithm } = encryptPassword('admin@362*');
    
    const adminPadrao = {
      nome: 'Administrador',
      email: 'admin',
      senhaHash: hash,
      senhaSalt: salt,
      senhaVersion: version,
      senhaAlgorithm: algorithm,
      nivel: NIVEIS_PERMISSAO.ADMIN,
      ativo: true,
      dataCriacao: new Date().toISOString(),
      ultimoLogin: null,
      // Preferências padrão
      preferencias: {
        tema: 'auto',
        notificacoes: true,
        idioma: 'pt-BR',
        sons: true,
        emailNotificacoes: false
      },
      // Menu padrão para admin (todos visíveis)
      menuConfig: null, // null = usa configuração padrão
      menuPersonalizado: false,
      // Dados opcionais
      empresaId: null,
      setorId: null,
      cargoId: null,
      telefone: null,
      avatar: null,
      bio: 'Administrador do sistema'
    };

    try {
      const docRef = await addDoc(collection(db, 'usuarios'), adminPadrao);
      console.log('✅ Usuário admin criado no Firebase com ID:', docRef.id);
      console.log('📧 Email: admin');
      console.log('🔑 Senha: admin@362*');
      
      // Recarregar usuários após criar admin
      await carregarUsuarios();
    } catch (error) {
      console.error('❌ Erro ao criar usuário admin:', error);
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
        nivel: NIVEIS_PERMISSAO.GERENTE_SETOR,
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
      // ✅ REFATORADO: Usar authService
      console.log('🔐 [AuthService] Iniciando autenticação:', { email, senhaLength: senha.length });
      
      const resultado = await authenticateUser(email, senha);
      
      if (!resultado.success) {
        console.log('❌ [AuthService] Autenticação falhou:', resultado.error);
        return { success: false, message: resultado.error };
      }
      
      console.log('✅ [AuthService] Autenticação bem-sucedida!');
      const usuarioAutenticado = resultado.user;
      
      // Salvar sessão
      saveUserSession(usuarioAutenticado, lembrarLogin);
      salvarDadosLogin(usuarioAutenticado, true);
      setUsuario(usuarioAutenticado);
      
      console.log('✅ [AuthService] Sessão salva com sucesso');
      return { success: true };
      
    } catch (error) {
      console.error('❌ [AuthService] Erro no login:', error);
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

      // ✅ REFATORADO: Usar passwordService para criar usuário
      console.log('💾 [PasswordService] Criando novo usuário...');
      
      const userData = {
        ...dadosUsuario,
        ativo: true,
        ultimoLogin: null
      };

      const senha = dadosUsuario.senha;
      delete userData.senha; // Remove senha temporária do objeto

      try {
        const userId = await createUserWithPassword(userData, senha);
        console.log('✅ [PasswordService] Usuário criado com sucesso:', userId);
        
        // Buscar usuário criado para retornar
        const usuarioComId = { id: userId, ...userData };
        return { success: true, usuario: usuarioComId };
        
      } catch (error) {
        console.error('❌ [PasswordService] Erro ao criar usuário:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return { success: false, message: 'Erro ao criar usuário' };
    }
  };

  const atualizarUsuario = async (id, dadosAtualizados) => {
    try {
      console.log('🔄 [PasswordService] Iniciando atualização de usuário:', { id, dadosAtualizados });
      
      // Verificar permissão para editar usuário
      const usuarioAlvo = usuarios.find(u => u.id === id);
      if (!PermissionChecker.canEditUser(usuario.nivel, usuario.id, id, usuarioAlvo?.nivel)) {
        console.log('❌ Sem permissão para editar usuário');
        return { success: false, message: 'Sem permissão para editar este usuário' };
      }

      // ✅ REFATORADO: Se a senha foi alterada, usar passwordService
      if (dadosAtualizados.senha) {
        console.log('🔐 [PasswordService] Atualizando senha com novo sistema...');
        
        try {
          // Atualizar senha usando passwordService
          // Isso cria authKey + senhaHash + senhaSalt automaticamente
          const passwordObj = await updateUserPassword(id, dadosAtualizados.senha);
          
          // Manter senha em texto plano para exibição local
          dadosAtualizados = {
            ...dadosAtualizados,
            ...passwordObj, // Contém authKey, senhaHash, senhaSalt
            senha: dadosAtualizados.senha // Manter para exibição
          };
          
          console.log('✅ [PasswordService] Senha atualizada com sucesso!');
          console.log('   - authKey: definido para login');
          console.log('   - senhaHash: hash SHA-512 criado');
          console.log('   - senhaSalt: salt gerado');
        } catch (error) {
          console.error('❌ [PasswordService] Erro ao atualizar senha:', error);
          return { success: false, message: 'Erro ao atualizar senha: ' + error.message };
        }
      }

      // Preparar dados para salvar no Firebase (sem senha em texto plano)
      const dadosParaFirebase = { ...dadosAtualizados };
      if (dadosParaFirebase.senha) {
        delete dadosParaFirebase.senha; // Remove senha em texto plano do Firebase
      }

      console.log('💾 Salvando alterações no Firebase Backup...');
      await updateDoc(doc(backupDb, 'usuarios', id), dadosParaFirebase);
      console.log('✅ Dados salvos no Firebase Backup com sucesso!');
      
      // Atualizar lista local de usuários
      setUsuarios(prevUsuarios => {
        return prevUsuarios.map(u => {
          if (u.id === id) {
            return { ...u, ...dadosAtualizados };
          }
          return u;
        });
      });
      console.log('✅ Lista local de usuários atualizada');
      
      // Se for o usuário logado, atualizar também o estado do usuário atual
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
      console.error('❌ Erro ao atualizar usuário:', error);
      return { success: false, message: 'Erro ao atualizar usuário: ' + error.message };
    }
  };

  const atualizarPreferenciasUsuario = async (userId, novasPreferencias) => {
    try {
      const usuarioAlvo = userId || usuario?.id;
      
      if (!usuarioAlvo) {
        return { success: false, message: 'Usuário não identificado' };
      }

      // Usuário pode atualizar suas próprias preferências
      // Ou admin pode atualizar de qualquer um
      if (usuario.id !== usuarioAlvo && usuario.nivel !== NIVEIS_PERMISSAO.ADMIN) {
        return { success: false, message: 'Sem permissão para alterar preferências deste usuário' };
      }

      const preferenciasAtuais = usuarios.find(u => u.id === usuarioAlvo)?.preferencias || {};
      const preferenciasNovas = {
        ...preferenciasAtuais,
        ...novasPreferencias
      };

      await updateDoc(doc(backupDb, 'usuarios', usuarioAlvo), {
        preferencias: preferenciasNovas
      });

      console.log('✅ Preferências atualizadas no Firebase Backup:', preferenciasNovas);

      // Se for o usuário logado, atualizar estado local
      if (usuario && usuario.id === usuarioAlvo) {
        const usuarioAtualizado = { 
          ...usuario, 
          preferencias: preferenciasNovas 
        };
        setUsuario(usuarioAtualizado);
        
        // Atualizar cookies se necessário
        if (CookieManager.getCookie(COOKIE_NAMES.LEMBRAR) === 'true') {
          salvarDadosLogin(usuarioAtualizado, true);
        }
      }

      return { success: true, preferencias: preferenciasNovas };
    } catch (error) {
      console.error('❌ Erro ao atualizar preferências:', error);
      return { success: false, message: 'Erro ao atualizar preferências' };
    }
  };

  const atualizarMenuUsuario = async (userId, novoMenuConfig) => {
    try {
      const usuarioAlvo = userId || usuario?.id;
      
      if (!usuarioAlvo) {
        return { success: false, message: 'Usuário não identificado' };
      }

      // Usuário pode atualizar seu próprio menu
      // Ou admin pode atualizar de qualquer um
      if (usuario.id !== usuarioAlvo && usuario.nivel !== NIVEIS_PERMISSAO.ADMIN) {
        return { success: false, message: 'Sem permissão para alterar menu deste usuário' };
      }

      await updateDoc(doc(backupDb, 'usuarios', usuarioAlvo), {
        menuConfig: novoMenuConfig,
        menuPersonalizado: true
      });

      console.log('✅ Menu personalizado atualizado no Firebase Backup');

      // Se for o usuário logado, atualizar estado local
      if (usuario && usuario.id === usuarioAlvo) {
        const usuarioAtualizado = { 
          ...usuario, 
          menuConfig: novoMenuConfig,
          menuPersonalizado: true
        };
        setUsuario(usuarioAtualizado);
        
        // Atualizar cookies se necessário
        if (CookieManager.getCookie(COOKIE_NAMES.LEMBRAR) === 'true') {
          salvarDadosLogin(usuarioAtualizado, true);
        }
      }

      return { success: true, menuConfig: novoMenuConfig };
    } catch (error) {
      console.error('❌ Erro ao atualizar menu:', error);
      return { success: false, message: 'Erro ao atualizar menu' };
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
      console.log('🗑️ Removendo usuário do Firebase Backup...');
      await deleteDoc(doc(backupDb, 'usuarios', id));
      console.log('✅ Usuário removido com sucesso do Firebase Backup');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao remover usuário:', error);
      return { success: false, message: 'Erro ao remover usuário: ' + error.message };
    }
  };

  const temPermissao = (nivelNecessario) => {
    // ADMIN tem acesso TOTAL - nunca pode ser negado
    if (usuario?.nivel === 0) {
      return true;
    }
    // Sistema reversivo: níveis menores = maior permissão
    // Verificar se o nível do usuário é menor ou igual ao necessário
    return usuario && usuario.nivel <= nivelNecessario;
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
    atualizarPreferenciasUsuario,
    atualizarMenuUsuario,
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
  const [mostrarRedefinicao, setMostrarRedefinicao] = useState(false);
  const [mostrarCriarUsuario, setMostrarCriarUsuario] = useState(false);
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

  // Se estiver na tela de redefinição
  if (mostrarRedefinicao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <PasswordResetForm 
          onVoltar={() => setMostrarRedefinicao(false)}
          onSucesso={() => setMostrarRedefinicao(false)}
        />
      </div>
    );
  }

  // Se estiver na tela de criar usuário
  if (mostrarCriarUsuario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <UserCreationForm 
          onVoltar={() => setMostrarCriarUsuario(false)}
          onSucesso={() => setMostrarCriarUsuario(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-700/20 p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-24 h-24 flex items-center justify-center mb-4 relative">
            <img src="/logo.png" alt="Logo WorkFlow" className="w-full h-full object-contain relative z-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">WorkFlow</h1>
          

        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              Email/Usuário
            </label>
            <input
              type="text"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              placeholder="Digite seu usuário"
              required
              disabled={carregando}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              <Lock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              Senha
            </label>
            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                onKeyPress={handleKeyPress}
                className="w-full px-4 pr-12 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                placeholder="Digite sua senha"
                required
                disabled={carregando}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
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
                ? 'bg-gray-400 cursor-not-allowed text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
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

        {/* Links para Redefinição de Senha e Criar Conta */}
        <div className="mt-6 text-center space-y-3">
          <button
            onClick={() => setMostrarRedefinicao(true)}
            className="block w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
          >
            Esqueci minha senha
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                ou
              </span>
            </div>
          </div>
          
          <button
            onClick={() => setMostrarCriarUsuario(true)}
            className="block w-full px-4 py-2 border-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-medium transition-colors text-sm"
          >
            Criar Nova Conta
          </button>
        </div>

        {/* Footer or legal info only, no test users, cookies, or login tips */}
        <div className="mt-4 text-center text-xs text-gray-500">
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
        {/* Dashboard content will be added here */}
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

// Componente de tela de erro
const ErrorScreen = ({ error, resetError }) => {
  const { usuario } = useAuth();
  const [enviandoRelatorio, setEnviandoRelatorio] = useState(false);
  const [relatorioEnviado, setRelatorioEnviado] = useState(false);
  const [showDescricaoModal, setShowDescricaoModal] = useState(false);
  const [descricao, setDescricao] = useState('');

  // Função para detectar informações do navegador
  const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    let browserName = 'Desconhecido';
    let browserVersion = 'Desconhecida';
    let osName = 'Desconhecido';

    // Detectar navegador
    if (ua.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
      browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || '';
    } else if (ua.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
      browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || '';
    } else if (ua.indexOf('Safari') > -1) {
      browserName = 'Safari';
      browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || '';
    } else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) {
      browserName = 'Edge';
      browserVersion = ua.match(/Edg\/([0-9.]+)/)?.[1] || '';
    }

    // Detectar SO
    if (ua.indexOf('Windows') > -1) osName = 'Windows';
    else if (ua.indexOf('Mac') > -1) osName = 'MacOS';
    else if (ua.indexOf('Linux') > -1) osName = 'Linux';
    else if (ua.indexOf('Android') > -1) osName = 'Android';
    else if (ua.indexOf('iOS') > -1) osName = 'iOS';

    return { name: browserName, version: browserVersion, os: osName };
  };

  // Função para enviar relatório de erro
  const enviarRelatorioErro = async () => {
    if (!usuario?.id) {
      alert('Você precisa estar logado para enviar um relatório de erro.');
      return;
    }

    setShowDescricaoModal(true);
  };

  const confirmarEnvioRelatorio = async () => {
    setEnviandoRelatorio(true);
    setShowDescricaoModal(false);

    try {
      const errorCode = `ERR-${Date.now().toString(36).toUpperCase()}`;
      const browserInfo = getBrowserInfo();

      const relatorio = {
        errorCode,
        errorMessage: error?.message || error?.toString() || 'Erro desconhecido',
        errorStack: error?.stack || null,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        browserInfo,
        usuarioId: usuario.id,
        usuarioNome: usuario.nome || 'Usuário Desconhecido',
        usuarioEmail: usuario.email || '',
        descricao: descricao || 'Sem descrição adicional',
        status: 'pendente',
        criadoEm: new Date().toISOString()
      };

      await addDoc(collection(db, 'errorReports'), relatorio);
      
      setRelatorioEnviado(true);
      setEnviandoRelatorio(false);
      
      // Copiar código de erro para clipboard
      navigator.clipboard.writeText(errorCode).catch(() => {});
      
      setTimeout(() => {
        setRelatorioEnviado(false);
        setDescricao('');
      }, 5000);
    } catch (err) {
      console.error('Erro ao enviar relatório:', err);
      alert('Não foi possível enviar o relatório. Por favor, tente novamente.');
      setEnviandoRelatorio(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
      {/* Modal de descrição */}
      {showDescricaoModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Descrever o Problema
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Conte-nos o que você estava fazendo quando o erro ocorreu. Isso nos ajudará a resolver o problema mais rapidamente.
            </p>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Eu estava tentando adicionar uma nova ferramenta ao inventário quando a tela travou..."
              className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowDescricaoModal(false);
                  setDescricao('');
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEnvioRelatorio}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                Enviar Relatório
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 text-center">
        {/* Logo WorkFlow com efeito de erro */}
        <div className="mb-6 flex justify-center">
          <div className="relative w-32 h-32">
            {/* Logo com ícone de erro */}
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="WorkFlow Error" 
                className="w-full h-full object-contain opacity-90 saturate-0"
                style={{
                  filter: 'brightness(0.4) sepia(1) hue-rotate(-50deg) saturate(6)'
                }}
              />
            </div>
            
            {/* Ícone de alerta sobreposto */}
            <div className="absolute -bottom-2 -right-2 bg-red-600 rounded-full p-2 shadow-lg border-4 border-white dark:border-gray-800">
              <AlertCircle className="w-6 h-6 text-white" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Ops! Algo deu errado
        </h1>

        {/* Descrição */}
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          O sistema não carregou como deveria. Não se preocupe, isso pode acontecer.
        </p>

        {/* Detalhes do erro (apenas em desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-left">
            <p className="text-sm font-mono text-red-800 dark:text-red-300 break-all">
              {error.toString()}
            </p>
          </div>
        )}

        {/* Sugestões */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Tente uma destas soluções:
          </h3>
          <ul className="text-left space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Recarregue o sistema (F5)</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Limpe o cache do navegador</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Verifique sua conexão com a internet</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Entre em contato com o suporte se o problema persistir</span>
            </li>
          </ul>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3.5 rounded-full bg-blue-500 dark:bg-[#1D9BF0] hover:bg-blue-600 dark:hover:bg-[#1A8CD8] text-white font-bold text-lg shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Recarregar Sistema
          </button>
          
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="px-8 py-3.5 rounded-full bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold text-lg border-2 border-gray-300 dark:border-gray-600 shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Limpar Cache
          </button>
        </div>

        {/* Botão para enviar relatório de erro */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          {relatorioEnviado ? (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4">
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Relatório enviado com sucesso!</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400">
                Obrigado por nos ajudar a melhorar o sistema. Nossa equipe irá analisar o problema.
              </p>
            </div>
          ) : (
            <button
              onClick={enviarRelatorioErro}
              disabled={enviandoRelatorio}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {enviandoRelatorio ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Enviando relatório...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5" />
                  Reportar este Erro
                </>
              )}
            </button>
          )}
        </div>

        {/* Rodapé */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            WorkFlow System • Versão 2.0
          </p>
        </div>
      </div>
    </div>
  );
};

// Error Boundary Class Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorScreen error={this.state.error} resetError={() => this.setState({ hasError: false, error: null })} />;
    }

    return this.props.children;
  }
}

// Componente principal do sistema
const AlmoxarifadoSistema = () => {
  const { usuario, logout, firebaseStatus, temPermissao } = useAuth();
  const isMobile = useIsMobile();
  const { funcionarios: funcionariosData } = useFuncionarios();
  const { unreadCount: notificationUnreadCount } = useNotification();
  const { totalNaoLidas: mensagensNaoLidas } = useMensagens();
  const funcionarioInfo = funcionariosData.find(f => f.id === usuario.id);
  
  // Estados locais
  const [abaAtiva, setAbaAtiva] = useState(null); // Inicia como null para evitar flash do dashboard
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuRecolhido, setMenuRecolhido] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPermissionAlert, setShowPermissionAlert] = useState(false);
  const [permissionAlertData, setPermissionAlertData] = useState(null);
  const [permissaoAlterada, setPermissaoAlterada] = useState(false); // Flag para controlar fluxo após mudança de permissão
  
  // Estados para personalização do menu
  const [menuPersonalizado, setMenuPersonalizado] = useState(null);
  const [itemFavorito, setItemFavorito] = useState(null); // Inicia como null até carregar do Firebase
  const [favoritoCarregado, setFavoritoCarregado] = useState(false); // Flag para controlar se favorito foi carregado
  const [paginaInicialDefinida, setPaginaInicialDefinida] = useState(false); // Flag para controlar se página inicial já foi definida
  const [showMenuConfig, setShowMenuConfig] = useState(false);
  const [menuLongPressTimer, setMenuLongPressTimer] = useState(null);
  const [menuLongPressProgress, setMenuLongPressProgress] = useState(0);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [menuConfigSaved, setMenuConfigSaved] = useState(false);
  
  // Estados para controle de loading e redirecionamento
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Estados para clique longo no desktop
  const [desktopLongPressTimer, setDesktopLongPressTimer] = useState(null);
  const [desktopLongPressItem, setDesktopLongPressItem] = useState(null);
  const [desktopEditMode, setDesktopEditMode] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // ===== SISTEMA DE CLIQUE LONGO PARA DESKTOP =====
  const startDesktopLongPress = (abaId) => {
    if (isMobile) return; // Só para desktop
    
    console.log('🖱️ Iniciando long press para:', abaId);
    setDesktopLongPressItem(abaId);
    
    const timer = setTimeout(() => {
      console.log('🎯 Long press ativado para:', abaId);
      setDesktopEditMode(true);
      setShowMenuConfig(true);
      
      // Vibração se disponível
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 800); // 800ms para desktop
    
    setDesktopLongPressTimer(timer);
  };

  const stopDesktopLongPress = () => {
    console.log('🛑 Parando long press, timer existe:', !!desktopLongPressTimer);
    
    if (desktopLongPressTimer) {
      clearTimeout(desktopLongPressTimer);
      setDesktopLongPressTimer(null);
    }
    
    // Limpar item apenas se não estiver no modo de edição
    if (!desktopEditMode) {
      setDesktopLongPressItem(null);
    }
  };

  const handleDesktopItemClick = (abaId) => {
    // Sempre navegar para a aba clicada, independente do modo
    console.log('🖱️ Clique em aba:', abaId, 'Modo edição:', desktopEditMode);
    
    setAbaAtiva(abaId);
    if (isMobile) {
      setMenuOpen(false);
    }
    
    // Se estava no modo de edição, sair dele após navegar
    if (desktopEditMode) {
      setDesktopEditMode(false);
      setDesktopLongPressItem(null);
    }
  };

  // ===== SISTEMA DE PERSISTÊNCIA DE ESTADO =====
  const STORAGE_KEY = `workflow_state_${usuario?.id}`;

  // Salvar estado de formulário específico
  const salvarEstadoFormulario = useCallback((abaId, dados) => {
    if (!usuario?.id) return;
    
    try {
      const estadoAtual = localStorage.getItem(STORAGE_KEY);
      const estado = estadoAtual ? JSON.parse(estadoAtual) : {};
      
      if (!estado.formStates) {
        estado.formStates = {};
      }
      
      estado.formStates[abaId] = dados;
      estado.timestamp = new Date().toISOString();
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
      console.log(`💾 Estado do formulário "${abaId}" salvo:`, dados);
    } catch (error) {
      console.error('Erro ao salvar estado do formulário:', error);
    }
  }, [usuario?.id, STORAGE_KEY]);

  // Carregar estado de formulário específico
  const carregarEstadoFormulario = useCallback((abaId) => {
    if (!usuario?.id) return null;
    
    try {
      const estadoSalvo = localStorage.getItem(STORAGE_KEY);
      if (estadoSalvo) {
        const estado = JSON.parse(estadoSalvo);
        return estado.formStates?.[abaId] || null;
      }
    } catch (error) {
      console.error('Erro ao carregar estado do formulário:', error);
    }
    return null;
  }, [usuario?.id, STORAGE_KEY]);

  // Salvar estado da aplicação
  const salvarEstadoApp = useCallback(() => {
    if (!usuario?.id) return;
    
    try {
      const estadoAtual = localStorage.getItem(STORAGE_KEY);
      const estado = estadoAtual ? JSON.parse(estadoAtual) : { formStates: {} };
      
      // Atualizar apenas navegação e scroll, preservar formStates
      estado.abaAtiva = abaAtiva;
      estado.scrollPosition = window.scrollY;
      estado.timestamp = new Date().toISOString();
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
      console.log('💾 Estado salvo:', { abaAtiva, scrollPosition: estado.scrollPosition });
    } catch (error) {
      console.error('Erro ao salvar estado:', error);
    }
  }, [usuario?.id, abaAtiva, STORAGE_KEY]);

  // Carregar estado da aplicação
  const carregarEstadoApp = useCallback(() => {
    if (!usuario?.id) return null;
    
    try {
      const estadoSalvo = localStorage.getItem(STORAGE_KEY);
      if (estadoSalvo) {
        const estado = JSON.parse(estadoSalvo);
        console.log('📂 Estado carregado:', estado);
        return estado;
      }
    } catch (error) {
      console.error('Erro ao carregar estado:', error);
    }
    return null;
  }, [usuario?.id, STORAGE_KEY]);

  // Salvar estado automaticamente ao mudar de aba
  useEffect(() => {
    if (usuario?.id) {
      salvarEstadoApp();
    }
  }, [abaAtiva, usuario?.id, salvarEstadoApp]);

  // Detectar mudanças de nível de permissão em tempo real
  useEffect(() => {
    if (!usuario?.id) return;

    let nivelAnterior = usuario.nivel;
    
    const unsubscribe = onSnapshot(doc(db, 'usuarios', usuario.id), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const dadosAtualizados = { id: docSnapshot.id, ...docSnapshot.data() };
        
        // Verificar se mudou o nível de permissão
        if (dadosAtualizados.nivel !== nivelAnterior) {
          console.log('⚡ Nível de permissão alterado:', {
            antes: nivelAnterior,
            depois: dadosAtualizados.nivel,
            labelAntes: NIVEIS_LABELS[nivelAnterior],
            labelDepois: NIVEIS_LABELS[dadosAtualizados.nivel]
          });
          
          // Verificar se usuário já viu o alerta para este nível
          const alertKey = `permission_alert_seen_${usuario.id}_${dadosAtualizados.nivel}`;
          const jaViu = localStorage.getItem(alertKey);
          
          if (!jaViu) {
            // Só mostra o modal se ainda não viu
            // Salvar estado atual antes de mostrar o modal
            salvarEstadoApp();
            
            // Marcar que houve mudança de permissão
            setPermissaoAlterada(true);
            
            // Mostrar modal de alerta
            setPermissionAlertData({
              oldLevel: nivelAnterior,
              newLevel: dadosAtualizados.nivel,
              newLevelLabel: niveisLabels[dadosAtualizados.nivel]
            });
            setShowPermissionAlert(true);
          } else {
            console.log('✅ Usuário já viu o alerta de mudança de permissão');
          }
          
          // Atualizar referência do nível
          nivelAnterior = dadosAtualizados.nivel;
        }
      }
    });

    return () => unsubscribe();
  }, [usuario?.id, salvarEstadoApp]);

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
    const snapshot = await getDocs(collection(db, 'inventario'));
    for (const docItem of snapshot.docs) {
      await deleteDoc(doc(db, 'inventario', docItem.id));
    }
    // Adiciona todos os itens do inventarioInicial
    for (const item of inventarioInicial) {
      const { id, ...rest } = item;
      await addDoc(collection(db, 'inventario'), rest);
    }
  };

  // Função para corrigir campos 'disponivel' e 'emUso' no inventário do Firestore
  const corrigirInventario = async () => {
    // Primeiro, reseta todos os campos do inventário
    const snapshotInventario = await getDocs(collection(db, 'inventario'));
    for (const docItem of snapshotInventario.docs) {
      const data = docItem.data();
      if (data.quantidade !== undefined) {
        await updateDoc(doc(db, 'inventario', docItem.id), {
          disponivel: data.quantidade,
          emUso: 0
        });
      }
    }

    // Depois, calcula os itens em uso baseado nos empréstimos ativos
    const snapshotEmprestimos = await getDocs(query(
      collection(db, 'emprestimos'),
      where('status', '==', 'emprestado')
    ));

    // Mapa para agregar as quantidades em uso
    const emUsoMap = new Map();

    // Soma todas as ferramentas em uso
    for (const emprestimoDoc of snapshotEmprestimos.docs) {
      const emprestimo = emprestimoDoc.data();
      if (emprestimo.ferramentas && Array.isArray(emprestimo.ferramentas)) {
        for (const ferramenta of emprestimo.ferramentas) {
          const nome = typeof ferramenta === 'string' ? ferramenta : ferramenta.nome;
          const quantidade = typeof ferramenta === 'string' ? 1 : (ferramenta.quantidade || 1);
          const nomeNormalizado = nome.trim().toLowerCase();
          emUsoMap.set(nomeNormalizado, (emUsoMap.get(nomeNormalizado) || 0) + quantidade);
        }
      }
    }

    // Atualiza o inventário com as quantidades em uso
    for (const docItem of snapshotInventario.docs) {
      const data = docItem.data();
      const nomeNormalizado = data.nome.trim().toLowerCase();
      const emUso = emUsoMap.get(nomeNormalizado) || 0;
      const disponivel = data.quantidade - emUso;

      await updateDoc(doc(db, 'inventario', docItem.id), {
        disponivel: Math.max(0, disponivel),
        emUso
      });
    }

    alert('Inventário corrigido: campos "disponivel" e "emUso" atualizados!');
  };

  // Função para obter detalhes de quem está com cada item
  const obterDetalhesEmprestimos = (itemNome) => {
    try {
      console.log('Buscando detalhes para:', itemNome);
      const nomeNormalizado = itemNome.trim().toLowerCase();
      let quantidadeEmUso = 0;
      const detalhes = [];

      // Filtra apenas empréstimos ativos
      const emprestimosAtivos = emprestimos.filter(emp => emp.status === 'emprestado');
      console.log('Empréstimos ativos encontrados:', emprestimosAtivos.length);

      emprestimosAtivos.forEach(emp => {
        if (emp.ferramentas && Array.isArray(emp.ferramentas)) {
          const ferramentasDoItem = emp.ferramentas.filter(f => {
            const nome = typeof f === 'string' ? f : f.nome;
            return nome.trim().toLowerCase() === nomeNormalizado;
          });

          if (ferramentasDoItem.length > 0) {
            console.log('Encontrado em empréstimo:', emp.id);
            ferramentasDoItem.forEach(f => {
              const quantidade = typeof f === 'string' ? 1 : (f.quantidade || 1);
              quantidadeEmUso += quantidade;
              
              detalhes.push({
                colaborador: emp.colaborador,
                funcionario: emp.colaborador,
                quantidade: quantidade,
                dataEmprestimo: emp.dataRetirada ? emp.dataRetirada : emp.dataEmprestimo,
                horaEmprestimo: emp.horaRetirada ? emp.horaRetirada : emp.horaEmprestimo
              });
            });
          }
        }
      });

      // Log detalhado para debug
      console.log(`Estado atual de "${itemNome}":`, {
        nomeNormalizado,
        quantidadeEmUso,
        detalhes
      });
      
      return detalhes;
    } catch (error) {
      console.error('Erro ao obter detalhes dos empréstimos:', error);
      return [];
    }
  };

  // Função de diagnóstico para verificar inconsistências no inventário
  const diagnosticarInventario = async () => {
    try {
      console.log('🔍 Iniciando diagnóstico completo do inventário...');
      
      // Recarrega dados do Firestore
      const [inventarioSnapshot, emprestimosSnapshot] = await Promise.all([
        getDocs(collection(db, 'inventario')),
        getDocs(query(collection(db, 'emprestimos'), where('status', '==', 'emprestado')))
      ]);
      
      const itensInventario = inventarioSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const emprestimosAtivos = emprestimosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`📦 Total de itens no inventário: ${itensInventario.length}`);
      console.log(`📋 Total de empréstimos ativos: ${emprestimosAtivos.length}`);
      
      // Analisa cada item
      const resultados = [];
      
      for (const item of itensInventario) {
        const nomeNormalizado = item.nome.trim().toLowerCase();
        
        // Conta quantos estão realmente em uso
        let quantidadeEmUsoReal = 0;
        const emprestimosDoItem = [];
        
        emprestimosAtivos.forEach(emp => {
          if (emp.ferramentas && Array.isArray(emp.ferramentas)) {
            emp.ferramentas.forEach(f => {
              const nome = typeof f === 'string' ? f : f.nome;
              if (nome.trim().toLowerCase() === nomeNormalizado) {
                const qtd = typeof f === 'string' ? 1 : (f.quantidade || 1);
                quantidadeEmUsoReal += qtd;
                emprestimosDoItem.push({
                  emprestimoId: emp.id,
                  colaborador: emp.colaborador,
                  quantidade: qtd
                });
              }
            });
          }
        });
        
        const disponivelEsperado = item.quantidade - quantidadeEmUsoReal;
        const emUsoRegistrado = item.emUso || 0;
        const disponivelRegistrado = item.disponivel || 0;
        
        const inconsistente = 
          emUsoRegistrado !== quantidadeEmUsoReal || 
          disponivelRegistrado !== disponivelEsperado;
        
        if (inconsistente) {
          resultados.push({
            nome: item.nome,
            quantidade: item.quantidade,
            estado: {
              registrado: {
                disponivel: disponivelRegistrado,
                emUso: emUsoRegistrado
              },
              esperado: {
                disponivel: disponivelEsperado,
                emUso: quantidadeEmUsoReal
              },
              diferenca: {
                disponivel: disponivelEsperado - disponivelRegistrado,
                emUso: quantidadeEmUsoReal - emUsoRegistrado
              }
            },
            emprestimos: emprestimosDoItem
          });
        }
      }
      
      if (resultados.length > 0) {
        console.log(`⚠️ Encontradas ${resultados.length} inconsistências:`);
        console.table(resultados.map(r => ({
          Item: r.nome,
          'Disp. Registrado': r.estado.registrado.disponivel,
          'Disp. Esperado': r.estado.esperado.disponivel,
          'Em Uso Registrado': r.estado.registrado.emUso,
          'Em Uso Esperado': r.estado.esperado.emUso,
          'Empréstimos': r.emprestimos.length
        })));
        
        return {
          temInconsistencias: true,
          inconsistencias: resultados
        };
      } else {
        console.log('✅ Nenhuma inconsistência encontrada! Inventário está correto.');
        return {
          temInconsistencias: false,
          mensagem: 'Inventário está consistente'
        };
      }
    } catch (error) {
      console.error('❌ Erro no diagnóstico:', error);
      return {
        erro: error.message
      };
    }
  };

  // Função para corrigir estado específico de um item
  const corrigirEstadoItem = async (itemNome) => {
    try {
      console.log(`🔧 Iniciando correção de estado para: ${itemNome}`);
      
      // Normaliza o nome do item
      const nomeNormalizado = itemNome.trim().toLowerCase();
      
      // Recarrega o inventário do Firestore para ter dados atualizados
      const inventarioSnapshot = await getDocs(collection(db, 'inventario'));
      const itensInventario = inventarioSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Encontra o item no inventário
      const itemInventario = itensInventario.find(item => 
        item.nome.trim().toLowerCase() === nomeNormalizado
      );
      
      if (!itemInventario) {
        console.log('❌ Item não encontrado no inventário:', itemNome);
        return {
          sucesso: false,
          erro: 'Item não encontrado'
        };
      }
      
      console.log('📦 Item encontrado:', {
        nome: itemInventario.nome,
        quantidadeTotal: itemInventario.quantidade,
        disponivelAtual: itemInventario.disponivel || 0,
        emUsoAtual: itemInventario.emUso || 0
      });
      
      // Recarrega empréstimos do Firestore
      const emprestimosQuery = query(
        collection(db, 'emprestimos'),
        where('status', '==', 'emprestado')
      );
      const emprestimosSnapshot = await getDocs(emprestimosQuery);
      const emprestimosAtivos = emprestimosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`🔍 Verificando ${emprestimosAtivos.length} empréstimos ativos`);
      
      // Calcula quantos estão em uso nos empréstimos ativos
      let quantidadeEmUso = 0;
      const detalhesEmprestimos = [];
      
      emprestimosAtivos.forEach(emp => {
        if (emp.ferramentas && Array.isArray(emp.ferramentas)) {
          const ferramentasDoItem = emp.ferramentas.filter(f => {
            const nome = typeof f === 'string' ? f : f.nome;
            return nome.trim().toLowerCase() === nomeNormalizado;
          });
          
          if (ferramentasDoItem.length > 0) {
            ferramentasDoItem.forEach(f => {
              const quantidade = typeof f === 'string' ? 1 : (f.quantidade || 1);
              quantidadeEmUso += quantidade;
              
              detalhesEmprestimos.push({
                id: emp.id,
                colaborador: emp.colaborador,
                quantidade: quantidade,
                dataEmprestimo: emp.dataEmprestimo
              });
            });
          }
        }
      });
      
      console.log('📋 Empréstimos ativos encontrados:', detalhesEmprestimos);
      console.log(`📊 Total em uso calculado: ${quantidadeEmUso}`);
      
      // Calcula o disponível correto
      const disponivelCorreto = Math.max(0, itemInventario.quantidade - quantidadeEmUso);
      
      // Atualiza o item no Firestore
      const atualizacao = {
        emUso: quantidadeEmUso,
        disponivel: disponivelCorreto,
        ultimaCorrecao: new Date().toISOString()
      };
      
      console.log(`✅ Corrigindo estado de "${itemNome}":`, {
        antes: {
          disponivel: itemInventario.disponivel || 0,
          emUso: itemInventario.emUso || 0
        },
        depois: {
          disponivel: disponivelCorreto,
          emUso: quantidadeEmUso
        },
        quantidade: itemInventario.quantidade,
        emprestimosAtivos: detalhesEmprestimos.length
      });
      
      await updateDoc(doc(db, 'inventario', itemInventario.id), atualizacao);
      
      // Verifica se a correção foi aplicada
      const itemVerificacao = await getDoc(doc(db, 'inventario', itemInventario.id));
      const dadosVerificacao = itemVerificacao.data();
      
      console.log('✔️ Verificação pós-correção:', {
        nome: dadosVerificacao.nome,
        disponivel: dadosVerificacao.disponivel,
        emUso: dadosVerificacao.emUso
      });
      
      return {
        sucesso: true,
        detalhes: detalhesEmprestimos,
        estado: atualizacao,
        correcaoAplicada: {
          disponivelAntes: itemInventario.disponivel || 0,
          disponivelDepois: disponivelCorreto,
          diferenca: disponivelCorreto - (itemInventario.disponivel || 0)
        }
      };
    } catch (error) {
      console.error('❌ Erro ao corrigir estado do item:', error);
      return {
        sucesso: false,
        erro: error.message
      };
    }
  };

  // ===== EMPRÉSTIMOS =====
  const [emprestimos, setEmprestimos] = useState([]);
  const [emprestimosCarregados, setEmprestimosCarregados] = useState(false);
  
  // Função para debug do estado atual dos empréstimos
  const debugEmprestimos = () => {
    if (!emprestimos || emprestimos.length === 0) {
      console.log('Nenhum empréstimo carregado');
      return;
    }

    const emprestimosAtivos = emprestimos.filter(e => e.status === 'emprestado');
    console.log('Estado atual dos empréstimos:');
    console.log('Total:', emprestimos.length);
    console.log('Ativos:', emprestimosAtivos.length);

    // Debug específico para facas de bolso
    const emprestimosFacas = emprestimosAtivos.filter(e => 
      e.ferramentas && Array.isArray(e.ferramentas) &&
      e.ferramentas.some(f => {
        const nome = typeof f === 'string' ? f : f.nome;
        return nome.trim().toLowerCase() === 'faca de bolso';
      })
    );

    if (emprestimosFacas.length > 0) {
      console.log('Empréstimos de facas de bolso:');
      emprestimosFacas.forEach(emp => {
        const facas = emp.ferramentas.find(f => {
          const nome = typeof f === 'string' ? f : f.nome;
          return nome.trim().toLowerCase() === 'faca de bolso';
        });
        console.log({
          id: emp.id,
          colaborador: emp.colaborador,
          status: emp.status,
          quantidade: typeof facas === 'string' ? 1 : (facas.quantidade || 1)
        });
      });
    } else {
      console.log('Nenhum empréstimo ativo de facas de bolso encontrado');
    }
  };
  
  useEffect(() => {
    setEmprestimosCarregados(false);
    let unsubscribe = () => {};

    const carregarEmprestimos = () => {
      try {
        unsubscribe = onSnapshot(collection(db, 'emprestimos'), (snapshot) => {
          try {
            const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log('Empréstimos carregados:', lista.length);
            
            // Debug de empréstimos ativos
            const emprestimosAtivos = lista.filter(e => e.status === 'emprestado');
            console.log('Empréstimos ativos:', emprestimosAtivos.length);
            
            // Debug específico para facas de bolso
            const emprestimosFacas = emprestimosAtivos.filter(e => 
              e.ferramentas && Array.isArray(e.ferramentas) &&
              e.ferramentas.some(f => {
                const nome = typeof f === 'string' ? f : f.nome;
                const nomeNormalizado = nome.trim().toLowerCase();
                return nomeNormalizado === 'faca de bolso';
              })
            );
            
            if (emprestimosFacas.length > 0) {
              console.log('Empréstimos de facas de bolso encontrados:', emprestimosFacas.length);
              emprestimosFacas.forEach(emp => {
                const facas = emp.ferramentas.filter(f => {
                  const nome = typeof f === 'string' ? f : f.nome;
                  return nome.trim().toLowerCase() === 'faca de bolso';
                });
                console.log('Detalhes do empréstimo:', {
                  colaborador: emp.colaborador,
                  status: emp.status,
                  facas: facas
                });
              });
            }
            console.log('Dados dos empréstimos:', {
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
        nomeFerramentas: emprestimo.ferramentas.map(f => f.nome),
        status: 'emprestado'
      };
      
      // Verifica disponibilidade antes de adicionar
      for (const ferramenta of emprestimo.ferramentas) {
        const itemInventario = inventario.find(i => i.nome === ferramenta.nome);
        if (!itemInventario || itemInventario.disponivel < ferramenta.quantidade) {
          throw new Error(`Quantidade indisponível para ${ferramenta.nome}`);
        }
      }

      const docRef = await addDoc(collection(db, 'emprestimos'), emprestimoData);

      // Atualiza a disponibilidade das ferramentas
      await atualizarDisponibilidadeFerramentas(emprestimo.ferramentas, 'emprestar');
      
      // Criar notificação para o funcionário
      try {
        const funcionario = funcionarios.find(f => f.nome === emprestimo.nomeFuncionario);
        if (funcionario?.id) {
          await notifyNewLoan(
            funcionario.id,
            emprestimo.ferramentas,
            usuario?.nome || 'Responsável',
            { emprestimoId: docRef.id }
          );
          console.log('Notificação de empréstimo enviada para:', funcionario.nome);
        }
      } catch (notifError) {
        console.error('Erro ao enviar notificação de empréstimo:', notifError);
        // Não falhar o empréstimo se a notificação falhar
      }
      
      return docRef;
    } catch (error) {
      console.error('Erro ao adicionar empréstimo:', error);
      throw error;
    }
  };

  const removerEmprestimo = async (id, atualizarDisponibilidade = true) => {
    if (!PermissionChecker.canManageOperational(usuario?.nivel)) {
      throw new Error('Sem permissão para remover empréstimos');
    }

    try {
      // Buscar o empréstimo antes de remover
      const emprestimoRef = doc(db, 'emprestimos', id);
      const emprestimoSnap = await getDoc(emprestimoRef);
      
      if (!emprestimoSnap.exists()) {
        throw new Error('Empréstimo não encontrado');
      }

      const emprestimo = emprestimoSnap.data();
      
      // Se o empréstimo estava ativo (não devolvido), retornar as ferramentas ao inventário
      if (emprestimo.status === 'emprestado' && atualizarDisponibilidade) {
        for (const ferramenta of emprestimo.ferramentas) {
          const nome = typeof ferramenta === 'string' ? ferramenta : ferramenta.nome;
          const quantidade = typeof ferramenta === 'string' ? 1 : (ferramenta.quantidade || 1);
          
          // Buscar o item no inventário
          const itemInventario = inventario.find(item => 
            item.nome.trim().toLowerCase() === nome.trim().toLowerCase()
          );
          
          if (itemInventario) {
            // Retornar a quantidade ao inventário
            await updateDoc(doc(db, 'inventario', itemInventario.id), {
              disponivel: (itemInventario.disponivel || 0) + quantidade,
              emUso: Math.max(0, (itemInventario.emUso || 0) - quantidade)
            });
          }
        }
      }
      
      // Remover o empréstimo
      await deleteDoc(emprestimoRef);
      
      return true;
    } catch (error) {
      console.error('Erro ao remover empréstimo:', error);
      throw error;
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

  // Função para atualizar a disponibilidade das ferramentas
  const atualizarDisponibilidadeFerramentas = async (ferramentas, operacao) => {
    try {
      console.log('🔄 Atualizando disponibilidade:', {
        ferramentas,
        operacao,
        timestamp: new Date().toISOString()
      });

      for (const ferramenta of ferramentas) {
        // Trata tanto string quanto objeto com nome/quantidade
        const nome = typeof ferramenta === 'string' ? ferramenta : ferramenta.nome;
        const quantidade = typeof ferramenta === 'string' ? 1 : (ferramenta.quantidade || 1);
        
        // Normaliza o nome para busca
        const nomeNormalizado = nome.trim().toLowerCase();
        console.log(`📦 Processando ferramenta: "${nome}" (${quantidade} unidades)`);
        
        // Busca o item no inventário
        const querySnapshot = await getDocs(collection(db, 'inventario'));
        const itensInventario = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const itemInventario = itensInventario.find(item => 
          item.nome.trim().toLowerCase() === nomeNormalizado
        );
        
        if (itemInventario) {
          console.log('📊 Estado atual:', {
            nome: itemInventario.nome,
            quantidade: itemInventario.quantidade,
            disponivel: itemInventario.disponivel || 0,
            emUso: itemInventario.emUso || 0
          });

          // CORREÇÃO: Calcula valores corretamente
          let novaDisponibilidade, novoEmUso;
          
          if (operacao === 'devolver') {
            // Ao devolver: aumenta disponível e diminui em uso
            novoEmUso = Math.max(0, (itemInventario.emUso || 0) - quantidade);
            novaDisponibilidade = Math.min(
              itemInventario.quantidade, 
              itemInventario.quantidade - novoEmUso
            );
          } else {
            // Ao emprestar: diminui disponível e aumenta em uso
            novoEmUso = Math.min(
              itemInventario.quantidade,
              (itemInventario.emUso || 0) + quantidade
            );
            novaDisponibilidade = Math.max(
              0,
              itemInventario.quantidade - novoEmUso
            );
          }

          const atualizacao = {
            disponivel: novaDisponibilidade,
            emUso: novoEmUso,
            ultimaAtualizacao: new Date().toISOString()
          };

          console.log('✅ Atualizando para:', atualizacao);
          console.log(`📈 Diferença: ${operacao === 'devolver' ? '+' : '-'}${quantidade} | Disponível: ${itemInventario.disponivel || 0} → ${novaDisponibilidade} | Em Uso: ${itemInventario.emUso || 0} → ${novoEmUso}`);
          
          await updateDoc(doc(db, 'inventario', itemInventario.id), atualizacao);
          
          // Verifica se a atualização foi bem-sucedida
          const itemAtualizado = await getDoc(doc(db, 'inventario', itemInventario.id));
          const dadosAtualizados = itemAtualizado.data();
          console.log('✔️ Verificação pós-atualização:', {
            nome: dadosAtualizados.nome,
            disponivel: dadosAtualizados.disponivel,
            emUso: dadosAtualizados.emUso
          });
        } else {
          console.warn(`⚠️ Item não encontrado no inventário: ${nome}`);
        }
      }
      
      console.log('✅ Atualização de disponibilidade concluída com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar disponibilidade:', error);
      throw error;
    }
  };

  // A função removerEmprestimo foi movida para cima

  // Função para marcar empréstimo como devolvido
  const devolverFerramentas = async (id, atualizarDisponibilidade, devolvidoPorTerceiros = false, atualizacaoParcial = null) => {
    try {
      console.log('Iniciando devolução:', {
        id,
        devolvidoPorTerceiros,
        parcial: !!atualizacaoParcial
      });

      const emprestimoRef = doc(db, 'emprestimos', id);
      const emprestimoSnapshot = await getDoc(emprestimoRef);
      
      if (!emprestimoSnapshot.exists()) {
        throw new Error('Empréstimo não encontrado');
      }

      const emprestimo = emprestimoSnapshot.data();
      console.log('Empréstimo encontrado:', {
        id: emprestimoSnapshot.id,
        colaborador: emprestimo.colaborador,
        status: emprestimo.status,
        ferramentas: emprestimo.ferramentas
      });

      if (atualizacaoParcial) {
        console.log('Processando devolução parcial:', atualizacaoParcial);
        
        // Filtra as ferramentas que serão devolvidas
        const ferramentasDevolvidas = emprestimo.ferramentas.filter(
          f => !atualizacaoParcial.ferramentas.find(nf => {
            const idMatch = nf.id === f.id;
            console.log(`Comparando ferramentas: ${f.nome || f} - permanece: ${idMatch}`);
            return idMatch;
          })
        );
        
        console.log('Ferramentas a devolver:', ferramentasDevolvidas);
        
        // Atualiza disponibilidade das ferramentas devolvidas
        await atualizarDisponibilidadeFerramentas(ferramentasDevolvidas, 'devolver');
        
        // Atualiza o empréstimo com as ferramentas restantes
        const atualizacao = {
          ...atualizacaoParcial,
          dataUltimaAtualizacao: new Date().toISOString()
        };
        
        console.log('Atualizando empréstimo para:', atualizacao);
        await updateDoc(emprestimoRef, atualizacao);
      } else {
        console.log('Processando devolução completa');
        
        // Atualiza disponibilidade de todas as ferramentas
        await atualizarDisponibilidadeFerramentas(emprestimo.ferramentas, 'devolver');
        
        const atualizacao = {
          status: 'devolvido',
          dataDevolucao: new Date().toISOString(),
          devolvidoPorTerceiros,
          dataUltimaAtualizacao: new Date().toISOString()
        };
        
        console.log('Atualizando empréstimo para:', atualizacao);
        await updateDoc(emprestimoRef, atualizacao);
      }
      
      console.log('Devolução concluída com sucesso');
      
      // Recarrega o estado do item após a devolução
      for (const ferramenta of emprestimo.ferramentas) {
        const nome = typeof ferramenta === 'string' ? ferramenta : ferramenta.nome;
        await corrigirEstadoItem(nome);
      }
    } catch (error) {
      console.error('Erro ao devolver ferramentas:', error);
      throw new Error(`Erro ao devolver ferramentas: ${error.message}`);
    }
  };

  // ===== FUNCIONÁRIOS =====
  // Usar dados do contexto em vez de criar listener duplicado
  const funcionarios = funcionariosData;

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
      console.log('🔄 Atualizando funcionário:', id, dados);
      
      // Buscar funcionário para ver de qual(is) coleção(ões) ele veio
      const funcionario = funcionarios.find(f => f.id === id);
      const origens = funcionario?.origens || [];
      const idsRelacionados = funcionario?.idsRelacionados || [id];
      
      console.log('📋 Funcionário tem origens:', origens);
      console.log('🔗 IDs relacionados:', idsRelacionados);
      
      // Preparar dados para salvar (sem campos internos de controle)
      const dadosParaSalvar = { ...dados };
      delete dadosParaSalvar.origens;
      delete dadosParaSalvar.idsRelacionados;
      
      // Atualizar em todas as coleções de origem
      const promises = [];
      
      // 1️⃣ Tentar atualizar na coleção 'funcionarios'
      if (origens.includes('funcionarios') || !origens.length) {
        try {
          console.log('💾 Salvando em "funcionarios"...');
          promises.push(updateDoc(doc(db, 'funcionarios', id), dadosParaSalvar));
        } catch (error) {
          console.warn('⚠️ Erro ao salvar em "funcionarios":', error);
        }
      }
      
      // 2️⃣ Tentar atualizar na coleção 'usuarios' (PLURAL)
      if (origens.includes('usuarios')) {
        try {
          console.log('💾 Salvando em "usuarios" (plural)...');
          // Buscar o ID correto nesta coleção
          const usuarioId = idsRelacionados.find(idRel => idRel !== id) || id;
          promises.push(updateDoc(doc(db, 'usuarios', usuarioId), dadosParaSalvar));
        } catch (error) {
          console.warn('⚠️ Erro ao salvar em "usuarios":', error);
        }
      }
      
      // 3️⃣ Tentar atualizar na coleção 'usuario' (SINGULAR - legado)
      if (origens.includes('usuario')) {
        try {
          console.log('💾 Salvando em "usuario" (singular)...');
          // Buscar o ID correto nesta coleção
          const usuarioId = idsRelacionados.find(idRel => idRel !== id) || id;
          promises.push(updateDoc(doc(db, 'usuario', usuarioId), dadosParaSalvar));
        } catch (error) {
          console.warn('⚠️ Erro ao salvar em "usuario":', error);
        }
      }
      
      // Se não tem origens definidas, tentar em todas as 3 coleções
      if (!origens.length) {
        console.log('⚠️ Sem origens definidas, tentando todas as coleções...');
        idsRelacionados.forEach(idRel => {
          promises.push(
            updateDoc(doc(db, 'usuarios', idRel), dadosParaSalvar).catch(e => console.log('Não existe em usuarios:', idRel))
          );
          promises.push(
            updateDoc(doc(db, 'usuario', idRel), dadosParaSalvar).catch(e => console.log('Não existe em usuario:', idRel))
          );
        });
      }
      
      // Executar todas as atualizações em paralelo
      await Promise.allSettled(promises);
      console.log('✅ Funcionário atualizado em todas as coleções disponíveis!');
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar funcionário:', error);
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

  // 📋 Configuração das abas baseada no novo sistema de permissões (0-6)
  // Usando useMemo para evitar recriação do array a cada render
  const abas = useMemo(() => [
    {
      id: 'meu-perfil',
      nome: 'Meu Perfil',
      icone: UserCircle,
      permissao: () => true // Todos os usuários autenticados
    },
    {
      id: 'ranking',
      nome: 'Ranking',
      icone: Trophy,
      permissao: () => true // Todos os usuários autenticados
    },
    {
      id: 'notificacoes',
      nome: 'Notificações',
      icone: Bell,
      permissao: () => true // Todos os usuários autenticados
    },
    {
      id: 'mensagens',
      nome: 'Mensagens',
      icone: MessageCircle,
      permissao: () => true // Todos os usuários autenticados
    },
    { 
      id: 'gerenciamento-inventario', 
      nome: 'Inventário & Empréstimos', 
      icone: Package,
      permissao: () => true // Todos os usuários autenticados (abas internas controlam permissões)
    },
    { 
      id: 'funcionarios', 
      nome: 'Funcionários', 
      icone: Users,
      permissao: () => {
        // ADMIN sempre tem acesso TOTAL
        if (usuario?.nivel === NIVEIS_PERMISSAO.ADMIN) return true;
        // Funcionários (nível 1) NÃO podem ver a lista de funcionários
        if (usuario?.nivel === NIVEIS_PERMISSAO.FUNCIONARIO) return false;
        return usuario?.nivel <= NIVEIS_PERMISSAO.GERENTE_GERAL;
      }
    },
    { 
      id: 'empresas-setores', 
      nome: 'Empresas & Setores', 
      icone: Building2,
      permissao: () => {
        // ADMIN sempre tem acesso TOTAL
        if (usuario?.nivel === NIVEIS_PERMISSAO.ADMIN) return true;
        // Funcionários (nível 1) NÃO podem ver empresas e setores
        if (usuario?.nivel === NIVEIS_PERMISSAO.FUNCIONARIO) return false;
        return usuario?.nivel <= NIVEIS_PERMISSAO.GERENTE_GERAL;
      }
    },
    { 
      id: 'system-admin', 
      nome: 'Administração do Sistema', 
      icone: Settings,
      permissao: () => usuario?.nivel === NIVEIS_PERMISSAO.ADMIN // APENAS Admin
    },
    { 
      id: 'feed-social', 
      nome: 'Feed Social', 
      icone: MessageCircle,
      permissao: () => true // Todos os usuários autenticados
    },
    
  ].filter(aba => aba.permissao()), [usuario?.nivel]); // Memorizar baseado no nível do usuário
  
  // Permissões simplificadas usando sistema reversivo com prioridade para ADMIN
  const podeVerUsuarios = () => {
    if (usuario?.nivel === NIVEIS_PERMISSAO.ADMIN) return true; // ADMIN sempre pode
    return usuario?.nivel <= NIVEIS_PERMISSAO.GERENTE_GERAL;
  };
  
  const podeEditarLegal = () => {
    if (usuario?.nivel === NIVEIS_PERMISSAO.ADMIN) return true; // ADMIN sempre pode
    return usuario?.nivel <= NIVEIS_PERMISSAO.SUPERVISOR;
  };

  // Obter aba favorita (item central) com verificação de permissões e fallbacks robustos
  const getAbaFavorita = () => {
    if (!abas || abas.length === 0) return null;
    
    // Primeiro, tentar encontrar a aba favorita configurada
    let favorita = abas.find(aba => aba.id === itemFavorito);
    
    // Se não encontrar, usar fallback baseado no nível do usuário
    if (!favorita) {
      const fallbackPadrao = usuario?.nivel === NIVEIS_PERMISSAO.FUNCIONARIO ? 'meu-perfil' : 'gerenciamento-inventario';
      favorita = abas.find(aba => aba.id === fallbackPadrao);
    }
    
    // Verificar se usuário tem permissão para a aba favorita
    if (favorita && favorita.permissao && typeof favorita.permissao === 'function') {
      if (!favorita.permissao()) {
        console.log(`⚠️ Usuário sem permissão para página favorita: ${favorita.id}`);
        
      // Buscar primeira aba com permissão, priorizando páginas mais importantes
      // Para funcionários, priorizar Meu Perfil
      const abaasPriorizadas = usuario?.nivel === NIVEIS_PERMISSAO.FUNCIONARIO 
        ? ['meu-perfil', 'gerenciamento-inventario', 'tarefas', 'mensagens']
        : ['meu-perfil', 'gerenciamento-inventario', 'funcionarios'];        for (const abaId of abaasPriorizadas) {
          const aba = abas.find(a => a.id === abaId);
          if (aba && (!aba.permissao || aba.permissao())) {
            console.log(`✅ Usando fallback priorizado: ${abaId}`);
            return aba;
          }
        }
        
        // Se nenhuma das priorizadas funcionar, encontrar qualquer aba disponível
        const abaDisponivel = abas.find(aba => {
          if (aba.permissao && typeof aba.permissao === 'function') {
            return aba.permissao();
          }
          return true;
        });
        
        if (abaDisponivel) {
          console.log(`✅ Usando fallback geral: ${abaDisponivel.id}`);
          return abaDisponivel;
        }
        
        // Último recurso: retornar a primeira aba (mesmo sem permissão)
        console.warn('⚠️ Nenhuma aba com permissão encontrada, usando primeira aba');
        return abas[0];
      }
    }
    
    return favorita;
  };

  // Carregar estado ao montar componente - APÓS favorito ser carregado
  useEffect(() => {
    if (!usuario?.id || permissaoAlterada || !favoritoCarregado) return;
    
    console.log('🎯 Inicializando página inicial (favorito carregado)...');
    
    // Só restaura estado se NÃO houver mudança de permissão pendente
    const estadoSalvo = carregarEstadoApp();
    if (estadoSalvo && estadoSalvo.abaAtiva) {
      // Verificar se a aba salva ainda existe e usuário tem permissão
      const abaSalva = abas.find(aba => aba.id === estadoSalvo.abaAtiva);
      if (abaSalva && (!abaSalva.permissao || abaSalva.permissao())) {
        console.log('🔄 Restaurando última página:', estadoSalvo.abaAtiva);
        setAbaAtiva(estadoSalvo.abaAtiva);
        
        // Restaurar posição de scroll
        setTimeout(() => {
          if (estadoSalvo.scrollPosition) {
            window.scrollTo(0, estadoSalvo.scrollPosition);
          }
        }, 100);
        return;
      } else {
        console.log('⚠️ Página salva inválida ou sem permissão:', estadoSalvo.abaAtiva);
      }
    }
    
    // Se não houver estado válido, usar página favorita como inicial
    const abaFavorita = getAbaFavorita();
    const paginaInicial = abaFavorita ? abaFavorita.id : 'gerenciamento-inventario';
    console.log('⭐ Iniciando com página favorita:', paginaInicial);
    setAbaAtiva(paginaInicial);
    
  }, [usuario?.id, carregarEstadoApp, permissaoAlterada, favoritoCarregado, abas]);

  // Resetar estado do favorito quando usuário trocar
  useEffect(() => {
    if (usuario?.id) {
      setFavoritoCarregado(false);
      setMenuPersonalizado(null);
    }
  }, [usuario?.id]);

  // Carregar configuração do menu personalizado do Firebase
  useEffect(() => {
    if (!usuario?.id || abas.length === 0) return;
    
    // Previne recarregar se já tem configuração
    if (menuPersonalizado !== null) return;

    const carregarMenuConfig = async () => {
      try {
        console.log('🔄 Carregando configuração do menu...');
        const usuarioDoc = await getDoc(doc(db, 'usuarios', usuario.id));
        const dados = usuarioDoc.data();
        const menuConfig = dados?.menuConfig;
        
        // Definir favorito padrão baseado no nível do usuário
        const favoritoPadrao = usuario?.nivel === NIVEIS_PERMISSAO.FUNCIONARIO ? 'meu-perfil' : 'emprestimos';
        const favorito = dados?.itemFavorito || favoritoPadrao;
        
        if (menuConfig && menuConfig.length > 0) {
          console.log('✅ Configuração carregada:', { menuConfig, favorito });
          setMenuPersonalizado(menuConfig);
          setItemFavorito(favorito);
          setFavoritoCarregado(true); // Marca favorito como carregado
        } else {
          console.log('📝 Criando configuração padrão...');
          // Configuração padrão: primeiros 4 itens visíveis (exceto ranking e meu-perfil)
          const abasDisponiveis = abas.filter(a => a.id !== 'ranking' && a.id !== 'meu-perfil');
          const configPadrao = abasDisponiveis.map((aba, index) => ({
            id: aba.id,
            visivel: index < 4, // Primeiros 4 visíveis no menu inferior
            ordem: index
          }));
          setMenuPersonalizado(configPadrao);
          setItemFavorito(favoritoPadrao);
          setFavoritoCarregado(true); // Marca favorito como carregado mesmo com padrão
        }
      } catch (error) {
        console.error('❌ Erro ao carregar menu config:', error);
        // Mesmo com erro, definir valores padrão e marcar como carregado
        const favoritoPadrao = usuario?.nivel === NIVEIS_PERMISSAO.FUNCIONARIO ? 'meu-perfil' : 'emprestimos';
        setItemFavorito(favoritoPadrao);
        setFavoritoCarregado(true);
      }
    };

    carregarMenuConfig();
  }, [usuario?.id, abas.length]);

  // Definir página inicial como favorita ao carregar o sistema (apenas uma vez)
  useEffect(() => {
    if (favoritoCarregado && itemFavorito && usuario?.id && !paginaInicialDefinida) {
      console.log('🏠 Definindo página inicial como favorita:', {
        itemFavorito,
        nivelUsuario: usuario?.nivel,
        abaAtiva: abaAtiva
      });
      
      // Iniciar fase de redirecionamento
      setIsRedirecting(true);
      
      // Verificar se a aba favorita é válida e o usuário tem permissão
      const abaFavorita = abas.find(aba => aba.id === itemFavorito);
      if (abaFavorita && abaFavorita.permissao && abaFavorita.permissao()) {
        setAbaAtiva(itemFavorito);
        console.log('✅ Redirecionado para página favorita:', itemFavorito);
      } else {
        // Se não tiver permissão, usar fallback
        const fallbackPadrao = usuario?.nivel === NIVEIS_PERMISSAO.FUNCIONARIO ? 'meu-perfil' : 'emprestimos';
        const abaFallback = abas.find(aba => aba.id === fallbackPadrao);
        if (abaFallback && abaFallback.permissao && abaFallback.permissao()) {
          setAbaAtiva(fallbackPadrao);
          console.log('✅ Redirecionado para fallback:', fallbackPadrao);
        } else {
          // Fallback final: primeira aba disponível
          const primeiraAbaDisponivel = abas.find(aba => aba.permissao && aba.permissao());
          if (primeiraAbaDisponivel) {
            setAbaAtiva(primeiraAbaDisponivel.id);
            console.log('⚠️ Usando primeira aba disponível:', primeiraAbaDisponivel.id);
          }
        }
      }
      
      setPaginaInicialDefinida(true);
      
      // Finalizar fase de redirecionamento após um breve delay
      setTimeout(() => {
        setIsRedirecting(false);
      }, 300);
    }
  }, [favoritoCarregado, itemFavorito, usuario?.id, paginaInicialDefinida, abas]);

  // Resetar flag quando usuário fizer logout
  useEffect(() => {
    if (!usuario) {
      setPaginaInicialDefinida(false);
      setFavoritoCarregado(false);
      setAbaAtiva(null);
    }
  }, [usuario]);

  // Fallback de segurança: Se após 2 segundos ainda não houver aba definida, usar fallback
  // Este useEffect só deve rodar uma vez após o login, não toda vez que abaAtiva muda
  useEffect(() => {
    if (usuario?.id && !abaAtiva && abas.length > 0 && favoritoCarregado) {
      const timer = setTimeout(() => {
        // Verificar novamente se ainda não há aba ativa
        setAbaAtiva(currentAba => {
          // Se já foi definida, não fazer nada
          if (currentAba) {
            console.log('✅ Aba já definida, cancelando timeout:', currentAba);
            return currentAba;
          }
          
          // Se ainda está null, usar fallback
          const fallbackPadrao = usuario?.nivel === NIVEIS_PERMISSAO.FUNCIONARIO ? 'meu-perfil' : 'emprestimos';
          const abaFallback = abas.find(aba => aba.id === fallbackPadrao);
          if (abaFallback && abaFallback.permissao && abaFallback.permissao()) {
            console.log('⚠️ Timeout - Usando fallback de emergência:', fallbackPadrao);
            return fallbackPadrao;
          } else {
            // Se nem o fallback funcionar, usar primeira aba disponível
            const primeiraAbaDisponivel = abas.find(aba => aba.permissao && aba.permissao());
            if (primeiraAbaDisponivel) {
              console.log('⚠️ Timeout - Usando primeira aba disponível:', primeiraAbaDisponivel.id);
              return primeiraAbaDisponivel.id;
            }
          }
          return currentAba;
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [usuario?.id, favoritoCarregado, abas.length]);

  // Salvar configuração do menu no Firebase
  const salvarMenuConfig = async (novaConfig, novoFavorito) => {
    if (!usuario?.id) return;
    
    try {
      const favoritoFinal = novoFavorito || itemFavorito;
      console.log('💾 Salvando configuração...', { 
        menuConfig: novaConfig, 
        itemFavorito: favoritoFinal 
      });
      
      await updateDoc(doc(backupDb, 'usuarios', usuario.id), {
        menuConfig: novaConfig,
        itemFavorito: favoritoFinal
      });
      
      setMenuPersonalizado(novaConfig);
      setItemFavorito(favoritoFinal);
      setMenuConfigSaved(true);
      
      console.log('✅ Configuração salva no Firebase Backup com sucesso!');
      
      // Remove mensagem após 2 segundos
      setTimeout(() => setMenuConfigSaved(false), 2000);
    } catch (error) {
      console.error('❌ Erro ao salvar menu config:', error);
      alert('Erro ao salvar configuração. Tente novamente.');
    }
  };

  // Funções para manipular menu personalizado
  const reordenarMenuItem = (fromIndex, toIndex) => {
    if (!menuPersonalizado) return;
    
    const novosItens = [...menuPersonalizado];
    const [item] = novosItens.splice(fromIndex, 1);
    novosItens.splice(toIndex, 0, item);
    
    // Atualizar ordem
    const comOrdemAtualizada = novosItens.map((item, index) => ({
      ...item,
      ordem: index
    }));
    
    setMenuPersonalizado(comOrdemAtualizada);
  };

  const toggleMenuItemVisibilidade = (itemId) => {
    if (!menuPersonalizado) return;
    
    const novosItens = menuPersonalizado.map(item =>
      item.id === itemId ? { ...item, visivel: !item.visivel } : item
    );
    
    setMenuPersonalizado(novosItens);
  };

  // Funções de drag & drop
  const handleDragStart = (index) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    setDragOverItem(index);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    reordenarMenuItem(draggedItem, index);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  // Obter abas na ordem personalizada
  const getAbasOrdenadas = () => {
    if (!menuPersonalizado) return abas;
    
    const abasMap = new Map(abas.map(aba => [aba.id, aba]));
    return menuPersonalizado
      .sort((a, b) => a.ordem - b.ordem)
      .map(config => abasMap.get(config.id))
      .filter(aba => aba !== undefined); // Garantir que a aba existe
  };

  // Obter abas visíveis no menu inferior
  const getAbasMenuInferior = () => {
    if (!menuPersonalizado) {
      // Configuração padrão se não houver personalização
      return abas
        .filter(a => a.id !== 'ranking' && a.id !== 'meu-perfil' && a.id !== itemFavorito)
        .filter(aba => {
          // Filtrar por permissão
          if (aba.permissao && typeof aba.permissao === 'function') {
            return aba.permissao();
          }
          return true;
        })
        .slice(0, 3);
    }
    
    const abasOrdenadas = getAbasOrdenadas();
    return abasOrdenadas.filter(aba => {
      const config = menuPersonalizado.find(c => c.id === aba.id);
      
      // Verificar permissão
      if (aba.permissao && typeof aba.permissao === 'function') {
        if (!aba.permissao()) {
          return false; // Usuário não tem permissão para ver esta aba
        }
      }
      
      return config?.visivel && aba.id !== itemFavorito; // item favorito tem posição fixa no centro
    });
  };

  // Debug: Monitorar mudanças no menuPersonalizado e itemFavorito
  useEffect(() => {
    if (menuPersonalizado) {
      console.log('🔍 Estado do menu:', { 
        menuPersonalizado, 
        itemFavorito,
        visíveis: menuPersonalizado.filter(m => m.visivel).length 
      });
    }
  }, [menuPersonalizado, itemFavorito]);

  // Verificar permissões da aba atual
  useEffect(() => {
    if (!usuario || !abaAtiva || !abas || abas.length === 0) return;
    
    const abaAtual = abas.find(aba => aba.id === abaAtiva);
    
    // Se a aba tem função de permissão e o usuário não tem acesso
    if (abaAtual && abaAtual.permissao && typeof abaAtual.permissao === 'function') {
      if (!abaAtual.permissao()) {
        console.log(`⚠️ Usuário não tem permissão para acessar "${abaAtiva}", redirecionando...`);
        
        // Buscar primeira aba com permissão
        const abaComPermissao = abas.find(aba => {
          if (aba.permissao && typeof aba.permissao === 'function') {
            return aba.permissao();
          }
          return true;
        });
        
        if (abaComPermissao) {
          setAbaAtiva(abaComPermissao.id);
        } else {
          // Fallback: meu-perfil sempre acessível
          setAbaAtiva('meu-perfil');
        }
      }
    }
  }, [usuario, abaAtiva, abas]);

  // Expõe funções de diagnóstico e persistência no console para facilitar testes
  useEffect(() => {
    window.workflowDebug = {
      diagnosticarInventario,
      corrigirEstadoItem,
      corrigirTodoInventario: async () => {
        const diagnostico = await diagnosticarInventario();
        if (diagnostico.temInconsistencias) {
          console.log('🔧 Corrigindo inconsistências automaticamente...');
          const resultados = [];
          
          for (const item of diagnostico.inconsistencias) {
            console.log(`⚙️ Corrigindo ${item.nome}...`);
            const resultado = await corrigirEstadoItem(item.nome);
            resultados.push({
              item: item.nome,
              sucesso: resultado.sucesso,
              correcao: resultado.correcaoAplicada
            });
          }
          
          console.log('✅ Correção completa!');
          console.table(resultados);
          return resultados;
        } else {
          console.log('✅ Nenhuma correção necessária');
          return [];
        }
      }
    };
    
    // Expor funções de persistência globalmente
    window.workflowPersistence = {
      salvarFormulario: salvarEstadoFormulario,
      carregarFormulario: carregarEstadoFormulario,
      limparEstado: () => {
        localStorage.removeItem(STORAGE_KEY);
        console.log('�️ Estado do aplicativo limpo');
      },
      verEstado: () => {
        const estado = localStorage.getItem(STORAGE_KEY);
        console.log('📋 Estado atual:', estado ? JSON.parse(estado) : null);
      }
    };
    
    console.log('🛠️ Funções disponíveis no console:');
    console.log('  - window.workflowDebug.diagnosticarInventario()');
    console.log('  - window.workflowDebug.corrigirEstadoItem("nome do item")');
    console.log('  - window.workflowDebug.corrigirTodoInventario()');
    console.log('  - window.workflowPersistence.salvarFormulario("abaId", {dados})');
    console.log('  - window.workflowPersistence.carregarFormulario("abaId")');
    console.log('  - window.workflowPersistence.limparEstado()');
    console.log('  - window.workflowPersistence.verEstado()');
    
    return () => {
      delete window.workflowDebug;
      delete window.workflowPersistence;
    };
  }, [salvarEstadoFormulario, carregarEstadoFormulario, STORAGE_KEY]);

  return (
    <FuncionariosProvider>
      <div className="min-h-screen bg-white dark:bg-black transition-colors duration-200">
        {/* Header móvel */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between px-4 h-16">
            <div className="flex items-center w-full relative">
              {/* Logo e título no header mobile */}
              <div className="flex items-center justify-center w-full">
                <div className="flex items-center">
                  <div className="relative w-10 h-10 mr-2">
                    <img src="/logo.png" alt="Logo WorkFlow" className="w-full h-full object-contain relative z-10" />
                  </div>
                  <h1 className="text-base font-bold text-gray-900 dark:text-white">WorkFlow</h1>
                </div>
              </div>
              
              {/* Toggle de tema no canto direito */}
              <div className="absolute right-0">
                <ThemeToggle size="sm" />
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Overlay para mobile */}
      {isMobile && menuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Menu lateral */}
      <nav className={`${
        isMobile 
          ? `fixed top-0 bottom-0 left-0 z-50 w-full h-full transform transition-transform duration-300 ease-in-out ${
              menuOpen ? 'translate-x-0' : '-translate-x-full'
            } bg-white dark:bg-black shadow-lg border-r border-gray-200 dark:border-gray-700`
          : `${menuRecolhido ? 'w-16' : 'w-80'} fixed h-full left-0 transition-all duration-300 ease-in-out bg-white dark:bg-black shadow-lg rounded-lg mt-2 border-r border-gray-200 dark:border-gray-700`
      }`}>
        <div className="flex flex-col h-full">
          {!isMobile && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className={`flex items-center ${menuRecolhido ? 'justify-center w-full' : ''}`}>
                <div className="relative w-12 h-12">
                  <img src="/logo.png" alt="Logo WorkFlow" className="w-full h-full object-contain relative z-10" />
                </div>
                {!menuRecolhido && (
                  <div className="ml-3">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">WorkFlow</h1>
                  </div>
                )}
              </div>
              {!menuRecolhido && (
                <button
                  onClick={() => setMenuRecolhido(!menuRecolhido)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Recolher menu"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-400">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                </button>
              )}
            </div>
          )}
          
          {/* Botão de expandir quando menu recolhido */}
          {!isMobile && menuRecolhido && (
            <div className="p-2 flex justify-center border-b border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setMenuRecolhido(!menuRecolhido)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Expandir menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-400">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            </div>
          )}

          {/* Header personalizado para menu fullscreen mobile */}
          {isMobile && menuOpen && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
              {/* Logo e nome centralizado */}
              <div className="flex-1 flex items-center justify-center">
                <div className="relative w-10 h-10 mr-3">
                  <img src="/logo.png" alt="Logo WorkFlow" className="w-full h-full object-contain relative z-10" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">WorkFlow</h1>
              </div>
              
              {/* Botão X no canto superior direito */}
              <button
                onClick={toggleMenu}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Fechar menu"
              >
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          )}

          {/* Menu em grade para mobile */}
          {isMobile && menuOpen ? (
            <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-4 gap-3">
                {getAbasOrdenadas().map((aba) => {
                  if (!aba || !aba.icone) return null; // Proteção contra abas sem ícone
                  const Icone = aba.icone;
                  return (
                    <button
                      key={aba.id}
                      onClick={() => {
                        setAbaAtiva(aba.id);
                        setMenuOpen(false);
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 aspect-square relative ${
                        abaAtiva === aba.id
                          ? 'bg-blue-500 dark:bg-[#1D9BF0] text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="relative">
                        <Icone className="w-6 h-6 mb-1" />
                        {aba.id === 'notificacoes' && (
                          <MessagesBadge count={notificationUnreadCount} size="sm" max={9} />
                        )}
                        {aba.id === 'mensagens' && (
                          <MessagesBadge count={mensagensNaoLidas} size="sm" max={99} />
                        )}
                      </div>
                      <span className="text-xs font-medium text-center leading-tight">
                        {aba.nome}
                      </span>
                    </button>
                  );
                })}
                
                {/* Botões secundários */}
                <button
                  onClick={() => {
                    setAbaAtiva('suporte');
                    setMenuOpen(false);
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 aspect-square ${
                    abaAtiva === 'suporte'
                      ? 'bg-blue-500 dark:bg-[#1D9BF0] text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 mb-1">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <path d="M12 17h.01"></path>
                  </svg>
                  <span className="text-xs font-medium text-center leading-tight">
                    Suporte
                  </span>
                </button>

                {temPermissao(NIVEIS_PERMISSAO.ADMIN) && (
                  <>
                    <button
                      onClick={() => {
                        setAbaAtiva('usuarios');
                        setMenuOpen(false);
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 aspect-square ${
                        abaAtiva === 'usuarios'
                          ? 'bg-blue-500 dark:bg-[#1D9BF0] text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Users className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium text-center leading-tight">
                        Usuários
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setAbaAtiva('sync-database');
                        setMenuOpen(false);
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 aspect-square ${
                        abaAtiva === 'sync-database'
                          ? 'bg-purple-500 dark:bg-purple-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <RefreshCw className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium text-center leading-tight">
                        Sync DB
                      </span>
                    </button>
                  </>
                )}

                {usuario?.nivel > NIVEIS_PERMISSAO.FUNCIONARIO && (
                  <>
                    <button
                      onClick={() => {
                        setAbaAtiva('dashboard');
                        setMenuOpen(false);
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 aspect-square ${
                        abaAtiva === 'dashboard'
                          ? 'bg-blue-500 dark:bg-[#1D9BF0] text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <BarChart3 className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium text-center leading-tight">
                        Dashboard
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setAbaAtiva('historico-emprestimos');
                        setMenuOpen(false);
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 aspect-square ${
                        abaAtiva === 'historico-emprestimos'
                          ? 'bg-blue-500 dark:bg-[#1D9BF0] text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <History className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium text-center leading-tight">
                        Histórico
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setAbaAtiva('historico-transferencias');
                        setMenuOpen(false);
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 aspect-square ${
                        abaAtiva === 'historico-transferencias'
                          ? 'bg-blue-500 dark:bg-[#1D9BF0] text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <ArrowRight className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium text-center leading-tight">
                        Transferências
                      </span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    setAbaAtiva('legal');
                    setMenuOpen(false);
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 aspect-square ${
                    abaAtiva === 'legal'
                      ? 'bg-blue-500 dark:bg-[#1D9BF0] text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Scale className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium text-center leading-tight">
                    Legal
                  </span>
                </button>
              </div>
            </div>
          ) : (
            /* Menu linear para desktop */
            <div className="flex-1 overflow-y-auto py-2 px-2">
              <div className="space-y-1">
                {abas.filter(aba => aba.permissao()).map((aba) => {
                if (!aba || !aba.icone) return null; // Proteção contra abas sem ícone
                const Icone = aba.icone;
                return (
                  <button
                    key={aba.id}
                    onClick={() => handleDesktopItemClick(aba.id)}
                    onMouseDown={() => startDesktopLongPress(aba.id)}
                    onMouseUp={stopDesktopLongPress}
                    onMouseLeave={stopDesktopLongPress}
                    className={`${menuRecolhido ? 'justify-center' : 'justify-start'} w-full flex items-center ${menuRecolhido ? 'px-0' : 'space-x-3 px-4'} ${isMobile ? 'py-4' : 'py-3'} rounded-full font-medium text-[20px] transition-all duration-200 relative ${
                      abaAtiva === aba.id
                        ? 'bg-blue-500 dark:bg-[#1D9BF0] text-white'
                        : 'text-gray-700 dark:text-[#E7E9EA] hover:bg-gray-100 dark:hover:bg-[#1D9BF0]/10'
                    } ${
                      aba.id === itemFavorito && desktopEditMode 
                        ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-800' 
                        : ''
                    } ${
                      desktopLongPressItem === aba.id 
                        ? 'transform scale-95 bg-gray-200 dark:bg-gray-700' 
                        : ''
                    }`}
                    title={menuRecolhido ? aba.nome : ''}
                  >
                    <div className="relative">
                      <Icone className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0 ${
                        abaAtiva === aba.id 
                          ? 'text-white' 
                          : 'text-gray-700 dark:text-[#E7E9EA] group-hover:text-blue-500 dark:group-hover:text-[#1D9BF0]'
                      }`} />
                      {aba.id === 'notificacoes' && (
                        <MessagesBadge count={notificationUnreadCount} size="md" max={9} />
                      )}
                      {aba.id === 'mensagens' && (
                        <MessagesBadge count={mensagensNaoLidas} size="md" max={99} />
                      )}
                      {/* Indicador de página favorita */}
                      {aba.id === itemFavorito && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-yellow-900 text-xs">★</span>
                        </div>
                      )}
                    </div>
                    {!menuRecolhido && <span>{aba.nome}</span>}
                  </button>
                );
              })}
            </div>
          </div>
          )}

        {/* Botões secundários no modo recolhido */}
        {!isMobile && menuRecolhido && (
          <div className="px-2 py-2 border-t border-gray-200 dark:border-gray-600">
            <div className="space-y-1">
              <button
                onClick={() => setAbaAtiva('suporte')}
                className={`w-full flex justify-center p-2 rounded-lg transition-colors ${
                  abaAtiva === 'suporte'
                    ? 'bg-blue-500 dark:bg-[#1D9BF0] text-white'
                    : 'text-gray-700 dark:text-[#E7E9EA] hover:bg-gray-100 dark:hover:bg-[#1D9BF0]/10'
                }`}
                title="Ajuda"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <path d="M12 17h.01"></path>
                </svg>
              </button>
              
              {temPermissao(NIVEIS_PERMISSAO.ADMIN) && (
                <>
                  <button
                    onClick={() => setAbaAtiva('usuarios')}
                    className={`w-full flex justify-center p-2 rounded-lg transition-colors ${
                      abaAtiva === 'usuarios'
                        ? 'bg-blue-500 dark:bg-[#1D9BF0] text-white'
                        : 'text-gray-700 dark:text-[#E7E9EA] hover:bg-gray-100 dark:hover:bg-[#1D9BF0]/10'
                    }`}
                    title="Usuários"
                  >
                    <Users className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => setAbaAtiva('sync-database')}
                    className={`w-full flex justify-center p-2 rounded-lg transition-colors ${
                      abaAtiva === 'sync-database'
                        ? 'bg-purple-500 text-white'
                        : 'text-gray-700 dark:text-[#E7E9EA] hover:bg-gray-100 dark:hover:bg-[#1D9BF0]/10'
                    }`}
                    title="Sincronização de Banco de Dados"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </>
              )}
              
              {usuario?.nivel > NIVEIS_PERMISSAO.FUNCIONARIO && (
                <>
                  <button
                    onClick={() => setAbaAtiva('dashboard')}
                    className={`w-full flex justify-center p-2 rounded-lg transition-colors ${
                      abaAtiva === 'dashboard'
                        ? 'bg-blue-500 dark:bg-[#1D9BF0] text-white'
                        : 'text-gray-700 dark:text-[#E7E9EA] hover:bg-gray-100 dark:hover:bg-[#1D9BF0]/10'
                    }`}
                    title="Dashboard"
                  >
                    <BarChart3 className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => setAbaAtiva('historico-emprestimos')}
                    className={`w-full flex justify-center p-2 rounded-lg transition-colors ${
                      abaAtiva === 'historico-emprestimos'
                        ? 'bg-blue-500 dark:bg-[#1D9BF0] text-white'
                        : 'text-gray-700 dark:text-[#E7E9EA] hover:bg-gray-100 dark:hover:bg-[#1D9BF0]/10'
                    }`}
                    title="Histórico de Empréstimos"
                  >
                    <History className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => setAbaAtiva('historico-transferencias')}
                    className={`w-full flex justify-center p-2 rounded-lg transition-colors ${
                      abaAtiva === 'historico-transferencias'
                        ? 'bg-blue-500 dark:bg-[#1D9BF0] text-white'
                        : 'text-gray-700 dark:text-[#E7E9EA] hover:bg-gray-100 dark:hover:bg-[#1D9BF0]/10'
                    }`}
                    title="Histórico de Transferências"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </>
              )}
              
              {/* Toggle de tema para mobile */}
              {isMobile && (
                <div className="w-full flex justify-center p-2">
                  <ThemeToggle size="sm" />
                </div>
              )}
              
              <button
                onClick={() => setAbaAtiva('legal')}
                className={`w-full flex justify-center p-2 rounded-lg transition-colors ${
                  abaAtiva === 'legal'
                    ? 'bg-blue-500 dark:bg-[#1D9BF0] text-white'
                    : 'text-gray-700 dark:text-[#E7E9EA] hover:bg-gray-100 dark:hover:bg-[#1D9BF0]/10'
                }`}
                title="Legal"
              >
                <Scale className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setAbaAtiva('relatorios-erro')}
                className={`w-full flex justify-center p-2 rounded-lg transition-colors ${
                  abaAtiva === 'relatorios-erro'
                    ? 'bg-blue-500 dark:bg-[#1D9BF0] text-white'
                    : 'text-gray-700 dark:text-[#E7E9EA] hover:bg-gray-100 dark:hover:bg-[#1D9BF0]/10'
                }`}
                title="Relatórios de Erros"
              >
                <AlertTriangle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {!menuRecolhido && (
          <div className={`${isMobile ? 'fixed' : 'absolute'} bottom-0 left-0 right-0 py-3 px-4 bg-white dark:bg-black rounded-b-lg border-t border-gray-200 dark:border-gray-600`}>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-[#16181C]">
              {funcionarioInfo?.photoURL ? (
                <img src={funcionarioInfo.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : usuario.photoURL ? (
                <img src={usuario.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-full h-full p-2 text-gray-600 dark:text-[#71767B]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-gray-900 dark:text-[#E7E9EA] truncate leading-tight">
                {funcionarioInfo?.nome || usuario.nome}
              </p>
              <p className="text-sm text-gray-500 dark:text-[#71767B] truncate leading-tight">
                {usuario.nivel === NIVEIS_PERMISSAO.ADMIN ? 
                  NIVEIS_LABELS[usuario.nivel] : 
                  (funcionarioInfo?.funcao || usuario.cargo || NIVEIS_LABELS[usuario.nivel])}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {/* Toggle de tema para desktop */}
              {!isMobile && (
                <ThemeToggle size="sm" />
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  logout();
                  setMenuOpen(false);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onMouseLeave={(e) => e.stopPropagation()}
                className="p-2 rounded-full hover:bg-red-500/10 transition-colors"
                title="Sair"
              >
                <LogOut className="w-5 h-5 text-gray-900 dark:text-[#E7E9EA]" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileModal(true);
                  setMenuOpen(false);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onMouseLeave={(e) => e.stopPropagation()}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-[#1D9BF0]/10 transition-colors"
                title="Editar perfil"
              >
                <Edit className="w-5 h-5 text-gray-900 dark:text-[#E7E9EA]" />
              </button>
            </div>
          </div>
          
          {/* Botões de Suporte e Usuários - apenas no desktop */}
          {!isMobile && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAbaAtiva('suporte');
                    setMenuOpen(false);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  onMouseLeave={(e) => e.stopPropagation()}
                  className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-[#1D9BF0]/10 transition-colors"
                  title="Ajuda"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900 dark:text-[#E7E9EA]"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                </button>
                {/* Usuários - Apenas Admin */}
                {temPermissao(NIVEIS_PERMISSAO.ADMIN) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAbaAtiva('usuarios');
                      setMenuOpen(false);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onMouseLeave={(e) => e.stopPropagation()}
                    className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-[#1D9BF0]/10 transition-colors"
                    title="Usuários"
                  >
                    <Users className="w-5 h-5 text-gray-900 dark:text-[#E7E9EA]" />
                  </button>
                )}
                {/* Dashboard, Históricos - Apenas Admin (Gerente, Supervisor e Encarregado NÃO veem) */}
                {temPermissao(NIVEIS_PERMISSAO.ADMIN) && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAbaAtiva('dashboard');
                        setMenuOpen(false);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onMouseUp={(e) => e.stopPropagation()}
                      onMouseLeave={(e) => e.stopPropagation()}
                      className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-[#1D9BF0]/10 transition-colors"
                      title="Dashboard"
                    >
                      <BarChart3 className="w-5 h-5 text-gray-900 dark:text-[#E7E9EA]" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAbaAtiva('historico-emprestimos');
                        setMenuOpen(false);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onMouseUp={(e) => e.stopPropagation()}
                      onMouseLeave={(e) => e.stopPropagation()}
                      className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-[#1D9BF0]/10 transition-colors"
                      title="Histórico de Empréstimos"
                    >
                      <History className="w-5 h-5 text-gray-900 dark:text-[#E7E9EA]" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAbaAtiva('historico-transferencias');
                        setMenuOpen(false);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onMouseUp={(e) => e.stopPropagation()}
                      onMouseLeave={(e) => e.stopPropagation()}
                      className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-[#1D9BF0]/10 transition-colors"
                      title="Histórico de Transferências"
                    >
                      <ArrowRight className="w-5 h-5 text-gray-900 dark:text-[#E7E9EA]" />
                    </button>
                  </>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAbaAtiva('legal');
                    setMenuOpen(false);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  onMouseLeave={(e) => e.stopPropagation()}
                  className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-[#1D9BF0]/10 transition-colors"
                  title="Legal"
                >
                  <Scale className="w-5 h-5 text-gray-900 dark:text-[#E7E9EA]" />
                </button>
              </div>
            </div>
          )}
        </div>
        )}
        </div>
      </nav>

      {/* Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userId={usuario.id}
      />



      <main className={`${isMobile ? 'pt-16 pb-20' : `${menuRecolhido ? 'pl-16' : 'pl-80'} transition-all duration-300 ease-in-out`} w-full h-screen overflow-hidden bg-white dark:bg-black`}>
        <div className={`h-full ${abaAtiva === 'mensagens' ? '' : 'max-w-5xl mx-auto px-4 overflow-y-auto'}`}>
          <div className={abaAtiva === 'mensagens' ? 'h-full' : 'py-3'}>

            {abaAtiva === 'dashboard' && (
              temPermissao(NIVEIS_PERMISSAO.ADMIN) ? (
                <DashboardTab stats={stats} />
              ) : (
                <PermissionDenied message="Você não tem permissão para visualizar o dashboard." />
              )
            )}

            {abaAtiva === 'analytics' && (
              hasManagementPermission(usuario?.nivel) ? (
                <AnalyticsTab />
              ) : (
                <PermissionDenied message="Você não tem permissão para visualizar as análises do sistema." />
              )
            )}

            {abaAtiva === 'legal' && <LegalTab />}

            {abaAtiva === 'dashboard' && <Dashboard stats={stats} />}
            
            {abaAtiva === 'meu-perfil' && <ProfileTab />}

            {abaAtiva === 'system-admin' && (
              temPermissao(NIVEIS_PERMISSAO.ADMIN) ? (
                <SystemAdminPage />
              ) : (
                <PermissionDenied message="Você não tem permissão para acessar a administração do sistema." />
              )
            )}

            {abaAtiva === 'gerenciamento-inventario' && (
              <GerenciamentoInventario
                // Props de Inventário
                inventario={inventario}
                emprestimos={emprestimos}
                adicionarItem={adicionarItem}
                removerItem={removerItem}
                atualizarItem={atualizarItem}
                reimportarInventario={reimportarInventario}
                corrigirInventario={corrigirInventario}
                obterDetalhesEmprestimos={obterDetalhesEmprestimos}
                // Props de Compras
                compras={compras}
                adicionarCompra={adicionarCompra}
                removerCompra={removerCompra}
                atualizarCompra={atualizarCompra}
                // Props de Ferramentas Danificadas
                ferramentasDanificadas={ferramentasDanificadas}
                adicionarFerramentaDanificada={adicionarFerramentaDanificada}
                atualizarFerramentaDanificada={atualizarFerramentaDanificada}
                removerFerramentaDanificada={removerFerramentaDanificada}
                // Props de Ferramentas Perdidas
                ferramentasPerdidas={ferramentasPerdidas}
                adicionarFerramentaPerdida={adicionarFerramentaPerdida}
                atualizarFerramentaPerdida={atualizarFerramentaPerdida}
                removerFerramentaPerdida={removerFerramentaPerdida}
                // Props de Empréstimos
                funcionarios={funcionarios}
                adicionarEmprestimo={adicionarEmprestimo}
                removerEmprestimo={removerEmprestimo}
                atualizarEmprestimo={atualizarEmprestimo}
                devolverFerramentas={devolverFerramentas}
                emprestimosCarregados={emprestimosCarregados}
              />
            )}
            
            {abaAtiva === 'funcionarios' && (
              <GerenciamentoFuncionarios
                funcionarios={funcionarios}
                adicionarFuncionario={adicionarFuncionario}
                removerFuncionario={removerFuncionario}
                atualizarFuncionario={atualizarFuncionario}
                readonly={!PermissionChecker.canManageEmployees(usuario?.nivel)}
              />
            )}

            {abaAtiva === 'empresas-setores' && (
              <GerenciamentoIntegrado usuarioAtual={usuario} />
            )}

            {abaAtiva === 'ranking' && (
              <RankingPontos />
            )}

            {abaAtiva === 'notificacoes' && (
              <NotificationsPage onNavigate={setAbaAtiva} />
            )}

            {abaAtiva === 'mensagens' && (
              <MensagensMain />
            )}

            {abaAtiva === 'historico-emprestimos' && (
              usuario?.nivel === NIVEIS_PERMISSAO.ADMIN ? (
                <HistoricoEmprestimosTab
                  emprestimos={emprestimos}
                  devolverFerramentas={devolverFerramentas}
                  removerEmprestimo={removerEmprestimo}
                  atualizarDisponibilidade={() => true}
                  inventario={inventario}
                />
              ) : (
                <PermissionDenied message="Apenas administradores podem visualizar o histórico de empréstimos." />
              )
            )}

            {abaAtiva === 'usuarios' && (
              temPermissao(NIVEIS_PERMISSAO.ADMIN) ? (
                <UsuariosTab />
              ) : (
                <PermissionDenied message="Apenas administradores podem gerenciar usuários do sistema." />
              )
            )}

            {abaAtiva === 'sync-database' && (
              temPermissao(NIVEIS_PERMISSAO.ADMIN) ? (
                <DatabaseSyncManager />
              ) : (
                <PermissionDenied message="Apenas administradores podem sincronizar bancos de dados." />
              )
            )}

            {abaAtiva === 'historico-transferencias' && (
              temPermissao(NIVEIS_PERMISSAO.ADMIN) ? (
                <HistoricoTransferenciasTab />
              ) : (
                <PermissionDenied message="Apenas administradores podem visualizar o histórico de transferências." />
              )
            )}

            {abaAtiva === 'suporte' && (
              <SupportTab />
            )}
          </div>
        </div>
      </main>

      {/* Menu inferior para mobile */}
      {isMobile && !menuOpen && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-600 px-2 py-0.5">
          <div className="flex justify-around items-center">
            {/* Itens personalizáveis do menu inferior */}
            {getAbasMenuInferior().slice(0, 2).map((aba) => {
              if (!aba || !aba.icone) return null; // Proteção contra abas sem ícone
              const Icone = aba.icone;
              return (
                <button
                  key={aba.id}
                  onClick={() => {
                    setAbaAtiva(aba.id);
                    setMenuOpen(false);
                  }}
                  className={`flex flex-col items-center justify-center p-1 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
                    abaAtiva === aba.id
                      ? 'text-blue-500 dark:text-[#1D9BF0]'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Icone className={`w-4 h-4 mb-0.5 ${
                    abaAtiva === aba.id 
                      ? 'text-blue-500 dark:text-[#1D9BF0]' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  <span className="text-xs font-medium truncate w-full text-center leading-tight">
                    {aba.nome}
                  </span>
                </button>
              );
            })}
            
            {/* Ícone favorito no centro com fundo azul circular - 20% para cima com efeitos minimalistas */}
            {(() => {
              const abaFavorita = getAbaFavorita();
              if (!abaFavorita || !abaFavorita.icone) return null; // Proteção contra aba sem ícone
              const IconeFavorito = abaFavorita.icone;
              return (
                <button
                  onClick={() => {
                    setAbaAtiva(abaFavorita.id);
                    setMenuOpen(false);
                  }}
                  className="flex flex-col items-center justify-center p-1 transition-all duration-200 min-w-0 flex-1 transform -translate-y-[20%] hover:scale-105"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-0.5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-200 dark:hover:shadow-blue-900 ${
                    abaAtiva === abaFavorita.id
                      ? 'bg-blue-500 dark:bg-[#1D9BF0] shadow-lg'
                      : 'bg-blue-500 dark:bg-[#1D9BF0]'
                  }`}>
                    <IconeFavorito className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-xs font-medium text-center leading-tight ${
                    abaAtiva === abaFavorita.id
                      ? 'text-blue-500 dark:text-[#1D9BF0]'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {abaFavorita.nome}
                  </span>
                </button>
              );
            })()}

            {/* Próximos 1 ícone à direita */}
            {getAbasMenuInferior().slice(2, 3).map((aba) => {
              if (!aba || !aba.icone) return null; // Proteção contra abas sem ícone
              const Icone = aba.icone;
              return (
                <button
                  key={aba.id}
                  onClick={() => {
                    setAbaAtiva(aba.id);
                    setMenuOpen(false);
                  }}
                  className={`flex flex-col items-center justify-center p-1 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
                    abaAtiva === aba.id
                      ? 'text-blue-500 dark:text-[#1D9BF0]'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Icone className={`w-4 h-4 mb-0.5 ${
                    abaAtiva === aba.id 
                      ? 'text-blue-500 dark:text-[#1D9BF0]' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  <span className="text-xs font-medium truncate w-full text-center leading-tight">
                    {aba.nome}
                  </span>
                </button>
              );
            })}

            {/* Botão de menu com long press para configurar */}
            <button
              onClick={toggleMenu}
              onTouchStart={(e) => {
                e.preventDefault();
                const timer = setTimeout(() => {
                  setShowMenuConfig(true);
                  setMenuLongPressProgress(0);
                }, 500); // Reduzido para 0.5 segundo
                setMenuLongPressTimer(timer);
                
                // Animação de progresso (20% a cada 100ms = 5 frames = 500ms)
                let progress = 0;
                const progressInterval = setInterval(() => {
                  progress += 20;
                  setMenuLongPressProgress(progress);
                  if (progress >= 100) {
                    clearInterval(progressInterval);
                  }
                }, 100);
              }}
              onTouchEnd={() => {
                if (menuLongPressTimer) {
                  clearTimeout(menuLongPressTimer);
                  setMenuLongPressTimer(null);
                }
                setMenuLongPressProgress(0);
              }}
              onTouchMove={() => {
                if (menuLongPressTimer) {
                  clearTimeout(menuLongPressTimer);
                  setMenuLongPressTimer(null);
                }
                setMenuLongPressProgress(0);
              }}
              className="flex flex-col items-center justify-center p-1 rounded-lg transition-all duration-200 min-w-0 flex-1 text-gray-500 dark:text-gray-400 relative"
            >
              {menuLongPressProgress > 0 && (
                <div 
                  className="absolute inset-0 bg-blue-500 dark:bg-[#1D9BF0] opacity-20 rounded-lg transition-all"
                  style={{ 
                    clipPath: `inset(${100 - menuLongPressProgress}% 0 0 0)`
                  }}
                />
              )}
              <MenuIcon className="w-4 h-4 mb-0.5 relative z-10" />
              <span className="text-xs font-medium truncate w-full text-center leading-tight relative z-10">
                Menu
              </span>
            </button>
          </div>
        </nav>
      )}

      {/* Modal de Configuração do Menu */}
      {showMenuConfig && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Personalizar Menu
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {desktopEditMode 
                    ? `Configure o item selecionado: ${desktopLongPressItem || 'Menu'}`
                    : 'Escolha quais itens aparecem no menu inferior e sua ordem'
                  }
                </p>
              </div>
              <button
                onClick={() => {
                  setShowMenuConfig(false);
                  setDesktopEditMode(false);
                  setDesktopLongPressItem(null);
                }}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Seletor de Página Favorita */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Página Favorita</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {desktopEditMode 
                        ? 'Clique para definir como página favorita'
                        : 'Aparece destacada no centro do menu inferior'
                      }
                    </p>
                  </div>
                </div>
                {desktopEditMode && desktopLongPressItem ? (
                  <button
                    onClick={() => {
                      setItemFavorito(desktopLongPressItem);
                      // Auto-salvar quando em modo de edição desktop
                      setTimeout(async () => {
                        await salvarMenuConfig(menuPersonalizado, desktopLongPressItem);
                        setShowMenuConfig(false);
                        setDesktopEditMode(false);
                        setDesktopLongPressItem(null);
                      }, 300);
                    }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Trophy className="w-5 h-5" />
                    Definir "{abas.find(aba => aba.id === desktopLongPressItem)?.nome}" como Favorita
                  </button>
                ) : (
                  <select
                    value={itemFavorito}
                    onChange={(e) => setItemFavorito(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600 rounded-lg text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {abas.map((aba) => (
                      <option key={aba.id} value={aba.id}>
                        {aba.nome}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Lista de Itens */}
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <GripVertical className="w-5 h-5 text-gray-400" />
                Arraste para Reordenar
              </h3>
              <div className="space-y-3">
                {menuPersonalizado && getAbasOrdenadas().map((aba, index) => {
                    const config = menuPersonalizado.find(c => c.id === aba.id);
                    const Icone = aba.icone;
                    const isDragging = draggedItem === index;
                    const isDragOver = dragOverItem === index;
                    
                    return (
                      <div
                        key={aba.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-move ${
                          isDragging 
                            ? 'opacity-50 scale-95'
                            : isDragOver
                              ? 'border-yellow-400 dark:border-yellow-500 shadow-lg scale-105'
                              : desktopEditMode && desktopLongPressItem === aba.id
                                ? 'bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border-purple-400 dark:border-purple-500 shadow-xl ring-2 ring-purple-300 dark:ring-purple-600'
                                : config?.visivel
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400'
                                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        } ${aba.id === itemFavorito ? 'ring-2 ring-yellow-400 ring-offset-2 dark:ring-offset-gray-900' : ''}`}
                      >
                        {/* Drag handle */}
                        <div className="flex items-center justify-center">
                          <GripVertical className={`w-6 h-6 ${
                            config?.visivel
                              ? 'text-blue-400 dark:text-blue-300'
                              : 'text-gray-400 dark:text-gray-500'
                          }`} />
                        </div>

                        {/* Ícone e nome */}
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${
                            config?.visivel
                              ? 'bg-blue-500 dark:bg-blue-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                          }`}>
                            <Icone className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className={`font-medium ${
                                config?.visivel
                                  ? 'text-gray-900 dark:text-white'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {aba.nome}
                              </p>
                              {desktopEditMode && desktopLongPressItem === aba.id && (
                                <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
                                  <MousePointer className="w-3 h-3" />
                                  Selecionado
                                </span>
                              )}
                              {aba.id === itemFavorito && (
                                <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full flex items-center gap-1">
                                  <Trophy className="w-3 h-3" />
                                  Favorito
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Posição: {index + 1}
                            </p>
                          </div>
                        </div>

                        {/* Toggle visibilidade */}
                        <button
                          onClick={() => toggleMenuItemVisibilidade(aba.id)}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                            config?.visivel
                              ? 'bg-blue-500 dark:bg-blue-600'
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                              config?.visivel ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
              </div>

              {/* Preview do menu inferior */}
              <div className="mt-8 p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-gray-300 dark:border-gray-700">
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview do Menu Inferior:
                </p>
                <div className="flex justify-around items-center bg-white dark:bg-black rounded-xl p-2 border-2 border-gray-300 dark:border-gray-600 shadow-lg">
                  {getAbasMenuInferior().slice(0, 2).map((aba) => {
                    const Icone = aba.icone;
                    return (
                      <div key={aba.id} className="flex flex-col items-center p-2 flex-1">
                        <Icone className="w-4 h-4 text-gray-500 dark:text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-full">{aba.nome}</span>
                      </div>
                    );
                  })}
                  {(() => {
                    const abaFavorita = getAbaFavorita();
                    const IconeFavorito = abaFavorita.icone;
                    return (
                      <div className="flex flex-col items-center p-2 flex-1 relative">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-1 shadow-lg ring-2 ring-blue-300 dark:ring-blue-700">
                          <IconeFavorito className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs text-blue-500 dark:text-blue-400 font-bold truncate max-w-full">{abaFavorita.nome}</span>
                        <div className="absolute -top-1 -right-1">
                          <Trophy className="w-3 h-3 text-yellow-500" />
                        </div>
                      </div>
                    );
                  })()}
                  {getAbasMenuInferior().slice(2, 3).map((aba) => {
                    const Icone = aba.icone;
                    return (
                      <div key={aba.id} className="flex flex-col items-center p-2 flex-1">
                        <Icone className="w-4 h-4 text-gray-500 dark:text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-full">{aba.nome}</span>
                      </div>
                    );
                  })}
                  <div className="flex flex-col items-center p-2 flex-1">
                    <MenuIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Menu</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowMenuConfig(false);
                  setDesktopEditMode(false);
                  setDesktopLongPressItem(null);
                }}
                className="px-6 py-2.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {desktopEditMode ? 'Fechar' : 'Cancelar'}
              </button>
              {!desktopEditMode && (
                <button
                  onClick={async () => {
                    await salvarMenuConfig(menuPersonalizado, itemFavorito);
                    setTimeout(() => setShowMenuConfig(false), 500);
                  }}
                  className="px-6 py-2.5 rounded-full bg-blue-500 dark:bg-blue-600 text-white font-medium hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
                >
                  {menuConfigSaved ? (
                    <>
                      <Check className="w-4 h-4" />
                      Salvo!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Configuração
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alerta de Alteração de Permissão */}
      {showPermissionAlert && permissionAlertData && (
        <div className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-300">
            {/* Header com Ícone */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Nível de Acesso Alterado
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Suas permissões foram atualizadas
                  </p>
                </div>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-gray-700 dark:text-gray-200 text-center font-medium">
                  Seu nível de acesso foi alterado para:
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 text-center mt-2">
                  ⚡ {permissionAlertData.newLevelLabel}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Você será redirecionado para a página de <strong>notificações</strong> para ver os detalhes desta alteração.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowPermissionAlert(false);
                  setAbaAtiva('notificacoes');
                  console.log('🔔 Redirecionando para notificações após alteração de permissão');
                  
                  // Marcar no localStorage que o usuário já viu o alerta
                  localStorage.setItem(`permission_alert_seen_${usuario.id}_${permissionAlertData.newLevel}`, 'true');
                  
                  // Após 1 segundo, limpar flag para permitir restauração de estado
                  setTimeout(() => {
                    setPermissaoAlterada(false);
                    console.log('✅ Flag de permissão alterada limpa. Sistema pode restaurar estado normal.');
                  }, 1000);
                }}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold text-lg shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </FuncionariosProvider>
  );
};

// Componente principal da aplicação
const App = () => {
  useDevToolsProtection();
  const { usuario, loading } = useAuth();
  const [sistemaInicializado, setSistemaInicializado] = useState(false);
  const [fadeOutLoading, setFadeOutLoading] = useState(false);
  const [mostrarConteudo, setMostrarConteudo] = useState(false);

  // Aguardar a inicialização completa antes de mostrar conteúdo
  useEffect(() => {
    if (!loading) {
      console.log('🎯 Sistema carregado, iniciando transição suave...');
      
      // Aguardar um pouco para garantir que a barra chegou a 100%
      const delayInicial = setTimeout(() => {
        console.log('✅ Iniciando fade-out da tela de loading...');
        setSistemaInicializado(true);
        
        // Iniciar fade-out
        setFadeOutLoading(true);
        
        // Aguardar animação de fade-out antes de mostrar conteúdo
        setTimeout(() => {
          console.log('🚀 Mostrando conteúdo principal...');
          setMostrarConteudo(true);
        }, 600); // Tempo para completar fade-out
      }, 800); // Delay inicial após loading = false
      
      return () => clearTimeout(delayInicial);
    }
  }, [loading]);

  // Mostrar loading até sistema estar completamente pronto
  if (loading || !mostrarConteudo) {
    return <LoadingScreen fadeOut={fadeOutLoading} />;
  }

  // Renderizar conteúdo com fade-in suave
  return (
    <div className="animate-fadeIn min-h-screen bg-gray-50 dark:bg-gray-900">
      {usuario ? <AlmoxarifadoSistema /> : <LoginForm />}
    </div>
  );
};

// Componente principal com Provider
const Seed = () => {
  // Inicializar hook de notificações
  
  // Ativar bloqueios de segurança
  useSecurityBlock();
  
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DatabaseRotationProvider>
          <ToastProvider>
            <FuncionariosProvider>
              <NotificationProvider>
                <MessageNotificationProvider>
                  <AnalyticsProvider>
                    <App />
                    <PWAUpdateAvailable />
                    <AppUpdateModal />
                  </AnalyticsProvider>
                </MessageNotificationProvider>
              </NotificationProvider>
            </FuncionariosProvider>
          </ToastProvider>
        </DatabaseRotationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

// Export do hook useAuth e componente principal
export { useAuth };
export default Seed;

