import React from 'react';
import PropTypes from 'prop-types';

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

Label.propTypes = {
	children: PropTypes.node.isRequired,
	htmlFor: PropTypes.string,
	style: PropTypes.object,
};

export default Label;
