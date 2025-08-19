// src/components/Button.js
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from './LoadingSpinner';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const { isDark } = useTheme();

  const baseClasses = 'font-semibold rounded-lg transition-all inline-flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-teal-500/50';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    primary: isLoading || disabled
      ? (isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
      : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transform hover:scale-105',
    secondary: isLoading || disabled
      ? (isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
      : isDark
        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white border border-gray-600'
        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 shadow-sm hover:shadow-md',
    danger: isLoading || disabled
      ? (isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
      : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl',
    ghost: isLoading || disabled
      ? (isDark ? 'text-gray-500 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
      : isDark
        ? 'text-teal-400 hover:bg-teal-500/20'
        : 'text-teal-600 hover:bg-teal-50'
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" />
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
