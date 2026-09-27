<?php

namespace App\Services;

use App\Models\BotChatLog;
use App\Models\BloodRequest;
use App\Models\Donation;
use App\Models\DonorProfile;
use App\Models\KnowledgeArticle;
use App\Models\ChatEscalation;
use App\Models\UserAiPreference;
use Illuminate\Support\Facades\Log;

/**
 * RoktoBotService — INFO-ONLY AI Assistant for RoktoLinkBD
 *
 * Design Principles:
 *  - The bot ONLY provides real information, NEVER performs tasks or creates records.
 *  - It answers questions about blood groups, platform usage, live stats, donation history, etc.
 *  - Phone numbers and personal data are NEVER exposed.
 *  - Medical advice is out of scope — always redirects to certified doctors.
 *
 * Architecture:
 *  1. Safety Firewall (PII redaction, life-threatening triage)
 *  2. Intent Classifier & NER (Blood groups, locations, urgency)
 *  3. Info Router:
 *       - DONOR_COUNT_QUERY  → Real DB donor counts (no PII)
 *       - BLOOD_REQUEST_INFO → Live request stats from DB
 *       - LIFESAVER_INFO     → Real donation/lifesaver count from DB
 *       - HOW_TO_DONATE      → Platform usage guide
 *       - HOW_TO_REQUEST     → Request creation guide
 *       - VOLUNTEER_INFO     → Volunteer information
 *       - BLOOD_GROUP_INFO   → Blood group compatibility facts
 *       - PLATFORM_STATS     → Live platform statistics
 *       - FAQ_KB             → Knowledge Base RAG
 *       - MEDICAL_DISCLAIMER → Clinic/medical boundary
 *       - GENERAL            → General platform info
 */
class RoktoBotService
{
    private const KB_THRESHOLD = 12;

    /** Standard Bangladesh Blood Groups */
    private const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    /** ABO/Rh Compatibility Matrix: recipient => compatible donors */
    private const COMPATIBILITY = [
        'A+'  => ['A+', 'A-', 'O+', 'O-'],
        'A-'  => ['A-', 'O-'],
        'B+'  => ['B+', 'B-', 'O+', 'O-'],
        'B-'  => ['B-', 'O-'],
        'AB+' => ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
        'AB-' => ['AB-', 'A-', 'B-', 'O-'],
        'O+'  => ['O+', 'O-'],
        'O-'  => ['O-'],
    ];

    /** Common Bangladesh locations */
    private const LOCATIONS = [
        'dhaka', 'mirpur', 'dhanmondi', 'uttara', 'gulshan', 'banani', 'mohammadpur',
        'motijheel', 'badda', 'bashundhara', 'farmgate', 'shahbagh', 'mohakhali',
        'chattogram', 'chittagong', 'sylhet', 'rajshahi', 'khulna', 'barishal', 'rangpur',
        'mymensingh', 'cumilla', 'comilla', 'gazipur', 'narayanganj', 'savar', 'tangail',
        'bogura', 'bogra', 'dinajpur', 'jashore', 'jessore', "cox's bazar", 'dhaka medical',
        'bsmmu', 'suhrawardy', 'mitford', 'national heart foundation', 'birdem',
    ];

    /** Emergency trigger terms */
    private const EMERGENCY_TERMS = [
        'urgent', 'urgently', 'emergency', 'immediately', 'now', 'dying', 'critical',
        'জরুরি', 'তাড়াতাড়ি', 'এখনই', 'বাঁচান', 'আইসিইউ', 'icu', 'operation', 'অপারেশন',
    ];

    /** Medical boundary triggers — redirect to doctors */
    private const MEDICAL_TERMS = [
        'can i donate with diabetes', 'hiv', 'hepatitis', 'blood pressure high',
        'what medicine', 'prescribe', 'drug dose', 'রোগী বাঁচবে কি', 'injection',
        'medicine', 'treatment', 'diagnos', 'symptom', 'disease', 'eligible to donate', 'eligible for donation',
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC MAIN ENTRY POINT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @return array{reply: string, source: string, intent: string, confidence: int, citation?: array, emergency_mode?: bool, can_escalate?: bool}
     */
    public function chat(
        string $userMessage,
        string $sessionId,
        ?int   $userId  = null,
        string $locale  = 'en'
    ): array {
        $raw       = trim($userMessage);
        $sanitized = $this->applyFirewall($raw);
        $this->log($sessionId, $userId, 'user', $raw);

        // User preference language override
        if ($userId) {
            $pref = UserAiPreference::where('user_id', $userId)->first();
            if ($pref?->language) {
                $locale = $pref->language;
            }
        }

        // ── 1. Life-threatening triage
        $lifeCheck = $this->lifeThreateningCheck($sanitized, $locale);
        if ($lifeCheck) {
            $this->log($sessionId, $userId, 'assistant', $lifeCheck, 'LIFE_THREAT');
            return ['reply' => $lifeCheck, 'source' => 'GUARDRAIL', 'intent' => 'LIFE_THREATENING', 'confidence' => 99, 'emergency_mode' => true, 'can_escalate' => true];
        }

        // ── 2. Medical boundary check
        $medCheck = $this->medicalBoundaryCheck($sanitized, $locale);
        if ($medCheck) {
            $this->log($sessionId, $userId, 'assistant', $medCheck, 'MEDICAL_BOUNDARY');
            return ['reply' => $medCheck, 'source' => 'GUARDRAIL', 'intent' => 'MEDICAL_DISCLAIMER', 'confidence' => 98, 'can_escalate' => true];
        }

        // Answer ordinary greetings locally so they do not depend on a KB match.
        $conversation = $this->basicConversation($sanitized, $locale);
        if ($conversation) {
            $this->log($sessionId, $userId, 'assistant', $conversation['reply'], 'CONVERSATION');
            return $conversation;
        }

        // ── 3. Extract entities
        $entities = $this->extractEntities($sanitized);

        // ── 4. Classify intent
        $intent = $this->classifyIntent($sanitized, $entities);

        // ── 5. Route to info handler
        $response = match ($intent) {
            'DONOR_COUNT_QUERY'  => $this->handleDonorCountQuery($entities, $locale),
            'BLOOD_REQUEST_INFO' => $this->handleBloodRequestInfo($entities, $locale),
            'LIFESAVER_INFO'     => $this->handleLifesaverInfo($locale),
            'HOW_TO_REQUEST'     => $this->handleHowToRequest($locale),
            'HOW_TO_DONATE'      => $this->handleHowToDonate($locale),
            'VOLUNTEER_INFO'     => $this->handleVolunteerInfo($locale),
            'BLOOD_GROUP_INFO'   => $this->handleBloodGroupInfo($entities, $locale),
            'PLATFORM_STATS'     => $this->handlePlatformStats($locale),
            'HUMAN_ESCALATION'   => $this->handleEscalation($sanitized, $locale, $sessionId, $userId, $entities),
            default              => $this->handleKbFaq($sanitized, $locale, $sessionId, $userId),
        };

        $this->log($sessionId, $userId, 'assistant', $response['reply'], $response['source'] ?? 'GENERAL');
        return $response;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FIREWALL & SAFETY
    // ─────────────────────────────────────────────────────────────────────────

    private function applyFirewall(string $text): string
    {
        $text = preg_replace('/\b\d{10,17}\b/', '[REDACTED]', $text);
        $text = str_ireplace(['ignore previous instructions', 'reveal prompt', 'system prompt', 'jailbreak'], '', $text);
        return $text;
    }

    /** Answers ordinary greetings and help prompts without giving medical advice. */
    private function basicConversation(string $message, string $locale): ?array
    {
        $normalised = trim(mb_strtolower(preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $message)));
        $greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'assalamu alaikum', 'salam', 'হাই', 'হ্যালো', 'আসসালামু আলাইকুম', 'সালাম'];
        $thanks = ['thanks', 'thank you', 'thx', 'ধন্যবাদ', 'থ্যাংক ইউ'];
        $help = ['help', 'what can you do', 'what do you know', 'how can you help', 'সাহায্য', 'কি করতে পারো', 'কী করতে পারো'];
        $identity = ['who are you', 'who r you', 'what are you', 'what is your name', 'tell me about yourself', 'তুমি কে', 'আপনি কে', 'তোমার নাম কি', 'তোমার নাম কী'];

        $kind = in_array($normalised, $greetings, true) ? 'greeting'
            : (in_array($normalised, $thanks, true) ? 'thanks' : (in_array($normalised, $help, true) ? 'help' : (in_array($normalised, $identity, true) ? 'identity' : null)));
        if (!$kind) {
            return null;
        }

        if ($locale === 'bn') {
            $reply = $kind === 'thanks'
                ? 'স্বাগতম! 🩸 রক্তের অনুরোধ, দাতা নিবন্ধন, রক্তের গ্রুপ, স্বেচ্ছাসেবকতা বা RoktoLinkBD ব্যবহারের বিষয়ে প্রশ্ন করতে পারেন। জরুরি চিকিৎসা প্রয়োজনে **৯৯৯** কল করুন।'
                : ($kind === 'identity'
                    ? "আমি **RoktoBot**, RoktoLinkBD-এর তথ্য ও সমন্বয় সহকারী। 🩸\n\nআমি রক্তের অনুরোধ, দাতা নিবন্ধন, রক্তের গ্রুপ, স্বেচ্ছাসেবকতা, গোপনীয়তা এবং প্ল্যাটফর্ম ব্যবহারে সাহায্য করি। আমি চিকিৎসক নই—জীবন-সংশয়ী জরুরি অবস্থায় **৯৯৯** কল করুন।"
                    : "আসসালামু আলাইকুম! আমি **RoktoBot**। 🩸\n\nআমি রক্তের অনুরোধ তৈরি, দাতা নিবন্ধন, রক্তের গ্রুপের তথ্য, স্বেচ্ছাসেবকতা, গোপনীয়তা এবং RoktoLinkBD ব্যবহার সম্পর্কে সাহায্য করতে পারি।\n\nআপনি বলতে পারেন: **‘কীভাবে রক্তের অনুরোধ করব?’** বা **‘কীভাবে দাতা হব?’**\n\nজীবন-সংশয়ী জরুরি অবস্থায় আগে **৯৯৯** কল করুন।");
            $suggestions = ['কীভাবে রক্তের অনুরোধ করব?', 'কীভাবে রক্তদাতা হব?', 'RoktoLinkBD কী?'];
        } else {
            $reply = $kind === 'thanks'
                ? 'You’re welcome! 🩸 Ask me about creating a request, registering as a donor, blood groups, volunteering, privacy, or using RoktoLinkBD. For a medical emergency, call **999**.'
                : ($kind === 'identity'
                    ? "I’m **RoktoBot**, RoktoLinkBD’s information and coordination assistant. 🩸\n\nI can help with blood requests, donor registration, blood groups, volunteering, privacy, and using the platform. I’m not a doctor—call **999** first for a life-threatening emergency."
                    : "Hello! I’m **RoktoBot**. 🩸\n\nI can help with creating blood requests, donor registration, blood-group information, volunteering, privacy, and using RoktoLinkBD.\n\nTry: **‘How do I request blood?’** or **‘How do I become a donor?’**\n\nFor a life-threatening emergency, call **999** first.");
            $suggestions = ['How do I request blood?', 'How do I become a donor?', 'What is RoktoLinkBD?'];
        }

        return ['reply' => $reply, 'source' => 'CONVERSATION', 'intent' => strtoupper($kind), 'confidence' => 100, 'can_escalate' => false, 'suggestions' => $suggestions];
    }

    private function lifeThreateningCheck(string $msg, string $locale): ?string
    {
        $lower    = mb_strtolower($msg);
        $triggers = ['dying', 'unconscious', 'cardiac arrest', 'heart attack', 'রক্তবমি', 'অজ্ঞান', 'not breathing'];
        foreach ($triggers as $t) {
            if (str_contains($lower, $t)) {
                return $locale === 'bn'
                    ? "🚨 **এটি জীবন-সংশয়ী জরুরি অবস্থা!** অনুগ্রহ করে এখনই **৯৯৯** অথবা নিকটস্থ হাসপাতালের ইমার্জেন্সিতে যোগাযোগ করুন। RoktoLinkBD রক্তদাতা সমন্বয় করে, কিন্তু সংকটাপন্ন মুহূর্তে হাসপাতালের চিকিৎসা অপরিহার্য।\n\n📞 জাতীয় জরুরি সেবা: **৯৯৯**\n📞 স্বাস্থ্য বাতায়ন: **১৬২৬৩**"
                    : "🚨 **This sounds like a life-threatening emergency!** Please **call 999** or go to the nearest hospital emergency immediately. RoktoLinkBD coordinates donors — but hospital medical care is critical right now.\n\n📞 National Emergency: **999**\n📞 Health Helpline: **16263**";
            }
        }
        return null;
    }

    private function medicalBoundaryCheck(string $msg, string $locale): ?string
    {
        $lower = mb_strtolower($msg);
        foreach (self::MEDICAL_TERMS as $t) {
            if (str_contains($lower, $t)) {
                return $locale === 'bn'
                    ? "⚕️ RoktoLinkBD একটি সমন্বয় প্ল্যাটফর্ম, চিকিৎসা পরামর্শক নয়। রক্তদান যোগ্যতা, ওষুধ বা রোগ সংক্রান্ত প্রশ্নের জন্য সরাসরি একজন প্রত্যয়িত চিকিৎসক বা অনুমোদিত ব্লাড ব্যাংকের সাথে পরামর্শ করুন।\n\n📞 স্বাস্থ্য বাতায়ন: **১৬২৬৩**"
                    : "⚕️ RoktoLinkBD is a coordination platform, not a medical advisor. For questions about donation eligibility, medications, or medical conditions, please consult a certified healthcare professional or licensed blood bank specialist.\n\n📞 Bangladesh Health Helpline: **16263**";
            }
        }
        return null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NER & INTENT CLASSIFICATION
    // ─────────────────────────────────────────────────────────────────────────

    public function extractEntities(string $text): array
    {
        $lower    = mb_strtolower($text);
        $entities = ['blood_group' => null, 'location' => null, 'urgency' => 'NORMAL'];

        // Blood group extraction
        if (preg_match('/\b(AB|A|B|O)[+\-\s]*(positive|negative|pos|neg|\+|\-)/i', $text, $m)) {
            $grp  = strtoupper($m[1]);
            $sign = in_array(strtolower($m[2]), ['negative', 'neg', '-']) ? '-' : '+';
            $entities['blood_group'] = $grp . $sign;
        }
        if (!$entities['blood_group']) {
            foreach (self::BLOOD_GROUPS as $bg) {
                if (str_contains($lower, strtolower($bg))) {
                    $entities['blood_group'] = $bg;
                    break;
                }
            }
        }
        // Bangla blood group names
        if (!$entities['blood_group']) {
            $bnMap = [
                'বি পজিটিভ' => 'B+', 'বি পজেটিভ' => 'B+', 'এ পজিটিভ' => 'A+', 'এ পজেটিভ' => 'A+',
                'ও পজিটিভ' => 'O+', 'ও পজেটিভ' => 'O+', 'এবি পজিটিভ' => 'AB+', 'এবি পজেটিভ' => 'AB+',
                'বি নেগেটিভ' => 'B-', 'এ নেগেটিভ' => 'A-', 'ও নেগেটিভ' => 'O-', 'এবি নেগেটিভ' => 'AB-',
            ];
            foreach ($bnMap as $bn => $grp) {
                if (str_contains($lower, $bn)) { $entities['blood_group'] = $grp; break; }
            }
        }

        // Location extraction
        foreach (self::LOCATIONS as $loc) {
            if (str_contains($lower, $loc)) {
                $entities['location'] = ucwords($loc);
                break;
            }
        }

        // Urgency detection
        foreach (self::EMERGENCY_TERMS as $t) {
            if (str_contains($lower, $t)) { $entities['urgency'] = 'EMERGENCY'; break; }
        }

        return $entities;
    }

    private function classifyIntent(string $text, array $entities): string
    {
        $lower = mb_strtolower($text);

        // Escalation to human
        if (str_contains($lower, 'volunteer') && (str_contains($lower, 'talk') || str_contains($lower, 'connect') || str_contains($lower, 'কথা'))) return 'HUMAN_ESCALATION';
        if (str_contains($lower, 'human') || str_contains($lower, 'মানুষের সাথে') || str_contains($lower, 'support')) return 'HUMAN_ESCALATION';

        // Platform stats (specific numerical questions)
        if (str_contains($lower, 'how many') || str_contains($lower, 'total count') || str_contains($lower, 'কতজন') || str_contains($lower, 'কতটি') || str_contains($lower, 'live stats')) {
            if (str_contains($lower, 'donor') || str_contains($lower, 'দাতা')) return 'DONOR_COUNT_QUERY';
            if (str_contains($lower, 'request') || str_contains($lower, 'অনুরোধ')) return 'BLOOD_REQUEST_INFO';
            if (str_contains($lower, 'donation') || str_contains($lower, 'lifesaver') || str_contains($lower, 'দান')) return 'LIFESAVER_INFO';
            return 'PLATFORM_STATS';
        }

        // Specific live donor count queries with blood group or location
        if ($entities['blood_group'] && (str_contains($lower, 'donor ache') || str_contains($lower, 'available') || str_contains($lower, 'donors in') || str_contains($lower, 'দাতা আছে'))) {
            return 'DONOR_COUNT_QUERY';
        }

        // Blood group compatibility questions
        if ($entities['blood_group'] && (
            str_contains($lower, 'compatible') || str_contains($lower, 'can donate to') ||
            str_contains($lower, 'receive from') || str_contains($lower, 'সামঞ্জস্য')
        )) {
            return 'BLOOD_GROUP_INFO';
        }

        // Lifesaver count query
        if (str_contains($lower, 'wall of lifesaver') || str_contains($lower, 'how many lifesaver')) {
            return 'LIFESAVER_INFO';
        }

        // All other natural language questions, variations, and inquiries route to LLM/SQL KB layer
        return 'FAQ_KB';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INFO HANDLERS
    // ─────────────────────────────────────────────────────────────────────────

    private function handleDonorCountQuery(array $entities, string $locale): array
    {
        $bg  = $entities['blood_group'];
        $loc = $entities['location'];

        $query = DonorProfile::where('profile_status', 'ACTIVE')
            ->where('emergency_alerts_enabled', true);

        if ($bg) {
            $query->where('blood_group', $bg);
        }
        if ($loc) {
            $query->where(function ($q) use ($loc) {
                $q->where('landmark', 'like', "%{$loc}%")
                  ->orWhereHas('location', fn($lq) => $lq->where('name_en', 'like', "%{$loc}%")->orWhere('name_bn', 'like', "%{$loc}%"));
            });
        }

        $realCount  = $query->count();
        $totalActive = DonorProfile::where('profile_status', 'ACTIVE')->count();

        $groupText = $bg ? "**{$bg}**" : 'all blood groups';
        $locText   = $loc ? " near **{$loc}**" : ' on the platform';

        if ($locale === 'bn') {
            $bgBn  = $bg ?? 'সকল গ্রুপের';
            $locBn = $loc ? " **{$loc}** এলাকায়" : ' আমাদের প্ল্যাটফর্মে';
            $reply = "🩸 **{$bgBn} রক্তদাতার সংখ্যা:**\n\n"
                . "📊 {$locBn} সক্রিয় **{$bgBn}** রক্তদাতা: **{$realCount} জন**\n"
                . "📊 মোট সক্রিয় রক্তদাতা: **{$totalActive} জন**\n\n"
                . "🔒 **গোপনীয়তা নীতি:** রক্তদাতাদের ফোন নম্বর সরাসরি প্রকাশ করা হয় না।\n"
                . "একটি রক্তের অনুরোধ তৈরি করুন — সিস্টেম স্বয়ংক্রিয়ভাবে নিকটস্থ উপযুক্ত দাতাদের নোটিফাই করবে।\n\n"
                . "👉 রক্তের অনুরোধ দিতে: **Need Blood** বাটনে ক্লিক করুন।";
        } else {
            $reply = "🩸 **Available Donor Count{$locText}:**\n\n"
                . "📊 Active {$groupText} donors{$locText}: **{$realCount}**\n"
                . "📊 Total active donors on platform: **{$totalActive}**\n\n"
                . "🔒 **Privacy Policy:** Donor phone numbers are never publicly disclosed. "
                . "Create a blood request — the matching engine will notify nearby eligible donors automatically, "
                . "and contact details unlock only after mutual acceptance.\n\n"
                . "👉 To request blood: click the **'Need Blood'** button in the top navigation.";
        }

        return [
            'reply'      => $reply,
            'source'     => 'DATABASE_QUERY',
            'intent'     => 'DONOR_COUNT_QUERY',
            'confidence' => 97,
            'can_escalate' => true,
            'citation'   => ['source' => 'RoktoLinkBD Live Donor Registry', 'title' => 'Privacy-Protected Donor Count'],
        ];
    }

    private function handleBloodRequestInfo(array $entities, string $locale): array
    {
        $bg           = $entities['blood_group'];
        $activeCount  = BloodRequest::whereIn('status', ['SEARCHING', 'DONORS_NOTIFIED', 'OPEN'])->count();
        $urgentCount  = BloodRequest::where('urgency', 'EMERGENCY_NOW')->whereIn('status', ['SEARCHING', 'DONORS_NOTIFIED', 'OPEN'])->count();
        $totalCount   = BloodRequest::count();
        $fulfilledCount = BloodRequest::where('status', 'FULFILLED')->count();

        $bgCount = null;
        if ($bg) {
            $bgCount = BloodRequest::where('blood_group', $bg)->whereIn('status', ['SEARCHING', 'DONORS_NOTIFIED', 'OPEN'])->count();
        }

        if ($locale === 'bn') {
            $reply = "📋 **রক্তের অনুরোধ — লাইভ ড্যাশবোর্ড:**\n\n"
                . "🔴 সক্রিয় অনুরোধ: **{$activeCount}টি**\n"
                . "🚨 জরুরি (EMERGENCY_NOW): **{$urgentCount}টি**\n"
                . ($bgCount !== null ? "🩸 {$bg} গ্রুপের সক্রিয় অনুরোধ: **{$bgCount}টি**\n" : '')
                . "✅ পূরণ হওয়া অনুরোধ: **{$fulfilledCount}টি**\n"
                . "📊 মোট অনুরোধ (সব সময়ের): **{$totalCount}টি**\n\n"
                . "👉 সব সক্রিয় অনুরোধ দেখতে: **Requests** পেজ ভিজিট করুন।";
        } else {
            $reply = "📋 **Live Blood Request Dashboard:**\n\n"
                . "🔴 Active requests: **{$activeCount}**\n"
                . "🚨 Emergency (EMERGENCY_NOW): **{$urgentCount}**\n"
                . ($bgCount !== null ? "🩸 Active {$bg} requests: **{$bgCount}**\n" : '')
                . "✅ Fulfilled requests: **{$fulfilledCount}**\n"
                . "📊 Total requests (all time): **{$totalCount}**\n\n"
                . "👉 View all active requests on the **Requests** page.";
        }

        return [
            'reply'      => $reply,
            'source'     => 'DATABASE_QUERY',
            'intent'     => 'BLOOD_REQUEST_INFO',
            'confidence' => 97,
            'can_escalate' => true,
            'citation'   => ['source' => 'RoktoLinkBD Request Registry', 'title' => 'Live Blood Request Statistics'],
        ];
    }

    private function handleLifesaverInfo(string $locale): array
    {
        $totalDonations = Donation::where('status', 'CONFIRMED')->count();
        $wallEntries    = Donation::where('status', 'CONFIRMED')->where('is_public_wall', true)->count();
        $totalUnits     = Donation::where('status', 'CONFIRMED')->sum('units');
        $latest         = Donation::where('status', 'CONFIRMED')
            ->where('is_public_wall', true)
            ->with('donorProfile.user')
            ->latest('donated_at')
            ->first();
        $latestName = $latest?->donorProfile?->user?->name ?? 'A generous donor';

        if ($locale === 'bn') {
            $reply = "🏆 **রক্তদান সম্মাননা — লাইফসেভার্স ওয়াল:**\n\n"
                . "❤️ মোট যাচাইকৃত রক্তদান: **{$totalDonations}টি**\n"
                . "🏅 সম্মাননা প্রাচীরে প্রদর্শিত: **{$wallEntries}জন** বীর রক্তদাতা\n"
                . "💉 মোট রক্তের ব্যাগ দান: **{$totalUnits} ব্যাগ**\n"
                . "🌟 সর্বশেষ লাইফসেভার: **{$latestName}**\n\n"
                . "প্রতিটি নিশ্চিত রক্তদানের জন্য রক্তদাতা একটি **SHA-256 ডিজিটাল সার্টিফিকেট** পান।\n\n"
                . "👉 সম্মাননা প্রাচীর দেখতে: উপরের **Lifesavers** মেনুতে ক্লিক করুন।";
        } else {
            $reply = "🏆 **Wall of Lifesavers — Donation Statistics:**\n\n"
                . "❤️ Total verified donations: **{$totalDonations}**\n"
                . "🏅 Lifesavers honored on the public wall: **{$wallEntries}**\n"
                . "💉 Total blood bags donated: **{$totalUnits}**\n"
                . "🌟 Most recent lifesaver: **{$latestName}**\n\n"
                . "Every confirmed donation earns a tamper-proof **SHA-256 digital certificate of appreciation**.\n\n"
                . "👉 Visit the **Lifesavers** page in the top navigation to see all heroes.";
        }

        return [
            'reply'      => $reply,
            'source'     => 'DATABASE_QUERY',
            'intent'     => 'LIFESAVER_INFO',
            'confidence' => 98,
            'can_escalate' => false,
            'citation'   => ['source' => 'RoktoLinkBD Donation Registry', 'title' => 'Verified Donation & Certificate Records'],
        ];
    }

    private function handlePlatformStats(string $locale): array
    {
        $activeDonors   = DonorProfile::where('profile_status', 'ACTIVE')->count();
        $activeRequests = BloodRequest::whereIn('status', ['SEARCHING', 'DONORS_NOTIFIED', 'OPEN'])->count();
        $fulfilled      = BloodRequest::where('status', 'FULFILLED')->count();
        $donations      = Donation::where('status', 'CONFIRMED')->count();

        if ($locale === 'bn') {
            $reply = "📊 **RoktoLinkBD — লাইভ প্ল্যাটফর্ম পরিসংখ্যান:**\n\n"
                . "👤 সক্রিয় রক্তদাতা: **{$activeDonors} জন**\n"
                . "🩸 সক্রিয় রক্তের অনুরোধ: **{$activeRequests}টি**\n"
                . "✅ পূরণ হওয়া অনুরোধ: **{$fulfilled}টি**\n"
                . "🏅 যাচাইকৃত রক্তদান: **{$donations}টি**\n\n"
                . "RoktoLinkBD বাংলাদেশে জরুরি রক্ত সংগ্রহের জন্য একটি গোপনীয়তা-সুরক্ষিত সমন্বয় প্ল্যাটফর্ম। "
                . "আমরা রক্ত সংগ্রহ, পরীক্ষা বা সংরক্ষণ করি না — শুধু দাতা ও প্রয়োজনগ্রস্তদের সংযুক্ত করি।";
        } else {
            $reply = "📊 **RoktoLinkBD — Live Platform Statistics:**\n\n"
                . "👤 Active verified donors: **{$activeDonors}**\n"
                . "🩸 Active blood requests: **{$activeRequests}**\n"
                . "✅ Fulfilled requests: **{$fulfilled}**\n"
                . "🏅 Verified donations: **{$donations}**\n\n"
                . "RoktoLinkBD is Bangladesh's privacy-first emergency blood coordination network. "
                . "We do NOT collect, test, or store blood — we connect verified donors with families in need "
                . "across all 8 divisions and 64 districts of Bangladesh.";
        }

        return [
            'reply'      => $reply,
            'source'     => 'DATABASE_QUERY',
            'intent'     => 'PLATFORM_STATS',
            'confidence' => 98,
            'can_escalate' => false,
            'citation'   => ['source' => 'RoktoLinkBD Live Database', 'title' => 'Platform Statistics Dashboard'],
        ];
    }

    private function handleHowToRequest(string $locale): array
    {
        if ($locale === 'bn') {
            $reply = "🩸 **কীভাবে রক্তের অনুরোধ করবেন:**\n\n"
                . "1. **লগইন করুন** — যাচাইকৃত অ্যাকাউন্ট প্রয়োজন (ইমেইল ভেরিফাই করুন)।\n"
                . "2. **'Need Blood' বাটনে** ক্লিক করুন (উপরে নেভিগেশনে)।\n"
                . "3. ফর্মে পূরণ করুন:\n"
                . "   • রক্তের গ্রুপ (যেমন B+, O-)\n"
                . "   • হাসপাতালের নাম ও ঠিকানা\n"
                . "   • কত ব্যাগ প্রয়োজন\n"
                . "   • কখন প্রয়োজন (জরুরি/আজকের মধ্যে/সাধারণ)\n"
                . "   • আপনার যোগাযোগ নম্বর\n"
                . "4. **সাবমিট করুন** — ম্যাচিং ইঞ্জিন তাৎক্ষণিক নিকটস্থ উপযুক্ত দাতাদের নোটিফাই করবে।\n"
                . "5. দাতা সম্মতি দিলে আপনার **যোগাযোগ নম্বর পারস্পরিকভাবে শেয়ার** হবে।\n\n"
                . "⚠️ অ্যাকাউন্ট না থাকলে প্রথমে নিবন্ধন করুন এবং ইমেইল যাচাই করুন।";
        } else {
            $reply = "🩸 **How to Create a Blood Request:**\n\n"
                . "1. **Log in** — a verified account is required (verify your email first).\n"
                . "2. Click **'Need Blood'** in the top navigation bar.\n"
                . "3. Fill in the form:\n"
                . "   • Blood group needed (e.g. B+, O-)\n"
                . "   • Hospital name and address\n"
                . "   • How many bags required\n"
                . "   • When needed (EMERGENCY_NOW / TODAY / NORMAL)\n"
                . "   • Your contact phone number\n"
                . "4. **Submit** — the matching engine instantly notifies nearby eligible donors.\n"
                . "5. Once a donor accepts, contact details are **mutually unlocked** for both parties.\n\n"
                . "⚠️ If you don't have an account, register first and verify your email.";
        }

        return [
            'reply'      => $reply,
            'source'     => 'PLATFORM_GUIDE',
            'intent'     => 'HOW_TO_REQUEST',
            'confidence' => 98,
            'can_escalate' => true,
            'citation'   => ['source' => 'RoktoLinkBD User Guide', 'title' => 'Blood Request Creation Process'],
        ];
    }

    private function handleHowToDonate(string $locale): array
    {
        if ($locale === 'bn') {
            $reply = "❤️ **কীভাবে রক্তদাতা হিসেবে নিবন্ধন করবেন:**\n\n"
                . "1. **নিবন্ধন করুন** — আপনার নাম, ইমেইল ও ফোন নম্বর দিয়ে অ্যাকাউন্ট খুলুন।\n"
                . "2. **ইমেইল যাচাই করুন** — ৫ মিনিটের মধ্যে পাঠানো OTP কোড দিন।\n"
                . "3. **Donor হিসেবে নিবন্ধন করুন** — রক্তের গ্রুপ, পছন্দের দূরত্ব এবং এলাকা দিন।\n"
                . "4. **Availability চালু করুন** — ড্যাশবোর্ড থেকে 'Available Now' টগল করুন।\n"
                . "5. **ম্যাচ নোটিফিকেশন পান** — কাছে কেউ রক্ত চাইলে আপনাকে জানানো হবে।\n"
                . "6. **YES, I CAN HELP** বাটনে ক্লিক করুন এবং হাসপাতালে যান।\n"
                . "7. দান সম্পন্ন হলে **ডিজিটাল সার্টিফিকেট** পাবেন এবং Lifesavers ওয়ালে স্থান পাবেন!\n\n"
                . "📌 রক্তদানের মানদণ্ড:\n"
                . "   • বয়স: ১৮-৬০ বছর\n"
                . "   • ওজন: ন্যূনতম ৫০ কেজি\n"
                . "   • শেষ দান থেকে ন্যূনতম ৯০ দিন বিরতি\n"
                . "   • বিস্তারিত যোগ্যতার জন্য ডাক্তারের পরামর্শ নিন।";
        } else {
            $reply = "❤️ **How to Register as a Blood Donor:**\n\n"
                . "1. **Register** — create an account with your name, email, and phone.\n"
                . "2. **Verify your email** — enter the OTP code sent within 5 minutes.\n"
                . "3. **Register as a donor** — provide your blood group, preferred radius, and area.\n"
                . "4. **Enable availability** — toggle 'Available Now' from your dashboard.\n"
                . "5. **Receive match alerts** — when someone nearby needs blood, you'll be notified.\n"
                . "6. Click **'YES, I CAN HELP'** and travel to the hospital.\n"
                . "7. After donation, receive a **digital certificate** and join the Wall of Lifesavers!\n\n"
                . "📌 Basic donor eligibility:\n"
                . "   • Age: 18–60 years\n"
                . "   • Weight: minimum 50 kg\n"
                . "   • At least 90 days since last donation\n"
                . "   • Consult a doctor for detailed medical eligibility.";
        }

        return [
            'reply'      => $reply,
            'source'     => 'PLATFORM_GUIDE',
            'intent'     => 'HOW_TO_DONATE',
            'confidence' => 98,
            'can_escalate' => false,
            'citation'   => ['source' => 'RoktoLinkBD Donor Guide', 'title' => 'Donor Registration & Donation Process'],
        ];
    }

    private function handleVolunteerInfo(string $locale): array
    {
        if ($locale === 'bn') {
            $reply = "🤝 **RoktoLinkBD স্বেচ্ছাসেবক প্রোগ্রাম:**\n\n"
                . "স্বেচ্ছাসেবকরা রক্ত সংগ্রহের সমন্বয়ে সহায়তা করেন — পরিবার এবং দাতার মধ্যে সেতুবন্ধন হিসেবে কাজ করেন।\n\n"
                . "**স্বেচ্ছাসেবক হতে:**\n"
                . "1. উপরের মেনু থেকে **Volunteer** অপশনে যান।\n"
                . "2. আবেদন ফর্ম পূরণ করুন (নাম, ফোন, জেলা, সংস্থা)।\n"
                . "3. আপনার আবেদন **Admin পর্যালোচনা** করবেন।\n"
                . "4. অনুমোদনের পর আপনি সক্রিয় কেস ক্লেম করতে পারবেন।\n\n"
                . "**স্বেচ্ছাসেবকের দায়িত্ব:**\n"
                . "• রক্তের অনুরোধ যাচাই করা\n"
                . "• দাতা এবং প্রার্থীর মধ্যে সমন্বয় করা\n"
                . "• হাসপাতালে উপস্থিত থেকে সহায়তা করা\n"
                . "• দান নিশ্চিত করা এবং কেস ক্লোজ করা";
        } else {
            $reply = "🤝 **RoktoLinkBD Volunteer Program:**\n\n"
                . "Volunteers are the backbone of our coordination network — they bridge the gap between families in crisis and available donors.\n\n"
                . "**To become a volunteer:**\n"
                . "1. Go to the **Volunteer** section in the top navigation.\n"
                . "2. Fill in the application (name, phone, district, organization).\n"
                . "3. Your application goes through **Admin review** — never instant.\n"
                . "4. Upon approval, you can claim active cases and assist coordination.\n\n"
                . "**Volunteer responsibilities:**\n"
                . "• Verify blood requests and assess urgency\n"
                . "• Coordinate between donors and requesting families\n"
                . "• Be present at the hospital for coordination support\n"
                . "• Confirm donation completion and close cases";
        }

        return [
            'reply'      => $reply,
            'source'     => 'PLATFORM_GUIDE',
            'intent'     => 'VOLUNTEER_INFO',
            'confidence' => 97,
            'can_escalate' => false,
            'citation'   => ['source' => 'RoktoLinkBD Volunteer Protocol', 'title' => 'Volunteer Application & Role Guidelines'],
        ];
    }

    private function handleBloodGroupInfo(array $entities, string $locale): array
    {
        $bg = $entities['blood_group'] ?? 'O+';
        $compatible = self::COMPATIBILITY[$bg] ?? [];
        $compatStr  = implode(', ', $compatible);

        // What blood groups this person can donate to
        $canDonateTo = [];
        foreach (self::COMPATIBILITY as $recipient => $donors) {
            if (in_array($bg, $donors)) {
                $canDonateTo[] = $recipient;
            }
        }
        $donateToStr = implode(', ', $canDonateTo);

        // DB stats
        $donorCount = DonorProfile::where('blood_group', $bg)->where('profile_status', 'ACTIVE')->count();
        $activeReqs = BloodRequest::where('blood_group', $bg)->whereIn('status', ['SEARCHING', 'DONORS_NOTIFIED', 'OPEN'])->count();

        if ($locale === 'bn') {
            $reply = "🩸 **{$bg} রক্তের গ্রুপ — তথ্য:**\n\n"
                . "**সামঞ্জস্যতা:**\n"
                . "• **{$bg}** রোগী গ্রহণ করতে পারেন: **{$compatStr}**\n"
                . "• **{$bg}** দাতা রক্ত দিতে পারেন: **{$donateToStr}** রোগীকে\n\n"
                . "📋 **RoktoLinkBD পলিসি:** প্ল্যাটফর্মে সর্বোচ্চ নিরাপত্তা ও নির্ভুলতার জন্য **শুধুমাত্র হুবহু একই রক্তের গ্রুপের ({$bg})** রক্তদাতাই দান করতে পারেন।\n\n"
                . "**প্ল্যাটফর্ম পরিসংখ্যান:**\n"
                . "• সক্রিয় {$bg} রক্তদাতা: **{$donorCount} জন**\n"
                . "• সক্রিয় {$bg} রক্তের অনুরোধ: **{$activeReqs}টি**\n\n"
                . "⚠️ রক্তের গ্রুপ পরীক্ষা এবং ক্রস-ম্যাচিং **শুধুমাত্র অনুমোদিত ব্লাড ব্যাংক বা হাসপাতালে** সম্পন্ন হবে।";
        } else {
            $reply = "🩸 **{$bg} Blood Group — Information:**\n\n"
                . "**Medical Compatibility:**\n"
                . "• A patient with **{$bg}** can receive blood from: **{$compatStr}**\n"
                . "• A **{$bg}** donor can give blood to: **{$donateToStr}**\n\n"
                . "📋 **RoktoLinkBD Policy:** Candidate matching uses ABO/Rh compatibility. **Only a licensed blood bank or hospital** can make the final blood-group and cross-match decision.\n\n"
                . "**Platform Statistics:**\n"
                . "• Active {$bg} donors on platform: **{$donorCount}**\n"
                . "• Active {$bg} blood requests: **{$activeReqs}**\n\n"
                . "⚠️ Final crossmatch testing must be performed exclusively at a **licensed blood transfusion facility**.";
        }

        return [
            'reply'      => $reply,
            'source'     => 'BLOOD_GROUP_KNOWLEDGE',
            'intent'     => 'BLOOD_GROUP_INFO',
            'confidence' => 98,
            'can_escalate' => false,
            'citation'   => ['source' => 'ABO/Rh Blood Group System (WHO) + RoktoLinkBD Registry', 'title' => "Blood Group {$bg} Compatibility & Platform Data"],
        ];
    }

    private function handleEscalation(string $message, string $locale, string $sessionId, ?int $userId, array $entities): array
    {
        $escalation = ChatEscalation::create([
            'user_id'      => $userId,
            'session_id'   => $sessionId,
            'reason'       => mb_substr($message, 0, 250),
            'blood_group'  => $entities['blood_group'] ?? null,
            'location_text'=> $entities['location'] ?? null,
            'status'       => 'PENDING',
        ]);

        if ($locale === 'bn') {
            $reply = "🤝 **স্বেচ্ছাসেবক সহায়তার জন্য আবেদন প্রেরিত হয়েছে!**\n\n"
                . "আপনার কেস (টিকেট #ESC-{$escalation->id}) আমাদের সমন্বয়কারী দলের কাছে পৌঁছেছে। "
                . "একজন যাচাইকৃত স্বেচ্ছাসেবক শীঘ্রই সহায়তা করবেন।\n\n"
                . "জরুরি প্রয়োজনে:\n"
                . "📞 **৯৯৯** (জাতীয় জরুরি সেবা)\n"
                . "📞 **১৬২৬৩** (স্বাস্থ্য বাতায়ন)";
        } else {
            $reply = "🤝 **Volunteer Escalation Submitted!**\n\n"
                . "Your case (Ticket #ESC-{$escalation->id}) has been forwarded to our coordination team. "
                . "A verified volunteer will review and assist shortly.\n\n"
                . "For critical emergencies:\n"
                . "📞 **999** (National Emergency)\n"
                . "📞 **16263** (Bangladesh Health Helpline)";
        }

        return [
            'reply'      => $reply,
            'source'     => 'ESCALATION',
            'intent'     => 'HUMAN_ESCALATION',
            'confidence' => 99,
            'can_escalate' => false,
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // KNOWLEDGE BASE RAG & LLM INTENT RESOLUTION
    // ─────────────────────────────────────────────────────────────────────────

    private function handleKbFaq(string $query, string $locale, string $sessionId, ?int $userId): array
    {
        try {
            $articles = KnowledgeArticle::published()->get();

            /** @var LlmIntentResolverService $resolver */
            $resolver = app(LlmIntentResolverService::class);
            $resolution = $resolver->resolve($query, $articles);

            // 1. Off-topic / Irrelevant to the platform
            if ($resolution['status'] === 'IRRELEVANT') {
                $reply = $locale === 'bn'
                    ? "আমি রক্তবট — শুধুমাত্র রক্তলিংকবিডি রক্তদান সেবার সহায়তার জন্য নিয়োজিত। অনুগ্রহ করে রক্তদান, রক্তের অনুরোধ, রক্তদাতা বা এই প্ল্যাটফর্ম সম্পর্কিত প্রশ্ন করুন।"
                    : "I am RoktoBot, specifically designed to assist with RoktoLinkBD blood donation services. Please ask questions related to blood donation, blood requests, donors, or using this platform.";

                return [
                    'reply'        => $reply,
                    'source'       => 'IRRELEVANT_FILTER',
                    'intent'       => 'OFF_TOPIC',
                    'confidence'   => $resolution['confidence'] ?? 95,
                    'can_escalate' => false,
                ];
            }

            // 2. Confident Match found in SQL Database
            if ($resolution['status'] === 'MATCH' && !empty($resolution['article_id'])) {
                $article = $articles->firstWhere('id', $resolution['article_id']);
                if ($article) {
                    $content    = ($locale === 'bn' && $article->content_bn) ? $article->content_bn : $article->content_en;
                    $confidence = $resolution['confidence'] ?? 92;

                    return [
                        'reply'        => $content,
                        'source'       => 'KB',
                        'intent'       => 'FAQ_KB',
                        'confidence'   => $confidence,
                        'can_escalate' => true,
                        'citation'     => ['source' => 'RoktoLinkBD Knowledge Base', 'title' => $article->title_en],
                    ];
                }
            }

            // 3. Relevant to platform, but not answered in existing SQL database
            if ($resolution['status'] === 'NO_MATCH') {
                if ($locale === 'bn') {
                    $reply = "আমার কাছে এ সম্পর্কিত নির্দিষ্ট তথ্য পাওয়া যায়নি। অনুগ্রহ করে আপনার প্রশ্নটি অন্যভাবে লিখুন।\n\n"
                        . "💡 **আপনি নিচের প্রশ্নগুলো জিজ্ঞেস করতে পারেন:**\n"
                        . "• কীভাবে রক্তের অনুরোধ তৈরি করব?\n"
                        . "• কীভাবে রক্তদাতা হিসেবে নিবন্ধন করব?\n"
                        . "• RoktoLinkBD কী এবং এর উদ্দেশ্য কী?\n"
                        . "• আমার ফোন নম্বর কি প্রকাশ্যে দেখা যাবে?\n"
                        . "• কীভাবে স্বেচ্ছাসেবক হিসেবে আবেদন করব?";
                    $suggestions = [
                        'কীভাবে রক্তের অনুরোধ তৈরি করব?',
                        'কীভাবে রক্তদাতা হব?',
                        'RoktoLinkBD কী?',
                        'আমার ফোন নম্বর কি প্রকাশ্যে দেখা যাবে?',
                    ];
                } else {
                    $reply = "I couldn't find information about that in my available knowledge. Could you rephrase your question?\n\n"
                        . "💡 **Here are some questions you can ask me:**\n"
                        . "• How do I create a blood request?\n"
                        . "• How do I become a blood donor on RoktoLinkBD?\n"
                        . "• What is RoktoLinkBD?\n"
                        . "• Will my personal information be shown publicly?\n"
                        . "• How do I become a volunteer?";
                    $suggestions = [
                        'How do I create a blood request?',
                        'How do I become a blood donor?',
                        'What is RoktoLinkBD?',
                        'Will my personal information be shown publicly?',
                    ];
                }

                return [
                    'reply'        => $reply,
                    'source'       => 'FALLBACK',
                    'intent'       => 'NO_MATCH',
                    'confidence'   => 45,
                    'can_escalate' => true,
                    'suggestions'  => $suggestions,
                ];
            }
        } catch (\Throwable $e) {
            Log::warning('LLM / KB search failed: ' . $e->getMessage());
        }

        return $this->generalFallback($locale);
    }

    private function generalFallback(string $locale): array
    {
        if ($locale === 'bn') {
            $reply = "আমার কাছে এ সম্পর্কিত নির্দিষ্ট তথ্য পাওয়া যায়নি। অনুগ্রহ করে আপনার প্রশ্নটি অন্যভাবে লিখুন।\n\n"
                . "💡 **জনপ্রিয় প্রশ্নসমূহ:**\n"
                . "• কীভাবে রক্তের অনুরোধ তৈরি করব?\n"
                . "• কীভাবে রক্তদাতা হব?\n"
                . "• RoktoLinkBD কী?\n"
                . "• ঢাকায় কতজন O+ রক্তদাতা আছেন?\n\n"
                . "জরুরি চিকিৎসায়: **৯৯৯** | স্বাস্থ্য বাতায়ন: **১৬২৬৩**";
            $suggestions = [
                'কীভাবে রক্তের অনুরোধ করব?',
                'কীভাবে রক্তদাতা হব?',
                'RoktoLinkBD কী?',
                'ঢাকায় কতজন O+ রক্তদাতা আছেন?',
            ];
        } else {
            $reply = "I couldn't find information about that in my available knowledge. Could you rephrase your question?\n\n"
                . "💡 **Popular questions you can ask:**\n"
                . "• How do I create a blood request?\n"
                . "• How do I become a blood donor on RoktoLinkBD?\n"
                . "• What is RoktoLinkBD?\n"
                . "• How many O+ donors available in Dhaka?\n\n"
                . "For medical emergencies: **999** | Health Helpline: **16263**";
            $suggestions = [
                'How do I create a blood request?',
                'How do I become a blood donor?',
                'What is RoktoLinkBD?',
                'How many O+ donors available in Dhaka?',
            ];
        }

        return [
            'reply'        => $reply,
            'source'       => 'FALLBACK',
            'intent'       => 'GENERAL',
            'confidence'   => 65,
            'can_escalate' => true,
            'suggestions'  => $suggestions,
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LOGGING
    // ─────────────────────────────────────────────────────────────────────────

    private function log(string $sessionId, ?int $userId, string $role, string $message, ?string $source = null): void
    {
        try {
            BotChatLog::create([
                'session_id' => $sessionId,
                'user_id'    => $userId,
                'role'       => $role === 'assistant' ? 'assistant' : 'user',
                'content'    => mb_substr($message, 0, 2000),
                'source'     => $source ?? 'KB',
            ]);
        } catch (\Throwable $e) {
            Log::warning('BotChatLog save failed: ' . $e->getMessage());
        }
    }
}
