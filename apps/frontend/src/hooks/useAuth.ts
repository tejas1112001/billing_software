import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const { user, isAuthenticated, clearAuth, setAuth } = useAuthStore();
  const navigate = useNavigate();
  const logout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    finally { clearAuth(); navigate('/login'); }
  };
  return { user, isAuthenticated, logout, setAuth, clearAuth };
}
