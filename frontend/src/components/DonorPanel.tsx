import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface DonorPanelProps {
  isBn: boolean;
  onToast: (msg: string) => void;
}

const DonorPanel: React.FC<DonorPanelProps> = ({ isBn, onToast }) => {
  const [isAvailable, setIsAvailable] = useState(true);
  const [radius, setRadius] = useState(5);

  const toggleAvailability = () => {
    const next = !isAvailable;
    setIsAvailable(next);
    if (next) {
      onToast(isBn ? 'আপনি এখন সক্রিয় — ধন্যবাদ!' : 'You are now available — thank you!');
    } else {
      onToast(isBn ? 'অ্যালার্ট সাময়িক বন্ধ করা হয়েছে।' : 'Alerts paused. Rest well.');
    }
  };

  return (
    <section id="donor-panel" className="py-24 lg:py-28 bg-zinc-900 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 30% 20%, #dc2626 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, #7f1d1d 0%, transparent 45%)',
        }}
      />
      <div className="max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-2 gap-14 items-center relative">
        {/* Left Information */}
        <div>
          <span className="text-xs font-extrabold tracking-[0.25em] uppercase text-red-400">
            {isBn ? 'দাতাদের জন্য' : 'For Donors'}
          </span>
          <h2 className="text-3xl lg:text-5xl font-extrabold mt-4 tracking-tight text-white leading-tight">
            {isBn ? (
              <>
                একটি সুইচ।<br />
                <span className="grad-text">আপনিই প্রাণরেখা।</span>
              </>
            ) : (
              <>
                One switch.<br />
                <span className="grad-text">You're a lifeline.</span>
              </>
            )}
          </h2>
          <p className="mt-5 text-zinc-400 leading-relaxed max-w-lg">
            {isBn
              ? 'সাহায্য করতে প্রস্তুত থাকলে সক্রিয়তা চালু করুন। আপনার সুবিধাজনক দূরত্ব ঠিক করুন। যেকোনো সময় বাতিল বা পরিবর্তন করতে পারেন — কোনো অপমান নয়, কোনো স্প্যাম নেই।'
              : 'Flip availability on when you can help. Set your radius. Decline anytime — no shame, no spam, no public rankings. Your kindness is respected.'}
          </p>

          <ul className="mt-8 space-y-3.5 text-sm text-zinc-300">
            <li className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span>
                {isBn
                  ? 'শুধু আপনার নির্ধারিত দূরত্বের ভেতরের জরুরি অ্যালার্ট আসবে'
                  : 'Emergency alerts strictly within your chosen radius'}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span>
                {isBn
                  ? 'প্রতিটি সফল রক্তদানের পর ৩ মাসের স্বয়ংক্রিয় বিরতি'
                  : 'Automatic cooldown pause after each recorded donation'}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span>
                {isBn
                  ? 'যাচাইকৃত ডিজিটাল সার্টিফিকেট ও ব্যক্তিগত কৃতজ্ঞতা বার্তা'
                  : 'Verified digital certificate & private thank-you messages'}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span>
                {isBn
                  ? 'আপনার ফোন নম্বর কখনো কোনো উন্মুক্ত তালিকায় প্রকাশিত হয় না'
                  : 'Your phone number is never published in any public directory'}
              </span>
            </li>
          </ul>

          <div className="mt-8">
            <Link
              to="/donor/register"
              className="btn-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm"
            >
              <span>{isBn ? 'দাতা হিসেবে যোগ দিন' : 'Register as a Donor'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Right Interactive Dashboard Simulation */}
        <div>
          <div className="rounded-3xl bg-zinc-800/80 backdrop-blur border border-zinc-700 p-7 shadow-2xl">
            {/* Donor Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-blood-800 flex items-center justify-center text-white font-extrabold shadow-lg shadow-red-500/40">
                  B+
                </div>
                <div>
                  <p className="text-white font-bold">{isBn ? 'রহিম উদ্দিন' : 'Rahim Uddin'}</p>
                  <p className="text-zinc-500 text-xs">
                    {isBn ? 'মিরপুর ১০, ঢাকা · ' : 'Mirpur 10, Dhaka · '}
                    {radius} km {isBn ? 'ব্যাসার্ধ' : 'radius'}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                  isAvailable
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 pulse-glow'
                    : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
                }`}
              >
                {isAvailable ? (isBn ? 'সক্রিয়' : 'AVAILABLE') : (isBn ? 'অফলাইন' : 'OFFLINE')}
              </span>
            </div>

            {/* Availability Switch */}
            <div className="rounded-2xl bg-zinc-900/70 border border-zinc-700/60 p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-white font-bold text-sm">
                  {isBn ? 'রক্তদানে সক্রিয়' : 'Available to Donate'}
                </p>
                <p className="text-zinc-500 text-xs mt-1">
                  {isAvailable
                    ? isBn
                      ? 'জরুরি রক্তের অ্যালার্ট আপনার কাছে পৌঁছাবে'
                      : 'You will receive emergency alerts nearby'
                    : isBn
                    ? 'অ্যালার্ট সাময়িক বন্ধ রয়েছে'
                    : 'Alerts paused. Enjoy your rest.'}
                </p>
              </div>

              <div
                onClick={toggleAvailability}
                className={`avail-switch ${isAvailable ? 'on' : ''}`}
                role="button"
                tabIndex={0}
              >
                <div className="knob" />
              </div>
            </div>

            {/* Radius Slider */}
            <div className="mt-5 rounded-2xl bg-zinc-900/70 border border-zinc-700/60 p-5">
              <div className="flex justify-between text-xs font-semibold mb-3">
                <span className="text-zinc-400">{isBn ? 'অ্যালার্ট ব্যাসার্ধ' : 'Alert radius'}</span>
                <span className="text-red-400 font-bold">{radius} km</span>
              </div>
              <input
                type="range"
                min="2"
                max="30"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full accent-red-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-600 mt-1.5">
                <span>2 km</span>
                <span>15 km</span>
                <span>30 km</span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-zinc-900/70 border border-zinc-700/60 py-3.5">
                <p className="text-white font-extrabold text-lg">12</p>
                <p className="text-zinc-500 text-[10px] font-semibold">{isBn ? 'রক্তদান' : 'Donations'}</p>
              </div>
              <div className="rounded-xl bg-zinc-900/70 border border-zinc-700/60 py-3.5">
                <p className="text-white font-extrabold text-lg">98%</p>
                <p className="text-zinc-500 text-[10px] font-semibold">{isBn ? 'সাড়ার হার' : 'Response rate'}</p>
              </div>
              <div className="rounded-xl bg-zinc-900/70 border border-zinc-700/60 py-3.5">
                <p className="text-white font-extrabold text-lg">3</p>
                <p className="text-zinc-500 text-[10px] font-semibold">{isBn ? 'ডিজিটাল ব্যাজ' : 'Badges'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DonorPanel;
