import React from 'react';

type ButtonProps = {
    children: React.ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    className?: string;
};

const Button: React.FC<ButtonProps> = ({
    children,
    onClick,
    type = 'button',
    disabled = false,
    className = 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors',
}) => (
    <button 
        type={type} 
        onClick={onClick} 
        disabled={disabled}
        className={className}
    >
        {children}
    </button>
);

export default Button;