import React, { ReactNode, useState } from "react";
import { cn } from "../../lib/utils";

interface CodeContainerProps {
  children: ReactNode;
  className?: string;
  title?: string;
  glowColor?: string;
}

const CodeContainer = ({
  children,
  className,
  title = "Generated Code",
  glowColor = "rgb(99 102 241)",
}: CodeContainerProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "relative rounded-xl border border-gray-800 bg-gray-900 p-1 shadow-md transition-all duration-300",
        isHovered ? "shadow-xl" : "shadow",
        className
      )}
      style={{
        boxShadow: isHovered 
          ? `0 0 20px -5px ${glowColor}, 0 0 10px -5px ${glowColor} inset` 
          : `0 0 10px -10px ${glowColor}`
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {title && (
        <div className="absolute -top-3 left-5 bg-gray-900 px-2 text-xs font-medium text-gray-300">
          <span 
            className={cn(
              "transition-colors duration-300", 
              isHovered ? "text-indigo-400" : "text-gray-400"
            )}
          >
            {title}
          </span>
        </div>
      )}
      <div 
        className="overflow-hidden rounded-lg"
        style={{
          background: "linear-gradient(to bottom right, rgba(19, 19, 21, 0.8), rgba(10, 10, 12, 1))",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default CodeContainer;
