import { LogOut, User, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface UserMenuProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function UserMenu({ variant = 'default', className }: UserMenuProps) {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      /* ignore */
    }
    clearAuth();
    navigate('/login');
  };

  if (!user) return null;

  // Get user initials for avatar
  const initials = user.username
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2.5 rounded-lg hover:bg-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            variant === 'default' ? 'px-2 py-1.5' : 'p-1',
            className
          )}
        >
          <Avatar className="h-9 w-9 border-2 border-primary/10">
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {variant === 'default' && (
            <>
              <div className="flex flex-col items-start justify-center min-w-0">
                <p className="text-sm font-semibold leading-tight truncate max-w-[120px]">
                  {user.username}
                </p>
                <p className="text-xs text-muted-foreground leading-tight capitalize">
                  {user.role?.toLowerCase()}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.username}</p>
            <p className="text-xs leading-none text-muted-foreground capitalize">
              {user.role?.toLowerCase()}
            </p>
            {user.operatorType && (
              <div className="pt-1">
                <Badge
                  variant={user.operatorType === 'CASH' ? 'success' : 'warning'}
                  className="text-xs"
                >
                  {user.operatorType}
                </Badge>
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
