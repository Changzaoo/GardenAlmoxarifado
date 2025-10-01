import React from 'react';

const Input = ({
  id,
  label,
  error,
  icon: Icon,
  className = '',
  type = 'text',
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
        )}
        <input
          id={id}
          type={type}
          className={`
            w-full rounded-lg
            ${!props.disabled ? 'bg-white dark:bg-gray-700' : 'bg-[#1e2732]'}
            border border-gray-200 dark:border-gray-600 dark:border-gray-600
            text-gray-900 dark:text-white
            placeholder-gray-500 dark:placeholder-gray-400
            transition-colors
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500 dark:focus:ring-[#1D9BF0]
            focus:border-blue-500 dark:focus:border-[#1D9BF0]
            hover:border-blue-500 dark:border-[#1D9BF0]
            ${error ? 'border-red-500' : ''}
            ${Icon ? 'pl-10 pr-4' : 'px-4'} 
            py-2
            ${props.disabled ? 'opacity-75 cursor-not-allowed' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default Input;


