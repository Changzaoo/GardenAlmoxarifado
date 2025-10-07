// 🎨 Exemplos de Uso - Sistema de Tema Android

import React from 'react';
import { useTheme } from '../components/Theme/ThemeSystem';
import { Moon, Sun } from 'lucide-react';

// ============================================
// EXEMPLO 1: Toggle de Tema Simples
// ============================================
export function SimpleThemeToggle() {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-800"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

// ============================================
// EXEMPLO 2: Toggle com Animação
// ============================================
export function AnimatedThemeToggle() {
  const { currentTheme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-16 h-8 rounded-full bg-gray-300 dark:bg-gray-700 transition-colors duration-300"
    >
      <div
        className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-lg transform transition-transform duration-300 flex items-center justify-center ${
          isDark ? 'translate-x-8' : 'translate-x-0'
        }`}
      >
        {isDark ? (
          <Moon size={14} className="text-blue-500" />
        ) : (
          <Sun size={14} className="text-yellow-500" />
        )}
      </div>
    </button>
  );
}

// ============================================
// EXEMPLO 3: Seletor de Tema Dropdown
// ============================================
export function ThemeSelector() {
  const { currentTheme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  const themeOptions = [
    { value: 'light', label: 'Claro ☀️', icon: Sun },
    { value: 'dark', label: 'Escuro 🌙', icon: Moon },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white flex items-center gap-2"
      >
        {currentTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
        {currentTheme === 'dark' ? 'Escuro' : 'Claro'}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  currentTheme === option.value ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <Icon size={18} />
                <span>{option.label}</span>
                {currentTheme === option.value && (
                  <span className="ml-auto text-blue-500">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// EXEMPLO 4: Detectar Mudança de Tema
// ============================================
export function ThemeListener() {
  const { currentTheme, isDark } = useTheme();

  React.useEffect(() => {
    console.log('Tema mudou para:', currentTheme);
    
    // Você pode fazer ações específicas quando o tema muda
    if (isDark) {
      console.log('Modo escuro ativado!');
      // Exemplo: Atualizar configurações de gráficos
      // updateChartColors('dark');
    } else {
      console.log('Modo claro ativado!');
      // Exemplo: Atualizar configurações de gráficos
      // updateChartColors('light');
    }
  }, [currentTheme, isDark]);

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
      <p className="text-gray-900 dark:text-white">
        Tema atual: <strong>{currentTheme}</strong>
      </p>
    </div>
  );
}

// ============================================
// EXEMPLO 5: Obter Cores do Tema Atual
// ============================================
export function ThemeColorExample() {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <div className="space-y-4">
      {/* Usando cores do tema */}
      <div style={{ backgroundColor: colors.background, color: colors.text }} className="p-4 rounded-lg">
        <h3 style={{ color: colors.primary }}>Título com Cor Primária</h3>
        <p style={{ color: colors.textSecondary }}>Texto secundário</p>
      </div>

      {/* Lista de cores */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(colors).slice(0, 6).map(([name, value]) => (
          <div key={name} className="flex items-center gap-2">
            <div
              style={{ backgroundColor: value }}
              className="w-8 h-8 rounded border border-gray-300 dark:border-gray-700"
            />
            <span className="text-sm text-gray-900 dark:text-white">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// EXEMPLO 6: Toggle com Confirmação
// ============================================
export function ThemeToggleWithConfirmation() {
  const { currentTheme, setTheme, isDark } = useTheme();
  const [showConfirm, setShowConfirm] = React.useState(false);

  const handleToggle = () => {
    setShowConfirm(true);
  };

  const confirmChange = () => {
    setTheme(isDark ? 'light' : 'dark');
    setShowConfirm(false);
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold hover:shadow-lg transition-shadow"
      >
        Mudar para {isDark ? 'Tema Claro' : 'Tema Escuro'}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Mudar Tema?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Deseja realmente mudar para o tema {isDark ? 'claro' : 'escuro'}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={confirmChange}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================
// EXEMPLO 7: Aplicar Tema em Componente Específico
// ============================================
export function ThemedCard({ title, children }) {
  const { theme } = useTheme();

  return (
    <div
      style={{
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border,
        color: theme.colors.text,
      }}
      className="rounded-xl border p-6 shadow-lg"
    >
      <h3
        style={{ color: theme.colors.primary }}
        className="text-xl font-bold mb-4"
      >
        {title}
      </h3>
      <div>{children}</div>
    </div>
  );
}

// ============================================
// EXEMPLO 8: Hook Personalizado para Tema
// ============================================
export function useThemedStyles() {
  const { theme, isDark } = useTheme();

  return {
    // Estilos de card
    card: {
      backgroundColor: theme.colors.card,
      borderColor: theme.colors.border,
      color: theme.colors.text,
    },
    
    // Estilos de botão primário
    button: {
      backgroundColor: theme.colors.primary,
      color: theme.colors.textInverted,
    },
    
    // Estilos de input
    input: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      color: theme.colors.text,
    },
    
    // Classes CSS
    classes: {
      card: `bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg`,
      button: `px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:opacity-90`,
      input: `px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg`,
    },
  };
}

// Exemplo de uso do hook personalizado
export function StyledComponent() {
  const styles = useThemedStyles();

  return (
    <div style={styles.card} className="p-6">
      <button style={styles.button}>Clique aqui</button>
      <input
        type="text"
        style={styles.input}
        placeholder="Digite algo..."
        className="mt-4 w-full"
      />
    </div>
  );
}

// ============================================
// EXEMPLO 9: Tema em Gráficos (Chart.js)
// ============================================
export function ThemedChart() {
  const { theme, isDark } = useTheme();

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: theme.colors.text,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          color: theme.colors.textSecondary,
        },
        grid: {
          color: theme.colors.border,
        },
      },
      x: {
        ticks: {
          color: theme.colors.textSecondary,
        },
        grid: {
          color: theme.colors.border,
        },
      },
    },
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
      {/* Seu componente de gráfico aqui */}
      <p className="text-gray-900 dark:text-white">
        Gráfico com cores do tema atual
      </p>
    </div>
  );
}

// ============================================
// EXEMPLO 10: Página de Configurações
// ============================================
export function SettingsPage() {
  const { currentTheme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Configurações
      </h1>

      <div className="max-w-2xl space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Aparência
          </h2>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={currentTheme === 'light'}
                onChange={(e) => setTheme(e.target.value)}
                className="w-4 h-4"
              />
              <Sun size={20} className="text-yellow-500" />
              <span className="text-gray-900 dark:text-white">Tema Claro</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={currentTheme === 'dark'}
                onChange={(e) => setTheme(e.target.value)}
                className="w-4 h-4"
              />
              <Moon size={20} className="text-blue-500" />
              <span className="text-gray-900 dark:text-white">Tema Escuro</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default {
  SimpleThemeToggle,
  AnimatedThemeToggle,
  ThemeSelector,
  ThemeListener,
  ThemeColorExample,
  ThemeToggleWithConfirmation,
  ThemedCard,
  useThemedStyles,
  ThemedChart,
  SettingsPage,
};
