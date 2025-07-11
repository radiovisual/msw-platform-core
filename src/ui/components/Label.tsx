import React from 'react';

interface LabelProps {
	children: React.ReactNode;
	htmlFor?: string;
	style?: React.CSSProperties;
}

const Label: React.FC<LabelProps> = ({ children, htmlFor, style }) => {
	return (
		<label htmlFor={htmlFor} style={style}>
			{children}
		</label>
	);
};

export default Label;
