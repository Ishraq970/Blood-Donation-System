import React, { useEffect, useState } from 'react';
import { fetchLifesaversApi, type Lifesaver } from '../api';

interface LifesaversProps {
  isBn: boolean;
}

const BLOOD_COLORS: Record<string, string> = {
  'A+':  'from-red-500 to-rose-700',
  'A-':  'from-red-600 to-red-900',
  'B+':  'from-blue-500 to-blue-700',
  'B-':  'from-blue-600 to-blue-900',
  'AB+': 'from-purple-500 to-purple-700',
  'AB-': 'from-purple-700 to-indigo-900',
  'O+':  'from-emerald-500 to-green-700',
  'O-':  'from-emerald-600 to-teal-800',
};

const LifesaversPage: React.FC<LifesaversProps> = ({ isBn }) => {
  const [lifesavers, setLifesavers] = useState<Lifesaver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLifesaversApi()
      .then((data) => setLifesavers(data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = lifesavers.filter(l =>
    !search ||
    l.donor_name.toLowerCase().includes(search.toLowerCase()) ||
    l.blood_group.toLowerCase().includes(search.toLowerCase()) ||
    l.facility.toLowerCase().includes(search.toLowerCase())
  );

  const totalBags = lifesavers.reduce((s, l) => s + (l.units || 1), 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white pt-28 pb-20 px-5">
      <div className="max-w-7xl mx-auto">

        {/* ── Hero Header ── */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-extrabold px-4 py-1.5 rounded-full uppercase tracking-widest mb-5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {isBn ? 'সম্মাননা প্রাচীর' : 'Wall of Lifesavers'}
          </div>
          <h1 className="text-4xl lg:text-6xl font-extrabold text-zinc-900 tracking-tight leading-tight">
            {isBn ? (
              <>আমাদের বীর <span className="grad-text">রক্তদাতাগণ</span></>
            ) : (
              <>Honoring Our <span className="grad-text">Lifesavers</span></>
            )}
          </h1>
          <p className="text-zinc-500 text-base mt-4 leading-relaxed max-w-2xl mx-auto">
            {isBn
              ? 'প্রতিটি রক্তদান একটি প্রাণ রক্ষা করেছে। নিম্নোক্ত প্রত্যেক বীর রক্তদাতা RoktoLinkBD-এর যাচাইকৃত ডিজিটাল সার্টিফিকেট প্রাপ্ত হয়েছেন।'
              : 'Every verified blood donation preserved a life. Each hero below has received a tamper-proof RoktoLinkBD digital certificate of appreciation.'}
          </p>

          {/* Stats bar */}
          {!loading && lifesavers.length > 0 && (
            <div className="mt-8 flex items-center justify-center gap-6 flex-wrap">
              {[
                { val: lifesavers.length, label: isBn ? 'লাইফসেভার' : 'Lifesavers' },
                { val: totalBags, label: isBn ? 'রক্তের ব্যাগ' : 'Blood Bags' },
                { val: lifesavers.length, label: isBn ? 'পরিবার উপকৃত' : 'Families Helped' },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center px-6 py-3 bg-white rounded-2xl border border-red-100 shadow-sm">
                  <span className="text-3xl font-extrabold grad-text">{s.val}</span>
                  <span className="text-xs text-zinc-400 font-semibold mt-0.5">{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Search bar ── */}
        <div className="max-w-md mx-auto mb-10">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isBn ? 'নাম, রক্তের গ্রুপ বা হাসপাতাল খুঁজুন…' : 'Search by name, blood group or hospital…'}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 text-zinc-800 placeholder-zinc-400 shadow-sm"
            />
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-red-600 border-t-transparent animate-spin" />
            <p className="text-zinc-400 text-sm">{isBn ? 'লাইফসেভার্স লোড হচ্ছে…' : 'Loading lifesavers…'}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-red-100 p-10 max-w-sm mx-auto shadow-sm">
            <div className="text-5xl mb-4">🩸</div>
            <p className="text-zinc-700 font-bold text-lg">
              {search ? (isBn ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No results found') : (isBn ? 'এখনো কোনো লাইফসেভার নেই' : 'No lifesavers yet')}
            </p>
            <p className="text-zinc-400 text-sm mt-2">
              {isBn ? 'রক্তদান করুন এবং এই প্রাচীরে যোগ দিন!' : 'Donate blood and join this wall!'}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((item, idx) => (
              <div
                key={item.id}
                className="group rounded-3xl bg-white border border-zinc-100 shadow-sm hover:shadow-2xl hover:shadow-red-100/50 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                {/* Card top — blood group banner */}
                <div className={`bg-gradient-to-br ${BLOOD_COLORS[item.blood_group] ?? 'from-red-500 to-rose-700'} p-5 text-white relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-2 right-4 text-[80px] font-black leading-none">{item.blood_group}</div>
                  </div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em]">
                        {isBn ? 'রক্তদাতা' : 'Blood Donor'}
                      </p>
                      <h3 className="font-extrabold text-lg leading-tight mt-0.5">{item.donor_name}</h3>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-xl font-black border border-white/30">
                      {item.blood_group}
                    </div>
                  </div>
                  <div className="relative z-10 mt-3 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-white/20 border border-white/30 tracking-widest">
                      ✓ VERIFIED
                    </span>
                    <span className="text-white/60 text-[10px]">{item.donated_at}</span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="text-[10px] font-mono text-zinc-400 mb-3 truncate" title={item.certificate_code}>
                    📜 {item.certificate_code}
                  </div>

                  <div className="text-xs text-zinc-600 mb-3 space-y-1">
                    <div className="flex items-start gap-1.5">
                      <span className="text-zinc-400">🏥</span>
                      <span className="font-medium leading-tight">{item.facility}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400">💉</span>
                      <span>{item.units} {item.units === 1 ? 'bag' : 'bags'} · Red Cells</span>
                    </div>
                  </div>

                  {/* Gratitude note */}
                  <div className="flex-1 p-3 rounded-xl bg-red-50/60 border border-red-100 text-xs text-zinc-700 italic leading-relaxed">
                    "{item.note.length > 100 ? item.note.substring(0, 100) + '…' : item.note}"
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 font-medium">RoktoLinkBD</span>
                    <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {isBn ? '১টি প্রাণ বাঁচিয়েছেন' : '1 Life Saved'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Footer CTA ── */}
        {!loading && lifesavers.length > 0 && (
          <div className="mt-16 text-center">
            <div className="inline-flex flex-col items-center gap-4 p-8 rounded-3xl bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-2xl shadow-red-800/30">
              <div className="text-5xl animate-pulse">🩸</div>
              <div>
                <h3 className="text-xl font-extrabold">
                  {isBn ? 'আপনিও লাইফসেভার হতে পারেন!' : 'You can be a Lifesaver too!'}
                </h3>
                <p className="text-red-100 text-sm mt-1">
                  {isBn ? 'নিবন্ধন করুন এবং এই সম্মাননা প্রাচীরে আপনার নাম যোগ করুন।' : 'Register as a donor and join this wall of heroes.'}
                </p>
              </div>
              <a
                href="/register"
                className="px-6 py-2.5 rounded-xl bg-white text-red-700 font-extrabold text-sm hover:shadow-lg hover:scale-105 transition-all"
              >
                {isBn ? 'এখনই যোগ দিন' : 'Join Now'}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LifesaversPage;
