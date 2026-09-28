import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createBloodRequestApi } from '../api';
import { BANGLADESH_GEO, ALL_DISTRICTS_LOOKUP } from '../data/bangladeshGeo';
import InteractiveLocationMap from '../components/InteractiveLocationMap';

interface CreateRequestProps {
  isBn: boolean;
  onToast: (msg: string) => void;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMPONENTS = ['Red Cells', 'Platelets', 'Whole Blood', 'Plasma'];
const URGENCIES = [
  { val: 'EMERGENCY_NOW', en: 'Emergency — Needed Now', bn: 'জরুরি — এখনই প্রয়োজন' },
  { val: 'WITHIN_6_HOURS', en: 'Within 6 hours', bn: '৬ ঘণ্টার মধ্যে' },
  { val: 'TODAY', en: 'Needed Today', bn: 'আজকের মধ্যে প্রয়োজন' },
  { val: 'NORMAL', en: 'Normal Schedule', bn: 'সাধারণ সময়সূচী' },
];

const POPULAR_HOSPITALS: Record<string, string[]> = {
  'Dhaka': [
    'Dhaka Medical College Hospital (DMCH)',
    'Bangabandhu Sheikh Mujib Medical University (BSMMU)',
    'National Institute of Cardiovascular Diseases (NICVD)',
    'Sir Salimullah Medical College (Mitford Hospital)',
    'Kurmitola General Hospital',
    'Square Hospital, Panthapath',
    'United Hospital, Gulshan',
    'Evercare Hospital, Bashundhara',
  ],
  'Chattogram': [
    'Chattogram Medical College Hospital (CMCH)',
    'Chittagong General Hospital',
    'Evercare Hospital Chattogram',
    'Parkview Hospital, Panchlaish',
  ],
  'Sylhet': [
    'Sylhet MAG Osmani Medical College Hospital',
    'Jalalabad Ragib-Rabeya Medical College Hospital',
    'Mount Adora Hospital',
  ],
  'Rajshahi': [
    'Rajshahi Medical College Hospital (RMCH)',
    'Islami Bank Medical College Hospital Rajshahi',
  ],
};

const CreateRequest: React.FC<CreateRequestProps> = ({ isBn, onToast }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    patient_name: '',
    blood_group: 'O+',
    component: 'Red Cells',
    units_required: 1,
    urgency: 'EMERGENCY_NOW',
    facility_name: '',
    address_text: '',
    requester_phone: '',
    public_note: '',
  });

  const [division, setDivision] = useState('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [upazila, setUpazila] = useState('Dhanmondi');
  const [showMap, setShowMap] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableDistricts = division && BANGLADESH_GEO[division] ? Object.keys(BANGLADESH_GEO[division].districts) : [];
  const availableUpazilas = district && ALL_DISTRICTS_LOOKUP[district] ? ALL_DISTRICTS_LOOKUP[district].district.upazilas : [];

  useEffect(() => {
    if (division && BANGLADESH_GEO[division]) {
      const dists = Object.keys(BANGLADESH_GEO[division].districts);
      if (!dists.includes(district)) {
        setDistrict(dists[0] || '');
      }
    }
  }, [division]);

  useEffect(() => {
    if (district && ALL_DISTRICTS_LOOKUP[district]) {
      const upas = ALL_DISTRICTS_LOOKUP[district].district.upazilas;
      if (!upas.includes(upazila)) {
        setUpazila(upas[0] || '');
      }
    }
  }, [district]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
    if (loc.upazila) setUpazila(loc.upazila);
    setSelectedCoordinates({ lat: loc.lat, lng: loc.lng });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fullAddress = [
      formData.address_text,
      upazila,
      district,
      division,
      'Bangladesh',
    ]
      .filter(Boolean)
      .join(', ');

    try {
      const res = await createBloodRequestApi({
        ...formData,
        address_text: fullAddress,
        latitude: selectedCoordinates?.lat,
        longitude: selectedCoordinates?.lng,
        units_required: Number(formData.units_required),
      });

      onToast(isBn ? 'জরুরি রক্তের অনুরোধ সফলভাবে প্রকাশিত হয়েছে!' : 'Emergency blood request created successfully!');
      navigate(`/requests/${res.request.id}`);
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(isBn ? 'অনুরোধ তৈরি ব্যর্থ হয়েছে। তথ্য যাচাই করুন।' : 'Failed to create request. Please check inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  const sampleHospitals = POPULAR_HOSPITALS[district] || POPULAR_HOSPITALS['Dhaka'];

  return (
    <div className="min-h-screen pt-28 pb-20 px-5 max-w-4xl mx-auto">
      <Link
        to="/requests"
        className="inline-flex items-center gap-2 text-xs font-bold text-blood-700 hover:text-blood-900 transition-colors mb-6 cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span>{isBn ? 'সব অনুরোধে ফিরে যান' : 'Back to Requests'}</span>
      </Link>

      <div className="rounded-3xl bg-white border border-blood-100 p-8 sm:p-10 shadow-2xl shadow-red-900/10 relative overflow-hidden">
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-blood-800 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
              <path d="M12 2C12 2 5 10.5 5 15a7 7 0 0 0 14 0C19 10.5 12 2 12 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900">
              {isBn ? 'জরুরি রক্তের অনুরোধ তৈরি করুন' : 'Post Emergency Blood Request'}
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isBn
                ? 'কাছের সক্রিয় রক্তদাতাদের স্বয়ংক্রিয় অ্যালার্ট পাঠানো হবে'
                : 'Dispatches emergency notifications to verified nearby donors across Bangladesh in minutes'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Details */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                {isBn ? 'রোগীর নাম' : 'Patient Name'}
              </label>
              <input
                type="text"
                name="patient_name"
                value={formData.patient_name}
                onChange={handleChange}
                placeholder="e.g. Asif Chowdhury"
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-blood-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                {isBn ? 'জরুরি যোগাযোগের নম্বর *' : 'Emergency Contact Phone *'}
              </label>
              <input
                type="tel"
                name="requester_phone"
                required
                value={formData.requester_phone}
                onChange={handleChange}
                placeholder="01XXXXXXXXX"
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-blood-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white font-mono"
              />
            </div>
          </div>

          {/* Blood Specs */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                {isBn ? 'রক্তের গ্রুপ *' : 'Blood Group *'}
              </label>
              <select
                name="blood_group"
                required
                value={formData.blood_group}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-blood-100 text-sm font-bold text-blood-900 focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white cursor-pointer"
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
                {isBn ? 'রক্তের উপাদান' : 'Blood Component'}
              </label>
              <select
                name="component"
                value={formData.component}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-blood-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white cursor-pointer"
              >
                {COMPONENTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                {isBn ? 'প্রয়োজনীয় ইউনিট *' : 'Units Required *'}
              </label>
              <input
                type="number"
                name="units_required"
                min={1}
                max={10}
                required
                value={formData.units_required}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-blood-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white"
              />
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              {isBn ? 'জরুরি অবস্থা নির্ধারণ *' : 'Urgency Level *'}
            </label>
            <div className="grid sm:grid-cols-2 gap-3">
              {URGENCIES.map((u) => (
                <label
                  key={u.val}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    formData.urgency === u.val
                      ? 'border-red-500 bg-blood-50/50 shadow-sm'
                      : 'border-zinc-200 bg-white hover:border-red-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="urgency"
                    value={u.val}
                    checked={formData.urgency === u.val}
                    onChange={handleChange}
                    className="accent-red-600"
                  />
                  <span className="text-xs font-bold text-zinc-800">{isBn ? u.bn : u.en}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Location Details: Division, District, Upazila */}
          <div className="p-5 rounded-2xl bg-red-50/40 border border-blood-100 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                <span>📍</span>
                <span>{isBn ? 'হাসপাতালের অবস্থান (বিভাগ, জেলা ও উপজেলা)' : 'Hospital Location (64 Districts)'}</span>
              </label>
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="text-xs font-bold text-red-600 hover:text-red-800 underline flex items-center gap-1 cursor-pointer"
              >
                <span>{showMap ? (isBn ? 'ম্যাপ লুকান' : 'Hide Map') : isBn ? '🗺️ ম্যাপে পিন নির্বাচন করুন' : '🗺️ Select on Map'}</span>
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">{isBn ? 'বিভাগ' : 'Division'}</label>
                <select
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-zinc-200 text-sm font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
                >
                  {Object.keys(BANGLADESH_GEO).map((d) => (
                    <option key={d} value={d}>
                      {isBn ? BANGLADESH_GEO[d].nameBn : d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">{isBn ? 'জেলা (৬৪টি)' : 'District'}</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-zinc-200 text-sm font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
                >
                  {availableDistricts.map((d) => {
                    const dObj = BANGLADESH_GEO[division]?.districts[d];
                    return (
                      <option key={d} value={d}>
                        {isBn && dObj ? dObj.nameBn : d}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">{isBn ? 'উপজেলা / থানা' : 'Upazila / Thana'}</label>
                <select
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-zinc-200 text-sm font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
                >
                  {availableUpazilas.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Interactive Location Map Picker inside form */}
            {showMap && (
              <div className="pt-2 animate-fade-in">
                <InteractiveLocationMap
                  selectedDivision={division}
                  selectedDistrict={district}
                  selectedUpazila={upazila}
                  onSelectLocation={handleMapLocationSelect}
                  isBn={isBn}
                  height="340px"
                />
              </div>
            )}
          </div>

          {/* Hospital Name & Quick suggestions */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              {isBn ? 'হাসপাতাল / মেডিকেল সেন্টারের নাম *' : 'Hospital / Medical Facility Name *'}
            </label>
            <input
              type="text"
              name="facility_name"
              required
              value={formData.facility_name}
              onChange={handleChange}
              placeholder="e.g. Dhaka Medical College Hospital"
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-blood-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white"
            />
            {sampleHospitals.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[11px] text-zinc-400 self-center">{isBn ? 'পরামর্শ:' : 'Suggestions:'}</span>
                {sampleHospitals.slice(0, 3).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setFormData({ ...formData, facility_name: h })}
                    className="text-[11px] bg-white border border-zinc-200 hover:border-red-300 hover:text-red-700 text-zinc-600 rounded-lg px-2 py-0.5 transition-colors cursor-pointer"
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hospital specific ward / bed */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              {isBn ? 'ওয়ার্ড নম্বর / কেবিন / বিশেষ নির্দেশক' : 'Ward / Bed / Room / Floor'}
            </label>
            <input
              type="text"
              name="address_text"
              value={formData.address_text}
              onChange={handleChange}
              placeholder="e.g. Ward 4, Bed 12, ICU Building 2nd Floor"
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-blood-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white"
            />
          </div>

          {/* Public Notes */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              {isBn ? 'অতিরিক্ত নির্দেশনা বা নোট' : 'Public Notes for Donors'}
            </label>
            <textarea
              name="public_note"
              rows={3}
              value={formData.public_note}
              onChange={handleChange}
              placeholder={
                isBn
                  ? 'যেমন: আগামীকাল সকাল ১০টায় অপারেশনের জন্য প্রয়োজন…'
                  : 'e.g. Operation scheduled for tomorrow 10:00 AM, patient is in ICU…'
              }
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-blood-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl disabled:opacity-60 cursor-pointer"
          >
            {loading && <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
            <span>{isBn ? 'অনুরোধ প্রকাশ করুন ও অ্যালার্ট পাঠান' : 'Post Request & Dispatch Alerts'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRequest;
