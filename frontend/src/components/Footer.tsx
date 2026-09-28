import React from 'react';
import { Link } from 'react-router-dom';

interface FooterProps {
  isBn: boolean;
}

const Footer: React.FC<FooterProps> = ({ isBn }) => {
  return (
    <footer className="border-t border-blood-100/70 bg-white">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand Col */}
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-blood-800 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                <path d="M12 2C12 2 5 10.5 5 15a7 7 0 0 0 14 0C19 10.5 12 2 12 2z" />
              </svg>
            </div>
            <span className="font-extrabold text-blood-800">
              Rokto<span className="text-red-500">Link</span>BD
            </span>
          </div>
          <p className="text-sm text-zinc-500 leading-relaxed">
            {isBn
              ? 'একটি জরুরি সমন্বয় প্ল্যাটফর্ম — রক্তব্যাংক নয়। আমরা মানুষকে যুক্ত করি; চিকিৎসা সেবা নির্ধারিত প্রতিষ্ঠানগুলো পরিচালনা করে।'
              : 'A coordination platform — not a blood bank. We connect people; authorized medical institutions handle care.'}
          </p>
          <p className="mt-4 text-xs text-zinc-400 italic">
            {isBn
              ? 'রক্তদাতা ও প্রয়োজনের মানুষকে যুক্ত করি — দ্রুত, নিরাপদ ও দায়িত্বশীলভাবে।'
              : 'Connecting Donors. Responding Faster. Saving Lives Together.'}
          </p>
        </div>

        {/* Platform Links */}
        <div>
          <h4 className="font-bold text-zinc-800 mb-4 text-sm">{isBn ? 'প্ল্যাটফর্ম' : 'Platform'}</h4>
          <ul className="space-y-2.5 text-sm text-zinc-500">
            <li>
              <Link to="/how-it-works" className="hover:text-blood-600 transition-colors">
                {isBn ? 'কীভাবে কাজ করে' : 'How it works'}
              </Link>
            </li>
            <li>
              <Link to="/requests" className="hover:text-blood-600 transition-colors">
                {isBn ? 'সক্রিয় অনুরোধ' : 'Active requests'}
              </Link>
            </li>
            <li>
              <Link to="/donor/register" className="hover:text-blood-600 transition-colors">
                {isBn ? 'দাতা হোন' : 'Become a donor'}
              </Link>
            </li>
            <li>
              <Link to="/volunteer/apply" className="hover:text-blood-600 transition-colors">
                {isBn ? 'স্বেচ্ছাসেবক আবেদন' : 'Volunteer'}
              </Link>
            </li>
            <li>
              <Link to="/reports" className="hover:text-blood-600 font-semibold text-blood-700 transition-colors">
                {isBn ? 'SQL কুয়েরি ইঞ্জিন' : 'SQL Query Engine (12 Queries)'}
              </Link>
            </li>
          </ul>
        </div>

        {/* Trust & Safety */}
        <div>
          <h4 className="font-bold text-zinc-800 mb-4 text-sm">
            {isBn ? 'বিশ্বাস ও নিরাপত্তা' : 'Trust & Safety'}
          </h4>
          <ul className="space-y-2.5 text-sm text-zinc-500">
            <li>
              <Link to="/privacy" className="hover:text-blood-600 transition-colors">
                {isBn ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-blood-600 transition-colors">
                {isBn ? 'সেবার শর্তাবলী' : 'Terms of Service'}
              </Link>
            </li>
            <li>
              <Link to="/guidelines" className="hover:text-blood-600 transition-colors">
                {isBn ? 'কমিউনিটি নির্দেশিকা' : 'Community Guidelines'}
              </Link>
            </li>
            <li>
              <Link to="/safety" className="hover:text-blood-600 transition-colors">
                {isBn ? 'নিরাপত্তা তথ্য' : 'Safety Principles'}
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-blood-600 transition-colors">
                {isBn ? 'আমাদের সম্পর্কে' : 'About Us'}
              </Link>
            </li>
          </ul>
        </div>

        {/* Emergency Assistance */}
        <div>
          <h4 className="font-bold text-zinc-800 mb-4 text-sm">{isBn ? 'জরুরি সেবা' : 'Emergency'}</h4>
          <p className="text-sm text-zinc-500 leading-relaxed">
            {isBn
              ? 'প্রাণঘাতী জরুরি অবস্থায় সবসময় সবার আগে নিকটতম হাসপাতালে বা জাতীয় জরুরি নম্বরে যোগাযোগ করুন।'
              : 'For life-threatening emergencies, always contact your nearest hospital or dial the national emergency number first.'}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-2xl font-extrabold text-blood-700 tracking-wider">999</span>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              {isBn ? 'বাংলাদেশ জাতীয় জরুরি' : 'National Emergency'}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-blood-100/70 py-5 text-center text-xs text-zinc-400">
        {isBn
          ? '© ২০২৬ রক্তলিংকবিডি · বাংলাদেশে দায়িত্বশীলভাবে নির্মিত'
          : '© 2026 RoktoLinkBD · Built with responsibility in Bangladesh'}
      </div>
    </footer>
  );
};

export default Footer;
