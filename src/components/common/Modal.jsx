import React from 'react';
import { useTheme } from '../ThemeProvider';
import { X } from 'lucide-react';
import Button from './Button';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md', // sm, md, lg, xl
  className = '',
}) => {
  const { styles, colors } = useTheme();

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
        </div>

        <div 
          className={`
            inline-block align-bottom sm:align-middle
            w-full ${sizeClasses[size]} 
            my-8 
            ${styles.modal()}
            ${className}
            overflow-hidden
            transform transition-all
          `}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className={`px-6 py-4 border-b ${colors.border}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-medium ${colors.text}`}>
                {title}
              </h3>
              <button
                onClick={onClose}
                className={`p-1 rounded-full hover:${colors.background} transition-colors`}
              >
                <X className={`w-5 h-5 ${colors.textSecondary}`} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className={`px-6 py-4 border-t ${colors.border} bg-opacity-50`}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = React.useState(initialState);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(prev => !prev);

  return { isOpen, open, close, toggle };
};

export default Modal;
