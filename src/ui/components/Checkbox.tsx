import React from 'react';
import { theme } from '../theme';

interface CheckboxProps {
	id: string;
	checked: boolean;
	onChange: () => void;
	'aria-label'?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ id, checked, onChange, 'aria-label': ariaLabel }) => {
	return (
		<input
			type="checkbox"
			id={id}
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

export default Checkbox;
