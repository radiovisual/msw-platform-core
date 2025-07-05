import React from 'react';
import PropTypes from 'prop-types';

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

Button.propTypes = {
	children: PropTypes.node.isRequired,
	onClick: PropTypes.func,
	style: PropTypes.object,
	title: PropTypes.string,
	'aria-label': PropTypes.string,
	'data-testid': PropTypes.string,
};

export default Button;
