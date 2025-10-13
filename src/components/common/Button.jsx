import React from 'react';
import { twitterThemeConfig } from '../../styles/twitterThemeConfig';

const Button = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  size = 'md',
  icon: Icon,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  ...props 
}) => {
  const classes = twitterThemeConfig.classes;
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return classes.button.primary;
      case 'secondary':
        return classes.button.secondary;
      case 'danger':
        return classes.button.danger;
      case 'outline':
        return classes.button.outline;
      default:
        return classes.button.primary;
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`
        ${classes.button.base}
        ${getVariantClasses()}
        ${classes.button.sizes[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      <span className="flex items-center justify-center gap-2">
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
        )}
        {Icon && !loading && <Icon className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />}
        {loading ? 'Carregando...' : children}
      </span>
    </button>
  );
};

export default Button;
