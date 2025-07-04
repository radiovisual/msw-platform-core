import React from "react";
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    id?: string;
}
declare const Checkbox: React.FC<CheckboxProps>;
export default Checkbox;
