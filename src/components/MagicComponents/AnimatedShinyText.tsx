import { CSSProperties, FC } from "react";

export interface AnimatedShinyTextProps {
  children: React.ReactNode;
  className?: string;
  shimmerWidth?: number;
}

const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  className = "",
  shimmerWidth = 100,
  ...props
}) => {
  return (
    <span
      style={
        {
          "--shiny-width": `${shimmerWidth}px`,
        } as CSSProperties
      }
      className={`
        mx-auto max-w-md text-white
        animate-shiny-text bg-clip-text bg-no-repeat 
        [background-position:0_0] 
        [background-size:var(--shiny-width)_100%] 
        [transition:background-position_1s_cubic-bezier(.6,.6,0,1)_infinite]
        bg-gradient-to-r from-transparent via-white/80 to-transparent
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
};

export default AnimatedShinyText;
