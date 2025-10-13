import React from 'react';
import { useTheme } from '../ThemeProvider';

const Card = ({ 
  children, 
  className = '',
  title,
  ...props 
}) => {
  const { styles, colors } = useTheme();

  return (
    <div
      className={`
        ${styles.card()}
        ${className}
        p-4
      `}
      {...props}
    >
      {title && (
        <h2 className={`text-lg font-semibold mb-4 ${colors.text}`}>{title}</h2>
      )}
      {children}
    </div>
  );
};

export default Card;
