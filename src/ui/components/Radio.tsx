import React from 'react';

interface RadioProps {
	name: string;
	value: string | number;
	checked: boolean;
	onChange: () => void;
	id: string;
	style?: React.CSSProperties;
}

const Radio: React.FC<RadioProps> = ({ name, value, checked, onChange, id, style }) => {
	return <input type="radio" name={name} value={value} checked={checked} onChange={onChange} id={id} style={style} />;
};

export default Radio;
