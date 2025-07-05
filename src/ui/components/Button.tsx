import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button: React.FC<ButtonProps> = ({ children, style, ...props }) => (
	<button
		style={{
			padding: '6px 12px',
			border: '1px solid #ccc',
			borderRadius: 4,
			background: '#fff',
			cursor: 'pointer',
			...style,
		}}
		{...props}
	>
		{children}
	</button>
);

export default Button;
