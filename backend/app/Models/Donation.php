<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Donation extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'blood_request_id',
        'donor_profile_id',
        'certificate_code',
        'donated_at',
        'component',
        'units',
        'facility_name',
        'donor_confirmed',
        'requester_confirmed',
        'volunteer_verified',
        'status',
        'gratitude_note',
        'is_public_wall',
    ];

    protected $casts = [
        'donated_at' => 'datetime',
        'donor_confirmed' => 'boolean',
        'requester_confirmed' => 'boolean',
        'volunteer_verified' => 'boolean',
        'is_public_wall' => 'boolean',
        'units' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (Donation $donation) {
            if (empty($donation->uuid)) {
                $donation->uuid = (string) Str::uuid();
            }
            if (empty($donation->certificate_code)) {
                $donation->certificate_code = 'CERT-26-' . strtoupper(Str::random(6));
            }
        });
    }

    public function bloodRequest(): BelongsTo
    {
        return $this->belongsTo(BloodRequest::class);
    }

    public function donorProfile(): BelongsTo
    {
        return $this->belongsTo(DonorProfile::class);
    }

    public function isConfirmed(): bool
    {
        return $this->status === 'CONFIRMED';
    }

    /**
     * Generate an SHA256 digital verification hash for certificate integrity.
     */
    public function getVerificationHashAttribute(): string
    {
        $donorCode = $this->donorProfile ? $this->donorProfile->public_donor_code : 'DONOR';
        $timestamp = $this->donated_at ? $this->donated_at->toIso8601String() : 'N/A';

        return strtoupper(substr(hash('sha256', "{$this->certificate_code}|{$timestamp}|{$donorCode}|{$this->facility_name}"), 0, 16));
    }

    /* ---------------------------------------------------------
       Query Scopes
    --------------------------------------------------------- */

    public function scopeConfirmed(Builder $query): Builder
    {
        return $query->where('status', 'CONFIRMED');
    }

    public function scopePublicWall(Builder $query): Builder
    {
        return $query->where('status', 'CONFIRMED')->where('is_public_wall', true);
    }
}
