import React from 'react';

interface LabelProps {
	htmlFor: string;
	children: React.ReactNode;
	style?: React.CSSProperties;
}

const Label: React.FC<LabelProps> = ({ htmlFor, children, style }) => {
	return (
		<label htmlFor={htmlFor} style={{ cursor: 'pointer', ...style }}>
			{children}
		</label>
	);
};

export default Label;
