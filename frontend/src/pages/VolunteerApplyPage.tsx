import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applyVolunteerApi } from '../api';
import { useAuth } from '../context/AuthContext';

interface VolunteerApplyProps {
  isBn: boolean;
  onToast: (msg: string) => void;
}

const VolunteerApplyPage: React.FC<VolunteerApplyProps> = ({ isBn, onToast }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    nid_number: '',
    organization: '',
    district: 'Dhaka',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await applyVolunteerApi(formData);
      onToast(
        isBn
          ? 'স্বেচ্ছাসেবক আবেদন অনুমোদিত হয়েছে! আপনাকে স্বাগত।'
          : 'Volunteer application approved! Welcome to the coordination team.'
      );
      navigate('/');
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(isBn ? 'আবেদন ব্যর্থ হয়েছে।' : 'Failed to submit application.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-5 max-w-2xl mx-auto">
      <div className="rounded-3xl bg-white border border-blood-100 p-8 sm:p-10 shadow-2xl shadow-red-900/10 relative overflow-hidden">
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-blood-800 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
              <path d="M12 21s-7.5-4.7-10-9.3C.3 8.4 2.4 5 5.8 5c2 0 3.4 1 4.2 2.4C10.8 6 12.2 5 14.2 5c3.4 0 5.5 3.4 3.8 6.7C19.5 16.3 12 21 12 21z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900">
              {isBn ? 'যাচাইকৃত স্বেচ্ছাসেবক আবেদন' : 'Apply as a Verified Volunteer'}
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isBn
                ? 'সংকট মুহূর্তে রোগী ও রক্তদাতার মধ্যে সরাসরি সমন্বয়কারী হিসেবে কাজ করুন'
                : 'Coordinate critical blood emergencies, guide families, and verify donations'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            ⚠️ {error}
          </div>
        )}

        {/* Rule 1 & 6: Must be a logged in user first */}
        {!user ? (
          <div className="p-8 rounded-2xl bg-amber-50 border-2 border-amber-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-2xl font-bold">
              👤
            </div>
            <div>
              <h2 className="text-lg font-black text-amber-950">
                {isBn ? 'স্বেচ্ছাসেবক হতে হলে প্রথমে ইউজার হতে হবে' : 'Must Be a Registered User First'}
              </h2>
              <p className="text-xs text-amber-800 mt-1 max-w-md mx-auto">
                {isBn
                  ? 'কেবলমাত্র নিবন্ধিত ব্যবহারকারীরাই স্বেচ্ছাসেবক হিসেবে আবেদন করতে পারেন। অনুগ্রহ করে প্রথমে লগইন করুন অথবা নতুন অ্যাকাউন্ট তৈরি করুন।'
                  : 'Only registered users can apply as volunteers. Please log in to your account or create a new user account first.'}
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                {isBn ? 'লগইন করুন →' : 'Log In →'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="px-6 py-2.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                {isBn ? 'নতুন অ্যাকাউন্ট খুলুন' : 'Create an Account'}
              </button>
            </div>
          </div>
        ) : user?.is_admin ? (
          <div className="p-6 rounded-2xl bg-red-50 border-2 border-red-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-2xl font-bold">
              🛡️
            </div>
            <div>
              <h2 className="text-lg font-black text-red-950">
                {isBn ? 'অ্যাডমিন অ্যাকাউন্ট ভলান্টিয়ার হতে পারবেন না' : 'Administrators Cannot Become Volunteers'}
              </h2>
              <p className="text-xs text-red-700 mt-1 max-w-md mx-auto">
                {isBn
                  ? 'প্ল্যাটফর্মের নীতিমালা অনুযায়ী অ্যাডমিনিস্ট্রেটরগণ ভলান্টিয়ার অনুমোদন ও তত্ত্বাবধান করেন, তাই অ্যাডমিন অ্যাকাউন্ট থেকে ভলান্টিয়ার আবেদন করা যাবে না।'
                  : 'Platform governance policy: Administrators review volunteer applications and oversee system moderation. Volunteer coordination is strictly reserved for regular users.'}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/admin/volunteers')}
                className="px-6 py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-lg shadow-red-700/25 transition-all"
              >
                {isBn ? 'অ্যাডমিন প্যানেলে যান →' : 'Go to Admin Volunteer Governance →'}
              </button>
            </div>
          </div>
        ) : user?.is_volunteer ? (
          /* Existing Volunteer Status Card */
          <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
              🤝
            </div>
            <div>
              <h2 className="text-lg font-black text-emerald-950">
                {user.volunteer_profile?.verification_status === 'APPROVED'
                  ? (isBn ? 'আপনি একজন অনুমোদিত ভলান্টিয়ার!' : 'You Are an Approved Volunteer!')
                  : (isBn ? 'আপনার ভলান্টিয়ার আবেদন পর্যালোচনায় রয়েছে' : 'Volunteer Application Under Review')}
              </h2>
              <p className="text-xs text-emerald-800 mt-1 max-w-md mx-auto">
                {user.volunteer_profile?.verification_status === 'APPROVED'
                  ? (isBn ? `স্বেচ্ছাসেবক কোড: ${user.volunteer_profile?.volunteer_code || 'VOL'}` : `Volunteer Code: ${user.volunteer_profile?.volunteer_code || 'VOL'}`)
                  : (isBn ? 'অ্যাডমিনের অনুমোদনের পর আপনি জরুরি অনুরোধ সমন্বয় করতে পারবেন।' : 'Your application was received. An administrator will verify your credentials shortly.')}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-lg shadow-emerald-700/25 transition-all"
              >
                {isBn ? 'হোমপেজে ফিরে যান' : 'Back to Home'}
              </button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                {isBn ? 'আপনার সম্পূর্ণ নাম *' : 'Full Name *'}
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Asif Mahmud"
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-blood-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                {isBn ? 'ইমেইল অ্যাড্রেস *' : 'Email Address *'}
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="volunteer@example.com"
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-blood-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                {isBn ? 'মোবাইল নম্বর *' : 'Phone Number *'}
              </label>
              <input
                type="text"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="017XXXXXXXX"
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-blood-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                {isBn ? 'জাতীয় পরিচয়পত্র নম্বর (NID)' : 'National ID (NID)'}
              </label>
              <input
                type="text"
                name="nid_number"
                value={formData.nid_number}
                onChange={handleChange}
                placeholder="10 or 17 digit NID"
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-blood-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                {isBn ? 'সংগঠন / প্রতিষ্ঠান (ঐচ্ছিক)' : 'Organization (Optional)'}
              </label>
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                placeholder="e.g. Red Crescent / University Club"
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-blood-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                {isBn ? 'জেলা (৬৪ জেলা)' : 'Assigned District (All 64)'}
              </label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-blood-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white cursor-pointer font-semibold"
              >
                {['Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh',
                  'Gazipur', 'Narayanganj', 'Narsingdi', 'Manikganj', 'Munshiganj', 'Rajbari', 'Faridpur', 'Gopalganj', 'Madaripur', 'Shariatpur', 'Kishoreganj', 'Tangail',
                  "Cox's Bazar", 'Cumilla', 'Feni', 'Brahmanbaria', 'Noakhali', 'Chandpur', 'Lakshmipur', 'Rangamati', 'Khagrachhari', 'Bandarban',
                  'Moulvibazar', 'Habiganj', 'Sunamganj', 'Bogura', 'Pabna', 'Sirajganj', 'Naogaon', 'Natore', 'Chapainawabganj', 'Joypurhat',
                  'Jashore', 'Kushtia', 'Jhenaidah', 'Bagerhat', 'Satkhira', 'Chuadanga', 'Magura', 'Meherpur', 'Narail',
                  'Patuakhali', 'Bhola', 'Pirojpur', 'Barguna', 'Jhalokati', 'Dinajpur', 'Gaibandha', 'Kurigram', 'Nilphamari', 'Panchagarh', 'Thakurgaon', 'Lalmonirhat',
                  'Jamalpur', 'Netrokona', 'Sherpur'
                ].sort().map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-500 leading-relaxed">
            {isBn
              ? 'নিরাপত্তা নীতিমালা: স্বেচ্ছাসেবক হিসেবে আপনি রোগীর স্বজনদের সম্মানজনক ও নিরপেক্ষ সহায়তা প্রদান করতে অঙ্গীকারবদ্ধ থাকবেন।'
              : 'By submitting, you pledge to maintain patient privacy, adhere to our safety standards, and never solicit payments.'}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl disabled:opacity-60 cursor-pointer"
          >
            {loading && <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
            <span>{isBn ? 'স্বেচ্ছাসেবক আবেদন জমা দিন' : 'Submit Volunteer Application'}</span>
          </button>
        </form>
        )}
      </div>
    </div>
  );
};

export default VolunteerApplyPage;
