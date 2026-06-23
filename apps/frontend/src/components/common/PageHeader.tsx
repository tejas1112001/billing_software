import React from 'react';
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-3 sm:mb-4 lg:mb-6">
      {/* Title and Actions Row - Always on same line */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
      {/* Description Row - Below title */}
      {description && (
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
          {description}
        </p>
      )}
    </div>
  );
}
