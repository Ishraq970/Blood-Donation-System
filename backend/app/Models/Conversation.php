<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'blood_request_id',
        'title',
        'is_locked',
        'last_message_at',
    ];

    protected $casts = [
        'is_locked' => 'boolean',
        'last_message_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Conversation $conv) {
            if (empty($conv->uuid)) {
                $conv->uuid = (string) Str::uuid();
            }
        });
    }

    public function bloodRequest(): BelongsTo
    {
        return $this->belongsTo(BloodRequest::class);
    }

    public function participants(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'conversation_participants')
            ->withPivot('role_in_request', 'last_read_at')
            ->withTimestamps();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->orderBy('created_at', 'asc');
    }

    public function isParticipant(User $user): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $this->participants()->where('user_id', $user->id)->exists();
    }

    public function canUserMessage(User $user): bool
    {
        if ($this->is_locked) {
            return false;
        }

        return $this->isParticipant($user);
    }
}
