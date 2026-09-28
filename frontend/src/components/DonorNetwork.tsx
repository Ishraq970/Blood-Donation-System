import React, { useEffect, useState } from 'react';
import { fetchGroupsSummary } from '../api';
import type { GroupSummary } from '../api';

interface DonorNetworkProps {
  isBn: boolean;
}

interface GroupMeta {
  g: string;
  c: string;
  defaultCount: number;
  dEn: string;
  dBn: string;
}

const GROUPS_DATA: GroupMeta[] = [
  { g: 'A+', c: 'chip-A', defaultCount: 368, dEn: 'Strong coverage across Dhaka, Sylhet & Khulna', dBn: 'ঢাকা, সিলেট ও খুলনায় বিস্তৃত উপস্থিতি' },
  { g: 'A−', c: 'chip-A', defaultCount: 92, dEn: 'Limited — recruitment needed in Barishal & Rangpur', dBn: 'সীমিত — বরিশাল ও রংপুরে আরও দাতা প্রয়োজন' },
  { g: 'B+', c: 'chip-B', defaultCount: 512, dEn: 'Highest availability — Chattogram & Rajshahi strong', dBn: 'সর্বোচ্চ সক্রিয়তা — চট্টগ্রাম ও রাজশাহীতে শক্ত নেটওয়ার্ক' },
  { g: 'B−', c: 'chip-B', defaultCount: 74, dEn: 'Critical shortage in 6 districts right now', dBn: '৬টি জেলায় জরুরি ঘাটতি রয়েছে' },
  { g: 'AB+', c: 'chip-AB', defaultCount: 141, dEn: 'Steady supply in metropolitan areas', dBn: 'মেট্রোপলিটন এলাকায় নির্ভরযোগ্য উপস্থিতি' },
  { g: 'AB−', c: 'chip-AB', defaultCount: 33, dEn: 'Very rare — every single donor counts', dBn: 'অত্যন্ত বিরল — প্রতিটি দাতার অংশগ্রহণ মহামূল্যবান' },
  { g: 'O+', c: 'chip-O', defaultCount: 641, dEn: 'Largest group — excellent nationwide coverage', dBn: 'সর্ববৃহৎ গ্রুপ — দেশজুড়ে চমৎকার উপস্থিতি' },
  { g: 'O−', c: 'chip-O', defaultCount: 157, dEn: 'Universal donors — alerts dispatched within 5 km first', dBn: 'সার্বজনীন দাতা — প্রথমে ৫ কিমির মধ্যে অ্যালার্ট পাঠানো হয়' },
];

const DonorNetwork: React.FC<DonorNetworkProps> = ({ isBn }) => {
  const [selectedIdx, setSelectedIdx] = useState(6); // Default O+
  const [counts, setCounts] = useState<Record<string, GroupSummary>>({});

  useEffect(() => {
    fetchGroupsSummary().then((data) => setCounts(data));
  }, []);

  const current = GROUPS_DATA[selectedIdx];
  const liveCount = counts[current.g]?.count || current.defaultCount;
  const percentage = Math.min(96, Math.max(20, (liveCount / 650) * 100));

  return (
    <section id="network" className="py-24 lg:py-28 bg-gradient-to-b from-white via-blood-50/40 to-white relative overflow-hidden">
      <div className="blob blob-rose w-[380px] h-[380px] top-20 -left-32" />
      <div className="max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-2 gap-14 items-center relative">
        {/* Left Column */}
        <div>
          <span className="text-xs font-extrabold tracking-[0.25em] uppercase text-red-500">
            {isBn ? 'সক্রিয়তাই আগে' : 'Availability First'}
          </span>
          <h2 className="text-3xl lg:text-4xl font-extrabold mt-4 tracking-tight text-zinc-900 leading-snug">
            {isBn ? (
              <>
                শুধু নিবন্ধিত নয়।<br />
                <span className="grad-text">প্রকৃতপক্ষে সক্রিয়।</span>
              </>
            ) : (
              <>
                Not just registered.<br />
                <span className="grad-text">Actually available.</span>
              </>
            )}
          </h2>
          <p className="mt-5 text-zinc-500 leading-relaxed">
            {isBn ? (
              <>
                আমরা <b>এই মুহূর্তে</b> সাহায্য করতে পারেন এমন মানুষের সাথে মেলাচ্ছি — লাইভ সক্রিয়তা, দূরত্ব এবং সাড়ার নির্ভরযোগ্যতার ভিত্তিতে। দুই বছর আগের নিষ্ক্রিয় কেউ কখনো দেখা যাবে না।
              </>
            ) : (
              <>
                We match by who can help <b>right now</b> — live availability, distance, and response reliability. A donor registered 2 years ago never appears as available unless confirmed.
              </>
            )}
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blood-100 text-blood-700 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                1
              </div>
              <div>
                <p className="font-bold text-zinc-800 text-sm">
                  {isBn ? 'ভৌগোলিক মেলানো' : 'Geographic matching'}
                </p>
                <p className="text-sm text-zinc-500">
                  {isBn
                    ? 'দাতারা সাড়া না দেওয়া পর্যন্ত ব্যাসার্ধ স্বয়ংক্রিয়ভাবে ৫ → ১০ → ২০ কিমি বিস্তৃত হয়।'
                    : 'Radius expands 5 → 10 → 20 km automatically until available donors respond.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blood-100 text-blood-700 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                2
              </div>
              <div>
                <p className="font-bold text-zinc-800 text-sm">
                  {isBn ? 'গোপনীয়তা সুরক্ষিত' : 'Privacy protected'}
                </p>
                <p className="text-sm text-zinc-500">
                  {isBn
                    ? 'আপনার ফোন ও ঠিকানা কখনোই উন্মুক্ত নয়। শুধু মেলানো অনুমোদিত পক্ষগুলোই যোগাযোগ করতে পারে।'
                    : 'Your phone & address are never public. Only matched parties can communicate.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blood-100 text-blood-700 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                3
              </div>
              <div>
                <p className="font-bold text-zinc-800 text-sm">
                  {isBn ? 'মানবিক সমন্বয়' : 'Human coordination'}
                </p>
                <p className="text-sm text-zinc-500">
                  {isBn
                    ? 'জরুরি পরিস্থিতিতে যাচাইকৃত স্বেচ্ছাসেবকরা সরাসরি সহায়তা ও দিকনির্দেশনায় এগিয়ে আসেন।'
                    : 'Verified volunteers step in when an emergency needs human guidance and reassurance.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Blood Group Chips Interactive Grid */}
        <div>
          <div className="glass rounded-3xl p-7 lg:p-9 shadow-2xl shadow-red-900/10 relative">
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-tr from-red-200/40 to-transparent" />
            <h3 className="font-bold text-zinc-800 mb-1.5">
              {isBn ? 'সক্রিয় দাতা নেটওয়ার্ক' : 'Available Donor Network'}
            </h3>
            <p className="text-xs text-zinc-400 mb-7">
              {isBn ? 'রক্তের গ্রুপ নির্বাচন করে বিস্তারিত দেখুন' : 'Tap a blood group to explore live availability'}
            </p>

            <div className="grid grid-cols-4 gap-4 lg:gap-5">
              {GROUPS_DATA.map((g, idx) => {
                const isSelected = selectedIdx === idx;
                return (
                  <button
                    key={g.g}
                    onClick={() => setSelectedIdx(idx)}
                    className={`bg-chip ${g.c} ${
                      isSelected ? 'ring-4 ring-red-300 scale-105 shadow-xl' : ''
                    }`}
                    style={{ boxShadow: '0 10px 24px -8px rgba(220,38,38,.4)' }}
                  >
                    {g.g}
                  </button>
                );
              })}
            </div>

            {/* Selected Group Detail Pill */}
            <div className="mt-8 rounded-2xl bg-white border border-blood-100 p-5 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-blood-800 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-red-500/30">
                  {current.g}
                </div>
                <div>
                  <p className="font-extrabold text-zinc-900 text-lg">
                    <span>{isBn ? liveCount.toLocaleString('bn-BD') : liveCount.toLocaleString()}</span>{' '}
                    <span className="text-sm font-semibold text-zinc-500">
                      {isBn ? 'জন সক্রিয় দাতা' : 'donors available'}
                    </span>
                  </p>
                  <p className="text-sm text-zinc-500">{isBn ? current.dBn : current.dEn}</p>
                </div>
              </div>

              {/* Availability Level Bar */}
              <div className="mt-4 h-2 rounded-full bg-blood-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 to-blood-800 transition-all duration-700"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DonorNetwork;
