import React from 'react';
type PopoverProps = {
	trigger: React.ReactNode;
	children: React.ReactNode | ((close: () => void) => React.ReactNode);
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	placement?: 'left' | 'right';
};
declare const Popover: React.FC<PopoverProps>;
export default Popover;
