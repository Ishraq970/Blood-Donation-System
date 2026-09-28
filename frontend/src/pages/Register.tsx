import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RegisterProps {
  isBn: boolean;
  onToast: (msg: string) => void;
}

const Register: React.FC<RegisterProps> = ({ isBn, onToast }) => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/';

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 2-step form

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setError(isBn ? 'নাম ও ইমেইল প্রয়োজন।' : 'Name and email are required.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (formData.password !== formData.password_confirmation) {
      setError(isBn ? 'পাসওয়ার্ড দুটি মিলছে না।' : 'Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError(isBn ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const result = await register({ name: formData.name, email: formData.email, phone: formData.phone, password: formData.password });
      onToast(result.delivery_status === 'failed'
        ? (isBn ? 'অ্যাকাউন্ট তৈরি হয়েছে, কিন্তু ইমেইল পাঠানো যায়নি। ভেরিফিকেশন পেজ থেকে পুনরায় কোড পাঠান।' : 'Account created, but the email was not delivered. Use Resend Code on the verification page.')
        : (isBn ? 'রেজিস্ট্রেশন সফল! আপনার ইমেইলে ৫ মিনিটের ভেরিফিকেশন কোড পাঠানো হয়েছে।' : 'Registration successful! A 5-minute verification code has been sent to your email.'));
      navigate(`/verify-email?email=${encodeURIComponent(formData.email)}&redirect=${encodeURIComponent(redirectTarget)}`);
    } catch (err: any) {
      setError(err.response?.data?.message || (isBn ? 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।' : 'Registration failed. Please check form details.'));
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (pw: string) => {
    if (pw.length === 0) return null;
    if (pw.length < 6) return { level: 1, label: isBn ? 'দুর্বল' : 'Weak', color: '#ef4444' };
    if (pw.length < 10 || !/[A-Z]/.test(pw)) return { level: 2, label: isBn ? 'মাঝারি' : 'Fair', color: '#f59e0b' };
    return { level: 3, label: isBn ? 'শক্তিশালী' : 'Strong', color: '#10b981' };
  };
  const strength = passwordStrength(formData.password);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-28 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #fff5f5 0%, #fff 60%, #fef2f2 100%)' }}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #fee2e2, transparent)' }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #fecaca, transparent)' }}
        />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(135deg, #dc2626, #7f1d1d)' }}
            >
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
            {isBn ? 'যোগ দিন আমাদের সাথে' : 'Join RoktoLinkBD'}
          </h1>
          <p className="text-zinc-500 text-sm">
            {isBn ? 'রক্তদাতা বা সহায়কারী হিসেবে নিবন্ধন করুন' : 'Register as a blood donor or helper'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-6 px-2">
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    step >= s ? 'text-white' : 'text-zinc-400 bg-zinc-100'
                  }`}
                  style={step >= s ? { background: 'linear-gradient(135deg, #b91c1c, #dc2626)' } : {}}
                >
                  {step > s ? (
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    s
                  )}
                </div>
                <span className={`text-xs font-semibold hidden sm:block ${step >= s ? 'text-zinc-800' : 'text-zinc-400'}`}>
                  {s === 1 ? (isBn ? 'পরিচয়' : 'Identity') : (isBn ? 'নিরাপত্তা' : 'Security')}
                </span>
              </div>
              {s < 2 && (
                <div className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${step > 1 ? 'bg-red-500' : 'bg-zinc-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Card */}
        <div
          className="bg-white rounded-3xl shadow-2xl p-8 border border-zinc-100"
          style={{ boxShadow: '0 20px 60px rgba(185,28,28,0.1), 0 4px 20px rgba(0,0,0,0.06)' }}
        >
          {/* Error */}
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

          {/* Step 1: Identity */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">
                  {isBn ? 'সম্পূর্ণ নাম' : 'Full Name'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={isBn ? 'যেমন: রহিম ইসলাম' : 'e.g. Rahim Islam'}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-zinc-50 border-2 border-zinc-200 text-sm focus:outline-none focus:border-red-400 focus:bg-white transition-all text-zinc-800 placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">
                  {isBn ? 'ইমেইল অ্যাড্রেস' : 'Email Address'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-zinc-50 border-2 border-zinc-200 text-sm focus:outline-none focus:border-red-400 focus:bg-white transition-all text-zinc-800 placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">
                  {isBn ? 'মোবাইল নম্বর' : 'Phone Number'}
                  <span className="text-zinc-400 font-normal ml-1">({isBn ? 'ঐচ্ছিক' : 'optional'})</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.59 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="017XXXXXXXX"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-zinc-50 border-2 border-zinc-200 text-sm focus:outline-none focus:border-red-400 focus:bg-white transition-all text-zinc-800 placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2.5 mt-2 transition-all cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)', boxShadow: '0 8px 25px rgba(185,28,28,0.35)' }}
              >
                {isBn ? 'পরবর্তী ধাপ' : 'Continue'} →
              </button>
            </form>
          )}

          {/* Step 2: Security */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Back summary */}
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-black text-sm shrink-0">
                  {formData.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-zinc-800 truncate">{formData.name}</div>
                  <div className="text-xs text-zinc-500 truncate">{formData.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-red-500 font-bold hover:text-red-700 transition-colors shrink-0 cursor-pointer"
                >
                  {isBn ? 'পরিবর্তন' : 'Edit'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">
                  {isBn ? 'পাসওয়ার্ড' : 'Password'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={isBn ? 'কমপক্ষে ৬ অক্ষর' : 'Min. 6 characters'}
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-zinc-50 border-2 border-zinc-200 text-sm focus:outline-none focus:border-red-400 focus:bg-white transition-all text-zinc-800 placeholder:text-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {strength && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3].map((l) => (
                        <div
                          key={l}
                          className="flex-1 h-1 rounded-full transition-all duration-300"
                          style={{ background: strength.level >= l ? strength.color : '#e5e7eb' }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">
                  {isBn ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="password_confirmation"
                    required
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    placeholder={isBn ? 'পাসওয়ার্ড পুনরায় দিন' : 'Repeat password'}
                    className={`w-full pl-11 pr-12 py-3.5 rounded-xl bg-zinc-50 border-2 text-sm focus:outline-none focus:bg-white transition-all text-zinc-800 placeholder:text-zinc-400 ${
                      formData.password_confirmation && formData.password !== formData.password_confirmation
                        ? 'border-red-300'
                        : 'border-zinc-200 focus:border-red-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showConfirm ? (
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                  {formData.password_confirmation && formData.password === formData.password_confirmation && (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2 text-emerald-500">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                id="register-submit-btn"
                className="w-full py-4 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2.5 disabled:opacity-60 transition-all duration-300 mt-2 cursor-pointer"
                style={{
                  background: loading ? '#9ca3af' : 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
                  boxShadow: loading ? 'none' : '0 8px 25px rgba(185,28,28,0.35)',
                }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    {isBn ? 'তৈরি করছি…' : 'Creating account…'}
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" />
                      <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                    {isBn ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Free Account'}
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-zinc-400 mt-5">
            {isBn ? 'নিবন্ধন করে আপনি আমাদের' : 'By registering you agree to our'}{' '}
            <Link to="/terms" className="text-red-500 hover:underline">
              {isBn ? 'শর্তাবলী' : 'Terms'}
            </Link>{' '}
            &{' '}
            <Link to="/privacy" className="text-red-500 hover:underline">
              {isBn ? 'গোপনীয়তানীতি' : 'Privacy Policy'}
            </Link>
            {isBn ? ' মেনে নিচ্ছেন' : ''}.
          </p>
        </div>

        {/* Login Link */}
        <p className="text-center mt-6 text-sm text-zinc-500">
          {isBn ? 'ইতিমধ্যে অ্যাকাউন্ট আছে?' : 'Already have an account?'}{' '}
          <Link to="/login" className="font-bold text-red-600 hover:text-red-800 transition-colors">
            {isBn ? 'লগইন করুন →' : 'Sign in →'}
          </Link>
        </p>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 mt-6 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            {isBn ? 'সুরক্ষিত' : 'Secure'}
          </span>
          <span>•</span>
          <span>{isBn ? 'বিনামূল্যে চিরকাল' : 'Free Forever'}</span>
          <span>•</span>
          <span>Bangladesh 🇧🇩</span>
        </div>
      </div>
    </div>
  );
};

export default Register;
