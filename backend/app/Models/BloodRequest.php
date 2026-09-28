<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class BloodRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'request_code',
        'requester_id',
        'component',
        'blood_group',
        'units_required',
        'units_committed',
        'units_completed',
        'urgency',
        'required_at',
        'facility_name',
        'facility_id',
        'location_id',
        'latitude',
        'longitude',
        'landmark',
        'address_text',
        'requester_phone',
        'requester_relation',
        'verification_status',
        'status',
        'primary_volunteer_id',
        'public_note',
        'closed_at',
        'cancelled_at',
    ];

    protected $casts = [
        'required_at' => 'datetime',
        'closed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'latitude' => 'float',
        'longitude' => 'float',
        'units_required' => 'integer',
        'units_committed' => 'integer',
        'units_completed' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (BloodRequest $request) {
            if (empty($request->uuid)) {
                $request->uuid = (string) Str::uuid();
            }
            if (empty($request->request_code)) {
                $request->request_code = 'RLB-26-' . strtoupper(Str::random(6));
            }
        });
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'location_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(RequestEvent::class)->orderBy('id');
    }

    public function matches(): HasMany
    {
        return $this->hasMany(RequestMatch::class);
    }

    public function conversation(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Conversation::class);
    }

    public function donations(): HasMany
    {
        return $this->hasMany(Donation::class);
    }

    public function isActive(): bool
    {
        return !in_array($this->status, ['FULFILLED', 'CANCELLED', 'EXPIRED']);
    }

    public function isFulfilled(): bool
    {
        return $this->status === 'FULFILLED';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'CANCELLED';
    }

    /* ---------------------------------------------------------
       Query Scopes
    --------------------------------------------------------- */

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNotIn('status', ['FULFILLED', 'CANCELLED', 'EXPIRED']);
    }

    public function scopeOfBloodGroup(Builder $query, string $bloodGroup): Builder
    {
        return $query->where('blood_group', $bloodGroup);
    }

    public function scopeEmergency(Builder $query): Builder
    {
        return $query->where('urgency', 'EMERGENCY_NOW');
    }
}
