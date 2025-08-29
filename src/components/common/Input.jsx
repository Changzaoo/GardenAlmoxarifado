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
        <label htmlFor={id} className="block text-sm font-medium text-[#8899A6] mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8899A6]" />
        )}
        <input
          id={id}
          type={type}
          className={`
            w-full rounded-lg
            ${!props.disabled ? 'bg-[#253341]' : 'bg-[#1e2732]'}
            border border-[#38444D]
            text-white
            placeholder-[#8899A6]
            transition-colors
            focus:outline-none
            focus:ring-2
            focus:ring-[#1DA1F2]
            focus:border-[#1DA1F2]
            hover:border-[#1DA1F2]
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
