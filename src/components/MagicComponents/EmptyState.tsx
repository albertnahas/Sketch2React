import React from "react";
import { cn } from "../../lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  iconClassName?: string;
}

const EmptyState = ({
  title,
  description,
  icon,
  className,
  iconClassName,
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        "flex h-full flex-col items-center justify-center px-6 py-14 text-center",
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            "mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/10 to-indigo-800/20",
            iconClassName
          )}
        >
          {icon}
        </div>
      )}

      <h3 className="animate-shimmer-text mb-2 bg-clip-text bg-[length:200px_100%] bg-gradient-to-r from-transparent via-indigo-500 to-transparent text-lg font-semibold text-gray-100">
        {title}
      </h3>

      {description && (
        <p className="max-w-sm text-sm text-gray-400">{description}</p>
      )}
    </div>
  );
};

export default EmptyState;
