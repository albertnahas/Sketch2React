import React from "react";
import { cn } from "../../lib/utils";

interface CodePreviewLoaderProps {
  className?: string;
  text?: string;
  secondaryText?: string;
  size?: "sm" | "md" | "lg";
}

const CodePreviewLoader = ({
  className,
  text = "Converting to React",
  secondaryText = "Transforming your design into code...",
  size = "md",
}: CodePreviewLoaderProps) => {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-3",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center space-y-4 py-8",
        className
      )}
    >
      <div className="relative">
        <div
          className={cn(
            "animate-spin rounded-full border-b-transparent border-indigo-500",
            sizeClasses[size]
          )}
        />
        <div
          className={cn(
            "absolute left-0 top-0 animate-ping rounded-full border-2 border-indigo-500/30",
            sizeClasses[size]
          )}
        />
      </div>

      <div className="text-center">
        <p className={cn("font-medium text-indigo-400", textSizeClasses[size])}>
          {text}
          <span className="animate-pulse">...</span>
        </p>
        {secondaryText && (
          <p className="mt-1 text-sm text-gray-400">{secondaryText}</p>
        )}
      </div>
    </div>
  );
};

export default CodePreviewLoader;
