import React from "react";

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement>;

const Checkbox: React.FC<CheckboxProps> = ({ style, ...props }) => (
  <input
    type="checkbox"
    style={{
      width: 16,
      height: 16,
      accentColor: "#0070f3",
      marginRight: 4,
      ...style,
    }}
    {...props}
  />
);

export default Checkbox; 