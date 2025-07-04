import React from "react";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  id?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, id, ...rest }) => {
  return (
    <input
      type="checkbox"
      role="checkbox"
      checked={checked}
      onChange={onChange}
      id={id}
      style={{ width: 18, height: 18, accentColor: "#0070f3", cursor: "pointer" }}
      {...rest}
    />
  );
};

export default Checkbox; 