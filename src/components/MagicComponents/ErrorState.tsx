import React from "react";
import { cn } from "../../lib/utils";

interface ErrorStateProps {
  title: string;
  error: string;
  suggestion?: string;
  className?: string;
}

const ErrorState = ({
  title,
  error,
  suggestion = "Try again or modify your sketch.",
  className,
}: ErrorStateProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className
      )}
    >
      <div className="relative mb-5">
        <div className="absolute -inset-1 -z-10 animate-pulse rounded-full bg-red-500/20 blur-md"></div>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-red-500/10 to-red-600/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
      </div>

      <h3 className="mb-2 text-lg font-semibold text-red-500">{title}</h3>
      
      <div className="mt-3 max-w-md rounded-lg border border-red-900/50 bg-red-900/10 p-4 text-left">
        <pre className="overflow-auto text-xs text-red-300">{error}</pre>
      </div>
      
      {suggestion && (
        <p className="mt-4 text-sm text-gray-400">{suggestion}</p>
      )}
    </div>
  );
};

export default ErrorState;
