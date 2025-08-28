import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Home,
  Tool,
  Clock,
  Users,
  AlertTriangle,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  List,
  ShoppingCart
} from 'lucide-react';
import { NIVEIS_PERMISSAO } from '../AlmoxarifadoJardim';

const Sidebar = ({ onProfileClick }) => {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { path: '/', icon: Home, label: 'Página Inicial', requiresAuth: true },
    { path: '/emprestimos', icon: Tool, label: 'Empréstimos', requiresAuth: true },
    { path: '/historico', icon: Clock, label: 'Histórico', requiresAuth: true },
    { path: '/perdidas', icon: AlertTriangle, label: 'Perdidas', requiresAuth: true },
    { path: '/tarefas', icon: List, label: 'Tarefas', requiresAuth: true },
    { path: '/compras', icon: ShoppingCart, label: 'Compras', requiresAuth: true },
    { 
      path: '/usuarios', 
      icon: Users, 
      label: 'Usuários', 
      requiresAuth: true,
      requiresAdmin: true,
      minLevel: NIVEIS_PERMISSAO.SUPERVISOR
    }
  ];

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    closeMobileMenu();
    logout();
  };

  const handleProfileClick = () => {
    closeMobileMenu();
    onProfileClick();
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#1D9BF0] hover:bg-[#1a91da] transition-colors"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={\`fixed inset-y-0 left-0 z-40 w-64 bg-[#192734] border-r border-[#38444D] transform transition-transform duration-300 ease-in-out \${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }\`}
      >
        <div className="h-full flex flex-col justify-between p-4">
          {/* Navigation Links */}
          <nav className="space-y-1">
            {navigationItems
              .filter(item => 
                item.requiresAuth && 
                (!item.requiresAdmin || usuario.nivel >= item.minLevel)
              )
              .map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={({ isActive }) => \`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    \${isActive
                      ? 'bg-[#1D9BF0] bg-opacity-10 text-[#1D9BF0]'
                      : 'text-[#8899A6] hover:bg-[#253341]'
                    }
                  \`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
          </nav>

          {/* User Actions */}
          <div className="space-y-1">
            <button
              onClick={handleProfileClick}
              className="w-full flex items-center gap-3 px-4 py-3 text-[#8899A6] hover:bg-[#253341] rounded-lg transition-colors"
            >
              <User className="w-5 h-5" />
              <span>Perfil</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-[#F4212E] hover:bg-[#F4212E] hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
