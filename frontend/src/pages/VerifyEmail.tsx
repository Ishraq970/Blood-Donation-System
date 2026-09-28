import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resendVerificationApi } from '../api';

interface VerifyEmailProps {
  isBn: boolean;
  onToast: (msg: string) => void;
}

const VerifyEmail: React.FC<VerifyEmailProps> = ({ isBn, onToast }) => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const redirectTarget = searchParams.get('redirect') || '/';

  const navigate = useNavigate();
  const { verifyEmail } = useAuth();

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes = 300 seconds
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 5-minute countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const cd = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(cd);
  }, [resendCooldown]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim();
    if (cleanCode.length !== 6) {
      setError(isBn ? 'অনুগ্রহ করে সঠিক ৬-সংখ্যার কোডটি দিন।' : 'Please enter the complete 6-digit verification code.');
      return;
    }

    if (!email) {
      setError(isBn ? 'ইমেইল অ্যাড্রেস প্রয়োজন।' : 'Email address is required.');
      return;
    }

    if (timeLeft <= 0) {
      setError(isBn ? 'কোডের মেয়াদ শেষ হয়েছে (৫ মিনিট)। অনুগ্রহ করে নতুন কোড পাঠান।' : 'Verification token has expired (5-minute limit). Please click "Resend Code".');
      return;
    }

    setLoading(true);
    try {
      await verifyEmail(email, cleanCode);
      onToast(isBn ? 'ইমেইল সফলভাবে ভেরিফাই হয়েছে! স্বাগতম।' : 'Email successfully verified! Welcome to RoktoLinkBD.');
      navigate(redirectTarget);
    } catch (err: any) {
      setError(err.response?.data?.message || (isBn ? 'ভেরিফিকেশন ব্যর্থ হয়েছে। কোড পুনরায় পরীক্ষা করুন।' : 'Verification failed. Please check the code.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending || !email) return;

    setError(null);
    setResending(true);
    try {
      const res = await resendVerificationApi(email);
      setCode('');
      setTimeLeft(res.expires_in_seconds || 300);
      setResendCooldown(60); // 60 seconds cooldown for resend button
      onToast(isBn ? 'নতুন ৫ মিনিটের ভেরিফিকেশন কোড পাঠানো হয়েছে!' : 'A fresh 5-minute verification code has been sent to your email!');
    } catch (err: any) {
      setError(err.response?.data?.message || (isBn ? 'কোড পাঠানো যায়নি। আবার চেষ্টা করুন।' : 'Failed to resend code. Please try again.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-28 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #fff5f5 0%, #fff 60%, #fef2f2 100%)' }}
    >
      {/* Decorative ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full opacity-30 bg-red-100 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full opacity-20 bg-rose-200 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
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

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-bold mb-3">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <span>{isBn ? 'ইমেইল ভেরিফিকেশন' : 'Email Verification'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 mb-2">
            {isBn ? '৫ মিনিটের ওটিপি ভেরিফাই করুন' : 'Verify Your 5-Minute Token'}
          </h1>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto">
            {isBn
              ? `আমরা আপনার ইমেইল (${email || 'আপনার অ্যাকাউন্টে'}) একটি ৫ মিনিটের গোপন কোড পাঠিয়েছি।`
              : `We have sent a 5-minute security verification code to your email (${email || 'your account'}).`}
          </p>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-3xl shadow-2xl p-7 sm:p-8 border border-zinc-100"
          style={{ boxShadow: '0 20px 60px rgba(185,28,28,0.08), 0 4px 20px rgba(0,0,0,0.04)' }}
        >
          {/* Error Notice */}
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

          {/* Countdown Display Banner */}
          <div
            className={`p-4 rounded-2xl mb-6 border text-center transition-all ${
              timeLeft > 60
                ? 'bg-red-50/80 border-red-200 text-red-950'
                : timeLeft > 0
                ? 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse'
                : 'bg-zinc-100 border-zinc-300 text-zinc-600'
            }`}
          >
            <div className="text-xs uppercase tracking-widest font-extrabold text-red-700 mb-1">
              {isBn ? 'কোডের অবশিষ্ট মেয়াদ' : 'Token Expiration Window'}
            </div>
            <div className="text-3xl font-black font-mono tracking-wider">
              {formatTimer(timeLeft)}
            </div>
            <div className="text-xs mt-1 text-zinc-500">
              {timeLeft > 0
                ? isBn
                  ? '🔒 নিরাপত্তার জন্য কোডটির মেয়াদ ঠিক ৫ মিনিট'
                  : '🔒 Tokens expire precisely in 5 minutes for platform security'
                : isBn
                ? '⚠️ কোডের মেয়াদ শেষ হয়েছে। নিচে পুনরায় কোড চান।'
                : '⚠️ Token has expired. Please request a new code below.'}
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-5">
            {/* Email field if not provided in URL */}
            {!initialEmail && (
              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">
                  {isBn ? 'আপনার ইমেইল অ্যাড্রেস' : 'Your Email Address'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 border-2 border-zinc-200 text-sm focus:outline-none focus:border-red-400 focus:bg-white text-zinc-800"
                />
              </div>
            )}

            {/* 6-Digit Code Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  {isBn ? '৬-সংখ্যার ওটিপি কোড' : '6-Digit Verification Code'}
                </label>
                <span className="text-xs text-red-600 font-semibold">
                  {isBn ? 'ইমেইল ইনবক্স চেক করুন' : 'Check Inbox or Spam'}
                </span>
              </div>
              <input
                id="verification-code-input"
                type="text"
                maxLength={6}
                autoFocus
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="w-full text-center py-4 rounded-xl bg-zinc-50 border-2 border-zinc-200 text-2xl font-mono tracking-[0.5em] font-black focus:outline-none focus:border-red-500 focus:bg-white transition-all text-zinc-900 placeholder:text-zinc-300"
              />
            </div>

            {/* Confirm Button */}
            <button
              type="submit"
              disabled={loading || timeLeft <= 0 || code.length !== 6}
              id="confirm-verification-btn"
              className="w-full py-4 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2.5 disabled:opacity-50 transition-all duration-300"
              style={{
                background:
                  loading || timeLeft <= 0 || code.length !== 6
                    ? '#9ca3af'
                    : 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
                boxShadow:
                  loading || timeLeft <= 0 || code.length !== 6
                    ? 'none'
                    : '0 8px 25px rgba(185,28,28,0.35)',
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>{isBn ? 'যাচাই করা হচ্ছে…' : 'Verifying Token…'}</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{isBn ? 'অ্যাকাউন্ট কনফার্ম করুন' : 'Confirm & Activate Account'}</span>
                </>
              )}
            </button>
          </form>

          {/* Resend actions */}
          <div className="mt-6 pt-5 border-t border-zinc-100 flex flex-col items-center gap-3 text-center">
            <div className="text-xs text-zinc-500">
              {isBn ? 'ইমেইল কোড পাননি?' : "Didn't receive the email?"}
            </div>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resending}
              id="resend-verification-btn"
              className="text-sm font-bold text-red-600 hover:text-red-800 disabled:text-zinc-400 transition-colors flex items-center gap-1.5"
            >
              {resending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  <span>{isBn ? 'পাঠানো হচ্ছে…' : 'Sending new code…'}</span>
                </>
              ) : resendCooldown > 0 ? (
                <span>
                  {isBn
                    ? `আবার পাঠানো যাবে (${resendCooldown}s পরে)`
                    : `Resend available in ${resendCooldown}s`}
                </span>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 2v6h-6" />
                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                    <path d="M3 22v-6h6" />
                    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                  </svg>
                  <span>{isBn ? 'নতুন কোড পাঠান (৫ মিনিট)' : 'Resend Fresh 5-Min Code'}</span>
                </>
              )}
            </button>
          </div>

          {/* Why RoktoLinkBD requires verification */}
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5 text-slate-700 font-bold">
              ℹ
            </div>
            <div>
              <strong className="text-slate-800 block mb-0.5">
                {isBn ? 'কেন ইমেইল ভেরিফিকেশন বাধ্যতামূলক?' : 'Why is email verification mandatory?'}
              </strong>
              {isBn
                ? 'রক্তদাতা ও রোগীর নিরাপত্তা রক্ষা করতে এবং রক্ত কেনাবেচা বা দালাল চক্রের ভুয়া রক্তের আবেদন বন্ধ করতে রক্তলিংকবিডিতে ভেরিফায়েড অ্যাকাউন্ট আবশ্যক।'
                : 'To protect donors and genuine patients, and eliminate fraudulent blood requests and broker scams, RoktoLinkBD strictly requires verified accounts before donating or requesting blood.'}
            </div>
          </div>
        </div>

        {/* Back link */}
        <p className="text-center mt-6 text-xs text-zinc-400">
          <Link to="/login" className="hover:text-zinc-600 underline">
            {isBn ? '← লগইন পেইজে ফিরে যান' : '← Back to Login'}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
