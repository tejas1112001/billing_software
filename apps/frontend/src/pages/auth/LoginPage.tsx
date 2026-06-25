import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, AlertCircle, BarChart3, Receipt, Package, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const features = [
  { icon: Receipt,    label: 'Smart Invoicing',    desc: 'Generate & track bills instantly'  },
  { icon: Package,    label: 'Inventory Control',  desc: 'Real-time stock management'        },
  { icon: BarChart3,  label: 'Analytics',          desc: 'Insightful reports at a glance'    },
  { icon: ShieldCheck,label: 'Secure Access',      desc: 'Role-based access control'         },
];

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError]   = useState<string>('');
  const navigate  = useNavigate();
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
      if (result.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      let errorMsg = 'Login failed. Please try again.';
      if (err && typeof err === 'object') {
        const error = err as any;
        if (error.response?.data?.error) {
          errorMsg = error.response.data.error;
        } else if (error.message) {
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
    <>
      <style>{`
        /* ── Shell ──────────────────────────────────────────── */
        .ls-shell {
          display: flex;
          min-height: 100vh;
          width: 100%;
        }

        /* ── Left brand panel ───────────────────────────────── */
        .ls-brand {
          width: 46%;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem 3rem;
          background: linear-gradient(160deg, #1e1b4b 0%, #2d2470 60%, #1a1040 100%);
          position: relative;
          overflow: hidden;
        }

        /* subtle top-right circle */
        .ls-brand::before {
          content: '';
          position: absolute;
          top: -160px; right: -160px;
          width: 420px; height: 420px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,.22) 0%, transparent 65%);
          pointer-events: none;
        }
        /* bottom-left circle */
        .ls-brand::after {
          content: '';
          position: absolute;
          bottom: -120px; left: -100px;
          width: 340px; height: 340px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(79,70,229,.18) 0%, transparent 65%);
          pointer-events: none;
        }

        /* Logo row */
        .ls-logo {
          display: flex;
          align-items: center;
          gap: .75rem;
          position: relative;
          z-index: 1;
        }
        .ls-logo-icon {
          width: 2.6rem; height: 2.6rem;
          border-radius: .75rem;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 18px rgba(99,102,241,.45);
        }
        .ls-logo-name {
          font-size: 1.45rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -.02em;
        }
        .ls-logo-tag {
          font-size: .65rem;
          color: rgba(255,255,255,.45);
          letter-spacing: .09em;
          text-transform: uppercase;
          margin-top: 1px;
        }

        /* Centre copy */
        .ls-hero {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 3rem 0 2rem;
        }
        .ls-tagline {
          font-size: 2.15rem;
          font-weight: 800;
          color: #fff;
          line-height: 1.2;
          letter-spacing: -.03em;
          margin-bottom: .9rem;
        }
        .ls-tagline span {
          background: linear-gradient(90deg, #818cf8, #c4b5fd);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .ls-sub {
          font-size: .92rem;
          color: rgba(255,255,255,.55);
          line-height: 1.65;
          max-width: 310px;
          margin-bottom: 2.5rem;
        }

        /* Feature grid */
        .ls-features {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: .85rem;
        }
        .ls-feat {
          display: flex;
          align-items: flex-start;
          gap: .6rem;
        }
        .ls-feat-icon {
          width: 2rem; height: 2rem;
          border-radius: .5rem;
          background: rgba(99,102,241,.18);
          border: 1px solid rgba(99,102,241,.28);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .ls-feat-label {
          font-size: .78rem;
          font-weight: 600;
          color: rgba(255,255,255,.88);
          display: block;
        }
        .ls-feat-desc {
          font-size: .67rem;
          color: rgba(255,255,255,.42);
          display: block;
          margin-top: 1px;
        }

        /* Divider line */
        .ls-rule {
          position: relative; z-index: 1;
          height: 1px;
          background: rgba(255,255,255,.1);
          margin: 2rem 0 1.5rem;
        }

        /* Brand footer */
        .ls-brand-footer {
          position: relative; z-index: 1;
          font-size: .68rem;
          color: rgba(255,255,255,.28);
        }

        /* ── Right form panel ───────────────────────────────── */
        .ls-form-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          background: hsl(var(--background));
          overflow-y: auto;
        }
        .ls-form-inner {
          width: 100%;
          max-width: 400px;
        }

        .ls-eyebrow {
          font-size: .72rem;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: hsl(var(--primary));
          margin-bottom: .55rem;
        }
        .ls-title {
          font-size: 1.95rem;
          font-weight: 800;
          letter-spacing: -.03em;
          color: hsl(var(--foreground));
          margin-bottom: .35rem;
        }
        .ls-subtitle {
          font-size: .88rem;
          color: hsl(var(--muted-foreground));
          margin-bottom: 2rem;
        }

        /* Error banner */
        .ls-err {
          display: flex;
          align-items: flex-start;
          gap: .55rem;
          background: hsl(var(--destructive) / .08);
          border: 1px solid hsl(var(--destructive) / .2);
          border-radius: .6rem;
          padding: .7rem .9rem;
          margin-bottom: 1.25rem;
          color: hsl(var(--destructive));
          font-size: .8rem;
          line-height: 1.5;
        }

        /* Fields */
        .ls-fields {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }
        .ls-field {
          display: flex;
          flex-direction: column;
          gap: .4rem;
        }
        .ls-field label {
          font-size: .82rem;
          font-weight: 600;
          color: hsl(var(--foreground));
        }
        .ls-pw-wrap { position: relative; }
        .ls-pw-btn {
          position: absolute;
          right: .75rem; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer; padding: 0;
          color: hsl(var(--muted-foreground));
          display: flex; align-items: center;
          transition: color .15s;
        }
        .ls-pw-btn:hover { color: hsl(var(--foreground)); }
        .ls-field-err {
          display: flex; align-items: center; gap: .3rem;
          font-size: .73rem;
          color: hsl(var(--destructive));
        }

        .ls-footer {
          margin-top: 1.75rem;
          text-align: center;
          font-size: .72rem;
          color: hsl(var(--muted-foreground));
        }

        /* ── Mobile: brand collapses to slim top bar ─────────── */
        @media (max-width: 767px) {
          .ls-shell    { flex-direction: column; }
          .ls-brand    {
            width: 100%; flex-shrink: 0;
            min-height: unset;
            padding: 1.25rem 1.25rem 1.5rem;
            flex-direction: column; gap: 0;
          }
          .ls-brand::before, .ls-brand::after { display: none; }
          .ls-hero     { display: none; }
          .ls-rule     { display: none; }
          .ls-brand-footer { display: none; }
          .ls-form-panel {
            padding: 2rem 1.25rem;
            justify-content: flex-start;
          }
          .ls-title    { font-size: 1.65rem; }
        }

        /* ── Tablet ────────────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1024px) {
          .ls-brand    { width: 42%; padding: 2.5rem 2rem; }
          .ls-tagline  { font-size: 1.75rem; }
          .ls-features { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="ls-shell">

        {/* ══ LEFT BRAND PANEL ══ */}
        <aside className="ls-brand" aria-label="BillSoft branding">
          {/* Logo */}
          <div className="ls-logo">
            <div className="ls-logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="8" y1="13" x2="16" y2="13"/>
                <line x1="8" y1="17" x2="16" y2="17"/>
                <line x1="10" y1="9" x2="8" y2="9"/>
              </svg>
            </div>
            <div>
              <div className="ls-logo-name">BillSoft</div>
              <div className="ls-logo-tag">Billing &amp; Inventory</div>
            </div>
          </div>

          {/* Hero copy */}
          <div className="ls-hero">
            <h1 className="ls-tagline">
              Run your store<br />
              with <span>clarity.</span>
            </h1>
            <p className="ls-sub">
              Everything you need to manage billing, stock, and finances — in one clean, fast platform.
            </p>

            {/* Feature grid */}
            <div className="ls-features">
              {features.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="ls-feat">
                  <div className="ls-feat-icon">
                    <Icon size={13} color="#818cf8" />
                  </div>
                  <div>
                    <span className="ls-feat-label">{label}</span>
                    <span className="ls-feat-desc">{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ls-rule" />
          <div className="ls-brand-footer">© 2026 BillSoft. All rights reserved.</div>
        </aside>

        {/* ══ RIGHT FORM PANEL ══ */}
        <main className="ls-form-panel">
          <div className="ls-form-inner">
            <p className="ls-eyebrow">Secure Portal</p>
            <h2 className="ls-title">Welcome back</h2>
            <p className="ls-subtitle">Sign in to your BillSoft account to continue.</p>

            {/* Server error */}
            {serverError && (
              <div className="ls-err" role="alert">
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="ls-fields">
                {/* Username */}
                <div className="ls-field">
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
                    <span className="ls-field-err">
                      <AlertCircle size={11} />
                      {errors.username.message}
                    </span>
                  )}
                </div>

                {/* Password */}
                <div className="ls-field">
                  <Label htmlFor="password">Password</Label>
                  <div className="ls-pw-wrap">
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
                      className="ls-pw-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="ls-field-err">
                      <AlertCircle size={11} />
                      {errors.password.message}
                    </span>
                  )}
                </div>
              </div>

              <Button
                id="login-submit-btn"
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
                style={{ height: '2.8rem', fontSize: '.9rem', fontWeight: 600, letterSpacing: '.01em' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <p className="ls-footer">
              © 2026 BillSoft · Billing &amp; Inventory Management
            </p>
          </div>
        </main>

      </div>
    </>
  );
}
