import React from 'react';

type RadioProps = React.InputHTMLAttributes<HTMLInputElement>;

const Radio: React.FC<RadioProps> = ({ style, ...props }) => (
	<input
		type="radio"
		style={{
			width: 16,
			height: 16,
			accentColor: '#0070f3',
			marginRight: 4,
			...style,
		}}
		{...props}
	/>
);

export default Radio;
