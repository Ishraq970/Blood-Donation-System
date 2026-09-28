import React from 'react';
import { Link } from 'react-router-dom';

interface VolunteerSectionProps {
  isBn: boolean;
}

const VolunteerSection: React.FC<VolunteerSectionProps> = ({ isBn }) => {
  return (
    <section id="volunteer" className="py-24 lg:py-28 relative overflow-hidden">
      <div className="blob blob-red w-[400px] h-[400px] bottom-0 -right-32" />
      <div className="max-w-5xl mx-auto px-5 lg:px-8">
        <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-blood-700 via-red-600 to-blood-800 p-10 lg:p-16 text-center shadow-2xl shadow-red-900/30">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px)',
              backgroundSize: '26px 26px',
            }}
          />
          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-6 heart-float">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21s-7.5-4.7-10-9.3C.3 8.4 2.4 5 5.8 5c2 0 3.4 1 4.2 2.4C10.8 6 12.2 5 14.2 5c3.4 0 5.5 3.4 3.8 6.7C19.5 16.3 12 21 12 21z" />
              </svg>
            </div>

            <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              {isBn ? 'যাচাইকৃত স্বেচ্ছাসেবক হোন' : 'Become a verified volunteer'}
            </h2>

            <p className="mt-4 text-red-100/90 max-w-2xl mx-auto leading-relaxed">
              {isBn
                ? 'কিছু জরুরি পরিস্থিতিতে একজন মানবিক সমন্বয়কের প্রয়োজন হয় — যিনি পরিবারের সাথে যোগাযোগ করেন, দাতাকে পথ দেখান এবং সমাধান না হওয়া পর্যন্ত থাকেন। সেটা হতে পারেন আপনি।'
                : "Some emergencies need a human coordinator — someone who calls the family, guides the donor, and stays until it's resolved. That's you."}
            </p>

            <Link
              to="/volunteer/apply"
              className="inline-flex items-center gap-2.5 mt-8 bg-white text-blood-700 px-8 py-4 rounded-2xl font-extrabold shadow-xl hover:scale-105 hover:shadow-2xl transition-transform duration-300"
            >
              <span>{isBn ? 'স্বেচ্ছাসেবক আবেদন করুন' : 'Apply as Volunteer'}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
              </svg>
            </Link>

            <p className="mt-5 text-xs text-red-200/70">
              {isBn
                ? 'পরিচয় যাচাই আবশ্যক · এনআইডি নিরাপদে পর্যালোচিত · অ্যাডমিন অনুমোদিত'
                : 'Identity verification required · NID processed securely · Admin reviewed'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VolunteerSection;
