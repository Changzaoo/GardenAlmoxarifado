import React from 'react';

const LogoAzul = ({ className = "w-10 h-10" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#1d9bf0', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#1a8cd8', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Letra A */}
      <path
        d="M 20 80 L 35 20 L 50 80 M 28 55 L 42 55"
        stroke="url(#logoGradient)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Número 2 */}
      <path
        d="M 65 30 Q 75 20 85 30 Q 85 40 75 50 L 65 60 L 85 60"
        stroke="url(#logoGradient)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

export default LogoAzul;
