<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserAiPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'language',
        'preferred_area',
        'communication_style',
        'emergency_mode_enabled',
    ];

    protected $casts = [
        'emergency_mode_enabled' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
