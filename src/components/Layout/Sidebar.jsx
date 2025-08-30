import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { NIVEIS_PERMISSAO } from '../../constants/permissoes';
import LanguageSelector from '../LanguageSelector';
import { 
  Home, Users, ShoppingCart, Package, 
  FileText, AlertTriangle, History, 
  Settings, LogOut, HelpCircle, AlertCircle,
  Scale, QuestionMarkCircle
} from 'lucide-react';

const Sidebar = ({ onProfileClick }) => {
  const location = useLocation();
  const { usuario, logout } = useAuth();

  const { t } = useTranslation();
  
  const menuItems = [
    {
      to: '/',
      icon: Home,
      text: t('menu.dashboard'),
      minLevel: NIVEIS_PERMISSAO.FUNCIONARIO
    },
    {
      to: '/funcionarios',
      icon: Users,
      text: t('menu.employees'),
      minLevel: NIVEIS_PERMISSAO.SUPERVISOR
    },
    {
      to: '/compras',
      icon: ShoppingCart,
      text: t('menu.purchases'),
      minLevel: NIVEIS_PERMISSAO.SUPERVISOR
    },
    {
      to: '/inventario',
      icon: Package,
      text: t('menu.inventory'),
      minLevel: NIVEIS_PERMISSAO.FUNCIONARIO
    },
    {
      to: '/emprestimos',
      icon: FileText,
      text: t('menu.loans'),
      minLevel: NIVEIS_PERMISSAO.FUNCIONARIO
    },
    {
      to: '/danificadas',
      icon: AlertTriangle,
      text: t('menu.damaged'),
      minLevel: NIVEIS_PERMISSAO.FUNCIONARIO
    },
    {
      to: '/historico-emprestimos',
      icon: History,
      text: t('menu.history'),
      minLevel: NIVEIS_PERMISSAO.FUNCIONARIO
    }
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item) => (
          usuario.nivel >= item.minLevel && (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${
                location.pathname === item.to
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.text}</span>
            </Link>
          )
        ))}
      </nav>

      {/* User Profile, Help, Language, Legal and Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <button
          onClick={onProfileClick}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span>{t('profile.profile')}</span>
        </button>

        <div className="w-full flex items-center justify-between px-4 py-2.5">
          <QuestionMarkCircle className="w-5 h-5 text-gray-500" />
          <LanguageSelector />
        </div>

        <Link
          to="/legal"
          className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${
            location.pathname === '/legal'
              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          <Scale className="w-5 h-5" />
          <span>{t('menu.legal')}</span>
        </Link>
        
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>{t('profile.logout')}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
