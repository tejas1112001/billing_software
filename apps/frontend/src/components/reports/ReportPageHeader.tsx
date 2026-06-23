import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReactNode } from 'react';

interface ReportPageHeaderProps {
  title: string;
  description?: string;
  backTo?: string;
  action?: ReactNode;
}

export function ReportPageHeader({
  title,
  description,
  backTo = '/reports',
  action,
}: ReportPageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-2.5 min-w-0">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(backTo)}
          className="shrink-0 h-9 w-9 sm:h-8 sm:w-auto sm:px-3"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Back</span>
        </Button>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight leading-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 line-clamp-2">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0 w-full sm:w-auto">{action}</div>}
    </div>
  );
}
