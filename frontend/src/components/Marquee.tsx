import React from 'react';

const MARQUEE_ITEMS = [
  'Availability First',
  'Privacy Protected',
  '64 Districts',
  'Verified Volunteers',
  'Zero Spam',
  'English · বাংলা',
  'Not a Blood Bank',
  'Community Powered',
  'Emergency Response',
  'Donor Respect',
];

const Marquee: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blood-700 via-red-600 to-blood-700 py-3.5 overflow-hidden -rotate-1 scale-[1.02] shadow-xl shadow-red-900/20">
      <div className="marquee-track text-white/95 text-sm font-bold tracking-wide">
        <div className="flex">
          {MARQUEE_ITEMS.map((t, idx) => (
            <span key={idx} className="mx-6 flex items-center gap-6 whitespace-nowrap">
              <svg className="w-3.5 h-3.5 opacity-70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C12 2 5 10.5 5 15a7 7 0 0 0 14 0C19 10.5 12 2 12 2z" />
              </svg>
              {t}
            </span>
          ))}
        </div>
        <div className="flex">
          {MARQUEE_ITEMS.map((t, idx) => (
            <span key={`dup-${idx}`} className="mx-6 flex items-center gap-6 whitespace-nowrap">
              <svg className="w-3.5 h-3.5 opacity-70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C12 2 5 10.5 5 15a7 7 0 0 0 14 0C19 10.5 12 2 12 2z" />
              </svg>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Marquee;
