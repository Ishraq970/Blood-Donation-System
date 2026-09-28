<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class DonorProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'public_donor_code',
        'blood_group',
        'blood_group_verification_status',
        'location_id',
        'latitude',
        'longitude',
        'landmark',
        'division',
        'district',
        'upazila',
        'preferred_radius_km',
        'last_donation_at',
        'last_donation_source',
        'profile_status',
        'emergency_alerts_enabled',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'preferred_radius_km' => 'integer',
        'emergency_alerts_enabled' => 'boolean',
        'last_donation_at' => 'date',
    ];

    protected static function booted(): void
    {
        static::creating(function (DonorProfile $profile) {
            if (empty($profile->public_donor_code)) {
                $profile->public_donor_code = 'DNR-26-' . strtoupper(Str::random(6));
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function availabilities(): HasMany
    {
        return $this->hasMany(DonorAvailability::class)->orderByDesc('id');
    }

    public function latestAvailability(): HasOne
    {
        return $this->hasOne(DonorAvailability::class)->ofMany('id', 'max');
    }

    public function matches(): HasMany
    {
        return $this->hasMany(RequestMatch::class);
    }

    public function donations(): HasMany
    {
        return $this->hasMany(Donation::class);
    }

    /**
     * Check if donor is currently available to donate blood.
     */
    public function isAvailableNow(): bool
    {
        if ($this->profile_status !== 'ACTIVE') {
            return false;
        }

        $latest = $this->availabilities()->first();
        if (!$latest) {
            return false;
        }

        if ($latest->status !== 'AVAILABLE_NOW') {
            return false;
        }

        if ($latest->available_until && $latest->available_until->isPast()) {
            return false;
        }

        return true;
    }

    /* ---------------------------------------------------------
       Query Scopes
    --------------------------------------------------------- */

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('profile_status', 'ACTIVE');
    }

    public function scopeOfBloodGroup(Builder $query, string $bloodGroup): Builder
    {
        return $query->where('blood_group', $bloodGroup);
    }

    public function scopeAvailableNow(Builder $query): Builder
    {
        return $query->active()->whereHas('latestAvailability', function ($q) {
            $q->where('status', 'AVAILABLE_NOW')
              ->where(function ($sub) {
                  $sub->whereNull('available_until')
                      ->orWhere('available_until', '>', now());
              });
        });
    }
}
