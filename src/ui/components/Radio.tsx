import React from 'react';
import { theme } from '../theme';

interface RadioProps {
	id: string;
	name: string;
	value: string;
	checked: boolean;
	onChange: () => void;
	'aria-label'?: string;
}

const Radio: React.FC<RadioProps> = ({ id, name, value, checked, onChange, 'aria-label': ariaLabel }) => {
	return (
		<input
			type="radio"
			id={id}
			name={name}
			value={value}
			checked={checked}
			onChange={onChange}
			aria-label={ariaLabel}
			style={{
				width: '16px',
				height: '16px',
				accentColor: theme.colors.primary,
			}}
		/>
	);
};

export default Radio;
