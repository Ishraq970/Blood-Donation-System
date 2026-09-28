import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchRequestDetail,
  fetchCoordinationApi,
  fetchCaseMessagesApi,
  sendCaseMessageApi,
  offerDonationApi,
  updateMatchStatusApi,
  type UrgentRequestItem,
  type CoordinationData,
  type CaseMessage,
} from '../api';

interface RequestDetailProps {
  isBn: boolean;
  onToast: (msg: string) => void;
}

const LIFECYCLE_STAGES = [
  { key: 'SEARCHING', labelEn: 'Searching Donors', labelBn: 'দাতা খোঁজা হচ্ছে' },
  { key: 'DONORS_NOTIFIED', labelEn: 'Donors Notified', labelBn: 'দাতাদের নোটিফাইড' },
  { key: 'DONOR_ACCEPTED', labelEn: 'Donor Accepted', labelBn: 'দাতা সম্মতি দিয়েছেন' },
  { key: 'CONTACT_SHARED', labelEn: 'Contact Shared', labelBn: 'যোগাযোগ উন্মুক্ত' },
  { key: 'DONOR_TRAVELLING', labelEn: 'On the Way', labelBn: 'রওনা হয়েছেন' },
  { key: 'DONOR_ARRIVED', labelEn: 'Arrived at Facility', labelBn: 'হাসপাতালে পৌঁছেছেন' },
  { key: 'FULFILLED', labelEn: 'Donation Completed', labelBn: 'রক্তদান সম্পন্ন' },
];

const RequestDetail: React.FC<RequestDetailProps> = ({ isBn, onToast }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [request, setRequest] = useState<UrgentRequestItem | null>(null);
  const [coordination, setCoordination] = useState<CoordinationData | null>(null);
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      const reqData = await fetchRequestDetail(id);
      setRequest(reqData);

      // Attempt to fetch coordination data
      try {
        const coord = await fetchCoordinationApi(id);
        setCoordination(coord);
        if (coord.is_authorized) {
          const msgs = await fetchCaseMessagesApi(id);
          setMessages(msgs);
        }
      } catch {
        // Not authorized for private contact details
      }
    } catch {
      setError('Request details could not be found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // 10s poll for coordination status & chat
    return () => clearInterval(interval);
  }, [id]);

  const handleOfferDonation = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!user.is_donor) {
      onToast(isBn ? 'রক্তদান করতে অনুগ্রহ করে আগে রক্তদাতা প্রোফাইল তৈরি করুন।' : 'Please register as a blood donor first.');
      navigate('/donor/register');
      return;
    }
    if (!id) return;

    setActionLoading(true);
    try {
      const res = await offerDonationApi(id);
      onToast(res.message || (isBn ? 'ধন্যবাদ! আপনি রক্তদানে এগিয়ে এসেছেন।' : 'Thank you! You have stepped forward to donate.'));
      await loadData();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || (isBn ? 'রক্তদানের সম্মতি পাঠাতে ব্যর্থ হয়েছে।' : 'Failed to volunteer for donation.');
      onToast(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStepperUpdate = async (matchId: number, status: 'DONOR_TRAVELLING' | 'DONOR_ARRIVED' | 'DONATION_COMPLETED') => {
    setActionLoading(true);
    try {
      await updateMatchStatusApi(matchId, status);
      const statusLabels = {
        DONOR_TRAVELLING: isBn ? 'অবস্থা: রওনা হয়েছেন' : 'Status: On the Way',
        DONOR_ARRIVED: isBn ? 'অবস্থা: হাসপাতালে পৌঁছেছেন' : 'Status: Arrived at Facility',
        DONATION_COMPLETED: isBn ? 'অভিনন্দন! রক্তদান সফলভাবে সম্পন্ন হয়েছে। সার্টিফিকেট প্রদান করা হয়েছে।' : 'Donation confirmed! Certificate awarded.',
      };
      onToast(statusLabels[status]);
      await loadData();
    } catch (err: any) {
      onToast(err?.response?.data?.message || (isBn ? 'অবস্থা আপডেট করা যায়নি।' : 'Failed to update status.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newMsg.trim() || sendingMsg) return;

    setSendingMsg(true);
    try {
      const msg = await sendCaseMessageApi(id, newMsg.trim());
      setMessages((prev) => [...prev, msg]);
      setNewMsg('');
    } catch {
      onToast(isBn ? 'মেসেজ পাঠাতে ব্যর্থ হয়েছে।' : 'Failed to send message.');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleShare = () => {
    if (!request) return;
    const url = window.location.href;
    const text = `URGENT BLOOD NEEDED (${request.blood_group}) at ${request.hospital} — RoktoLinkBD: ${url}`;
    if (navigator.share) {
      navigator.share({ title: 'RoktoLinkBD Urgent Request', text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      onToast(isBn ? 'লিংক ক্লিপবোর্ডে কপি করা হয়েছে!' : 'Link copied to clipboard!');
    }
  };

  const getActiveStageIndex = (status?: string) => {
    const s = status || request?.status || 'SEARCHING';
    if (s === 'DONATION_COMPLETED' || s === 'FULFILLED') return 6;
    if (s === 'DONOR_ARRIVED') return 5;
    if (s === 'DONOR_TRAVELLING') return 4;
    if (s === 'DONOR_ACCEPTED' || s === 'CONTACT_SHARED') return 3;
    if (s === 'DONORS_NOTIFIED') return 1;
    const idx = LIFECYCLE_STAGES.findIndex((st) => st.key === s);
    return idx >= 0 ? idx : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex justify-center">
        <div className="w-10 h-10 rounded-full border-3 border-red-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-5 text-center max-w-md mx-auto">
        <div className="p-8 rounded-3xl bg-white border border-red-100 shadow-xl">
          <p className="text-red-600 font-bold mb-3">{error || 'Request Not Found'}</p>
          <Link to="/requests" className="btn-primary px-6 py-2.5 rounded-xl font-bold text-xs inline-block">
            {isBn ? 'অনুরোধের তালিকায় ফিরে যান' : 'Back to Requests'}
          </Link>
        </div>
      </div>
    );
  }

  const activeStage = getActiveStageIndex(coordination?.status || request.status);
  const isFulfilled = request.status === 'FULFILLED' || coordination?.status === 'FULFILLED';
  const myAcceptedMatch = coordination?.accepted_donors?.find((d) => d.donor_name === user?.name || user?.is_donor);
  const isRequester = coordination?.requester?.phone === user?.phone || false;

  return (
    <div className="min-h-screen pt-28 pb-20 px-5 max-w-5xl mx-auto space-y-8">
      <Link
        to="/requests"
        className="inline-flex items-center gap-2 text-xs font-bold text-red-700 hover:text-red-900 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span>{isBn ? 'সব অনুরোধে ফিরে যান' : 'Back to Requests'}</span>
      </Link>

      {/* Main Request Card */}
      <div className="rounded-3xl bg-white border border-red-100 p-7 sm:p-10 shadow-2xl shadow-red-950/5 relative overflow-hidden space-y-8">
        {/* Header Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-red-100/70">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-red-500/20">
              {request.blood_group}
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-zinc-400">{request.code}</span>
              <h1 className="text-2xl font-black text-zinc-900">
                {request.component} • {request.units} {isBn ? 'ব্যাগ প্রয়োজন' : 'Bag(s) Needed'}
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">{request.hospital} • {request.address}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-extrabold px-3.5 py-1.5 rounded-full ${
                isFulfilled
                  ? 'bg-emerald-600 text-white'
                  : request.urgency === 'EMERGENCY_NOW'
                  ? 'bg-red-600 text-white'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {isFulfilled ? (isBn ? 'সম্পন্ন' : 'FULFILLED') : request.urgency.replace(/_/g, ' ')}
            </span>

            <button
              onClick={handleShare}
              className="py-1.5 px-3 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-700 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>🔗</span>
              <span>{isBn ? 'শেয়ার' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* SECTION 1: Visual Lifecycle Stepper */}
        <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-700">
            <span className="uppercase tracking-wider text-red-700">
              {isBn ? 'কেস সমন্বয় ও অগ্রগতি' : 'Case Coordination & Lifecycle Tracker'}
            </span>
            <span className="text-zinc-500 font-mono">
              Stage {activeStage + 1} of {LIFECYCLE_STAGES.length}
            </span>
          </div>

          {/* Stepper bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {LIFECYCLE_STAGES.map((st, idx) => {
              const isPast = idx < activeStage;
              const isCurrent = idx === activeStage;
              return (
                <div
                  key={st.key}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? 'bg-red-600 border-red-600 text-white shadow-md shadow-red-500/20'
                      : isPast
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-white border-zinc-200 text-zinc-400 opacity-60'
                  }`}
                >
                  <div className="text-[10px] font-black uppercase mb-0.5">
                    {isPast ? '✓' : idx + 1}
                  </div>
                  <div className="text-[11px] font-bold leading-tight">
                    {isBn ? st.labelBn : st.labelEn}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: DONATION ACTION HERO BANNER */}
        {!isFulfilled && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-red-50 via-rose-50 to-amber-50 border-2 border-red-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="space-y-1.5 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800 text-[11px] font-extrabold uppercase tracking-wider">
                <span>🩸</span>
                <span>{isBn ? 'জীবন বাঁচানোর সরাসরি সুযোগ' : 'Direct Lifesaver Opportunity'}</span>
              </div>
              <h3 className="text-lg font-black text-zinc-900">
                {isBn
                  ? 'আপনি কি এই রোগীর জন্য রক্ত দিতে পারেন?'
                  : 'Can you step forward to donate for this patient?'}
              </h3>
              <p className="text-xs text-zinc-600 max-w-xl">
                {isBn
                  ? 'সম্মতি দিলে আবেদনকারীর সাথে সরাসরি যোগাযোগ ও সমন্বয় করতে পারবেন। প্রতিটি নিশ্চিত রক্তদানে ডিজিটাল সার্টিফিকেট ও লাইফসেভার ওয়ালে স্থান পাবেন।'
                  : 'Volunteering safely unlocks direct phone coordination with the patient family. Every verified donation earns a cryptographic certificate.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              {isRequester ? (
                <div className="px-5 py-3 rounded-2xl bg-zinc-100 text-zinc-700 text-xs font-bold border border-zinc-200 flex items-center gap-2">
                  <span>👤</span>
                  <span>{isBn ? 'আপনি এই অনুরোধের আবেদনকারী।' : 'You created this blood request.'}</span>
                </div>
              ) : coordination?.is_authorized && myAcceptedMatch ? (
                /* Stepper Action Buttons for the Accepted Donor */
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => handleStepperUpdate(myAcceptedMatch.match_id, 'DONOR_TRAVELLING')}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    🚗 {isBn ? 'রওনা হয়েছি' : 'On the Way'}
                  </button>
                  <button
                    onClick={() => handleStepperUpdate(myAcceptedMatch.match_id, 'DONOR_ARRIVED')}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    🏥 {isBn ? 'হাসপাতালে পৌঁছেছি' : 'Arrived at Facility'}
                  </button>
                  <button
                    onClick={() => handleStepperUpdate(myAcceptedMatch.match_id, 'DONATION_COMPLETED')}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    ✅ {isBn ? 'রক্তদান সম্পন্ন' : 'Donation Completed'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleOfferDonation}
                  disabled={actionLoading}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-black text-sm shadow-lg shadow-red-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {actionLoading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <span>❤️</span>
                      <span>{isBn ? 'আমি রক্ত দিতে চাই' : 'I Want to Donate Blood'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* SECTION 3: Controlled Contact Sharing (Protected vs Unlocked) */}
        <div className="rounded-2xl p-6 border transition-all">
          {coordination?.is_authorized ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-base font-extrabold text-zinc-900">
                  {isBn ? '🔓 অনুমোদিত যোগাযোগের তথ্য (Mutual Contact Unlocked)' : '🔓 Mutual Contact & Direct Coordination Unlocked'}
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Requester Contact */}
                <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                  <span className="text-xs uppercase font-extrabold text-zinc-500 block">
                    {isBn ? 'আবেদনকারী / রোগীর তথ্য' : 'Requester & Patient Details'}
                  </span>
                  <div>
                    <p className="font-extrabold text-base text-zinc-900">{coordination.requester.name}</p>
                    <p className="text-xs text-zinc-500 font-semibold">Relation: {coordination.requester.relation}</p>
                  </div>
                  <div className="pt-2 border-t border-zinc-200">
                    <p className="text-xs text-zinc-500 font-bold mb-1">Direct Contact Phone:</p>
                    <a
                      href={`tel:${coordination.requester.phone}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-xs"
                    >
                      <span>📞</span>
                      <span>Call {coordination.requester.phone}</span>
                    </a>
                  </div>
                </div>

                {/* Accepted Donors */}
                <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                  <span className="text-xs uppercase font-extrabold text-emerald-800 block">
                    {isBn ? 'সম্মতিপ্রাপ্ত রক্তদাতা' : 'Confirmed Matched Donor(s)'}
                  </span>
                  {coordination.accepted_donors.length > 0 ? (
                    <div className="space-y-3">
                      {coordination.accepted_donors.map((d) => (
                        <div key={d.match_id} className="space-y-2">
                          <div>
                            <p className="font-extrabold text-base text-zinc-900 flex items-center gap-2">
                              <span>{d.donor_name}</span>
                              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-700">
                                {d.blood_group}
                              </span>
                            </p>
                            <p className="text-xs text-zinc-500 font-mono">{d.public_code} • {d.distance_km} km away</p>
                          </div>
                          <a
                            href={`tel:${d.donor_phone}`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                          >
                            <span>📞</span>
                            <span>Call Donor ({d.donor_phone})</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">
                      {isBn ? 'দাতা সম্মতি দিলে তাঁর ফোন নম্বর এখানে দেখতে পাবেন।' : 'Donor contact will appear here once accepted.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Privacy Protected View for Public Visitors */
            <div className="bg-red-50/60 rounded-2xl border border-red-200/80 p-6 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center text-2xl shrink-0">
                🔒
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-red-950">
                  {isBn ? 'নিরাপদ যোগাযোগ নীতি সক্রিয় (Privacy Shield Active)' : 'Privacy Shield Active — Anti-Spam Protection'}
                </h4>
                <p className="text-xs text-zinc-600 leading-relaxed max-w-xl">
                  {isBn
                    ? 'রক্তদাতা ও রোগীর নিরাপত্তা রক্ষার্থে যোগাযোগের নম্বর উন্মুক্ত তালিকায় দেখানো হয় না। শুধুমাত্র ম্যাচিং ইঞ্জিনের মাধ্যমে সম্মতিপ্রাপ্ত রক্তদাতা এবং আবেদনকারী পরস্পরকে ফোন করতে ও সমন্বয় করতে পারেন।'
                    : 'To prevent commercial scraping and harassment, private phone numbers are never shown publicly. Full contact and calling capabilities are unlocked mutually once an eligible donor accepts this emergency request.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: In-Case Coordination Chat (Available for authorized parties) */}
        {coordination?.is_authorized && (
          <div className="p-6 rounded-2xl bg-white border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
                <span>💬</span>
                <span>{isBn ? 'কেস সমন্বয় লাইভ চ্যাট' : 'Direct Case Coordination Chat'}</span>
              </h3>
              <span className="text-[11px] text-zinc-400 font-semibold">
                {isBn ? 'হাসপাতালের ওয়ার্ড/কেবিন ও পৌঁছানোর তথ্য বিনিময় করুন' : 'Coordinate ward, floor & arrival details'}
              </span>
            </div>

            {/* Messages box */}
            <div className="h-64 overflow-y-auto p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-10 text-xs text-zinc-400 italic">
                  {isBn ? 'এখনো কোনো বার্তা পাঠানো হয়নি। প্রয়োজনীয় তথ্য লিখতে পারেন।' : 'No coordination messages yet. Say hello or share the hospital ward.'}
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[80%] ${msg.is_me ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <span className="text-[10px] font-bold text-zinc-400 mb-0.5 px-1">{msg.sender_name}</span>
                    <div
                      className={`py-2 px-3.5 rounded-2xl text-xs ${
                        msg.is_me
                          ? 'bg-red-600 text-white rounded-tr-xs'
                          : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-xs'
                      }`}
                    >
                      {msg.message}
                    </div>
                    <span className="text-[9px] text-zinc-400 mt-0.5 px-1">{msg.created_at}</span>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder={isBn ? 'যেমন: আমরা ৩য় তলায় আইসিইউ এর সামনে আছি…' : 'e.g., We are outside the 3rd floor ICU…'}
                className="flex-1 px-4 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!newMsg.trim() || sendingMsg}
                className="py-2 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
              >
                {isBn ? 'পাঠান' : 'Send'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestDetail;
