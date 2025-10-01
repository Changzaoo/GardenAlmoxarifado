import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Menu as MenuIcon, Home, Package, Users, Clock, AlertTriangle, Settings, LogOut } from 'lucide-react';

const Sidebar = ({ onProfileClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, signOut } = useAuth();

  const menu = [
    {
      name: 'Início',
      path: '/',
      icon: <Home className="w-5 h-5" />,
      requiredLevel: 1
    },
    {
      name: 'Inventário',
      path: '/inventario',
      icon: <Package className="w-5 h-5" />,
      requiredLevel: 1
    },
    {
      name: 'Funcionários',
      path: '/funcionarios',
      icon: <Users className="w-5 h-5" />,
      requiredLevel: 2
    },
    {
      name: 'Empréstimos',
      path: '/emprestimos',
      icon: <Clock className="w-5 h-5" />,
      requiredLevel: 1
    },
    {
      name: 'Danificadas',
      path: '/danificadas',
      icon: <AlertTriangle className="w-5 h-5" />,
      requiredLevel: 1
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="h-full w-64 border-l border-[#2F3336] bg-[#15202B] ml-[70px]">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-4 flex items-center">
          <img src="/logo.png" alt="Logo" className="w-10 h-10" />
          <span className="ml-2 text-lg font-bold text-white">WorkFlow</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 pt-4">
          {menu.map((item) => (
            usuario?.nivel >= item.requiredLevel && (
              <div key={item.path} className="relative">
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center px-4 py-3 text-gray-900 dark:text-white hover:bg-[#1D9BF0]/10 transition-colors duration-200
                    ${isActive(item.path) ? 'bg-[#1D9BF0]/10' : ''}`}
                >
                  {item.icon}
                  <span className="ml-4">{item.name}</span>
                </button>
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#2F3336]"></div>
              </div>
            )
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-[#2F3336] mt-auto pb-6">
          {/* Profile Button */}
          <button
            onClick={onProfileClick}
            className="w-full flex items-center p-6 text-gray-900 dark:text-white hover:bg-[#1D9BF0]/10 transition-colors duration-200"
          >
            <div className="flex items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-[#2F3336] flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 dark:border-gray-600">
                {usuario?.foto ? (
                  <img src={usuario.foto} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-lg font-bold">{usuario?.nome?.[0].toUpperCase()}</span>
                )}
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-semibold truncate">{usuario?.nome}</p>
                <p className="text-xs text-gray-400 truncate">{usuario?.email}</p>
              </div>
            </div>
          </button>

          <div className="border-t border-[#2F3336]">
            <button 
              onClick={() => signOut()}
              className="w-full flex items-center px-6 py-4 text-gray-900 dark:text-white hover:bg-[#1D9BF0]/10 transition-colors duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="ml-4">Sair</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;


