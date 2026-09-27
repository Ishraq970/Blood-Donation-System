import { sendBotMessage, type RoktoBotResponse } from '../api';

export interface BotProcessResult {
  reply: string;
  source: string;
  intent: string;
  canEscalate?: boolean;
  isOffTopic?: boolean;
  confidence?: number;
  suggestions?: string[];
  badge?: {
    text: string;
    icon: string;
    variant: 'emerald' | 'amber' | 'blue' | 'zinc' | 'red';
  };
}

/**
 * RoktoBot Natural Language Engine (Frontend)
 *
 * Implements client-side natural language coordination,
 * relevance filtering, and interacts with the backend's
 * LLM-powered SQL intent understanding layer.
 */
class RoktoBotEngine {
  /**
   * Domain keywords related to blood donation & RoktoLinkBD
   */
  private readonly domainKeywords = [
    'blood', 'donor', 'donate', 'donation', 'request', 'recipient', 'roktolink',
    'volunteer', 'hospital', 'patient', 'abo', 'transfusion', 'certificate',
    'account', 'password', 'login', 'register', 'email', 'verify', 'cancel',
    'status', 'availability', 'notification', 'fake', 'safe', 'urgent', 'emergency',
    'রক্ত', 'রক্তদান', 'দাতা', 'রোগী', 'হাসপাতাল', 'অনুরোধ', 'স্বেচ্ছাসেবক',
    'পাসওয়ার্ড', 'লগইন', 'যাচাই', 'সার্টিফিকেট', 'গ্রুপ', 'জরুরি',
  ];

  /**
   * Off-topic trigger keywords (clearly unrelated to blood donation)
   */
  private readonly offTopicTriggers = [
    'python', 'javascript', 'java', 'c++', 'html', 'css', 'coding', 'code', 'algorithm',
    'weather', 'forecast', 'rain today', 'temperature',
    'recipe', 'cook', 'pizza', 'burger', 'biryani', 'pasta', 'baking', 'restaurant',
    'football', 'cricket', 'messi', 'ronaldo', 'world cup', 'ipl', 'bpl', 'match score',
    'movie', 'song', 'actor', 'actress', 'cinema', 'game', 'gaming', 'minecraft',
    'capital of', 'president of', 'prime minister', 'election', 'politics',
    'math', 'algebra', 'solve equation', 'homework', 'essay',
    'joke', 'riddle', 'poem', 'story about',
  ];

  /**
   * Pre-check if a query is clearly off-topic before calling backend.
   */
  public isOffTopicQuery(query: string): boolean {
    const lower = query.toLowerCase().trim();

    // If query has blood donation domain terms, it's not off-topic
    for (const dk of this.domainKeywords) {
      if (lower.includes(dk)) {
        return false;
      }
    }

    // If query contains obvious off-topic keywords, mark as off-topic
    for (const trigger of this.offTopicTriggers) {
      if (lower.includes(trigger)) {
        return true;
      }
    }

    // Prefixes that indicate general trivia
    const prefixes = [
      'who is the president', 'who is the prime minister', 'what is the capital of',
      'how to cook', 'how to make a cake', 'tell me a joke', 'write a poem',
      'write a python', 'write a script', 'what is 2 + 2',
    ];
    for (const prefix of prefixes) {
      if (lower.startsWith(prefix)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Return the off-topic warning message.
   */
  public getOffTopicMessage(isBn: boolean): string {
    return isBn
      ? 'আমি রক্তবট — শুধুমাত্র রক্তলিংকবিডি রক্তদান সেবার সহায়তার জন্য নিয়োজিত। অনুগ্রহ করে রক্তদান, রক্তের অনুরোধ, রক্তদাতা বা এই প্ল্যাটফর্ম সম্পর্কিত প্রশ্ন করুন।'
      : 'I am RoktoBot, specifically designed to assist with RoktoLinkBD blood donation services. Please ask questions related to blood donation, blood requests, donors, or using this platform.';
  }

  /**
   * Return the fallback message when no matching SQL answer exists.
   */
  public getFallbackMessage(isBn: boolean): string {
    return isBn
      ? "আমার কাছে এ সম্পর্কিত নির্দিষ্ট তথ্য পাওয়া যায়নি। অনুগ্রহ করে আপনার প্রশ্নটি অন্যভাবে লিখুন।\n\n💡 **আপনি নিচের প্রশ্নগুলো জিজ্ঞেস করতে পারেন:**\n• কীভাবে রক্তের অনুরোধ তৈরি করব?\n• কীভাবে রক্তদাতা হব?\n• RoktoLinkBD কী এবং এর কাজ কী?\n• আমার ফোন নম্বর কি প্রকাশ্যে দেখা যাবে?"
      : "I couldn't find information about that in my available knowledge. Could you rephrase your question?\n\n💡 **Here are some questions you can ask me:**\n• How do I create a blood request?\n• How do I become a blood donor?\n• What is RoktoLinkBD?\n• Will my personal information be shown publicly?";
  }

  /**
   * Process a user message through the LLM / Backend AI layer.
   */
  public async processMessage(
    userText: string,
    isBn: boolean,
    sessionId: string
  ): Promise<BotProcessResult> {
    const trimmed = userText.trim();
    const locale = isBn ? 'bn' : 'en';

    // 1. Client-side rapid relevance filter
    if (this.isOffTopicQuery(trimmed)) {
      return {
        reply: this.getOffTopicMessage(isBn),
        source: 'IRRELEVANT_FILTER',
        intent: 'OFF_TOPIC',
        isOffTopic: true,
        canEscalate: false,
        confidence: 95,
        badge: {
          text: isBn ? 'ওয়েবসাইট সম্পর্কিত নয়' : 'Site-Relevant Question Only',
          icon: '🛡️',
          variant: 'amber',
        },
      };
    }

    // 2. Query the backend LLM understanding layer
    try {
      const response: RoktoBotResponse = await sendBotMessage(trimmed, locale, sessionId);
      const source = response.source || 'GENERAL';

      let badge: BotProcessResult['badge'];
      if (source === 'KB' || source === 'KB_RAG') {
        badge = {
          text: isBn ? 'অফিসিয়াল জ্ঞানভাণ্ডার উত্তর' : 'Official Knowledge Base Answer',
          icon: '📖',
          variant: 'emerald',
        };
      } else if (source === 'DATABASE_QUERY') {
        badge = {
          text: isBn ? 'লাইভ ডেটাবেজ রেকর্ড' : 'Live Database Record',
          icon: '⚡',
          variant: 'blue',
        };
      } else if (source === 'IRRELEVANT_FILTER') {
        badge = {
          text: isBn ? 'ওয়েবসাইট সম্পর্কিত নয়' : 'Site-Relevant Question Only',
          icon: '🛡️',
          variant: 'amber',
        };
      } else if (source === 'FALLBACK') {
        badge = {
          text: isBn ? 'প্রশ্ন পুনরায় লিখুন' : 'Rephrase Suggested',
          icon: '💡',
          variant: 'zinc',
        };
      }

      const defaultFallbackSuggestions = isBn
        ? [
            'কীভাবে রক্তের অনুরোধ তৈরি করব?',
            'কীভাবে রক্তদাতা হব?',
            'RoktoLinkBD কী?',
            'আমার ফোন নম্বর কি প্রকাশ্যে দেখা যাবে?',
          ]
        : [
            'How do I create a blood request?',
            'How do I become a blood donor?',
            'What is RoktoLinkBD?',
            'Will my personal information be shown publicly?',
          ];

      return {
        reply: response.reply,
        source: response.source,
        intent: response.intent || 'GENERAL',
        canEscalate: response.can_escalate,
        isOffTopic: source === 'IRRELEVANT_FILTER',
        suggestions: response.suggestions || (source === 'FALLBACK' ? defaultFallbackSuggestions : undefined),
        badge,
      };
    } catch (err: any) {
      // If server unreachable, check offline knowledge for common natural phrasing
      const offlineReply = this.tryOfflineKnowledge(trimmed, isBn);
      if (offlineReply) {
        return {
          reply: offlineReply,
          source: 'KB_OFFLINE',
          intent: 'OFFLINE_MATCH',
          badge: {
            text: isBn ? 'সংরক্ষিত তথ্য' : 'Cached Knowledge',
            icon: '📋',
            variant: 'zinc',
          },
        };
      }
      throw err;
    }
  }

  /**
   * Offline emergency cache for core questions if backend server temporarily disconnects
   */
  private tryOfflineKnowledge(query: string, isBn: boolean): string | null {
    const lower = query.toLowerCase();
    const normalised = lower.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim();
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'assalamu alaikum', 'salam', 'হাই', 'হ্যালো', 'আসসালামু আলাইকুম', 'সালাম'];

    if (greetings.includes(normalised)) {
      return isBn
        ? 'আসসালামু আলাইকুম! আমি **RoktoBot**। রক্তের অনুরোধ, দাতা নিবন্ধন, রক্তের গ্রুপ, স্বেচ্ছাসেবকতা এবং RoktoLinkBD ব্যবহার সম্পর্কে সাহায্য করতে পারি। জরুরি অবস্থায় **৯৯৯** কল করুন।'
        : 'Hello! I’m **RoktoBot**. I can help with blood requests, donor registration, blood groups, volunteering, and using RoktoLinkBD. For emergencies, call **999**.';
    }

    if (['who are you', 'who r you', 'what are you', 'what is your name', 'তুমি কে', 'আপনি কে'].includes(normalised)) {
      return isBn
        ? 'আমি **RoktoBot**, RoktoLinkBD-এর তথ্য ও সমন্বয় সহকারী। রক্তের অনুরোধ, দাতা, স্বেচ্ছাসেবকতা, গোপনীয়তা এবং প্ল্যাটফর্ম ব্যবহারে সাহায্য করি। জীবন-সংশয়ী জরুরি অবস্থায় **৯৯৯** কল করুন।'
        : 'I’m **RoktoBot**, RoktoLinkBD’s information and coordination assistant. I can help with blood requests, donors, volunteering, privacy, and using the platform. For emergencies, call **999**.';
    }

    if (lower.includes('what is roktolink') || lower.includes('about') || lower.includes('রক্তলিংক কি')) {
      return isBn
        ? 'RoktoLinkBD (রক্তলিংকবিডি) বাংলাদেশ জুড়ে জরুরি রক্তদান সমন্বয় প্ল্যাটফর্ম। এর উদ্দেশ্য রোগী ও দাতাদের সরাসরি যুক্ত করা।'
        : 'RoktoLinkBD is a nationwide emergency blood donation platform in Bangladesh connecting patients with volunteer donors.';
    }

    if (lower.includes('donor') && (lower.includes('find') || lower.includes('need') || lower.includes('get') || lower.includes('খুঁজ'))) {
      return isBn
        ? 'রক্তদাতা খুঁজতে /requests/create পেজ থেকে একটি অনুরোধ তৈরি করুন অথবা ড্যাশবোর্ড থেকে রক্তদাতা সন্ধান ফিল্টার ব্যবহার করুন।'
        : 'To find a blood donor, create a blood request at /requests/create or search donors from the Find Donors directory.';
    }

    return null;
  }
}

export const roktoBotEngine = new RoktoBotEngine();
