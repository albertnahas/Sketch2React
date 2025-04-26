import { cn } from "../../lib/utils";
import React from "react";

interface RainbowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const RainbowButton = React.forwardRef<
  HTMLButtonElement,
  RainbowButtonProps
>(({ children, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "group relative inline-flex h-10 animate-rainbow cursor-pointer items-center justify-center rounded-lg border-0 bg-[length:200%] px-6 py-2 font-medium text-white transition-colors [background-clip:padding-box,border-box,border-box] [background-origin:border-box] [border:calc(0.08*1rem)_solid_transparent]",
        
        // before styles
        "before:absolute before:bottom-[-20%] before:left-1/2 before:z-0 before:h-1/5 before:w-3/5 before:-translate-x-1/2 before:animate-rainbow before:bg-[linear-gradient(90deg,#ff0080,#7928ca,#1e3c72,#2a5298,#ff0080)]",
        
        // light mode colors
        "bg-[linear-gradient(#121213,#121213),linear-gradient(#121213_50%,rgba(18,18,19,0.6)_80%,rgba(18,18,19,0)),linear-gradient(90deg,#ff0080,#7928ca,#1e3c72,#2a5298,#ff0080)]",
        
        className,
      )}
      style={{ 
        "--color-1": "#ff0080", 
        "--color-2": "#ff0080", 
        "--color-3": "#1e3c72", 
        "--color-4": "#2a5298", 
        "--color-5": "#7928ca" 
      } as React.CSSProperties}
      {...props}
    >
      {children}
    </button>
  );
});

RainbowButton.displayName = "RainbowButton";

export default RainbowButton;
