import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchDonorsApi, sendBloodRequestToDonorApi, fetchMyBloodRequestsApi, type DonorSearchResult, type UserBloodRequestItem } from '../api';
import { useAuth } from '../context/AuthContext';
import { BANGLADESH_GEO, ALL_DISTRICTS_LOOKUP } from '../data/bangladeshGeo';
import InteractiveLocationMap from '../components/InteractiveLocationMap';

interface DonorsPageProps {
  isBn?: boolean;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const BLOOD_COLORS: Record<string, string> = {
  'A+': 'from-rose-500 to-red-600',
  'A-': 'from-rose-600 to-red-700',
  'B+': 'from-orange-500 to-red-500',
  'B-': 'from-orange-600 to-red-600',
  'AB+': 'from-purple-500 to-red-500',
  'AB-': 'from-purple-600 to-red-600',
  'O+': 'from-red-500 to-blood-700',
  'O-': 'from-red-600 to-blood-800',
};

const DonorsPage: React.FC<DonorsPageProps> = ({ isBn = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bloodGroup, setBloodGroup] = useState('');
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [upazila, setUpazila] = useState('');
  const [areaText, setAreaText] = useState('');
  const [postcode, setPostcode] = useState('');
  const [activeTab, setActiveTab] = useState<'filters' | 'map'>('filters');
  const [results, setResults] = useState<DonorSearchResult[] | null>(null);
  const [sqlQuery, setSqlQuery] = useState('');
  const [totalFound, setTotalFound] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Blood request modal state
  const [requestModalDonor, setRequestModalDonor] = useState<DonorSearchResult | null>(null);
  const [myRequests, setMyRequests] = useState<UserBloodRequestItem[]>([]);
  const [loadingMyRequests, setLoadingMyRequests] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestResult, setRequestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Cascading lists from complete Bangladesh geo database
  const availableDistricts = division && BANGLADESH_GEO[division] ? Object.keys(BANGLADESH_GEO[division].districts) : [];
  const availableUpazilas = district && ALL_DISTRICTS_LOOKUP[district] ? ALL_DISTRICTS_LOOKUP[district].district.upazilas : [];

  useEffect(() => {
    setDistrict('');
    setUpazila('');
  }, [division]);

  useEffect(() => {
    setUpazila('');
  }, [district]);

  const buildLocationString = () => [upazila, district, division].filter(Boolean).join(', ');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!bloodGroup) {
      setError(isBn ? 'রক্তের গ্রুপ বেছে নিন' : 'Please select a blood group.');
      return;
    }
    setError('');
    setLoading(true);
    setSearched(true);
    const locationStr = buildLocationString() || areaText || '';
    try {
      const res = await searchDonorsApi(bloodGroup, locationStr);
      setResults(res.data);
      setSqlQuery(res.sql_executed);
      setTotalFound(res.total);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    } catch (err: any) {
      setError(err?.response?.data?.message || (isBn ? 'সার্ভার ত্রুটি। পরে আবার চেষ্টা করুন।' : 'Server error. Please try again.'));
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Open request blood modal — requires login
  const handleOpenRequestModal = async (donor: DonorSearchResult) => {
    if (!user) {
      navigate('/login?redirect=/donors');
      return;
    }
    setRequestModalDonor(donor);
    setSelectedRequestId(null);
    setRequestResult(null);
    setLoadingMyRequests(true);
    try {
      const reqs = await fetchMyBloodRequestsApi();
      // Only show SEARCHING/open requests
      setMyRequests(reqs.filter((r) => !['FULFILLED', 'CANCELLED'].includes(r.status)));
    } catch {
      setMyRequests([]);
    } finally {
      setLoadingMyRequests(false);
    }
  };

  const handleCloseModal = () => {
    setRequestModalDonor(null);
    setSelectedRequestId(null);
    setRequestResult(null);
    setMyRequests([]);
  };

  const handleSendRequest = async () => {
    if (!requestModalDonor || !selectedRequestId) return;
    setSendingRequest(true);
    setRequestResult(null);
    try {
      const res = await sendBloodRequestToDonorApi(requestModalDonor.donor_id, selectedRequestId);
      setRequestResult({ success: true, message: res.message });
    } catch (err: any) {
      setRequestResult({ success: false, message: err.response?.data?.message || 'Failed to send request.' });
    } finally {
      setSendingRequest(false);
    }
  };

  const handleReset = () => {
    setBloodGroup('');
    setDivision('');
    setDistrict('');
    setUpazila('');
    setAreaText('');
    setPostcode('');
    setResults(null);
    setSqlQuery('');
    setTotalFound(0);
    setSearched(false);
    setError('');
  };

  // Called when user clicks or drops a pin on the Interactive Map
  const handleMapLocationSelect = (loc: {
    lat: number;
    lng: number;
    division: string;
    district: string;
    upazila?: string;
    formatted: string;
  }) => {
    setDivision(loc.division);
    setDistrict(loc.district);
    if (loc.upazila) {
      setUpazila(loc.upazila);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return <span className="text-emerald-600 font-semibold text-xs">✓ Never donated (Eligible)</span>;
    return new Date(date).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getEligibilityBadge = (lastDonation: string | null) => {
    if (!lastDonation) return { label: 'Ready', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    const diff = Date.now() - new Date(lastDonation).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days >= 90) return { label: `${days}d ago`, cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    return { label: `${90 - days}d left`, cls: 'bg-amber-100 text-amber-700 border-amber-200' };
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #fff5f5 0%, #fff 50%, #fef7f7 100%)' }}>
      {/* Hero Header */}
      <div
        className="relative overflow-hidden pt-24 pb-20 px-5"
        style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #dc2626 100%)' }}
      >
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #fca5a5, transparent)' }} />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #fca5a5, transparent)' }} />
        <div className="relative max-w-5xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-white text-xs font-bold tracking-widest uppercase">
              {isBn ? 'স্টোরড প্রসিডিউর চালিত • দেশব্যাপী ৬৪ জেলা' : 'Stored Procedure Powered • 64 Districts'}
            </span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-white mb-4 tracking-tight">
            {isBn ? 'রক্তদাতা খুঁজুন' : 'Find Blood Donors'}
          </h1>
          <p className="text-red-200 text-lg max-w-2xl mx-auto leading-relaxed">
            {isBn
              ? 'বিভাগ, জেলা ও উপজেলা অনুযায়ী খুঁজুন অথবা ইন্টারঅ্যাক্টিভ ম্যাপে পিন ড্রপ করে এলাকা নির্বাচন করুন।'
              : 'Filter by Division, District & Upazila or click and drop a pin on the Interactive Map.'}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {['🗺️ Interactive Leaflet Map', '🏛️ 8 Divisions', '🏘️ All 64 Districts', '📍 Complete Upazilas', '⚡ MySQL Stored Proc'].map((f) => (
              <span
                key={f}
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="max-w-5xl mx-auto px-5 -mt-8 relative z-10">
        <div className="rounded-3xl shadow-2xl overflow-hidden bg-white" style={{ boxShadow: '0 25px 60px rgba(185,28,28,0.15)' }}>
          {/* Tab Bar */}
          <div className="flex border-b border-zinc-100">
            {(['filters', 'map'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'text-red-600 border-b-2 border-red-500 bg-red-50/50'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {tab === 'filters' ? (
                  <>
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    {isBn ? 'ফিল্টার দিয়ে খুঁজুন' : 'Search with Filters'}
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                      <line x1="8" y1="2" x2="8" y2="18" />
                      <line x1="16" y1="6" x2="16" y2="22" />
                    </svg>
                    {isBn ? 'ম্যাপে এলাকা বেছে নিন' : 'Interactive Map Picker'}
                  </>
                )}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="p-6 lg:p-8">
            {activeTab === 'filters' && (
              <div className="space-y-6">
                {/* Blood Group */}
                <div>
                  <label className="block text-sm font-bold text-zinc-800 mb-3">
                    🩸 {isBn ? 'রক্তের গ্রুপ বেছে নিন' : 'Select Blood Group'}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {BLOOD_GROUPS.map((bg) => (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => setBloodGroup(bloodGroup === bg ? '' : bg)}
                        className={`py-3 rounded-xl text-sm font-black transition-all duration-200 border-2 cursor-pointer ${
                          bloodGroup === bg
                            ? `bg-gradient-to-br ${BLOOD_COLORS[bg] || 'from-red-500 to-red-700'} text-white border-transparent shadow-lg scale-105`
                            : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-red-300 hover:bg-red-50'
                        }`}
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Filters */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-red-500" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    <label className="text-sm font-bold text-zinc-800">
                      {isBn ? 'অবস্থান ফিল্টার (বাংলাদেশের ৬৪ জেলা)' : 'Location Filters (All 64 Districts)'}
                      <span className="text-zinc-400 font-normal ml-2 text-xs">({isBn ? 'ঐচ্ছিক' : 'optional'})</span>
                    </label>
                  </div>

                  {/* Row 1: Division, District, Upazila */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Division */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">
                        {isBn ? 'বিভাগ' : 'Division'}
                      </label>
                      <div className="relative">
                        <select
                          value={division}
                          onChange={(e) => setDivision(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border-2 border-zinc-200 focus:border-red-400 focus:outline-none text-sm text-zinc-800 appearance-none bg-white transition-colors pr-8 cursor-pointer"
                        >
                          <option value="">{isBn ? '— বিভাগ (সকল) —' : '— All Divisions —'}</option>
                          {Object.keys(BANGLADESH_GEO).map((d) => (
                            <option key={d} value={d}>
                              {isBn ? BANGLADESH_GEO[d].nameBn : d}
                            </option>
                          ))}
                        </select>
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* District */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">
                        {isBn ? 'জেলা (৬৪ জেলা)' : 'District (64 Districts)'}
                      </label>
                      <div className="relative">
                        <select
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          disabled={!division}
                          className="w-full px-3 py-2.5 rounded-xl border-2 border-zinc-200 focus:border-red-400 focus:outline-none text-sm text-zinc-800 appearance-none bg-white transition-colors pr-8 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <option value="">
                            {!division
                              ? (isBn ? '— আগে বিভাগ বেছে নিন —' : '— Choose Division first —')
                              : (isBn ? '— জেলা বেছে নিন —' : '— Select District —')}
                          </option>
                          {availableDistricts.map((distKey) => {
                            const distObj = BANGLADESH_GEO[division]?.districts[distKey];
                            return (
                              <option key={distKey} value={distKey}>
                                {isBn && distObj ? distObj.nameBn : distKey}
                              </option>
                            );
                          })}
                        </select>
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Upazila */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">
                        {isBn ? 'উপজেলা / থানা' : 'Upazila / Thana'}
                      </label>
                      <div className="relative">
                        <select
                          value={upazila}
                          onChange={(e) => setUpazila(e.target.value)}
                          disabled={!district}
                          className="w-full px-3 py-2.5 rounded-xl border-2 border-zinc-200 focus:border-red-400 focus:outline-none text-sm text-zinc-800 appearance-none bg-white transition-colors pr-8 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <option value="">
                            {!district
                              ? (isBn ? '— আগে জেলা বেছে নিন —' : '— Choose District first —')
                              : (isBn ? '— সকল উপজেলা —' : '— All Upazilas —')}
                          </option>
                          {availableUpazilas.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Area and Postcode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">
                        {isBn ? 'এলাকা / মহল্লা / ল্যান্ডমার্ক' : 'Area / Locality / Landmark'}
                      </label>
                      <input
                        type="text"
                        value={areaText}
                        onChange={(e) => setAreaText(e.target.value)}
                        placeholder={isBn ? 'যেমন: মিরপুর-১০, ধানমন্ডি-৩২, আগ্রাবাদ…' : 'e.g. Mirpur-10, Dhanmondi 32, Agrabad…'}
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-zinc-200 focus:border-red-400 focus:outline-none text-sm text-zinc-800 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">
                        {isBn ? 'পোস্টকোড' : 'Post Code'}
                      </label>
                      <input
                        type="text"
                        value={postcode}
                        onChange={(e) => setPostcode(e.target.value)}
                        maxLength={6}
                        placeholder={isBn ? 'যেমন: ১২১৬, ৪০০০…' : 'e.g. 1216, 4000…'}
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-zinc-200 focus:border-red-400 focus:outline-none text-sm text-zinc-800 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Quick Division Chips */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs text-zinc-400 font-medium self-center">{isBn ? 'দ্রুত বিভাগ:' : 'Quick Divisions:'}</span>
                    {Object.keys(BANGLADESH_GEO).map((div) => (
                      <button
                        key={div}
                        type="button"
                        onClick={() => setDivision(division === div ? '' : div)}
                        className={`text-xs px-3 py-1 rounded-full border font-medium transition-all cursor-pointer ${
                          division === div
                            ? 'bg-red-600 text-white border-red-600 shadow-md'
                            : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-red-300 hover:bg-red-50'
                        }`}
                      >
                        {isBn ? BANGLADESH_GEO[div].nameBn : div}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Filter Summary */}
                {(bloodGroup || division || district || upazila || areaText || postcode) && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-red-700 font-medium shrink-0">{isBn ? 'সক্রিয় ফিল্টার:' : 'Active filters:'}</span>
                    {bloodGroup && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">🩸 {bloodGroup}</span>}
                    {division && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">📍 {division}</span>}
                    {district && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">🏛️ {district}</span>}
                    {upazila && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">🏘️ {upazila}</span>}
                    {areaText && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">📌 {areaText}</span>}
                    {postcode && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">📮 {postcode}</span>}
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="currentColor">
                      <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 flex-wrap">
                  <button
                    id="donor-search-btn"
                    type="submit"
                    disabled={loading}
                    className="flex-1 min-w-[140px] py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all cursor-pointer"
                    style={{
                      background: loading ? '#9ca3af' : 'linear-gradient(135deg, #b91c1c, #dc2626)',
                      boxShadow: loading ? 'none' : '0 8px 24px rgba(185,28,28,0.35)',
                    }}
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" strokeOpacity=".25" />
                          <path d="M12 2a10 10 0 0 1 10 10" />
                        </svg>
                        {isBn ? 'খুঁজছি…' : 'Searching…'}
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="11" cy="11" r="7" />
                          <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                        </svg>
                        {isBn ? 'দাতা খুঁজুন' : 'Search Donors'}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('map')}
                    className="px-4 py-3.5 rounded-xl font-bold text-red-600 border-2 border-red-200 hover:bg-red-50 text-sm flex items-center gap-2 transition-all cursor-pointer"
                  >
                    🗺️ {isBn ? 'ম্যাপে দেখুন' : 'Map View'}
                  </button>

                  {searched && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-4 py-3.5 rounded-xl text-sm font-semibold text-zinc-500 border-2 border-zinc-200 hover:border-red-300 hover:text-red-600 transition-all cursor-pointer"
                    >
                      {isBn ? 'রিসেট' : 'Reset'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: INTERACTIVE LOCATION MAP */}
            {activeTab === 'map' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-red-50/70 p-3.5 rounded-2xl border border-red-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📍</span>
                    <p className="text-xs text-zinc-700">
                      {isBn
                        ? 'ম্যাপে যেকোনো জায়গায় ক্লিক করুন বা পিন টানুন — স্বয়ংক্রিয়ভাবে জেলা ও উপজেলা নির্ধারিত হবে।'
                        : 'Click anywhere on the map or drag the pin — District & Upazila are selected automatically.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-700">
                      {district ? `📍 ${district}` : isBn ? 'জেলা নির্বাচিত হয়নি' : 'No district selected'}
                    </span>
                  </div>
                </div>

                {/* Interactive Leaflet Map Component */}
                <InteractiveLocationMap
                  selectedDivision={division}
                  selectedDistrict={district}
                  selectedUpazila={upazila}
                  selectedArea={areaText}
                  onSelectLocation={handleMapLocationSelect}
                  isBn={isBn}
                  height="450px"
                />

                {/* Quick Blood Group selector inside Map Tab */}
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-700">{isBn ? 'রক্তের গ্রুপ:' : 'Blood Group:'}</span>
                    <div className="flex flex-wrap gap-1">
                      {BLOOD_GROUPS.map((bg) => (
                        <button
                          key={bg}
                          type="button"
                          onClick={() => setBloodGroup(bg)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            bloodGroup === bg ? 'bg-red-600 text-white shadow-sm' : 'bg-white text-zinc-700 border border-zinc-200 hover:border-red-300'
                          }`}
                        >
                          {bg}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSearch()}
                    disabled={loading || !bloodGroup}
                    className="px-6 py-2.5 rounded-xl font-bold text-white text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    style={{
                      background: !bloodGroup ? '#9ca3af' : 'linear-gradient(135deg, #b91c1c, #dc2626)',
                      boxShadow: !bloodGroup ? 'none' : '0 4px 16px rgba(185,28,28,0.3)',
                    }}
                  >
                    {!bloodGroup ? (isBn ? 'রক্তের গ্রুপ বেছে নিন' : 'Select blood group') : isBn ? 'এই এলাকার দাতা খুঁজুন' : 'Search Donors Here'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Results section */}
      <div ref={resultsRef} className="max-w-5xl mx-auto px-5 py-10">
        {/* SQL Query Badge */}
        {sqlQuery && (
          <div className="mb-6 rounded-xl overflow-hidden border border-zinc-200 shadow-sm">
            <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'linear-gradient(90deg, #1e1b4b, #312e81)' }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-indigo-300" fill="currentColor">
                <path d="M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
              </svg>
              <span className="text-indigo-300 text-xs font-bold tracking-wider uppercase">SQL Executed (Stored Procedure)</span>
            </div>
            <div className="px-5 py-4 font-mono text-sm text-emerald-400 overflow-x-auto" style={{ background: '#0d1117' }}>
              {sqlQuery}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl bg-white border border-zinc-100 p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-200"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-200 rounded w-1/3"></div>
                    <div className="h-3 bg-zinc-100 rounded w-1/2"></div>
                  </div>
                  <div className="w-20 h-8 bg-zinc-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {!loading && searched && results !== null && results.length === 0 && (
          <div className="text-center py-20">
            <div
              className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #fee2e2, #fecaca)' }}
            >
              <svg viewBox="0 0 24 24" className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-zinc-700 mb-2">{isBn ? 'কোনো দাতা পাওয়া যায়নি' : 'No donors found'}</h3>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto">
              {isBn
                ? `${bloodGroup} রক্তের গ্রুপে${buildLocationString() ? ` ${buildLocationString()}` : ''} কোনো সক্রিয় দাতা পাওয়া যায়নি।`
                : `No active donors found for blood group ${bloodGroup}${buildLocationString() ? ` in ${buildLocationString()}` : ''}.`}
            </p>
          </div>
        )}

        {/* Results table */}
        {!loading && results && results.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-black text-zinc-800">{isBn ? 'দাতাদের তালিকা' : 'Eligible Donors'}</h2>
                <p className="text-sm text-zinc-500 mt-0.5">
                  <span className="font-bold text-red-600">{totalFound}</span> {isBn ? 'জন দাতা পাওয়া গেছে' : 'donors found'} ·{' '}
                  <span className="font-bold text-zinc-700">{bloodGroup}</span>
                  {buildLocationString() && (
                    <>
                      {' '}
                      · <span className="font-bold text-zinc-700">{buildLocationString()}</span>
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {isBn ? 'যোগ্য' : 'Eligible'}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  {isBn ? 'অপেক্ষায়' : 'Waiting'}
                </span>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-zinc-200 shadow-lg bg-white">
              <div
                className="grid grid-cols-12 px-5 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-100"
                style={{ background: '#f9fafb' }}
              >
                <div className="col-span-1">#</div>
                <div className="col-span-3">{isBn ? 'দাতার নাম' : 'Donor'}</div>
                <div className="col-span-1 text-center">{isBn ? 'গ্রুপ' : 'Group'}</div>
                <div className="col-span-2">{isBn ? 'ফোন' : 'Phone'}</div>
                <div className="col-span-2">{isBn ? 'অবস্থান' : 'Location'}</div>
                <div className="col-span-2">{isBn ? 'শেষ দান' : 'Last Donated'}</div>
                <div className="col-span-1 text-center">{isBn ? 'যোগ্যতা' : 'Status'}</div>
              </div>

              {results.map((donor, idx) => {
                const badge = getEligibilityBadge(donor.last_donation_at);
                const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([donor.location_name, donor.landmark, 'Bangladesh'].filter(Boolean).join(', '))}`;
                return (
                  <div
                    key={donor.donor_id}
                    className="grid grid-cols-12 px-5 py-4 items-center border-b border-zinc-50 hover:bg-red-50/40 transition-colors duration-150"
                    style={{ background: idx % 2 === 0 ? 'white' : '#fafafa' }}
                  >
                    <div className="col-span-1 text-xs text-zinc-400 font-mono">{idx + 1}</div>
                    <div className="col-span-3 flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-black bg-gradient-to-br ${BLOOD_COLORS[donor.blood_group] || 'from-red-500 to-red-700'} shrink-0`}
                      >
                        {donor.donor_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-zinc-800 leading-tight">{donor.donor_name}</div>
                        <div className="text-xs text-zinc-400 font-mono mt-0.5">{donor.public_donor_code}</div>
                      </div>
                    </div>
                    <div className="col-span-1 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-black text-white bg-gradient-to-br ${BLOOD_COLORS[donor.blood_group] || 'from-red-500 to-red-700'}`}
                      >
                        {donor.blood_group}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
                          <span>🔒</span>
                          <span className="font-mono">{donor.donor_phone || 'Protected'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenRequestModal(donor)}
                          className="text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 py-1 px-2 rounded-lg border border-red-200 transition-colors flex items-center gap-1 w-fit cursor-pointer"
                          title={user ? 'Send blood request to this donor' : 'Login to send blood request'}
                        >
                          <span>🚨</span> {isBn ? 'রক্তের অনুরোধ পাঠান' : 'Request Blood'}
                          {!user && <span className="ml-1 text-zinc-400">(Login)</span>}
                        </button>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <a
                        href={mapSearchUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={isBn ? 'গুগল ম্যাপে দেখুন' : 'View on Google Maps'}
                        className="text-sm text-zinc-600 hover:text-red-600 transition-colors flex items-center gap-1 group"
                      >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-red-500 shrink-0 group-hover:scale-110 transition-transform" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        <span className="truncate underline decoration-dotted decoration-zinc-300 group-hover:decoration-red-400">
                          {donor.location_name}
                        </span>
                      </a>
                      {donor.landmark && <div className="text-xs text-zinc-400 mt-0.5 pl-4 truncate">{donor.landmark}</div>}
                    </div>
                    <div className="col-span-2 text-xs text-zinc-500">{formatDate(donor.last_donation_at)}</div>
                    <div className="col-span-1 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${badge.cls}`}>{badge.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!searched && (
          <div className="text-center py-16">
            <div
              className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #fee2e2, #fecaca)' }}
            >
              <svg viewBox="0 0 24 24" className="w-12 h-12 text-red-500" fill="currentColor">
                <path d="M12 2C12 2 5 10.5 5 15a7 7 0 0 0 14 0C19 10.5 12 2 12 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-zinc-700 mb-2">{isBn ? 'রক্তদাতা খুঁজুন' : 'Search for Donors'}</h3>
            <p className="text-zinc-400 text-sm max-w-sm mx-auto">
              {isBn
                ? 'উপরে রক্তের গ্রুপ ও অবস্থান ফিল্টার অথবা ইন্টারেক্টিভ ম্যাপ দিয়ে সারা বাংলাদেশ থেকে দাতা খুঁজুন।'
                : 'Use the filters above or the interactive map to find eligible donors across all 64 districts.'}
            </p>
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
              {[
                { icon: '🗺️', title: isBn ? 'ইন্টারঅ্যাক্টিভ ম্যাপ' : 'Interactive Map', desc: isBn ? 'ক্লিক করে পিন ড্রপ ও এলাকা নির্ধারণ' : 'Click & drop pin to pick any spot in Bangladesh' },
                { icon: '🏛️', title: isBn ? '৮টি বিভাগ ও ৬৪ জেলা' : '8 Divisions & 64 Districts', desc: isBn ? 'সকল উপজেলার পরিপূর্ণ ও সঠিক তালিকা' : 'Complete upazilas with zero missing data' },
                { icon: '⚡', title: isBn ? 'স্টোরড প্রসিডিউর' : 'Stored Procedure', desc: isBn ? 'দ্রুত ও অপ্টিমাইজড এসকিউএল এক্সিকিউশন' : 'sp_get_eligible_donors_by_group CALL' },
                { icon: '✅', title: isBn ? '৯০ দিনের ফিল্টার' : '90-Day Filter', desc: isBn ? 'আজ রক্তদানের যোগ্য দাতা তালিকা' : 'Only donors eligible today are shown' },
              ].map((item) => (
                <div key={item.title} className="rounded-xl p-4 bg-white border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="font-bold text-zinc-700 text-sm mb-1">{item.title}</div>
                  <div className="text-xs text-zinc-500 leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── REQUEST BLOOD MODAL ── */}
      {requestModalDonor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #7f1d1d, #b91c1c)' }}>
              <div>
                <h2 className="text-lg font-black text-white">
                  🩸 {isBn ? 'রক্তের অনুরোধ পাঠান' : 'Send Blood Request'}
                </h2>
                <p className="text-xs text-red-200 mt-0.5">
                  {isBn
                    ? `দাতা: ${requestModalDonor.donor_name} (${requestModalDonor.blood_group})`
                    : `To donor: ${requestModalDonor.donor_name} (${requestModalDonor.blood_group})`}
                </p>
              </div>
              <button onClick={handleCloseModal} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Result message */}
              {requestResult && (
                <div className={`p-4 rounded-xl border text-sm font-semibold ${
                  requestResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {requestResult.success ? '✅ ' : '❌ '}{requestResult.message}
                  {requestResult.success && (
                    <p className="text-xs font-normal mt-1 text-emerald-700">
                      {isBn ? 'দাতার ড্যাশবোর্ডে নোটিফিকেশন পৌঁছে গেছে!' : 'The donor will see this notification on their dashboard!'}
                    </p>
                  )}
                </div>
              )}

              {!requestResult && (
                <>
                  <p className="text-sm text-zinc-700">
                    {isBn
                      ? 'আপনার কোন "আমার রক্ত দরকার" অনুরোধের জন্য এই দাতাকে নোটিফিকেশন পাঠাতে চান?'
                      : 'Which of your "I Need Blood" requests would you like to send to this donor?'}
                  </p>

                  {loadingMyRequests ? (
                    <div className="py-8 text-center text-zinc-400 text-xs">
                      <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      {isBn ? 'অনুরোধ লোড হচ্ছে…' : 'Loading your requests…'}
                    </div>
                  ) : myRequests.length === 0 ? (
                    <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 text-center space-y-3">
                      <div className="text-3xl">📋</div>
                      <p className="text-sm font-bold text-zinc-700">
                        {isBn ? 'আপনার কোনো সক্রিয় রক্তের অনুরোধ নেই।' : 'You have no active blood requests.'}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {isBn
                          ? 'প্রথমে একটি "আমার রক্ত দরকার" অনুরোধ তৈরি করুন, তারপর দাতাকে নোটিফাই করুন।'
                          : 'First create an "I Need Blood" request, then you can notify a specific donor.'}
                      </p>
                      <button
                        onClick={() => { handleCloseModal(); navigate('/requests/create'); }}
                        className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs cursor-pointer hover:bg-red-700 transition-colors"
                      >
                        {isBn ? '+ রক্তের অনুরোধ করুন' : '+ Create Blood Request'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {myRequests.map((req) => (
                        <button
                          key={req.id}
                          onClick={() => setSelectedRequestId(req.id === selectedRequestId ? null : req.id)}
                          className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                            selectedRequestId === req.id
                              ? 'border-red-500 bg-red-50'
                              : 'border-zinc-200 hover:border-red-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="font-bold text-xs text-zinc-800">{req.code}</span>
                              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white ${
                                req.blood_group === requestModalDonor.blood_group ? 'bg-emerald-600' : 'bg-amber-500'
                              }`}>
                                {req.blood_group}
                              </span>
                              {req.blood_group !== requestModalDonor.blood_group && (
                                <span className="ml-1 text-[10px] text-amber-600 font-medium">
                                  (donor: {requestModalDonor.blood_group})
                                </span>
                              )}
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              req.status === 'SEARCHING' || req.status === 'DONORS_NOTIFIED'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-zinc-100 text-zinc-600'
                            }`}>{req.status}</span>
                          </div>
                          <p className="text-xs text-zinc-500 mt-1 truncate">{req.hospital} · {req.urgency}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {myRequests.length > 0 && (
                    <button
                      onClick={handleSendRequest}
                      disabled={!selectedRequestId || sendingRequest}
                      className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      style={{ background: selectedRequestId ? 'linear-gradient(135deg, #b91c1c, #dc2626)' : '#9ca3af' }}
                    >
                      {sendingRequest && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      {!selectedRequestId
                        ? (isBn ? 'একটি অনুরোধ বেছে নিন' : 'Select a request above')
                        : (isBn ? 'দাতাকে নোটিফিকেশন পাঠান 🚨' : 'Send Notification to Donor 🚨')}
                    </button>
                  )}
                </>
              )}

              {requestResult?.success && (
                <button onClick={handleCloseModal} className="w-full py-2.5 rounded-xl font-bold text-xs text-zinc-600 border border-zinc-200 hover:bg-zinc-50 cursor-pointer transition-colors">
                  {isBn ? 'বন্ধ করুন' : 'Close'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorsPage;
