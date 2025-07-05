import React from 'react';

interface ButtonProps {
	children: React.ReactNode;
	onClick?: () => void;
	style?: React.CSSProperties;
	title?: string;
	'aria-label'?: string;
	'data-testid'?: string;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, style, title, 'aria-label': ariaLabel, 'data-testid': dataTestId }) => {
	return (
		<button onClick={onClick} style={style} title={title} aria-label={ariaLabel} data-testid={dataTestId}>
			{children}
		</button>
	);
};

export default Button;
