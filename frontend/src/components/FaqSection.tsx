import React, { useState } from 'react';

interface FaqSectionProps {
  isBn: boolean;
}

const FAQS = [
  {
    qen: 'Is RoktoLinkBD a blood bank?',
    qbn: 'রক্তলিংকবিডি কি একটি রক্তব্যাংক?',
    aen: 'No. We never collect, store, or transfuse blood. We are a coordination platform that connects requesters with available donors and verified volunteers. All donations happen strictly at authorized medical facilities.',
    abn: 'না। আমরা কখনো রক্ত সংগ্রহ, সংরক্ষণ বা রক্তপ্রতিস্থাপন করি না। আমরা একটি সমন্বয় প্ল্যাটফর্ম যা অনুরোধকারীদের সক্রিয় দাতা ও যাচাইকৃত স্বেচ্ছাসেবকদের সাথে যুক্ত করে। সব রক্তদানই অনুমোদিত স্বাস্থ্যসেবা কেন্দ্রে সম্পন্ন হয়।',
  },
  {
    qen: 'Who can see my phone number?',
    qbn: 'আমার ফোন নম্বর কে দেখতে পারে?',
    aen: 'Nobody publicly. Your contact details are only shared inside an active, matched private conversation — never in any public directory or search engine.',
    abn: 'উন্মুক্তভাবে কেউ না। আপনার যোগাযোগের তথ্য শুধু মেলানো ব্যক্তিগত কনভারসেশনে সুরক্ষিত থাকে — কোনো উন্মুক্ত ডিরেক্টরিতে কখনো প্রকাশিত হয় না।',
  },
  {
    qen: 'How fast does matching work?',
    qbn: 'মেলানো কত দ্রুত কাজ করে?',
    aen: 'The matching engine scans a 5 km radius initially and expands automatically (10 → 20 km) if needed. Median time to first donor response is under 8 minutes in covered zones.',
    abn: 'ইঞ্জিন ৫ কিমি ব্যাসার্ধ দিয়ে শুরু করে এবং প্রয়োজন হলে স্বয়ংক্রিয়ভাবে (১০ → ২০ কিমি) বিস্তৃত হয়। সক্রিয় এলাকায় প্রথম দাতার সাড়া পাওয়ার গড় সময় ৮ মিনিটের কম।',
  },
  {
    qen: 'Can I decline a request without penalty?',
    qbn: 'আমি কি কোনো শাস্তি বা অসুবিধা ছাড়া অনুরোধ প্রত্যাখ্যান করতে পারি?',
    aen: 'Always. Donor respect and autonomy is our foundational rule. Decline, adjust your radius, or turn off availability anytime — no shame, no ranking penalty.',
    abn: 'সর্বদা। দাতার সম্মান আমাদের প্রধান নীতি। যেকোনো সময় অস্বীকার করুন, ব্যাসার্ধ সমন্বয় করুন বা অফলাইনে যান — কোনো ঋণাত্মক স্কোর বা অপমানের সুযোগ নেই।',
  },
  {
    qen: 'How are volunteers verified?',
    qbn: 'স্বেচ্ছাসেবকরা কীভাবে যাচাইকৃত হন?',
    aen: 'Every volunteer submits government-issued NID + selfie, signs a strict Code of Conduct, and is manually reviewed and approved by the system administration.',
    abn: 'প্রতিটি স্বেচ্ছাসেবক সরকারি এনআইডি + সেলফি জমা দেন, গোপনীয়তা ও আচরণবিধি মেনে নেন এবং অ্যাডমিন কর্তৃক ম্যানুয়ালি যাচাই হওয়ার পরেই দায়িত্ব পান।',
  },
];

const FaqSection: React.FC<FaqSectionProps> = ({ isBn }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (i: number) => {
    setOpenIdx(openIdx === i ? null : i);
  };

  return (
    <section id="faq" className="py-24 lg:py-28">
      <div className="max-w-3xl mx-auto px-5 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-xs font-extrabold tracking-[0.25em] uppercase text-red-500">
            {isBn ? 'ভালো প্রশ্ন' : 'Good Questions'}
          </span>
          <h2 className="text-3xl lg:text-4xl font-extrabold mt-3 tracking-tight text-zinc-900">
            {isBn ? 'সচরাচর জিজ্ঞাসা' : 'Frequently Asked'}
          </h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((f, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={i}
                className={`faq-item rounded-2xl bg-white border border-blood-100 overflow-hidden transition-all ${
                  isOpen ? 'open shadow-md border-red-200' : ''
                }`}
              >
                <button
                  onClick={() => toggle(i)}
                  className="faq-head w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-bold text-zinc-800 text-sm lg:text-base">
                    {isBn ? f.qbn : f.qen}
                  </span>
                  <svg
                    className={`chev w-5 h-5 text-blood-600 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div className="faq-body">
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-sm text-zinc-500 leading-relaxed">
                      {isBn ? f.abn : f.aen}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
