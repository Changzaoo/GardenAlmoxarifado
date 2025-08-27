import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600'
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600'
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-600'
  }
};

const Toast = ({ message, variant = 'success', onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 300); // Tempo para a animação de saída
    }, 5000); // 5 segundos

    return () => clearTimeout(timer);
  }, [onClose]);
  
  const variantStyle = VARIANTS[variant];
  const Icon = variantStyle.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, 300); // tempo da animação de saída
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  return (
    <div className={`
      fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg
      transform transition-all duration-300 ease-in-out
      ${isLeaving ? 'opacity-0 translate-x-2' : 'opacity-100 translate-x-0'}
      transition-all duration-300 transform
      ${isLeaving ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      ${variantStyle.bgColor} ${variantStyle.textColor} ${variantStyle.borderColor}
    `}>
      <Icon className={`w-5 h-5 ${variantStyle.iconColor} ${isLeaving ? '' : 'animate-bounce'}`} />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};

export default Toast;
