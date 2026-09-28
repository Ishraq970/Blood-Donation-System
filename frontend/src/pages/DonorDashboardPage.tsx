import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BANGLADESH_GEO, ALL_DISTRICTS_LOOKUP } from '../data/bangladeshGeo';
import {
  toggleDonorAvailabilityApi,
  fetchPendingMatchesApi,
  respondToMatchApi,
  updateMatchStatusApi,
  fetchMyBloodRequestsApi,
  updateDonorLocationApi,
  type PendingMatchItem,
  type UserBloodRequestItem,
} from '../api';

interface DonorDashboardProps {
  isBn: boolean;
  onToast: (msg: string) => void;
}

const DonorDashboardPage: React.FC<DonorDashboardProps> = ({ isBn, onToast }) => {
  const { user, refreshUser } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true);
  const [radius, setRadius] = useState(15);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<PendingMatchItem[]>([]);
  const [myRequests, setMyRequests] = useState<UserBloodRequestItem[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Location state
  const [locDivision, setLocDivision] = useState('');
  const [locDistrict, setLocDistrict] = useState('');
  const [locUpazila, setLocUpazila] = useState('');
  const [locLandmark, setLocLandmark] = useState('');
  const [locLoading, setLocLoading] = useState(false);
  const [locSuccess, setLocSuccess] = useState(false);

  const availableLocDistricts = locDivision && BANGLADESH_GEO[locDivision] ? Object.keys(BANGLADESH_GEO[locDivision].districts) : [];
  const availableLocUpazilas = locDistrict && ALL_DISTRICTS_LOOKUP[locDistrict] ? ALL_DISTRICTS_LOOKUP[locDistrict].district.upazilas : [];

  const donorProfile = user?.donor_profile;
  const isDonor = Boolean(user?.is_donor && donorProfile);

  // 90-day cooldown calculation (Rule 4)
  let isCooldown = false;
  let cooldownDaysLeft = 0;
  let eligibleDateStr = '';

  if (donorProfile?.last_donation_at) {
    const lastDate = new Date(donorProfile.last_donation_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 90) {
      isCooldown = true;
      cooldownDaysLeft = 90 - diffDays;
      const eligibleDate = new Date(lastDate.getTime() + 90 * 24 * 60 * 60 * 1000);
      eligibleDateStr = eligibleDate.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  }

  // Load matches (only if donor and not in cooldown)
  const loadMatches = async () => {
    if (!isDonor || isCooldown) {
      setMatches([]);
      return;
    }
    try {
      const data = await fetchPendingMatchesApi();
      setMatches(data);
    } catch {
      // Non-blocking
    }
  };

  // Load user's blood requests (Rule 2)
  const loadMyRequests = async () => {
    try {
      setLoadingRequests(true);
      const data = await fetchMyBloodRequestsApi();
      setMyRequests(data);
    } catch {
      // Non-blocking
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    refreshUser();
    loadMyRequests();
  }, []);

  useEffect(() => {
    if (donorProfile) {
      setIsAvailable(donorProfile.is_available ?? true);
      setRadius(donorProfile.preferred_radius_km ?? 15);
      // Pre-fill location from donor profile
      setLocDivision(donorProfile.division || '');
      setLocDistrict(donorProfile.district || '');
      setLocUpazila(donorProfile.upazila || '');
      setLocLandmark(donorProfile.landmark || '');
    }
    loadMatches();
    const interval = setInterval(loadMatches, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleToggle = async () => {
    if (isCooldown) {
      onToast(
        isBn
          ? `বিশ্রামকালীন সময়: আপনি সম্প্রতি রক্তদান করেছেন। আরও ${cooldownDaysLeft} দিন পর সক্রিয় হতে পারবেন।`
          : `Recovery period: You donated recently. You cannot give blood for ${cooldownDaysLeft} more days.`
      );
      return;
    }

    const next = !isAvailable;
    setIsAvailable(next);
    setLoading(true);

    try {
      await toggleDonorAvailabilityApi(next, radius);
      onToast(
        next
          ? isBn
            ? 'আপনি এখন সক্রিয় রক্তদাতা — জরুরি অ্যালার্ট পাবেন!'
            : 'Availability turned ON — you will receive local alerts!'
          : isBn
          ? 'সক্রিয়তা বন্ধ করা হয়েছে। বিশ্রাম নিন।'
          : 'Availability turned OFF. Rest well.'
      );
      await refreshUser();
    } catch (err: any) {
      setIsAvailable(!next);
      onToast(err.response?.data?.message || (isBn ? 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।' : 'Failed to update availability.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setRadius(val);
  };

  const handleLocationSave = async () => {
    setLocLoading(true);
    setLocSuccess(false);
    try {
      await updateDonorLocationApi({
        division: locDivision || undefined,
        district: locDistrict || undefined,
        upazila: locUpazila || undefined,
        landmark: locLandmark || undefined,
      });
      setLocSuccess(true);
      await refreshUser();
      onToast(isBn ? 'আপনার রক্তদাতার অবস্থান সফলভাবে সংরক্ষিত হয়েছে!' : 'Donor location updated successfully!');
      setTimeout(() => setLocSuccess(false), 3000);
    } catch (err: any) {
      onToast(err.response?.data?.message || (isBn ? 'অবস্থান সংরক্ষণ ব্যর্থ হয়েছে।' : 'Failed to update location.'));
    } finally {
      setLocLoading(false);
    }
  };

  const handleRespond = async (matchId: number, response: 'ACCEPTED' | 'DECLINED') => {
    if (isCooldown && response === 'ACCEPTED') {
      onToast(
        isBn
          ? `মেডিকেল বিধিনিষেধ: আপনি ৯০ দিনের বিশ্রামকালীন সময়ে আছেন (${cooldownDaysLeft} দিন বাকি)। রক্তদান করতে পারবেন না।`
          : `Medical restriction: You are within the 90-day recovery cooldown (${cooldownDaysLeft} days remaining). You cannot donate blood.`
      );
      return;
    }

    setActionLoading(matchId);
    try {
      await respondToMatchApi(matchId, response);
      onToast(
        response === 'ACCEPTED'
          ? isBn
            ? 'ধন্যবাদ! আপনি সম্মতি দিয়েছেন। রোগীর যোগাযোগের তথ্য আনলক করা হয়েছে।'
            : 'Accepted! Requester contact details & coordination chat unlocked.'
          : isBn
          ? 'আপনার প্রতিক্রিয়া সংরক্ষিত হয়েছে।'
          : 'Response recorded.'
      );
      await loadMatches();
    } catch (err: any) {
      onToast(err.response?.data?.message || (isBn ? 'প্রতিক্রিয়া পাঠাতে ব্যর্থ হয়েছে।' : 'Failed to record response.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleStepperUpdate = async (matchId: number, status: 'DONOR_TRAVELLING' | 'DONOR_ARRIVED' | 'DONATION_COMPLETED') => {
    setActionLoading(matchId);
    try {
      await updateMatchStatusApi(matchId, status);
      const statusLabels = {
        DONOR_TRAVELLING: isBn ? 'অবস্থা: রওনা হয়েছেন' : 'Status: On the Way',
        DONOR_ARRIVED: isBn ? 'অবস্থা: হাসপাতালে পৌঁছেছেন' : 'Status: Arrived at Facility',
        DONATION_COMPLETED: isBn ? 'অভিনন্দন! রক্তদান সম্পন্ন হয়েছে (৯০ দিনের বিশ্রাম গণনা শুরু)।' : 'Donation confirmed! 90-day cooldown initiated.',
      };
      onToast(statusLabels[status]);
      await refreshUser();
      await loadMatches();
    } catch {
      onToast(isBn ? 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে।' : 'Failed to update travel status.');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingMatches = matches.filter((m) => m.response_status === 'PENDING');
  const activeCases = matches.filter((m) => m.response_status === 'ACCEPTED');

  return (
    <div className="min-h-screen pt-28 pb-20 px-5 max-w-6xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-red-600 via-rose-700 to-blood-900 text-white shadow-xl shadow-red-900/15">
        <div>
          <span className="text-xs font-black tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full text-white inline-block mb-2">
            {isBn ? 'ব্যক্তিগত ড্যাশবোর্ড ও নিয়ন্ত্রণ কেন্দ্র' : 'Personal Command Dashboard'}
          </span>
          <h1 className="text-3xl font-black tracking-tight">
            {isBn ? 'স্বাগতম' : 'Welcome back'}, {user?.name || 'Citizen'}!
          </h1>
          <p className="text-xs text-red-100 mt-1 max-w-xl">
            {isBn
              ? 'আপনার রক্তের অনুরোধ তৈরি ও পরিচালনা করুন এবং রক্তদাতা স্ট্যাটাস নিয়ন্ত্রণ করুন।'
              : 'Create and monitor emergency blood requests, manage donor eligibility, and view coordination cases.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Action: Create Blood Request (Rule 2) */}
          <Link
            to="/requests/create"
            className="px-5 py-3 rounded-2xl bg-white text-red-700 hover:bg-red-50 font-black text-xs shadow-lg transition-all flex items-center gap-2"
          >
            <span>🩸</span>
            <span>{isBn ? '+ রক্তের অনুরোধ করুন (I Need Blood)' : '+ I Need Blood Request'}</span>
          </Link>

          <Link
            to="/requests"
            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5"
          >
            <span>{isBn ? 'সকল অনুরোধ দেখুন' : 'Browse Requests'}</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* SECTION 1: DONOR STATUS CARD (Rule 3 & Rule 4) */}
      <div className="rounded-3xl bg-white border border-blood-100 p-6 sm:p-8 shadow-xl shadow-red-900/5 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-xl font-bold">
              🩸
            </div>
            <div>
              <h2 className="text-lg font-black text-zinc-900">
                {isBn ? 'রক্তদাতা স্ট্যাটাস (Donor Status)' : 'Donor Status & Readiness'}
              </h2>
              <p className="text-xs text-zinc-500">
                {isBn
                  ? 'আপনার রক্তদাতা নিবন্ধন ও জরুরি রক্তদানের সক্ষমতা'
                  : 'Your donor profile eligibility and availability controls'}
              </p>
            </div>
          </div>

          {/* Donor Status Badge */}
          {!isDonor ? (
            <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-zinc-100 text-zinc-600 border border-zinc-200">
              ❌ {isBn ? 'নিবন্ধিত রক্তদাতা নন' : 'Not a Registered Donor'}
            </span>
          ) : isCooldown ? (
            <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5 animate-pulse">
              <span>⏸️</span>
              <span>
                {isBn
                  ? `৯০ দিনের বিশ্রামকালীন নিষ্ক্রিয় (${cooldownDaysLeft} দিন বাকি)`
                  : `Inactive donor till 90 days (${cooldownDaysLeft} days remaining)`}
              </span>
            </span>
          ) : isAvailable ? (
            <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-1" />
              {isBn ? 'সক্রিয় দাতা — রক্তদানে সক্ষম' : 'Active Donor — Eligible to Donate'}
            </span>
          ) : (
            <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-zinc-100 text-zinc-700 border border-zinc-300">
              💤 {isBn ? 'অফলাইন (সাময়িক বিশ্রাম)' : 'Offline (Paused)'}
            </span>
          )}
        </div>

        {/* Condition A: User is NOT a donor (Rule 3) */}
        {!isDonor ? (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/50 border-2 border-amber-200/80 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-base font-extrabold text-amber-950">
                {isBn
                  ? 'ব্যবহারকারী এখনও রক্তদাতা হিসেবে নিবন্ধিত নন। আপনি কি রক্তদাতা হতে চান?'
                  : 'The user is not a donor. Do you want to become a donor?'}
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed max-w-2xl">
                {isBn
                  ? 'রক্তদাতা হিসেবে যোগদান করলে আপনি আপনার রক্তের গ্রুপ ও ব্যাসার্ধ নির্ধারণ করতে পারবেন। আপনার এলাকায় জরুরি রক্তের প্রয়োজন হলে স্বয়ংক্রিয় ম্যাচিং নোটিফিকেশন পাবেন। একজন ব্যবহারকারী শুধুমাত্র একটি রক্তদাতা স্ট্যাটাস ধারণ করতে পারেন।'
                  : 'By joining as a voluntary donor, you can set your blood group, preferred radius, and save lives in emergency crises. Each user is protected by our privacy-first matching engine and single donor status rule.'}
              </p>
            </div>

            <Link
              to="/donor/register"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-blood-800 hover:from-red-700 hover:to-blood-900 text-white font-extrabold text-sm shadow-xl shadow-red-700/25 transition-all shrink-0 flex items-center gap-2"
            >
              <span>🩸</span>
              <span>{isBn ? 'রক্তদাতা হোন (Become a Donor) →' : 'Become a Donor →'}</span>
            </Link>
          </div>
        ) : (
          /* Condition B: User IS a donor */
          <div className="space-y-6">
            {/* If within 90-day cooldown (Rule 4) */}
            {isCooldown && (
              <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-3">
                <div className="flex items-center gap-2.5 text-amber-900 font-extrabold text-sm">
                  <span className="text-xl">⚠️</span>
                  <span>
                    {isBn
                      ? `চিকিৎসা নিরাপত্তা নিয়ম: সম্প্রতি রক্তদান করায় আপনার প্রোফাইল ৯০ দিনের জন্য নিষ্ক্রিয় রয়েছে।`
                      : `Medical Safety Rule: Inactive donor till 90 days. You cannot give blood during recovery.`}
                  </span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {isBn
                    ? `আপনি সর্বশেষ ${donorProfile?.last_donation_formatted || 'সম্প্রতি'} রক্তদান করেছেন। আপনার শরীরের রক্তকণিকা পুনরায় গঠনের জন্য চিকিৎসাবিজ্ঞান অনুযায়ী বাধ্যতামূলক ৯০ দিনের বিশ্রাম প্রয়োজন। আরও ${cooldownDaysLeft} দিন বাকি (${eligibleDateStr} পর্যন্ত)। এই সময়ে ম্যাচিং ইঞ্জিন আপনাকে রক্তদানের জন্য অন্তর্ভুক্ত করবে না।`
                    : `You completed a donation on ${donorProfile?.last_donation_formatted || 'recently'}. Per international medical guidelines, your body requires 90 days to safely regenerate red blood cells. You have ${cooldownDaysLeft} days remaining (eligible on ${eligibleDateStr}). You cannot give blood until this recovery period completes.`}
                </p>
              </div>
            )}

            {/* Donor Metrics & Availability Controls */}
            <div className="grid md:grid-cols-3 gap-5">
              {/* Donor Profile Summary */}
              <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                  {isBn ? 'রক্তদাতার তথ্য' : 'Donor Credentials'}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-red-600/20">
                    {donorProfile?.blood_group || 'O+'}
                  </div>
                  <div>
                    <p className="font-mono text-xs font-bold text-zinc-700">{donorProfile?.public_donor_code}</p>
                    <p className="text-[11px] text-zinc-500 font-medium">
                      {isBn ? 'কভারেজ ব্যাসার্ধ: ' : 'Coverage Radius: '} {radius} km
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-200/60 text-xs text-zinc-600">
                  <span className="font-bold">{isBn ? 'সর্বশেষ রক্তদান: ' : 'Last Donation: '}</span>
                  {donorProfile?.last_donation_formatted || (isBn ? 'এখনও রক্তদান করেননি' : 'No records yet')}
                </div>
              </div>

              {/* Availability Switch */}
              <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                    {isBn ? 'জরুরি সাড়া সক্রিয়তা' : 'Live Alert Readiness'}
                  </span>
                  <p className="text-xs font-bold text-zinc-800 mt-1">
                    {isCooldown
                      ? (isBn ? 'বিশ্রামকালীন সময় বন্ধ রয়েছে' : 'Locked during 90-day cooldown')
                      : isAvailable
                      ? (isBn ? 'জরুরি অ্যালার্ট গ্রহণ সক্রিয়' : 'Ready for emergency alerts')
                      : (isBn ? 'অ্যালার্ট বন্ধ রয়েছে' : 'Alerts paused')}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {isCooldown
                      ? (isBn ? '৯০ দিন শেষ না হওয়া পর্যন্ত অন করা যাবে না।' : 'Cannot donate until recovery completes.')
                      : (isBn ? 'আপনার এলাকায় রক্তের প্রয়োজন হলে অ্যালার্ট পাবেন।' : 'Turn OFF when resting or traveling.')}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-bold text-zinc-600">
                    {isAvailable && !isCooldown ? '🟢 Online' : '⚪ Offline'}
                  </span>
                  <button
                    onClick={isCooldown || loading ? undefined : handleToggle}
                    disabled={isCooldown || loading}
                    className={`w-14 h-8 rounded-full p-1 transition-colors flex items-center ${
                      isCooldown
                        ? 'bg-zinc-200 cursor-not-allowed opacity-50 justify-start'
                        : isAvailable
                        ? 'bg-red-600 justify-end cursor-pointer'
                        : 'bg-zinc-300 justify-start cursor-pointer'
                    }`}
                    title={isCooldown ? 'Disabled during 90-day cooldown' : 'Toggle availability'}
                  >
                    <span className="w-6 h-6 rounded-full bg-white shadow-md block" />
                  </button>
                </div>
              </div>

              {/* Radius Control */}
              <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-600 font-bold">{isBn ? 'অ্যালার্টের দূরত্ব' : 'Alert Radius'}</span>
                  <span className="font-extrabold text-red-600 font-mono">{radius} km</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={35}
                  value={radius}
                  onChange={handleRadiusChange}
                  disabled={isCooldown}
                  className="w-full accent-red-600 cursor-pointer disabled:opacity-40"
                />
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>2 km (Local)</span>
                  <span>15 km (City)</span>
                  <span>35 km (Regional)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 1.5: DONOR LOCATION MANAGEMENT (only shown if user is a donor) */}
      {isDonor && (
        <div className="rounded-3xl bg-white border border-blue-100 p-6 sm:p-8 shadow-xl shadow-blue-900/5 space-y-5">
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
              📍
            </div>
            <div>
              <h2 className="text-lg font-black text-zinc-900">
                {isBn ? 'আপনার অবস্থান পরিবর্তন করুন' : 'Update Your Donor Location'}
              </h2>
              <p className="text-xs text-zinc-500">
                {isBn
                  ? 'এই অবস্থান রক্তদাতা খুঁজুন পাতায় আপনাকে সঠিক স্থানে দেখাবে। যেকোনো সময় পরিবর্তন করা যাবে।'
                  : 'This location is used in the Find Donors page to help patients find you. You can change it anytime.'}
              </p>
            </div>
          </div>

          {/* Current Location Display */}
          {(donorProfile?.division || donorProfile?.district || donorProfile?.upazila) && (
            <div className="flex items-center gap-2 flex-wrap px-4 py-3 rounded-xl bg-blue-50 border border-blue-100">
              <span className="text-xs text-blue-700 font-semibold">{isBn ? 'বর্তমান অবস্থান:' : 'Current location:'}</span>
              {donorProfile.division && <span className="text-xs bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full font-medium">{donorProfile.division}</span>}
              {donorProfile.district && <span className="text-xs bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full font-medium">{donorProfile.district}</span>}
              {donorProfile.upazila && <span className="text-xs bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full font-medium">{donorProfile.upazila}</span>}
              {donorProfile.landmark && <span className="text-xs text-blue-600 ml-1">· {donorProfile.landmark}</span>}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Division */}
            <div className="relative">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{isBn ? 'বিভাগ' : 'Division'}</label>
              <select
                value={locDivision}
                onChange={(e) => { setLocDivision(e.target.value); setLocDistrict(''); setLocUpazila(''); }}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-zinc-200 focus:border-blue-400 focus:outline-none text-sm text-zinc-800 appearance-none bg-white pr-8 cursor-pointer"
              >
                <option value="">{isBn ? '— বিভাগ নির্বাচন —' : '— Select Division —'}</option>
                {Object.keys(BANGLADESH_GEO).map((d) => (
                  <option key={d} value={d}>{isBn ? BANGLADESH_GEO[d].nameBn : d}</option>
                ))}
              </select>
              <svg className="absolute right-3 bottom-3 w-4 h-4 text-zinc-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M19 9l-7 7-7-7" /></svg>
            </div>

            {/* District */}
            <div className="relative">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{isBn ? 'জেলা' : 'District'}</label>
              <select
                value={locDistrict}
                onChange={(e) => { setLocDistrict(e.target.value); setLocUpazila(''); }}
                disabled={!locDivision}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-zinc-200 focus:border-blue-400 focus:outline-none text-sm text-zinc-800 appearance-none bg-white pr-8 disabled:opacity-50 cursor-pointer"
              >
                <option value="">{!locDivision ? (isBn ? '— আগে বিভাগ —' : '— Choose Division —') : (isBn ? '— জেলা নির্বাচন —' : '— Select District —')}</option>
                {availableLocDistricts.map((d) => (
                  <option key={d} value={d}>{isBn && BANGLADESH_GEO[locDivision]?.districts[d] ? BANGLADESH_GEO[locDivision].districts[d].nameBn : d}</option>
                ))}
              </select>
              <svg className="absolute right-3 bottom-3 w-4 h-4 text-zinc-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M19 9l-7 7-7-7" /></svg>
            </div>

            {/* Upazila */}
            <div className="relative">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{isBn ? 'উপজেলা' : 'Upazila'}</label>
              <select
                value={locUpazila}
                onChange={(e) => setLocUpazila(e.target.value)}
                disabled={!locDistrict}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-zinc-200 focus:border-blue-400 focus:outline-none text-sm text-zinc-800 appearance-none bg-white pr-8 disabled:opacity-50 cursor-pointer"
              >
                <option value="">{!locDistrict ? (isBn ? '— আগে জেলা —' : '— Choose District —') : (isBn ? '— সকল উপজেলা —' : '— All Upazilas —')}</option>
                {availableLocUpazilas.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <svg className="absolute right-3 bottom-3 w-4 h-4 text-zinc-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{isBn ? 'ল্যান্ডমার্ক / এলাকা' : 'Landmark / Area'}</label>
              <input
                type="text"
                value={locLandmark}
                onChange={(e) => setLocLandmark(e.target.value)}
                placeholder={isBn ? 'যেমন: মিরপুর ১০, ঢাকা' : 'e.g. Mirpur 10, Dhaka'}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-zinc-200 focus:border-blue-400 focus:outline-none text-sm text-zinc-800"
              />
            </div>
            <button
              onClick={handleLocationSave}
              disabled={locLoading}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm text-white flex items-center gap-2 transition-all cursor-pointer ${
                locSuccess ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'
              } disabled:opacity-60`}
            >
              {locLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {locSuccess ? '✓ ' : ''}{isBn ? 'সংরক্ষণ করুন' : 'Save Location'}
            </button>
          </div>
        </div>
      )}

      {/* SECTION 2: MY BLOOD REQUESTS ("I Need Blood" Records - Rule 2) */}
      <div className="rounded-3xl bg-white border border-blood-100 p-6 sm:p-8 shadow-xl shadow-red-900/5 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-red-700 flex items-center justify-center text-xl font-bold">
              📋
            </div>
            <div>
              <h2 className="text-lg font-black text-zinc-900">
                {isBn ? 'আমার রক্তের অনুরোধসমূহ (I Need Blood Requests)' : 'My Blood Requests (I Need Blood Records)'}
              </h2>
              <p className="text-xs text-zinc-500">
                {isBn
                  ? 'আপনার তৈরি করা সকল রক্তের অনুরোধের তালিকা। আপনি প্রয়োজনমতো একাধিক অনুরোধ করতে পারেন।'
                  : 'Complete history of all blood requests created by you. You can create multiple requests as needed.'}
              </p>
            </div>
          </div>

          {/* "+ I Need Blood" Button (Rule 2) */}
          <Link
            to="/requests/create"
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all flex items-center gap-1.5"
          >
            <span>+</span>
            <span>{isBn ? 'নতুন রক্তের অনুরোধ করুন' : '+ Create New Blood Request'}</span>
          </Link>
        </div>

        {/* Requests List */}
        {loadingRequests ? (
          <div className="py-12 text-center text-zinc-400 text-xs">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>{isBn ? 'অনুরোধগুলো লোড হচ্ছে…' : 'Loading your requests…'}</span>
          </div>
        ) : myRequests.length === 0 ? (
          <div className="p-8 rounded-2xl bg-zinc-50 border border-zinc-200 text-center space-y-3">
            <p className="text-sm font-bold text-zinc-700">
              {isBn ? 'আপনি এখনও কোনো রক্তের অনুরোধ করেননি।' : 'You have not created any blood requests yet.'}
            </p>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              {isBn
                ? 'পরিবারের বা কারো রক্তের প্রয়োজন হলে "+ রক্তের অনুরোধ করুন" বাটনে ক্লিক করে দ্রুত কাছাকাছি রক্তদাতাদের অ্যালার্ট পাঠান।'
                : 'When an emergency occurs, click "+ Create New Blood Request" to dispatch matching alerts to local donors.'}
            </p>
            <Link
              to="/requests/create"
              className="inline-block px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors"
            >
              {isBn ? 'রক্তের অনুরোধ করুন (I Need Blood)' : 'I Need Blood Now'}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myRequests.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-2xl bg-white border border-zinc-200 hover:border-red-300 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-sm">
                    {req.blood_group}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-zinc-400">{req.code}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700">
                        {req.component} • {req.units} Bag(s)
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === 'FULFILLED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'SEARCHING' || req.status === 'DONORS_NOTIFIED'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-zinc-900">{req.hospital}</h4>
                    <p className="text-xs text-zinc-500">
                      {req.patient_name ? `${req.patient_name} • ` : ''}{req.address} • {req.time_ago}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    to={`/requests/${req.id}`}
                    className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs transition-colors"
                  >
                    {isBn ? 'বিস্তারিত ও চ্যাট দেখুন →' : 'View Details & Chat →'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: ACTIVE EMERGENCY CASES (For Eligible Donors) */}
      {isDonor && !isCooldown && activeCases.length > 0 && (
        <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-200 p-6 sm:p-8 shadow-xl shadow-emerald-950/5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="text-lg font-black text-emerald-950">
                {isBn ? '🤝 আপনার গৃহীত জরুরি কেস (Active Coordination)' : '🤝 Your Active Emergency Cases'}
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
              {activeCases.length} {isBn ? 'টি কেস চলমান' : 'Active'}
            </span>
          </div>

          <div className="space-y-4">
            {activeCases.map((c) => (
              <div
                key={c.match_id}
                className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-zinc-400 block">{c.request_code}</span>
                    <h3 className="text-base font-extrabold text-zinc-900">{c.facility_name}</h3>
                    <p className="text-xs text-zinc-500">{c.address_text || 'Hospital Location'}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-700">
                      {c.blood_group} • {c.units_required} Bag(s)
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      {c.urgency}
                    </span>
                  </div>
                </div>

                {/* Controlled Contact Sharing */}
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                      {isBn ? 'রোগী / আবেদনকারীর যোগাযোগের তথ্য (আনলকড)' : 'Requester Contact (Unlocked)'}
                    </span>
                    <p className="font-extrabold text-sm text-zinc-900">{c.requester_name}</p>
                    <p className="text-xs text-zinc-600 font-mono font-bold">{c.requester_phone || 'Phone verified'}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {c.requester_phone && (
                      <a
                        href={`tel:${c.requester_phone}`}
                        className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.01L6.6 10.8z" />
                        </svg>
                        <span>{isBn ? 'সরাসরি কল দিন' : 'Call Requester'}</span>
                      </a>
                    )}

                    <Link
                      to={`/requests/${c.request_id}`}
                      className="py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <span>💬 {isBn ? 'সমন্বয় চ্যাট' : 'Case Chat'}</span>
                    </Link>
                  </div>
                </div>

                {/* Donor Travel Stepper */}
                <div className="pt-2 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-bold text-zinc-600">
                    {isBn ? 'আপনার যাত্রার অগ্রগতি আপডেট করুন:' : 'Update Your Travel Status:'}
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleStepperUpdate(c.match_id, 'DONOR_TRAVELLING')}
                      disabled={actionLoading === c.match_id}
                      className="py-1.5 px-3 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition-colors cursor-pointer"
                    >
                      🚗 {isBn ? 'রওনা হয়েছি' : 'On the Way'}
                    </button>
                    <button
                      onClick={() => handleStepperUpdate(c.match_id, 'DONOR_ARRIVED')}
                      disabled={actionLoading === c.match_id}
                      className="py-1.5 px-3 rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs transition-colors cursor-pointer"
                    >
                      🏥 {isBn ? 'হাসপাতালে পৌঁছেছি' : 'Arrived at Facility'}
                    </button>
                    <button
                      onClick={() => handleStepperUpdate(c.match_id, 'DONATION_COMPLETED')}
                      disabled={actionLoading === c.match_id}
                      className="py-1.5 px-3 rounded-lg border border-emerald-400 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      ✅ {isBn ? 'রক্তদান সম্পন্ন' : 'Donation Completed'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: PENDING EMERGENCY ALERTS */}
      {isDonor && !isCooldown && pendingMatches.length > 0 && (
        <div className="rounded-3xl bg-gradient-to-br from-red-50 to-rose-50/50 border border-red-200 p-6 sm:p-8 shadow-xl shadow-red-950/5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-red-600 animate-ping" />
              <h2 className="text-lg font-black text-red-950">
                {isBn ? '🚨 নিকটস্থ রক্তের জরুরি অনুরোধ (Emergency Alerts)' : '🚨 Nearby Blood Emergency Alerts'}
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white">
              {pendingMatches.length} {isBn ? 'টি নতুন অনুরোধ' : 'New Match'}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {pendingMatches.map((m) => (
              <div
                key={m.match_id}
                className="bg-white rounded-2xl border border-red-100 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-red-300 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-zinc-400">{m.request_code}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-red-100 text-red-700">
                      {m.distance_km} km {isBn ? 'দূরে' : 'away'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white font-black text-xl flex items-center justify-center shrink-0">
                      {m.blood_group}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-zinc-900 leading-snug">{m.facility_name}</h4>
                      <p className="text-xs text-zinc-500">{m.units_required} Bag(s) • {m.urgency}</p>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-600 italic">
                    🔒 {isBn ? 'সম্মতি দিলে আবেদনকারীর সাথে সরাসরি যোগাযোগ ও কল সুবিধা চালু হবে।' : 'Accepting unlocks mutual phone exchange and direct coordination chat.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100">
                  <button
                    onClick={() => handleRespond(m.match_id, 'DECLINED')}
                    disabled={actionLoading === m.match_id}
                    className="py-2 px-3 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 font-bold text-xs transition-colors cursor-pointer"
                  >
                    {isBn ? 'অসমর্থ' : 'Not Available'}
                  </button>
                  <button
                    onClick={() => handleRespond(m.match_id, 'ACCEPTED')}
                    disabled={actionLoading === m.match_id}
                    className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>❤️</span>
                    <span>{isBn ? 'আমি রক্ত দেব' : 'YES, I CAN HELP'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: VOLUNTEER STATUS CARD (Rule 1, 5, 6) */}
      <div className="rounded-3xl bg-zinc-50 border border-zinc-200 p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-zinc-200 text-zinc-700 flex items-center justify-center text-2xl">
            {user?.is_admin ? '🛡️' : '🤝'}
          </div>
          <div>
            <h3 className="font-extrabold text-zinc-900 text-sm">
              {user?.is_admin
                ? (isBn ? 'অ্যাডমিন অ্যাকাউন্ট' : 'Administrator Role')
                : user?.is_volunteer
                ? (isBn ? 'যাচাইকৃত স্বেচ্ছাসেবক সমন্বয়কারী' : 'Verified Volunteer Coordinator')
                : (isBn ? 'স্বেচ্ছাসেবক হিসেবে সাহায্য করতে চান?' : 'Want to Coordinate Emergency Cases?')}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {user?.is_admin
                ? (isBn ? 'নীতিমালা অনুযায়ী অ্যাডমিনগণ ভলান্টিয়ার হতে পারবেন না।' : 'Administrators oversee governance and cannot register as volunteers.')
                : user?.is_volunteer
                ? (isBn ? `স্ট্যাটাস: ${user.volunteer_profile?.verification_status || 'APPROVED'}` : `Status: ${user?.volunteer_profile?.verification_status || 'APPROVED'}`)
                : (isBn ? 'শুধুমাত্র নিবন্ধিত ব্যবহারকারীগণ স্বেচ্ছাসেবক হিসেবে আবেদন করতে পারেন।' : 'Only registered users can become volunteers. Help guide families in need.')}
            </p>
          </div>
        </div>

        {user?.is_admin ? (
          <Link
            to="/admin/volunteers"
            className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs transition-colors shrink-0 shadow-xs"
          >
            {isBn ? 'অ্যাডমিন প্যানেল →' : 'Admin Panel →'}
          </Link>
        ) : user?.is_volunteer ? (
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
            ✅ {user.volunteer_profile?.verification_status || 'Active'}
          </span>
        ) : (
          <Link
            to="/volunteer/apply"
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-900 text-white font-bold text-xs transition-colors shrink-0"
          >
            {isBn ? 'ভলান্টিয়ার আবেদন করুন →' : 'Apply as Volunteer →'}
          </Link>
        )}
      </div>
    </div>
  );
};

export default DonorDashboardPage;
