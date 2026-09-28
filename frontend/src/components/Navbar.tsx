import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  isBn: boolean;
  toggleLang: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isBn, toggleLang }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const isReportsPage = location.pathname === '/reports';

  return (
    <nav id="navbar" className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 flex items-center justify-between h-16 lg:h-[72px]">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 shrink-0 mr-3 xl:mr-5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-blood-800 flex items-center justify-center shadow-md shadow-red-500/25 group-hover:scale-105 group-hover:rotate-[-6deg] transition-all duration-300">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
              <path d="M12 2.2C12 2.2 5 11 5 16C5 19.87 8.13 23 12 23C15.87 23 19 19.87 19 16C19 11 12 2.2 12 2.2Z" />
              <path d="M9.5 13.5C8.8 14.8 9 16.5 9.8 17.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.65" />
            </svg>
          </div>
          <span className="font-extrabold text-lg xl:text-xl tracking-tight text-blood-900 whitespace-nowrap">
            Rokto<span className="text-red-500">Link</span>BD
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-3 xl:gap-5 text-xs xl:text-sm font-medium text-zinc-600 shrink-0">
          <Link to="/how-it-works" className="nav-link hover:text-blood-700 whitespace-nowrap">
            {isBn ? 'কীভাবে কাজ করে' : 'How It Works'}
          </Link>
          <Link to="/requests" className="nav-link hover:text-blood-700 whitespace-nowrap">
            {isBn ? 'জরুরি অনুরোধ' : 'Urgent Requests'}
          </Link>
          <Link to="/volunteer/apply" className="nav-link hover:text-blood-700 whitespace-nowrap">
            {isBn ? 'স্বেচ্ছাসেবক' : 'Volunteers'}
          </Link>
          <Link to="/lifesavers" className="nav-link hover:text-blood-700 whitespace-nowrap">
            {isBn ? 'লাইফসেভার্স' : 'Lifesavers'}
          </Link>
          <Link to="/donors" className="nav-link hover:text-blood-700 flex items-center gap-1.5 whitespace-nowrap">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-red-500" fill="currentColor"><path d="M12 2C12 2 5 10.5 5 15a7 7 0 0 0 14 0C19 10.5 12 2 12 2z" /></svg>
            {isBn ? 'দাতা খুঁজুন' : 'Find Donors'}
          </Link>

          {/* SQL Query Engine / Reports Page Link */}
          <Link
            to="/reports"
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              isReportsPage
                ? 'bg-blood-700 text-white shadow-md shadow-red-900/20'
                : 'bg-blood-50 text-blood-700 border border-blood-200 hover:bg-blood-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            {isBn ? 'SQL কুয়েরি' : 'SQL Reports (12 Queries)'}
          </Link>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Language Switch */}
          <button
            onClick={toggleLang}
            className="px-3 py-1.5 rounded-full text-xs font-bold border-2 border-blood-100 text-blood-700 hover:bg-blood-50 transition-colors"
          >
            {isBn ? 'EN' : 'বাংলা'}
          </button>

          {/* User Auth Links */}
          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              {user.is_admin && (
                <Link
                  to="/admin/volunteers"
                  className="text-xs font-black text-white bg-red-700 hover:bg-red-800 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 shadow-xs"
                  title="Volunteer Verification & Governance"
                >
                  🛡️ {isBn ? 'অ্যাডমিন' : 'Admin Panel'}
                </Link>
              )}
              <Link
                to="/donor/dashboard"
                className="text-xs font-bold text-blood-800 bg-blood-50 px-3 py-1.5 rounded-full border border-blood-200 hover:bg-blood-100 transition-colors"
              >
                👤 {user.name.split(' ')[0]}
              </Link>
              <button
                onClick={() => logout()}
                className="text-xs font-bold text-zinc-500 hover:text-red-600 transition-colors p-1 cursor-pointer"
                title="Logout"
              >
                {isBn ? 'লগআউট' : 'Logout'}
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden sm:block text-sm font-semibold text-zinc-600 hover:text-blood-700 transition-colors px-3 py-1.5"
            >
              {isBn ? 'লগইন' : 'Login'}
            </Link>
          )}

          {/* I Need Blood - Emergency Button */}
          <Link
            to="/requests/create"
            className="btn-primary px-4 lg:px-5 py-2 rounded-full text-sm font-bold flex items-center gap-1.5"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
              <path d="M12 2C12 2 5 10.5 5 15a7 7 0 0 0 14 0C19 10.5 12 2 12 2z" />
            </svg>
            <span>{isBn ? 'রক্ত প্রয়োজন' : 'I Need Blood'}</span>
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-10 h-10 rounded-xl border border-blood-100 flex items-center justify-center text-blood-700"
            aria-label="Toggle Navigation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-blood-100/60 glass px-6 py-4 flex flex-col gap-3 text-sm font-medium text-zinc-700">
          <Link to="/how-it-works" onClick={() => setMobileOpen(false)}>
            {isBn ? 'কীভাবে কাজ করে' : 'How It Works'}
          </Link>
          <Link to="/requests" onClick={() => setMobileOpen(false)}>
            {isBn ? 'জরুরি অনুরোধ' : 'Urgent Requests'}
          </Link>
          <Link to="/volunteer/apply" onClick={() => setMobileOpen(false)}>
            {isBn ? 'স্বেচ্ছাসেবক আবেদন' : 'Volunteers'}
          </Link>
          <Link to="/lifesavers" onClick={() => setMobileOpen(false)}>
            {isBn ? 'সম্মাননা প্রাচীর' : 'Wall of Lifesavers'}
          </Link>
          <Link to="/donors" onClick={() => setMobileOpen(false)} className="text-blood-700 font-semibold">
            🩸 {isBn ? 'রক্তদাতা খুঁজুন' : 'Find Donors'}
          </Link>
          <Link
            to="/reports"
            onClick={() => setMobileOpen(false)}
            className="text-blood-700 font-bold"
          >
            {isBn ? 'SQL কুয়েরি রিপোর্ট (১২টি কুয়েরি)' : 'SQL Reports (12 Queries)'}
          </Link>
          <hr className="border-blood-100 my-1" />
          {user ? (
            <div className="flex items-center justify-between">
              <Link to="/donor/dashboard" onClick={() => setMobileOpen(false)} className="font-bold text-blood-800">
                {user.name} ({isBn ? 'ড্যাশবোর্ড' : 'Dashboard'})
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="text-xs text-red-600 font-bold"
              >
                {isBn ? 'লগআউট' : 'Logout'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="text-zinc-800 font-semibold">
                {isBn ? 'লগইন' : 'Login'}
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="text-blood-700 font-semibold">
                {isBn ? 'রেজিস্টার' : 'Create Account'}
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
