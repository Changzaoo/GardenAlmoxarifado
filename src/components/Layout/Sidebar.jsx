import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { NIVEIS_PERMISSAO } from '../../constants/permissoes';
import {
  Users,
  ShoppingCart,
  Box,
  Tool,
  AlertTriangle,
  MessageSquare,
  LogOut,
  Home,
  Menu as MenuIcon,
  X
} from 'lucide-react';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const { usuario, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { 
      path: '/', 
      icon: Home, 
      label: 'Início',
      nivel: NIVEIS_PERMISSAO.FUNCIONARIO
    },
    { 
      path: '/funcionarios', 
      icon: Users, 
      label: 'Funcionários',
      nivel: NIVEIS_PERMISSAO.SUPERVISOR 
    },
    { 
      path: '/compras', 
      icon: ShoppingCart, 
      label: 'Compras',
      nivel: NIVEIS_PERMISSAO.SUPERVISOR 
    },
    { 
      path: '/inventario', 
      icon: Box, 
      label: 'Inventário',
      nivel: NIVEIS_PERMISSAO.FUNCIONARIO 
    },
    { 
      path: '/emprestimos', 
      icon: Tool, 
      label: 'Empréstimos',
      nivel: NIVEIS_PERMISSAO.FUNCIONARIO 
    },
    { 
      path: '/danificadas', 
      icon: AlertTriangle, 
      label: 'Danificadas',
      nivel: NIVEIS_PERMISSAO.FUNCIONARIO 
    },
    { 
      path: '/tarefas', 
      icon: MessageSquare, 
      label: 'Tarefas',
      nivel: NIVEIS_PERMISSAO.FUNCIONARIO 
    }
  ];

  // Filtra os itens do menu baseado no nível do usuário
  const filteredMenuItems = menuItems.filter(item => 
    usuario?.nivel >= item.nivel
  );

  const handleMouseEnter = () => {
    if (isCollapsed) {
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const sidebarClasses = `
    fixed left-0 top-0 h-full bg-[#202123] text-white
    transition-all duration-300 ease-in-out z-50
    ${isCollapsed ? 'w-16' : 'w-64'}
    ${isHovering ? 'w-64' : ''}
  `.trim();

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full bg-[#F8F9FA] border-r border-[#E9ECEF]
        transition-all duration-300 ease-in-out z-50 flex flex-col
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#E9ECEF]">
        {!isCollapsed && (
          <h1 className="text-lg font-semibold text-[#212529]">
            Almoxarifado
          </h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-[#E9ECEF] text-[#6C757D] transition-colors"
        >
          {isCollapsed ? <MenuIcon size={20} /> : <X size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg
                    transition-colors relative group
                    ${isActive 
                      ? 'bg-[#E9ECEF] text-[#212529]' 
                      : 'text-[#6C757D] hover:bg-[#E9ECEF]'
                    }
                  `}
                >
                  <Icon size={20} />
                  {!isCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                  {isCollapsed && (
                    <div className="
                      absolute left-full ml-2 px-2 py-1 bg-[#212529] text-white
                      rounded opacity-0 invisible group-hover:opacity-100
                      group-hover:visible transition-all duration-200 text-sm
                      whitespace-nowrap
                    ">
                      {item.label}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#E9ECEF]">
        <div className="flex flex-col gap-2">
          {!isCollapsed && usuario && (
            <div className="px-3 py-2">
              <div className="text-sm font-medium text-[#212529]">
                {usuario.nome}
              </div>
              <div className="text-xs text-[#6C757D]">
                {usuario.email}
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className={`
              flex items-center gap-3 px-3 py-2 rounded-lg
              text-[#6C757D] hover:bg-[#E9ECEF] transition-colors
              relative group
            `}
          >
            <LogOut size={20} />
            {!isCollapsed ? (
              <span className="font-medium">Sair</span>
            ) : (
              <div className="
                absolute left-full ml-2 px-2 py-1 bg-[#212529] text-white
                rounded opacity-0 invisible group-hover:opacity-100
                group-hover:visible transition-all duration-200 text-sm
                whitespace-nowrap
              ">
                Sair
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
