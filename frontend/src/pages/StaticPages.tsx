import React from 'react';
import { Link } from 'react-router-dom';

interface StaticPageProps {
  type: 'privacy' | 'terms' | 'safety' | 'guidelines' | 'about' | 'faq';
  isBn: boolean;
}

const StaticPages: React.FC<StaticPageProps> = ({ type, isBn }) => {
  const renderContent = () => {
    switch (type) {
      case 'privacy':
        return {
          title: isBn ? 'গোপনীয়তা ও ডেটা সুরক্ষা নীতি' : 'Privacy & Data Protection Policy',
          subtitle: isBn ? 'আপনার ব্যক্তিগত তথ্যের নিরাপত্তা আমাদের সর্বোচ্চ অগ্রাধিকার' : 'Zero Public Directories · Strict Confidentiality',
          body: (
            <div className="space-y-6 text-sm text-zinc-600 leading-relaxed">
              <section>
                <h3 className="text-base font-bold text-zinc-900 mb-2">1. No Public Phone Directories</h3>
                <p>
                  RoktoLinkBD does not publish, sell, or rent phone numbers, national IDs, or addresses. Your contact details are only disclosed to an authorized, matched party during an active blood request coordination workflow.
                </p>
              </section>
              <section>
                <h3 className="text-base font-bold text-zinc-900 mb-2">2. Geolocation & Availability Data</h3>
                <p>
                  We store approximate latitude and longitude or chosen radius strictly to compute distances between donors and emergency requests. We do not track continuous live location in the background.
                </p>
              </section>
              <section>
                <h3 className="text-base font-bold text-zinc-900 mb-2">3. Your Right to Revoke</h3>
                <p>
                  You can toggle your availability off, delete your donor profile, or request complete account erasure at any time from your settings or by contacting administration.
                </p>
              </section>
            </div>
          ),
        };

      case 'terms':
        return {
          title: isBn ? 'সেবার শর্তাবলী' : 'Terms of Service',
          subtitle: isBn ? 'প্ল্যাটফর্ম ব্যবহারের সাধারণ নিয়মাবলী' : 'Non-Commercial Emergency Coordination',
          body: (
            <div className="space-y-6 text-sm text-zinc-600 leading-relaxed">
              <section>
                <h3 className="text-base font-bold text-zinc-900 mb-2">1. Coordination Platform Only</h3>
                <p>
                  RoktoLinkBD is a communication coordination software application. It is NOT a blood bank, medical laboratory, or emergency hospital. RoktoLinkBD never handles, stores, tests, or transfuses blood.
                </p>
              </section>
              <section>
                <h3 className="text-base font-bold text-zinc-900 mb-2">2. Strictly Non-Commercial</h3>
                <p>
                  Blood donation must always be 100% voluntary, unpaid, and altruistic. Any user attempting to sell blood, charge fees, or scam patients will be permanently banned and reported to Bangladesh law enforcement authorities.
                </p>
              </section>
              <section>
                <h3 className="text-base font-bold text-zinc-900 mb-2">3. Medical Screening at Facilities</h3>
                <p>
                  Final medical eligibility (hemoglobin, infectious diseases, physical fitness) is strictly determined by licensed medical professionals at authorized healthcare collection centers prior to donation.
                </p>
              </section>
            </div>
          ),
        };

      case 'safety':
        return {
          title: isBn ? 'নিরাপত্তা ও নৈতিক নীতিমালা' : 'Safety & Ethical Principles',
          subtitle: isBn ? 'নিরাপদ রক্তদান ও গ্রহীতার সুরক্ষাবিধি' : 'Safety Standards for Donors and Patients',
          body: (
            <div className="space-y-6 text-sm text-zinc-600 leading-relaxed">
              <section>
                <h3 className="text-base font-bold text-zinc-900 mb-2">1. Always Donate at Certified Facilities</h3>
                <p>
                  Never agree to meet or donate blood in private residences or unverified locations. All donations must occur at government-approved hospitals, diagnostic clinics, or registered blood bank centers.
                </p>
              </section>
              <section>
                <h3 className="text-base font-bold text-zinc-900 mb-2">2. Respect Cooldown Intervals</h3>
                <p>
                  Healthy adult donors must wait at least 90–120 days between whole blood donations to protect iron levels and bodily wellness.
                </p>
              </section>
              <section>
                <h3 className="text-base font-bold text-zinc-900 mb-2">3. Emergency 999 Hotline</h3>
                <p>
                  For life-critical emergencies requiring immediate medical trauma intervention, always dial Bangladesh National Emergency 999 first.
                </p>
              </section>
            </div>
          ),
        };

      case 'guidelines':
        return {
          title: isBn ? 'কমিউনিটি নির্দেশিকা' : 'Community Guidelines',
          subtitle: isBn ? 'দায়িত্বশীল ও শ্রদ্ধাশীল ব্যবহারের নিয়ম' : 'Rules for Respectful Engagement',
          body: (
            <div className="space-y-6 text-sm text-zinc-600 leading-relaxed">
              <section>
                <h3 className="text-base font-bold text-zinc-900 mb-2">1. Dignity and Respect</h3>
                <p>
                  Requesters and donors must treat each other with courtesy. Pressure, harassment, or guilt-tripping donors who decline requests is strictly prohibited.
                </p>
              </section>
              <section>
                <h3 className="text-base font-bold text-zinc-900 mb-2">2. Accurate Emergency Information</h3>
                <p>
                  Requesters must post authentic patient information, legitimate hospital locations, and real contact numbers. Falsified requests are zero-tolerance offenses.
                </p>
              </section>
            </div>
          ),
        };

      case 'about':
      default:
        return {
          title: isBn ? 'আমাদের সম্পর্কে' : 'About RoktoLinkBD',
          subtitle: isBn ? 'মানুষের পাশে, সংকটের মুহূর্তে' : 'Emergency Blood Coordination Across 64 Districts',
          body: (
            <div className="space-y-6 text-sm text-zinc-600 leading-relaxed">
              <p>
                RoktoLinkBD was designed and built to address the critical friction in Bangladesh's emergency blood ecosystem. By combining geographic proximity matching, live availability toggles, and verified volunteer coordination, we help families find lifesavers in minutes rather than stressful hours.
              </p>
              <p>
                We believe in privacy by default, non-commercial blood donation, and human-guided technology that respects both the donor's wellness and the patient's urgency.
              </p>
            </div>
          ),
        };
    }
  };

  const content = renderContent();

  return (
    <div className="min-h-screen pt-28 pb-20 px-5 max-w-3xl mx-auto">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs font-bold text-blood-700 hover:text-blood-900 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span>{isBn ? 'মূল পাতায় ফিরে যান' : 'Back to Home'}</span>
      </Link>

      <div className="rounded-3xl bg-white border border-blood-100 p-8 sm:p-12 shadow-xl shadow-red-900/5">
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">{content.title}</h1>
        <p className="text-xs font-bold text-blood-700 mt-1 uppercase tracking-wider mb-8">
          {content.subtitle}
        </p>

        {content.body}
      </div>
    </div>
  );
};

export default StaticPages;
