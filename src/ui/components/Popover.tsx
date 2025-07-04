import React, { useState, useRef, useEffect } from "react";

type PopoverProps = {
  trigger: React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const Popover: React.FC<PopoverProps> = ({ trigger, children, open: controlledOpen, onOpenChange }) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = onOpenChange || setUncontrolledOpen;
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open, setOpen]);

  const close = () => setOpen(false);

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span onClick={() => setOpen(!open)} style={{ cursor: "pointer" }}>{trigger}</span>
      {open && (
        <div
          ref={popoverRef}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 4,
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            padding: 8,
            zIndex: 100,
            minWidth: 160,
          }}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </span>
  );
};

export default Popover; 