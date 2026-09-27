<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class VolunteerProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'volunteer_code',
        'organization_affiliation',
        'assigned_location_id',
        'emergency_contact_phone',
        'verification_status',
        'verified_by_admin_id',
        'verified_at',
        'rejection_reason',
        'active_cases_count',
        'completed_cases_count',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
        'active_cases_count' => 'integer',
        'completed_cases_count' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (VolunteerProfile $profile) {
            if (empty($profile->volunteer_code)) {
                $profile->volunteer_code = 'VOL-26-' . strtoupper(Str::random(6));
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignedLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'assigned_location_id');
    }

    public function verifiedByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by_admin_id');
    }

    public function verification(): HasOne
    {
        return $this->hasOne(VolunteerVerification::class);
    }

    public function isApproved(): bool
    {
        return $this->verification_status === 'APPROVED';
    }

    public function isPending(): bool
    {
        return $this->verification_status === 'PENDING';
    }

    /* ---------------------------------------------------------
       Query Scopes
    --------------------------------------------------------- */

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('verification_status', 'APPROVED');
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('verification_status', 'PENDING');
    }

    public function scopeRejected(Builder $query): Builder
    {
        return $query->where('verification_status', 'REJECTED');
    }
}
