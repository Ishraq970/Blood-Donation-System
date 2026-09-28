import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchRequests } from '../api';
import type { UrgentRequestItem } from '../api';

interface UrgentRequestsProps {
  isBn: boolean;
  onToast: (msg: string) => void;
}

const UrgentRequests: React.FC<UrgentRequestsProps> = ({ isBn, onToast }) => {
  const [filter, setFilter] = useState('all');
  const [requests, setRequests] = useState<UrgentRequestItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchRequests(filter)
      .then((data) => setRequests(data))
      .finally(() => setLoading(false));
  }, [filter]);

  const handleShare = (req: UrgentRequestItem) => {
    const text = `URGENT BLOOD NEEDED — RoktoLinkBD\nBlood Group: ${req.blood_group}\nHospital: ${req.hospital}, ${req.district}\nUnits: ${req.units} units (${req.component})\nCode: ${req.code}\n${window.location.origin}/requests/${req.id}`;
    if (navigator.share) {
      navigator.share({ title: 'RoktoLinkBD Urgent Request', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      onToast(isBn ? 'জরুরি রক্তের অনুরোধ কপি করা হয়েছে!' : 'Request link copied to clipboard!');
    }
  };

  const getUrgencyBadge = (urg: string) => {
    switch (urg) {
      case 'EMERGENCY_NOW':
        return {
          labelEn: 'Emergency — Needed Now',
          labelBn: 'জরুরি — এখনই প্রয়োজন',
          className: 'bg-red-500 text-white',
          dot: true,
        };
      case 'TODAY':
        return {
          labelEn: 'Needed Today',
          labelBn: 'আজকের মধ্যে প্রয়োজন',
          className: 'bg-amber-100 text-amber-700 border border-amber-200',
          dot: false,
        };
      case 'WITHIN_6_HOURS':
        return {
          labelEn: 'Within 6 hours',
          labelBn: '৬ ঘণ্টার মধ্যে',
          className: 'bg-orange-100 text-orange-700 border border-orange-200',
          dot: false,
        };
      default:
        return {
          labelEn: 'Normal',
          labelBn: 'সাধারণ',
          className: 'bg-zinc-100 text-zinc-600 border border-zinc-200',
          dot: false,
        };
    }
  };

  return (
    <section id="requests" className="py-24 lg:py-28">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        {/* Header & Filter Controls */}
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-xs font-extrabold tracking-[0.25em] uppercase text-red-500">
              {isBn ? 'এই মুহূর্তে' : 'Right Now'}
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold mt-3 tracking-tight text-zinc-900">
              {isBn ? (
                <>
                  আপনার কাছাকাছি <span className="grad-text">জরুরি অনুরোধ</span>
                </>
              ) : (
                <>
                  Urgent requests <span className="grad-text">near you</span>
                </>
              )}
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                filter === 'all'
                  ? 'bg-blood-700 text-white'
                  : 'bg-white border border-blood-100 text-zinc-600 hover:border-red-300'
              }`}
            >
              {isBn ? 'সব' : 'All'}
            </button>
            <button
              onClick={() => setFilter('EMERGENCY_NOW')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                filter === 'EMERGENCY_NOW'
                  ? 'bg-blood-700 text-white'
                  : 'bg-white border border-blood-100 text-zinc-600 hover:border-red-300'
              }`}
            >
              {isBn ? 'জরুরি' : 'Emergency'}
            </button>
            <button
              onClick={() => setFilter('TODAY')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                filter === 'TODAY'
                  ? 'bg-blood-700 text-white'
                  : 'bg-white border border-blood-100 text-zinc-600 hover:border-red-300'
              }`}
            >
              {isBn ? 'আজকে' : 'Today'}
            </button>
            <button
              onClick={() => setFilter('NORMAL')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                filter === 'NORMAL'
                  ? 'bg-blood-700 text-white'
                  : 'bg-white border border-blood-100 text-zinc-600 hover:border-red-300'
              }`}
            >
              {isBn ? 'সাধারণ' : 'Normal'}
            </button>
          </div>
        </div>

        {/* Requests Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-blood-600 border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {requests.map((r) => {
              const u = getUrgencyBadge(r.urgency);
              return (
                <div
                  key={r.id}
                  className="req-card rounded-3xl bg-white border border-blood-100 p-6 transition-all hover:shadow-xl flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-blood-800 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-red-500/30">
                          {r.blood_group}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900">
                            {r.component} · {r.units}{' '}
                            <span>{r.units > 1 ? (isBn ? 'ইউনিট' : 'units') : (isBn ? 'ইউনিট' : 'unit')}</span>
                          </p>
                          <p className="text-xs text-zinc-400 font-mono mt-0.5">{r.code}</p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-extrabold px-2.5 py-1.5 rounded-full ${u.className} flex items-center gap-1.5`}>
                        {u.dot && <span className="w-1.5 h-1.5 rounded-full bg-white urgency-dot" />}
                        <span>{isBn ? u.labelBn : u.labelEn}</span>
                      </span>
                    </div>

                    {/* Location & Time Info */}
                    <div className="space-y-2.5 text-sm text-zinc-600 mb-6">
                      <div className="flex items-center gap-2.5">
                        <svg className="w-4 h-4 text-blood-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.7 14.5c-1.6 3-4.8 5-8.7 5-5 0-9-4-9-9s4-9 9-9c3.9 0 7.1 2 8.7 5" />
                          <circle cx="12" cy="10.5" r="2.5" />
                        </svg>
                        <span className="font-medium truncate">{r.hospital}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-zinc-500">
                        <svg className="w-4 h-4 text-blood-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{r.time}</span> · <span className="text-zinc-600 font-semibold">{r.district}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="pt-4 border-t border-blood-100/70 flex items-center justify-between">
                    <Link
                      to={`/requests/${r.id}`}
                      className="text-xs font-bold text-blood-700 hover:text-blood-900 transition-colors flex items-center gap-1.5"
                    >
                      <span>{isBn ? 'সাড়া দিন / বিস্তারিত' : 'Respond to Request'}</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>

                    <button
                      onClick={() => handleShare(r)}
                      className="text-xs font-bold text-zinc-500 hover:text-blood-600 flex items-center gap-1.5 transition-colors p-1"
                      title="Share request"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.7 13.3a4 4 0 010-2.6L15 5.5M15 18.5l-6.3-5.2a4 4 0 010-2.6L15 5.5" />
                      </svg>
                      <span>{isBn ? 'শেয়ার' : 'Share'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default UrgentRequests;
