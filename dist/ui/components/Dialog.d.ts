import React from "react";
type DialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
};
declare const Dialog: React.FC<DialogProps>;
export default Dialog;
