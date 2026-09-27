<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DonorAvailability extends Model
{
    use HasFactory;

    protected $fillable = [
        'donor_profile_id',
        'status',
        'available_from',
        'available_until',
        'latitude',
        'longitude',
        'radius_km',
        'notes',
    ];

    protected $casts = [
        'available_from' => 'datetime',
        'available_until' => 'datetime',
        'latitude' => 'float',
        'longitude' => 'float',
        'radius_km' => 'integer',
    ];

    public function donorProfile(): BelongsTo
    {
        return $this->belongsTo(DonorProfile::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'AVAILABLE_NOW')
            ->where(function ($sub) {
                $sub->whereNull('available_until')
                    ->orWhere('available_until', '>', now());
            });
    }
}
