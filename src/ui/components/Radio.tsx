import React from 'react';
import PropTypes from 'prop-types';

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

Radio.propTypes = {
	name: PropTypes.string.isRequired,
	value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
	checked: PropTypes.bool.isRequired,
	onChange: PropTypes.func.isRequired,
	id: PropTypes.string.isRequired,
	style: PropTypes.object,
};

export default Radio;
