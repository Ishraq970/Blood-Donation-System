import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface HowItWorksPageProps {
  isBn: boolean;
}

const COMPATIBILITY_DATA: Record<
  string,
  { canGiveTo: string[]; canReceiveFrom: string[]; notesEn: string; notesBn: string }
> = {
  'O-': {
    canGiveTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['O-'],
    notesEn: 'Universal Red Cell Donor — Essential in trauma emergencies where patient blood group is not yet known.',
    notesBn: 'সর্বজনীন লাল রক্তকণিকা দাতা — ট্রমা ও জরুরি অপারেশনে অপরিহার্য যেখানে রোগীর গ্রুপ তাৎক্ষণিক জানা নেই।',
  },
  'O+': {
    canGiveTo: ['O+', 'A+', 'B+', 'AB+'],
    canReceiveFrom: ['O+', 'O-'],
    notesEn: 'Most requested blood group nationwide in Bangladesh, used for positive recipients.',
    notesBn: 'বাংলাদেশে সবচেয়ে বেশি চাহিদাসম্পন্ন রক্তের গ্রুপ, পজিটিভ রোগীদের জন্য ব্যবহৃত।',
  },
  'A-': {
    canGiveTo: ['A-', 'A+', 'AB-', 'AB+'],
    canReceiveFrom: ['A-', 'O-'],
    notesEn: 'Rare Rh-negative group. High urgency matching required.',
    notesBn: 'বিরল নেগেটিভ গ্রুপ। জরুরি ভিত্তিতে দ্রুত ম্যাচিং প্রয়োজন হয়।',
  },
  'A+': {
    canGiveTo: ['A+', 'AB+'],
    canReceiveFrom: ['A+', 'A-', 'O+', 'O-'],
    notesEn: 'Common group with multiple compatible donor sources.',
    notesBn: 'সাধারণ গ্রুপ, একাধিক সামঞ্জস্যপূর্ণ রক্তের উৎস রয়েছে।',
  },
  'B-': {
    canGiveTo: ['B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['B-', 'O-'],
    notesEn: 'Rare Rh-negative group requiring proactive volunteer coordination.',
    notesBn: 'বিরল গ্রুপ, সক্রিয় স্বেচ্ছাসেবকদের মাধ্যমে অনুসন্ধান করা হয়।',
  },
  'B+': {
    canGiveTo: ['B+', 'AB+'],
    canReceiveFrom: ['B+', 'B-', 'O+', 'O-'],
    notesEn: 'One of the most prevalent blood groups in South Asia.',
    notesBn: 'দক্ষিণ এশিয়া ও বাংলাদেশে সর্বাধিক প্রচলিত রক্তের গ্রুপগুলোর একটি।',
  },
  'AB-': {
    canGiveTo: ['AB-', 'AB+'],
    canReceiveFrom: ['AB-', 'A-', 'B-', 'O-'],
    notesEn: 'Rarest blood group in Bangladesh (<1% of population).',
    notesBn: 'বাংলাদেশের সবচেয়ে বিরল রক্তের গ্রুপ (জনসংখ্যার ১% এরও কম)।',
  },
  'AB+': {
    canGiveTo: ['AB+'],
    canReceiveFrom: ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
    notesEn: 'Universal Red Cell Recipient — Can receive packed red cells from any blood group safely.',
    notesBn: 'সর্বজনীন লাল রক্তকণিকা গ্রহীতা — যে কোনো গ্রুপের কাছ থেকে নিরাপদে রক্ত নিতে পারেন।',
  },
};

const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ isBn }) => {
  const [activeTab, setActiveTab] = useState<'requester' | 'donor' | 'volunteer' | 'safety'>('requester');
  const [selectedGroup, setSelectedGroup] = useState<string>('O+');

  return (
    <div className="min-h-screen pt-24 lg:pt-28 pb-20 px-5 lg:px-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 mb-6">
        <Link to="/" className="hover:text-blood-700 transition-colors">
          {isBn ? 'হোম' : 'Home'}
        </Link>
        <span>/</span>
        <span className="text-blood-800">{isBn ? 'কীভাবে কাজ করে' : 'How It Works'}</span>
      </div>

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blood-50 border border-blood-100 text-blood-700 text-xs font-bold mb-4">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>{isBn ? 'জরুরি রক্তদান সমন্বয় প্রক্রিয়া' : 'Emergency Blood Coordination Pipeline'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 tracking-tight leading-tight">
          {isBn ? (
            <>
              রক্তলিংকবিডি কীভাবে <span className="grad-text">কাজ করে</span>
            </>
          ) : (
            <>
              How RoktoLinkBD <span className="grad-text">Works</span>
            </>
          )}
        </h1>
        <p className="mt-4 text-zinc-500 text-base lg:text-lg leading-relaxed">
          {isBn
            ? 'জরুরি রক্তদানে প্রতিটি মিনিট মূল্যবান। আমলাতান্ত্রিক জটিলতামুক্ত এবং গোপনীয়তা সুরক্ষিত রেখে সঠিক রক্তদাতার সাথে যুক্ত হওয়ার ৬টি নিরাপদ ধাপ।'
            : 'Every minute counts in an emergency. Discover how our algorithmic matching, volunteer desk, and privacy-first network safely coordinate blood donations across Bangladesh.'}
        </p>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          <div className="p-4 rounded-2xl bg-white border border-blood-100 shadow-sm text-center">
            <p className="text-2xl font-black text-blood-700">~4.2 min</p>
            <p className="text-xs text-zinc-500 mt-1 font-medium">{isBn ? 'গড় প্রতিক্রিয়া সময়' : 'Avg. First Response'}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-blood-100 shadow-sm text-center">
            <p className="text-2xl font-black text-zinc-900">64</p>
            <p className="text-xs text-zinc-500 mt-1 font-medium">{isBn ? 'জেলায় কভারেজ' : 'Districts Covered'}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-blood-100 shadow-sm text-center">
            <p className="text-2xl font-black text-emerald-600">0 BDT</p>
            <p className="text-xs text-zinc-500 mt-1 font-medium">{isBn ? '১০০% অলাভজনক' : '100% Free & Altruistic'}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-blood-100 shadow-sm text-center">
            <p className="text-2xl font-black text-indigo-600">SHA256</p>
            <p className="text-xs text-zinc-500 mt-1 font-medium">{isBn ? 'ডিজিটাল স্বীকৃতি' : 'Verified Certificates'}</p>
          </div>
        </div>
      </div>

      {/* Role Navigation Tabs */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex p-1.5 rounded-2xl bg-zinc-100 border border-zinc-200/80 max-w-full overflow-x-auto">
          <button
            onClick={() => setActiveTab('requester')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'requester'
                ? 'bg-white text-blood-800 shadow-md shadow-zinc-300/40'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {isBn ? '🚨 রোগীর পরিবারের জন্য' : '🚨 For Requesters (Patients)'}
          </button>
          <button
            onClick={() => setActiveTab('donor')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'donor'
                ? 'bg-white text-blood-800 shadow-md shadow-zinc-300/40'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {isBn ? '🩸 রক্তদাতার জন্য' : '🩸 For Donors'}
          </button>
          <button
            onClick={() => setActiveTab('volunteer')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'volunteer'
                ? 'bg-white text-blood-800 shadow-md shadow-zinc-300/40'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {isBn ? '🤝 স্বেচ্ছাসেবকের জন্য' : '🤝 For Volunteers'}
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'safety'
                ? 'bg-white text-blood-800 shadow-md shadow-zinc-300/40'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {isBn ? '🛡️ নিরাপত্তা ও আইনি সুরক্ষা' : '🛡️ Safety & Non-Bank Policy'}
          </button>
        </div>
      </div>

      {/* Tab 1: For Requesters */}
      {activeTab === 'requester' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-7 rounded-3xl bg-white border border-blood-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
              <span className="text-4xl font-black text-blood-100 absolute top-4 right-4 group-hover:text-blood-200 transition-colors">01</span>
              <div className="w-12 h-12 rounded-2xl bg-blood-50 text-blood-600 flex items-center justify-center font-bold text-lg mb-5">
                📝
              </div>
              <h3 className="font-bold text-lg text-zinc-900 mb-2">
                {isBn ? '৩০ সেকেন্ডে অনুরোধ পোস্ট' : '30-Sec Emergency Request'}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {isBn
                  ? 'রক্তের গ্রুপ, প্রয়োজনীয় ইউনিট, হাসপাতালের নাম ও জেলা লিখুন। কোনো অ্যাকাউন্ট তৈরি না করলেও তাৎক্ষণিক অনুরোধ সম্পন্ন হয়।'
                  : 'Submit blood group, units, hospital name, and urgency. No complex signup needed in critical moments — takes under a minute.'}
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-blood-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
              <span className="text-4xl font-black text-blood-100 absolute top-4 right-4 group-hover:text-blood-200 transition-colors">02</span>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg mb-5">
                🎯
              </div>
              <h3 className="font-bold text-lg text-zinc-900 mb-2">
                {isBn ? 'স্বয়ংক্রিয় ভৌগোলিক ম্যাচিং' : 'Automated Radius Matching'}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {isBn
                  ? 'আমাদের হ্যাভারসাইন অ্যালগরিদম হাসপাতালের নিকটবর্তী সক্রিয় ও সামঞ্জস্যপূর্ণ গ্রুপের রক্তদাতাদের কাছে নোটিফিকেশন পাঠায়।'
                  : 'Our deterministic matching engine scans available donors within 5-30 km using ABO/Rh matrix and Haversine distance.'}
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-blood-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
              <span className="text-4xl font-black text-blood-100 absolute top-4 right-4 group-hover:text-blood-200 transition-colors">03</span>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg mb-5">
                🏥
              </div>
              <h3 className="font-bold text-lg text-zinc-900 mb-2">
                {isBn ? 'হাসপাতালে রক্তদান ও নিশ্চিতকরণ' : 'Hospital Donation & Closure'}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {isBn
                  ? 'স্বেচ্ছাসেবকের নির্দেশনায় রক্তদাতা হাসপাতালে পৌঁছে রক্তদান করেন। উভয় পক্ষ নিশ্চিত করলে অনুরোধটি সফলভাবে বন্ধ হয়।'
                  : 'The donor reaches the licensed hospital for TTI testing and donation. Both parties confirm completion to update live status.'}
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-r from-blood-700 to-red-600 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-red-900/15">
            <div>
              <h4 className="text-xl font-bold">{isBn ? 'জরুরি রক্তের প্রয়োজন এখনই?' : 'Need blood urgently right now?'}</h4>
              <p className="text-sm text-red-100 mt-1">
                {isBn ? 'সহজ ফর্ম পূরণ করে সারা বাংলাদেশের রক্তদাতাদের জানান।' : 'Create an emergency request and notify nearby available donors instantly.'}
              </p>
            </div>
            <Link
              to="/requests/create"
              className="px-6 py-3.5 rounded-full bg-white text-blood-800 font-bold text-sm hover:bg-red-50 transition-colors whitespace-nowrap shadow-md"
            >
              {isBn ? 'রক্তের অনুরোধ তৈরি করুন' : 'Create Emergency Request'}
            </Link>
          </div>
        </div>
      )}

      {/* Tab 2: For Donors */}
      {activeTab === 'donor' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-7 rounded-3xl bg-white border border-blood-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
              <span className="text-4xl font-black text-blood-100 absolute top-4 right-4 group-hover:text-blood-200 transition-colors">01</span>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg mb-5">
                🛡️
              </div>
              <h3 className="font-bold text-lg text-zinc-900 mb-2">
                {isBn ? 'গোপনীয়তা অক্ষুণ্ণ প্রোফাইল' : 'Zero-Spam Privacy Profile'}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {isBn
                  ? 'আপনার ফোন নম্বর কখনই সাধারণ মানুষের কাছে বা ইন্টারনেটে উন্মুক্ত করা হয় না। কোড নম্বর (যেমন DNR-26-XXXX) দিয়ে কাজ পরিচালিত হয়।'
                  : 'Your phone number is NEVER published publicly or indexed on Google. You are identified via a protected donor code.'}
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-blood-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
              <span className="text-4xl font-black text-blood-100 absolute top-4 right-4 group-hover:text-blood-200 transition-colors">02</span>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg mb-5">
                ⚡
              </div>
              <h3 className="font-bold text-lg text-zinc-900 mb-2">
                {isBn ? 'এক ট্যাপে প্রাপ্যতা নির্ধারণ' : 'One-Tap Availability Toggle'}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {isBn
                  ? 'রক্তদানের জন্য প্রস্তুত থাকলে "Available Now" চালু রাখুন। ব্যস্ত থাকলে বা বিশ্রামে থাকলে যেকোনো সময় "Unavailable" করুন।'
                  : 'Toggle your status between "Available Now" and "Unavailable" anytime. Automatic 90-day cooldown pause after each confirmed donation.'}
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-blood-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
              <span className="text-4xl font-black text-blood-100 absolute top-4 right-4 group-hover:text-blood-200 transition-colors">03</span>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg mb-5">
                🏆
              </div>
              <h3 className="font-bold text-lg text-zinc-900 mb-2">
                {isBn ? 'ডিজিটাল সার্টিফিকেট ও সম্মাননা' : 'SHA256 Digital Certificate'}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {isBn
                  ? 'প্রতিটি সফল রক্তদানের পর আপনি পাবেন ক্রিপ্টোগ্রাফিকভাবে সুরক্ষিত ডিজিটাল স্বীকৃতি এবং লাইফসেভার্স সম্মাননা প্রাচীরে স্থান।'
                  : 'Receive a cryptographic digital certificate of appreciation and join the nationwide Wall of Lifesavers.'}
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border-2 border-blood-200 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
            <div>
              <h4 className="text-xl font-bold text-zinc-900">{isBn ? 'রক্তদাতা হিসেবে জীবন বাঁচান' : 'Join as a Volunteer Blood Donor'}</h4>
              <p className="text-sm text-zinc-500 mt-1">
                {isBn ? 'নিবন্ধন করতে মাত্র ২ মিনিট সময় লাগে। আপনার রক্তদান একজন মুমূর্ষু রোগীর প্রাণ।' : 'Register in 2 minutes. Protect your privacy and be there when someone in your town needs blood.'}
              </p>
            </div>
            <Link
              to="/donor/register"
              className="px-6 py-3.5 rounded-full bg-blood-700 text-white font-bold text-sm hover:bg-blood-800 transition-colors whitespace-nowrap shadow-md shadow-red-900/20"
            >
              {isBn ? 'দাতা হিসেবে নিবন্ধন' : 'Register as Donor'}
            </Link>
          </div>
        </div>
      )}

      {/* Tab 3: For Volunteers */}
      {activeTab === 'volunteer' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-7 rounded-3xl bg-white border border-blood-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
              <span className="text-4xl font-black text-blood-100 absolute top-4 right-4 group-hover:text-blood-200 transition-colors">01</span>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-lg mb-5">
                🪪
              </div>
              <h3 className="font-bold text-lg text-zinc-900 mb-2">
                {isBn ? 'এনআইডি যাচাইকৃত আবেদন' : 'Encrypted NID Verification'}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {isBn
                  ? 'সব স্বেচ্ছাসেবক অ্যাডমিন কর্তৃক জাতীয় পরিচয়পত্র যাচাইয়ের মাধ্যমে অনুমোদিত হন। ফলে প্ল্যাটফর্মের নিরাপত্তা থাকে ১০০% সুরক্ষিত।'
                  : 'Volunteers upload encrypted national ID proof, reviewed exclusively by administrators to ensure authentic, vetted coordination.'}
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-blood-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
              <span className="text-4xl font-black text-blood-100 absolute top-4 right-4 group-hover:text-blood-200 transition-colors">02</span>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg mb-5">
                📡
              </div>
              <h3 className="font-bold text-lg text-zinc-900 mb-2">
                {isBn ? 'কেস দাবি ও সরাসরি যোগাযোগ' : 'Claim Emergency Cases'}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {isBn
                  ? 'জরুরি অনুরোধের কেস গ্রহণ করে রক্তদাতা ও রোগীর সাথে সমন্বয় করুন। কোনো মধ্যস্বত্বভোগী বা দালালদের হস্তক্ষেপ নেই।'
                  : 'Claim active emergency cases in your upazila/district. Guide both parties smoothly through our ephemeral in-app chat.'}
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-blood-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
              <span className="text-4xl font-black text-blood-100 absolute top-4 right-4 group-hover:text-blood-200 transition-colors">03</span>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg mb-5">
                🤝
              </div>
              <h3 className="font-bold text-lg text-zinc-900 mb-2">
                {isBn ? 'জাতীয় হেল্পলাইন সহায়তা' : 'Community Leadership'}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {isBn
                  ? 'আপনার এলাকার রক্তদান ক্যাম্পেইন, জরুরি থ্যালাসেমিয়া রোগীদের রক্ত সরবরাহ এবং মানবিক কাজের প্রধান চালিকাশক্তি।'
                  : 'Coordinate thalassemia drives, emergency accident responses, and support district healthcare facilities.'}
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div>
              <h4 className="text-xl font-bold">{isBn ? 'স্বেচ্ছাসেবক হিসেবে যুক্ত হতে চান?' : 'Become an Admin-Verified Volunteer'}</h4>
              <p className="text-sm text-zinc-400 mt-1">
                {isBn ? 'আপনার এলাকার রোগীদের দ্রুত রক্ত পেতে সাহায্য করুন।' : 'Stand with patients in critical hours and coordinate lifesaving donations in your district.'}
              </p>
            </div>
            <Link
              to="/volunteer/apply"
              className="px-6 py-3.5 rounded-full bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors whitespace-nowrap shadow-md"
            >
              {isBn ? 'স্বেচ্ছাসেবক আবেদন' : 'Apply as Volunteer'}
            </Link>
          </div>
        </div>
      )}

      {/* Tab 4: Safety & Strict Legal Policy */}
      {activeTab === 'safety' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-8 rounded-3xl bg-red-50 border-2 border-red-200 text-blood-900">
            <div className="flex items-start gap-4">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="text-xl font-black text-blood-800">
                  {isBn ? 'কঠোর প্রাতিষ্ঠানিক ও আইনি সীমানা' : 'Strict Operational & Non-Clinical Boundary'}
                </h3>
                <p className="text-sm text-blood-700 mt-2 leading-relaxed">
                  {isBn
                    ? 'রক্তলিংকবিডি কোনো রক্তব্যাংক (Blood Bank) নয়। এটি একটি অলাভজনক ডিজিটাল সমন্বয় সফটওয়্যার যা রক্তদাতা ও গ্রহীতাকে সরাসরি যোগাযোগ করিয়ে দেয়।'
                    : 'RoktoLinkBD is NOT a blood bank. It does NOT collect, test, store, sell, issue, or transfuse human blood. All laboratory screening and transfusions take place strictly at authorized hospitals.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-zinc-200">
              <h4 className="font-bold text-base text-zinc-900 flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                {isBn ? '১০০% রক্ত বিক্রয় ও বাণিজ্য নিষিদ্ধ' : 'Zero Commercial Brokering'}
              </h4>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {isBn
                  ? 'রক্ত কেনাবেচা বা কোনো আর্থিক লেনদেন সম্পূর্ণ নিষিদ্ধ ও আইনত দণ্ডনীয়। কোনো ব্যবহারকারী টাকা দাবি করলে সাথে সাথে রিপোর্ট করুন।'
                  : 'The buying or selling of human blood is strictly prohibited by Bangladesh law and platform rules. Any extortion attempts result in permanent blacklisting and police reporting.'}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-zinc-200">
              <h4 className="font-bold text-base text-zinc-900 flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                {isBn ? 'টিটিআই ল্যাবরেটরি টেস্ট বাধ্যতামূলক' : 'Mandatory TTI Screening'}
              </h4>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {isBn
                  ? 'হাসপাতাল বা ব্লাড সেন্টারে রক্ত সঞ্চালনের আগে এইচআইভি (HIV), হেপাটাইটিস বি ও সি (HBV, HCV), সিফিলিস ও ম্যালেরিয়া স্ক্রিনিং আবশ্যক।'
                  : 'Transfusion-Transmissible Infection (TTI) testing for HIV, Hepatitis B, Hepatitis C, Syphilis, and Malaria must always be conducted at the receiving hospital prior to transfusion.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Blood Compatibility Guide */}
      <div className="mt-16 p-8 rounded-3xl bg-white border border-blood-100 shadow-xl shadow-red-900/5">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-bold text-red-500 uppercase tracking-widest">
            {isBn ? 'চিকিৎসা বিজ্ঞান নির্দেশিকা' : 'ABO & Rh Compatibility Engine'}
          </span>
          <h2 className="text-2xl lg:text-3xl font-black text-zinc-900 mt-2">
            {isBn ? 'রক্তের গ্রুপ সামঞ্জস্য নির্দেশিকা' : 'Red Cell Compatibility Matrix'}
          </h2>
          <p className="text-sm text-zinc-500 mt-2">
            {isBn
              ? 'নিচের যেকোনো রক্তের গ্রুপে ক্লিক করে দেখুন কারা কাকে রক্ত দিতে বা নিতে পারে।'
              : 'Select any blood group below to instantly see compatible donors and recipient groups.'}
          </p>
        </div>

        {/* Group Selector Chips */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-8">
          {Object.keys(COMPATIBILITY_DATA).map((group) => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`px-4 py-2 rounded-2xl text-sm font-black transition-all ${
                selectedGroup === group
                  ? 'bg-blood-700 text-white shadow-lg shadow-red-900/25 scale-105'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {group}
            </button>
          ))}
        </div>

        {/* Active Selected Compatibility Box */}
        {COMPATIBILITY_DATA[selectedGroup] && (
          <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6 pb-6 border-b border-zinc-200">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-blood-800 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
                  {selectedGroup}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">
                    {isBn ? `রক্তের গ্রুপ ${selectedGroup}` : `Blood Group: ${selectedGroup}`}
                  </h3>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {isBn ? COMPATIBILITY_DATA[selectedGroup].notesBn : COMPATIBILITY_DATA[selectedGroup].notesEn}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Can Give To */}
              <div className="p-4 rounded-xl bg-white border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{isBn ? 'কাদের রক্ত দিতে পারবেন:' : 'Can DONATE red cells to:'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {COMPATIBILITY_DATA[selectedGroup].canGiveTo.map((g) => (
                    <span key={g} className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              {/* Can Receive From */}
              <div className="p-4 rounded-xl bg-white border border-blue-100">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>{isBn ? 'কাদের কাছ থেকে রক্ত নিতে পারবেন:' : 'Can RECEIVE red cells from:'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {COMPATIBILITY_DATA[selectedGroup].canReceiveFrom.map((g) => (
                    <span key={g} className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Emergency Callout */}
      <div className="mt-14 p-8 rounded-3xl bg-zinc-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-red-400">
            {isBn ? 'জরুরি সেবা' : '24/7 Lifeline'}
          </span>
          <h3 className="text-2xl font-black mt-1">
            {isBn ? 'জীবন বাঁচানোর দায়িত্বে আমরা সদা জাগ্রত' : 'Ready to save a life or request emergency blood?'}
          </h3>
          <p className="text-sm text-zinc-400 mt-2 max-w-xl">
            {isBn
              ? 'প্রাণঘাতী যেকোনো পরিস্থিতিতে নিকটস্থ হাসপাতালে যোগাযোগ করুন অথবা জাতীয় জরুরি সেবা ৯৯৯ বা ১৬২৬৩ তে কল দিন।'
              : 'In life-threatening situations, always reach out immediately to your nearest hospital blood transfusion unit or call national hotlines 999 / 16263.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/requests/create"
            className="px-6 py-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors shadow-lg shadow-red-600/30"
          >
            {isBn ? 'রক্ত প্রয়োজন' : 'I Need Blood'}
          </Link>
          <Link
            to="/donor/register"
            className="px-6 py-3.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition-colors border border-zinc-700"
          >
            {isBn ? 'দাতা হোন' : 'Become a Donor'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;
