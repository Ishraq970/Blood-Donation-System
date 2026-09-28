import React from 'react';
import { Link } from 'react-router-dom';

interface HowItWorksProps {
  isBn: boolean;
}

const STEPS = [
  {
    n: '01',
    en: 'Create Request',
    bn: 'অনুরোধ তৈরি করুন',
    den: 'A 60-second emergency form. No bureaucracy, no medical records needed.',
    dbn: '৬০ সেকেন্ডের জরুরি ফর্ম। কোনো আমলাতান্ত্রিক জটিলতা নয়, চিকিৎসা রেকর্ডের প্রয়োজন নেই।',
  },
  {
    n: '02',
    en: 'We Find Nearby Donors',
    bn: 'কাছের দাতা খুঁজি',
    den: 'Matching engine scans currently available same-group donors by distance.',
    dbn: 'মেলানো ইঞ্জিন দূরত্ব অনুযায়ী সক্রিয় একই গ্রুপের দাতাদের খুঁজে বের করে।',
  },
  {
    n: '03',
    en: 'Donors Respond',
    bn: 'দাতারা সাড়া দেন',
    den: 'Relevant donors get push alerts and can accept in one tap.',
    dbn: 'প্রাসঙ্গিক দাতারা পুশ অ্যালার্ট পান এবং এক ট্যাপে গ্রহণ করতে পারেন।',
  },
  {
    n: '04',
    en: 'Volunteer Coordinates',
    bn: 'স্বেচ্ছাসেবক সমন্বয় করেন',
    den: 'Verified volunteers guide both sides until the donation happens.',
    dbn: 'যাচাইকৃত স্বেচ্ছাসেবকরা রক্তদান পর্যন্ত উভয় পক্ষকে পথ দেখান।',
  },
  {
    n: '05',
    en: 'Donation at Facility',
    bn: 'প্রতিষ্ঠানে রক্তদান',
    den: 'The donor reaches an authorized collection point safely.',
    dbn: 'দাতা নিরাপদে অনুমোদিত সংগ্রহকেন্দ্রে পৌঁছান।',
  },
  {
    n: '06',
    en: 'Request Fulfilled',
    bn: 'অনুরোধ সম্পন্ন',
    den: 'Both parties confirm. The donor gets appreciation & a certificate.',
    dbn: 'উভয় পক্ষ নিশ্চিত করেন। দাতা কৃতজ্ঞতা ও ডিজিটাল সার্টিফিকেট পান।',
  },
];

const HowItWorks: React.FC<HowItWorksProps> = ({ isBn }) => {
  return (
    <section id="how" className="py-24 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-extrabold tracking-[0.25em] uppercase text-red-500">
            {isBn ? 'প্রক্রিয়া' : 'The Journey'}
          </span>
          <h2 className="text-3xl lg:text-5xl font-extrabold mt-4 tracking-tight text-zinc-900">
            {isBn ? (
              <>
                রক্তলিংকবিডি <span className="grad-text">কীভাবে কাজ করে</span>
              </>
            ) : (
              <>
                How RoktoLinkBD <span className="grad-text">works</span>
              </>
            )}
          </h2>
          <p className="mt-4 text-zinc-500">
            {isBn
              ? 'জরুরি থেকে সম্পন্ন — ছয়টি ধাপে স্বচ্ছ ও ট্রেসেবল প্রক্রিয়া।'
              : 'From emergency to fulfilled — a transparent, traceable path in six steps.'}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="step-card relative rounded-3xl bg-white border border-blood-100 p-7 overflow-hidden group shadow-sm hover:shadow-xl transition-all"
            >
              <span className="step-num text-5xl font-extrabold absolute -top-1 right-4 opacity-15 group-hover:opacity-30 transition-opacity">
                {s.n}
              </span>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-blood-800 text-white flex items-center justify-center font-extrabold shadow-lg shadow-red-500/30 mb-5 group-hover:rotate-[-8deg] group-hover:scale-110 transition-transform duration-300">
                {s.n}
              </div>
              <h3 className="font-bold text-zinc-900 text-lg mb-2">{isBn ? s.bn : s.en}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{isBn ? s.dbn : s.den}</p>
              {i < 5 && (
                <svg
                  className="hidden lg:block absolute top-1/2 -right-4 w-8 h-8 text-blood-300 z-10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-blood-50 border border-blood-200 text-blood-700 hover:bg-blood-100 font-bold text-sm transition-all shadow-sm group"
          >
            <span>{isBn ? 'সম্পূর্ণ নির্দেশিকা ও রক্তের গ্রুপ সামঞ্জস্য দেখুন' : 'Explore Detailed Step-by-Step Guide & ABO Matrix'}</span>
            <svg className="w-4 h-4 text-blood-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
