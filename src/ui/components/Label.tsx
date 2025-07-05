import React from 'react';

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const Label: React.FC<LabelProps> = ({ children, style, ...props }) => (
	<label style={{ fontSize: 14, marginRight: 4, ...style }} {...props}>
		{children}
	</label>
);

export default Label;
