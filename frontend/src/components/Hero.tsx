import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroCanvas from './HeroCanvas';
import { fetchStats } from '../api';
import type { PlatformStats } from '../api';

interface HeroProps {
  isBn: boolean;
}

const TICKER_MSGS = [
  { en: 'New O− request in Mirpur, Dhaka — 3 donors notified', bn: 'ঢাকা মিরপুরে নতুন O− অনুরোধ — ৩ জন দাতাকে জানানো হয়েছে' },
  { en: 'B+ donor accepted a request in Chattogram', bn: 'চট্টগ্রামে এক B+ দাতা অনুরোধ গ্রহণ করেছেন' },
  { en: 'Volunteer assigned to case RLB-26-04815', bn: 'কেস RLB-26-04815-তে একজন স্বেচ্ছাসেবক নিয়োগ হয়েছেন' },
  { en: 'Request RLB-26-04766 fulfilled in Sylhet', bn: 'সিলেটে অনুরোধ RLB-26-04766 সম্পন্ন হয়েছে' },
  { en: 'Search expanded to 10 km in Rajshahi', bn: 'রাজশাহীতে খোঁজ ১০ কিমি পর্যন্ত বিস্তৃত হয়েছে' },
];

const Hero: React.FC<HeroProps> = ({ isBn }) => {
  const [stats, setStats] = useState<PlatformStats>({
    emergency_requests: 37,
    active_donors: 2418,
    verified_volunteers: 312,
    fulfilled_requests: 8941,
  });

  const [tickIdx, setTickIdx] = useState(0);

  useEffect(() => {
    fetchStats().then((data) => setStats(data));

    const interval = setInterval(() => {
      setTickIdx((prev) => (prev + 1) % TICKER_MSGS.length);
    }, 4200);

    return () => clearInterval(interval);
  }, []);

  const avatars = [
    'from-red-400 to-rose-600',
    'from-amber-400 to-orange-600',
    'from-emerald-400 to-teal-600',
    'from-blue-400 to-indigo-600',
    'from-purple-400 to-violet-600',
  ];

  return (
    <header className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
      {/* Background Blobs & Canvas */}
      <div className="blob blob-red w-[480px] h-[480px] -top-24 -left-24" />
      <div className="blob blob-rose w-[420px] h-[420px] top-1/3 -right-28" />
      <HeroCanvas />
      <div className="hero-fade" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-2 gap-12 items-center w-full">
        {/* Left Headline & CTAs */}
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blood-50 border border-blood-100 text-blood-700 text-xs font-bold mb-7">
            <span className="w-2 h-2 rounded-full bg-red-500 urgency-dot" />
            <span>
              {isBn
                ? 'লাইভ — জরুরি প্রতিক্রিয়া নেটওয়ার্ক এখন সক্রিয়'
                : 'LIVE — Emergency response network active now'}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl xl:text-[3.9rem] font-extrabold leading-[1.08] tracking-tight text-zinc-900">
            <span className="reveal-line">
              <span>{isBn ? 'রক্ত প্রয়োজন?' : 'Blood needed?'}</span>
            </span>
            <span className="reveal-line">
              <span className="grad-text">
                {isBn ? 'দ্রুত সাহায্য খুঁজুন।' : 'Find help faster.'}
              </span>
            </span>
          </h1>

          <p className="mt-6 text-zinc-500 text-base lg:text-lg max-w-xl leading-relaxed">
            {isBn
              ? 'বাংলাদেশের ৬৪ জেলায় সক্রিয় রক্তদাতা ও যাচাইকৃত স্বেচ্ছাসেবকদের সাথে যুক্ত হোন — ব্যক্তিগতভাবে, নিরাপদে, মাত্র কয়েক মিনিটে।'
              : 'Connect with currently available blood donors and admin-verified volunteers across all 64 districts of Bangladesh — privately, safely, in minutes.'}
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              to="/requests/create"
              className="btn-primary px-8 py-4 rounded-2xl font-bold text-base flex items-center gap-2.5"
            >
              <span>{isBn ? 'আমার রক্ত প্রয়োজন' : 'I Need Blood'}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
              </svg>
            </Link>

            <a href="#donor-panel" className="btn-ghost px-8 py-4 rounded-2xl font-bold text-base">
              {isBn ? 'আমি রক্ত দিতে চাই' : 'I Want to Donate'}
            </a>
          </div>

          {/* Avatar stack */}
          <div className="mt-10 flex items-center gap-6 text-sm">
            <div className="flex -space-x-3">
              {avatars.map((c, i) => (
                <div
                  key={i}
                  className={`w-9 h-9 rounded-full bg-gradient-to-br ${c} border-[3px] border-white flex items-center justify-center text-white text-xs font-bold shadow-md`}
                >
                  {['R', 'S', 'M', 'A', '+'][i]}
                </div>
              ))}
            </div>
            <p className="text-zinc-500 font-medium">
              <b className="text-zinc-800">
                {isBn ? stats.active_donors.toLocaleString('bn-BD') : stats.active_donors.toLocaleString()}
              </b>{' '}
              {isBn ? 'দাতা এখনই সক্রিয়' : 'donors available right now'}
            </p>
          </div>
        </div>

        {/* Right Live Impact Panel */}
        <div className="lg:pl-8 lg:translate-x-10 xl:translate-x-16">
          <div className="glass rounded-3xl p-6 lg:p-8 shadow-2xl shadow-red-900/10 relative overflow-hidden float-anim-slow max-w-lg lg:ml-auto">
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-red-200/50 to-transparent" />
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-zinc-800 flex items-center gap-2">
                <span>{isBn ? 'লাইভ প্রভাব' : 'Live Impact'}</span>
                <span className="text-[11px] font-normal text-zinc-400">({isBn ? 'সারাদেশ' : 'Bangladesh'})</span>
              </h3>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500 urgency-dot" />
                LIVE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Emergency Requests */}
              <div className="stat-card rounded-2xl bg-white/90 border border-blood-100 p-4 transition-all hover:border-red-300 hover:shadow-md">
                <div className="stat-icon w-10 h-10 rounded-xl bg-blood-50 text-blood-600 flex items-center justify-center mb-2.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-black text-zinc-900 tracking-tight">
                  {isBn ? stats.emergency_requests.toLocaleString('bn-BD') : stats.emergency_requests}
                </p>
                <p className="text-xs text-zinc-500 font-semibold mt-0.5 leading-snug">
                  {isBn ? 'সক্রিয় জরুরি অনুরোধ' : 'Active emergency requests'}
                </p>
              </div>

              {/* Donors Available */}
              <div className="stat-card rounded-2xl bg-white/90 border border-blood-100 p-4 transition-all hover:border-emerald-300 hover:shadow-md">
                <div className="stat-icon w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21s-7.5-4.7-10-9.3C.3 8.4 2.4 5 5.8 5c2 0 3.4 1 4.2 2.4C10.8 6 12.2 5 14.2 5c3.4 0 5.5 3.4 3.8 6.7C19.5 16.3 12 21 12 21z" />
                  </svg>
                </div>
                <p className="text-2xl font-black text-zinc-900 tracking-tight">
                  {isBn ? stats.active_donors.toLocaleString('bn-BD') : stats.active_donors.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500 font-semibold mt-0.5 leading-snug">
                  {isBn ? 'এখন সক্রিয় দাতা' : 'Donors available now'}
                </p>
              </div>

              {/* Volunteers on Duty */}
              <div className="stat-card rounded-2xl bg-white/90 border border-blood-100 p-4 transition-all hover:border-blue-300 hover:shadow-md">
                <div className="stat-icon w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a3 3 0 11-3-3" />
                  </svg>
                </div>
                <p className="text-2xl font-black text-zinc-900 tracking-tight">
                  {isBn ? stats.verified_volunteers.toLocaleString('bn-BD') : stats.verified_volunteers}
                </p>
                <p className="text-xs text-zinc-500 font-semibold mt-0.5 leading-snug">
                  {isBn ? 'যাচাইকৃত সক্রিয় স্বেচ্ছাসেবক' : 'Verified volunteers on duty'}
                </p>
              </div>

              {/* Fulfilled Requests */}
              <div className="stat-card rounded-2xl bg-white/90 border border-blood-100 p-4 transition-all hover:border-amber-300 hover:shadow-md">
                <div className="stat-icon w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-black text-zinc-900 tracking-tight">
                  {isBn ? stats.fulfilled_requests.toLocaleString('bn-BD') : stats.fulfilled_requests.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500 font-semibold mt-0.5 leading-snug">
                  {isBn ? 'সম্পন্নকৃত অনুরোধ' : 'Requests fulfilled'}
                </p>
              </div>
            </div>

            {/* Live Ticker */}
            <div className="mt-5 rounded-2xl bg-gradient-to-r from-blood-50 to-white border border-blood-100 px-4 py-3 flex items-center gap-3 overflow-hidden">
              <span className="w-2 h-2 rounded-full bg-red-500 urgency-dot flex-shrink-0" />
              <p className="text-xs font-semibold text-blood-800 truncate transition-opacity duration-500">
                {isBn ? TICKER_MSGS[tickIdx].bn : TICKER_MSGS[tickIdx].en}
              </p>
            </div>

            {/* Quick Find Donors with Google Maps */}
            <div className="mt-4 pt-3.5 border-t border-blood-100/70 flex items-center justify-between">
              <Link
                to="/donors"
                className="text-xs font-bold text-blood-700 hover:text-blood-900 flex items-center gap-1.5 transition-colors group"
              >
                <span>{isBn ? '🗺️ জেলা ও উপজেলা অনুযায়ী দাতা খুঁজুন' : '🗺️ Find Donors by District & Area'}</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                to="/donors"
                className="text-[11px] font-semibold text-zinc-500 hover:text-blood-700 bg-white/80 border border-blood-100 rounded-lg px-2.5 py-1"
              >
                {isBn ? 'গুগল ম্যাপস' : 'Google Maps'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Hero;
