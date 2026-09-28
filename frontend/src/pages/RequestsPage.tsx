import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchRequests, type UrgentRequestItem } from '../api';
import { ALL_DISTRICTS_LOOKUP } from '../data/bangladeshGeo';

interface RequestsPageProps {
  isBn: boolean;
  onToast: (msg: string) => void;
}

const BLOOD_GROUPS = ['all', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const RequestsPage: React.FC<RequestsPageProps> = ({ isBn, onToast }) => {
  const [requests, setRequests] = useState<UrgentRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadRequests = () => {
    setLoading(true);
    const searchCombined = [search, districtFilter !== 'all' ? districtFilter : ''].filter(Boolean).join(' ');
    fetchRequests(urgencyFilter, groupFilter, searchCombined)
      .then((data) => setRequests(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRequests();
  }, [urgencyFilter, groupFilter, districtFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRequests();
  };

  const getUrgencyBadge = (urg: string) => {
    switch (urg) {
      case 'EMERGENCY_NOW':
        return { labelEn: 'Emergency — Now', labelBn: 'জরুরি — এখনই', className: 'bg-red-500 text-white' };
      case 'TODAY':
        return { labelEn: 'Today', labelBn: 'আজকে', className: 'bg-amber-100 text-amber-700 border border-amber-200' };
      case 'WITHIN_6_HOURS':
        return { labelEn: 'Within 6 hrs', labelBn: '৬ ঘণ্টার মধ্যে', className: 'bg-orange-100 text-orange-700 border border-orange-200' };
      default:
        return { labelEn: 'Normal', labelBn: 'সাধারণ', className: 'bg-zinc-100 text-zinc-600 border border-zinc-200' };
    }
  };

  const handleShare = (req: UrgentRequestItem) => {
    const url = `${window.location.origin}/requests/${req.id}`;
    const text = `URGENT BLOOD NEEDED (${req.blood_group}) at ${req.hospital} — RoktoLinkBD: ${url}`;
    if (navigator.share) {
      navigator.share({ title: 'RoktoLinkBD', text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      onToast(isBn ? 'লিংক কপি করা হয়েছে!' : 'Link copied to clipboard!');
    }
  };

  const allDistrictNames = Object.keys(ALL_DISTRICTS_LOOKUP).sort();

  return (
    <div className="min-h-screen pt-28 pb-20 px-5 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-extrabold tracking-[0.25em] uppercase text-red-500">
            {isBn ? 'লাইভ নেটওয়ার্ক' : 'Live Emergency Feed'}
          </span>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-zinc-900 tracking-tight mt-1">
            {isBn ? 'জরুরি রক্তের অনুরোধসমূহ' : 'Live Blood Requests'}
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm mt-1">
            {isBn
              ? 'সরাসরি রোগীর পরিবারের সাথে যুক্ত হোন এবং নিকটস্থ হাসপাতালে রক্তদান করুন'
              : 'Directly support patient families and donate at authorized medical facilities across all 64 districts'}
          </p>
        </div>

        <Link
          to="/requests/create"
          className="btn-primary px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg cursor-pointer"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M12 2C12 2 5 10.5 5 15a7 7 0 0 0 14 0C19 10.5 12 2 12 2z" />
          </svg>
          <span>{isBn ? 'রক্তের অনুরোধ পোস্ট করুন' : 'Post Blood Request'}</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-3xl bg-white border border-blood-100 p-5 sm:p-6 shadow-sm mb-8 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isBn ? 'হাসপাতালের নাম, ওয়ার্ড বা এলাকা দিয়ে খুঁজুন…' : 'Search by hospital, ward or area…'}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 border border-blood-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white"
            />
          </div>

          {/* District Select Filter */}
          <div className="w-full sm:w-56">
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 border border-blood-100 text-sm font-semibold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
            >
              <option value="all">{isBn ? '— সকল জেলা (৬৪টি) —' : '— All Districts (64) —'}</option>
              {allDistrictNames.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blood-700 text-white font-bold text-sm hover:bg-blood-800 transition-colors cursor-pointer shrink-0"
          >
            {isBn ? 'খুঁজুন' : 'Search'}
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-zinc-100 text-xs">
          {/* Blood group chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-zinc-500 mr-1">{isBn ? 'গ্রুপ:' : 'Group:'}</span>
            {BLOOD_GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroupFilter(g)}
                className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  groupFilter === g
                    ? 'bg-blood-700 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {g.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Urgency buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-zinc-500 mr-1">{isBn ? 'জরুরি মাত্রা:' : 'Urgency:'}</span>
            {['all', 'EMERGENCY_NOW', 'TODAY', 'NORMAL'].map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUrgencyFilter(u)}
                className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  urgencyFilter === u
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {u === 'all'
                  ? isBn ? 'সব' : 'All'
                  : u === 'EMERGENCY_NOW'
                  ? isBn ? 'জরুরি' : 'Emergency'
                  : u === 'TODAY'
                  ? isBn ? 'আজকে' : 'Today'
                  : isBn ? 'সাধারণ' : 'Normal'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Requests */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 rounded-full border-3 border-blood-600 border-t-transparent animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-blood-100 p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-2xl">
            🩸
          </div>
          <p className="text-lg font-bold text-zinc-700">
            {isBn ? 'কোনো অনুরোধ খুঁজে পাওয়া যায়নি' : 'No blood requests matching your filters'}
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            {isBn ? 'অন্য ফিল্টার চেষ্টা করুন অথবা নতুন অনুরোধ পোস্ট করুন' : 'Try broadening your search filters'}
          </p>
          <div className="mt-5">
            <button
              onClick={() => {
                setSearch('');
                setGroupFilter('all');
                setUrgencyFilter('all');
                setDistrictFilter('all');
              }}
              className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
            >
              {isBn ? 'সব ফিল্টার সাফ করুন' : 'Clear all filters'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {requests.map((r) => {
            const u = getUrgencyBadge(r.urgency);
            const googleNavUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([r.hospital, r.address, 'Bangladesh'].filter(Boolean).join(', '))}`;
            return (
              <div
                key={r.id}
                className="rounded-3xl bg-white border border-blood-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-blood-800 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-red-500/30">
                        {r.blood_group}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 text-base">
                          {r.component} · {r.units} {isBn ? 'ইউনিট' : 'units'}
                        </p>
                        <p className="text-xs text-zinc-400 font-mono mt-0.5">{r.code}</p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2.5 py-1.5 rounded-full ${u.className}`}>
                      {isBn ? u.labelBn : u.labelEn}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-zinc-600 mb-6">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blood-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.7 14.5c-1.6 3-4.8 5-8.7 5-5 0-9-4-9-9s4-9 9-9c3.9 0 7.1 2 8.7 5" />
                        <circle cx="12" cy="10.5" r="2.5" />
                      </svg>
                      <span className="font-semibold text-zinc-800 truncate">{r.hospital}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blood-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{r.time}</span> · <span className="font-semibold text-zinc-700">{r.district || 'Dhaka'}</span>
                      </div>

                      {/* Google Maps Shortcut for turn-by-turn navigation */}
                      <a
                        href={googleNavUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
                        title={isBn ? 'গুগল ম্যাপে দিকনির্দেশনা দেখুন' : 'Get directions in Google Maps'}
                      >
                        <span>🗺️</span>
                        <span>{isBn ? 'ম্যাপ' : 'Map'}</span>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-blood-100 flex items-center justify-between">
                  <Link
                    to={`/requests/${r.id}`}
                    className="text-xs font-bold text-blood-700 hover:text-blood-900 transition-colors flex items-center gap-1"
                  >
                    <span>{isBn ? 'সাড়া দিন / বিস্তারিত' : 'View & Respond'}</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  <button
                    onClick={() => handleShare(r)}
                    className="text-xs font-bold text-zinc-500 hover:text-blood-600 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
  );
};

export default RequestsPage;
