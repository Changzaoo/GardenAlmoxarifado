import React from 'react';
import { twitterThemeConfig } from '../../styles/twitterThemeConfig';

const Input = ({
  id,
  label,
  error,
  icon: Icon,
  className = '',
  size = 'md',
  type = 'text',
  ...props
}) => {
  const classes = twitterThemeConfig.classes;
  
  return (
    <div className={classes.form.group}>
      {label && (
        <label htmlFor={id} className={classes.form.label}>
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
            ${classes.input.base}
            ${classes.input.focus}
            ${error ? classes.input.error : ''}
            ${classes.input.sizes[size]}
            ${Icon ? 'pl-10' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className={classes.form.error}>{error}</p>
      )}
    </div>
  );
};

export default Input;
