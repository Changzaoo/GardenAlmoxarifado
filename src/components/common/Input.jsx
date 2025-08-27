import React from 'react';
import { useTheme } from '../ThemeProvider';

const Input = ({ 
  label,
  error,
  className = '',
  type = 'text',
  ...props 
}) => {
  const { styles, colors } = useTheme();

  return (
    <div className="w-full">
      {label && (
        <label className={`block text-sm font-medium mb-1 ${colors.text}`}>
          {label}
        </label>
      )}
      <input
        type={type}
        className={`
          ${styles.input()}
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
