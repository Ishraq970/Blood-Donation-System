<?php

namespace App\Services;

use App\Models\KnowledgeArticle;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * LlmIntentResolverService
 *
 * Provides natural-language understanding for RoktoBot.
 * Analyzes user queries regardless of wording variations, typos, or synonyms,
 * determines relevance to the blood donation platform, and maps the user's intent
 * to the most relevant existing SQL KnowledgeArticle ID.
 *
 * STRICT SAFETY RULES:
 *  - This service is 100% READ-ONLY with respect to the SQL database.
 *  - It receives question titles & keywords and returns a matched article ID.
 *  - It NEVER generates, executes, or modifies SQL queries.
 *  - The SQL database remains the absolute source of truth for factual answers.
 */
class LlmIntentResolverService
{
    /**
     * Resolve a user's natural query against existing published SQL questions.
     *
     * @param string $query
     * @param Collection<int, KnowledgeArticle> $publishedArticles
     * @return array{status: string, article_id: ?int, confidence: int, source: string, reason?: string}
     */
    public function resolve(string $query, Collection $publishedArticles): array
    {
        $trimmed = trim($query);
        if ($trimmed === '' || $publishedArticles->isEmpty()) {
            return [
                'status'     => 'NO_MATCH',
                'article_id' => null,
                'confidence' => 0,
                'source'     => 'EMPTY',
                'reason'     => 'Query or knowledge base is empty',
            ];
        }

        // 1. Try configured external LLM provider first if API key is present
        $llmResult = $this->tryLlmProvider($trimmed, $publishedArticles);
        if ($llmResult !== null) {
            return $llmResult;
        }

        // 2. Intelligent local NLP & semantic matcher (robust zero-config / offline fallback)
        return $this->localSemanticResolve($trimmed, $publishedArticles);
    }

    /**
     * Try external LLM provider (OpenAI, Gemini, Groq, or Ollama) if configured.
     */
    private function tryLlmProvider(string $query, Collection $publishedArticles): ?array
    {
        // Keep automated tests deterministic and prevent them from consuming external API quota.
        if (app()->environment('testing')) {
            return null;
        }

        $openaiKey = config('roktobot.openai_api_key');
        $geminiKey = config('roktobot.gemini_api_key');
        $provider  = config('roktobot.ai_provider');

        // Check if any LLM provider is explicitly enabled or keys exist
        $hasProvider = $provider !== null || !empty($openaiKey) || !empty($geminiKey);
        if (!$hasProvider) {
            return null;
        }

        // Prepare compact catalog of existing SQL questions
        $articlesCatalog = $publishedArticles->map(function ($article) {
            return [
                'id'       => $article->id,
                'category' => $article->category,
                'title_en' => $article->title_en,
                'title_bn' => $article->title_bn,
                'keywords' => $article->keywords ?? [],
            ];
        })->values()->toArray();

        $systemPrompt = <<<PROMPT
You are the natural language intent resolver for RoktoLinkBD, a blood donation emergency coordination platform in Bangladesh.

Your role: Analyze the user's question and perform TWO steps:

STEP 1: RELEVANCE CHECK
Determine if the query is relevant to RoktoLinkBD, blood donation, blood requests, donors, patients, volunteers, blood types, emergency hospital coordination, or using this website.
- If the query is IRRELEVANT (e.g., general trivia, programming/coding, mathematics, cooking/recipes, weather, sports, movies, politics, homework, general chit-chat unrelated to blood donation):
  Respond with JSON: {"status": "IRRELEVANT", "reason": "Query is not related to blood donation or the RoktoLinkBD platform"}

STEP 2: INTENT & SEMANTIC MATCHING
If the query IS relevant, determine which existing SQL question from the list below the user is asking about.
Users will use different wording, synonyms, phrasing, or languages.
For example:
- "Where can I find someone who can donate blood?" or "I need a blood donor, what should I do?" or "How do I get a donor?" -> matches question about creating a blood request or donor search.
- "What does RoktoLinkBD do?" or "Can you explain what this website is for?" or "What is the purpose of RoktoLinkBD?" -> matches "What is RoktoLinkBD?".
- "Will anyone see my phone number?" -> matches "Will my personal information be shown publicly?".

AVAILABLE SQL QUESTIONS:
PROMPT;

        $systemPrompt .= "\n" . json_encode($articlesCatalog, JSON_UNESCAPED_UNICODE) . "\n\n";
        $systemPrompt .= <<<RULES
RESPONSE INSTRUCTIONS:
- If a question matches: {"status": "MATCH", "article_id": <int id>, "confidence": <int 70-100>, "reason": "..."}
- If query is relevant to blood donation but none of the listed SQL questions cover it: {"status": "NO_MATCH", "reason": "No matching question found in database"}
- Respond with RAW JSON ONLY. No markdown fences, no extra text.
RULES;

        try {
            // Attempt Gemini API if configured
            if (!empty($geminiKey)) {
                $response = $this->callGemini($systemPrompt, $query, $geminiKey);
                if ($response !== null) {
                    return $this->validateAndFormatLlmResult($response, $publishedArticles, 'LLM_GEMINI');
                }
            }

            // Attempt OpenAI / OpenAI-compatible endpoint
            if (!empty($openaiKey)) {
                $response = $this->callOpenAi($systemPrompt, $query, $openaiKey);
                if ($response !== null) {
                    return $this->validateAndFormatLlmResult($response, $publishedArticles, 'LLM_OPENAI');
                }
            }

            // Attempt Ollama if configured
            if ($provider === 'ollama') {
                $response = $this->callOllama($systemPrompt, $query);
                if ($response !== null) {
                    return $this->validateAndFormatLlmResult($response, $publishedArticles, 'LLM_OLLAMA');
                }
            }
        } catch (\Throwable $e) {
            Log::warning('LLM resolver failed, falling back to local NLP: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Call Google Gemini API
     */
    private function callGemini(string $systemPrompt, string $userQuery, string $apiKey): ?array
    {
        $model = config('roktobot.gemini_model', 'gemini-1.5-flash');
        $url   = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent";

        $res = Http::timeout(config('roktobot.llm_timeout', 15))
            ->withHeaders(['x-goog-api-key' => $apiKey])
            ->post($url, [
            'contents' => [
                [
                    'role'  => 'user',
                    'parts' => [
                        ['text' => $systemPrompt . "\n\nUser Question:\n" . $userQuery],
                    ],
                ],
            ],
            'generationConfig' => [
                'temperature'       => 0.1,
                'responseMimeType'  => 'application/json',
            ],
        ]);

        if (!$res->successful()) {
            return null;
        }

        $text = $res->json('candidates.0.content.parts.0.text');
        return $this->parseJsonSafe($text);
    }

    /**
     * Call OpenAI / OpenAI-compatible API
     */
    private function callOpenAi(string $systemPrompt, string $userQuery, string $apiKey): ?array
    {
        $baseUrl = rtrim(config('roktobot.openai_base_url', 'https://api.openai.com/v1'), '/');
        $model   = config('roktobot.openai_model', 'gpt-4o-mini');

        $res = Http::timeout(config('roktobot.llm_timeout', 15))
            ->withHeaders([
                'Authorization' => "Bearer {$apiKey}",
                'Content-Type'  => 'application/json',
            ])
            ->post("{$baseUrl}/chat/completions", [
                'model'       => $model,
                'temperature' => 0.1,
                'messages'    => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userQuery],
                ],
                'response_format' => ['type' => 'json_object'],
            ]);

        if (!$res->successful()) {
            return null;
        }

        $content = $res->json('choices.0.message.content');
        return $this->parseJsonSafe($content);
    }

    /**
     * Call Ollama local endpoint
     */
    private function callOllama(string $systemPrompt, string $userQuery): ?array
    {
        $baseUrl = rtrim(config('roktobot.ollama_base_url', 'http://localhost:11434'), '/');
        $model   = config('roktobot.ollama_model', 'llama3.2');

        $res = Http::timeout(config('roktobot.llm_timeout', 15))->post("{$baseUrl}/api/chat", [
            'model'    => $model,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userQuery],
            ],
            'format'   => 'json',
            'stream'   => false,
        ]);

        if (!$res->successful()) {
            return null;
        }

        $content = $res->json('message.content');
        return $this->parseJsonSafe($content);
    }

    /**
     * Parse JSON string safely, removing markdown wrappers if present.
     */
    private function parseJsonSafe(?string $raw): ?array
    {
        if (!$raw) {
            return null;
        }

        $clean = trim($raw);
        if (str_starts_with($clean, '```json')) {
            $clean = substr($clean, 7);
        }
        if (str_starts_with($clean, '```')) {
            $clean = substr($clean, 3);
        }
        if (str_ends_with($clean, '```')) {
            $clean = substr($clean, 0, -3);
        }
        $clean = trim($clean);

        $decoded = json_decode($clean, true);
        return is_array($decoded) ? $decoded : null;
    }

    /**
     * Validate and format the LLM result.
     */
    private function validateAndFormatLlmResult(array $data, Collection $publishedArticles, string $source): ?array
    {
        $status = strtoupper((string) ($data['status'] ?? ''));

        if ($status === 'IRRELEVANT') {
            return [
                'status'     => 'IRRELEVANT',
                'article_id' => null,
                'confidence' => 95,
                'source'     => $source,
                'reason'     => $data['reason'] ?? 'Off-topic query',
            ];
        }

        if ($status === 'MATCH' && !empty($data['article_id'])) {
            $id = (int) $data['article_id'];
            $exists = $publishedArticles->firstWhere('id', $id);
            if ($exists) {
                return [
                    'status'     => 'MATCH',
                    'article_id' => $id,
                    'confidence' => (int) ($data['confidence'] ?? 90),
                    'source'     => $source,
                    'reason'     => $data['reason'] ?? 'Matched by LLM intent understanding',
                ];
            }
        }

        if ($status === 'NO_MATCH') {
            return [
                'status'     => 'NO_MATCH',
                'article_id' => null,
                'confidence' => 50,
                'source'     => $source,
                'reason'     => $data['reason'] ?? 'No existing question covers this topic',
            ];
        }

        return null;
    }

    /**
     * Local NLP & Semantic Intent Resolver.
     * Performs relevance detection and semantic intent classification
     * using synonym clusters, intent mapping, and token similarity.
     */
    public function localSemanticResolve(string $query, Collection $publishedArticles): array
    {
        $lower = mb_strtolower(trim($query));

        // 1. Off-topic / Irrelevance Detection
        if ($this->isClearlyIrrelevant($lower)) {
            return [
                'status'     => 'IRRELEVANT',
                'article_id' => null,
                'confidence' => 95,
                'source'     => 'NLP_FILTER',
                'reason'     => 'Query does not pertain to blood donation or RoktoLinkBD',
            ];
        }

        // 2. High-Level Semantic Intent Patterns
        $intentArticleId = $this->matchSemanticIntentPatterns($lower, $publishedArticles);
        if ($intentArticleId !== null) {
            return [
                'status'     => 'MATCH',
                'article_id' => $intentArticleId,
                'confidence' => 92,
                'source'     => 'NLP_SEMANTIC',
                'reason'     => 'Semantic intent pattern matched',
            ];
        }

        // 3. Token & Keyword Similarity Matching
        $bestMatch = null;
        $highestScore = 0;

        foreach ($publishedArticles as $article) {
            $score = $this->calculateSemanticSimilarity($lower, $article);
            if ($score > $highestScore) {
                $highestScore = $score;
                $bestMatch    = $article;
            }
        }

        if ($bestMatch && $highestScore >= 18) {
            return [
                'status'     => 'MATCH',
                'article_id' => $bestMatch->id,
                'confidence' => min(95, max(75, (int) round($highestScore * 1.6))),
                'source'     => 'NLP_SIMILARITY',
                'reason'     => "Similarity score {$highestScore}",
            ];
        }

        return [
            'status'     => 'NO_MATCH',
            'article_id' => null,
            'confidence' => 45,
            'source'     => 'NLP_FALLBACK',
            'reason'     => 'No existing SQL question sufficiently matches this query',
        ];
    }

    /**
     * Check if a query is clearly irrelevant to the blood donation platform.
     */
    private function isClearlyIrrelevant(string $lower): bool
    {
        // Platform domain keywords (if present, query is likely relevant)
        $domainKeywords = [
            'blood', 'donor', 'donate', 'donation', 'request', 'recipient', 'roktolink',
            'volunteer', 'hospital', 'patient', 'abo', 'transfusion', 'certificate',
            'account', 'password', 'login', 'register', 'email', 'verify', 'cancel',
            'status', 'availability', 'notification', 'fake', 'safe', 'urgent', 'emergency',
            'রক্ত', 'রক্তদান', 'দাতা', 'রোগী', 'হাসপাতাল', 'অনুরোধ', 'স্বেচ্ছাসেবক',
            'পাসওয়ার্ড', 'লগইন', 'যাচাই', 'সার্টিফিকেট', 'গ্রুপ', 'জরুরি',
        ];

        foreach ($domainKeywords as $dk) {
            if (str_contains($lower, $dk)) {
                return false;
            }
        }

        // Off-topic trigger terms (if no domain keywords and contains these, it's irrelevant)
        $offTopicTriggers = [
            'python', 'javascript', 'java', 'c++', 'html', 'css', 'coding', 'code', 'function',
            'weather', 'forecast', 'rain today', 'temperature',
            'recipe', 'cook', 'pizza', 'burger', 'biryani', 'pasta', 'baking',
            'football', 'cricket', 'messi', 'ronaldo', 'world cup', 'ipl', 'bpl',
            'movie', 'song', 'actor', 'actress', 'cinema', 'game', 'gaming', 'minecraft',
            'capital of', 'president of', 'prime minister', 'election', 'politics',
            'math', 'algebra', 'solve equation', 'homework', 'essay',
            'joke', 'riddle', 'poem', 'story about',
            // Bengali off-topic indicators
            'আবহাওয়া', 'রান্না', 'রেসিপি', 'খেলা', 'ক্রিকেট', 'ফুটবল', 'সিনেমা', 'গান',
            'রাজনীতি', 'গণিত', 'ক্যালকুলাস', 'কোডিং', 'প্রোগ্রামিং', 'পাইথন', 'রাজধানী',
            'প্রধানমন্ত্রী', 'রাষ্ট্রপতি', 'কৌতুক', 'কবিতা',
        ];

        foreach ($offTopicTriggers as $trigger) {
            if (str_contains($lower, $trigger)) {
                return true;
            }
        }

        // Queries that start with off-topic question patterns and lack domain terms
        $offTopicPrefixes = [
            'who is the president', 'who is the prime minister', 'what is the capital of',
            'how to cook', 'how to make a cake', 'tell me a joke', 'write a poem',
            'write a python', 'write a script', 'what is 2 + 2',
        ];

        foreach ($offTopicPrefixes as $prefix) {
            if (str_starts_with($lower, $prefix)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Match natural language variations to the canonical SQL questions.
     */
    private function matchSemanticIntentPatterns(string $lower, Collection $publishedArticles): ?int
    {
        // Map target question titles to patterns
        $intentMap = [
            // "What is RoktoLinkBD?"
            'What is RoktoLinkBD?' => [
                'what is roktolink', 'what does roktolink do', 'what is this website', 'about this website',
                'explain what this website is for', 'what is the purpose of roktolink', 'tell me about roktolink',
                'what is the mission of roktolink', 'roktolink ki', 'রক্তলিংক কি', 'এই ওয়েবসাইট কি কাজে',
                'এই ওয়েবসাইটের উদ্দেশ্য কি', 'এই ওয়েবসাইটের উদ্দেশ্য কী', 'উদ্দেশ্য কি', 'উদ্দেশ্য কী',
                'রক্তলিংকবিডি কী', 'রক্তলিংকবিডি কি', 'about the platform',
            ],

            // "How do I create a blood request?"
            'How do I create a blood request?' => [
                'where can i find someone who can donate blood', 'i need a blood donor, what should i do',
                'how do i get a donor', 'can you help me find a blood donor', 'how can i find a blood donor',
                'how to find blood', 'need blood urgent', 'how to post request', 'where to ask for blood',
                'how do i request blood', 'how can i request blood', 'make a blood request',
                'রক্ত দরকার কি করব', 'কীভাবে রক্ত পাব', 'রক্তের জন্য আবেদন', 'রক্তের অনুরোধ করার নিয়ম',
                'রক্ত পেতে কি করতে হবে', 'রক্ত পেতে কী করতে হবে', 'রক্ত পেতে কী করব', 'রক্ত পাওয়ার উপায়',
                'দাতা কোথায় পাব', 'রক্ত চাই কি করতে হবে', 'রক্তের প্রয়োজন',
            ],

            // "How do I become a blood donor on RoktoLinkBD?"
            'How do I become a blood donor on RoktoLinkBD?' => [
                'how can i register as a donor', 'how do i become a donor', 'i want to donate blood',
                'how to give blood on roktolink', 'sign up as donor', 'join as donor', 'donor registration',
                'রক্তদাতা হতে চাই', 'রক্ত দিতে চাই', 'রক্ত দান করতে চাই', 'রক্তদাতা হওয়ার নিয়ম', 'কীভাবে রক্ত দেব',
                'রক্ত দিতে হলে কি করতে হবে', 'রক্তদাতা হতে কি লাগবে',
            ],

            // "Will my personal information be shown publicly?"
            'Will my personal information be shown publicly?' => [
                'will anyone see my phone number', 'is my number public', 'privacy of donor',
                'who can see my contact', 'is my data safe', 'is my phone number hidden',
                'আমার ফোন নম্বর কি সবাই দেখবে', 'ব্যক্তিগত তথ্য কি গোপন',
            ],

            // "How do I cancel my blood request?"
            'How do I cancel my blood request?' => [
                'how do i cancel my request', 'cancel blood request', 'delete blood request',
                'withdraw request', 'stop blood request', 'অনুরোধ বাতিল করব কীভাবে',
            ],

            // "What do the blood request statuses mean?"
            'What do the blood request statuses mean?' => [
                'what do request statuses mean', 'what does searching mean', 'request stages',
                'meaning of fulfilled', 'donor arrived status', 'স্ট্যাটাসগুলোর অর্থ কি',
            ],

            // "How does donor availability work?"
            'How does donor availability work?' => [
                'donor availability', 'available now toggle', 'how to turn off alerts',
                'how to stop receiving requests', 'do not disturb donor', 'উপলব্ধতা কীভাবে কাজ করে',
            ],

            // "How do I become a volunteer on RoktoLinkBD?"
            'How do I become a volunteer on RoktoLinkBD?' => [
                'how to become volunteer', 'join volunteer team', 'volunteer application',
                'want to volunteer', 'ভলান্টিয়ার হতে চাই', 'স্বেচ্ছাসেবী আবেদন',
            ],

            // "What is the volunteer verification process?"
            'What is the volunteer verification process?' => [
                'volunteer verification', 'how long volunteer approval takes', 'volunteer nid review',
                'volunteer review process', 'স্বেচ্ছাসেবী যাচাই প্রক্রিয়া',
            ],

            // "How do I verify my email address?"
            'How do I verify my email address?' => [
                'verify email', 'didn\'t get verification email', 'resend verification link',
                'email confirmation', 'ইমেইল যাচাই করব কীভাবে',
            ],

            // "How do I reset my password?"
            'How do I reset my password?' => [
                'forgot password', 'reset password', 'change my password', 'lost my password',
                'পাসওয়ার্ড ভুলে গেছি', 'পাসওয়ার্ড রিসেট',
            ],

            // "How do push notifications work?"
            'How do push notifications work?' => [
                'push notifications', 'enable browser notifications', 'how alerts work',
                'পুশ নোটিফিকেশন কীভাবে কাজ করে',
            ],

            // "Is RoktoLinkBD a blood bank?"
            'Is RoktoLinkBD a blood bank?' => [
                'is roktolink a blood bank', 'are you a blood bank', 'do you store blood',
                'do you test blood', 'রক্তলিংক কি ব্লাড ব্যাংক',
            ],

            // "How does RoktoLinkBD prevent fake requests?"
            'How does RoktoLinkBD prevent fake requests?' => [
                'prevent fake requests', 'stop scams', 'avoid fraud requests', 'fake blood request',
                'ভুয়া অনুরোধ প্রতিরোধ',
            ],

            // "How is a donation confirmed on RoktoLinkBD?"
            'How is a donation confirmed on RoktoLinkBD?' => [
                'donation confirmed', 'how to get digital certificate', 'donation certificate',
                'দান কীভাবে নিশ্চিত করা হয়', 'সার্টিফিকেট কীভাবে পাব',
            ],
        ];

        foreach ($intentMap as $canonicalTitle => $phrases) {
            foreach ($phrases as $phrase) {
                if (str_contains($lower, $phrase)) {
                    $article = $publishedArticles->firstWhere('title_en', $canonicalTitle);
                    if ($article) {
                        return $article->id;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Compute semantic token overlap & similarity between query and an article.
     */
    private function calculateSemanticSimilarity(string $lowerQuery, KnowledgeArticle $article): int
    {
        $score = 0;
        $titleLower = mb_strtolower($article->title_en ?? '');
        $titleBnLower = mb_strtolower($article->title_bn ?? '');

        // Direct containment in title
        if (str_contains($titleLower, $lowerQuery) || str_contains($lowerQuery, $titleLower)) {
            $score += 35;
        }
        if ($titleBnLower && (str_contains($titleBnLower, $lowerQuery) || str_contains($lowerQuery, $titleBnLower))) {
            $score += 35;
        }

        // Keywords matching
        $keywords = $article->keywords ?? [];
        foreach ($keywords as $kw) {
            $kwLower = mb_strtolower($kw);
            if (str_contains($lowerQuery, $kwLower)) {
                $score += 15;
            }
        }

        // Word overlap
        $queryWords = array_filter(preg_split('/[\s\p{P}]+/u', $lowerQuery), fn($w) => mb_strlen($w) >= 3);
        $haystackWords = array_filter(preg_split('/[\s\p{P}]+/u', "{$titleLower} {$titleBnLower} " . implode(' ', $keywords)), fn($w) => mb_strlen($w) >= 3);

        $matchedWords = array_intersect($queryWords, $haystackWords);
        $score += count($matchedWords) * 6;

        return min(100, $score);
    }
}
