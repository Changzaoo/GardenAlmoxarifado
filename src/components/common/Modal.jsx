import React from 'react';
import { X } from 'lucide-react';
import { twitterThemeConfig } from '../../styles/twitterThemeConfig';
import Button from './Button';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className = ''
}) => {
  if (!isOpen) return null;

  const { colors, classes } = twitterThemeConfig;

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'lg':
        return 'max-w-4xl';
      case 'xl':
        return 'max-w-6xl';
      default:
        return 'max-w-2xl';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-[#15202B] bg-opacity-75 transition-opacity" 
          onClick={onClose}
        ></div>

        {/* Modal Panel */}
        <div className={`
          ${classes.modal} 
          ${getSizeClasses()} 
          w-full relative transform transition-all 
          ${className}
        `}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600 dark:border-gray-600">
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

