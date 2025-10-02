import React from 'react';

const Input = ({
  id,
  label,
  error,
  icon: Icon,
  className = '',
  type = 'text',
  rightElement,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [hasValue, setHasValue] = React.useState(false);

  React.useEffect(() => {
    setHasValue(props.value && props.value.length > 0);
  }, [props.value]);

  const showIcon = Icon && !isFocused && !hasValue;

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {showIcon && (
          <Icon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 transition-opacity duration-200 pointer-events-none" />
        )}
        <input
          id={id}
          type={type}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full rounded-lg
            ${!props.disabled ? 'bg-white dark:bg-gray-700' : 'bg-[#1e2732]'}
            border border-gray-200 dark:border-gray-600
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            transition-all duration-200
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500 dark:focus:ring-[#1D9BF0]
            focus:border-blue-500 dark:focus:border-[#1D9BF0]
            hover:border-gray-300 dark:hover:border-gray-500
            ${error ? 'border-red-500' : ''}
            ${showIcon ? 'pl-10' : 'pl-4'} 
            ${rightElement ? 'pr-12' : 'pr-4'}
            py-3
            ${props.disabled ? 'opacity-75 cursor-not-allowed' : ''}
            ${className}
          `}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-0 top-0 h-full flex items-center pr-3">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default Input;


