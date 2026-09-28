import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  isBn?: boolean;
  purpose?: 'request' | 'donate' | 'volunteer' | 'dashboard';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, isBn = false, purpose = 'request' }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium text-zinc-500">
          {isBn ? 'লোড হচ্ছে…' : 'Checking authentication…'}
        </span>
      </div>
    );
  }

  // If user is not logged in
  if (!user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-20 bg-slate-50/50">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-red-100 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-5 shadow-inner">
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h2 className="text-2xl font-black text-zinc-900 mb-2">
            {purpose === 'volunteer'
              ? isBn
                ? 'স্বেচ্ছাসেবক হতে প্রথমে লগইন প্রয়োজন'
                : 'Login Required to Apply as Volunteer'
              : purpose === 'donate'
              ? isBn
                ? 'রক্তদান করতে লগইন প্রয়োজন'
                : 'Login Required to Donate Blood'
              : purpose === 'dashboard'
              ? isBn
                ? 'ড্যাশবোর্ড দেখতে লগইন প্রয়োজন'
                : 'Login Required for Dashboard'
              : isBn
              ? 'রক্তের অনুরোধ করতে লগইন প্রয়োজন'
              : 'Login Required to Request Blood'}
          </h2>

          <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
            {purpose === 'volunteer'
              ? isBn
                ? 'সমন্বয়ের স্বচ্ছতা ও দায়বদ্ধতা নিশ্চিত করতে স্বেচ্ছাসেবক হতে হলে প্রথমে নিবন্ধিত ব্যবহারকারী হওয়া বাধ্যতামূলক।'
                : 'To maintain coordination integrity and emergency case accountability, all volunteers must be registered, verified users first.'
              : purpose === 'donate'
              ? isBn
                ? 'রক্তদাতা হিসেবে নিবন্ধন ও উপস্থিতি নিশ্চিত করতে ভেরিফায়েড অ্যাকাউন্টে লগইন থাকা বাধ্যতামূলক।'
                : 'To protect donor safety and genuine recipient coordination, donors must be logged in with a verified account.'
              : purpose === 'dashboard'
              ? isBn
                ? 'আপনার ব্যক্তিগত ড্যাশবোর্ড ও অনুরোধসমূহ দেখতে লগইন করুন।'
                : 'Please sign in to access your personal dashboard, donor status, and blood requests.'
              : isBn
                ? 'ভুয়া রক্তের আবেদন ও দালাল চক্রের অপতৎপরতা বন্ধ করতে রক্তলিংকবিডিতে ভেরিফায়েড অ্যাকাউন্টে লগইন থাকা আবশ্যক।'
                : 'To eliminate fake requests and protect our voluntary donors from broker misuse, RoktoLinkBD requires all blood requests to come from verified logged-in users.'}
          </p>

          <div className="flex flex-col gap-3">
            <Link
              to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-600/25 transition-all text-center"
            >
              {isBn ? 'লগইন করুন →' : 'Sign In to Proceed →'}
            </Link>

            <Link
              to={`/register?redirect=${encodeURIComponent(location.pathname + location.search)}`}
              className="w-full py-3.5 rounded-xl font-bold text-zinc-700 text-sm bg-zinc-100 hover:bg-zinc-200 transition-colors text-center"
            >
              {isBn ? 'নতুন অ্যাকাউন্ট খুলুন' : 'Create Free Account'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If user is logged in but email is not verified
  if (!user.email_verified_at && !user.is_verified) {
    return (
      <Navigate
        to={`/verify-email?email=${encodeURIComponent(user.email)}&redirect=${encodeURIComponent(
          location.pathname + location.search
        )}`}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
