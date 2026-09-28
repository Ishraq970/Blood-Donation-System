import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPasswordApi } from '../api';

interface ResetPasswordProps {
  isBn: boolean;
  onToast: (msg: string) => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ isBn, onToast }) => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const initialCode = searchParams.get('code') || '';

  const navigate = useNavigate();

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialCode);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirmation) {
      setError(isBn ? 'পাসওয়ার্ড দুটি মিলছে না।' : 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError(isBn ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPasswordApi({
        email,
        code: code.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });
      onToast(res.message || (isBn ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!' : 'Password reset successfully!'));
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || (isBn ? 'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে।' : 'Failed to reset password. Please check the code.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-28 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #fff5f5 0%, #fff 60%, #fef2f2 100%)' }}
    >
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(135deg, #dc2626, #7f1d1d)' }}
            >
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
                <path d="M12 2.2C12 2.2 5 11 5 16C5 19.87 8.13 23 12 23C15.87 23 19 19.87 19 16C19 11 12 2.2 12 2.2Z" />
              </svg>
            </div>
            <span className="text-2xl font-extrabold text-zinc-900 tracking-tight">
              Rokto<span className="text-red-500">Link</span>BD
            </span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 mb-2">
            {isBn ? 'নতুন পাসওয়ার্ড সেট করুন' : 'Reset Account Password'}
          </h1>
          <p className="text-zinc-500 text-sm">
            {isBn
              ? 'আপনার ইমেইলে প্রাপ্ত ৬-সংখ্যার কোডটি ও নতুন পাসওয়ার্ড দিন।'
              : 'Enter the 6-digit code received via email and your new password.'}
          </p>
        </div>

        <div
          className="bg-white rounded-3xl shadow-2xl p-7 sm:p-8 border border-zinc-100"
          style={{ boxShadow: '0 20px 60px rgba(185,28,28,0.08), 0 4px 20px rgba(0,0,0,0.04)' }}
        >
          {error && (
            <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              </div>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">
                {isBn ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 border-2 border-zinc-200 text-sm focus:outline-none focus:border-red-400 text-zinc-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">
                {isBn ? '৬-সংখ্যার রিসেট কোড' : '6-Digit Reset Code'}
              </label>
              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="w-full text-center py-3.5 rounded-xl bg-zinc-50 border-2 border-zinc-200 text-xl font-mono tracking-[0.4em] font-bold focus:outline-none focus:border-red-400 focus:bg-white text-zinc-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">
                {isBn ? 'নতুন পাসওয়ার্ড' : 'New Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 pr-12 py-3 rounded-xl bg-zinc-50 border-2 border-zinc-200 text-sm focus:outline-none focus:border-red-400 focus:bg-white text-zinc-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">
                {isBn ? 'নতুন পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'}
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 border-2 border-zinc-200 text-sm focus:outline-none focus:border-red-400 focus:bg-white text-zinc-800"
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6 || password.length < 6}
              className="w-full py-4 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2.5 disabled:opacity-60 transition-all duration-300 mt-2"
              style={{
                background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
                boxShadow: '0 8px 25px rgba(185,28,28,0.3)',
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>{isBn ? 'আপডেট হচ্ছে…' : 'Updating…'}</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{isBn ? 'পাসওয়ার্ড পরিবর্তন সম্পন্ন করুন' : 'Save New Password'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-zinc-500">
          <Link to="/login" className="font-bold text-red-600 hover:text-red-800 transition-colors">
            {isBn ? '← লগইন পেইজে ফিরে যান' : '← Back to Login'}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
