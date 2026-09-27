<?php

return [
    /*
    |--------------------------------------------------------------------------
    | RoktoBot AI Provider
    |--------------------------------------------------------------------------
    | Supported: 'ollama', 'openai', or null (KB-only mode)
    |
    | When null, RoktoBot uses the Knowledge Base only — no API key needed.
    */
    'ai_provider' => env('AI_PROVIDER', null),

    /*
    |--------------------------------------------------------------------------
    | Ollama (local / self-hosted)
    |--------------------------------------------------------------------------
    */
    'ollama_base_url' => env('OLLAMA_BASE_URL', 'http://localhost:11434'),
    'ollama_model' => env('OLLAMA_MODEL', 'llama3.2'),

    /*
    |--------------------------------------------------------------------------
    | OpenAI-compatible endpoint
    |--------------------------------------------------------------------------
    */
    'openai_api_key' => env('OPENAI_API_KEY'),
    'openai_base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
    'openai_model' => env('OPENAI_MODEL', 'gpt-4o-mini'),

    /*
    |--------------------------------------------------------------------------
    | Google Gemini API
    |--------------------------------------------------------------------------
    |
    | Create a key in Google AI Studio and set AI_PROVIDER=gemini plus
    | GEMINI_API_KEY in .env. The service keeps the rule-based safety and
    | knowledge-base layers ahead of this provider.
    |
    */
    'gemini_api_key' => env('GEMINI_API_KEY'),
    'gemini_model' => env('GEMINI_MODEL', 'gemini-3.8-flash'),

    // Keep this long enough for a first Gemini response, while preserving a bounded fallback.
    'llm_timeout' => (int) env('LLM_TIMEOUT', 15),

    /*
    |--------------------------------------------------------------------------
    | Conversation logging
    |--------------------------------------------------------------------------
    | Set to true to persist bot_chat_logs for support/quality review.
    | Off by default for user privacy.
    */
    'log_conversations' => env('ROKTOBOT_LOG_CONVERSATIONS', false),

    /*
    |--------------------------------------------------------------------------
    | Rate limiting
    |--------------------------------------------------------------------------
    | Max messages per user/IP per minute.
    */
    'rate_limit_per_minute' => env('ROKTOBOT_RATE_LIMIT', 20),
];
