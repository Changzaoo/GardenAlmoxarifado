import React from 'react';
import { useLocation } from 'react-router-dom';

const SideNavigation = () => {
  const location = useLocation();
  
  return (
    <nav className="fixed left-0 h-full w-64 bg-white dark:bg-gray-800 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out">
      <div className="flex flex-col h-full">
        <div className="overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {/* Main Navigation */}
          <div className="px-3 py-4 space-y-2">
            <ul className="space-y-1">
              <li>
                <a href="/" className={`flex items-center p-2 rounded-lg transition-colors duration-200 ${location.pathname === '/' ? 'bg-blue-50 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'} group`}>
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.146 11.146a.5.5 0 01-.353.854H20v7.5a1.5 1.5 0 01-1.5 1.5H14v-8h-4v8H5.5A1.5 1.5 0 014 19.5V12H2.207a.5.5 0 01-.353-.854L12 1l10.146 10.146Z" />
                  </svg>
                  <span className="ml-3 text-gray-700 dark:text-gray-300">Início</span>
                </a>
              </li>
              
              <li>
                <a href="/inventario" className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 group">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 4.5A1.5 1.5 0 015.5 3h13A1.5 1.5 0 0120 4.5v11A1.5 1.5 0 0118.5 17h-13A1.5 1.5 0 014 15.5v-11zM5.5 6h13v9.5H5.5V6z" />
                  </svg>
                  <span className="ml-3 text-gray-700 dark:text-gray-300">Inventário</span>
                </a>
              </li>

              <li>
                <a href="/emprestimos" className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 group">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.203 4.83a8.5 8.5 0 00-7.203 3.17H8.25a.75.75 0 010 1.5H3V4.25a.75.75 0 011.5 0v2.775A10.5 10.5 0 1122.5 12c0-4.478-2.825-8.293-6.78-9.737zM12 7.5a.75.75 0 01.75.75v4.19l3.35 2.39a.75.75 0 11-.872 1.22l-3.7-2.64a.75.75 0 01-.278-.58V8.25A.75.75 0 0112 7.5z" />
                  </svg>
                  <span className="ml-3 text-gray-700 dark:text-gray-300">Empréstimos</span>
                </a>
              </li>

              <li>
                <a href="/danificadas" className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 group">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 3l.74.74c1.05 1.05 1.05 2.75 0 3.8l-1.53 1.52 7.45 7.45c.18.18.29.43.29.7V20c0 .55-.45 1-1 1h-2.78c-.27 0-.52-.11-.7-.29l-7.45-7.45-1.52 1.53c-1.05 1.05-2.75 1.05-3.8 0L3 14l10-11z" />
                  </svg>
                  <span className="ml-3 text-gray-700 dark:text-gray-300">Danificadas</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Settings Section */}
          <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-800">
            <ul className="space-y-1">
              <li>
                <a href="/configuracoes" className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 group">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5zM9.75 12a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0z" />
                    <path d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.096.705.45.063.898-.02 1.243-.287l1.383-1.067c.754-.583 1.834-.43 2.37.35l1.4 2.026a1.93 1.93 0 01-.354 2.516l-1.314.916c-.445.31-.6.866-.43 1.34.18.492.306.975.374 1.447.075.534.464.96.96 1.034l1.186.163c.97.133 1.669.986 1.669 1.965v2.5c0 .979-.7 1.832-1.669 1.965l-1.186.163c-.496.074-.885.5-.96 1.034a8.463 8.463 0 01-.374 1.447c-.17.474-.015 1.03.43 1.34l1.314.916c.79.552.943 1.63.354 2.516l-1.4 2.026c-.536.78-1.616.933-2.37.35l-1.383-1.067c-.345-.267-.793-.35-1.243-.287-.451.062-.856.322-1.096.705l-.821 1.317c-.502.805-1.365 1.338-2.332 1.39a49.52 49.52 0 01-5.312 0c-.967-.052-1.83-.585-2.332-1.39l-.821-1.317c-.24-.383-.645-.643-1.096-.705-.45-.063-.898.02-1.243.287l-1.383 1.067c-.754.583-1.834.43-2.37-.35l-1.4-2.026a1.93 1.93 0 01.354-2.516l1.314-.916c.445-.31.6-.866.43-1.34a8.463 8.463 0 01-.374-1.447c-.075-.534-.464-.96-.96-1.034l-1.186-.163C3.7 15.832 3 14.979 3 14v-2.5c0-.979.7-1.832 1.669-1.965l1.186-.163c.496-.074.885-.5.96-1.034.068-.472.194-.955.374-1.447.17-.474.015-1.03-.43-1.34l-1.314-.916a1.93 1.93 0 01-.354-2.516l1.4-2.026c.536-.78 1.616-.933 2.37-.35l1.383 1.067c.345.267.793.35 1.243.287.451-.062.856-.322 1.096-.705l.821-1.317c.502-.805 1.365-1.338 2.332-1.39z" />
                  </svg>
                  <span className="ml-3 text-gray-700 dark:text-gray-300">Configurações</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default SideNavigation;

