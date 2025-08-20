// AlmoxarifadoJardim.jsx - VERSÃO COMPLETA IMPLEMENTADA
import React, { useState, useEffect, createContext, useContext } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import InventarioTab from './Inventario/InventarioTab';
import { inventarioInicial } from '../data/inventarioInicial';
import EmprestimosTab from './Emprestimos/EmprestimosTab';
import FuncionariosTab from './Funcionarios/FuncionariosTab';
import UsuariosTab from './usuarios/UsuariosTab';
import FerramentasDanificadasTab from './Danificadas/FerramentasDanificadasTab';
import FerramentasPerdidasTab from './Perdidas/FerramentasPerdidasTab';
import ComprasTab from './Compras/ComprasTab';
import { AuthContext, useAuth } from '../hooks/useAuth';
import { Moon, Sun } from 'lucide-react';
import { 
  Package, 
  Users, 
  ClipboardList, 
  AlertTriangle, 
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
  UserCog,
  ShoppingCart,
  X,
  Save,
  Check,
} from 'lucide-react';

// ===== CLASSES CSS PADRONIZADAS PARA O TEMA =====
const themeClasses = {
  // Containers principais
  container: 'bg-white dark:bg-gray-800 transition-colors duration-200',
  containerSecondary: 'bg-gray-50 dark:bg-gray-700 transition-colors duration-200',
  
  // Cards e painéis
  card: 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-200',
  cardHover: 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md dark:hover:shadow-gray-900/20 transition-all duration-200',
  
  // Textos
  textPrimary: 'text-gray-900 dark:text-white transition-colors duration-200',
  textSecondary: 'text-gray-600 dark:text-gray-300 transition-colors duration-200',
  textMuted: 'text-gray-500 dark:text-gray-400 transition-colors duration-200',
  textLight: 'text-gray-400 dark:text-gray-500 transition-colors duration-200',
  
  // Inputs e formulários
  input: 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-200',
  inputGroup: 'bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 transition-colors duration-200',
  
  // Botões
  buttonPrimary: 'text-white font-medium rounded-lg transition-colors duration-200 hover:opacity-90',
  buttonSecondary: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200',
  buttonDanger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 font-medium rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors duration-200',
  buttonSuccess: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 font-medium rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors duration-200',
  buttonWarning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 font-medium rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors duration-200',
  
  // Tabelas
  table: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-colors duration-200',
  tableHeader: 'bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 transition-colors duration-200',
  tableHeaderCell: 'text-gray-700 dark:text-gray-200 font-medium transition-colors duration-200',
  tableRow: 'border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200',
  tableCell: 'text-gray-900 dark:text-gray-100 transition-colors duration-200',
  
  // Navegação
  navTab: 'border-b-2 font-medium text-sm transition-colors duration-200 whitespace-nowrap',
  navTabActive: 'text-gray-700 dark:text-gray-200 transition-colors duration-200',
  navTabInactive: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600',
  
  // Alerts e notificações
  alertSuccess: 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 transition-colors duration-200',
  alertError: 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 transition-colors duration-200',
  alertWarning: 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 transition-colors duration-200',
  alertInfo: 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 transition-colors duration-200',
  
  // Modals e overlays
  modal: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl transition-colors duration-200',
  overlay: 'bg-black bg-opacity-50 dark:bg-opacity-70 transition-opacity duration-200',
  
  // Badges e status
  badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-200',
  badgeSuccess: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  badgeError: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  badgeWarning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
  badgeInfo: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  badgeGray: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
  
  // Dividers
  divider: 'border-gray-200 dark:border-gray-700',
  
  // Backgrounds gerais
  backgroundPrimary: 'bg-gray-50 dark:bg-gray-900 transition-colors duration-200',
  backgroundSecondary: 'bg-gray-100 dark:bg-gray-800 transition-colors duration-200',
  
  // Sidebar e navegação lateral
  sidebar: 'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-colors duration-200',
  sidebarItem: 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200',
  sidebarItemActive: 'text-white dark:text-white transition-colors duration-200',

  // Formulários específicos
  formLabel: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200',
  formSelect: 'w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-200',
  formTextarea: 'w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:border-transparent resize-none transition-colors duration-200',
  
  // Headers de seção
  sectionHeader: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200',
  sectionTitle: 'text-xl font-bold text-gray-800 dark:text-white transition-colors duration-200',
  sectionSubtitle: 'text-gray-600 dark:text-gray-300 transition-colors duration-200',

  // Estatísticas
  statCard: 'p-4 rounded-lg transition-colors duration-200',
  statCardWhite: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
  statCardBlue: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800',
  statCardGreen: 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800',
  statCardYellow: 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800',
  statCardRed: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800',
  statCardPurple: 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800',
  statCardOrange: 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800',
  
  // Textos das estatísticas
  statValue: 'text-2xl font-bold transition-colors duration-200',
  statLabel: 'text-sm font-medium transition-colors duration-200',
  statValueBlue: 'text-blue-900 dark:text-blue-300',
  statLabelBlue: 'text-blue-600 dark:text-blue-400',
  statValueGreen: 'text-green-900 dark:text-green-300',
  statLabelGreen: 'text-green-600 dark:text-green-400',
  statValueYellow: 'text-yellow-900 dark:text-yellow-300',
  statLabelYellow: 'text-yellow-600 dark:text-yellow-400',
  statValueRed: 'text-red-900 dark:text-red-300',
  statLabelRed: 'text-red-600 dark:text-red-400',
  statValuePurple: 'text-purple-900 dark:text-purple-300',
  statLabelPurple: 'text-purple-600 dark:text-purple-400',
  statValueOrange: 'text-orange-900 dark:text-orange-300',
  statLabelOrange: 'text-orange-600 dark:text-orange-400',
};

// ===== SISTEMA DE COOKIES =====
const CookieManager = {
  setCookie: (name, value, days = 30) => {
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      const expiresString = expires.toUTCString();
      
      const cookieValue = typeof value === 'object' ? JSON.stringify(value) : value;
      
      document.cookie = `${name}=${encodeURIComponent(cookieValue)};expires=${expiresString};path=/;SameSite=Strict`;
      
      console.log(`Cookie ${name} definido com sucesso`);
      return true;
    } catch (error) {
      console.error('Erro ao definir cookie:', error);
      return false;
    }
  },

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

// ===== SISTEMA DE TEMA (MODO ESCURO) COM COR #bd9967 =====
const ThemeManager = {
  setTheme: (theme) => {
    try {
      CookieManager.setCookie('almoxarifado_theme', theme, 365); // 1 ano
      document.documentElement.classList.toggle('dark', theme === 'dark');
      console.log(`Tema ${theme} aplicado com sucesso`);
      return true;
    } catch (error) {
      console.error('Erro ao definir tema:', error);
      return false;
    }
  },

  getTheme: () => {
    try {
      const savedTheme = CookieManager.getCookie('almoxarifado_theme');
      if (savedTheme) {
        return savedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (error) {
      console.error('Erro ao obter tema:', error);
      return 'light';
    }
  },

  initTheme: () => {
    try {
      const theme = ThemeManager.getTheme();
      document.documentElement.classList.toggle('dark', theme === 'dark');
      return theme;
    } catch (error) {
      console.error('Erro ao inicializar tema:', error);
      return 'light';
    }
  },

  toggleTheme: (currentTheme) => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    ThemeManager.setTheme(newTheme);
    return newTheme;
  }
};

// ===== CONTEXT E PROVIDER DE TEMA =====
const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const initialTheme = ThemeManager.initTheme();
    setTheme(initialTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const savedTheme = CookieManager.getCookie('almoxarifado_theme');
      if (!savedTheme) {
        const systemTheme = e.matches ? 'dark' : 'light';
        ThemeManager.setTheme(systemTheme);
        setTheme(systemTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    const newTheme = ThemeManager.toggleTheme(theme);
    setTheme(newTheme);
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    classes: themeClasses
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// ===== HOOK PARA USAR O TEMA =====
const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

// ===== COMPONENTE BOTÃO DE ALTERNAR TEMA COM COR #bd9967 =====
const ThemeToggle = () => {
  const { theme, toggleTheme, classes } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-2 px-3 py-2 text-sm ${classes.buttonSecondary}`}
      title={`Alternar para modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-4 h-4" />
          Modo Claro
        </>
      ) : (
        <>
          <Moon className="w-4 h-4" />
          Modo Escuro
        </>
      )}
    </button>
  );
};

// ===== NÍVEIS DE PERMISSÃO =====
export const NIVEIS_PERMISSAO = {
  FUNCIONARIO: 1,
  SUPERVISOR: 2,
  GERENTE: 3,
  ADMIN: 4
};

export const NIVEIS_LABELS = {
  1: 'Funcionário',
  2: 'Supervisor/Encarregado', 
  3: 'Gerente',
  4: 'Administrador'
};

// ===== SISTEMA DE PERMISSÕES =====
export const PermissionChecker = {
  canView: (userLevel, section) => {
    return userLevel >= NIVEIS_PERMISSAO.FUNCIONARIO;
  },
  canManageOperational: (userLevel) => {
    return userLevel > NIVEIS_PERMISSAO.FUNCIONARIO;
  },
  canManageEmployees: (userLevel) => {
    return userLevel > NIVEIS_PERMISSAO.FUNCIONARIO;
  },
  canManageUsers: (userLevel) => {
    return userLevel > NIVEIS_PERMISSAO.FUNCIONARIO && userLevel >= NIVEIS_PERMISSAO.GERENTE;
  },
  canCreateUserLevel: (userLevel, targetLevel) => {
    if (userLevel === NIVEIS_PERMISSAO.FUNCIONARIO) return false;
    if (userLevel === NIVEIS_PERMISSAO.ADMIN) return true;
    if (userLevel === NIVEIS_PERMISSAO.GERENTE) {
      return targetLevel <= NIVEIS_PERMISSAO.SUPERVISOR;
    }
    return false;
  },
  canEditUser: (userLevel, userId, targetUserId, targetUserLevel) => {
    if (userLevel === NIVEIS_PERMISSAO.FUNCIONARIO) return false;
    if (userId === targetUserId) return true;
    if (userLevel === NIVEIS_PERMISSAO.ADMIN) return true;
    if (userLevel === NIVEIS_PERMISSAO.GERENTE) {
      return targetUserLevel < NIVEIS_PERMISSAO.GERENTE;
    }
    return false;
  },
  canManagePurchases: (userLevel) => {
    return userLevel > NIVEIS_PERMISSAO.FUNCIONARIO;
  },
  isAdmin: (userLevel) => {
    return userLevel === NIVEIS_PERMISSAO.ADMIN;
  }
};

// ===== MODAL DE EDIÇÃO DE PERFIL =====
const EditProfileModal = ({ usuario, onClose, onSave }) => {
  const { classes } = useTheme();
  const [formData, setFormData] = useState({
    nome: usuario?.nome || '',
    email: usuario?.email || '',
    senha: '',
    confirmarSenha: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Validações
    const newErrors = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (formData.senha) {
      if (formData.senha.length < 6) {
        newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
      }
      
      if (formData.senha !== formData.confirmarSenha) {
        newErrors.confirmarSenha = 'Senhas não conferem';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const dadosAtualizacao = {
        nome: formData.nome.trim(),
        email: formData.email.trim(),
      };
      
      // Só inclui senha se foi informada
      if (formData.senha) {
        dadosAtualizacao.senha = formData.senha;
      }
      
      await onSave(dadosAtualizacao);
      onClose();
    } catch (error) {
      setErrors({ geral: 'Erro ao atualizar perfil. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 ${classes.overlay} flex items-center justify-center z-50`}>
      <div className={`${classes.modal} max-w-md w-full mx-4 p-6`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-bold ${classes.textPrimary}`}>Editar Perfil</h2>
          <button
            onClick={onClose}
            className={`${classes.textLight} hover:${classes.textSecondary} transition-colors duration-200`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={classes.formLabel}>Nome</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className={`w-full px-3 py-2 ${classes.input} ${
                errors.nome ? 'border-red-500 focus:ring-red-500' : 'focus:ring-2'
              }`}
              style={{ '--tw-ring-color': errors.nome ? '#ef4444' : '#bd9967' }}
              placeholder="Digite seu nome"
              disabled={isLoading}
            />
            {errors.nome && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.nome}</p>
            )}
          </div>

          <div>
            <label className={classes.formLabel}>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-3 py-2 ${classes.input} ${
                errors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-2'
              }`}
              style={{ '--tw-ring-color': errors.email ? '#ef4444' : '#bd9967' }}
              placeholder="Digite seu email"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className={classes.formLabel}>Nova Senha (opcional)</label>
            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                className={`w-full px-3 py-2 pr-10 ${classes.input} ${
                errors.senha ? 'border-red-500 focus:ring-red-500' : 'focus:ring-2'
                }`}
                style={{ '--tw-ring-color': errors.senha ? '#ef4444' : '#bd9967' }}
                placeholder="Deixe em branco para manter a atual"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className={`absolute right-3 top-3 ${classes.textLight} hover:${classes.textSecondary} transition-colors duration-200`}
                disabled={isLoading}
              >
                {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.senha && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.senha}</p>
            )}
          </div>

          {formData.senha && (
            <div>
              <label className={classes.formLabel}>Confirmar Nova Senha</label>
              <div className="relative">
                <input
                  type={mostrarConfirmarSenha ? 'text' : 'password'}
                  value={formData.confirmarSenha}
                  onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                  className={`w-full px-3 py-2 pr-10 ${classes.input} ${
                    errors.confirmarSenha ? 'border-red-500 focus:ring-red-500' : 'focus:ring-2'
                  }`}
                  style={{ '--tw-ring-color': errors.confirmarSenha ? '#ef4444' : '#bd9967' }}
                  placeholder="Confirme a nova senha"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                  className={`absolute right-3 top-3 ${classes.textLight} hover:${classes.textSecondary} transition-colors duration-200`}
                  disabled={isLoading}
                >
                  {mostrarConfirmarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmarSenha && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.confirmarSenha}</p>
              )}
            </div>
          )}

          {errors.geral && (
            <div className={`${classes.alertError} px-4 py-3 rounded-lg text-sm`}>
              {errors.geral}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className={`flex-1 px-4 py-2 ${classes.buttonSecondary} text-sm ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 px-4 py-2 text-sm ${classes.buttonPrimary} ${
                isLoading ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : 'hover:opacity-90'
              } text-white`}
              style={{ backgroundColor: isLoading ? undefined : '#bd9967' }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </div>
              ) : (
                <>
                  <Save className="w-4 h-4 inline mr-2" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ===== COMPONENTE DE LOGIN ATUALIZADO COM TEMA PADRONIZADO =====
const LoginForm = () => {
  const [formData, setFormData] = useState({ email: '', senha: '', lembrar: false });
  const [erro, setErro] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const { login, cookiesEnabled } = useAuth();
  const { classes } = useTheme();

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
    <div className={`min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 ${classes.backgroundPrimary}`}>
      <div className={`max-w-md w-full ${classes.card} p-8`}>
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors duration-200" style={{ backgroundColor: '#bd9967' }}>
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-2xl font-bold ${classes.textPrimary} mb-2`}>Almoxarifado Jardim</h1>
          <p className={`${classes.textSecondary} mb-4`}>Sistema de Gestão</p>
          
          <div className="flex justify-center mb-4">
            <ThemeToggle />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={classes.formLabel}>
              Email/Usuário
            </label>
            <div className="relative">
              <User className={`w-4 h-4 absolute left-3 top-3 ${classes.textLight}`} />
              <input
                type="text"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onKeyPress={handleKeyPress}
                className={`w-full pl-10 pr-4 py-3 ${classes.input} focus:ring-2 focus:border-transparent`}
                style={{ '--tw-ring-color': '#bd9967' }}
                placeholder="Digite seu usuário"
                required
                disabled={carregando}
              />
            </div>
          </div>

          <div>
            <label className={classes.formLabel}>
              Senha
            </label>
            <div className="relative">
              <Lock className={`w-4 h-4 absolute left-3 top-3 ${classes.textLight}`} />
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                onKeyPress={handleKeyPress}
                className={`w-full pl-10 pr-12 py-3 ${classes.input} focus:ring-2 focus:border-transparent`}
                style={{ '--tw-ring-color': '#bd9967' }}
                placeholder="Digite sua senha"
                required
                disabled={carregando}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className={`absolute right-3 top-3 ${classes.textLight} hover:${classes.textSecondary} transition-colors duration-200`}
                disabled={carregando}
              >
                {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {!cookiesEnabled && (
            <div className={`${classes.alertWarning} px-4 py-3 rounded-lg text-sm`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Cookies desabilitados. A função "Lembrar de mim" não funcionará.</span>
              </div>
            </div>
          )}

          {erro && (
            <div className={`${classes.alertError} px-4 py-3 rounded-lg text-sm`}>
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className={`w-full ${classes.buttonPrimary} py-3 px-4 ${
              carregando 
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                : 'hover:opacity-90'
            } text-white`}
            style={{ backgroundColor: carregando ? undefined : '#bd9967' }}
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
        
        <div className={`mt-6 text-center text-xs ${classes.textLight}`}>
          <p>Sistema protegido por autenticação</p>
        </div>
      </div>
    </div>
  );
};

// ===== LOADING SCREEN ATUALIZADO COM TEMA PADRONIZADO =====
const LoadingScreen = () => {
  const { classes } = useTheme();
  
  return (
    <div className={`min-h-screen ${classes.backgroundPrimary} flex items-center justify-center`}>
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors duration-200" style={{ backgroundColor: '#bd9967' }}>
          <Package className="w-8 h-8 text-white animate-pulse" />
        </div>
        <h1 className={`text-2xl font-bold ${classes.textPrimary} mb-2`}>Almoxarifado Jardim</h1>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#bd9967' }}></div>
          <p className={classes.textSecondary}>Conectando ao Firebase...</p>
        </div>
        <div className={`w-64 ${classes.containerSecondary} rounded-full h-2`}>
          <div className="h-2 rounded-full animate-pulse transition-colors duration-200" style={{ width: '70%', backgroundColor: '#bd9967' }}></div>
        </div>
        <p className={`text-sm ${classes.textMuted} mt-2`}>Inicializando módulos de segurança...</p>
      </div>
    </div>
  );
};

// ===== COMPONENTE PRINCIPAL ATUALIZADO COM TEMA PADRONIZADO =====
const AlmoxarifadoSistema = () => {
  const { usuario, logout, firebaseStatus, atualizarUsuario } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [mostrarEditarPerfil, setMostrarEditarPerfil] = useState(false);
  const { classes } = useTheme();

  // Estados do sistema
  const [inventario, setInventario] = useState([]);

  // Firestore: sincronização em tempo real do inventário
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'inventario'), async (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInventario(items);
      if (items.length === 0 && PermissionChecker.canManageOperational(usuario?.nivel)) {
        for (const item of inventarioInicial) {
          const { id, ...rest } = item;
          await addDoc(collection(db, 'inventario'), rest);
        }
      }
    });
    return () => unsubscribe();
  }, [usuario]);

  const adicionarItem = async (item) => {
    if (!PermissionChecker.canManageOperational(usuario?.nivel)) throw new Error('Sem permissão para adicionar itens');
    await addDoc(collection(db, 'inventario'), item);
  };
  const removerItem = async (id) => {
    if (!PermissionChecker.canManageOperational(usuario?.nivel)) throw new Error('Sem permissão para remover itens');
    await deleteDoc(doc(db, 'inventario', id));
  };
  const atualizarItem = async (id, dados) => {
    if (!PermissionChecker.canManageOperational(usuario?.nivel)) throw new Error('Sem permissão para atualizar itens');
    await updateDoc(doc(db, 'inventario', id), dados);
  };

  const [emprestimos, setEmprestimos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [ferramentasDanificadas, setFerramentasDanificadas] = useState([]);
  const [ferramentasPerdidas, setFerramentasPerdidas] = useState([]);
  const [compras, setCompras] = useState([]);

  // Firestore: sincronização em tempo real dos módulos
  useEffect(() => {
    const unsubEmprestimos = onSnapshot(collection(db, 'emprestimos'), (snapshot) => {
      setEmprestimos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubFuncionarios = onSnapshot(collection(db, 'funcionarios'), (snapshot) => {
      setFuncionarios(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubDanificadas = onSnapshot(collection(db, 'ferramentas_danificadas'), (snapshot) => {
      setFerramentasDanificadas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubPerdidas = onSnapshot(collection(db, 'ferramentas_perdidas'), (snapshot) => {
      setFerramentasPerdidas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubCompras = onSnapshot(collection(db, 'compras'), (snapshot) => {
      setCompras(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => {
      unsubEmprestimos();
      unsubFuncionarios();
      unsubDanificadas();
      unsubPerdidas();
      unsubCompras();
    };
  }, []);

  // CRUD Firestore para cada módulo
  const adicionarFuncionario = async (funcionario) => {
    await addDoc(collection(db, 'funcionarios'), funcionario);
  };
  const removerFuncionario = async (id) => {
    await deleteDoc(doc(db, 'funcionarios', id));
  };
  const atualizarFuncionario = async (id, dados) => {
    await updateDoc(doc(db, 'funcionarios', id), dados);
  };

  // Empréstimos
  const adicionarEmprestimo = async (emprestimo) => {
    await addDoc(collection(db, 'emprestimos'), emprestimo);
  };
  const removerEmprestimo = async (id) => {
    await deleteDoc(doc(db, 'emprestimos', id));
  };
  const atualizarEmprestimo = async (id, dados) => {
    await updateDoc(doc(db, 'emprestimos', id), dados);
  };

  // Compras
  const adicionarCompra = async (compra) => {
    await addDoc(collection(db, 'compras'), compra);
  };
  const removerCompra = async (id) => {
    await deleteDoc(doc(db, 'compras', id));
  };
  const atualizarCompra = async (id, dados) => {
    await updateDoc(doc(db, 'compras', id), dados);
  };

  // Ferramentas Danificadas
  const adicionarFerramentaDanificada = async (item) => {
    if (!PermissionChecker.canManageOperational(usuario?.nivel)) throw new Error('Sem permissão para adicionar ferramentas danificadas');
    await addDoc(collection(db, 'ferramentas_danificadas'), item);
  };
  const removerFerramentaDanificada = async (id) => {
    if (!PermissionChecker.canManageOperational(usuario?.nivel)) throw new Error('Sem permissão para remover ferramentas danificadas');
    await deleteDoc(doc(db, 'ferramentas_danificadas', id));
  };
  const atualizarFerramentaDanificada = async (id, dados) => {
    if (!PermissionChecker.canManageOperational(usuario?.nivel)) throw new Error('Sem permissão para atualizar ferramentas danificadas');
    await updateDoc(doc(db, 'ferramentas_danificadas', id), dados);
  };

  // Ferramentas Perdidas
  const adicionarFerramentaPerdida = async (item) => {
    if (!PermissionChecker.canManageOperational(usuario?.nivel)) throw new Error('Sem permissão para adicionar ferramentas perdidas');
    await addDoc(collection(db, 'ferramentas_perdidas'), item);
  };
  const removerFerramentaPerdida = async (id) => {
    if (!PermissionChecker.canManageOperational(usuario?.nivel)) throw new Error('Sem permissão para remover ferramentas perdidas');
    await deleteDoc(doc(db, 'ferramentas_perdidas', id));
  };
  const atualizarFerramentaPerdida = async (id, dados) => {
    if (!PermissionChecker.canManageOperational(usuario?.nivel)) throw new Error('Sem permissão para atualizar ferramentas perdidas');
    await updateDoc(doc(db, 'ferramentas_perdidas', id), dados);
  };

  // Função para salvar perfil do usuário
  const handleSalvarPerfil = async (dadosAtualizacao) => {
    try {
      const resultado = await atualizarUsuario(usuario.id, dadosAtualizacao);
      if (!resultado.success) {
        throw new Error(resultado.message);
      }
    } catch (error) {
      throw new Error('Erro ao atualizar perfil');
    }
  };

  // Funções do sistema
  const reimportarInventario = () => {};
  const corrigirInventario = () => {};
  const devolverFerramentas = () => {};

  // Importação de dados iniciais para ferramentas danificadas e perdidas
  const importarFerramentasIniciais = async () => {
    try {
      const danificadas = await fetch('/src/data/ferramentas_danificadas_inicial.json').then(r => r.json());
      for (const item of danificadas) {
        await addDoc(collection(db, 'ferramentasDanificadas'), item);
      }
      const perdidas = await fetch('/src/data/ferramentas_perdidas_inicial.json').then(r => r.json());
      for (const item of perdidas) {
        await addDoc(collection(db, 'ferramentasPerdidas'), item);
      }
      alert('Ferramentas danificadas e perdidas importadas com sucesso!');
    } catch (err) {
      alert('Erro ao importar dados iniciais: ' + err.message);
    }
  };

  if (!usuario) {
    return <LoadingScreen />;
  }

  const stats = {
    inventario,
    emprestimos,
    funcionarios,
    ferramentasDanificadas,
    ferramentasPerdidas,
    compras
  };

  const abas = [
    { id: 'dashboard', nome: 'Dashboard', icone: BarChart3, permissao: () => true },
    { id: 'inventario', nome: 'Inventário', icone: Package, permissao: () => PermissionChecker.canView(usuario?.nivel) },
    { id: 'emprestimos', nome: 'Empréstimos', icone: ClipboardList, permissao: () => PermissionChecker.canView(usuario?.nivel) },
    { id: 'funcionarios', nome: 'Funcionários', icone: Users, permissao: () => PermissionChecker.canView(usuario?.nivel) },
    { id: 'compras', nome: 'Compras', icone: ShoppingCart, permissao: () => PermissionChecker.canView(usuario?.nivel) },
    { id: 'danificadas', nome: 'Ferramentas Danificadas', icone: AlertTriangle, permissao: () => PermissionChecker.canView(usuario?.nivel) },
    { id: 'perdidas', nome: 'Ferramentas Perdidas', icone: AlertCircle, permissao: () => PermissionChecker.canView(usuario?.nivel) }
  ].filter(aba => aba.permissao());

  // Só administradores podem ver usuários do sistema
  const podeVerUsuarios = PermissionChecker.isAdmin(usuario?.nivel);

  return (
    <div className={classes.backgroundPrimary}>
      <header className={`${classes.container} shadow-sm border-b ${classes.divider}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Package className="w-8 h-8 mr-3 transition-colors duration-200" style={{ color: '#bd9967' }} />
              <div>
                <h1 className={`text-2xl font-bold ${classes.textPrimary}`}>Almoxarifado Jardim</h1>
                <p className={`text-sm ${classes.textMuted}`}>Sistema de Gestão de Ferramentas</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              
              {podeVerUsuarios && (
                <button
                  onClick={() => setAbaAtiva('usuarios')}
                  className={`flex items-center gap-2 px-3 py-2 text-sm ${classes.buttonSecondary} ${
                    abaAtiva === 'usuarios' ? 'border-2' : ''
                  }`}
                  style={{ borderColor: abaAtiva === 'usuarios' ? '#bd9967' : 'transparent' }}
                >
                  <UserCog className="w-4 h-4" />
                  Usuários do Sistema
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMostrarEditarPerfil(true)}
                  className={`flex items-center gap-1 px-2 py-1 text-sm ${classes.buttonSecondary}`}
                  title="Editar Perfil"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <div className="text-right">
                  <p className={`text-sm font-medium ${classes.textPrimary}`}>{usuario.nome}</p>
                  <p className={`text-xs ${classes.textMuted}`}>{NIVEIS_LABELS[usuario.nivel]}</p>
                </div>
              </div>

              <button
                onClick={logout}
                className={`flex items-center gap-2 px-3 py-2 text-sm ${classes.buttonDanger}`}
              >
                <Lock className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className={`${classes.container} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {abas.map((aba) => {
              const Icone = aba.icone;
              return (
                <button
                  key={aba.id}
                  onClick={() => setAbaAtiva(aba.id)}
                  className={`flex items-center space-x-2 py-4 px-2 ${classes.navTab} ${
                    abaAtiva === aba.id
                      ? classes.navTabActive
                      : classes.navTabInactive
                  }`}
                  style={{ 
                    borderColor: abaAtiva === aba.id ? '#bd9967' : 'transparent',
                    color: abaAtiva === aba.id ? '#bd9967' : undefined
                  }}
                >
                  <Icone className="w-4 h-4" />
                  <span>{aba.nome}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`${classes.backgroundPrimary} rounded-lg shadow-sm p-4`}> 
          {abaAtiva === 'dashboard' && <Dashboard stats={stats} />}
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
                atualizarFerramentaDanificada={atualizarFerramentaDanificada}
                removerFerramentaDanificada={removerFerramentaDanificada}
                readonly={false}
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
                atualizarFerramentaPerdida={atualizarFerramentaPerdida}
                removerFerramentaPerdida={removerFerramentaPerdida}
                readonly={false}
              />
            ) : (
              <PermissionDenied message="Você não tem permissão para visualizar as ferramentas perdidas." />
            )
          )}
          {abaAtiva === 'usuarios' && (
            PermissionChecker.isAdmin(usuario?.nivel) ? (
              <UsuariosTab />
            ) : (
              <PermissionDenied message="Você não tem permissão para gerenciar usuários do sistema." />
            )
          )}
        </div>
      </main>

      {/* Modal de Edição de Perfil */}
      {mostrarEditarPerfil && (
        <EditProfileModal
          usuario={usuario}
          onClose={() => setMostrarEditarPerfil(false)}
          onSave={handleSalvarPerfil}
        />
      )}
    </div>
  );
};

// ===== DASHBOARD ATUALIZADO COM TEMA PADRONIZADO =====
const Dashboard = ({ stats, firebaseStatus }) => {
  const { inventario, emprestimos, funcionarios, ferramentasDanificadas, ferramentasPerdidas, compras } = stats;
  const { classes } = useTheme();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <div className={`${classes.statCard} ${classes.statCardWhite}`}>
          <div className="flex items-center">
            <div className="p-2 rounded transition-colors duration-200" style={{ backgroundColor: 'rgba(189, 153, 103, 0.1)' }}>
              <Package className="w-6 h-6" style={{ color: '#bd9967' }} />
            </div>
            <div className="ml-4">
              <p className={`${classes.statLabel} ${classes.textSecondary}`}>Inventário</p>
              <p className={`${classes.statValue} ${classes.textPrimary}`}>{inventario?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className={`${classes.statCard} ${classes.statCardWhite}`}>
          <div className="flex items-center">
            <div className="p-2 rounded transition-colors duration-200" style={{ backgroundColor: 'rgba(189, 153, 103, 0.1)' }}>
              <ClipboardList className="w-6 h-6" style={{ color: '#bd9967' }} />
            </div>
            <div className="ml-4">
              <p className={`${classes.statLabel} ${classes.textSecondary}`}>Empréstimos Ativos</p>
              <p className={`${classes.statValue} ${classes.textPrimary}`}>{emprestimos?.filter(e => e.status !== 'devolvido').length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className={`${classes.statCard} ${classes.statCardWhite}`}>
          <div className="flex items-center">
            <div className="p-2 rounded transition-colors duration-200" style={{ backgroundColor: 'rgba(189, 153, 103, 0.1)' }}>
              <Users className="w-6 h-6" style={{ color: '#bd9967' }} />
            </div>
            <div className="ml-4">
              <p className={`${classes.statLabel} ${classes.textSecondary}`}>Funcionários</p>
              <p className={`${classes.statValue} ${classes.textPrimary}`}>{funcionarios?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className={`${classes.statCard} ${classes.statCardRed}`}>
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded transition-colors duration-200">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className={`${classes.statLabel} ${classes.statLabelRed}`}>Danificadas</p>
              <p className={`${classes.statValue} ${classes.statValueRed}`}>{ferramentasDanificadas?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className={`${classes.statCard} ${classes.statCardRed}`}>
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded transition-colors duration-200">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className={`${classes.statLabel} ${classes.statLabelRed}`}>Perdidas</p>
              <p className={`${classes.statValue} ${classes.statValueRed}`}>{ferramentasPerdidas?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className={`${classes.statCard} ${classes.statCardWhite}`}>
          <div className="flex items-center">
            <div className="p-2 rounded transition-colors duration-200" style={{ backgroundColor: 'rgba(189, 153, 103, 0.1)' }}>
              <ShoppingCart className="w-6 h-6" style={{ color: '#bd9967' }} />
            </div>
            <div className="ml-4">
              <p className={`${classes.statLabel} ${classes.textSecondary}`}>Compras</p>
              <p className={`${classes.statValue} ${classes.textPrimary}`}>{compras?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== COMPONENTE PERMISSION DENIED ATUALIZADO =====
const PermissionDenied = ({ message = "Você não tem permissão para realizar esta ação." }) => {
  const { classes } = useTheme();
  
  return (
    <div className={`${classes.alertError} rounded-lg p-4 text-center`}>
      <div className="flex items-center justify-center mb-2">
        <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-1 transition-colors duration-200">Acesso Negado</h3>
      <p className="text-red-600 dark:text-red-400 transition-colors duration-200">{message}</p>
    </div>
  );
};

// ===== PROVIDER DE AUTENTICAÇÃO =====
const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseStatus, setFirebaseStatus] = useState('connecting');
  const [cookiesEnabled, setCookiesEnabled] = useState(true);

  useEffect(() => {
    setCookiesEnabled(CookieManager.areCookiesEnabled());
    const usuarioSalvo = CookieManager.getCookie('almoxarifado_user');
    if (usuarioSalvo) {
      setUsuario(usuarioSalvo);
    } else {
      setUsuario(null);
    }
    // Sincronização em tempo real dos usuários do Firestore
    const unsubscribe = onSnapshot(collection(db, 'usuarios'), (snapshot) => {
      setUsuarios(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    setTimeout(() => {
      setIsLoading(false);
      setFirebaseStatus('connected');
    }, 500);
    return () => unsubscribe();
  }, []);

  const login = async (email, senha, lembrar) => {
    try {
      // Login manual usando Firestore
      const { getDocs, query, where, collection } = await import('firebase/firestore');
      const usuariosRef = collection(db, 'usuarios');
      const q = query(usuariosRef, where('email', '==', email));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return { success: false, message: 'Usuário não encontrado.' };
      }
      const usuarioData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      if (!usuarioData.ativo) {
        return { success: false, message: 'Usuário inativo.' };
      }
      if (usuarioData.senha !== senha) {
        return { success: false, message: 'Senha incorreta.' };
      }
      setUsuario(usuarioData);
      if (cookiesEnabled && lembrar) {
        CookieManager.setCookie('almoxarifado_user', usuarioData, 30);
      }
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Erro ao fazer login.' };
    }
  };

  const logout = () => {
    setUsuario(null);
    CookieManager.removeCookie('almoxarifado_user');
  };

  const criarUsuario = async (dadosUsuario) => {
    try {
      const { addDoc, collection } = await import('firebase/firestore');
      await addDoc(collection(db, 'usuarios'), dadosUsuario);
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Erro ao criar usuário.' };
    }
  };

  const atualizarUsuario = async (id, dadosUsuario) => {
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'usuarios', id), dadosUsuario);
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Erro ao atualizar usuário.' };
    }
  };

  const removerUsuario = async (id) => {
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'usuarios', id));
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Erro ao remover usuário.' };
    }
  };

  const temPermissao = (nivel) => {
    return usuario && usuario.nivel >= nivel;
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

// ===== COMPONENTE PRINCIPAL DA APLICAÇÃO =====
const App = () => {
  const { usuario, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return usuario ? <AlmoxarifadoSistema /> : <LoginForm />;
};

const AlmoxarifadoJardim = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  );
};

// ===== EXPORTS =====
export { useAuth, useTheme, ThemeToggle, themeClasses };
export default AlmoxarifadoJardim;