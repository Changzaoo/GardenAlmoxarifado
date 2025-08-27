import React from 'react';
import { useTheme } from '../ThemeProvider';

const Button = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  ...props 
}) => {
  const { styles } = useTheme();

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${styles.button(variant)}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Carregando...
        </div>
      ) : children}
    </button>
  );
};

export default Button;
