<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BotChatLog extends Model
{
    protected $fillable = [
        'user_id',
        'session_id',
        'role',
        'content',
        'source',
        'matched_article_slug',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
