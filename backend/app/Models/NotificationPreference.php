<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'channel_in_app',
        'channel_push',
        'channel_email',
        'channel_sms',
        'emergency_alerts',
        'chat_messages',
        'status_updates',
    ];

    protected $casts = [
        'channel_in_app' => 'boolean',
        'channel_push' => 'boolean',
        'channel_email' => 'boolean',
        'channel_sms' => 'boolean',
        'emergency_alerts' => 'boolean',
        'chat_messages' => 'boolean',
        'status_updates' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
