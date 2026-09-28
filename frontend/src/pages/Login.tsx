import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  isBn: boolean;
  onToast: (msg: string) => void;
}

const Login: React.FC<LoginProps> = ({ isBn, onToast }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res?.requires_verification) {
        onToast(isBn ? 'আপনার অ্যাকাউন্ট ভেরিফাই করুন। ৫ মিনিটের কোড পাঠানো হয়েছে।' : 'Please verify your email. A 5-minute code has been sent.');
        navigate(`/verify-email?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectTarget)}`);
        return;
      }
      onToast(isBn ? 'সফলভাবে লগইন করেছেন!' : 'Logged in successfully!');
      navigate(redirectTarget);
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.requires_verification) {
        onToast(isBn ? 'আপনার ইমেইল ভেরিফাই করা প্রয়োজন।' : 'Please verify your email address.');
        navigate(`/verify-email?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectTarget)}`);
        return;
      }
      setError(err.response?.data?.message || (isBn ? 'লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করুন।' : 'Login failed. Please check credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-28 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #fff5f5 0%, #fff 60%, #fef2f2 100%)' }}>

      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #fee2e2, transparent)' }} />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #fecaca, transparent)' }} />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ef4444, transparent)' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(135deg, #dc2626, #7f1d1d)' }}>
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
                <path d="M12 2.2C12 2.2 5 11 5 16C5 19.87 8.13 23 12 23C15.87 23 19 19.87 19 16C19 11 12 2.2 12 2.2Z" />
                <path d="M9.5 13.5C8.8 14.8 9 16.5 9.8 17.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />
              </svg>
            </div>
            <span className="text-2xl font-extrabold text-zinc-900 tracking-tight">
              Rokto<span className="text-red-500">Link</span>BD
            </span>
          </Link>
          <h1 className="text-3xl font-black text-zinc-900 mb-2">
            {isBn ? 'স্বাগতম ফিরে আসায়' : 'Welcome Back'}
          </h1>
          <p className="text-zinc-500 text-sm">
            {isBn ? 'আপনার রক্তলিংকবিডি অ্যাকাউন্টে প্রবেশ করুন' : 'Sign in to your RoktoLinkBD account'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-zinc-100"
          style={{ boxShadow: '0 20px 60px rgba(185,28,28,0.1), 0 4px 20px rgba(0,0,0,0.06)' }}>

          {/* Error */}
          {error && (
            <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
              </div>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">
                {isBn ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-zinc-50 border-2 border-zinc-200 text-sm focus:outline-none focus:border-red-400 focus:bg-white transition-all text-zinc-800 placeholder:text-zinc-400"
                />
              </div>
            </div>

            {/* Password with Forgot Password link */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider">
                  {isBn ? 'পাসওয়ার্ড' : 'Password'}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors"
                >
                  {isBn ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?'}
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-zinc-50 border-2 border-zinc-200 text-sm focus:outline-none focus:border-red-400 focus:bg-white transition-all text-zinc-800 placeholder:text-zinc-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              id="login-submit-btn"
              className="w-full py-4 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2.5 disabled:opacity-60 transition-all duration-300 mt-2"
              style={{
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
                boxShadow: loading ? 'none' : '0 8px 25px rgba(185,28,28,0.35)',
              }}
            >
              {loading ? (
                <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />{isBn ? 'প্রবেশ করছি…' : 'Signing in…'}</>
              ) : (
                <><svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>{isBn ? 'লগইন করুন' : 'Sign In'}</>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-4 rounded-xl bg-red-50/60 border border-red-100 text-xs text-red-800 leading-relaxed flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">
              ✓
            </div>
            <div>
              <strong className="block mb-0.5 font-bold">
                {isBn ? 'নিরাপদ রক্তের সমন্বয়' : 'Verified Emergency Blood Network'}
              </strong>
              {isBn
                ? 'রক্তদান করতে অথবা রক্তের জন্য অনুরোধ জানাতে ভেরিফায়েড লগইন থাকা বাধ্যতামূলক।'
                : 'Users must be logged in with a verified account to donate blood or request blood.'}
            </div>
          </div>
        </div>

        {/* Register Link */}
        <p className="text-center mt-6 text-sm text-zinc-500">
          {isBn ? 'অ্যাকাউন্ট নেই?' : "Don't have an account?"}{' '}
          <Link to="/register" className="font-bold text-red-600 hover:text-red-800 transition-colors">
            {isBn ? 'ফ্রি অ্যাকাউন্ট খুলুন →' : 'Create Free Account →'}
          </Link>
        </p>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 mt-6 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            {isBn ? 'সুরক্ষিত' : 'Secure'}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            {isBn ? 'বিনামূল্যে' : 'Free Forever'}
          </span>
          <span>•</span>
          <span>Bangladesh</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
