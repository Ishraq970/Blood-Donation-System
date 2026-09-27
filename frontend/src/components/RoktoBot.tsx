import React, { useState, useRef, useEffect } from 'react';
import { escalateChatApi, sendChatFeedbackApi } from '../api';
import { roktoBotEngine, type BotProcessResult } from '../services/roktoBotEngine';

interface RoktoBotProps {
  isBn: boolean;
}

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  source?: string;
  canEscalate?: boolean;
  feedbackGiven?: 'up' | 'down';
  id: string;
  badge?: BotProcessResult['badge'];
  suggestions?: string[];
}

const QUICK_CHIPS_EN = [
  { label: '🩸 O+ Donors in Dhaka',   query: 'How many O+ donors available in Dhaka?' },
  { label: '📊 Live Platform Stats',   query: 'Show me live platform statistics' },
  { label: '🏆 Wall of Lifesavers',    query: 'How many lifesavers on the wall?' },
  { label: '❓ How to Request Blood',  query: 'How do I request blood?' },
  { label: '❤️ Same-Group Rule',       query: 'Can another blood group donate to me?' },
  { label: '🤝 Volunteer Program',     query: 'How can I become a volunteer?' },
];

const QUICK_CHIPS_BN = [
  { label: '🩸 ঢাকায় O+ রক্তদাতা',    query: 'ঢাকায় কতজন O+ রক্তদাতা আছেন?' },
  { label: '📊 লাইভ পরিসংখ্যান',       query: 'প্ল্যাটফর্ম পরিসংখ্যান দেখতে চাই' },
  { label: '🏆 লাইফসেভার্স',           query: 'সম্মাননা প্রাচীরে কতজন আছেন?' },
  { label: '❓ রক্ত অনুরোধের নিয়ম',    query: 'কীভাবে রক্তের অনুরোধ করব?' },
  { label: '❤️ একই গ্রুপ নীতি',        query: 'অন্য গ্রুপের রক্ত কি দান করা যাবে?' },
  { label: '🤝 ভলান্টিয়ার প্রোগ্রাম', query: 'আমি Volunteer হতে চাই' },
];

const makeId = () => Math.random().toString(36).slice(2, 10);

const makeGreeting = (isBn: boolean): ChatMsg => ({
  id: makeId(),
  role: 'assistant',
  source: 'SYSTEM',
  content: isBn
    ? "আসসালামু আলাইকুম! আমি **RoktoBot** — RoktoLinkBD-এর লাইভ তথ্য সহকারী। 🩸\n\n📌 দাতা খোঁজার সময় ABO/Rh সামঞ্জস্য বিবেচনা করা হয়; চূড়ান্ত গ্রুপিং ও ক্রস-ম্যাচিং অনুমোদিত হাসপাতাল বা ব্লাড ব্যাংক করবে।\n\nনিচের অপশন বেছে নিন বা প্রশ্ন টাইপ করুন!"
    : "Hello! I'm **RoktoBot** — RoktoLinkBD's live information assistant. 🩸\n\n📌 Donor matching considers ABO/Rh compatibility. A licensed hospital or blood bank must perform final typing and cross-matching.\n\nChoose a quick question or ask me anything!",
});

// Render **bold** markdown and newlines
function RenderContent({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, li) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={li} className="block leading-relaxed">
            {parts.map((part, pi) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={pi} className="font-extrabold">{part.slice(2, -2)}</strong>
                : <span key={pi}>{part}</span>
            )}
            {li < text.split('\n').length - 1 && line === '' && <span className="block h-1" />}
          </span>
        );
      })}
    </>
  );
}

const RoktoBot: React.FC<RoktoBotProps> = ({ isBn: propIsBn }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isBn, setIsBn] = useState(propIsBn);
  const [messages, setMessages] = useState<ChatMsg[]>([makeGreeting(propIsBn)]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [escalationDone, setEscalationDone] = useState<string | null>(null);
  const [sessionId] = useState(() => `fe-${makeId()}`);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync language from parent
  useEffect(() => { setIsBn(propIsBn); }, [propIsBn]);

  // Auto-scroll on new messages / typing
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;

    setInput('');
    const userMsg: ChatMsg = { id: makeId(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await roktoBotEngine.processMessage(text, isBn, sessionId);
      const botMsg: ChatMsg = {
        id: makeId(),
        role: 'assistant',
        content: res.reply,
        source: res.source,
        canEscalate: res.canEscalate,
        badge: res.badge,
        suggestions: res.suggestions,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      const errMsg: ChatMsg = {
        id: makeId(),
        role: 'assistant',
        source: 'ERROR',
        content: isBn
          ? '⚠️ সার্ভারের সাথে সংযোগ করা সম্ভব হয়নি। ব্যাকএন্ড সার্ভার চালু আছে কিনা নিশ্চিত করুন।\n\nজরুরি প্রয়োজনে: 📞 **৯৯৯**'
          : '⚠️ Could not connect to the server. Please ensure the backend is running.\n\nFor emergencies call: 📞 **999**',
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([makeGreeting(isBn)]);
    setEscalationDone(null);
    setInput('');
  };

  const handleEscalate = async (reason: string) => {
    setEscalating(true);
    try {
      await escalateChatApi({ session_id: sessionId, reason });
      setEscalationDone(
        isBn
          ? '✅ আপনার অনুরোধ আমাদের স্বেচ্ছাসেবক দলে পাঠানো হয়েছে। শীঘ্রই একজন সদস্য যোগাযোগ করবেন।'
          : '✅ Your case has been escalated to our volunteer network. Someone will contact you shortly.'
      );
    } catch {
      setEscalationDone(isBn ? '⚠️ অনুরোধ পাঠানো যায়নি।' : '⚠️ Failed to escalate. Please try again.');
    } finally {
      setEscalating(false);
    }
  };

  const handleFeedback = async (msgId: string, rating: 1 | -1, responseText: string) => {
    setMessages(prev =>
      prev.map(m => m.id === msgId ? { ...m, feedbackGiven: rating === 1 ? 'up' : 'down' } : m)
    );
    try {
      await sendChatFeedbackApi({ session_id: sessionId, rating, response_text: responseText });
    } catch { /* non-blocking */ }
  };

  const chips = isBn ? QUICK_CHIPS_BN : QUICK_CHIPS_EN;
  const showChips = messages.length <= 1;

  return (
    // Wrapper — matches backend: fixed bottom-6 right-6, flex-col items-end gap-3
    <div className="fixed bottom-6 right-6 z-[99999] flex flex-col items-end gap-3">

      {/* ── CHAT PANEL ── */}
      <div
        style={{
          display: isOpen ? 'flex' : 'none',
          height: '600px',
          maxHeight: '86vh',
          width: '420px',
          maxWidth: 'calc(100vw - 2rem)',
          flexDirection: 'column',
        }}
        className="bg-white rounded-3xl shadow-2xl border border-red-100 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.894 1.37 5.483 3.525 7.238l-.88 3.302a.5.5 0 0 0 .678.598l3.765-1.695A10.56 10.56 0 0 0 12 20.486c5.523 0 10-4.145 10-9.243S17.523 2 12 2z"/>
                </svg>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-wide">RoktoBot</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white/20 tracking-wider uppercase border border-white/25">
                  AI Info
                </span>
              </div>
              <p className="text-red-100 text-[11px] font-medium flex items-center gap-1 mt-0.5">
                <span>●</span>
                <span>{isBn ? 'রিয়েল ডাটাবেস সংযুক্ত' : 'Live Database Connected'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Language toggle */}
            <button
              onClick={() => setIsBn(b => !b)}
              className="px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-[11px] font-bold transition-all cursor-pointer"
              title={isBn ? 'Switch to English' : 'বাংলায় দেখুন'}
            >
              {isBn ? 'EN' : 'বাং'}
            </button>
            {/* Reset */}
            <button
              onClick={handleReset}
              title={isBn ? 'নতুন চ্যাট' : 'Reset Chat'}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm transition-colors cursor-pointer"
            >
              🔄
            </button>
            {/* Close */}
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close Chat"
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quick Chips Bar — only shown before first real exchange */}
        {showChips && (
          <div
            className="px-3.5 py-2.5 bg-zinc-50 border-b border-zinc-200 overflow-x-auto flex gap-1.5 flex-shrink-0"
            style={{ scrollbarWidth: 'none' }}
          >
            {chips.map((chip, i) => (
              <button
                key={i}
                onClick={() => handleSend(chip.query)}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 border border-zinc-200 hover:border-red-300 text-zinc-700 hover:text-red-700 text-[11px] font-bold whitespace-nowrap shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* Messages Window */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-zinc-50 to-white"
        >
          {messages.map(msg => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {/* Label row */}
              <span className="text-[10px] font-bold text-zinc-400 mb-1 px-1 flex items-center gap-1.5">
                {msg.role === 'user'
                  ? (isBn ? 'আপনি' : 'You')
                  : (
                    <>
                      RoktoBot
                      {msg.badge ? (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold inline-flex items-center gap-1 ${
                          msg.badge.variant === 'emerald' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          msg.badge.variant === 'amber' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          msg.badge.variant === 'blue' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-zinc-100 text-zinc-600 border border-zinc-200'
                        }`}>
                          <span>{msg.badge.icon}</span>
                          <span>{msg.badge.text}</span>
                        </span>
                      ) : (
                        msg.source && !['SYSTEM', 'USER', 'ERROR'].includes(msg.source) && (
                          <span className="px-1.5 rounded bg-zinc-200/80 text-zinc-600 font-mono text-[9px]">
                            {msg.source}
                          </span>
                        )
                      )}
                    </>
                  )
                }
              </span>

              {/* Bubble */}
              {msg.role === 'user' ? (
                <div className="max-w-[88%] bg-gradient-to-br from-red-600 to-rose-700 text-white text-xs px-4 py-3 rounded-2xl rounded-tr-sm shadow-md">
                  {msg.content}
                </div>
              ) : (
                <div className={`max-w-[88%] text-xs px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm leading-relaxed ${
                  msg.source === 'ERROR'
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-white border border-zinc-200 text-zinc-800'
                }`}>
                  <RenderContent text={msg.content} />

                  {/* Feedback buttons — for non-system, non-error bot messages */}
                  {msg.source !== 'SYSTEM' && msg.source !== 'ERROR' && (
                    <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-end gap-1">
                      <span className="text-[10px] text-zinc-400 mr-auto">
                        {isBn ? 'সহায়ক ছিল?' : 'Helpful?'}
                      </span>
                      <button
                        onClick={() => handleFeedback(msg.id, 1, msg.content)}
                        disabled={!!msg.feedbackGiven}
                        className={`p-1 rounded-md transition-colors cursor-pointer text-sm ${
                          msg.feedbackGiven === 'up' ? 'text-emerald-600 bg-emerald-50' : 'hover:text-zinc-700 text-zinc-400'
                        }`}
                        title="Helpful"
                      >
                        👍
                      </button>
                      <button
                        onClick={() => handleFeedback(msg.id, -1, msg.content)}
                        disabled={!!msg.feedbackGiven}
                        className={`p-1 rounded-md transition-colors cursor-pointer text-sm ${
                          msg.feedbackGiven === 'down' ? 'text-rose-600 bg-rose-50' : 'hover:text-zinc-700 text-zinc-400'
                        }`}
                        title="Not helpful"
                      >
                        👎
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Interactive Suggested Questions Chips */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 max-w-[90%]">
                  {msg.suggestions.map((suggestion, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSend(suggestion)}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded-xl bg-red-50/80 hover:bg-red-100 text-red-800 border border-red-200 text-[11px] font-bold transition-all cursor-pointer text-left shadow-xs hover:shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <span className="text-red-500">💬</span>
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Human escalation button */}
              {msg.canEscalate && !escalationDone && (
                <div className="mt-2">
                  <button
                    onClick={() => handleEscalate(msg.content)}
                    disabled={escalating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    🤝 {escalating
                      ? (isBn ? 'সংযুক্ত হচ্ছে…' : 'Connecting…')
                      : (isBn ? 'স্বেচ্ছাসেবকের সহায়তা চান' : 'Connect with Volunteer')
                    }
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Escalation success message */}
          {escalationDone && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              {escalationDone}
            </div>
          )}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-start">
              <div className="bg-white border border-zinc-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[11px] font-bold text-zinc-400 ml-2">
                    {isBn ? 'উপাত্ত যাচাই হচ্ছে…' : 'Searching live database…'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="border-t border-zinc-200 bg-white px-3.5 py-3 flex-shrink-0">
          <form
            onSubmit={e => { e.preventDefault(); handleSend(); }}
            className="flex gap-2 items-center"
          >
            <input
              ref={inputRef}
              type="text"
              id="roktobot-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isBn ? 'রক্তদাতা, গ্রুপ বা নিয়ম জানতে লিখুন…' : 'Ask about donors, blood groups, or rules…'}
              maxLength={500}
              autoComplete="off"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white text-zinc-900 placeholder-zinc-400 font-medium transition-all disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send"
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-40 shadow-md cursor-pointer"
            >
              {isLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              )}
            </button>
          </form>
          <p className="text-center text-[10px] text-zinc-400 mt-2">
            ⚠️ {isBn ? 'জরুরি অবস্থায় ৯৯৯ কল করুন • চূড়ান্ত ক্রস-ম্যাচ হাসপাতাল করবে' : 'For emergencies call 999 • Hospital performs final cross-match'}
          </p>
        </div>
      </div>

      {/* ── FAB BUTTON ── */}
      <button
        id="roktobot-fab"
        onClick={() => setIsOpen(o => !o)}
        title="RoktoBot — AI Info Assistant"
        aria-label="Open RoktoBot"
        className={`w-14 h-14 rounded-2xl text-white shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center relative border border-white/25 cursor-pointer ${
          isOpen
            ? 'bg-gradient-to-br from-zinc-800 to-zinc-950'
            : 'bg-gradient-to-br from-red-600 via-rose-600 to-red-800 ring-4 ring-red-500/20'
        }`}
      >
        {isOpen ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <div className="relative flex items-center justify-center">
            {/* Assistant avatar: visually distinct from a generic message icon. */}
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4" y="6" width="16" height="13" rx="5" fill="currentColor" fillOpacity=".16" />
              <path strokeLinecap="round" d="M12 3v3M9 12h.01M15 12h.01M9 15.2c1.8 1.2 4.2 1.2 6 0M4 12H2.5M21.5 12H20" />
              <circle cx="9" cy="12" r=".8" fill="currentColor" stroke="none" />
              <circle cx="15" cy="12" r=".8" fill="currentColor" stroke="none" />
            </svg>
            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
          </div>
        )}
      </button>
    </div>
  );
};

export default RoktoBot;
