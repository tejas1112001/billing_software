import { useAuthStore } from '@/stores/authStore';

/**
 * Returns a helper to check if the current user has a specific module permission.
 * - ADMIN users always have access to every module.
 * - OPERATOR users must have the specific permission in their permissions array.
 */
export function usePermissions() {
  const user = useAuthStore((s) => s.user);

  function hasPermission(permission: string): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return (user.permissions ?? []).includes(permission);
  }

  return { hasPermission };
}
