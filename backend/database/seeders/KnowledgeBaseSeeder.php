<?php

namespace Database\Seeders;

use App\Models\KnowledgeArticle;
use Illuminate\Database\Seeder;

class KnowledgeBaseSeeder extends Seeder
{
    public function run(): void
    {
        $articles = [
            // ---------------------------------------------------------------
            // Requests
            // ---------------------------------------------------------------
            [
                'category'    => 'Requests',
                'title_en'    => 'How do I create a blood request?',
                'title_bn'    => 'আমি কীভাবে রক্তের অনুরোধ তৈরি করব?',
                'content_en'  => "To create a blood request on RoktoLinkBD:\n\n1. Register and verify your email address.\n2. Click \"I Need Blood\" or visit /requests/create.\n3. Fill in: blood group, component, units needed, hospital name, urgency level, and your location.\n4. Click \"Find Blood\" — your request is submitted immediately.\n\nOnce submitted, our matching engine will search for compatible available donors near you and notify them. You will receive updates as donors respond.",
                'content_bn'  => "RoktoLinkBD-তে রক্তের অনুরোধ তৈরি করতে:\n\n১. নিবন্ধন করুন এবং আপনার ইমেইল যাচাই করুন।\n২. \"আমার রক্ত চাই\" ক্লিক করুন বা /requests/create-এ যান।\n৩. রক্তের গ্রুপ, কম্পোনেন্ট, ইউনিট সংখ্যা, হাসপাতালের নাম, জরুরি স্তর এবং আপনার অবস্থান পূরণ করুন।\n৪. \"রক্ত খুঁজুন\" ক্লিক করুন — আপনার অনুরোধ অবিলম্বে জমা হবে।",
                'keywords'    => ['blood request', 'create request', 'need blood', 'how to request', 'emergency'],
                'is_published'=> true,
                'sort_order'  => 10,
            ],
            [
                'category'    => 'Requests',
                'title_en'    => 'What do the blood request statuses mean?',
                'title_bn'    => 'রক্তের অনুরোধের স্ট্যাটাসগুলো কী বোঝায়?',
                'content_en'  => "RoktoLinkBD tracks each request through these stages:\n\n• CREATED — Request submitted, not yet dispatched.\n• SEARCHING — System is searching for compatible donors.\n• DONORS_NOTIFIED — Matching donors have been alerted.\n• DONOR_ACCEPTED — A donor has agreed to help.\n• DONOR_CONFIRMED — Donor has confirmed they will proceed.\n• DONOR_TRAVELLING — Donor is on their way to the facility.\n• DONOR_ARRIVED — Donor has arrived at the hospital/facility.\n• DONATION_COMPLETED — The donation process is complete.\n• FULFILLED — The blood request is fully fulfilled.\n• CANCELLED — The request was cancelled.\n• EXPIRED — The required time has passed with no resolution.",
                'content_bn'  => "রক্তের অনুরোধের ধাপগুলো:\n\n• CREATED — অনুরোধ জমা, এখনও পাঠানো হয়নি।\n• SEARCHING — সিস্টেম উপযুক্ত রক্তদাতা খুঁজছে।\n• DONORS_NOTIFIED — উপযুক্ত দাতাদের সতর্ক করা হয়েছে।\n• DONOR_ACCEPTED — একজন দাতা সাহায্য করতে রাজি হয়েছেন।\n• FULFILLED — অনুরোধ সম্পন্ন হয়েছে।\n• CANCELLED — অনুরোধটি বাতিল করা হয়েছে।",
                'keywords'    => ['status', 'request status', 'fulfilled', 'searching', 'donor accepted', 'cancelled', 'expired'],
                'is_published'=> true,
                'sort_order'  => 11,
            ],
            [
                'category'    => 'Requests',
                'title_en'    => 'How do I cancel my blood request?',
                'title_bn'    => 'আমি কীভাবে আমার রক্তের অনুরোধ বাতিল করব?',
                'content_en'  => "You can cancel your blood request from the request tracking page (/requests/YOUR-CODE). Look for the \"Cancel Request\" button. Cancelling will stop notifications to donors and close the request.\n\nPlease only cancel if:\n• The blood has already been obtained from another source.\n• The patient's situation has changed.\n• The request was created by mistake.\n\nThis helps keep our donor network's trust and availability accurate.",
                'content_bn'  => "আপনি আপনার অনুরোধ ট্র্যাকিং পেজ থেকে রক্তের অনুরোধ বাতিল করতে পারবেন। \"অনুরোধ বাতিল করুন\" বাটনে ক্লিক করুন। বাতিল করলে দাতাদের কাছে নোটিফিকেশন বন্ধ হয়ে যাবে।",
                'keywords'    => ['cancel', 'cancel request', 'withdraw', 'stop request'],
                'is_published'=> true,
                'sort_order'  => 12,
            ],

            // ---------------------------------------------------------------
            // Donors
            // ---------------------------------------------------------------
            [
                'category'    => 'Donors',
                'title_en'    => 'How do I become a blood donor on RoktoLinkBD?',
                'title_bn'    => 'আমি কীভাবে RoktoLinkBD-তে রক্তদাতা হব?',
                'content_en'  => "To register as a donor:\n\n1. Create an account and verify your email.\n2. Visit /donor/register or click \"I Want to Donate\".\n3. Enter your blood group, preferred service radius, and location.\n4. Set your availability status — \"Available Now\" means you're ready to receive emergency alerts.\n\nYou will only be matched to requests when you are marked as available. Your personal contact information is never shown publicly.",
                'content_bn'  => "রক্তদাতা হিসেবে নিবন্ধন করতে:\n\n১. অ্যাকাউন্ট তৈরি করুন এবং ইমেইল যাচাই করুন।\n২. /donor/register-এ যান বা \"আমি রক্ত দিতে চাই\" ক্লিক করুন।\n৩. আপনার রক্তের গ্রুপ, পছন্দের সেবা ব্যাসার্ধ এবং অবস্থান প্রবেশ করুন।\n৪. আপনার উপলব্ধতার স্ট্যাটাস সেট করুন।",
                'keywords'    => ['become donor', 'register donor', 'donor registration', 'donate blood', 'how to donate'],
                'is_published'=> true,
                'sort_order'  => 20,
            ],
            [
                'category'    => 'Donors',
                'title_en'    => 'How does donor availability work?',
                'title_bn'    => 'দাতার উপলব্ধতা কীভাবে কাজ করে?',
                'content_en'  => "Your availability status tells RoktoLinkBD when you're ready to donate:\n\n• Available Now — You are ready and will receive emergency alerts immediately.\n• Available Later — You're available from a future date/time you set.\n• Unavailable — You will not receive donation requests.\n• Do Not Disturb — No alerts at all.\n\nYou can change your status anytime from your Donor Dashboard (/donor/dashboard). After a confirmed donation, your availability is automatically paused to prevent immediate re-matching. Update it again when you're ready.",
                'content_bn'  => "আপনার উপলব্ধতার স্ট্যাটাস বলে দেয় আপনি কখন রক্ত দিতে প্রস্তুত। আপনি যেকোনো সময় ডোনার ড্যাশবোর্ড থেকে এটি পরিবর্তন করতে পারবেন।",
                'keywords'    => ['availability', 'available now', 'donor availability', 'do not disturb', 'unavailable', 'toggle'],
                'is_published'=> true,
                'sort_order'  => 21,
            ],
            [
                'category'    => 'Donors',
                'title_en'    => 'Will my personal information be shown publicly?',
                'title_bn'    => 'আমার ব্যক্তিগত তথ্য কি প্রকাশ্যে দেখানো হবে?',
                'content_en'  => "No. RoktoLinkBD is privacy-first.\n\n• Your phone number, email, home address, and exact GPS coordinates are NEVER shown publicly.\n• Your name is only shown to matched requesters and volunteers when operationally necessary.\n• Your public donor code (e.g. DNR-26-XXXXXX) is used instead of your real name on public pages.\n• Donor counts are only shown in aggregated form (e.g. \"12 B+ donors available near you\").",
                'content_bn'  => "না। আপনার ফোন নম্বর, ইমেইল, বাড়ির ঠিকানা এবং সঠিক GPS স্থানাংক কখনও প্রকাশ্যে দেখানো হবে না। RoktoLinkBD গোপনীয়তাকে সর্বোচ্চ অগ্রাধিকার দেয়।",
                'keywords'    => ['privacy', 'personal info', 'phone number', 'address', 'public', 'hidden', 'private'],
                'is_published'=> true,
                'sort_order'  => 22,
            ],

            // ---------------------------------------------------------------
            // Volunteers
            // ---------------------------------------------------------------
            [
                'category'    => 'Volunteers',
                'title_en'    => 'How do I become a volunteer on RoktoLinkBD?',
                'title_bn'    => 'আমি কীভাবে RoktoLinkBD-এ স্বেচ্ছাসেবী হব?',
                'content_en'  => "Volunteers help coordinate emergency blood donation cases. To apply:\n\n1. Verify your email and log in.\n2. Visit /volunteer/apply.\n3. Complete the multi-step application: personal details, identity verification (NID), location, and consent.\n4. Submit your application for admin review.\n\nOnce approved, you gain access to the Volunteer Dashboard and can claim available cases in your area. Your NID is stored encrypted and is never shown publicly.",
                'content_bn'  => "স্বেচ্ছাসেবীরা জরুরি রক্তদান সমন্বয় করতে সাহায্য করেন। আবেদন করতে /volunteer/apply-তে যান এবং মাল্টি-স্টেপ ফর্ম পূরণ করুন।",
                'keywords'    => ['volunteer', 'apply volunteer', 'become volunteer', 'volunteer application', 'coordinator'],
                'is_published'=> true,
                'sort_order'  => 30,
            ],
            [
                'category'    => 'Volunteers',
                'title_en'    => 'What is the volunteer verification process?',
                'title_bn'    => 'স্বেচ্ছাসেবী যাচাই প্রক্রিয়া কী?',
                'content_en'  => "After you submit your volunteer application, the RoktoLinkBD admin team reviews:\n\n• Your provided identity documents (NID or student/organization ID).\n• Your stated location and availability.\n• Your consent to the Volunteer Code of Conduct.\n\nIf approved, you receive a notification and your Volunteer Dashboard becomes active.\nIf rejected, you will receive a message explaining why.\n\nVolunteer verification typically takes 1-3 working days.",
                'content_bn'  => "আপনার আবেদন জমা দেওয়ার পর, RoktoLinkBD অ্যাডমিন টিম আপনার পরিচয় নথি, অবস্থান এবং আচরণবিধিতে সম্মতি যাচাই করে। অনুমোদন সাধারণত ১-৩ কার্যদিবস সময় নেয়।",
                'keywords'    => ['volunteer verification', 'review', 'approved', 'rejected', 'NID', 'identity'],
                'is_published'=> true,
                'sort_order'  => 31,
            ],

            // ---------------------------------------------------------------
            // Account
            // ---------------------------------------------------------------
            [
                'category'    => 'Account',
                'title_en'    => 'How do I verify my email address?',
                'title_bn'    => 'আমি কীভাবে আমার ইমেইল ঠিকানা যাচাই করব?',
                'content_en'  => "After registering, RoktoLinkBD sends a verification link to your email address.\n\n1. Open your email inbox.\n2. Find the email from RoktoLinkBD (check spam if not found).\n3. Click the verification link.\n\nYour account is now verified and you can create blood requests, register as a donor, and apply as a volunteer.\n\nIf you didn't receive the email, go to /email/verify and click \"Resend Verification Email\".",
                'content_bn'  => "নিবন্ধনের পরে, RoktoLinkBD আপনার ইমেইলে একটি যাচাই লিঙ্ক পাঠায়। ইনবক্স খুলুন এবং লিঙ্কে ক্লিক করুন। না পেলে /email/verify-তে গিয়ে পুনরায় পাঠানোর অনুরোধ করুন।",
                'keywords'    => ['verify email', 'email verification', 'resend verification', 'not received', 'spam'],
                'is_published'=> true,
                'sort_order'  => 40,
            ],
            [
                'category'    => 'Account',
                'title_en'    => 'How do I reset my password?',
                'title_bn'    => 'আমি কীভাবে আমার পাসওয়ার্ড রিসেট করব?',
                'content_en'  => "To reset your password:\n\n1. Go to the login page (/login).\n2. Click \"Forgot Password?\".\n3. Enter your registered email address.\n4. Check your inbox for a password reset link.\n5. Click the link and create a new password.\n\nThe reset link expires after 60 minutes for security. If you don't receive it, check your spam folder.",
                'content_bn'  => "পাসওয়ার্ড রিসেট করতে লগইন পেজে যান এবং \"পাসওয়ার্ড ভুলে গেছেন?\" ক্লিক করুন। আপনার ইমেইলে একটি রিসেট লিঙ্ক পাঠানো হবে।",
                'keywords'    => ['password', 'reset password', 'forgot password', 'lost password', 'change password'],
                'is_published'=> true,
                'sort_order'  => 41,
            ],

            // ---------------------------------------------------------------
            // Notifications
            // ---------------------------------------------------------------
            [
                'category'    => 'Notifications',
                'title_en'    => 'How do push notifications work?',
                'title_bn'    => 'পুশ নোটিফিকেশন কীভাবে কাজ করে?',
                'content_en'  => "RoktoLinkBD can send browser push notifications for emergency alerts — even when you don't have the website open.\n\nTo enable push notifications:\n1. Go to your Notification Preferences (/settings/notifications).\n2. Click \"Enable Notifications\" and allow the browser permission.\n\nYou control which types of notifications you receive:\n• Emergency blood alerts (for donors near a request)\n• Volunteer case alerts\n• Donation updates\n• Account messages\n\nYou can disable push notifications at any time from Settings.",
                'content_bn'  => "RoktoLinkBD জরুরি সতর্কতার জন্য ব্রাউজার পুশ নোটিফিকেশন পাঠাতে পারে। /settings/notifications-এ গিয়ে নোটিফিকেশন সক্ষম করুন।",
                'keywords'    => ['push notification', 'enable notifications', 'alerts', 'browser notification', 'emergency alert'],
                'is_published'=> true,
                'sort_order'  => 50,
            ],

            // ---------------------------------------------------------------
            // Safety
            // ---------------------------------------------------------------
            [
                'category'    => 'Safety',
                'title_en'    => 'Is RoktoLinkBD a blood bank?',
                'title_bn'    => 'RoktoLinkBD কি একটি ব্লাড ব্যাংক?',
                'content_en'  => "No. RoktoLinkBD is NOT a blood bank.\n\nWe do NOT:\n• Collect, store, test, or issue blood.\n• Make medical decisions about blood compatibility.\n• Guarantee donor medical eligibility.\n• Replace authorized blood transfusion services.\n\nRoktoLinkBD is an emergency coordination platform. We connect people who need blood with nearby donors who are willing to help. All actual blood collection and transfusion must happen at an authorized medical facility.",
                'content_bn'  => "না। RoktoLinkBD একটি ব্লাড ব্যাংক নয়। আমরা রক্ত সংগ্রহ, সংরক্ষণ বা প্রদান করি না। আমরা রক্তের প্রয়োজনে মানুষ এবং নিকটবর্তী দাতাদের মধ্যে সংযোগ স্থাপন করি।",
                'keywords'    => ['blood bank', 'medical', 'not a hospital', 'platform', 'coordination', 'transfusion'],
                'is_published'=> true,
                'sort_order'  => 60,
            ],
            [
                'category'    => 'Safety',
                'title_en'    => 'How does RoktoLinkBD prevent fake requests?',
                'title_bn'    => 'RoktoLinkBD কীভাবে ভুয়া অনুরোধ প্রতিরোধ করে?',
                'content_en'  => "RoktoLinkBD uses several measures to reduce fake or abusive requests:\n\n• Email verification is required before creating a request.\n• Duplicate request detection warns you if a similar active request exists.\n• Rate limiting prevents rapid repeated requests.\n• Community reporting — anyone can report suspicious activity.\n• Admin review — flagged requests and accounts are reviewed.\n• Verified volunteers can help confirm genuine emergencies.\n\nIf you see a suspicious request, please use the Report button.",
                'content_bn'  => "RoktoLinkBD ভুয়া অনুরোধ কমাতে ইমেইল যাচাই, ডুপ্লিকেট সনাক্তকরণ, রেট লিমিটিং এবং কমিউনিটি রিপোর্টিং ব্যবহার করে।",
                'keywords'    => ['fake request', 'abuse', 'scam', 'fraud', 'report', 'suspicious', 'duplicate'],
                'is_published'=> true,
                'sort_order'  => 61,
            ],

            // ---------------------------------------------------------------
            // Donation
            // ---------------------------------------------------------------
            [
                'category'    => 'Donation',
                'title_en'    => 'How is a donation confirmed on RoktoLinkBD?',
                'title_bn'    => 'RoktoLinkBD-এ একটি দান কীভাবে নিশ্চিত করা হয়?',
                'content_en'  => "A donation is confirmed through a mutual confirmation process:\n\n1. After the donor donates, either the donor or the requester marks it as complete on the platform.\n2. The other party confirms.\n3. Once both confirm (or a volunteer confirms on behalf), the donation is recorded as official.\n\nA digital certificate is then automatically generated for the donor — a permanent record of their contribution to saving a life. Donors can share or download their certificate.",
                'content_bn'  => "দান নিশ্চিত করতে দাতা ও অনুরোধকারী উভয়ই প্ল্যাটফর্মে নিশ্চিতকরণ করেন। সফল দানের পরে দাতার জন্য একটি ডিজিটাল সার্টিফিকেট তৈরি হয়।",
                'keywords'    => ['confirm donation', 'donation confirmed', 'certificate', 'digital certificate', 'mutual confirmation'],
                'is_published'=> true,
                'sort_order'  => 70,
            ],

            // ---------------------------------------------------------------
            // General
            // ---------------------------------------------------------------
            [
                'category'    => 'General',
                'title_en'    => 'What is RoktoLinkBD?',
                'title_bn'    => 'RoktoLinkBD কী?',
                'content_en'  => "RoktoLinkBD (রক্তলিংকবিডি) is a Bangladesh-wide emergency blood donation coordination platform.\n\nOur mission: Connect blood requesters with currently available donors — quickly, safely, and responsibly.\n\nKey features:\n• Emergency blood request creation\n• Geographic donor matching\n• Volunteer coordination\n• Real-time request tracking\n• Digital donation certificates\n• Privacy-first design\n• Bilingual (English & বাংলা)\n\nRoktoLinkBD is free to use and built to serve all of Bangladesh.",
                'content_bn'  => "RoktoLinkBD বাংলাদেশ জুড়ে জরুরি রক্তদান সমন্বয়ের একটি প্ল্যাটফর্ম। আমাদের লক্ষ্য: রক্তের প্রয়োজনে দ্রুত, নিরাপদ ও দায়িত্বশীলভাবে দাতা খুঁজে দেওয়া।",
                'keywords'    => ['what is roktolink', 'about', 'platform', 'mission', 'bangladesh', 'blood donation'],
                'is_published'=> true,
                'sort_order'  => 1,
            ],
        ];

        foreach ($articles as $article) {
            KnowledgeArticle::firstOrCreate(
                ['title_en' => $article['title_en']],
                $article
            );
        }

        $this->command->info('✅ Knowledge Base seeded with ' . count($articles) . ' articles.');
    }
}
