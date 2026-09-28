<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RequestMatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'blood_request_id',
        'donor_profile_id',
        'distance_km',
        'match_score',
        'match_reason',
        'notification_status',
        'response_status',
        'notified_at',
        'responded_at',
        'accepted_at',
        'cancelled_at',
    ];

    protected $casts = [
        'distance_km' => 'decimal:2',
        'match_score' => 'integer',
        'match_reason' => 'array',
        'notified_at' => 'datetime',
        'responded_at' => 'datetime',
        'accepted_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function bloodRequest(): BelongsTo
    {
        return $this->belongsTo(BloodRequest::class);
    }

    public function donorProfile(): BelongsTo
    {
        return $this->belongsTo(DonorProfile::class);
    }

    /* ---------------------------------------------------------
       Query Scopes
    --------------------------------------------------------- */

    public function scopePending(Builder $query): Builder
    {
        return $query->where('response_status', 'PENDING');
    }

    public function scopeAccepted(Builder $query): Builder
    {
        return $query->where('response_status', 'ACCEPTED');
    }

    public function scopeDeclined(Builder $query): Builder
    {
        return $query->where('response_status', 'DECLINED');
    }
}
