import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

const schema = z.object({
  username: z.string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .trim(),
  password: z.string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string>('');
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: FormData) => {
    try {
      setServerError('');
      const result = await authService.login(data);
      setAuth(result.accessToken, result.user);
      
      toast.success('Login successful!');
      
      // Redirect admins to /admin, operators to /
      if (result.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      
      // Better error extraction
      let errorMsg = 'Login failed. Please try again.';
      
      if (err && typeof err === 'object') {
        const error = err as any;
        
        // Check for axios response error
        if (error.response?.data?.error) {
          errorMsg = error.response.data.error;
        } else if (error.message) {
          // Network or other errors
          errorMsg = error.message;
          if (errorMsg.includes('Network Error') || errorMsg.includes('ECONNREFUSED')) {
            errorMsg = 'Cannot connect to server. Please ensure the backend is running on port 4000.';
          }
        }
      }
      
      setServerError(errorMsg);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted">
      <div className="w-full max-w-md">
        {/* App Branding */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary mb-1">BillSoft</h1>
          <p className="text-sm text-muted-foreground">Billing & Inventory Management</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Enter your credentials to access the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {serverError && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{serverError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  autoComplete="username"
                  autoFocus
                  {...register('username')}
                  className={errors.username ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {errors.username && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    {...register('password')}
                    className={`pr-10 ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>© 2026 BillSoft. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

