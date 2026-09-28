import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerDonorApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { BANGLADESH_GEO, ALL_DISTRICTS_LOOKUP } from '../data/bangladeshGeo';

interface DonorRegisterProps {
  isBn: boolean;
  onToast: (msg: string) => void;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const DonorRegisterPage: React.FC<DonorRegisterProps> = ({ isBn, onToast }) => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    blood_group: 'O+',
    preferred_radius_km: 10,
    landmark: '',
    is_available: true,
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
  });

  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [upazila, setUpazila] = useState('');

  const availableDistricts = division && BANGLADESH_GEO[division] ? Object.keys(BANGLADESH_GEO[division].districts) : [];
  const availableUpazilas = district && ALL_DISTRICTS_LOOKUP[district] ? ALL_DISTRICTS_LOOKUP[district].district.upazilas : [];

  useEffect(() => { setDistrict(''); setUpazila(''); }, [division]);
  useEffect(() => { setUpazila(''); }, [district]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await registerDonorApi({
        blood_group: formData.blood_group,
        preferred_radius_km: Number(formData.preferred_radius_km),
        landmark: formData.landmark,
        division: division || undefined,
        district: district || undefined,
        upazila: upazila || undefined,
        is_available: formData.is_available,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password || undefined,
      });

      await refreshUser();
      onToast(isBn ? 'রক্তদাতা হিসেবে সফলভাবে নিবন্ধিত হয়েছেন!' : 'Donor profile registered successfully!');
      navigate('/donor/dashboard');
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(isBn ? 'নিবন্ধন ব্যর্থ হয়েছে। তথ্য যাচাই করুন।' : 'Failed to register as donor.');
      }
    } finally {
      setLoading(false);
    }
  };

  const SelectArrow = () => (
    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
    </svg>
  );

  return (
    <div className="min-h-screen pt-28 pb-20 px-5 max-w-2xl mx-auto">
      <div className="rounded-3xl bg-white border border-blood-100 p-8 sm:p-10 shadow-2xl shadow-red-900/10 relative overflow-hidden">
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-blood-800 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
              <path d="M12 2C12 2 5 10.5 5 15a7 7 0 0 0 14 0C19 10.5 12 2 12 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900">
              {isBn ? 'রক্তদাতা হিসেবে নিবন্ধন করুন' : 'Join as a Lifesaver Donor'}
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isBn ? 'একটি সুইচ চালু করে জীবন বাঁচানোর সুযোগ নিন' : 'Set your availability, location, and respond when ready'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            ⚠️ {error}
          </div>
        )}

        {/* Rule 3: User can only have one donor status. If already donor, website will NOT let them register again */}
        {user?.is_donor ? (
          <div className="p-6 rounded-2xl bg-amber-50 border-2 border-amber-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-2xl font-bold">
              🩸
            </div>
            <div>
              <h2 className="text-lg font-black text-amber-950">
                {isBn ? 'আপনি ইতিমধ্যে একজন রক্তদাতা!' : 'You Are Already a Registered Donor!'}
              </h2>
              <p className="text-xs text-amber-800 mt-1 max-w-md mx-auto">
                {isBn
                  ? `আপনার রক্তদাতা প্রোফাইল সক্রিয় আছে (গ্রুপ: ${user.donor_profile?.blood_group || 'Registered'})। রক্তলিংকবিডিতে একজন ব্যবহারকারী শুধুমাত্র একটি রক্তদাতা প্রোফাইল রাখতে পারেন।`
                  : `You already have an active donor profile (Group: ${user.donor_profile?.blood_group || 'Registered'}). On RoktoLinkBD, a user can only have one donor profile.`}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/donor/dashboard')}
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-600/25 transition-all"
              >
                {isBn ? 'আপনার ড্যাশবোর্ডে যান →' : 'Go to Your Dashboard →'}
              </button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {!user && (
            <div className="space-y-4 p-5 rounded-2xl bg-zinc-50 border border-zinc-200">
              <p className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                {isBn ? 'আপনার ব্যক্তিগত তথ্য' : 'Your Account Details'}
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  name="name"
                  required
                  placeholder={isBn ? 'আপনার নাম' : 'Full Name'}
                  value={formData.name}
                  onChange={handleChange}
                  className="px-4 py-2.5 rounded-xl bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder={isBn ? 'ইমেইল' : 'Email Address'}
                  value={formData.email}
                  onChange={handleChange}
                  className="px-4 py-2.5 rounded-xl bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  name="phone"
                  required
                  placeholder={isBn ? 'মোবাইল নম্বর' : 'Phone Number'}
                  value={formData.phone}
                  onChange={handleChange}
                  className="px-4 py-2.5 rounded-xl bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder={isBn ? 'পাসওয়ার্ড' : 'Password (min 6 chars)'}
                  value={formData.password}
                  onChange={handleChange}
                  className="px-4 py-2.5 rounded-xl bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                {isBn ? 'রক্তের গ্রুপ *' : 'Blood Group *'}
              </label>
              <select
                name="blood_group"
                required
                value={formData.blood_group}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-blood-100 text-base font-bold text-blood-900 focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                {isBn ? 'অ্যালার্ট ব্যাসার্ধ (কিমি)' : 'Preferred Radius (km)'}
              </label>
              <input
                type="number"
                name="preferred_radius_km"
                min={2}
                max={50}
                required
                value={formData.preferred_radius_km}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-blood-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
          </div>

          {/* Location Selection — helps find donor in Find Donors page */}
          <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">📍</span>
              <label className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                {isBn ? 'আপনার অবস্থান (রক্তদাতা খুঁজুন পাতায় দেখাবে)' : 'Your Location (shown in Find Donors search)'}
              </label>
            </div>
            <p className="text-xs text-blue-700">
              {isBn
                ? 'আপনার বিভাগ, জেলা ও উপজেলা নির্বাচন করুন যাতে রক্তদাতা খুঁজুন পাতায় আপনাকে খুঁজে পাওয়া যায়।'
                : 'Select your division, district and upazila so patients can find you on the Find Donors page.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Division */}
              <div className="relative">
                <select
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-blue-200 focus:border-red-400 focus:outline-none text-sm text-zinc-800 appearance-none bg-white transition-colors pr-8 cursor-pointer"
                >
                  <option value="">{isBn ? '— বিভাগ নির্বাচন করুন —' : '— Select Division —'}</option>
                  {Object.keys(BANGLADESH_GEO).map((d) => (
                    <option key={d} value={d}>{isBn ? BANGLADESH_GEO[d].nameBn : d}</option>
                  ))}
                </select>
                <SelectArrow />
              </div>
              {/* District */}
              <div className="relative">
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={!division}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-blue-200 focus:border-red-400 focus:outline-none text-sm text-zinc-800 appearance-none bg-white transition-colors pr-8 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <option value="">{!division ? (isBn ? '— আগে বিভাগ —' : '— Choose Division first —') : (isBn ? '— জেলা নির্বাচন —' : '— Select District —')}</option>
                  {availableDistricts.map((d) => (
                    <option key={d} value={d}>{isBn && BANGLADESH_GEO[division]?.districts[d] ? BANGLADESH_GEO[division].districts[d].nameBn : d}</option>
                  ))}
                </select>
                <SelectArrow />
              </div>
              {/* Upazila */}
              <div className="relative">
                <select
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  disabled={!district}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-blue-200 focus:border-red-400 focus:outline-none text-sm text-zinc-800 appearance-none bg-white transition-colors pr-8 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <option value="">{!district ? (isBn ? '— আগে জেলা —' : '— Choose District first —') : (isBn ? '— সকল উপজেলা —' : '— All Upazilas —')}</option>
                  {availableUpazilas.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <SelectArrow />
              </div>
            </div>
            {(division || district || upazila) && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-xs text-blue-700 font-medium">📌</span>
                {division && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">{division}</span>}
                {district && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">{district}</span>}
                {upazila && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">{upazila}</span>}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              {isBn ? 'আপনার বর্তমান এলাকা / ল্যান্ডমার্ক' : 'Current Area / Landmark'}
            </label>
            <input
              type="text"
              name="landmark"
              value={formData.landmark}
              onChange={handleChange}
              placeholder="e.g. Mirpur 10, Dhaka or GEC Circle, Chattogram"
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-blood-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-zinc-800">
                {isBn ? 'এখনই রক্তদানে প্রস্তুত (সক্রিয়)' : 'Available to Donate Immediately'}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {isBn ? 'কাছাকাছি জরুরি রক্তের অনুরোধ আসলে অ্যালার্ট পাবেন' : 'You can toggle off anytime from dashboard'}
              </p>
            </div>
            <input
              type="checkbox"
              name="is_available"
              checked={formData.is_available}
              onChange={handleChange}
              className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl disabled:opacity-60 cursor-pointer"
          >
            {loading && <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
            <span>{isBn ? 'দাতা প্রোফাইল সংরক্ষণ করুন' : 'Complete Donor Registration'}</span>
          </button>
        </form>
        )}
      </div>
    </div>
  );
};

export default DonorRegisterPage;
